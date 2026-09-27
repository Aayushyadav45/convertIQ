export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB to accommodate multi-page PDFs

export const SUPPORTED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'avif',
  'bmp',
  'svg',
  'pdf',
];

export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/x-ms-bmp',
  'image/svg+xml',
  'application/pdf',
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  isPdf?: boolean;
}

export function validateImageFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the maximum limit of 50MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: `File "${file.name}" is empty (0 bytes).`,
    };
  }

  // Check MIME type and extension
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const isMimeSupported = SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase());
  const isExtSupported = SUPPORTED_EXTENSIONS.includes(extension);

  if (!isMimeSupported && !isExtSupported) {
    return {
      valid: false,
      error: `Format of "${file.name}" is not supported. Please upload JPEG, PNG, WEBP, AVIF, BMP, SVG, or PDF.`,
    };
  }

  const isPdf = extension === 'pdf' || file.type.toLowerCase() === 'application/pdf';

  return { valid: true, isPdf };
}
