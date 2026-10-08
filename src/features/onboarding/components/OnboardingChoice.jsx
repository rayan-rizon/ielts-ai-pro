import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, NUM, TILE } from '@/features/dashboard/components/primitives';

/** Stable geometry for every questionnaire choice and its selected state. */
export default function OnboardingChoice({
  selected,
  icon,
  title,
  description,
  meta,
  index = 0,
  compact = false,
  onClick,
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      data-rise
      style={{ '--i': index + 3 }}
      className={cn(
        TILE,
        'onboarding-choice',
        compact && 'onboarding-choice--compact',
        selected && 'onboarding-choice--selected'
      )}
    >
      <IconChip icon={icon} tone="accent" size="md" className="onboarding-choice__icon" />
      <span className="onboarding-choice__text">
        <span className="onboarding-choice__title">{title}</span>
        {description && <span className="onboarding-choice__description">{description}</span>}
      </span>
      {meta && <span className={cn(NUM, 'onboarding-choice__meta')}>{meta}</span>}
      <span className="onboarding-choice__check" aria-hidden="true">
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
    </button>
  );
}
