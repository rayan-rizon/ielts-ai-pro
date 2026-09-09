import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PANEL, AdminButton, AdminPageHeader } from './ui/primitives';
import { useReferralManagement } from './referral/useReferralManagement';
import { ReferralKpis } from './referral/ReferralKpis';
import { RewardTiersList } from './referral/RewardTiersList';
import { TopAdvocatesTable } from './referral/TopAdvocatesTable';
import { RewardTierModals } from './referral/RewardTierModals';

function ReferralLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className={cn(PANEL, 'h-24 animate-pulse')} />
      <div className={cn(PANEL, 'h-64 animate-pulse')} />
    </div>
  );
}

export default function ReferralManagement() {
  const {
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
  } = useReferralManagement();

  if (loading) {
    return <ReferralLoadingSkeleton />;
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

      <ReferralKpis stats={stats} conversion={conversion} tiers={tiers} />

      <RewardTiersList
        tiers={tiers}
        onToggleActive={handleToggleActive}
        onEditTier={openEditModal}
        onDeleteTier={setTierToDelete}
      />

      <TopAdvocatesTable stats={stats} conversion={conversion} />

      <RewardTierModals
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        editingTier={editingTier}
        formData={formData}
        setFormData={setFormData}
        saving={saving}
        onSave={handleSave}
        tierToDelete={tierToDelete}
        setTierToDelete={setTierToDelete}
        deletingTier={deletingTier}
        onDeleteConfirm={confirmDeleteTier}
      />
    </div>
  );
}
