import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, ImageRun, HeadingLevel, AlignmentType } from 'docx';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Creates a PDF document from a single image or Canvas.
 */
export async function createPdfFromImage(
  imageSource: HTMLCanvasElement | Blob,
  _fileName: string,
  width: number,
  height: number,
  options?: { pageSize?: 'a4' | 'letter' | 'fit'; orientation?: 'portrait' | 'landscape' | 'auto' }
): Promise<Blob> {
  let imgDataUrl: string;

  if (imageSource instanceof HTMLCanvasElement) {
    imgDataUrl = imageSource.toDataURL('image/jpeg', 0.95);
  } else {
    imgDataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(imageSource);
    });
  }

  const isLandscape = width > height;
  const orientation =
    options?.orientation === 'portrait'
      ? 'p'
      : options?.orientation === 'landscape'
      ? 'l'
      : isLandscape
      ? 'l'
      : 'p';

  const doc = new jsPDF({
    orientation,
    unit: 'px',
    format: options?.pageSize === 'fit' ? [width, height] : [width, height],
    compress: true,
  });

  doc.addImage(imgDataUrl, 'JPEG', 0, 0, width, height, undefined, 'FAST');
  return doc.output('blob');
}

/**
 * Merges multiple images into a single combined PDF document.
 */
export async function createMultiPagePdf(
  items: { canvas: HTMLCanvasElement; width: number; height: number; name: string }[]
): Promise<Blob> {
  if (items.length === 0) throw new Error('No images to include in PDF');

  const first = items[0];
  const firstLandscape = first.width > first.height;
  const doc = new jsPDF({
    orientation: firstLandscape ? 'l' : 'p',
    unit: 'px',
    format: [first.width, first.height],
    compress: true,
  });

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const isLandscape = item.width > item.height;
    if (i > 0) {
      doc.addPage([item.width, item.height], isLandscape ? 'l' : 'p');
    }
    const imgData = item.canvas.toDataURL('image/jpeg', 0.92);
    doc.addImage(imgData, 'JPEG', 0, 0, item.width, item.height, undefined, 'FAST');
  }

  return doc.output('blob');
}

/**
 * Creates a Word (.docx) document embedding one or more images with formatting.
 */
export async function createDocxFromImages(
  items: { blob: Blob; width: number; height: number; name: string }[],
  docTitle: string = 'ConvertIQ Document'
): Promise<Blob> {
  const sectionsChildren: Paragraph[] = [
    new Paragraph({
      text: docTitle,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
  ];

  for (const item of items) {
    const buffer = await item.blob.arrayBuffer();

    const maxWidth = 500;
    let targetW = item.width;
    let targetH = item.height;

    if (targetW > maxWidth) {
      const ratio = maxWidth / targetW;
      targetW = maxWidth;
      targetH = Math.round(targetH * ratio);
    }

    sectionsChildren.push(
      new Paragraph({
        text: item.name,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new ImageRun({
            data: new Uint8Array(buffer),
            transformation: {
              width: targetW,
              height: targetH,
            },
            type: 'png',
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sectionsChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Parses a PDF file and extracts all pages as Image Files (PNG) so they can be processed like photos.
 */
export async function extractPagesFromPdf(file: File): Promise<File[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const imageFiles: File[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    // Render parameters matching latest pdfjs-dist requirements
    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    } as any).promise;

    const pageBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
    });

    const baseName = file.name.replace(/\.pdf$/i, '');
    const pageFileName = `${baseName}-page-${pageNum}.png`;

    const pageFile = new File([pageBlob], pageFileName, {
      type: 'image/png',
      lastModified: Date.now(),
    });

    imageFiles.push(pageFile);
  }

  return imageFiles;
}
