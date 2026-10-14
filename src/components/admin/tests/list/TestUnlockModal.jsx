import RefinedDeleteModal from '@/components/admin/shared/RefinedDeleteModal';

export default function TestUnlockModal({ isOpen, onClose, onConfirm }) {
  return (
    <RefinedDeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Unlock test changes"
      description="Enable editing, deletion and bulk status changes for this visit. Saving, leaving an editor, changing modules or closing a delete dialog locks changes again. Preview is always available."
      confirmText="UNLOCK"
      actionLabel="Unlock changes"
      pendingLabel="Unlocking…"
      destructive={false}
    />
  );
}
