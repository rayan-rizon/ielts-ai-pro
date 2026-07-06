import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PenTool, Headphones, Mic, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const modules = [
  {
    id: 'reading',
    label: 'Reading',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
    description: 'Comprehension & speed',
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: PenTool,
    color: 'from-orange-500 to-amber-500',
    description: 'Essays & tasks',
  },
  {
    id: 'listening',
    label: 'Listening',
    icon: Headphones,
    color: 'from-violet-500 to-purple-500',
    description: 'Audio & notes',
  },
  {
    id: 'speaking',
    label: 'Speaking',
    icon: Mic,
    color: 'from-rose-500 to-pink-500',
    description: 'Fluency & confidence',
  },
];

export default function FocusStep({ weakArea, onChangeWeakArea }) {
  return (
    <div className="grid grid-cols-2 gap-4 py-4 px-2" data-oid="fqr1nxi">
      {modules.map((m) => {
        const Icon = m.icon;
        const isSelected = weakArea === m.id;

        return (
          <motion.button
            key={m.id}
            onClick={() => onChangeWeakArea(m.id)}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative p-4 sm:p-5 rounded-[1.5rem] border-2 text-left transition-all duration-500 group h-36 flex flex-col justify-between',
              isSelected
                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-2xl shadow-primary/20'
                : 'border-border bg-card/40 dark:bg-slate-800 dark:border-slate-700 hover:dark:bg-slate-800/80 hover:border-primary/30 hover:bg-card/60'
            )}
            data-oid="7zfq8kj"
          >
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-500',
                isSelected
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-secondary dark:bg-white/10 group-hover:bg-primary/10 group-hover:text-primary'
              )}
              data-oid="7agspu."
            >
              <Icon className="w-5 h-5" data-oid="0p2o-bs" />
            </div>

            <div data-oid="as._o2p">
              <div
                className={cn(
                  'text-lg font-black tracking-tight transition-colors duration-300',
                  isSelected
                    ? 'text-foreground dark:text-white'
                    : 'text-muted-foreground dark:text-slate-300 group-hover:text-foreground dark:group-hover:text-white'
                )}
                data-oid="1ghgppn"
              >
                {m.label}
              </div>
              <div
                className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 dark:text-slate-400 uppercase tracking-tight sm:tracking-widest leading-none mt-1"
                data-oid="5dpeqb6"
              >
                {m.description}
              </div>
            </div>

            {isSelected && (
              <motion.div
                layoutId="focus-check"
                className="absolute top-6 right-6"
                data-oid="9ignol1"
              >
                <div
                  className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                  data-oid="gqz2pg7"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" data-oid="vhhbvuy" />
                </div>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
