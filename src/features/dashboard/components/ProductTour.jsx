import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Logo, LogoIcon } from '@/components/shared/Logo';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM, PANEL, Pill, WELL } from './primitives';
import { buildProductTourSteps } from '../lib/productTourSteps';
import {
  clearProductTourSession,
  completeProductTour,
  hasQueuedProductTour,
  PRODUCT_TOUR_OPEN_EVENT,
  readProductTourSession,
  writeProductTourSession,
} from '../lib/productTourStorage';

function readTargetRect(selector) {
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2 || rect.bottom < 0 || rect.top > window.innerHeight)
    return null;
  return rect;
}

function getCardPosition(rect) {
  const gap = 14;
  const edge = 12;
  const width = Math.min(330, window.innerWidth - edge * 2);
  const estimatedHeight = 214;
  const clampX = (value) => Math.max(edge, Math.min(value, window.innerWidth - width - edge));
  const clampY = (value) =>
    Math.max(edge, Math.min(value, window.innerHeight - estimatedHeight - edge));
  if (!rect)
    return {
      left: clampX((window.innerWidth - width) / 2),
      top: clampY((window.innerHeight - estimatedHeight) / 2),
      width,
    };
  if (rect.right + gap + width <= window.innerWidth - edge)
    return { left: rect.right + gap, top: clampY(rect.top), width };
  if (rect.bottom + gap + estimatedHeight <= window.innerHeight - edge) {
    return { left: clampX(rect.left + rect.width / 2 - width / 2), top: rect.bottom + gap, width };
  }
  return {
    left: clampX(rect.left + rect.width / 2 - width / 2),
    top: clampY(rect.top - estimatedHeight - gap),
    width,
  };
}

export function formatTourLearnerName(user) {
  const raw = (user?.full_name || user?.username || '').trim();
  if (!raw) return '';
  const match = raw.match(/^[^\s,]+/);
  const word = match ? match[0].replace(/^[,.\s]+/, '').replace(/[,.\s]+$/, '') : '';
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function Welcome({ firstName, onStart, onDismiss }) {
  const heading = firstName ? `Your workspace is ready, ${firstName}` : 'Your workspace is ready';

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/66 p-3 dark:bg-black/76">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-tour-title"
        className={cn(PANEL, 'w-full max-w-[382px] overflow-hidden')}
      >
        <div
          className={cn(
            WELL,
            'flex items-center justify-center border-b border-[#e4e2f0] px-4 py-2 dark:border-white/[0.07]'
          )}
        >
          <Logo size="md" animated={false} />
        </div>
        <div className="p-5 text-center">
          <Pill tone="accent" className="mx-auto w-fit">
            Quick tour
          </Pill>
          <h2
            id="product-tour-title"
            className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            {heading}
          </h2>
          <p
            className={cn(
              'mx-auto mt-2 max-w-[320px] text-[13px] font-medium leading-relaxed',
              MUTED
            )}
          >
            Take a quick 1-minute tour to explore your dashboard, practice tools, performance
            analytics, and personalized AI study path.
          </p>
          <button
            type="button"
            onClick={onStart}
            autoFocus
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#5a63df] px-4 text-[13px] font-extrabold text-white transition-colors hover:bg-[#4a52c9] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a63df]"
          >
            Show me around <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="mt-2 min-h-9 rounded-md px-3 text-[12px] font-bold text-slate-500 transition-colors hover:text-slate-800 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5a63df] dark:text-slate-400 dark:hover:text-white"
          >
            I’ll explore on my own
          </button>
        </div>
      </section>
    </div>
  );
}

