import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Calendar, Gift, Mic, PenLine, Save, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, AdminButton } from '../ui/primitives';

const FIELD_LABEL = cn(
  MICRO,
  'text-stone-500 dark:text-stone-400 mb-1.5 flex items-center gap-1.5'
);
const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';

function TierFormFields({ formData, setFormData }) {
  return (
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
  );
}

export function RewardTierModals({
  showAddModal,
  setShowAddModal,
  editingTier,
  formData,
  setFormData,
  saving,
  onSave,
  tierToDelete,
  setTierToDelete,
  deletingTier,
  onDeleteConfirm,
}) {
  const isEditing = Boolean(editingTier);
  const isDeleteOpen = Boolean(tierToDelete);

  return (
    <>
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-white dark:bg-[#131315] border border-stone-200/90 dark:border-white/10 w-[95vw] max-w-md rounded-lg overflow-hidden shadow-lg p-4 sm:p-5">
          <DialogHeader className="space-y-0.5">
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
              <Gift className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              {isEditing ? 'Edit reward tier' : 'Add reward tier'}
            </DialogTitle>
            <DialogDescription className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
              Set the referral threshold and rewards unlocked at this tier
            </DialogDescription>
          </DialogHeader>

          <TierFormFields formData={formData} setFormData={setFormData} />

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <AdminButton variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </AdminButton>
            <AdminButton
              onClick={onSave}
              disabled={saving || !formData.referrals_required}
              loading={saving}
            >
              <Save className="w-3.5 h-3.5" />
              {isEditing ? 'Update' : 'Create'}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={(open) => !open && setTierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reward Tier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the reward tier for {tierToDelete?.referrals_required}{' '}
              referral(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingTier}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteConfirm}
              disabled={deletingTier}
              className="bg-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.9)] text-white"
            >
              {deletingTier ? 'Deleting…' : 'Delete Tier'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default RewardTierModals;
