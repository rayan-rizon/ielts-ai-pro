/**
 * DebouncedInput - Optimized input component that prevents global re-renders on every keystroke.
 *
 * Instead of dispatching to global state on every character, it:
 * 1. Maintains local state for immediate UI feedback
 * 2. Syncs to global state on blur or after a 500ms delay
 *
 * This dramatically reduces re-renders in the parent component.
 */
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DebouncedInput = memo(function DebouncedInput({
  value: externalValue = '',
  onChange,
  debounceMs = 500,
  className,
  disabled,
  ...props
}) {
  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(externalValue);
  const debounceTimer = useRef(null);
  const isMounted = useRef(true);

  // Sync external value to local when it changes from outside
  useEffect(() => {
    setLocalValue(externalValue);
  }, [externalValue]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Handle local change with debounced sync
  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new debounce timer for global sync
      debounceTimer.current = setTimeout(() => {
        if (isMounted.current && onChange) {
          onChange(newValue);
        }
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  // Sync immediately on blur
  const handleBlur = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (onChange && localValue !== externalValue) {
      onChange(localValue);
    }
  }, [onChange, localValue, externalValue]);

  return (
    <Input
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      className={cn(
        'transition-colors',
        disabled && 'opacity-60 cursor-not-allowed bg-muted',
        className
      )}
      {...props}
      data-oid="cr60x5n"
    />
  );
});

export default DebouncedInput;
