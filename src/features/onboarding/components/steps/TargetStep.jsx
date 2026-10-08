import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, NUM, WELL } from '@/features/dashboard/components/primitives';

const SCORES = Array.from({ length: 11 }, (_, i) => 4 + i * 0.5);
const MIN = 4;
const MAX = 9;

// The public IELTS band descriptors, keyed by whole band. A half band reads
// with the band below it, as the official scale does.
const DESCRIPTORS = {
  9: { label: 'Expert user', detail: 'Full operational command of the language.' },
  8: { label: 'Very good user', detail: 'Fully operational, with only occasional inaccuracies.' },
  7: { label: 'Good user', detail: 'Operational command, with occasional inaccuracies.' },
  6: { label: 'Competent user', detail: 'Generally effective command despite some errors.' },
  5: { label: 'Modest user', detail: 'Copes with overall meaning in most situations.' },
  4: { label: 'Limited user', detail: 'Basic competence in familiar situations.' },
};

// Arc geometry: radius 96 around (120, 108.8), opening at the bottom. The
// ticks share its start angle and sweep so they line up with the fill.
const ARC = 'M 46 170 A 96 96 0 1 1 194 170';
const CX = 120;
const CY = 108.8;
const START_DEG = 140.4;
const SWEEP_DEG = 259.2;

export default function TargetStep({ targetBandScore, onChangeTargetBand }) {
  const progress = ((targetBandScore - MIN) / (MAX - MIN)) * 100;
  const descriptor = DESCRIPTORS[Math.floor(targetBandScore)];
  return (
    <div className="onboarding-target">
      <div className="onboarding-target__display" data-rise style={{ '--i': 3 }}>
        <svg viewBox="0 0 240 210" className="onboarding-target__gauge" aria-hidden="true">
          <path d={ARC} className="onboarding-target__track" pathLength="100" />
          <path
            d={ARC}
            className="onboarding-target__fill"
            pathLength="100"
            style={{ strokeDasharray: `${Math.max(0.5, progress)} 100` }}
          />
          {SCORES.map((score) => {
            const angle = (START_DEG + ((score - MIN) / (MAX - MIN)) * SWEEP_DEG) * (Math.PI / 180);
            const whole = Number.isInteger(score);
            const r1 = whole ? 74 : 77;
            return (
              <line
                key={score}
                x1={CX + Math.cos(angle) * r1}
                y1={CY + Math.sin(angle) * r1}
                x2={CX + Math.cos(angle) * 80}
                y2={CY + Math.sin(angle) * 80}
                className={cn('onboarding-target__tick', score <= targetBandScore && 'is-reached')}
              />
            );
          })}
        </svg>
        <div className="onboarding-target__value" aria-live="polite">
          <span key={targetBandScore} className={cn(NUM, 'onboarding-target__number')}>
            {targetBandScore.toFixed(1)}
          </span>
          <span className={cn(MICRO, 'onboarding-target__caption')}>Target band</span>
        </div>
      </div>

      <div className="onboarding-target__side">
        <div className="onboarding-target__descriptor" data-rise style={{ '--i': 4 }}>
          <p className={cn(MICRO, 'onboarding-eyebrow')}>IELTS band descriptor</p>
          <p key={descriptor.label} className="onboarding-target__descriptor-label">
            {descriptor.label}
          </p>
          <p className="onboarding-target__descriptor-detail">{descriptor.detail}</p>
        </div>
        <div className={cn(WELL, 'onboarding-target__tip')} data-rise style={{ '--i': 5 }}>
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Check your university, employer or visa requirement for the exact band. You can change
            this later in Settings.
          </p>
        </div>
      </div>

      <div className="onboarding-target__control" data-rise style={{ '--i': 6 }}>
        <label htmlFor="onboarding-band" className="sr-only">
          Target band score
        </label>
        <input
          id="onboarding-band"
          type="range"
          min={MIN}
          max={MAX}
          step="0.5"
          value={targetBandScore}
          onChange={(e) => onChangeTargetBand(Number(e.target.value))}
          aria-valuetext={`Band ${targetBandScore.toFixed(1)}`}
          className="onboarding-range"
          style={{ '--fill': `${progress}%` }}
        />
        <div className="onboarding-score-marks">
          {SCORES.map((score) => (
            <button
              type="button"
              key={score}
              aria-label={`Set target band to ${score.toFixed(1)}`}
              aria-pressed={score === targetBandScore}
              onClick={() => onChangeTargetBand(score)}
              className={cn(NUM, score === targetBandScore && 'onboarding-score-mark--active')}
            >
              {score.toFixed(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
