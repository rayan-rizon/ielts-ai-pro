import { cn } from '@/lib/cn';
import { MICRO, MUTED, PANEL, TITLE, WELL } from '@/features/dashboard/components/primitives';

const BODY = 'text-[11px] leading-relaxed text-slate-600 dark:text-slate-300';

const FEELINGS = [
  ['going_well', 'Going well'],
  ['stuck', 'Stuck'],
  ['short_on_time', 'Short on time'],
  ['taking_a_break', 'Taking a break'],
];

function FeelingButton({ value, label, working, onSaveFeeling }) {
  const isSavingThis = working === `feeling-${value}`;
  const isAnyFeelingSaving = working.startsWith('feeling-');

  return (
    <button
      type="button"
      disabled={isAnyFeelingSaving}
      onClick={() => onSaveFeeling(value)}
      className={cn(
        WELL,
        'rounded-md border border-[#e4e2f0] px-2 py-1 text-[10px] font-bold text-stone-600 hover:border-[#5a63df]/40 hover:text-[#5a63df] disabled:opacity-50 dark:border-white/[0.07] dark:text-stone-300'
      )}
    >
      {isSavingThis ? 'Saving…' : label}
    </button>
  );
}

export default function LearnerCheckIn({ working, onSaveFeeling }) {
  return (
    <section
      className={cn(
        PANEL,
        'w-full md:mx-auto md:max-w-[1400px] flex flex-col gap-2 p-2.5 md:flex-row md:items-center md:justify-between'
      )}
    >
      <div className="min-w-0 flex-1 md:flex md:items-baseline md:gap-2">
        <p className={cn(MICRO, MUTED)}>Optional check-in</p>
        <p className={cn(TITLE, 'mt-0.5 text-[12px] md:mt-0')}>How is your practice going?</p>
        <p className={cn(BODY, 'mt-0.5 truncate text-[10px] md:mt-0')}>
          Helps tailor study support for seven days; never used for upgrade offers.
        </p>
      </div>
      <div className="flex flex-wrap gap-1 md:justify-end">
        {FEELINGS.map(([value, label]) => (
          <FeelingButton
            key={value}
            value={value}
            label={label}
            working={working}
            onSaveFeeling={onSaveFeeling}
          />
        ))}
      </div>
    </section>
  );
}
