import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type {
  ImageItem,
  ConversionOptions,
  BatchStats,
} from '../types';
import { validateImageFile } from '../lib/fileValidation';
import { extractImageMetadata, convertImage } from '../lib/convertImage';
import { extractPagesFromPdf, createDocxFromImages, createMultiPagePdf } from '../lib/documentGenerators';

const DEFAULT_OPTIONS: ConversionOptions = {
  targetFormat: 'image/webp',
  quality: 0.85,
  customDimensions: false,
  maintainAspectRatio: true,
  backgroundColor: '#FFFFFF',
  pdfPageSize: 'fit',
  pdfOrientation: 'auto',
};

export function useImageConverter() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [globalOptions, setGlobalOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Keep a ref to all created object URLs to ensure complete cleanup on unmount
  const activeUrlsRef = useRef<Set<string>>(new Set());

  const registerUrl = useCallback((url: string) => {
    if (url && url.startsWith('blob:')) {
      activeUrlsRef.current.add(url);
    }
  }, []);

  const revokeUrl = useCallback((url?: string) => {
    if (url && url.startsWith('blob:') && activeUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      activeUrlsRef.current.delete(url);
    }
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    const urls = activeUrlsRef.current;
    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      urls.clear();
    };
  }, []);

  // Conversion worker for a single item
  const processItemConversion = useCallback(
    async (item: ImageItem, customOpt?: ConversionOptions): Promise<ImageItem> => {
      const optionsToUse = customOpt || item.options;

      // Revoke prior converted result url if existing
      if (item.result?.url) {
        revokeUrl(item.result.url);
      }

      try {
        const result = await convertImage(item.file, optionsToUse, {
          name: item.metadata.name,
          width: item.metadata.width,
          height: item.metadata.height,
        });

        registerUrl(result.url);

        return {
          ...item,
          options: optionsToUse,
          status: 'completed',
          progress: 100,
          result,
          error: undefined,
        };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Conversion failed';
        return {
          ...item,
          options: optionsToUse,
          status: 'error',
          progress: 0,
          error: errorMessage,
        };
      }
    },
    [registerUrl, revokeUrl]
  );

  /**
   * Add new files (Images or PDFs) to the converter queue
   */
  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0) return;

      const newItems: ImageItem[] = [];
      let rejectedCount = 0;

      for (const file of files) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.error(validation.error || 'Invalid file');
          rejectedCount++;
          continue;
        }

        try {
          if (validation.isPdf) {
            // Extract all PDF pages as separate high-res images
            const toastId = toast.loading(`Extracting pages from PDF "${file.name}"...`);
            const pages = await extractPagesFromPdf(file);
            toast.dismiss(toastId);

            for (let pIdx = 0; pIdx < pages.length; pIdx++) {
              const pageFile = pages[pIdx];
              const { metadata, objectUrl } = await extractImageMetadata(pageFile);
              registerUrl(objectUrl);

              const itemOptions: ConversionOptions = {
                ...globalOptions,
                width: metadata.width,
                height: metadata.height,
              };

              newItems.push({
                id: `${Date.now()}-${pIdx}-${Math.random().toString(36).substring(2, 7)}`,
                file: pageFile,
                objectUrl,
                metadata: {
                  ...metadata,
                  pageNumber: pIdx + 1,
                  totalPages: pages.length,
                },
                options: itemOptions,
                status: 'idle',
                progress: 0,
              });
            }
          } else {
            // Standard Image
            const { metadata, objectUrl } = await extractImageMetadata(file);
            registerUrl(objectUrl);

            const itemOptions: ConversionOptions = {
              ...globalOptions,
              width: metadata.width,
              height: metadata.height,
            };

            const newItem: ImageItem = {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              file,
              objectUrl,
              metadata,
              options: itemOptions,
              status: 'idle',
              progress: 0,
            };

            newItems.push(newItem);
          }
        } catch {
          toast.error(`Could not load "${file.name}"`);
          rejectedCount++;
        }
      }

      if (newItems.length === 0) return;

      setItems((prev) => [...prev, ...newItems]);
      setActiveItemId((prev) => prev || newItems[0].id);

      toast.success(
        `Added ${newItems.length} item${newItems.length > 1 ? 's' : ''}${
          rejectedCount > 0 ? ` (${rejectedCount} skipped)` : ''
        }`
      );

      // Auto-convert newly added items immediately
      setIsProcessing(true);
      for (const item of newItems) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'converting', progress: 30 } : i))
        );

        const processed = await processItemConversion(item);
        setItems((prev) => prev.map((i) => (i.id === item.id ? processed : i)));
      }
      setIsProcessing(false);
    },
    [globalOptions, registerUrl, processItemConversion]
  );

  /**
   * Update options for a specific image item and immediately re-convert
   */
  const updateItemOptions = useCallback(
    async (id: string, newOptions: Partial<ConversionOptions>) => {
      setItems((prev) => {
        return prev.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            options: { ...item.options, ...newOptions },
          };
        });
      });

      const currentItem = items.find((i) => i.id === id);
      if (!currentItem) return;

      const mergedOptions: ConversionOptions = {
        ...currentItem.options,
        ...newOptions,
      };

      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'converting' } : i))
      );

      const updated = await processItemConversion(currentItem, mergedOptions);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    },
    [items, processItemConversion]
  );

  /**
   * Update global options and optionally apply to all items in queue
   */
  const updateGlobalOptions = useCallback(
    async (newOptions: Partial<ConversionOptions>, applyToAll: boolean = true) => {
      const merged = { ...globalOptions, ...newOptions };
      setGlobalOptions(merged);

      if (applyToAll && items.length > 0) {
        setIsProcessing(true);
        const updatedList: ImageItem[] = [];

        for (const item of items) {
          const itemOpt: ConversionOptions = {
            ...item.options,
            ...newOptions,
            width: newOptions.width ?? item.options.width ?? item.metadata.width,
            height: newOptions.height ?? item.options.height ?? item.metadata.height,
          };

          const processed = await processItemConversion(item, itemOpt);
          updatedList.push(processed);
        }

        setItems(updatedList);
        setIsProcessing(false);
        toast.info('Applied settings to all items');
      }
    },
    [globalOptions, items, processItemConversion]
  );

  /**
   * Convert all items in queue
   */
  const convertAll = useCallback(async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    const updatedList: ImageItem[] = [];

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'converting' } : i))
      );

      const processed = await processItemConversion(item);
      updatedList.push(processed);

      setItems((prev) => prev.map((i) => (i.id === item.id ? processed : i)));
    }

    setIsProcessing(false);
    toast.success('Batch conversion complete!');
  }, [items, processItemConversion]);

  /**
   * Remove a single item from the queue
   */
  const removeItem = useCallback(
    (id: string) => {
      const itemToRemove = items.find((i) => i.id === id);
      if (itemToRemove) {
        revokeUrl(itemToRemove.objectUrl);
        if (itemToRemove.result?.url) {
          revokeUrl(itemToRemove.result.url);
        }
      }

      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        if (activeItemId === id) {
          setActiveItemId(next.length > 0 ? next[0].id : null);
        }
        return next;
      });
    },
    [items, activeItemId, revokeUrl]
  );

  /**
   * Clear all items from queue
   */
  const clearAll = useCallback(() => {
    items.forEach((item) => {
      revokeUrl(item.objectUrl);
      if (item.result?.url) {
        revokeUrl(item.result.url);
      }
    });

    setItems([]);
    setActiveItemId(null);
    toast.info('Cleared queue');
  }, [items, revokeUrl]);

  /**
   * Download a single converted image/document
   */
  const downloadSingle = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item || !item.result) {
        toast.error('Item has not been converted yet');
        return;
      }

      saveAs(item.result.blob, item.result.fileName);
      toast.success(`Downloaded ${item.result.fileName}`);
    },
    [items]
  );

  /**
   * Download all completed images as a ZIP archive
   */
  const downloadAllZip = useCallback(async () => {
    const completedItems = items.filter((i) => i.status === 'completed' && i.result);

    if (completedItems.length === 0) {
      toast.error('No converted items ready for download');
      return;
    }

    setIsZipping(true);
    const toastId = toast.loading('Creating ZIP archive...');

    try {
      const zip = new JSZip();
      const folder = zip.folder('ConvertIQ-Export');

      completedItems.forEach((item, index) => {
        if (item.result) {
          const fileName = item.result.fileName || `file-${index + 1}.jpg`;
          folder?.file(fileName, item.result.blob);
        }
      });

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      saveAs(zipBlob, `ConvertIQ-batch-${timestamp}.zip`);

      toast.success(`Downloaded ${completedItems.length} files in ZIP!`, { id: toastId });
    } catch {
      toast.error('Failed to create ZIP file', { id: toastId });
    } finally {
      setIsZipping(false);
    }
  }, [items]);

  /**
   * Export all images merged into a single multi-page PDF document
   */
  const exportAllMergedPdf = useCallback(async () => {
    if (items.length === 0) {
      toast.error('Queue is empty');
      return;
    }

    setIsZipping(true);
    const toastId = toast.loading('Generating combined multi-page PDF...');

    try {
      const canvasesToMerge: {
        canvas: HTMLCanvasElement;
        width: number;
        height: number;
        name: string;
      }[] = [];

      for (const item of items) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = item.objectUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvasesToMerge.push({
          canvas,
          width: canvas.width,
          height: canvas.height,
          name: item.metadata.name,
        });
      }

      const mergedPdfBlob = await createMultiPagePdf(canvasesToMerge);
      const timestamp = new Date().toISOString().slice(0, 10);
      saveAs(mergedPdfBlob, `ConvertIQ-Merged-Document-${timestamp}.pdf`);

      toast.success(`Exported ${items.length} pages into PDF!`, { id: toastId });
    } catch {
      toast.error('Failed to generate combined PDF', { id: toastId });
    } finally {
      setIsZipping(false);
    }
  }, [items]);

  /**
   * Export all images merged into a single Word (.docx) document
   */
  const exportAllMergedDocx = useCallback(async () => {
    if (items.length === 0) {
      toast.error('Queue is empty');
      return;
    }

    setIsZipping(true);
    const toastId = toast.loading('Generating Word (.docx) Document...');

    try {
      const docxItems: { blob: Blob; width: number; height: number; name: string }[] = [];

      for (const item of items) {
        let blobToEmbed: Blob;
        if (item.result?.blob) {
          blobToEmbed = item.result.blob;
        } else {
          const response = await fetch(item.objectUrl);
          blobToEmbed = await response.blob();
        }

        docxItems.push({
          blob: blobToEmbed,
          width: item.metadata.width,
          height: item.metadata.height,
          name: item.metadata.name,
        });
      }

      const docxBlob = await createDocxFromImages(docxItems, 'ConvertIQ Document Export');
      const timestamp = new Date().toISOString().slice(0, 10);
      saveAs(docxBlob, `ConvertIQ-Document-${timestamp}.docx`);

      toast.success(`Exported ${items.length} items to Word (.docx)!`, { id: toastId });
    } catch {
      toast.error('Failed to generate Word document', { id: toastId });
    } finally {
      setIsZipping(false);
    }
  }, [items]);

  const activeItem = items.find((i) => i.id === activeItemId) || (items.length > 0 ? items[0] : null);

  const batchStats: BatchStats = {
    total: items.length,
    completed: items.filter((i) => i.status === 'completed').length,
    failed: items.filter((i) => i.status === 'error').length,
    totalOriginalSize: items.reduce((acc, i) => acc + i.metadata.size, 0),
    totalConvertedSize: items.reduce((acc, i) => acc + (i.result?.size || 0), 0),
  };

  return {
    items,
    activeItem,
    activeItemId,
    setActiveItemId,
    globalOptions,
    isProcessing,
    isZipping,
    batchStats,
    addFiles,
    updateItemOptions,
    updateGlobalOptions,
    convertAll,
    removeItem,
    clearAll,
    downloadSingle,
    downloadAllZip,
    exportAllMergedPdf,
    exportAllMergedDocx,
  };
}
