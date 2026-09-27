export type SupportedInputMime =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/avif'
  | 'image/bmp'
  | 'image/x-ms-bmp'
  | 'image/svg+xml'
  | 'image/gif'
  | 'application/pdf';

export type TargetFormat =
  | 'image/webp'
  | 'image/jpeg'
  | 'image/png'
  | 'image/bmp'
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface FormatOption {
  id: TargetFormat;
  label: string;
  ext: string;
  category: 'image' | 'document';
  supportsQuality: boolean;
  mimeType: string;
  description: string;
}

export const TARGET_FORMATS: FormatOption[] = [
  {
    id: 'image/webp',
    label: 'WEBP',
    ext: 'webp',
    category: 'image',
    supportsQuality: true,
    mimeType: 'image/webp',
    description: 'Modern web format with superior lossy and lossless compression',
  },
  {
    id: 'image/jpeg',
    label: 'JPEG / JPG',
    ext: 'jpg',
    category: 'image',
    supportsQuality: true,
    mimeType: 'image/jpeg',
    description: 'Universal standard for photographs and social sharing',
  },
  {
    id: 'image/png',
    label: 'PNG',
    ext: 'png',
    category: 'image',
    supportsQuality: false,
    mimeType: 'image/png',
    description: 'Lossless compression with crisp edges and full alpha transparency',
  },
  {
    id: 'image/bmp',
    label: 'BMP',
    ext: 'bmp',
    category: 'image',
    supportsQuality: false,
    mimeType: 'image/bmp',
    description: 'Uncompressed raw bitmap for legacy compatibility',
  },
  {
    id: 'application/pdf',
    label: 'PDF Doc',
    ext: 'pdf',
    category: 'document',
    supportsQuality: false,
    mimeType: 'application/pdf',
    description: 'Standard multi-page PDF document format with embedded high-res graphics',
  },
  {
    id: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    label: 'Word (.docx)',
    ext: 'docx',
    category: 'document',
    supportsQuality: false,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    description: 'Microsoft Word document (.docx) with formatted embedded image layouts',
  },
];

export interface ConversionOptions {
  targetFormat: TargetFormat;
  quality: number; // 0.1 to 1.0
  customDimensions: boolean;
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  backgroundColor?: string;
  pdfPageSize?: 'a4' | 'letter' | 'fit';
  pdfOrientation?: 'portrait' | 'landscape' | 'auto';
}

export interface ImageMetadata {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  aspectRatio: number;
  lastModified: number;
  pageNumber?: number;
  totalPages?: number;
}

export interface ConvertedResult {
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  durationMs: number;
  fileName: string;
  isDocument?: boolean;
}

export type ConversionStatus = 'idle' | 'converting' | 'completed' | 'error';

export interface ImageItem {
  id: string;
  file: File;
  objectUrl: string;
  metadata: ImageMetadata;
  options: ConversionOptions;
  status: ConversionStatus;
  progress: number;
  result?: ConvertedResult;
  error?: string;
}

export interface BatchStats {
  total: number;
  completed: number;
  failed: number;
  totalOriginalSize: number;
  totalConvertedSize: number;
}
