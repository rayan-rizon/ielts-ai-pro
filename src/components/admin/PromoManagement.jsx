import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { m } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { PromoCode } from '@/entities';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Kpi, AdminButton, AdminPageHeader, STAGGER_CONTAINER, FADE_UP } from './ui/primitives';
import { PromoCodeDialog } from './promo/PromoCodeDialog';
import { PromoCodeGrid } from './promo/PromoCodeGrid';
import MarketingService from '@/features/admin/services/MarketingService';

const emptyPromo = () => ({
  code: '',
  discount_type: 'percentage',
  discount_value: 0,
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: '',
  max_uses: 100,
  applicable_plans: ['pro', 'premium'],
  grants_subscription: null,
  subscription_duration_days: 30,
  label: '',
  marketing_campaign_id: '',
});

const validatePromo = (promo, promoCodes) => {
  if (!promo.code.trim()) return 'Promo code is required.';
  if (!promo.valid_until) return 'Code expiration date is required.';
  if (
    !promo.grants_subscription &&
    (!Number.isFinite(promo.discount_value) || promo.discount_value <= 0)
  ) {
    return 'Discount value must be greater than 0.';
  }
  if (promo.grants_subscription && promo.subscription_duration_days < 1) {
    return 'Duration is required for subscription grants.';
  }
  if (promo.discount_type === 'percentage' && promo.discount_value > 100)
    return 'Percentage must be 100 or less.';
  if (!Number.isInteger(promo.max_uses) || promo.max_uses < 1)
    return 'Usage cap must be a positive whole number.';
  if (!/^[A-Z0-9-]{6,64}$/i.test(promo.code.trim()))
    return 'Use 6–64 letters, numbers or hyphens for the code.';
  if (promo.valid_until < new Date().toISOString().slice(0, 10))
    return 'Expiration date cannot be in the past.';
  const normalizedCode = promo.code.toLowerCase().trim();
  if (promoCodes.some((existing) => existing.code.toLowerCase() === normalizedCode)) {
    return `Promo code "${promo.code}" already exists.`;
  }
  return null;
};

