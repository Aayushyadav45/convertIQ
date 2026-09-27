import React from 'react';
import { Layers, Cpu, EyeOff, FileText } from 'lucide-react';

export const FeatureCards: React.FC = () => {
  const features = [
    {
      icon: EyeOff,
      title: '100% Private & In-Browser',
      description:
        'Your photos and documents never leave your device. All decoding, compression, and rendering run locally via Web Canvas APIs.',
      tag: 'Zero Cloud Storage',
      gradient: 'from-emerald-500/20 to-teal-500/5',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
    },
    {
      icon: Cpu,
      title: 'Hardware Accelerated Speed',
      description:
        'Powered by browser GPU pipelines and Canvas 2D engines for near-instantaneous format transformations under 30ms.',
      tag: 'Sub-30ms Latency',
      gradient: 'from-sky-500/20 to-blue-500/5',
      iconColor: 'text-sky-500 dark:text-sky-400',
    },
    {
      icon: FileText,
      title: 'PDF & Word (.docx) Support',
      description:
        'Extract multi-page PDF pages directly into images, or bundle multiple images into clean PDF documents and Word (.docx) files.',
      tag: 'Universal Docs',
      gradient: 'from-rose-500/20 to-orange-500/5',
      iconColor: 'text-rose-500 dark:text-rose-400',
    },
    {
      icon: Layers,
      title: 'Batch Processing & Zip Export',
      description:
        'Upload dozens of photos simultaneously, convert in parallel, and bundle everything into a single organized .zip archive.',
      tag: 'Bulk Automation',
      gradient: 'from-indigo-500/20 to-purple-500/5',
      iconColor: 'text-indigo-500 dark:text-indigo-400',
    },
  ];

  return (
    <div id="features" className="py-10 border-t border-slate-200 dark:border-slate-800/80">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Engineered for Speed, Documents & Total Privacy
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Say goodbye to sluggish web tools that upload your private photos and documents to remote servers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.title}
              className="group glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${feat.gradient} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform`}
              />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <Icon className={`w-4.5 h-4.5 ${feat.iconColor}`} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {feat.tag}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{feat.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feat.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
