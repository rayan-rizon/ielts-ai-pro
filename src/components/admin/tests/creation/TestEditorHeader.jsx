import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, Save, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AdminButton, MICRO, PILL_BASE, pillTone } from '../../ui/primitives';

/**
 * Reusable Header for all Test Editors
 * Standardizes layout, styling, and metadata controls to the admin
 * instrument-panel system — graphite surfaces, hairline rules, no per-module
 * color (module identity is the icon only, see TestCreator's BASE_THEME).
 */
const TestEditorHeader = ({
  title,
  theme,
  metadata = {},
  onMetadataChange,
  onTitleChange,
  onSave,
  onCancel,
  isSaving,
  lastSaved,
  showActiveToggle = false,
  leftActions /* Slot for undo/redo */,
  children /* Slot for extra buttons like "Show Passage" */,
}) => {
  // Helper to update specific metadata field
  const updateMeta = (field, value) => {
    onMetadataChange({ ...metadata, [field]: value });
  };

  const ModuleIcon = theme?.icon || ShieldCheck;

  return (
    <div className="px-4 sm:px-6 py-3 bg-white dark:bg-[#131315] border-b border-stone-200/80 dark:border-white/[0.07] sticky top-0 z-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full min-w-0">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back"
          className="shrink-0 h-8 w-8 grid place-items-center rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors active:scale-90"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0 bg-stone-100 dark:bg-white/4 text-stone-600 dark:text-stone-300">
          <ModuleIcon className="w-4 h-4" />
        </div>

        <div className="flex flex-col gap-1 w-full min-w-0">
          <div className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-6">
            <div className="flex-1 min-w-0">
              <Input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="font-extrabold text-lg border-transparent px-0 hover:px-2 hover:bg-stone-50 dark:hover:bg-white/3 focus:bg-white dark:focus:bg-white/3 border-b-2 border-b-transparent focus:border-b-stone-400 dark:focus:border-b-white/20 transition-all h-9 w-full focus-visible:ring-0 bg-transparent text-stone-900 dark:text-stone-50 placeholder:text-stone-400 dark:placeholder:text-stone-600 tracking-tight rounded-none"
                placeholder="Untitled Test"
              />
            </div>

            {/* Metadata Pills Container */}
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {/* Access Pill */}
              <div className="flex items-center gap-1.5 px-2.5 h-7 rounded-md border border-stone-200/80 dark:border-white/[0.07] bg-stone-50 dark:bg-white/3 shrink-0">
                <span className={cn(MICRO, 'text-stone-400 dark:text-stone-500')}>Access</span>
                <Select
                  value={metadata.access_tier || 'free'}
                  onValueChange={(v) => updateMeta('access_tier', v)}
                >
                  <SelectTrigger className="h-4 w-auto gap-1 border-0 bg-transparent p-0 text-[11px] font-bold focus:ring-0 text-stone-900 dark:text-stone-100 min-w-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Toggle (Optional) */}
              {showActiveToggle && (
                <div className="flex items-center gap-2 px-2.5 h-7 rounded-md border border-stone-200/80 dark:border-white/[0.07] bg-stone-50 dark:bg-white/3 shrink-0">
                  <label
                    htmlFor="active-switch"
                    className={cn(MICRO, 'text-stone-400 dark:text-stone-500 cursor-pointer')}
                  >
                    Active
                  </label>
                  <Switch
                    id="active-switch"
                    checked={!!metadata.is_active}
                    onCheckedChange={(c) => updateMeta('is_active', c)}
                    className="scale-75 origin-left"
                  />
                </div>
              )}

              {/* Official Cambridge Pill */}
              <div
                className={cn(
                  PILL_BASE,
                  'h-7 px-2.5 gap-1.5 cursor-default',
                  metadata.is_official_cambridge ? pillTone('accent') : pillTone('neutral')
                )}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Official</span>
                <Checkbox
                  checked={!!metadata.is_official_cambridge}
                  onCheckedChange={(c) => updateMeta('is_official_cambridge', c)}
                  className="h-3.5 w-3.5 rounded"
                />
              </div>

              {/* Cambridge Year/Num Selectors */}
              {metadata.is_official_cambridge && (
                <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200 shrink-0">
                  <Select
                    value={String(metadata.cambridge_year || new Date().getFullYear())}
                    onValueChange={(v) => updateMeta('cambridge_year', parseInt(v))}
                  >
                    <SelectTrigger className="h-7 w-24 rounded-md border-stone-200/80 dark:border-white/[0.07] bg-stone-50 dark:bg-white/3 text-[11px] font-bold text-stone-700 dark:text-stone-200">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i + 1).map(
                        (y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(metadata.cambridge_test_number || 1)}
                    onValueChange={(v) => updateMeta('cambridge_test_number', parseInt(v))}
                  >
                    <SelectTrigger className="h-7 w-24 rounded-md border-stone-200/80 dark:border-white/[0.07] bg-stone-50 dark:bg-white/3 text-[11px] font-bold text-stone-700 dark:text-stone-200">
                      <SelectValue placeholder="Test #" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((num) => (
                        <SelectItem key={num} value={String(num)}>
                          Test {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Slot for extra controls (e.g. Show Passage) */}
              {children}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-between lg:justify-end mt-2 lg:mt-0">
        {/* Left Actions Slot (Undo/Redo) */}
        {leftActions && (
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-white/4 p-1 rounded-md">
            {leftActions}
          </div>
        )}

        {/* Last Saved Indicator */}
        {lastSaved && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 h-7 rounded-md border border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)] text-[rgb(var(--signal-ok))] animate-in fade-in">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-[rgb(var(--signal-ok))]" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[rgb(var(--signal-ok))]" />
            </span>
            <span className={cn(MICRO, 'text-[rgb(var(--signal-ok))]')}>
              Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        <div className="flex gap-2 w-full sm:w-auto">
          <AdminButton variant="ghost" onClick={onCancel} className="uppercase tracking-widest">
            Cancel
          </AdminButton>
          <AdminButton
            onClick={() => onSave(false)}
            loading={isSaving}
            className="uppercase tracking-widest"
          >
            {!isSaving && <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </AdminButton>
        </div>
      </div>
    </div>
  );
};

export default TestEditorHeader;