const PromoManagement = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [newPromo, setNewPromo] = useState(emptyPromo());
  const [campaigns, setCampaigns] = useState([]);
  const [intelligence, setIntelligence] = useState([]);
  const requestId = useRef(0);

  const fetchPromoCodes = useCallback(async () => {
    const currentRequest = ++requestId.current;
    try {
      setLoading(true);
      const [promoData, campaignData, offerData] = await Promise.all([
        PromoCode.list(),
        MarketingService.listCampaigns(),
        MarketingService.getOfferIntelligence(),
      ]);
      if (currentRequest === requestId.current) {
        setPromoCodes(promoData || []);
        setCampaigns(campaignData || []);
        setIntelligence(offerData?.promos || []);
      }
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const handleAddPromo = async () => {
    const validationError = validatePromo(newPromo, promoCodes);
    if (validationError) return toast.error(validationError);
    try {
      await PromoCode.create({
        ...newPromo,
        marketing_campaign_id: newPromo.marketing_campaign_id || null,
        label: newPromo.label.trim() || null,
        code: newPromo.code.trim().toUpperCase(),
        is_active: true,
        current_uses: 0,
      });
      setIsAddingPromo(false);
      setNewPromo(emptyPromo());
      await fetchPromoCodes();
      toast.success('Promo code created');
    } catch (error) {
      console.error('Error adding promo code:', error);
      toast.error(error.message || 'Failed to create promo code');
    }
  };

  const togglePromoStatus = async (promoId, currentStatus) => {
    try {
      await PromoCode.update(promoId, { is_active: !currentStatus });
      await fetchPromoCodes();
      toast.success(`Promo code ${currentStatus ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const [promoToDelete, setPromoToDelete] = useState(null);
  const [isDeletingPromo, setIsDeletingPromo] = useState(false);

  const handleDeletePromo = (promo) => {
    setPromoToDelete(promo);
  };

  const confirmDeletePromo = async () => {
    if (!promoToDelete) return;
    setIsDeletingPromo(true);
    try {
      await PromoCode.delete(promoToDelete.id);
      await fetchPromoCodes();
      toast.success('Promo code deleted');
      setPromoToDelete(null);
    } catch (error) {
      console.warn('Hard delete failed, attempting soft delete', error);
      try {
        await PromoCode.update(promoToDelete.id, { is_active: false });
        await fetchPromoCodes();
        toast.success('Promo code deactivated');
        setPromoToDelete(null);
      } catch {
        toast.error('Failed to remove promo code');
      }
    } finally {
      setIsDeletingPromo(false);
    }
  };

  const [confirmClearExpired, setConfirmClearExpired] = useState(false);
  const [isClearingExpired, setIsClearingExpired] = useState(false);

  // Signup-offer templates are the source the personal codes are minted from,
  // so they are never swept up here even when their own window has lapsed.
  const expiredPromos = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return promoCodes.filter(
      (promo) => promo.valid_until && promo.valid_until < today && !promo.is_signup_offer_template
    );
  }, [promoCodes]);

  const confirmClearExpiredPromos = async () => {
    setIsClearingExpired(true);
    try {
      const results = await Promise.allSettled(
        expiredPromos.map((promo) => PromoCode.delete(promo.id))
      );
      const failed = results.filter((result) => result.status === 'rejected').length;
      await fetchPromoCodes();
      if (failed) toast.error(`Deleted ${results.length - failed}, ${failed} failed`);
      else toast.success(`Deleted ${results.length} expired promo codes`);
      setConfirmClearExpired(false);
    } finally {
      setIsClearingExpired(false);
    }
  };

  const stats = useMemo(
    () => ({
      total: promoCodes.length,
      active: promoCodes.filter(
        (promo) =>
          promo.is_active &&
          (!promo.valid_until || promo.valid_until >= new Date().toISOString().slice(0, 10))
      ).length,
      totalUses: promoCodes.reduce(
        (total, promo) => total + (promo.is_signup_offer_template ? 0 : promo.current_uses || 0),
        0
      ),
    }),
    [promoCodes]
  );

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-10"
    >
      <m.div variants={FADE_UP}>
        <AdminPageHeader
          title="Promo Codes"
          description="Discount codes and direct subscription grants"
          tip="Discount or tier codes. Deactivation only stops new redemptions."
        >
          {expiredPromos.length > 0 && (
            <AdminButton onClick={() => setConfirmClearExpired(true)}>
              <Trash2 className="w-3.5 h-3.5" />
              Clear {expiredPromos.length} expired
            </AdminButton>
          )}
          <AdminButton onClick={() => setIsAddingPromo(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add promo code
          </AdminButton>
        </AdminPageHeader>
        <PromoCodeDialog
          open={isAddingPromo}
          onOpenChange={setIsAddingPromo}
          promo={newPromo}
          onPromoChange={setNewPromo}
          onCreate={handleAddPromo}
          campaigns={campaigns}
        />
      </m.div>
      <m.div variants={FADE_UP} className="grid grid-cols-3 gap-3">
        <Kpi label="Active" value={stats.active} sub={`of ${stats.total} total`} />
        <Kpi label="Total redemptions" value={stats.totalUses.toLocaleString()} />
        <Kpi label="Total codes" value={stats.total} />
      </m.div>
      <m.div variants={FADE_UP}>
        <PromoCodeGrid
          loading={loading}
          promoCodes={promoCodes}
          onCreate={() => setIsAddingPromo(true)}
          onToggle={togglePromoStatus}
          onDelete={handleDeletePromo}
          intelligence={intelligence}
        />
      </m.div>
      <AlertDialog open={!!promoToDelete} onOpenChange={(open) => !open && setPromoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete promo code{' '}
              <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                {promoToDelete?.code}
              </span>
              ? Once deleted, learners will no longer be able to redeem this code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPromo}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePromo}
              disabled={isDeletingPromo}
              className="bg-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.9)] text-white"
            >
              {isDeletingPromo ? 'Deleting…' : 'Delete Code'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmClearExpired} onOpenChange={setConfirmClearExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expired promo codes</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {expiredPromos.length} promo codes whose expiry date has
              passed. Signup-offer templates are kept. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearingExpired}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmClearExpiredPromos();
              }}
              disabled={isClearingExpired}
              className="bg-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.9)] text-white"
            >
              {isClearingExpired ? 'Deleting…' : `Delete ${expiredPromos.length} codes`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </m.div>
  );
};

export default PromoManagement;
