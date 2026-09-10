import React, { memo } from 'react';
import {
  Trash2,
  Edit3,
  FileText,
  Languages,
  Lightbulb,
  BrainCircuit,
  Sparkles,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { PANEL } from '@/features/dashboard/components/primitives';

function TranslateAiIcon({ className, strokeWidth }) {
  return (
    <span className="relative inline-flex items-center justify-center shrink-0">
      <Languages className={className} strokeWidth={strokeWidth} />
      <Sparkles className="absolute -top-1 -right-1 size-2 text-[#5a63df] dark:text-[#afb5ff]" />
    </span>
  );
}

/**
 * Context menu for text highlighting in passages.
 * Displays color options for new highlights or edit/remove for existing ones.
 */
const HighlightMenu = memo(function HighlightMenu({
  position,
  onSelectColor,
  onRemove,
  onEdit,
  isExistingHighlight,
  currentSelection,
  setNewNote,
  setShowNotes,
  setShowHighlightMenu,
  assistantEnabled = false,
  onAssistantAction,
}) {
  const panelBounds = currentSelection?.panelBounds;
  const availableWidth = panelBounds
    ? Math.max(160, panelBounds.right - panelBounds.left - 16)
    : 300;
  const menuWidth = Math.min(300, availableWidth);
  const menuLeft = Math.max(
    Math.max(8, (panelBounds?.left || 0) + 8),
    Math.min(
      Math.max(8, (panelBounds?.right || window.innerWidth) - menuWidth - 8),
      position.x - menuWidth / 2
    )
  );

  const HIGHLIGHT_COLORS = [
    { color: '#fef08a', name: 'Yellow' },
    { color: '#bfdbfe', name: 'Blue' },
    { color: '#bbf7d0', name: 'Green' },
    { color: '#fbcfe8', name: 'Pink' },
    { color: '#fecaca', name: 'Red' },
  ];

  const handleAddNote = () => {
    if (currentSelection) {
      setNewNote(`Ref: "${currentSelection.text}"\n\n`);
      setShowNotes(true);
      setShowHighlightMenu(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 4 }}
      transition={{
        type: 'spring',
        stiffness: 450,
        damping: 32,
        mass: 0.7,
      }}
      className={cn(
        PANEL,
        'fixed z-50 p-2 shadow-xl shadow-slate-900/12 dark:shadow-black/50 border border-[#e4e2f0] dark:border-white/[0.08]'
      )}
      style={{
        top: Math.max(8, position.y - (assistantEnabled && !isExistingHighlight ? 80 : 48)),
        left: menuLeft,
        width: menuWidth,
      }}
      data-oid="n9wzmwc"
    >
      {/* Existing highlight actions */}
      {isExistingHighlight ? (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md bg-[#5a63df]/10 px-2.5 text-[11px] font-semibold text-[#5a63df] transition-colors hover:bg-[#5a63df]/20 active:scale-[0.96] dark:bg-[#8f97ff]/15 dark:text-[#afb5ff] cursor-pointer"
            title="Change Color"
            data-oid="bqhmu9s"
          >
            <Edit3 className="size-3" data-oid="08i-649" />
            <span>Change Color</span>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-rose-100 active:scale-[0.96] dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/40 cursor-pointer"
            title="Remove Highlight"
            data-oid="3shgceb"
          >
            <Trash2 className="size-3" data-oid="a83xgx." />
            <span>Remove</span>
          </button>
        </div>
      ) : (
        <>
          {/* Row 1: Swatches, Note, and Dismiss */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              {HIGHLIGHT_COLORS.map(({ color, name }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onSelectColor(color)}
                  className="size-5.5 rounded-full ring-1 ring-black/10 dark:ring-white/20 transition-transform duration-150 hover:scale-115 active:scale-95 shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
                  style={{ backgroundColor: color }}
                  title={`Highlight in ${name}`}
                  aria-label={`Highlight in ${name}`}
                  data-oid="d0dky0m"
                />
              ))}

              <button
                type="button"
                onClick={handleAddNote}
                className="grid size-6 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
                title="Add Note to Selection"
                aria-label="Add Note to Selection"
                data-oid="z8snz4n"
              >
                <FileText className="size-3.5" data-oid="8j3stya" />
              </button>
            </div>

            <button
              type="button"
              onClick={onRemove}
              className="grid size-6 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/[0.08] dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
              title="Cancel"
              aria-label="Cancel"
              data-oid="3shgceb"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Row 2: AI Sentence Actions (when enabled) */}
          {assistantEnabled && (
            <>
              <div className="my-1.5 h-px bg-[#e4e2f0] dark:bg-white/[0.07]" aria-hidden="true" />
              <div className="flex items-center gap-1">
                {[
                  ['simplify', 'Simplify', Lightbulb],
                  ['translate', 'Translate', TranslateAiIcon],
                  ['breakdown', 'Breakdown', BrainCircuit],
                ].map(([action, label, Icon]) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => onAssistantAction?.(action)}
                    className="flex flex-1 h-7 items-center justify-center gap-1.5 rounded-md border border-[#e4e2f0]/70 bg-[#f7f6fd] px-2 text-[11px] font-semibold text-slate-700 transition-all duration-150 hover:bg-[#5a63df]/10 hover:text-[#5a63df] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08] dark:hover:text-[#afb5ff] cursor-pointer"
                    title={label}
                  >
                    <Icon
                      className="size-3 shrink-0 text-[#5a63df] dark:text-[#afb5ff]"
                      strokeWidth={2.2}
                    />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </motion.div>
  );
});

HighlightMenu.displayName = 'HighlightMenu';

export default HighlightMenu;
