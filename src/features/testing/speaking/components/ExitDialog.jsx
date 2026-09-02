import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmExitDialog } from '@/shared/ui';

const ExitDialog = React.memo(({ open, onOpenChange, blocker, isExitingRef, onBeforeExit }) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleExit = async () => {
    if (isSaving) return;
    const target = blocker.location;
    setIsSaving(true);
    try {
      await onBeforeExit?.();
    } finally {
      isExitingRef.current = true;
      onOpenChange(false);
      setIsSaving(false);
    }

    if (blocker.state === 'blocked') {
      blocker.reset();
      setTimeout(() => navigate(target), 0);
    } else {
      navigate('/speaking');
    }
  };

  return (
    <ConfirmExitDialog
      open={open}
      onOpenChange={onOpenChange}
      onCancel={() => blocker.reset?.()}
      onConfirm={handleExit}
      isConfirming={isSaving}
      title="Exit Test?"
      description="Your progress will be saved. You can resume this test later from the Speaking Library."
      confirmLabel="Save & Exit"
    />
  );
});

ExitDialog.displayName = 'ExitDialog';
export default ExitDialog;
