import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { countries } from '@/lib/countries';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function CountryAutocomplete({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const country = countries.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen} data-oid=".tqj68o">
      <PopoverTrigger asChild data-oid="_.4g4c0">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-8 w-[150px] justify-between text-[11px] font-medium bg-white dark:bg-[#131315] border-stone-300 dark:border-white/15 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors rounded-md"
          data-oid="jl6r3s0"
        >
          {country ? (
            <span className="flex items-center gap-2 truncate" data-oid="z6hl:vy">
              <span className="opacity-60" data-oid="qi_z-th">
                {country.code}
              </span>
              <span className="truncate" data-oid="1..ouh3">
                {country.name}
              </span>
            </span>
          ) : (
            'Select country...'
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" data-oid="mw6r0e1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0 shadow-2xl border-border/50"
        align="start"
        data-oid="jnqf37g"
      >
        <Command className="bg-popover" data-oid="rxgpa9y">
          <CommandInput
            placeholder="Search country..."
            className="h-8 text-xs border-none focus:ring-0"
            data-oid="-zhsl2g"
          />

          <CommandList
            className="max-h-[240px] scrollbar-thin scrollbar-thumb-muted"
            data-oid="6_fzenb"
          >
            <CommandEmpty className="py-4 text-xs text-muted-foreground" data-oid="gwxsnco">
              No country found.
            </CommandEmpty>
            <CommandGroup data-oid="wth0o5t">
              {countries.map((c) => (
                <CommandItem
                  key={c.code}
                  value={c.name}
                  onSelect={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className="text-xs py-2 cursor-pointer hover:bg-primary/5 data-[selected=true]:bg-primary/10 transition-colors"
                  data-oid="e-g8nm4"
                >
                  <Check
                    className={cn(
                      'mr-2 h-3 w-3 text-primary transition-opacity',
                      value === c.code ? 'opacity-100' : 'opacity-0'
                    )}
                    data-oid="fihclvp"
                  />

                  <span className="flex-1 shrink-0" data-oid="2fa5u4n">
                    {c.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground opacity-50" data-oid="b7sh75b">
                    {c.code}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
