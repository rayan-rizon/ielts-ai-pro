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
      className="space-y-6"
      data-oid="18ug8xl"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-oid="mgs:u5n">
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20"
          data-oid="amsy.af"
        >
          <div className="flex items-center gap-4" data-oid="_h72-9d">
            <div
              className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center"
              data-oid="hwecfhe"
            >
              <Users className="w-6 h-6 text-indigo-500" data-oid="_u881n_" />
            </div>
            <div data-oid="1n0vi9t">
              <p className="text-3xl font-black" data-oid="vtqun1k">
                {stats?.totalReferrals || 0}
              </p>
              <p className="text-sm text-muted-foreground font-bold" data-oid="w3y-cts">
                Total Referrals
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
          data-oid="19oec09"
        >
          <div className="flex items-center gap-4" data-oid="ibn8.2b">
            <div
              className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center"
              data-oid="-:63:qe"
            >
              <Gift className="w-6 h-6 text-emerald-500" data-oid="b.076g:" />
            </div>
            <div data-oid="ju54xe8">
              <p className="text-3xl font-black" data-oid="k3bzimg">
                {tiers.filter((t) => t.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground font-bold" data-oid="4brs74h">
                Active Reward Tiers
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
          data-oid="lb_on44"
        >
          <div className="flex items-center gap-4" data-oid="xi7pj4d">
            <div
              className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center"
              data-oid="afizo-4"
            >
              <Trophy className="w-6 h-6 text-amber-500" data-oid="u2gba3y" />
            </div>
            <div data-oid="yhhxr40">
              <p className="text-3xl font-black" data-oid="uf9u:_y">
                {stats?.topReferrers?.[0]?.count || 0}
              </p>
              <p className="text-sm text-muted-foreground font-bold" data-oid="iz.tx43">
                Top Referrer Count
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reward Tiers Section */}
      <motion.div
        variants={itemVariants}
        className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10"
        data-oid="2jfdadv"
      >
        <div className="flex items-center justify-between mb-6" data-oid="p_wx:y9">
          <div data-oid="e7cohqm">
            <h3 className="text-xl font-black" data-oid="f4p4l1z">
              Reward Tiers
            </h3>
            <p className="text-sm text-muted-foreground font-medium" data-oid="l9up2zp">
              Configure rewards for each referral milestone
            </p>
          </div>
          <Button
            onClick={openAddModal}
            className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700"
            data-oid="d6ipd.y"
          >
            <Plus className="w-4 h-4 mr-2" data-oid="mfkxbee" />
            Add Tier
          </Button>
        </div>

        <div className="space-y-3" data-oid="lls6vpo">
          <AnimatePresence mode="popLayout" data-oid="yu.2e3d">
            {tiers.map((tier) => (
              <motion.div
                key={tier.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  'p-4 rounded-2xl border transition-all',
                  tier.is_active
                    ? 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                    : 'bg-slate-100/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-white/5 opacity-60'
                )}
                data-oid="_vj.xl2"
              >
                <div className="flex items-center justify-between gap-4" data-oid="b4dwrpc">
                  <div className="flex items-center gap-4" data-oid="-j:-jpl">
                    <div
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white"
                      data-oid="clnadpz"
                    >
                      <span className="text-xl font-black" data-oid="j-o7_yo">
                        {tier.referrals_required}
                      </span>
                    </div>
                    <div data-oid="n6y-sh6">
                      <p className="font-black text-lg" data-oid="oczhbd.">
                        {tier.referrals_required} Referral{tier.referrals_required > 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1" data-oid="o07jhy-">
                        {tier.extra_days > 0 && (
                          <Badge
                            variant="secondary"
                            className="rounded-lg font-bold text-xs"
                            data-oid=".24xkt4"
                          >
                            <Calendar className="w-3 h-3 mr-1" data-oid="s518lpj" />+
                            {tier.extra_days} days
                          </Badge>
                        )}
                        {tier.writing_credits > 0 && (
                          <Badge
                            variant="secondary"
                            className="rounded-lg font-bold text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                            data-oid="-wl2llk"
                          >
                            <PenLine className="w-3 h-3 mr-1" data-oid="yu715uq" />+
                            {tier.writing_credits} writing
                          </Badge>
                        )}
                        {tier.speaking_credits > 0 && (
                          <Badge
                            variant="secondary"
                            className="rounded-lg font-bold text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            data-oid="yjwma2i"
                          >
                            <Mic className="w-3 h-3 mr-1" data-oid="fslv1wp" />+
                            {tier.speaking_credits} speaking
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" data-oid="t7ncv_3">
                    <Switch
                      checked={tier.is_active}
                      onCheckedChange={() => handleToggleActive(tier)}
                      data-oid="7s5r:ej"
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(tier)}
                      className="rounded-xl"
                      data-oid="tcn8.4m"
                    >
                      <Edit3 className="w-4 h-4" data-oid="oudjt7g" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(tier)}
                      className="rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      data-oid="w.ek0e3"
                    >
                      <Trash2 className="w-4 h-4" data-oid="2.pab_i" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {tiers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground" data-oid="_5-0-m0">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-30" data-oid="yift19m" />
              <p className="font-bold" data-oid="98cvgqc">
                No reward tiers configured
              </p>
              <p className="text-sm" data-oid="nq0jg6h">
                Click "Add Tier" to create your first referral reward
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Top Referrers Section */}
      {stats?.topReferrers?.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10"
          data-oid="f9sy9cw"
        >
          <div className="flex items-center gap-3 mb-4" data-oid="t4a_n9u">
            <TrendingUp className="w-5 h-5 text-indigo-500" data-oid="544gwti" />
            <h3 className="text-lg font-black" data-oid="h9p7_xm">
              Top Referrers
            </h3>
          </div>

          <div className="space-y-2" data-oid="rzdf5y4">
            {stats.topReferrers.slice(0, 5).map((referrer, idx) => (
              <div
                key={referrer.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5"
                data-oid="db_xfjg"
              >
                <div className="flex items-center gap-3" data-oid="yjtnef8">
                  <span
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm',
                      idx === 0
                        ? 'bg-amber-500 text-white'
                        : idx === 1
                          ? 'bg-slate-400 text-white'
                          : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-200 dark:bg-slate-700'
                    )}
                    data-oid="sik88w3"
                  >
                    {idx + 1}
                  </span>
                  <div data-oid="1k60npi">
                    <p className="font-bold" data-oid="w2g--ar">
                      {referrer.name}
                    </p>
                    <p className="text-xs text-muted-foreground" data-oid="ah5g48r">
                      {referrer.email}
                    </p>
                  </div>
                </div>
                <Badge className="rounded-lg font-black" data-oid="dwahhs8">
                  {referrer.count} referrals
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal} data-oid="1e8k68t">
        <DialogContent className="sm:max-w-[425px] rounded-3xl" data-oid="my9ba0i">
          <DialogHeader data-oid="8v.i1d7">
            <DialogTitle className="flex items-center gap-2 text-xl font-black" data-oid="74zgsf8">
              <Gift className="w-5 h-5 text-indigo-500" data-oid="zs7j__l" />
              {editingTier ? 'Edit Reward Tier' : 'Add Reward Tier'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4" data-oid="0b2b8ia">
            <div className="space-y-2" data-oid="u5b5bb_">
              <Label className="font-bold" data-oid="314p4gf">
                Referrals Required
              </Label>
              <Input
                type="number"
                min="1"
                value={formData.referrals_required}
                onChange={(e) => setFormData({ ...formData, referrals_required: e.target.value })}
                placeholder="e.g., 3"
                className="rounded-xl h-12"
                data-oid="5416tmh"
              />
            </div>

            <div className="space-y-2" data-oid="-pzol_i">
              <Label className="font-bold flex items-center gap-2" data-oid="_7zslv3">
                <Calendar className="w-4 h-4" data-oid="_d7y59b" />
                Extra Days
              </Label>
              <Input
                type="number"
                min="0"
                value={formData.extra_days}
                onChange={(e) => setFormData({ ...formData, extra_days: e.target.value })}
                placeholder="e.g., 7"
                className="rounded-xl h-12"
                data-oid="90p._6i"
              />
            </div>

            <div className="grid grid-cols-2 gap-4" data-oid="y2erf04">
              <div className="space-y-2" data-oid="az:zx_q">
                <Label className="font-bold flex items-center gap-2" data-oid="al7.ren">
                  <PenLine className="w-4 h-4" data-oid="8mx-_xe" />
                  Writing Credits
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.writing_credits}
                  onChange={(e) => setFormData({ ...formData, writing_credits: e.target.value })}
                  placeholder="e.g., 5"
                  className="rounded-xl h-12"
                  data-oid="o6h8bu6"
                />
              </div>

              <div className="space-y-2" data-oid="nqcvft_">
                <Label className="font-bold flex items-center gap-2" data-oid="pxwjpg.">
                  <Mic className="w-4 h-4" data-oid="8clmj38" />
                  Speaking Credits
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.speaking_credits}
                  onChange={(e) => setFormData({ ...formData, speaking_credits: e.target.value })}
                  placeholder="e.g., 3"
                  className="rounded-xl h-12"
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
