import React from 'react';
import { Toaster, toast } from 'sonner';
import {
  Sparkles,
  Image as ImageIcon,
  ArrowRight,
} from 'lucide-react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { ConversionControls } from './components/ConversionControls';
import { ComparisonViewer } from './components/ComparisonViewer';
import { BatchQueue } from './components/BatchQueue';
import { FeatureCards } from './components/FeatureCards';
import { Footer } from './components/Footer';
import { useImageConverter } from './hooks/useImageConverter';
import { useTheme } from './hooks/useTheme';
import { generateSampleImageFile } from './lib/sampleImages';

export const App: React.FC = () => {
  const { theme, toggleTheme, uiMode, toggleUiMode, isLowUi } = useTheme();

  const {
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
  } = useImageConverter();

  const handleLoadSample = async () => {
    try {
      const sampleFile = await generateSampleImageFile();
      await addFiles([sampleFile]);
    } catch {
      toast.error('Failed to generate sample image');
    }
  };

  const hasFiles = items.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Toast Notifications */}
      <Toaster
        theme={theme === 'dark' ? 'dark' : 'light'}
        position="bottom-right"
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#0f172a' : '#ffffff',
            border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
          },
        }}
      />

      {/* Navigation Header with Theme Toggle & Low UI Switch */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        uiMode={uiMode}
        onToggleUiMode={toggleUiMode}
      />

      {/* Main Container */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 ${isLowUi ? 'py-4 sm:py-6 space-y-5' : 'py-8 sm:py-10 space-y-8'}`}>
        {/* Hero Section */}
        {!isLowUi ? (
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero Server Latency • Images, PDF & Word (.docx) Engine</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Convert Images & Documents{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-500">
                at Lightning Speed
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Convert between JPG, PNG, WEBP, AVIF, BMP, PDF and Word (.docx).
              Fine-tune quality, downscale dimensions, extract PDF pages, and export single files or bulk archives with{' '}
              <strong className="text-slate-900 dark:text-slate-200 font-semibold">100% in-browser privacy</strong>.
            </p>

            {/* Quick Demo CTA if no files */}
            {!hasFiles && (
              <div className="pt-1 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-sm"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Try Demo Image</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Low UI Compact Headline */
          <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Workspace
              </span>
              <span className="text-xs text-slate-400">• Low UI Mode Active</span>
            </div>
            {!hasFiles && (
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Load Sample</span>
              </button>
            )}
          </div>
        )}

        {/* Upload Dropzone */}
        <section aria-label="Image & Document Upload">
          <Dropzone onFilesDropped={addFiles} hasFiles={hasFiles} isLowUi={isLowUi} />
        </section>

        {/* Workspace: Conversion Editor */}
        {hasFiles && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Visual Preview & Comparison (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <ComparisonViewer
                  item={activeItem}
                  onDownload={downloadSingle}
                  isLowUi={isLowUi}
                />
              </div>

              {/* Right Column: Interactive Controls (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <ConversionControls
                  options={activeItem ? activeItem.options : globalOptions}
                  activeItem={activeItem}
                  totalItemsCount={items.length}
                  onOptionsChange={(newOptions) => {
                    if (activeItem) {
                      updateItemOptions(activeItem.id, newOptions);
                    } else {
                      updateGlobalOptions(newOptions, false);
                    }
                  }}
                  onApplyToAll={() => {
                    if (activeItem) {
                      updateGlobalOptions(activeItem.options, true);
                    }
                  }}
                  isProcessing={isProcessing}
                  isLowUi={isLowUi}
                />
              </div>
            </div>

            {/* Batch Queue & Bulk Download Section */}
            <BatchQueue
              items={items}
              activeItemId={activeItemId}
              onSelectItem={setActiveItemId}
              onRemoveItem={removeItem}
              onClearAll={clearAll}
              onDownloadSingle={downloadSingle}
              onDownloadAllZip={downloadAllZip}
              onExportAllMergedPdf={exportAllMergedPdf}
              onExportAllMergedDocx={exportAllMergedDocx}
              onConvertAll={convertAll}
              isProcessing={isProcessing}
              isZipping={isZipping}
              batchStats={batchStats}
              isLowUi={isLowUi}
            />
          </section>
        )}

        {/* Feature Cards (displayed when standard UI mode) */}
        {!isLowUi && <FeatureCards />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
