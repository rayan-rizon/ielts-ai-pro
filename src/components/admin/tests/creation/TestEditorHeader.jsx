import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, Save, ShieldCheck, Undo2, Redo2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, PANEL } from '@/features/dashboard/components/primitives.jsx';
import { AdminButton, PILL_BASE, pillTone } from '../../ui/primitives';

export default function TestEditorHeader({
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
  leftActions,
  history,
  children,
}) {
  const updateMeta = (field, value) => onMetadataChange({ ...metadata, [field]: value });
  const ModuleIcon = theme?.icon || ShieldCheck;
  return (
    <header
      className={cn(PANEL, 'sticky top-0 z-50 p-3 sm:p-4 space-y-2.5 shadow-none rounded-xl')}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2.5">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back"
          className="h-9 w-9 grid place-items-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5a63df]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <ModuleIcon className="hidden sm:block h-4 w-4 shrink-0 text-stone-500" />
          <Input
            aria-label="Test title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled test"
            className="shadow-none h-9 min-w-0 w-full text-sm sm:text-base font-bold tracking-tight rounded-lg border-transparent bg-transparent px-2 hover:bg-stone-50 dark:hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-[#5a63df] transition-colors"
          />
        </div>
        <div className="col-span-2 md:col-span-1 flex items-center justify-between md:justify-end gap-2 min-w-0">
          <div className="flex items-center gap-1 shrink-0">
            {history &&
              [
                ['Undo', Undo2, history.undo, history.canUndo],
                ['Redo', Redo2, history.redo, history.canRedo],
              ].map(([label, Icon, action, enabled]) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  title={label}
                  onClick={action}
                  disabled={!enabled || isSaving}
                  className="h-9 px-2 inline-flex items-center gap-1.5 rounded-lg border border-[#e4e2f0] dark:border-white/[0.07] text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 disabled:opacity-35 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5a63df]"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            {leftActions}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <AdminButton variant="ghost" onClick={onCancel}>
              Cancel
            </AdminButton>
            <AdminButton onClick={() => onSave(false)} loading={isSaving} disabled={isSaving}>
              {!isSaving && <Save className="h-3.5 w-3.5" />}{' '}
              {isSaving ? 'Saving…' : 'Save changes'}
            </AdminButton>
          </div>
        </div>
      </div>
      {/* Metadata Pills Container */}
      <div className="flex flex-wrap items-center gap-2 min-w-0 border-t border-[#e4e2f0] dark:border-white/[0.07] pt-2.5">
        {/* Access Pill */}
        <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-stone-200/80 dark:border-white/[0.07] bg-stone-50 dark:bg-white/3 shrink-0">
          <span className={cn(MICRO, 'text-stone-400 dark:text-stone-500')}>Access</span>
          <Select
            value={metadata.access_tier || 'free'}
            onValueChange={(v) => updateMeta('access_tier', v)}
          >
            <SelectTrigger
              aria-label="Access tier"
              className="shadow-none h-6 w-auto gap-1 border-0 bg-transparent p-0 text-[11px] font-bold focus:ring-0 text-stone-900 dark:text-stone-100 min-w-[44px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="shadow-none rounded-lg border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-[#19181f] max-h-64">
              <SelectGroup>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Active Toggle (Optional) */}
        {showActiveToggle && (
          <div className="flex items-center gap-2 px-2.5 h-8 rounded-md border border-stone-200/80 dark:border-white/[0.07] bg-stone-50 dark:bg-white/3 shrink-0">
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
              className=""
            />
          </div>
        )}

        {/* Official Cambridge Pill */}
        <div
          className={cn(
            PILL_BASE,
            'h-8 px-2.5 gap-1.5 cursor-default',
            metadata.is_official_cambridge ? pillTone('accent') : pillTone('neutral')
          )}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Official</span>
          <Checkbox
            checked={!!metadata.is_official_cambridge}
            onCheckedChange={(c) => updateMeta('is_official_cambridge', c)}
            aria-label="Official Cambridge test"
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
              <SelectTrigger
                aria-label="Cambridge year"
                className="shadow-none h-8 w-24 rounded-md border-stone-200/80 dark:border-white/[0.07] bg-stone-50 dark:bg-white/3 text-[11px] font-bold text-stone-700 dark:text-stone-200"
              >
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="shadow-none rounded-lg border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-[#19181f] max-h-64">
                <SelectGroup>
                  {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i + 1).map(
                    (y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    )
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={String(metadata.cambridge_test_number || 1)}
              onValueChange={(v) => updateMeta('cambridge_test_number', parseInt(v))}
            >
              <SelectTrigger
                aria-label="Cambridge test number"
                className="shadow-none h-8 w-24 rounded-md border-stone-200/80 dark:border-white/[0.07] bg-stone-50 dark:bg-white/3 text-[11px] font-bold text-stone-700 dark:text-stone-200"
              >
                <SelectValue placeholder="Test #" />
              </SelectTrigger>
              <SelectContent className="shadow-none rounded-lg border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-[#19181f] max-h-64">
                <SelectGroup>
                  {[1, 2, 3, 4].map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      Test {num}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Slot for extra controls (e.g. Show Passage) */}
        {children}
      </div>
      {lastSaved && (
        <p role="status" className="text-[10px] font-mono text-stone-500">
          Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </header>
  );
}
