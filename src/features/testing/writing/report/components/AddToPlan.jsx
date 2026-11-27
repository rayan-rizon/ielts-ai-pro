import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarPlus, Check, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { hasPaidAccess } from '@/features/subscription/config/contentAccess';
import { addPlanItems, allPlanned, planItems } from '../planAdditions';
import { usePlanPractice } from '../usePlanPractice';
import { BODY, QUIET_BUTTON, TEXT_BUTTON } from './reportStyles';

/** Where the added practice is listed. */
export const PLAN_LIST_PATH = '/learning-path#writing-practice';

function SaveButton({ t, userId, incoming }) {
  const plan = usePlanPractice(userId);

  if (plan.items && allPlanned(plan.items, incoming))
    return (
      <p role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[rgb(var(--signal-ok))]">
          <Check className="h-4 w-4" aria-hidden="true" />
          {t('planAdded')}
        </span>
        <Link to={PLAN_LIST_PATH} className={TEXT_BUTTON}>
          {t('planOpen')}
          <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </p>
    );

  const Icon = plan.busy ? Loader2 : CalendarPlus;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        className={QUIET_BUTTON}
        disabled={!plan.items || plan.busy}
        onClick={() => plan.change((list) => addPlanItems(list, incoming), { optimistic: false })}
      >
        <Icon
          className={plan.busy ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'}
          aria-hidden="true"
        />
        {t('planAdd')}
      </button>
      {plan.failed && (
        <p role="alert" className={BODY}>
          {t('planFailed')}
        </p>
      )}
    </div>
  );
}

/** The study plan is a paid feature: others are told so and nothing is saved. */
export function AddToPlan({ t, drills, sessionId, taskType }) {
  const { userProfile, isAdmin } = useAuth();
  const [now] = useState(() => new Date().toISOString());
  const incoming = planItems(drills, { sessionId, taskType, now });
  if (!userProfile?.id || !incoming.length) return null;

  if (!hasPaidAccess(userProfile) && !isAdmin)
    return (
      <Link to="/learning-path" className={QUIET_BUTTON}>
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        {t('planPro')}
      </Link>
    );

  return <SaveButton t={t} userId={userProfile.id} incoming={incoming} />;
}
