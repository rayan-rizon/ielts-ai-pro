import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Type, Moon, Sun, BookOpen, Check, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

const ReadingTestAppearance = ({ textSize, setTextSize, theme, setTheme }) => {
  // Text size presets mapping
  const sizeOptions = [
    { key: 'text-[15px]', label: 'Standard', sizeIndicator: 'text-xs' },
    { key: 'text-base', label: 'Large', sizeIndicator: 'text-sm' },
    { key: 'text-lg', label: 'Extra Large', sizeIndicator: 'text-base' },
  ];

  const handleIncreaseSize = () => {
    if (textSize === 'text-[15px]') setTextSize('text-base');
    else if (textSize === 'text-base') setTextSize('text-lg');
  };

  const handleDecreaseSize = () => {
    if (textSize === 'text-lg') setTextSize('text-base');
    else if (textSize === 'text-base') setTextSize('text-[15px]');
  };

  return (
    <Popover data-oid="u-i:l1w">
      <PopoverTrigger asChild data-oid="znw1anz">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-md shadow-slate-900/10 dark:shadow-black/40 text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 dark:hover:border-indigo-400 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer"
          title="Appearance Settings"
          data-oid="h34scq9"
        >
          <Type className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" data-oid="82qcs12" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-72 sm:w-76 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B0C1A]/95 backdrop-blur-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/60 mr-2 sm:mr-3 z-50 transition-all"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
        data-oid="dcyo2lz"
      >
        <div className="space-y-3" onClick={(e) => e.stopPropagation()} data-oid="z9fnmwb">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 shrink-0">
                <Type className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-none">
                Reading Display
              </h4>
            </div>
          </div>

          {/* Text Size Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Text Size
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handleDecreaseSize}
                  disabled={textSize === 'text-[15px]'}
                  className="p-0.5 rounded text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  title="Decrease size"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleIncreaseSize}
                  disabled={textSize === 'text-lg'}
                  className="p-0.5 rounded text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  title="Increase size"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Segmented Control */}
            <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/50">
              {sizeOptions.map((option) => {
                const isActive = textSize === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setTextSize(option.key)}
                    className={cn(
                      'flex flex-col items-center justify-center py-1 px-1 rounded-md text-[11px] font-semibold transition-all duration-200 select-none',
                      isActive
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs border border-slate-200/80 dark:border-slate-600'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <span
                      className={cn(
                        'font-serif font-black leading-none mb-0.5',
                        option.sizeIndicator
                      )}
                    >
                      Aa
                    </span>
                    <span className="text-[9.5px] font-medium leading-none">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paper Theme Section */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Paper Theme
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {/* White Theme */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={cn(
                  'flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all duration-200 relative group cursor-pointer',
                  theme === 'light'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500/20 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 hover:scale-[1.02]'
                )}
              >
                {theme === 'light' && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-2xs">
                    <Check className="w-2 h-2 stroke-[3]" />
                  </span>
                )}
                <div className="w-full h-7 bg-white border border-slate-200 rounded-md shadow-2xs flex flex-col justify-center px-1.5 gap-0.5 overflow-hidden">
                  <div className="h-0.5 w-full bg-slate-300/80 rounded-full" />
                  <div className="h-0.5 w-3/4 bg-slate-200 rounded-full" />
                </div>
                <div className="flex items-center gap-0.5">
                  <Sun className="w-2.5 h-2.5 text-amber-500" />
                  <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">
                    White
                  </span>
                </div>
              </button>

              {/* Sepia Theme */}
              <button
                type="button"
                onClick={() => setTheme('sepia')}
                className={cn(
                  'flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all duration-200 relative group cursor-pointer',
                  theme === 'sepia'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-500/20 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 hover:scale-[1.02]'
                )}
              >
                {theme === 'sepia' && (
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white rounded-full p-0.5 shadow-2xs">
                    <Check className="w-2 h-2 stroke-[3]" />
                  </span>
                )}
                <div className="w-full h-7 bg-[#f4ecd8] border border-[#e3d8b8] rounded-md shadow-2xs flex flex-col justify-center px-1.5 gap-0.5 overflow-hidden">
                  <div className="h-0.5 w-full bg-[#d8cbab] rounded-full" />
                  <div className="h-0.5 w-3/4 bg-[#e5dbc2] rounded-full" />
                </div>
                <div className="flex items-center gap-0.5">
                  <BookOpen className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
                  <span className="text-[10px] font-semibold text-amber-900 dark:text-amber-200">
                    Sepia
                  </span>
                </div>
              </button>

              {/* Dark Theme */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all duration-200 relative group cursor-pointer',
                  theme === 'dark'
                    ? 'border-indigo-500 bg-slate-800/80 ring-1 ring-indigo-500/20 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 hover:scale-[1.02]'
                )}
              >
                {theme === 'dark' && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-2xs">
                    <Check className="w-2 h-2 stroke-[3]" />
                  </span>
                )}
                <div className="w-full h-7 bg-[#0f172a] border border-slate-700 rounded-md shadow-2xs flex flex-col justify-center px-1.5 gap-0.5 overflow-hidden">
                  <div className="h-0.5 w-full bg-slate-600/80 rounded-full" />
                  <div className="h-0.5 w-3/4 bg-slate-700 rounded-full" />
                </div>
                <div className="flex items-center gap-0.5">
                  <Moon className="w-2.5 h-2.5 text-indigo-400" />
                  <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">
                    Dark
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReadingTestAppearance;
