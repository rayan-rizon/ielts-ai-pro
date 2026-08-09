import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import { MICRO, PANEL } from '@/components/admin/ui/primitives';

/**
 * Form furniture shared by the three Communications panels, so a schedule
 * field or a severity picker looks and behaves identically whether you are
 * writing a broadcast, a banner, or a maintenance notice.
 */

export const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';

export const FieldLabel = ({ children, className, htmlFor }) => (
  <label
    htmlFor={htmlFor}
    className={cn(MICRO, 'mb-1.5 block text-stone-500 dark:text-stone-400', className)}
  >
    {children}
  </label>
);

export const Field = ({ label, hint, children, className, htmlFor }) => (
  <div className={className}>
    {label && <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>}
    {children}
    {hint && (
      <p className="mt-1 text-[10px] font-medium leading-snug text-stone-400 dark:text-stone-500">
        {hint}
      </p>
    )}
  </div>
);

export const TextField = ({ label, hint, className, ...props }) => (
  <Field label={label} hint={hint} className={className} htmlFor={props.id}>
    <Input {...props} className={cn(FIELD_INPUT, 'w-full', props.className)} />
  </Field>
);

export const TextAreaField = ({ label, hint, rows = 4, className, ...props }) => (
  <Field label={label} hint={hint} className={className} htmlFor={props.id}>
    <Textarea
      rows={rows}
      {...props}
      className={cn(
        'resize-none rounded-md border-stone-300 bg-white p-2.5 text-xs font-medium dark:border-white/15 dark:bg-[#131315]',
        props.className
      )}
    />
  </Field>
);

import { ThemedDateTimePicker } from '@/components/admin/ui/ThemedDateTimePicker';

/** A themed date/time picker control that reads and writes ISO strings. */
export const DateTimeField = ({ label, hint, value, onChange, className, id }) => (
  <Field label={label} hint={hint} className={className} htmlFor={id}>
    <ThemedDateTimePicker
      id={id}
      value={value}
      onChange={(val) => onChange(val || null)}
      placeholder="Select date & time"
    />
  </Field>
);

/** Segmented single-choice control — severity, audience, priority. */
export const OptionGroup = ({ label, hint, options, value, onChange, columns, className }) => (
  <Field label={label} hint={hint} className={className}>
    <div
      className={cn('grid gap-1.5')}
      style={{ gridTemplateColumns: `repeat(${columns || options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={cn(
              'flex h-9 items-center justify-center gap-1.5 rounded-md border px-2 text-[11px] font-bold transition-colors',
              active
                ? cn(
                    option.ring || 'border-stone-400 dark:border-white/30',
                    'bg-stone-50 text-stone-900 dark:bg-white/6 dark:text-stone-50'
                  )
                : 'border-stone-200 text-stone-500 hover:border-stone-300 dark:border-white/10 dark:text-stone-400 dark:hover:border-white/20'
            )}
          >
            {option.dot && <span className={cn('h-1.5 w-1.5 rounded-full', option.dot)} />}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  </Field>
);

/** Label + description on the left, switch on the right. */
export const ToggleRow = ({ label, description, checked, onCheckedChange, disabled }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="min-w-0">
      <p className="text-xs font-extrabold text-stone-900 dark:text-stone-50">{label}</p>
      {description && (
        <p className="mt-0.5 text-[11px] font-medium leading-snug text-stone-500 dark:text-stone-400">
          {description}
        </p>
      )}
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="shrink-0"
    />
  </div>
);

/** Panel shell with an icon, title, and subtitle header. */
export const PanelCard = ({ icon: Icon, title, subtitle, action, children, className }) => (
  <div className={cn(PANEL, 'overflow-hidden', className)}>
    <div className="flex items-center gap-2.5 border-b border-stone-100 px-4 py-3 dark:border-white/6">
      {Icon && (
        <div className="rounded-md bg-stone-100 p-1.5 text-stone-500 dark:bg-white/6 dark:text-stone-300">
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-50">{title}</h3>
        {subtitle && (
          <p className={cn(MICRO, 'mt-0.5 text-stone-500 dark:text-stone-400')}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
    <div className="space-y-4 p-4">{children}</div>
  </div>
);

/**
 * The neutral surface every live preview sits on, so previews read as
 * "this is what the user sees" rather than as more admin chrome.
 */
export const PreviewFrame = ({ label, children, className }) => (
  <div className={cn(PANEL, 'flex h-full flex-col p-4', className)}>
    <p className={cn(MICRO, 'mb-3 text-stone-500 dark:text-stone-400')}>{label}</p>
    <div className="rounded-lg bg-[#f8f7fc] p-4 dark:bg-white/4">{children}</div>
  </div>
);
