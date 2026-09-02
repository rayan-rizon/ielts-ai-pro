import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AudioLines,
  BadgeCheck,
  Calendar,
  CalendarDays,
  Edit3,
  FilePenLine,
  Gift,
  Mic,
  PenLine,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ReferralSettings } from '@/features/admin/services/ReferralSettings';
import MarketingService from '@/features/admin/services/MarketingService';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { NUM, MICRO, PANEL, Kpi, AdminButton, AdminPageHeader } from './ui/primitives';

const FIELD_LABEL = cn(
  MICRO,
  'text-stone-500 dark:text-stone-400 mb-1.5 flex items-center gap-1.5'
);
const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';

const RewardChip = ({ Icon, tone, label }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-extrabold tracking-[0.08em] uppercase whitespace-nowrap',
      tone
    )}
  >
    <Icon className="w-3 h-3" />
    {label}
  </span>
);

const RANK_TONE = [
  'bg-[rgb(var(--signal-warn))] text-white',
  'bg-stone-400 text-white',
  'bg-stone-500 text-white',
];

export default function ReferralManagement() {
  const [tiers, setTiers] = useState([]);
  const [stats, setStats] = useState(null);
  const [conversion, setConversion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState({
    referrals_required: '',
    extra_days: '',
    writing_credits: '',
    speaking_credits: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [tiersData, statsData, offerData] = await Promise.all([
        ReferralSettings.list(),
        ReferralSettings.getStats(),
        MarketingService.getOfferIntelligence(),
      ]);
      setTiers(tiersData || []);
      setStats(statsData);
      setConversion(offerData?.referrals || []);
    } catch (error) {
      toast.error('Failed to load referral data', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      referrals_required: '',
      extra_days: '',
      writing_credits: '',
      speaking_credits: '',
    });
    setEditingTier(null);
  }

  function openAddModal() {
    resetForm();
    setShowAddModal(true);
  }

  function openEditModal(tier) {
    setFormData({
      referrals_required: tier.referrals_required.toString(),
      extra_days: (tier.extra_days || 0).toString(),
      writing_credits: (tier.writing_credits || 0).toString(),
      speaking_credits: (tier.speaking_credits || 0).toString(),
    });
    setEditingTier(tier);
    setShowAddModal(true);
  }

  async function handleSave() {
    const data = {
      referrals_required: parseInt(formData.referrals_required) || 1,
      extra_days: parseInt(formData.extra_days) || 0,
      writing_credits: parseInt(formData.writing_credits) || 0,
      speaking_credits: parseInt(formData.speaking_credits) || 0,
    };
    if (data.referrals_required < 1) return toast.error('Referrals required must be at least 1');

    setSaving(true);
    try {
      if (editingTier) {
        await ReferralSettings.update(editingTier.id, data);
        toast.success('Reward tier updated');
      } else {
        await ReferralSettings.create(data);
        toast.success('Reward tier created');
      }
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to save', { description: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tier) {
    if (!confirm(`Delete reward tier for ${tier.referrals_required} referral(s)?`)) return;
    try {
      await ReferralSettings.delete(tier.id);
      toast.success('Reward tier deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete', { description: error.message });
    }
  }

  async function handleToggleActive(tier) {
    try {
      await ReferralSettings.toggleActive(tier.id, !tier.is_active);
      setTiers((prev) =>
        prev.map((t) => (t.id === tier.id ? { ...t, is_active: !t.is_active } : t))
      );
      toast.success(tier.is_active ? 'Tier deactivated' : 'Tier activated');
    } catch (error) {
      toast.error('Failed to update', { description: error.message });
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className={cn(PANEL, 'h-24 animate-pulse')} />
        <div className={cn(PANEL, 'h-64 animate-pulse')} />
      </div>
    );
  }

  return (
    <div className="animate-panel-in space-y-4 pb-10 pt-12 md:pt-0">
      <AdminPageHeader
        title="Referrals"
        description="Milestone rewards, bonus evaluation credits, and top advocates"
        tip="Tiers unlock at the referral target. Deactivation stops new rewards."
      >
        <AdminButton onClick={openAddModal}>
          <Plus className="w-3.5 h-3.5" />
          Add tier
        </AdminButton>
      </AdminPageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Total referrals" value={(stats?.totalReferrals || 0).toLocaleString()} />
        <Kpi
          label="Activated learners"
          value={conversion.reduce((total, row) => total + Number(row.activated || 0), 0)}
        />
        <Kpi
          label="Paid subscribers"
          value={conversion.reduce((total, row) => total + Number(row.paid || 0), 0)}
        />
        <Kpi
          label="Active tiers"
          value={tiers.filter((t) => t.is_active).length}
          sub={`of ${tiers.length} total`}
        />
        <Kpi
          label="Top referrer"
          value={stats?.topReferrers?.[0]?.count || 0}
          sub="referrals by #1"
        />
      </div>

      {conversion.some((row) => row.risk_flags?.length) && (
        <div className={cn(PANEL, 'flex items-center gap-3 p-3')}>
          <ShieldAlert className="h-4 w-4 text-[rgb(var(--signal-warn))]" />
          <p className="text-xs font-bold text-stone-700 dark:text-stone-200">
            {conversion.filter((row) => row.risk_flags?.length).length} advocate account(s) need
            referral-pattern review.
          </p>
        </div>
      )}

      {/* Reward tiers */}
      <div className={cn(PANEL, 'overflow-hidden')}>
        <div className="flex flex-col justify-between gap-3 border-b border-stone-100 px-4 py-4 dark:border-white/6 sm:flex-row sm:items-center sm:px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
              <Gift className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                Milestone rewards
              </h3>
              <p className={cn(MICRO, 'mt-0.5 text-stone-500 dark:text-stone-400')}>
                Rewards unlock once a learner reaches each referral target.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-[rgb(var(--signal-ok)/0.24)] bg-[rgb(var(--signal-ok)/0.06)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[rgb(var(--signal-ok))] sm:self-auto">
            <BadgeCheck className="h-3.5 w-3.5" />
            {tiers.filter((tier) => tier.is_active).length} live
          </div>
        </div>

        <div className="space-y-2 p-3 sm:p-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'group relative flex flex-col gap-3 overflow-hidden rounded-lg border p-3.5 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between',
                tier.is_active
                  ? 'border-stone-200 bg-white shadow-[0_1px_0_rgba(28,25,23,0.03)] hover:border-violet-200 hover:shadow-[0_10px_28px_rgba(109,76,255,0.08)] dark:border-white/8 dark:bg-white/2.5 dark:hover:border-violet-400/30'
                  : 'border-stone-100 bg-stone-50/60 opacity-60 dark:border-white/4 dark:bg-white/1.5'
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className={cn(
                    NUM,
                    'grid h-10 w-10 shrink-0 place-items-center rounded-lg border text-sm font-black',
                    tier.is_active
                      ? 'border-violet-200 bg-violet-500/8 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200'
                      : 'border-stone-200 bg-stone-100 text-stone-500 dark:border-white/8 dark:bg-white/5 dark:text-stone-400'
                  )}
                >
                  {tier.referrals_required}
                </div>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  <p className="mr-1 text-xs font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                    {tier.referrals_required} referral
                    {tier.referrals_required === 1 ? '' : 's'} target
                  </p>
                  {tier.extra_days > 0 && (
                    <RewardChip
                      Icon={CalendarDays}
                      tone="border-stone-200 bg-stone-50 text-stone-600 dark:border-white/10 dark:bg-white/4 dark:text-stone-300"
                      label={`+${tier.extra_days} days`}
                    />
                  )}
                  {tier.writing_credits > 0 && (
                    <RewardChip
                      Icon={FilePenLine}
                      tone="border-indigo-200/80 bg-indigo-500/5 text-indigo-600 dark:border-indigo-400/25 dark:bg-indigo-400/8 dark:text-indigo-300"
                      label={`+${tier.writing_credits} Writing`}
                    />
                  )}
                  {tier.speaking_credits > 0 && (
                    <RewardChip
                      Icon={AudioLines}
                      tone="border-indigo-200/80 bg-indigo-500/5 text-indigo-600 dark:border-indigo-400/25 dark:bg-indigo-400/8 dark:text-indigo-300"
                      label={`+${tier.speaking_credits} Speaking`}
                    />
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-stone-100 pt-2 dark:border-white/6 sm:border-t-0 sm:pt-0">
                <div className="flex items-center gap-2.5">
                  <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                    {tier.is_active ? 'Live' : 'Paused'}
                  </span>
                  <Switch
                    checked={tier.is_active}
                    onCheckedChange={() => handleToggleActive(tier)}
                  />
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-0.5 dark:border-white/8 dark:bg-white/4">
                  <button
                    onClick={() => openEditModal(tier)}
                    className="h-7 w-7 grid place-items-center rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tier)}
                    className="h-7 w-7 grid place-items-center rounded-md text-stone-500 dark:text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {tiers.length === 0 && (
            <div className="text-center py-10">
              <Gift className="w-6 h-6 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
              <p className="text-xs font-bold text-stone-900 dark:text-stone-50">
                No reward tiers yet
              </p>
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-1')}>
                Add one to create your first milestone
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top referrers */}
      {stats?.topReferrers?.length > 0 && (
        <div className={cn(PANEL, 'p-4')}>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Top advocates</h3>
          </div>
          <div className="space-y-1.5">
            {stats.topReferrers.slice(0, 5).map((referrer, idx) =>
              (() => {
                const funnel = conversion.find((row) => row.referrer_id === referrer.id);
                return (
                  <div
                    key={referrer.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50/70 dark:bg-white/2 border border-stone-200/60 dark:border-white/5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className={cn(
                          NUM,
                          'w-6 h-6 rounded-md grid place-items-center font-black text-[11px] shrink-0',
                          RANK_TONE[idx] ||
                            'bg-stone-200 dark:bg-white/6 text-stone-600 dark:text-stone-300'
                        )}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-[11px] text-stone-900 dark:text-stone-50 truncate">
                          {referrer.name}
                        </p>
                        <p
                          className={cn(
                            NUM,
                            'text-[10px] text-stone-500 dark:text-stone-400 truncate'
                          )}
                        >
                          {referrer.email}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={cn(
                          NUM,
                          'block text-[11px] font-bold text-stone-700 dark:text-stone-200'
                        )}
                      >
                        {referrer.count} referrals
                      </span>
                      <span className="text-[9px] font-bold text-stone-500 dark:text-stone-400">
                        {funnel?.activated || 0} activated · {funnel?.paid || 0} paid
                      </span>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-white dark:bg-[#131315] border border-stone-200/90 dark:border-white/10 w-[95vw] max-w-md rounded-lg overflow-hidden shadow-xl p-4 sm:p-5">
          <DialogHeader className="space-y-0.5">
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
              <Gift className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              {editingTier ? 'Edit reward tier' : 'Add reward tier'}
            </DialogTitle>
            <DialogDescription className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
              Set the referral threshold and rewards unlocked at this tier
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className={FIELD_LABEL}>
                <Users className="w-3 h-3" />
                Referrals required
              </Label>
              <Input
                type="number"
                min="1"
                value={formData.referrals_required}
                onChange={(e) => setFormData({ ...formData, referrals_required: e.target.value })}
                placeholder="e.g. 3"
                className={FIELD_INPUT}
              />
            </div>
            <div>
              <Label className={FIELD_LABEL}>
                <Calendar className="w-3 h-3" />
                Extra days
              </Label>
              <Input
                type="number"
                min="0"
                value={formData.extra_days}
                onChange={(e) => setFormData({ ...formData, extra_days: e.target.value })}
                placeholder="e.g. 7"
                className={FIELD_INPUT}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={FIELD_LABEL}>
                  <PenLine className="w-3 h-3" />
                  Writing credits
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.writing_credits}
                  onChange={(e) => setFormData({ ...formData, writing_credits: e.target.value })}
                  placeholder="e.g. 5"
                  className={FIELD_INPUT}
                />
              </div>
              <div>
                <Label className={FIELD_LABEL}>
                  <Mic className="w-3 h-3" />
                  Speaking credits
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.speaking_credits}
                  onChange={(e) => setFormData({ ...formData, speaking_credits: e.target.value })}
                  placeholder="e.g. 3"
                  className={FIELD_INPUT}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <AdminButton variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </AdminButton>
            <AdminButton
              onClick={handleSave}
              disabled={saving || !formData.referrals_required}
              loading={saving}
            >
              <Save className="w-3.5 h-3.5" />
              {editingTier ? 'Update' : 'Create'}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
