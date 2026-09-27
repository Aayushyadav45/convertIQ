import React from 'react';
import {
  Sliders,
  Lock,
  Unlock,
  FileImage,
  FileText,
  Layers,
  Sparkles,
  Maximize2,
  Info,
} from 'lucide-react';
import type {
  ConversionOptions,
  ImageItem,
} from '../types';
import { TARGET_FORMATS } from '../types';

interface ConversionControlsProps {
  options: ConversionOptions;
  activeItem: ImageItem | null;
  totalItemsCount: number;
  onOptionsChange: (newOptions: Partial<ConversionOptions>) => void;
  onApplyToAll: () => void;
  isProcessing: boolean;
  isLowUi?: boolean;
}

export const ConversionControls: React.FC<ConversionControlsProps> = ({
  options,
  activeItem,
  totalItemsCount,
  onOptionsChange,
  onApplyToAll,
  isProcessing,
  isLowUi = false,
}) => {
  const currentFormat = TARGET_FORMATS.find((f) => f.id === options.targetFormat) || TARGET_FORMATS[0];
  const supportsQuality = currentFormat.supportsQuality;
  const isDocument = currentFormat.category === 'document';

  const originalWidth = activeItem?.metadata.width || 1920;
  const originalHeight = activeItem?.metadata.height || 1080;
  const aspectRatio = originalWidth / originalHeight;

  // Handle Dimension Presets
  const applyScalePreset = (percentage: number) => {
    const newWidth = Math.round(originalWidth * (percentage / 100));
    const newHeight = Math.round(originalHeight * (percentage / 100));
    onOptionsChange({
      customDimensions: true,
      width: newWidth,
      height: newHeight,
    });
  };

  const applyFixedPreset = (width: number, height: number) => {
    onOptionsChange({
      customDimensions: true,
      width,
      height,
    });
  };

  // Handle Width change with aspect ratio
  const handleWidthChange = (w: number) => {
    if (options.maintainAspectRatio) {
      const h = Math.round(w / aspectRatio);
      onOptionsChange({ width: w, height: h });
    } else {
      onOptionsChange({ width: w });
    }
  };

  // Handle Height change with aspect ratio
  const handleHeightChange = (h: number) => {
    if (options.maintainAspectRatio) {
      const w = Math.round(h * aspectRatio);
      onOptionsChange({ width: w, height: h });
    } else {
      onOptionsChange({ height: h });
    }
  };

  return (
    <div className={`glass-panel rounded-2xl ${isLowUi ? 'p-4 space-y-4' : 'p-5 sm:p-6 space-y-5'} transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Conversion Settings</h3>
            {!isLowUi && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeItem
                  ? `Active: ${activeItem.metadata.name}`
                  : 'Configure output parameters'}
              </p>
            )}
          </div>
        </div>

        {totalItemsCount > 1 && (
          <button
            onClick={onApplyToAll}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="Apply these parameters across all items in the queue"
          >
            <Layers className="w-3 h-3" />
            <span>Apply to All ({totalItemsCount})</span>
          </button>
        )}
      </div>

      {/* 1. Target Format Selection (Grouped by Images & Documents) */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileImage className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            Target Format
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{currentFormat.label}</span>
        </label>

        {/* Formats Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {TARGET_FORMATS.map((fmt) => {
            const isSelected = options.targetFormat === fmt.id;
            const isDoc = fmt.category === 'document';

            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => onOptionsChange({ targetFormat: fmt.id })}
                className={`relative flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500'
                    : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-slate-700'
                }`}
              >
                {isDoc && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-200' : 'text-rose-500 dark:text-rose-400'}`}>
                    Doc
                  </span>
                )}
                <span className="text-xs font-bold tracking-tight">{fmt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Document specific controls if PDF is selected */}
      {options.targetFormat === 'application/pdf' && (
        <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              PDF Page Format
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Page Sizing</label>
              <select
                value={options.pdfPageSize || 'fit'}
                onChange={(e) =>
                  onOptionsChange({ pdfPageSize: e.target.value as 'fit' | 'a4' | 'letter' })
                }
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="fit">Fit Image Canvas (Auto)</option>
                <option value="a4">Standard A4 Sheet</option>
                <option value="letter">US Letter Sheet</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Orientation</label>
              <select
                value={options.pdfOrientation || 'auto'}
                onChange={(e) =>
                  onOptionsChange({
                    pdfOrientation: e.target.value as 'auto' | 'portrait' | 'landscape',
                  })
                }
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="auto">Auto (Match Aspect)</option>
                <option value="portrait">Portrait (Vertical)</option>
                <option value="landscape">Landscape (Horizontal)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. Quality Control (if format supports quality) */}
      {!isDocument && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              Compression Quality
            </label>
            {supportsQuality ? (
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                {Math.round(options.quality * 100)}%
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 italic">Lossless (100%)</span>
            )}
          </div>

          {supportsQuality ? (
            <div className="space-y-2">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.01"
                value={options.quality}
                onChange={(e) => onOptionsChange({ quality: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              />

              {!isLowUi && (
                <div className="flex items-center justify-between gap-1.5">
                  {[
                    { label: '50%', val: 0.5 },
                    { label: '80%', val: 0.8 },
                    { label: '90%', val: 0.9 },
                    { label: '100%', val: 1.0 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => onOptionsChange({ quality: p.val })}
                      className={`flex-1 py-1 px-1 text-[10px] font-medium rounded-md border transition-all cursor-pointer ${
                        Math.abs(options.quality - p.val) < 0.03
                          ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Lossless encoding preserves 100% pixel fidelity.</span>
            </div>
          )}
        </div>
      )}

      {/* 4. Dimension & Scaling Controls */}
      <div className="space-y-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            Dimensions & Resize
          </label>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={options.customDimensions}
              onChange={(e) =>
                onOptionsChange({
                  customDimensions: e.target.checked,
                  width: options.width || originalWidth,
                  height: options.height || originalHeight,
                })
              }
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {options.customDimensions && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Width (px)</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={options.width || originalWidth}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col items-center justify-center pt-4">
                <button
                  type="button"
                  onClick={() =>
                    onOptionsChange({ maintainAspectRatio: !options.maintainAspectRatio })
                  }
                  title={
                    options.maintainAspectRatio
                      ? 'Aspect ratio locked'
                      : 'Aspect ratio unlocked'
                  }
                  className={`p-1.5 rounded-md border transition-all cursor-pointer ${
                    options.maintainAspectRatio
                      ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {options.maintainAspectRatio ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Height (px)</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={options.height || originalHeight}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {[
                { label: '100%', scale: 100 },
                { label: '75%', scale: 75 },
                { label: '50%', scale: 50 },
                { label: '25%', scale: 25 },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => applyScalePreset(s.scale)}
                  className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => applyFixedPreset(1920, 1080)}
                className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                1080p
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
