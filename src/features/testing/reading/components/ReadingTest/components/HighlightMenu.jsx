import React, { memo } from 'react';
import { Trash2, Edit3, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

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
}) {
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
      initial={{ opacity: 0, scale: 0.9, y: 10, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, y: 10, filter: 'blur(10px)' }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.8,
      }}
      className="fixed z-50 bg-background/95 dark:bg-slate-900/95 backdrop-blur-xl p-1.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/30 dark:border-white/10 flex gap-2 items-center ring-1 ring-black/5 dark:ring-white/10"
      style={{ top: position.y - 60, left: position.x - 80 }}
      data-oid="n9wzmwc"
    >
      {/* Color selection for new highlights */}
      {!isExistingHighlight &&
        HIGHLIGHT_COLORS.map(({ color, name }) => (
          <button
            key={color}
            onClick={() => onSelectColor(color)}
            className="w-6 h-6 rounded-full border border-white/40 dark:border-slate-600/30 hover:scale-125 hover:rotate-6 active:scale-90 transition-all duration-200 shadow-sm"
            style={{ backgroundColor: color }}
            title={`Highlight in ${name}`}
            data-oid="d0dky0m"
          />
        ))}

      {/* Edit button for existing highlights */}
      {isExistingHighlight && (
        <button
          onClick={onEdit}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-[#5a63df]/10 dark:bg-[#5a63df]/20 hover:bg-[#5a63df]/20 dark:hover:bg-[#5a63df]/30 hover:scale-110 active:scale-90 transition-all duration-200"
          title="Change Color"
          data-oid="bqhmu9s"
        >
          <Edit3 className="w-3 h-3 text-[#5a63df] dark:text-[#a9afff]" data-oid="08i-649" />
        </button>
      )}

      {/* Add note button for new selections */}
      {!isExistingHighlight && (
        <button
          onClick={handleAddNote}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-amber-100/80 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-800/60 hover:scale-110 active:scale-90 transition-all duration-200"
          title="Add Note to Selection"
          data-oid="z8snz4n"
        >
          <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" data-oid="8j3stya" />
        </button>
      )}

      {/* Remove/Cancel button */}
      <button
        onClick={onRemove}
        className="w-6 h-6 flex items-center justify-center rounded-md bg-red-100/80 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-800/60 hover:scale-110 active:scale-90 transition-all duration-200"
        title={isExistingHighlight ? 'Remove Highlight' : 'Cancel'}
        data-oid="3shgceb"
      >
        <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" data-oid="a83xgx." />
      </button>
    </motion.div>
  );
});

HighlightMenu.displayName = 'HighlightMenu';

export default HighlightMenu;
