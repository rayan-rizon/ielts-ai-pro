import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Gift,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  PenLine,
  Mic,
  Calendar,
  Trophy,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { ReferralSettings } from '@/features/admin/services/ReferralSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

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

    if (data.referrals_required < 1) {
      toast.error('Referrals required must be at least 1');
      return;
    }

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
      <div className="space-y-6" data-oid="o2z_-pr">
        <Skeleton className="h-32 rounded-2xl" data-oid="3pi3:ns" />
        <Skeleton className="h-64 rounded-2xl" data-oid="w07yq9." />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-10 pt-12 md:pt-0"
      data-oid="18ug8xl"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-1">
        <motion.div variants={itemVariants} className="space-y-0.5 min-w-0">
          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 shadow-2xs shrink-0">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="truncate">Referral Program</span>
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            Configure referral milestone rewards, bonus evaluation credits, and track top advocates
          </p>
        </motion.div>

        <Button
          onClick={openAddModal}
          className="w-full sm:w-auto justify-center h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-2 shrink-0 mt-1 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reward Tier</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4" data-oid="mgs:u5n">
        <motion.div
          variants={itemVariants}
          className="p-2.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-2xs"
          data-oid="amsy.af"
        >
          <div className="flex items-center justify-between gap-1.5 sm:gap-2" data-oid="_h72-9d">
            <div className="space-y-0.5 min-w-0" data-oid="1n0vi9t">
              <p
                className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 truncate"
                data-oid="w3y-cts"
              >
                Total Referrals
              </p>
              <p
                className="text-base sm:text-2xl font-black text-slate-950 dark:text-white"
                data-oid="vtqun1k"
              >
                {stats?.totalReferrals || 0}
              </p>
            </div>
            <div
              className="p-1.5 sm:p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 shrink-0"
              data-oid="hwecfhe"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" data-oid="_u881n_" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="p-2.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-2xs"
          data-oid="19oec09"
        >
          <div className="flex items-center justify-between gap-1.5 sm:gap-2" data-oid="ibn8.2b">
            <div className="space-y-0.5 min-w-0" data-oid="ju54xe8">
              <p
                className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 truncate"
                data-oid="4brs74h"
              >
                Active Reward Tiers
              </p>
              <p
                className="text-base sm:text-2xl font-black text-slate-950 dark:text-white"
                data-oid="k3bzimg"
              >
                {tiers.filter((t) => t.is_active).length}
              </p>
            </div>
            <div
              className="p-1.5 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0"
              data-oid="-:63:qe"
            >
              <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" data-oid="b.076g:" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="p-2.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-2xs"
          data-oid="lb_on44"
        >
          <div className="flex items-center justify-between gap-1.5 sm:gap-2" data-oid="xi7pj4d">
            <div className="space-y-0.5 min-w-0" data-oid="yhhxr40">
              <p
                className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 truncate"
                data-oid="iz.tx43"
              >
                Top Referrer Count
              </p>
              <p
                className="text-base sm:text-2xl font-black text-slate-950 dark:text-white"
                data-oid="uf9u:_y"
              >
                {stats?.topReferrers?.[0]?.count || 0}
              </p>
            </div>
            <div
              className="p-1.5 sm:p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 shrink-0"
              data-oid="afizo-4"
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" data-oid="u2gba3y" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reward Tiers Section */}
      <motion.div
        variants={itemVariants}
        className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-2xs space-y-4 sm:space-y-5"
        data-oid="2jfdadv"
      >
        <div className="flex items-center justify-between" data-oid="p_wx:y9">
          <div data-oid="e7cohqm" className="space-y-0.5">
            <h3
              className="text-sm sm:text-base font-black text-slate-950 dark:text-white"
              data-oid="f4p4l1z"
            >
              Milestone Reward Rules
            </h3>
            <p
              className="text-xs font-medium text-slate-500 dark:text-slate-400"
              data-oid="l9up2zp"
            >
              Automatic user rewards unlocked when candidates hit referral targets
            </p>
          </div>
        </div>

        <div className="space-y-2.5" data-oid="lls6vpo">
          <AnimatePresence mode="popLayout" data-oid="yu.2e3d">
            {tiers.map((tier) => (
              <motion.div
                key={tier.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  'p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs',
                  tier.is_active
                    ? 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/10'
                    : 'bg-slate-100/40 dark:bg-slate-800/40 border-slate-200/40 opacity-60'
                )}
                data-oid="_vj.xl2"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1" data-oid="-j:-jpl">
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-center font-black text-sm sm:text-base shrink-0"
                    data-oid="clnadpz"
                  >
                    <span>{tier.referrals_required}</span>
                  </div>
                  <div data-oid="n6y-sh6" className="space-y-1 min-w-0 flex-1">
                    <p
                      className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white truncate"
                      data-oid="oczhbd."
                    >
                      {tier.referrals_required} Referral{tier.referrals_required > 1 ? 's' : ''}{' '}
                      Target
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5" data-oid="o07jhy-">
                      {tier.extra_days > 0 && (
                        <Badge
                          variant="outline"
                          className="rounded-lg font-bold text-[10px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          data-oid=".24xkt4"
                        >
                          <Calendar className="w-3 h-3 mr-1 text-indigo-500" data-oid="s518lpj" />+
                          {tier.extra_days} extra days
                        </Badge>
                      )}
                      {tier.writing_credits > 0 && (
                        <Badge
                          variant="outline"
                          className="rounded-lg font-bold text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900"
                          data-oid="-wl2llk"
                        >
                          <PenLine className="w-3 h-3 mr-1" data-oid="yu715uq" />+
                          {tier.writing_credits} writing evaluations
                        </Badge>
                      )}
                      {tier.speaking_credits > 0 && (
                        <Badge
                          variant="outline"
                          className="rounded-lg font-bold text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-900"
                          data-oid="yjwma2i"
                        >
                          <Mic className="w-3 h-3 mr-1" data-oid="fslv1wp" />+
                          {tier.speaking_credits} speaking evaluations
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5"
                  data-oid="t7ncv_3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 sm:hidden">
                      Active
                    </span>
                    <Switch
                      checked={tier.is_active}
                      onCheckedChange={() => handleToggleActive(tier)}
                      data-oid="7s5r:ej"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(tier)}
                      className="h-8 w-8 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      data-oid="tcn8.4m"
                    >
                      <Edit3 className="w-3.5 h-3.5" data-oid="oudjt7g" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(tier)}
                      className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      data-oid="w.ek0e3"
                    >
                      <Trash2 className="w-3.5 h-3.5" data-oid="2.pab_i" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {tiers.length === 0 && (
            <div className="text-center py-10 text-slate-400" data-oid="_5-0-m0">
              <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" data-oid="yift19m" />
              <p className="font-bold text-xs" data-oid="98cvgqc">
                No reward tiers configured yet
              </p>
              <p className="text-[11px] text-slate-500" data-oid="nq0jg6h">
                Click "Add Reward Tier" to create your first milestone
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Top Referrers Section */}
      {stats?.topReferrers?.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-2xs space-y-4"
          data-oid="f9sy9cw"
        >
          <div className="flex items-center gap-2" data-oid="t4a_n9u">
            <TrendingUp
              className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0"
              data-oid="544gwti"
            />
            <h3
              className="text-sm sm:text-base font-black text-slate-950 dark:text-white"
              data-oid="h9p7_xm"
            >
              Top Referral Advocates
            </h3>
          </div>

          <div className="space-y-2" data-oid="rzdf5y4">
            {stats.topReferrers.slice(0, 5).map((referrer, idx) => (
              <div
                key={referrer.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 gap-2"
                data-oid="db_xfjg"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1" data-oid="yjtnef8">
                  <span
                    className={cn(
                      'w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0',
                      idx === 0
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : idx === 1
                          ? 'bg-slate-400 text-white shadow-2xs'
                          : idx === 2
                            ? 'bg-amber-700 text-white shadow-2xs'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    )}
                    data-oid="sik88w3"
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1" data-oid="1k60npi">
                    <p
                      className="font-extrabold text-xs text-slate-950 dark:text-white truncate"
                      data-oid="w2g--ar"
                    >
                      {referrer.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate" data-oid="ah5g48r">
                      {referrer.email}
                    </p>
                  </div>
                </div>
                <Badge
                  className="rounded-lg font-mono font-bold text-[10px] sm:text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900 shrink-0"
                  data-oid="dwahhs8"
                >
                  {referrer.count} referrals
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal} data-oid="1e8k68t">
        <DialogContent
          className="w-[95vw] sm:w-full sm:max-w-[425px] rounded-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
          data-oid="my9ba0i"
        >
          <DialogHeader data-oid="8v.i1d7">
            <DialogTitle
              className="flex items-center gap-2 text-lg sm:text-xl font-black"
              data-oid="74zgsf8"
            >
              <Gift className="w-5 h-5 text-indigo-500 shrink-0" data-oid="zs7j__l" />
              {editingTier ? 'Edit Reward Tier' : 'Add Reward Tier'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4" data-oid="0b2b8ia">
            <div className="space-y-2" data-oid="u5b5bb_">
              <Label className="font-bold text-xs" data-oid="314p4gf">
                Referrals Required
              </Label>
              <Input
                type="number"
                min="1"
                value={formData.referrals_required}
                onChange={(e) => setFormData({ ...formData, referrals_required: e.target.value })}
                placeholder="e.g., 3"
                className="rounded-xl h-11 text-xs"
                data-oid="5416tmh"
              />
            </div>

            <div className="space-y-2" data-oid="-pzol_i">
              <Label className="font-bold text-xs flex items-center gap-2" data-oid="_7zslv3">
                <Calendar className="w-4 h-4" data-oid="_d7y59b" />
                Extra Days
              </Label>
              <Input
                type="number"
                min="0"
                value={formData.extra_days}
                onChange={(e) => setFormData({ ...formData, extra_days: e.target.value })}
                placeholder="e.g., 7"
                className="rounded-xl h-11 text-xs"
                data-oid="90p._6i"
              />
            </div>

            <div
              className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4"
              data-oid="y2erf04"
            >
              <div className="space-y-2" data-oid="az:zx_q">
                <Label className="font-bold text-xs flex items-center gap-2" data-oid="al7.ren">
                  <PenLine className="w-4 h-4" data-oid="8mx-_xe" />
                  Writing Credits
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.writing_credits}
                  onChange={(e) => setFormData({ ...formData, writing_credits: e.target.value })}
                  placeholder="e.g., 5"
                  className="rounded-xl h-11 text-xs"
                  data-oid="o6h8bu6"
                />
              </div>

              <div className="space-y-2" data-oid="nqcvft_">
                <Label className="font-bold text-xs flex items-center gap-2" data-oid="pxwjpg.">
                  <Mic className="w-4 h-4" data-oid="8clmj38" />
                  Speaking Credits
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.speaking_credits}
                  onChange={(e) => setFormData({ ...formData, speaking_credits: e.target.value })}
                  placeholder="e.g., 3"
                  className="rounded-xl h-11 text-xs"
                  data-oid="inwor-0"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2" data-oid="_2zt0:_">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="rounded-xl font-bold"
              data-oid="8t.lh:b"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.referrals_required}
              className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700"
              data-oid="x17kp4z"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" data-oid="u9g-79a" />
              ) : (
                <Save className="w-4 h-4 mr-2" data-oid="ez5zgg9" />
              )}
              {editingTier ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
