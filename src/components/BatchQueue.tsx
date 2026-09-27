import React from 'react';
import {
  Archive,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  FileText,
} from 'lucide-react';
import type { ImageItem, BatchStats } from '../types';
import { formatBytes, calculateSavings } from '../lib/formatBytes';

interface BatchQueueProps {
  items: ImageItem[];
  activeItemId: string | null;
  onSelectItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onDownloadSingle: (id: string) => void;
  onDownloadAllZip: () => void;
  onExportAllMergedPdf: () => void;
  onExportAllMergedDocx: () => void;
  onConvertAll: () => void;
  isProcessing: boolean;
  isZipping: boolean;
  batchStats: BatchStats;
  isLowUi?: boolean;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  activeItemId,
  onSelectItem,
  onRemoveItem,
  onClearAll,
  onDownloadSingle,
  onDownloadAllZip,
  onExportAllMergedPdf,
  onExportAllMergedDocx,
  onConvertAll,
  isProcessing,
  isZipping,
  batchStats,
  isLowUi = false,
}) => {
  if (items.length === 0) return null;

  const totalSavings = calculateSavings(
    batchStats.totalOriginalSize,
    batchStats.totalConvertedSize
  );

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-3 transition-all">
      {/* Action Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>Queue</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-mono">
                {items.length}
              </span>
            </h3>
          </div>
          {!isLowUi && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formatBytes(batchStats.totalOriginalSize)} total{' '}
              {batchStats.completed > 0 && (
                <>
                  <span className="text-slate-400">→</span>{' '}
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {formatBytes(batchStats.totalConvertedSize)}
                  </span>{' '}
                  <span
                    className={`font-semibold ${
                      totalSavings.isSmaller ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    ({totalSavings.text} saved)
                  </span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Global Batch Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Re-convert */}
          <button
            type="button"
            onClick={onConvertAll}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50"
            title="Re-convert all items"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Re-convert</span>
          </button>

          {/* Merge to PDF */}
          <button
            type="button"
            onClick={onExportAllMergedPdf}
            disabled={isZipping}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Combine all images into a single multi-page PDF document"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>Combine to PDF</span>
          </button>

          {/* Merge to Word DOCX */}
          <button
            type="button"
            onClick={onExportAllMergedDocx}
            disabled={isZipping}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Export all images into a Word (.docx) document"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Combine to Word</span>
          </button>

          {/* Download ZIP */}
          <button
            type="button"
            onClick={onDownloadAllZip}
            disabled={batchStats.completed === 0 || isZipping}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Archive className={`w-3.5 h-3.5 ${isZipping ? 'animate-bounce' : ''}`} />
            <span>{isZipping ? 'Zipping...' : `Download ZIP (${batchStats.completed})`}</span>
          </button>

          {/* Clear Queue */}
          <button
            type="button"
            onClick={onClearAll}
            disabled={isProcessing}
            className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 transition-all cursor-pointer disabled:opacity-50"
            title="Clear Queue"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="p-3 sm:p-4 pt-0 space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {items.map((item) => {
          const isSelected = item.id === activeItemId;
          const savings = calculateSavings(item.metadata.size, item.result?.size || 0);
          const isConverting = item.status === 'converting';
          const isCompleted = item.status === 'completed';
          const isError = item.status === 'error';

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={`group flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500/80 shadow-sm ring-1 ring-indigo-500/40'
                  : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900/80'
              }`}
            >
              {/* Thumbnail + Details */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={item.objectUrl}
                    alt={item.metadata.name}
                    className="w-full h-full object-cover"
                  />
                  {isConverting && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">
                      {item.metadata.name}
                    </p>
                    <span className="px-1.5 py-0.2 text-[9px] uppercase font-mono rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                      → {item.options.targetFormat.includes('pdf') ? 'PDF' : item.options.targetFormat.includes('word') ? 'DOCX' : item.options.targetFormat.replace('image/', '')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{formatBytes(item.metadata.size)}</span>
                    <span>•</span>
                    <span>
                      {item.metadata.width}×{item.metadata.height}
                    </span>
                    {isCompleted && item.result && (
                      <>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {formatBytes(item.result.size)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Savings Pill */}
                {isCompleted && item.result && !item.result.isDocument && (
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      savings.isSmaller
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {savings.isSmaller ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                    {savings.text}
                  </span>
                )}

                {/* Status Indicator */}
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                {isError && (
                  <span title={item.error}>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  </span>
                )}

                {/* Download Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadSingle(item.id);
                  }}
                  disabled={!isCompleted}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-600 hover:text-white text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-30"
                  title="Download this file"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-red-600 hover:text-white text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                  title="Remove from queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
