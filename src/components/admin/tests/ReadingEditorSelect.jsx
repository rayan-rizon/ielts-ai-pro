import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';

export default function ReadingEditorSelect({
  label,
  value,
  onValueChange,
  options,
  disabled,
  className,
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          'h-8 rounded-md shadow-none border-[#e4e2f0] dark:border-white/10 bg-transparent text-xs focus:ring-2 focus:ring-[#5a63df] focus:ring-offset-0',
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-64 rounded-lg shadow-none border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-[#19181f]">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="text-xs py-2 focus:bg-[#5a63df]/[0.08] focus:text-[#5a63df] dark:focus:text-[#afb5ff]"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
