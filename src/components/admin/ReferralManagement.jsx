import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Calendar,
  Edit3,
  Gift,
  Loader2,
  Mic,
  PenLine,
  Plus,
  Save,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ReferralSettings } from '@/features/admin/services/ReferralSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { NUM, MICRO, PANEL, Kpi, AdminButton, AdminPageHeader } from './ui/primitives';

const FIELD_LABEL = cn(
  MICRO,
  'text-stone-500 dark:text-stone-400 mb-1.5 flex items-center gap-1.5'
);
const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';

const TIER_BADGE = (Icon, tone, label) => (
  <span
    className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 gap-1', MICRO, tone)}
  >
    <Icon className="w-2.5 h-2.5" />
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
      const [tiersData, statsData] = await Promise.all([
        ReferralSettings.list(),
        ReferralSettings.getStats(),
      ]);
      setTiers(tiersData || []);
      setStats(statsData);
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
    <div className="space-y-4 pb-10 pt-12 md:pt-0">
      <AdminPageHeader
        title="Referrals"
        description="Milestone rewards, bonus evaluation credits, and top advocates"
        tip="Tiers unlock automatically when a user's referral count hits the target. Deactivating a tier keeps existing rewards intact but stops new ones."
      >
        <AdminButton onClick={openAddModal}>
          <Plus className="w-3.5 h-3.5" />
          Add tier
        </AdminButton>
      </AdminPageHeader>

      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Total referrals" value={(stats?.totalReferrals || 0).toLocaleString()} />
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

      {/* Reward tiers */}
      <div className={cn(PANEL, 'p-4')}>
        <div className="mb-3">
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            Milestone reward rules
          </h3>
        </div>

        <div className="space-y-2">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg border',
                tier.is_active
                  ? 'border-stone-200 dark:border-white/[0.07] bg-stone-50/50 dark:bg-white/[0.02]'
                  : 'border-stone-100 dark:border-white/[0.04] opacity-50'
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={cn(
                    NUM,
                    'w-9 h-9 rounded-md bg-stone-100 dark:bg-white/[0.06] grid place-items-center font-black text-sm text-stone-700 dark:text-stone-200 shrink-0'
                  )}
                >
                  {tier.referrals_required}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-extrabold text-[11px] text-stone-900 dark:text-stone-50 truncate">
                    {tier.referrals_required} referral{tier.referrals_required > 1 ? 's' : ''}{' '}
                    target
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tier.extra_days > 0 &&
                      TIER_BADGE(
                        Calendar,
                        'text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10',
                        `+${tier.extra_days}d`
                      )}
                    {tier.writing_credits > 0 &&
                      TIER_BADGE(
                        PenLine,
                        'text-indigo-600 dark:text-indigo-400 border-indigo-300/50 dark:border-indigo-800/60 bg-indigo-500/[0.06]',
                        `+${tier.writing_credits} writing`
                      )}
                    {tier.speaking_credits > 0 &&
                      TIER_BADGE(
                        Mic,
                        'text-violet-600 dark:text-violet-400 border-violet-300/50 dark:border-violet-800/60 bg-violet-500/[0.06]',
                        `+${tier.speaking_credits} speaking`
                      )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 sm:hidden')}>
                    Active
                  </span>
                  <Switch
                    checked={tier.is_active}
                    onCheckedChange={() => handleToggleActive(tier)}
                  />
                </div>
                <div className="flex items-center gap-1">
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
            {stats.topReferrers.slice(0, 5).map((referrer, idx) => (
              <div
                key={referrer.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50/70 dark:bg-white/[0.02] border border-stone-200/60 dark:border-white/[0.05]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={cn(
                      NUM,
                      'w-6 h-6 rounded-md grid place-items-center font-black text-[11px] shrink-0',
                      RANK_TONE[idx] ||
                        'bg-stone-200 dark:bg-white/[0.06] text-stone-600 dark:text-stone-300'
                    )}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-[11px] text-stone-900 dark:text-stone-50 truncate">
                      {referrer.name}
                    </p>
                    <p
                      className={cn(NUM, 'text-[10px] text-stone-500 dark:text-stone-400 truncate')}
                    >
                      {referrer.email}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    NUM,
                    'text-[11px] font-bold text-stone-700 dark:text-stone-200 shrink-0'
                  )}
                >
                  {referrer.count} referrals
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              {editingTier ? 'Edit reward tier' : 'Add reward tier'}
            </DialogTitle>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.referrals_required}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingTier ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
