import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, Sparkles } from 'lucide-react';
import { SUPPORTED_EXTENSIONS } from '../lib/fileValidation';

interface DropzoneProps {
  onFilesDropped: (files: File[]) => void;
  hasFiles: boolean;
  isLowUi?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesDropped, hasFiles, isLowUi = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesDropped(filesArray);
      e.dataTransfer.clearData();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesDropped(filesArray);
      e.target.value = '';
    }
  };

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const extension = file.type.split('/')[1] || 'png';
            const renamedFile = new File(
              [file],
              `pasted-image-${Date.now()}.${extension}`,
              { type: file.type }
            );
            imageFiles.push(renamedFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        onFilesDropped(imageFiles);
      }
    },
    [onFilesDropped]
  );

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative group cursor-pointer transition-all duration-300 rounded-2xl border-2 border-dashed overflow-hidden ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-500/10 shadow-2xl shadow-indigo-500/20 scale-[1.01]'
          : hasFiles
          ? 'border-slate-300 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40 shadow-sm'
          : 'border-slate-300 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-900/40 shadow-xl'
      } ${
        isLowUi
          ? 'p-4 sm:p-5'
          : hasFiles
          ? 'p-5 sm:p-7'
          : 'p-8 sm:p-12'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-sky-500/5 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/svg+xml,application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {!isLowUi && (
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 mb-3 ${
              isDragOver
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50 scale-110'
                : 'bg-slate-100 dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700/60 group-hover:border-indigo-500/40 group-hover:scale-105'
            }`}
          >
            {isDragOver ? (
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:-translate-y-0.5" />
            )}
          </div>
        )}

        <h3 className={`${isLowUi ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2`}>
          {isLowUi && <UploadCloud className="w-4 h-4 text-indigo-500" />}
          <span>{isDragOver ? 'Drop images or PDF to process' : 'Upload Images or PDF Files'}</span>
        </h3>

        {!isLowUi && (
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-3">
            Drop photos or multi-page PDFs to convert to JPG, PNG, WEBP, BMP, PDF, or Word (.docx). Paste with{' '}
            <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300">
              Ctrl+V
            </kbd>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {SUPPORTED_EXTENSIONS.map((ext) => (
            <span
              key={ext}
              className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors ${
                ext === 'pdf'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              .{ext}
            </span>
          ))}
          <span className="px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 rounded-md bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            Up to 50MB
          </span>
        </div>
      </div>
    </div>
  );
};
