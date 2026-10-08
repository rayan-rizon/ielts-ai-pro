import React from 'react';
import { CalendarCheck2, SquareCheckBig, ArrowRight } from 'lucide-react';
import { IconChip } from '@/features/dashboard/components/primitives';
import OnboardingHeading from '../OnboardingHeading';

const BENEFITS = [
  { icon: FeedbackIcon, label: 'Smart Feedback' },
  { icon: CalendarCheck2, label: 'Personalised Plan' },
  { icon: SquareCheckBig, label: 'Real Exam Practice' },
];
function FeedbackIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m14 6 2-2a2.1 2.1 0 0 1 3 3l-2 2m-3-3L5 15l-1 5 5-1 8-10m-3-3 3 3" />
      <path
        d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export default function WelcomeStep({ onStart, isLoading = false }) {
  return (
    <div className="onboarding-welcome">
      <div className="onboarding-welcome__copy">
        <OnboardingHeading
          eyebrow="Welcome to IELTS Ai Pro"
          title="Your AI-powered"
          accent="IELTS companion"
          description="Personal practice, instant feedback and a plan that moves you toward your target band — set up in under a minute."
        />
        <ul className="onboarding-benefits">
          {BENEFITS.map(({ icon, label }, index) => (
            <li key={label} className="onboarding-benefit" data-rise style={{ '--i': index + 3 }}>
              <IconChip icon={icon} tone="accent" size="md" className="onboarding-benefit-icon" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onStart}
          disabled={isLoading}
          className="onboarding-primary onboarding-welcome__start"
          data-rise
          style={{ '--i': 6 }}
        >
          Get started <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="onboarding-welcome__time" data-rise style={{ '--i': 7 }}>
          4 quick questions · about 60 seconds
        </p>
      </div>
      <figure className="onboarding-welcome__art" data-rise style={{ '--i': 2 }}>
        <img
          className="onboarding-welcome__illustration"
          src="/onboarding/welcome-dashboard-v3-480.webp"
          srcSet="/onboarding/welcome-dashboard-v3-480.webp 480w, /onboarding/welcome-dashboard-v3-640.webp 640w, /onboarding/welcome-dashboard-v3.webp 960w"
          sizes="(max-width: 1044px) 320px, 430px"
          width="960"
          height="960"
          alt="Illustrative score dashboard: Overall Band Score 7.0, Good. Writing 7.0, Speaking 7.0, Listening 7.5, Reading 6.5."
          decoding="async"
        />
      </figure>
    </div>
  );
}
