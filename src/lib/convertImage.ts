import type { ConversionOptions, ConvertedResult, ImageMetadata } from '../types';
import { TARGET_FORMATS } from '../types';
import { encodeBMP } from './bmpEncoder';
import { createPdfFromImage, createDocxFromImages } from './documentGenerators';

/**
 * Loads an image from a Blob/File or URL and extracts its native dimensions and metadata.
 */
export async function extractImageMetadata(file: File): Promise<{
  metadata: ImageMetadata;
  objectUrl: string;
}> {
  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 1;
      const height = img.naturalHeight || 1;
      const metadata: ImageMetadata = {
        name: file.name,
        size: file.size,
        type: file.type || 'image/unknown',
        width,
        height,
        aspectRatio: width / height,
        lastModified: file.lastModified,
      };
      resolve({ metadata, objectUrl });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image "${file.name}". The file may be corrupted.`));
    };

    img.src = objectUrl;
  });
}

/**
 * Calculates final dimensions based on options and original aspect ratio.
 */
export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  options: ConversionOptions
): { width: number; height: number } {
  if (!options.customDimensions) {
    return { width: originalWidth, height: originalHeight };
  }

  const reqWidth = options.width && options.width > 0 ? options.width : originalWidth;
  const reqHeight = options.height && options.height > 0 ? options.height : originalHeight;

  if (!options.maintainAspectRatio) {
    return {
      width: Math.max(1, Math.round(reqWidth)),
      height: Math.max(1, Math.round(reqHeight)),
    };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (options.width && (!options.height || options.height === originalHeight)) {
    return {
      width: Math.max(1, Math.round(reqWidth)),
      height: Math.max(1, Math.round(reqWidth / aspectRatio)),
    };
  }

  if (options.height && (!options.width || options.width === originalWidth)) {
    return {
      width: Math.max(1, Math.round(reqHeight * aspectRatio)),
      height: Math.max(1, Math.round(reqHeight)),
    };
  }

  const widthRatio = reqWidth / originalWidth;
  const heightRatio = reqHeight / originalHeight;
  const scale = Math.min(widthRatio, heightRatio);

  return {
    width: Math.max(1, Math.round(originalWidth * scale)),
    height: Math.max(1, Math.round(originalHeight * scale)),
  };
}

/**
 * Generates an output filename replacing original extension with the target format's extension.
 */
export function generateOutputFileName(originalName: string, targetFormat: string): string {
  const formatInfo = TARGET_FORMATS.find((f) => f.id === targetFormat);
  const ext = formatInfo ? formatInfo.ext : 'jpg';
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  return `${baseName}-convertiq.${ext}`;
}

/**
 * Main conversion engine: Renders the image onto a Canvas, applies scaling/backgrounds,
 * and encodes to the target format (JPEG, PNG, WEBP, BMP, PDF, DOCX).
 */
export async function convertImage(
  source: File | string,
  options: ConversionOptions,
  originalMetadata?: { width: number; height: number; name: string }
): Promise<ConvertedResult> {
  const startTime = performance.now();

  // 1. Load source image
  let imageSource: HTMLImageElement | ImageBitmap;
  let srcWidth = 0;
  let srcHeight = 0;
  let originalName = 'converted_image';
  let tempUrlToRevoke: string | null = null;

  if (source instanceof File) {
    originalName = source.name;
    tempUrlToRevoke = URL.createObjectURL(source);
    try {
      imageSource = await createImageBitmap(source);
      srcWidth = imageSource.width;
      srcHeight = imageSource.height;
    } catch {
      imageSource = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = tempUrlToRevoke!;
      });
      srcWidth = (imageSource as HTMLImageElement).naturalWidth;
      srcHeight = (imageSource as HTMLImageElement).naturalHeight;
    }
  } else {
    if (originalMetadata) {
      originalName = originalMetadata.name;
      srcWidth = originalMetadata.width;
      srcHeight = originalMetadata.height;
    }
    imageSource = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = source;
    });
    if (!srcWidth) srcWidth = (imageSource as HTMLImageElement).naturalWidth;
    if (!srcHeight) srcHeight = (imageSource as HTMLImageElement).naturalHeight;
  }

  // 2. Compute final dimensions
  const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
    srcWidth,
    srcHeight,
    options
  );

  // 3. Setup canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: options.targetFormat === 'image/bmp' });

  if (!ctx) {
    if (tempUrlToRevoke) URL.revokeObjectURL(tempUrlToRevoke);
    if ('close' in imageSource && typeof imageSource.close === 'function') imageSource.close();
    throw new Error('Failed to create 2D canvas context.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // For JPEG, BMP, PDF, DOCX fill background white if transparent
  const needsWhiteBg =
    options.targetFormat === 'image/jpeg' ||
    options.targetFormat === 'image/bmp' ||
    options.targetFormat === 'application/pdf' ||
    options.targetFormat === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (needsWhiteBg) {
    ctx.fillStyle = options.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Draw scaled image
  ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight);

  if (tempUrlToRevoke) URL.revokeObjectURL(tempUrlToRevoke);
  if ('close' in imageSource && typeof imageSource.close === 'function') imageSource.close();

  // 4. Encode to target format
  let blob: Blob;
  let isDocument = false;

  if (options.targetFormat === 'application/pdf') {
    isDocument = true;
    blob = await createPdfFromImage(canvas, originalName, targetWidth, targetHeight, {
      pageSize: options.pdfPageSize,
      orientation: options.pdfOrientation,
    });
  } else if (
    options.targetFormat ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    isDocument = true;
    // Get PNG blob from canvas to embed in docx
    const pngBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    blob = await createDocxFromImages(
      [{ blob: pngBlob, width: targetWidth, height: targetHeight, name: originalName }],
      originalName
    );
  } else if (options.targetFormat === 'image/bmp') {
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    blob = encodeBMP(imageData);
  } else {
    blob = await new Promise<Blob>((resolve, reject) => {
      const quality = options.targetFormat === 'image/png' ? undefined : options.quality;
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error(`Failed to encode image to ${options.targetFormat}`));
          }
        },
        options.targetFormat,
        quality
      );
    });
  }

  const durationMs = Math.round(performance.now() - startTime);
  const resultUrl = URL.createObjectURL(blob);
  const outputFileName = generateOutputFileName(originalName, options.targetFormat);

  return {
    blob,
    url: resultUrl,
    size: blob.size,
    width: targetWidth,
    height: targetHeight,
    durationMs,
    fileName: outputFileName,
    isDocument,
  };
}
