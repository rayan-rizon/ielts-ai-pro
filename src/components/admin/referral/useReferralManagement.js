import { useState, useEffect } from 'react';
import { ReferralSettings } from '@/features/admin/services/ReferralSettings';
import MarketingService from '@/features/admin/services/MarketingService';
import { toast } from 'sonner';

const INITIAL_FORM_DATA = {
  referrals_required: '',
  extra_days: '',
  writing_credits: '',
  speaking_credits: '',
};

export function useReferralManagement() {
  const [tiers, setTiers] = useState([]);
  const [stats, setStats] = useState(null);
  const [conversion, setConversion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [tierToDelete, setTierToDelete] = useState(null);
  const [deletingTier, setDeletingTier] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, []);

  function resetForm() {
    setFormData(INITIAL_FORM_DATA);
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
      referrals_required: parseInt(formData.referrals_required, 10) || 1,
      extra_days: parseInt(formData.extra_days, 10) || 0,
      writing_credits: parseInt(formData.writing_credits, 10) || 0,
      speaking_credits: parseInt(formData.speaking_credits, 10) || 0,
    };
    if (data.referrals_required < 1) {
      return toast.error('Referrals required must be at least 1');
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

  async function confirmDeleteTier() {
    if (!tierToDelete) return;
    setDeletingTier(true);
    try {
      await ReferralSettings.delete(tierToDelete.id);
      toast.success('Reward tier deleted');
      fetchData();
      setTierToDelete(null);
    } catch (error) {
      toast.error('Failed to delete', { description: error.message });
    } finally {
      setDeletingTier(false);
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

  return {
    tiers,
    stats,
    conversion,
    loading,
    saving,
    showAddModal,
    setShowAddModal,
    editingTier,
    formData,
    setFormData,
    tierToDelete,
    setTierToDelete,
    deletingTier,
    openAddModal,
    openEditModal,
    handleSave,
    confirmDeleteTier,
    handleToggleActive,
    refetch: fetchData,
  };
}
