import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Type, Moon, Sun, Monitor, Minus, Plus, Ruler } from 'lucide-react';

const ReadingTestAppearance = ({
  textSize,
  setTextSize,
  theme,
  setTheme,
  showRuler,
  setShowRuler,
}) => {
  // Text size presets mapping to Tailwind classes
  const sizeLabels = {
    'text-[15px]': 'Standard',
    'text-base': 'Large',
    'text-lg': 'Extra Large',
  };

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
          className="h-10 w-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105"
          title="Appearance Settings"
          data-oid="h34scq9"
        >
          <Type className="w-5 h-5" data-oid="82qcs12" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4 mr-4"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
        data-oid="dcyo2lz"
      >
        <div className="space-y-6" onClick={(e) => e.stopPropagation()} data-oid="z9fnmwb">
          <div className="space-y-1" data-oid=":aw:m.m">
            <h4 className="font-medium text-sm text-slate-900 dark:text-white" data-oid="finsegk">
              Text Size
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400" data-oid="d2oke.5">
              Adjust the reading passage text size.
            </p>

            <div
              className="flex items-center justify-between gap-4 mt-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800"
              data-oid="furw2d0"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDecreaseSize}
                disabled={textSize === 'text-[15px]'}
                className="h-8 w-8 hover:bg-white dark:hover:bg-slate-800"
                data-oid="-apj40s"
              >
                <Minus className="w-4 h-4" data-oid="rcq:9-6" />
              </Button>

              <span className="text-sm font-semibold min-w-[80px] text-center" data-oid=":45b2t0">
                {sizeLabels[textSize]}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleIncreaseSize}
                disabled={textSize === 'text-lg'}
                className="h-8 w-8 hover:bg-white dark:hover:bg-slate-800"
                data-oid="8njbem8"
              >
                <Plus className="w-4 h-4" data-oid="9:kxuql" />
              </Button>
            </div>
          </div>

          <div className="space-y-3" data-oid="64rj8oq">
            <h4 className="font-medium text-sm text-slate-900 dark:text-white" data-oid="45v_ysn">
              Paper Theme
            </h4>
            <div className="grid grid-cols-3 gap-2" data-oid="mh-mwnw">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-2 p-2 rounded-lg border transition-all ${
                  theme === 'light'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                data-oid="e1kn-og"
              >
                <div
                  className="w-full h-8 bg-white border border-slate-200 rounded-md shadow-sm"
                  data-oid="f5wlz_v"
                ></div>
                <span className="text-xs font-medium" data-oid="7c5pyqq">
                  White
                </span>
              </button>

              <button
                onClick={() => setTheme('sepia')}
                className={`flex flex-col items-center gap-2 p-2 rounded-lg border transition-all ${
                  theme === 'sepia'
                    ? 'border-blue-500 bg-amber-50/50 dark:bg-amber-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                data-oid=".7riko_"
              >
                <div
                  className="w-full h-8 bg-[#f4ecd8] border border-[#e3d8b8] rounded-md shadow-sm"
                  data-oid="k9b5d-f"
                ></div>
                <span className="text-xs font-medium" data-oid="rr9po-f">
                  Sepia
                </span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-2 p-2 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-slate-800/50'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                data-oid="xic0gvl"
              >
                <div
                  className="w-full h-8 bg-[#1e293b] border border-slate-700 rounded-md shadow-sm"
                  data-oid="mi244yf"
                ></div>
                <span className="text-xs font-medium" data-oid="5tnu853">
                  Dark
                </span>
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReadingTestAppearance;
