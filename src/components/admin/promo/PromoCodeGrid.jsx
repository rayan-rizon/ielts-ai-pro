import { AnimatePresence, m } from 'framer-motion';
import { Calendar, Crown, Percent, Power, Tag, Ticket, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM, MICRO, PANEL, AdminButton, PILL_BASE, pillTone } from '../ui/primitives';

const STATUS_TONE = { active: 'ok', paused: 'warn', expired: 'fault' };

const PromoTypeIcon = ({ promo }) => {
  if (promo.grants_subscription) return <Crown className="w-3 h-3" />;
  if (promo.discount_type === 'percentage') return <Percent className="w-3 h-3" />;
  return <Tag className="w-3 h-3" />;
};

const PromoCard = ({ promo, index, onToggle, onDelete }) => {
  const isExpired = new Date(promo.valid_until) < new Date();
  const status = isExpired ? 'expired' : promo.is_active ? 'active' : 'paused';
  const usagePercentage = Math.min(((promo.current_uses || 0) / (promo.max_uses || 1)) * 100, 100);
  const grant = promo.grants_subscription;
  return (
    <m.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index, 8) * 0.02 }}
      className={cn(PANEL, 'p-3 space-y-2.5', (!promo.is_active || isExpired) && 'opacity-60')}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={cn(NUM, 'text-sm font-black text-stone-900 dark:text-stone-50 truncate')}>
          {promo.code}
        </span>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onToggle(promo.id, promo.is_active)}
            className="h-6 w-6 grid place-items-center rounded-md text-stone-500 dark:text-stone-400 hover:text-[rgb(var(--signal-warn))] hover:bg-[rgb(var(--signal-warn)/0.08)] transition-colors"
            title={promo.is_active ? 'Pause' : 'Activate'}
          >
            <Power className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(promo)}
            className="h-6 w-6 grid place-items-center rounded-md text-stone-500 dark:text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <span className={cn(PILL_BASE, pillTone(STATUS_TONE[status]))}>{status}</span>
      <div className="p-2 rounded-md bg-stone-50 dark:bg-white/3 border border-stone-200/70 dark:border-white/6 flex items-center gap-2">
        <div
          className={cn(
            'w-6 h-6 rounded-md grid place-items-center shrink-0',
            grant
              ? 'bg-indigo-500/8 text-indigo-600 dark:text-indigo-400'
              : 'bg-stone-200/60 dark:bg-white/6 text-stone-600 dark:text-stone-300'
          )}
        >
          <PromoTypeIcon promo={promo} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-[11px] text-stone-900 dark:text-stone-50 truncate">
            {grant ? (
              <span className="capitalize">{grant} access</span>
            ) : (
              <span>
                {promo.discount_value}
                {promo.discount_type === 'percentage' ? '% off' : '$ fixed'}
              </span>
            )}
          </p>
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 truncate')}>
            {grant ? `${promo.subscription_duration_days}d grant` : 'checkout discount'}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1')}>
            <Calendar className="w-2.5 h-2.5" />
            {new Date(promo.valid_until).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span className={cn(NUM, 'text-[10px] font-bold text-stone-600 dark:text-stone-300')}>
            {promo.current_uses || 0}/{promo.max_uses}
          </span>
        </div>
        <div className="h-1 bg-stone-100 dark:bg-white/6 rounded-full overflow-hidden">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              usagePercentage > 90
                ? 'bg-[rgb(var(--signal-fault))]'
                : grant
                  ? 'bg-indigo-500'
                  : 'bg-[rgb(var(--signal-ok))]'
            )}
          />
        </div>
      </div>
    </m.div>
  );
};

export const PromoCodeGrid = ({ loading, promoCodes, onCreate, onToggle, onDelete }) => {
  if (!loading && promoCodes.length === 0) {
    return (
      <div className={cn(PANEL, 'py-20 flex flex-col items-center justify-center text-center')}>
        <Ticket className="w-8 h-8 text-stone-300 dark:text-stone-600 mb-3" />
        <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-50">
          No promo codes yet
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-[240px] mx-auto mt-1">
          Create your first campaign to start driving more subscriptions.
        </p>
        <AdminButton className="mt-4" onClick={onCreate}>
          Create promo code
        </AdminButton>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
      <AnimatePresence mode="popLayout">
        {loading
          ? Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className={cn(PANEL, 'h-[168px] animate-pulse')} />
            ))
          : promoCodes.map((promo, index) => (
              <PromoCard
                key={promo.id}
                promo={promo}
                index={index}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
      </AnimatePresence>
    </div>
  );
};
