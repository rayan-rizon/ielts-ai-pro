import React from 'react';
import { cn } from '@/lib/cn';
import { MICRO, NUM } from '@/features/dashboard/components/primitives';

/**
 * The one heading every onboarding screen uses: numbered eyebrow, a title whose
 * last phrase carries the accent, and a single line of supporting copy. Keeping
 * it in one place is what keeps the six screens reading as one flow.
 */
export default function OnboardingHeading({
  step,
  eyebrow,
  title,
  accent,
  description,
  align = 'start',
  className,
}) {
  return (
    <header
      className={cn('onboarding-heading-block', align === 'center' && 'is-centered', className)}
    >
      {eyebrow && (
        <p className={cn(MICRO, 'onboarding-eyebrow')} data-rise style={{ '--i': 0 }}>
          {step != null && (
            <span className={cn(NUM, 'onboarding-eyebrow__step')}>
              {String(step).padStart(2, '0')}
            </span>
          )}
          {eyebrow}
        </p>
      )}
      <h1 className="onboarding-heading" data-rise style={{ '--i': 1 }}>
        {title}
        {accent && (
          <>
            {' '}
            <span className="onboarding-title-accent">{accent}</span>
          </>
        )}
      </h1>
      {description && (
        <p className="onboarding-description" data-rise style={{ '--i': 2 }}>
          {description}
        </p>
      )}
    </header>
  );
}
