import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { focusLabel, groupCategory } from '../../practiceLabels';
import { Check, ChevronDown, Search } from 'lucide-react';
import { MUTED } from '@/features/dashboard/components/primitives.jsx';

export const subject = (focus = '') => (focus.startsWith('listening:') ? 'Listening' : 'Reading');
export const date = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const familiarity = (value) =>
  ({ new: 'New questions', familiar: 'Familiar passage or audio', repeated: 'Practise again' })[
    value
  ] || 'Library questions';
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#131315]';

function getFamiliarityColorClass(value) {
  if (value === 'new') return 'font-medium text-emerald-600 dark:text-emerald-400';
  if (value === 'familiar') return 'font-medium text-amber-600 dark:text-amber-400';
  return 'font-normal text-slate-400 dark:text-slate-500';
}

function computeNextNavIndex(key, currentIndex, length) {
  if (key === 'Home') return 0;
  if (key === 'End') return length - 1;
  const delta = key === 'ArrowDown' ? 1 : -1;
  return (currentIndex + delta + length) % length;
}

function usePickerDismiss(pickerRef, listRef, triggerRef, setOpen) {
  useEffect(() => {
    const isInside = (node) =>
      Boolean(pickerRef.current?.contains(node) || listRef.current?.contains(node));
    const handlePointerDown = (event) => {
      if (!isInside(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isInside(event.target)) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pickerRef, listRef, triggerRef, setOpen]);
}

function SourceSetOption({ set, index, isActive, isSelected, onSelect, setOptionRef }) {
  const optionLabel = `${set.title} · ${focusLabel(groupCategory(set))} · ${familiarity(set.familiarity)}`;
  const badgeClass = getFamiliarityColorClass(set.familiarity);
  const stateClass = isSelected
    ? 'bg-[#5a63df]/10 font-bold text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#afb5ff]'
    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]';

  return (
    <button
      id={`practice-source-option-${set.id}`}
      ref={(element) => setOptionRef(index, element)}
      tabIndex={isActive ? 0 : -1}
      type="button"
      role="option"
      aria-label={optionLabel}
      aria-selected={isSelected}
      onClick={() => onSelect(set.id)}
      className={`${focusRing} flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${stateClass}`}
    >
      <span className="min-w-0">
        <span className="block font-semibold text-slate-800 dark:text-slate-100">{set.title}</span>
        <span className={`mt-0.5 block text-[11px] ${MUTED}`}>
          {focusLabel(groupCategory(set))} ·{' '}
          <span className={badgeClass}>{familiarity(set.familiarity)}</span>
        </span>
      </span>
      {isSelected && <Check size={14} className="shrink-0 text-[#5a63df] dark:text-[#afb5ff]" />}
    </button>
  );
}

/**
 * Positions the listbox against the trigger in viewport coordinates.
 *
 * The listbox is rendered through a portal on `document.body` rather than next
 * to the trigger. Inside Practice Lab the picker sits several levels deep in a
 * framer-motion panel, inside the app's scrolling content column — the old
 * absolutely-positioned panel was painted under the Question Type Library below
 * it, and raising z-index did nothing because the panels above it sit in their
 * own stacking contexts. A portal has no ancestor that can clip or out-paint it.
 */
function useAnchoredPosition(triggerRef, open, optionCount) {
  const [style, setStyle] = useState(null);

  useEffect(() => {
    if (!open) {
      setStyle(null);
      return undefined;
    }

    const place = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const gutter = 8;
      const below = window.innerHeight - rect.bottom - gutter;
      const above = rect.top - gutter;
      // Roughly 49px per row plus the filter box, capped so the list never eats
      // the whole viewport.
      const wanted = Math.min(320, optionCount * 49 + 56);
      const flip = below < Math.min(wanted, 200) && above > below;
      setStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(160, Math.min(wanted, flip ? above : below)),
        ...(flip ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
      });
    };

    place();
    // Any scroll in any container moves the trigger, so recompute on capture.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [triggerRef, open, optionCount]);

  return style;
}

function useFilteredSets(sets, query) {
  // 40+ source sets is a scroll-and-hope list without a filter.
  return useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return sets;
    return sets.filter((set) =>
      `${set.title} ${focusLabel(groupCategory(set))} ${familiarity(set.familiarity)}`
        .toLowerCase()
        .includes(term)
    );
  }, [sets, query]);
}

const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

