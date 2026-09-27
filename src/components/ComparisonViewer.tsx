import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Download,
  TrendingDown,
  TrendingUp,
  Sparkles,
  SplitSquareVertical,
  Columns,
  Image as ImageIcon,
  Clock,
  FileText,
} from 'lucide-react';
import type { ImageItem } from '../types';
import { formatBytes, calculateSavings } from '../lib/formatBytes';

interface ComparisonViewerProps {
  item: ImageItem | null;
  onDownload: (id: string) => void;
  isLowUi?: boolean;
}

type ViewMode = 'split' | 'side-by-side' | 'converted' | 'original';

export const ComparisonViewer: React.FC<ComparisonViewerProps> = ({
  item,
  onDownload,
  isLowUi = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleSliderMove(e.touches[0].clientX);
    },
    [isDragging, handleSliderMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleSliderMove(e.clientX);
    },
    [isDragging, handleSliderMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  if (!item) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[380px] border border-slate-200 dark:border-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
          <ImageIcon className="w-7 h-7" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1">No Item Selected</h4>
        <p className="text-xs text-slate-500 max-w-sm">
          Drop an image or PDF above to preview and adjust live.
        </p>
      </div>
    );
  }

  const originalSize = item.metadata.size;
  const convertedSize = item.result?.size || 0;
  const savings = calculateSavings(originalSize, convertedSize);
  const isConverted = item.status === 'completed' && item.result;
  const isConverting = item.status === 'converting';
  const isDocResult = item.result?.isDocument;

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all">
      {/* Top Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* View Mode Pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Split</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              viewMode === 'side-by-side'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dual</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('converted')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              viewMode === 'converted'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Output
          </button>
          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              viewMode === 'original'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Original
          </button>
        </div>

        {/* Live Metrics & Download Button */}
        <div className="flex items-center gap-2">
          {item.result && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>{item.result.durationMs}ms</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onDownload(item.id)}
            disabled={!isConverted}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="bg-slate-50 dark:bg-slate-950/60 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 gap-2 items-center text-xs">
        <div>
          <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">
            Original
          </span>
          <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            <span>{formatBytes(originalSize)}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">
              {item.metadata.width}×{item.metadata.height}
            </span>
          </div>
        </div>

        <div>
          <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">
            Converted ({item.options.targetFormat.includes('pdf') ? 'PDF' : item.options.targetFormat.includes('word') ? 'DOCX' : item.options.targetFormat.replace('image/', '').toUpperCase()})
          </span>
          {isConverting ? (
            <div className="flex items-center gap-1.5 text-indigo-500 animate-pulse font-medium">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : isConverted ? (
            <div className="flex items-center gap-1 font-medium text-slate-900 dark:text-white">
              <span>{formatBytes(convertedSize)}</span>
            </div>
          ) : (
            <span className="text-slate-500">Ready</span>
          )}
        </div>

        <div className="col-span-2 sm:col-span-1 flex items-center sm:justify-end">
          {isConverted && !isDocResult && (
            <div
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                savings.isSmaller
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              {savings.isSmaller ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              <span>{savings.text}</span>
            </div>
          )}
          {isConverted && isDocResult && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30">
              <FileText className="w-3 h-3" />
              <span>Document Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Preview */}
      <div className={`relative p-4 sm:p-6 flex items-center justify-center ${isLowUi ? 'min-h-[280px] sm:min-h-[340px]' : 'min-h-[340px] sm:min-h-[420px]'} bg-slate-100 dark:bg-[#0c0e14] select-none transition-all`}>
        {/* Checkerboard Pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#475569 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* 1. SPLIT SLIDER */}
        {viewMode === 'split' && (
          <div
            ref={containerRef}
            onMouseDown={(e) => {
              setIsDragging(true);
              handleSliderMove(e.clientX);
            }}
            onTouchStart={(e) => {
              setIsDragging(true);
              handleSliderMove(e.touches[0].clientX);
            }}
            className="relative max-w-full max-h-[420px] rounded-xl overflow-hidden shadow-xl border border-slate-300 dark:border-slate-800 cursor-ew-resize select-none"
          >
            <img
              src={item.objectUrl}
              alt="Converted Preview"
              className="block max-w-full max-h-[420px] object-contain pointer-events-none"
            />

            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={item.objectUrl}
                alt="Original Preview"
                className="block max-w-none max-h-[420px] object-contain pointer-events-none"
                style={{
                  width: containerRef.current?.clientWidth || '100%',
                  height: containerRef.current?.clientHeight || '100%',
                }}
              />
            </div>

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none z-10"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-900 border-2 border-white text-white shadow-xl flex items-center justify-center text-[9px] font-bold">
                ↔
              </div>
            </div>

            <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-semibold text-slate-300 pointer-events-none">
              Original
            </div>
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-indigo-950/80 backdrop-blur-md border border-indigo-700/50 text-[10px] font-semibold text-indigo-300 pointer-events-none">
              {item.options.targetFormat.includes('pdf') ? 'PDF' : item.options.targetFormat.includes('word') ? 'Word' : 'Output'}
            </div>
          </div>
        )}

        {/* 2. DUAL SIDE-BY-SIDE */}
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full h-full max-h-[420px]">
            <div className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 overflow-hidden">
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-semibold z-10">
                Original ({formatBytes(originalSize)})
              </span>
              <img
                src={item.objectUrl}
                alt="Original"
                className="max-h-[300px] max-w-full object-contain rounded"
              />
            </div>

            <div className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 overflow-hidden">
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-indigo-900/80 text-white text-[10px] font-semibold z-10">
                Converted ({formatBytes(convertedSize)})
              </span>
              <img
                src={item.objectUrl}
                alt="Converted"
                className="max-h-[300px] max-w-full object-contain rounded"
              />
            </div>
          </div>
        )}

        {/* 3. CONVERTED / OUTPUT */}
        {viewMode === 'converted' && (
          <div className="relative flex items-center justify-center max-h-[420px]">
            <img
              src={item.objectUrl}
              alt="Converted Output"
              className="max-h-[420px] max-w-full object-contain rounded-xl shadow-lg border border-slate-300 dark:border-slate-800"
            />
          </div>
        )}

        {/* 4. ORIGINAL */}
        {viewMode === 'original' && (
          <div className="relative flex items-center justify-center max-h-[420px]">
            <img
              src={item.objectUrl}
              alt="Original Image"
              className="max-h-[420px] max-w-full object-contain rounded-xl shadow-lg border border-slate-300 dark:border-slate-800"
            />
          </div>
        )}
      </div>
    </div>
  );
};
