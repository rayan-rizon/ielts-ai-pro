import React from 'react';
import { Input } from '@/components/ui/input';
import { NativeSelect } from './NativeSelect';
import { MICRO, MUTED } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

export const Field = ({ label, children, hint }) => (
  <label className="block min-w-0 space-y-1">
    <div className="flex items-center justify-between">
      <span className={cn(MICRO, MUTED, 'text-[10px] font-bold tracking-[0.14em]')}>{label}</span>
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </div>
    {children}
  </label>
);

export const Text = ({ label, name, value, required = false, type = 'text', hint, ...rest }) => (
  <Field label={label} hint={hint}>
    <Input
      name={name}
      defaultValue={value}
      required={required}
      type={type}
      aria-label={label}
      className="h-8.5 rounded-lg border border-[#e4e2f0] bg-white px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground transition-all duration-150 hover:border-[#5a63df]/40 focus-visible:border-[#5a63df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/20 dark:border-white/10 dark:bg-[#141319] dark:text-slate-100 dark:placeholder:text-stone-500 shadow-2xs"
      {...rest}
    />
  </Field>
);

export const Select = ({ label, name, children, value, hint, ...rest }) => (
  <Field label={label} hint={hint}>
    <NativeSelect name={name} defaultValue={value} aria-label={label} {...rest}>
      {children}
    </NativeSelect>
  </Field>
);
