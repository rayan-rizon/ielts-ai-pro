import React, { useState, useRef, useEffect, useMemo, useImperativeHandle } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Reusable accessible select element matching the Learner Panel & Admin design system.
 * Renders a custom styled floating listbox with brand colors, rounded corners,
 * search filtering, and checkmark indicators, eliminating the raw OS browser menu popup.
 * Keeps an underlying synchronized <select> for native form submissions (FormData)
 * and full compatibility with React Testing Library (fireEvent.change / getByLabelText).
 */
export const NativeSelect = React.forwardRef(
  (
    {
      className,
      wrapperClassName,
      menuClassName,
      children,
      disabled,
      value: controlledValue,
      defaultValue,
      onChange,
      name,
      id,
      'aria-label': ariaLabel,
      required,
      icon: Icon,
      searchable,
      placeholder,
      align = 'auto',
      ...props
    },
    forwardedRef
  ) => {
    // 1. Extract options from children (<option value="X">Label</option>)
    const options = useMemo(() => {
      const opts = [];
      React.Children.toArray(children).forEach((child) => {
        if (!React.isValidElement(child)) return;
        if (child.type === 'option') {
          const val = child.props.value !== undefined ? String(child.props.value) : '';
          const lbl = child.props.children !== undefined ? child.props.children : val;
          opts.push({
            value: val,
            label: lbl,
            disabled: Boolean(child.props.disabled),
          });
        }
      });
      return opts;
    }, [children]);

    // 2. Controlled vs Uncontrolled state
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState(() => {
      if (defaultValue !== undefined) return String(defaultValue);
      return options[0]?.value ?? '';
    });

    const currentValue = isControlled ? String(controlledValue ?? '') : internalValue;

    // 3. Dropdown open & search state
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [alignRight, setAlignRight] = useState(align === 'end' || align === 'right');
    const [openUpward, setOpenUpward] = useState(false);
    const containerRef = useRef(null);
    const nativeSelectRef = useRef(null);
    const searchInputRef = useRef(null);

    // Auto-detect whether dropdown should align right or flip upward to prevent clipping
    useEffect(() => {
      if (!open || !containerRef.current) return;

      const updatePosition = () => {
        if (!containerRef.current) return;
        const triggerRect = containerRef.current.getBoundingClientRect();

        const scrollParent = containerRef.current.closest(
          '[role="dialog"], [data-radix-portal], .overflow-y-auto, .overflow-hidden'
        );
        const boundaryRight = scrollParent
          ? scrollParent.getBoundingClientRect().right
          : window.innerWidth;
        const boundaryLeft = scrollParent ? scrollParent.getBoundingClientRect().left : 0;
        const boundaryBottom = scrollParent
          ? scrollParent.getBoundingClientRect().bottom
          : window.innerHeight;
        const boundaryTop = scrollParent ? scrollParent.getBoundingClientRect().top : 0;

        if (align === 'end' || align === 'right') {
          setAlignRight(true);
        } else if (align === 'start' || align === 'left') {
          setAlignRight(false);
        } else {
          const availableRight = boundaryRight - triggerRect.left;
          const availableLeft = triggerRect.right - boundaryLeft;
          const parentWidth = boundaryRight - boundaryLeft;

          if (
            (availableRight < 180 && availableLeft >= availableRight) ||
            triggerRect.left > boundaryLeft + parentWidth * 0.55
          ) {
            setAlignRight(true);
          } else {
            setAlignRight(false);
          }
        }

        const availableBottom = boundaryBottom - triggerRect.bottom;
        const availableTop = triggerRect.top - boundaryTop;
        if (availableBottom < 160 && availableTop > availableBottom) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }, [open, align]);

    useImperativeHandle(forwardedRef, () => nativeSelectRef.current);

    // Auto-focus search input when opened
    useEffect(() => {
      if (open && (searchable || options.length > 8)) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 30);
        return () => clearTimeout(timer);
      }
      setSearchQuery('');
    }, [open, searchable, options.length]);

    // Close on click outside or Escape
    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setOpen(false);
        }
      };
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [open]);

    // Find currently selected option
    const selectedOption = useMemo(() => {
      return options.find((o) => o.value === currentValue) || options[0];
    }, [options, currentValue]);

    const isPlaceholder = !currentValue || Boolean(selectedOption?.disabled);
    const displayLabel = selectedOption?.label ?? (currentValue || placeholder || 'Select…');

    // Filter options for search
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return options;
      const q = searchQuery.toLowerCase();
      return options.filter((o) => {
        if (o.disabled && !o.value) return false;
        return String(o.label).toLowerCase().includes(q);
      });
    }, [options, searchQuery]);

    // Handle user clicking an option in custom dropdown
    const handleSelectOption = (opt) => {
      if (opt.disabled) return;
      if (!isControlled) {
        setInternalValue(opt.value);
      }
      setOpen(false);
      setSearchQuery('');

      if (nativeSelectRef.current) {
        nativeSelectRef.current.value = opt.value;
        const nativeEvent = new Event('change', { bubbles: true });
        nativeSelectRef.current.dispatchEvent(nativeEvent);
      }

      const syntheticEvent = {
        target: { name: name || '', value: opt.value },
        currentTarget: { name: name || '', value: opt.value },
        bubbles: true,
      };
      onChange?.(syntheticEvent);
    };

    // Handle change dispatched on native select (e.g. testing library fireEvent.change)
    const handleNativeChange = (e) => {
      const val = e.target.value;
      if (!isControlled) {
        setInternalValue(val);
      }
      onChange?.(e);
    };

    const showSearch = (searchable ?? options.length > 8) && options.length > 5;

    return (
      <div ref={containerRef} className={cn('relative w-full min-w-0', wrapperClassName)}>
        {/* Synchronized accessible select (hidden from visual pointer to avoid raw OS popup) */}
        <select
          ref={nativeSelectRef}
          name={name}
          id={id}
          aria-label={ariaLabel}
          required={required}
          disabled={disabled}
          value={currentValue}
          onChange={handleNativeChange}
          tabIndex={-1}
          className="sr-only pointer-events-none absolute inset-0 -z-10 opacity-0"
          {...props}
        >
          {children}
        </select>

        {/* Custom styled trigger button */}
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          className={cn(
            'group flex h-9 w-full items-center justify-between rounded-lg border border-[#e4e2f0] bg-white px-3 py-1 text-xs font-medium text-foreground shadow-2xs transition-all duration-150',
            'hover:border-[#5a63df]/50 hover:bg-stone-50/50',
            'focus-visible:border-[#5a63df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/20',
            'disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer text-left',
            'dark:border-white/10 dark:bg-[#141319] dark:hover:border-white/20 dark:hover:bg-white/[0.02]',
            open && 'border-[#5a63df] ring-2 ring-[#5a63df]/20 dark:border-[#5a63df]',
            className
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {Icon && (
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground/75 transition-colors group-hover:text-foreground" />
            )}
            <span
              className={cn(
                'truncate',
                isPlaceholder ? 'text-muted-foreground font-normal' : 'text-foreground font-medium'
              )}
            >
              {displayLabel}
            </span>
          </div>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180 text-foreground',
              disabled && 'opacity-30'
            )}
          />
        </button>

        {/* Custom styled floating dropdown menu */}
        {open && (
          <div
            role="listbox"
            className={cn(
              'absolute z-50 max-h-64 overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-xl animate-in fade-in-0 zoom-in-95 dark:border-white/10 dark:bg-[#16151c] dark:shadow-black/60',
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
              alignRight ? 'right-0' : 'left-0',
              showSearch ? 'w-full min-w-[200px]' : 'w-full min-w-full',
              menuClassName
            )}
          >
            {showSearch && (
              <div className="border-b border-stone-200/80 bg-stone-50/70 p-2 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search options…"
                    className="h-8 w-full rounded-lg border border-stone-200/80 bg-white pl-8 pr-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-[#5a63df] focus:ring-1 focus:ring-[#5a63df]/20 dark:border-white/10 dark:bg-[#141319]"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setOpen(false);
                    }}
                  />
                </div>
              </div>
            )}

            <div className="max-h-52 overflow-y-auto p-1 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === currentValue;
                  const isPlaceholderOpt = opt.disabled && !opt.value;
                  if (isPlaceholderOpt && searchQuery) return null;
                  return (
                    <div
                      key={opt.value || 'placeholder'}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectOption(opt)}
                      title={typeof opt.label === 'string' ? opt.label : undefined}
                      className={cn(
                        'relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors',
                        isSelected
                          ? 'bg-[#5a63df]/12 text-[#5a63df] font-semibold dark:bg-[#5a63df]/20 dark:text-[#bfc3ff]'
                          : 'text-foreground hover:bg-[#5a63df]/8 hover:text-[#5a63df] dark:hover:bg-white/5 dark:hover:text-white',
                        opt.disabled && 'pointer-events-none opacity-40 text-muted-foreground'
                      )}
                    >
                      <span className="truncate min-w-0 flex-1">{opt.label}</span>
                      {isSelected && (
                        <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-[#5a63df] dark:text-[#bfc3ff]" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

NativeSelect.displayName = 'NativeSelect';

export default NativeSelect;
