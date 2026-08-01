import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/cn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Crown,
  Percent,
  Tag,
  Calendar,
  Users,
  Power,
  Ticket,
  Timer,
} from 'lucide-react';
import { PromoCode } from '@/entities';
import { toast } from 'sonner';
import {
  NUM,
  MICRO,
  PANEL,
  Kpi,
  AdminButton,
  AdminPageHeader,
  PILL_BASE,
  pillTone,
  STAGGER_CONTAINER,
  FADE_UP,
} from './ui/primitives';

const FIELD_LABEL = cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5 block');
const FIELD_INPUT =
  'h-10 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';

const STATUS_TONE = { active: 'ok', paused: 'warn', expired: 'fault' };

const emptyPromo = () => ({
  code: '',
  discount_type: 'percentage',
  discount_value: 0,
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: '',
  max_uses: 100,
  applicable_plans: ['pro'],
  grants_subscription: null,
  subscription_duration_days: 30,
});

const PromoManagement = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [newPromo, setNewPromo] = useState(emptyPromo());

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const promoData = await PromoCode.list();
      setPromoCodes(promoData || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleAddPromo = async () => {
    try {
      if (!newPromo.code.trim()) return toast.error('Promo code is required.');
      if (!newPromo.valid_until) return toast.error('Code expiration date is required.');
      if (!newPromo.grants_subscription && newPromo.discount_value <= 0)
        return toast.error('Discount value must be greater than 0.');
      if (
        newPromo.grants_subscription &&
        (!newPromo.subscription_duration_days || newPromo.subscription_duration_days < 1)
      )
        return toast.error('Duration is required for subscription grants.');

      const existingCode = promoCodes.find(
        (promo) => promo.code.toLowerCase() === newPromo.code.toLowerCase().trim()
      );
      if (existingCode) return toast.error(`Promo code "${newPromo.code}" already exists.`);

      await PromoCode.create({
        ...newPromo,
        code: newPromo.code.trim().toUpperCase(),
        is_active: true,
        current_uses: 0,
      });

      setIsAddingPromo(false);
      setNewPromo(emptyPromo());
      fetchPromoCodes();
      toast.success('Promo code created');
    } catch (error) {
      console.error('Error adding promo code:', error);
      toast.error(error.message || 'Failed to create promo code');
    }
  };

  const togglePromoStatus = async (promoId, currentStatus) => {
    try {
      await PromoCode.update(promoId, { is_active: !currentStatus });
      fetchPromoCodes();
      toast.success(`Promo code ${currentStatus ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeletePromo = async (promo) => {
    try {
      await PromoCode.delete(promo.id);
      fetchPromoCodes();
      toast.success('Promo code deleted');
    } catch (error) {
      console.warn('Hard delete failed, attempting soft delete', error);
      try {
        await PromoCode.update(promo.id, { is_active: false });
        fetchPromoCodes();
        toast.success('Promo code deactivated');
      } catch {
        toast.error('Failed to remove promo code');
      }
    }
  };

  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter((p) => p.is_active).length,
    totalUses: promoCodes.reduce((acc, p) => acc + (p.current_uses || 0), 0),
  };

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-10 pt-12 md:pt-0"
    >
      <m.div variants={FADE_UP}>
        <AdminPageHeader
          title="Promo Codes"
          description="Discount codes and direct subscription grants"
          tip="A code either discounts checkout or grants a tier directly for a fixed number of days. Deactivating a code stops new redemptions without affecting users who already used it."
        >
          <Dialog open={isAddingPromo} onOpenChange={setIsAddingPromo}>
            <AdminButton onClick={() => setIsAddingPromo(true)}>
              <Plus className="w-3.5 h-3.5" />
              Add promo code
            </AdminButton>
            <DialogContent className="bg-white dark:bg-[#131315] border border-stone-200/90 dark:border-white/10 w-[95vw] max-w-md rounded-lg overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto p-4 sm:p-5">
              <DialogHeader className="space-y-0.5">
                <DialogTitle className="text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                  Create promo code
                </DialogTitle>
                <DialogDescription className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  Generate a discount rule or direct tier-access code
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <Label className={FIELD_LABEL}>Promo code</Label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                    <Input
                      value={newPromo.code}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })
                      }
                      placeholder="SUMMER25"
                      className={cn(
                        FIELD_INPUT,
                        'pl-8 font-mono font-bold uppercase tracking-widest'
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className={FIELD_LABEL}>Scheme</Label>
                    <Select
                      value={newPromo.grants_subscription ? 'grant' : newPromo.discount_type}
                      onValueChange={(value) => {
                        if (value === 'grant') {
                          setNewPromo({
                            ...newPromo,
                            grants_subscription: 'pro',
                            discount_value: 0,
                          });
                        } else {
                          setNewPromo({
                            ...newPromo,
                            discount_type: value,
                            grants_subscription: null,
                            discount_value: value === 'percentage' ? 20 : 10,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className={FIELD_INPUT}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage off</SelectItem>
                        <SelectItem value="fixed">Fixed price</SelectItem>
                        <SelectItem value="grant">Grant access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newPromo.grants_subscription ? (
                    <div>
                      <Label className={FIELD_LABEL}>Target tier</Label>
                      <Select
                        value={newPromo.grants_subscription}
                        onValueChange={(value) =>
                          setNewPromo({ ...newPromo, grants_subscription: value })
                        }
                      >
                        <SelectTrigger className={FIELD_INPUT}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pro">Pro tier</SelectItem>
                          <SelectItem value="premium">Premium tier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <Label className={FIELD_LABEL}>Value</Label>
                      <div className="relative">
                        {newPromo.discount_type === 'percentage' ? (
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                        ) : (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 font-bold text-xs">
                            $
                          </span>
                        )}
                        <Input
                          type="number"
                          value={newPromo.discount_value}
                          onChange={(e) =>
                            setNewPromo({ ...newPromo, discount_value: parseInt(e.target.value) })
                          }
                          placeholder="20"
                          className={cn(FIELD_INPUT, 'pl-8')}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className={FIELD_LABEL}>Expires</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            FIELD_INPUT,
                            'w-full flex items-center gap-2 px-3 text-left',
                            !newPromo.valid_until && 'text-stone-500 dark:text-stone-400'
                          )}
                        >
                          <Calendar className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 shrink-0" />
                          {newPromo.valid_until
                            ? format(new Date(newPromo.valid_until), 'PP')
                            : 'Pick a date'}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarUI
                          mode="single"
                          selected={
                            newPromo.valid_until ? new Date(newPromo.valid_until) : undefined
                          }
                          onSelect={(date) =>
                            setNewPromo({
                              ...newPromo,
                              valid_until: date ? date.toISOString().split('T')[0] : '',
                            })
                          }
                          initialFocus
                          disabled={(date) => date < new Date() || date < new Date('1900-01-01')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {newPromo.grants_subscription ? (
                    <div>
                      <Label className={FIELD_LABEL}>Access duration (days)</Label>
                      <div className="relative">
                        <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                        <Input
                          type="number"
                          value={newPromo.subscription_duration_days}
                          onChange={(e) =>
                            setNewPromo({
                              ...newPromo,
                              subscription_duration_days: parseInt(e.target.value) || 30,
                            })
                          }
                          placeholder="30"
                          className={cn(FIELD_INPUT, 'pl-8')}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className={FIELD_LABEL}>Usage cap</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                        <Input
                          type="number"
                          value={newPromo.max_uses}
                          onChange={(e) =>
                            setNewPromo({ ...newPromo, max_uses: parseInt(e.target.value) })
                          }
                          placeholder="100"
                          className={cn(FIELD_INPUT, 'pl-8')}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {newPromo.grants_subscription && (
                  <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                    <Label className={FIELD_LABEL}>Total redemptions</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                      <Input
                        type="number"
                        value={newPromo.max_uses}
                        onChange={(e) =>
                          setNewPromo({ ...newPromo, max_uses: parseInt(e.target.value) })
                        }
                        placeholder="100"
                        className={cn(FIELD_INPUT, 'pl-8')}
                      />
                    </div>
                  </m.div>
                )}
              </div>

              <DialogFooter className="gap-2 flex-col sm:flex-row">
                <AdminButton variant="ghost" onClick={() => setIsAddingPromo(false)}>
                  Cancel
                </AdminButton>
                <AdminButton onClick={handleAddPromo}>Create promo</AdminButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </AdminPageHeader>
      </m.div>

      <m.div variants={FADE_UP} className="grid grid-cols-3 gap-3">
        <Kpi label="Active" value={stats.active} sub={`of ${stats.total} total`} />
        <Kpi label="Total redemptions" value={stats.totalUses.toLocaleString()} />
        <Kpi label="Total codes" value={stats.total} />
      </m.div>

      <m.div variants={FADE_UP}>
        {!loading && promoCodes.length === 0 ? (
          <div className={cn(PANEL, 'py-20 flex flex-col items-center justify-center text-center')}>
            <Ticket className="w-8 h-8 text-stone-300 dark:text-stone-600 mb-3" />
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-50">
              No promo codes yet
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-[240px] mx-auto mt-1">
              Create your first campaign to start driving more subscriptions.
            </p>
            <AdminButton className="mt-4" onClick={() => setIsAddingPromo(true)}>
              Create promo code
            </AdminButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            <AnimatePresence mode="popLayout">
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={cn(PANEL, 'h-[168px] animate-pulse')} />
                  ))
                : promoCodes.map((promo, idx) => {
                    const isExpired = new Date(promo.valid_until) < new Date();
                    const status = isExpired ? 'expired' : promo.is_active ? 'active' : 'paused';
                    const usagePercentage = Math.min(
                      ((promo.current_uses || 0) / (promo.max_uses || 1)) * 100,
                      100
                    );

                    return (
                      <m.div
                        layout
                        key={promo.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ delay: Math.min(idx, 8) * 0.02 }}
                        className={cn(
                          PANEL,
                          'p-3 space-y-2.5',
                          (!promo.is_active || isExpired) && 'opacity-60'
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              NUM,
                              'text-sm font-black text-stone-900 dark:text-stone-50 truncate'
                            )}
                          >
                            {promo.code}
                          </span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => togglePromoStatus(promo.id, promo.is_active)}
                              className="h-6 w-6 grid place-items-center rounded-md text-stone-500 dark:text-stone-400 hover:text-[rgb(var(--signal-warn))] hover:bg-[rgb(var(--signal-warn)/0.08)] transition-colors"
                              title={promo.is_active ? 'Pause' : 'Activate'}
                            >
                              <Power className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeletePromo(promo)}
                              className="h-6 w-6 grid place-items-center rounded-md text-stone-500 dark:text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <span className={cn(PILL_BASE, pillTone(STATUS_TONE[status]))}>
                          {status}
                        </span>

                        <div className="p-2 rounded-md bg-stone-50 dark:bg-white/[0.03] border border-stone-200/70 dark:border-white/[0.06] flex items-center gap-2">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-md grid place-items-center shrink-0',
                              promo.grants_subscription
                                ? 'bg-indigo-500/[0.08] text-indigo-600 dark:text-indigo-400'
                                : 'bg-stone-200/60 dark:bg-white/[0.06] text-stone-600 dark:text-stone-300'
                            )}
                          >
                            {promo.grants_subscription ? (
                              <Crown className="w-3 h-3" />
                            ) : promo.discount_type === 'percentage' ? (
                              <Percent className="w-3 h-3" />
                            ) : (
                              <Tag className="w-3 h-3" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-[11px] text-stone-900 dark:text-stone-50 truncate">
                              {promo.grants_subscription ? (
                                <span className="capitalize">
                                  {promo.grants_subscription} access
                                </span>
                              ) : (
                                <span>
                                  {promo.discount_value}
                                  {promo.discount_type === 'percentage' ? '% off' : '$ fixed'}
                                </span>
                              )}
                            </p>
                            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 truncate')}>
                              {promo.grants_subscription
                                ? `${promo.subscription_duration_days}d grant`
                                : 'checkout discount'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                MICRO,
                                'text-stone-500 dark:text-stone-400 flex items-center gap-1'
                              )}
                            >
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(promo.valid_until).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span
                              className={cn(
                                NUM,
                                'text-[10px] font-bold text-stone-600 dark:text-stone-300'
                              )}
                            >
                              {promo.current_uses || 0}/{promo.max_uses}
                            </span>
                          </div>
                          <div className="h-1 bg-stone-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                            <m.div
                              initial={{ width: 0 }}
                              animate={{ width: `${usagePercentage}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className={cn(
                                'h-full rounded-full',
                                usagePercentage > 90
                                  ? 'bg-[rgb(var(--signal-fault))]'
                                  : promo.grants_subscription
                                    ? 'bg-indigo-500'
                                    : 'bg-[rgb(var(--signal-ok))]'
                              )}
                            />
                          </div>
                        </div>
                      </m.div>
                    );
                  })}
            </AnimatePresence>
          </div>
        )}
      </m.div>
    </m.div>
  );
};

export default PromoManagement;