function SpotlightStep({ step, index, total, rect, onBack, onNext, onDismiss, reduceMotion }) {
  const position = getCardPosition(rect);
  const isLast = index === total - 1;
  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-live="polite">
      {rect ? (
        <div
          aria-hidden="true"
          className="fixed rounded-xl border-2 border-[#8f97ff] shadow-[0_0_0_9999px_rgb(2_6_23/0.68)] dark:border-[#b8bdff] dark:shadow-[0_0_0_9999px_rgb(0_0_0/0.78)]"
          style={{
            left: Math.max(5, rect.left - 5),
            top: Math.max(5, rect.top - 5),
            width: Math.min(window.innerWidth - 10, rect.width + 10),
            height: Math.min(window.innerHeight - 10, rect.height + 10),
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-slate-950/68 dark:bg-black/78" aria-hidden="true" />
      )}
      <section
        key={step.id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tour-step-${step.id}`}
        className={cn(PANEL, 'pointer-events-auto fixed p-4')}
        style={position}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#5a63df]/20 bg-[#5a63df]/10 dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/12">
              <LogoIcon className="h-4 w-4" />
            </div>
            <div>
              <Pill tone="accent">{step.section}</Pill>
              <p className={cn(MICRO, MUTED, 'mt-1')}>
                Step <span className={NUM}>{index + 1}</span> of{' '}
                <span className={NUM}>{total}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close tour"
            className="grid h-7 w-7 -mr-1 -mt-1 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-[#5a63df] dark:hover:bg-white/8 dark:hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <h2
          id={`tour-step-${step.id}`}
          className="mt-2.5 text-[15px] font-black tracking-tight text-slate-900 dark:text-white"
        >
          {step.title}
        </h2>
        <p className={cn('mt-1 text-[12px] font-medium leading-relaxed', MUTED)}>{step.body}</p>
        <div className={cn(WELL, 'mt-3 h-1 overflow-hidden rounded-full')} aria-hidden="true">
          <div
            className={cn(
              'h-full rounded-full bg-[#5a63df] dark:bg-[#8f97ff]',
              !reduceMotion && 'transition-[width] duration-300'
            )}
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={index === 0}
            className={cn(
              MICRO,
              'inline-flex h-8 items-center gap-1 rounded-md px-2 text-slate-500 transition-colors hover:text-slate-800 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-[#5a63df] disabled:pointer-events-none disabled:opacity-0 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          <button
            type="button"
            onClick={onNext}
            autoFocus
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#5a63df] px-3.5 text-[12px] font-extrabold text-white transition-colors hover:bg-[#4a52c9] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a63df]"
          >
            {isLast ? 'Finish' : 'Next'} {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function ProductTour({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const steps = useMemo(() => buildProductTourSteps(user), [user]);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState('welcome');
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const previousFocusRef = useRef(null);
  const firstName = useMemo(() => formatTourLearnerName(user), [user]);
  const step = steps[index] || steps[0];

  const saveSession = useCallback(
    (nextPhase, nextIndex) => {
      writeProductTourSession(user?.id, { phase: nextPhase, index: nextIndex });
    },
    [user?.id]
  );
  const openWelcome = useCallback(() => {
    setPhase('welcome');
    setIndex(0);
    setRect(null);
    setOpen(true);
    saveSession('welcome', 0);
  }, [saveSession]);
  const close = useCallback(() => {
    completeProductTour(user?.id);
    clearProductTourSession(user?.id);
    setOpen(false);
    setPhase('welcome');
    setIndex(0);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const active = readProductTourSession(user.id);
    if (active) {
      setPhase(active.phase === 'steps' ? 'steps' : 'welcome');
      setIndex(Math.max(0, Math.min(Number(active.index) || 0, steps.length - 1)));
      setOpen(true);
    } else if (location.pathname === createPageUrl('Dashboard') && hasQueuedProductTour(user.id)) {
      openWelcome();
    }
    const handleOpenRequest = () => openWelcome();
    window.addEventListener(PRODUCT_TOUR_OPEN_EVENT, handleOpenRequest);
    return () => window.removeEventListener(PRODUCT_TOUR_OPEN_EVENT, handleOpenRequest);
  }, [location.pathname, openWelcome, steps.length, user?.id]);

  useEffect(() => {
    if (open && phase === 'steps' && location.pathname !== step.route) navigate(step.route);
  }, [location.pathname, navigate, open, phase, step.route]);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      const focusable = dialog?.querySelectorAll('button:not([disabled]), a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [close, open]);

  useLayoutEffect(() => {
    if (!open || phase !== 'steps' || location.pathname !== step.route) return undefined;
    let attempts = 0;
    const update = () => {
      const target = document.querySelector(step.target);
      if (attempts === 0)
        target?.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      setRect(readTargetRect(step.target));
      attempts += 1;
    };
    update();
    const settleTimer = window.setInterval(() => {
      update();
      if (attempts >= 20 || readTargetRect(step.target)) window.clearInterval(settleTimer);
    }, 100);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.clearInterval(settleTimer);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [location.pathname, open, phase, reduceMotion, step.route, step.target]);

  const moveTo = (nextIndex) => {
    const bounded = Math.max(0, Math.min(nextIndex, steps.length - 1));
    setRect(null);
    setIndex(bounded);
    setPhase('steps');
    saveSession('steps', bounded);
    if (location.pathname !== steps[bounded].route) navigate(steps[bounded].route);
  };

  let content = null;
  if (open && phase === 'welcome') {
    content = <Welcome firstName={firstName} onStart={() => moveTo(0)} onDismiss={close} />;
  } else if (open) {
    content = (
      <SpotlightStep
        step={step}
        index={index}
        total={steps.length}
        rect={rect}
        onBack={() => moveTo(index - 1)}
        onNext={() => (index === steps.length - 1 ? close() : moveTo(index + 1))}
        onDismiss={close}
        reduceMotion={reduceMotion}
      />
    );
  }
  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