function usePickerState(sets, value, onChange) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const pickerRef = useRef(null);
  const listRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const selected = sets.find((set) => set.id === value) || sets[0];
  const visibleSets = useFilteredSets(sets, query);
  const selectedIndex = Math.max(
    0,
    visibleSets.findIndex((set) => set.id === selected?.id)
  );

  usePickerDismiss(pickerRef, listRef, triggerRef, setOpen);
  const position = useAnchoredPosition(triggerRef, open, visibleSets.length);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex, visibleSets.length]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const toggle = () => {
    setActiveIndex(selectedIndex);
    setOpen((previous) => !previous);
  };
  const onTriggerKeyDown = (event) => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setActiveIndex(selectedIndex);
    setOpen(true);
  };
  const onListKeyDown = (event) => {
    if (event.key === 'Tab') {
      close();
      return;
    }
    if (!NAV_KEYS.includes(event.key)) return;
    event.preventDefault();
    if (!visibleSets.length) return;
    setActiveIndex((index) => computeNextNavIndex(event.key, index, visibleSets.length));
  };

  return {
    open,
    query,
    activeIndex,
    pickerRef,
    listRef,
    triggerRef,
    selected,
    visibleSets,
    position,
    toggle,
    onTriggerKeyDown,
    onListKeyDown,
    onSearch: (term) => {
      setQuery(term);
      setActiveIndex(0);
    },
    onSelect: (id) => {
      onChange(id);
      close();
    },
    setOptionRef: (index, element) => {
      optionRefs.current[index] = element;
    },
  };
}

function PickerSearch({ count, query, onSearch }) {
  return (
    <div className="shrink-0 border-b border-[#eeedf7] p-2 dark:border-white/10">
      <div className="relative">
        <Search
          size={13}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={`Filter ${count} source sets…`}
          aria-label="Filter source sets"
          className={`${focusRing} w-full rounded-md border border-[#e2e5f2] bg-[#fbfbfe] py-1.5 pl-7 pr-2 text-xs font-medium text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-100`}
        />
      </div>
    </div>
  );
}

function PickerOptions({ picker }) {
  if (!picker.visibleSets.length) {
    return (
      <p className={`px-2.5 py-3 text-xs ${MUTED}`}>No source set matches “{picker.query}”.</p>
    );
  }
  return picker.visibleSets.map((set, index) => (
    <SourceSetOption
      key={set.id}
      set={set}
      index={index}
      isActive={index === picker.activeIndex}
      isSelected={set.id === picker.selected?.id}
      onSelect={picker.onSelect}
      setOptionRef={picker.setOptionRef}
    />
  ));
}

function TriggerLabel({ selected, open }) {
  return (
    <>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
          {selected ? selected.title : 'Choose a source set'}
        </span>
        {selected && (
          <span className="shrink-0 rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 text-[10.5px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
            {familiarity(selected.familiarity)}
          </span>
        )}
      </div>
      <ChevronDown
        size={15}
        className={`shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400 ${
          open ? 'rotate-180 text-[#5a63df] dark:text-[#afb5ff]' : ''
        }`}
      />
    </>
  );
}

const OPEN_BORDER =
  'border-[#5a63df] ring-2 ring-[#5a63df]/20 dark:border-[#8f97ff] dark:ring-[#8f97ff]/25';

const activeOptionId = ({ open, visibleSets, activeIndex }) =>
  open && visibleSets[activeIndex]
    ? `practice-source-option-${visibleSets[activeIndex].id}`
    : undefined;

export default function SourceSetPicker({ sets, value, onChange }) {
  const picker = usePickerState(sets, value, onChange);
  const { open, position } = picker;
  // Two pickers render on this page; a shared literal id made `aria-controls`
  // and every `aria-activedescendant` ambiguous.
  const listboxId = `practice-source-options-${useId()}`;

  const listbox = (
    <div
      ref={picker.listRef}
      id={listboxId}
      role="listbox"
      aria-label="Available source sets"
      onKeyDown={picker.onListKeyDown}
      style={position ?? undefined}
      className="z-[100] flex flex-col overflow-hidden rounded-xl border border-[#e4e2f0] bg-white shadow-sm dark:border-white/[0.12] dark:bg-[#15141c]"
    >
      {sets.length > 6 && (
        <PickerSearch count={sets.length} query={picker.query} onSearch={picker.onSearch} />
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        <PickerOptions picker={picker} />
      </div>
    </div>
  );

  return (
    <div ref={picker.pickerRef} className="relative">
      <button
        ref={picker.triggerRef}
        type="button"
        role="combobox"
        aria-label="Choose a source set"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId(picker)}
        onClick={picker.toggle}
        onKeyDown={picker.onTriggerKeyDown}
        className={`${focusRing} flex min-h-[42px] w-full items-center justify-between gap-3 rounded-lg border border-[#cfcddf] bg-white px-3 py-2 text-left text-xs transition-[border-color,box-shadow] duration-150 ease-out hover:border-[#5a63df] dark:border-white/20 dark:bg-[#15141c] dark:hover:border-[#8f97ff] ${open ? OPEN_BORDER : ''}`}
      >
        <TriggerLabel selected={picker.selected} open={open} />
      </button>
      {open && position && typeof document !== 'undefined'
        ? createPortal(listbox, document.body)
        : null}
    </div>
  );
}
