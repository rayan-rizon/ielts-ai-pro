import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AlertTriangle, LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, NUM, AdminButton } from '@/components/admin/ui/primitives';

const RefinedDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete item',
  description = 'This action cannot be undone.',
  itemIdentifier = null,
  confirmText = 'DELETE',
  isLoading = false,
  confirmationKey,
  actionLabel = 'Delete',
  pendingLabel = 'Deleting…',
  destructive = true,
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const busy = isLoading || pending;
  useEffect(() => {
    setConfirmInput('');
    setError('');
  }, [isOpen, confirmText, itemIdentifier, confirmationKey]);

  const handleConfirm = async () => {
    if (confirmInput !== confirmText || busy || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    try {
      const result = await onConfirm();
      if (result !== false) setConfirmInput('');
    } catch {
      setError('The action could not be completed. Please try again.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  const handleClose = () => {
    if (!busy && !inFlight.current) {
      setConfirmInput('');
      setError('');
      onClose();
    }
  };

  const isConfirmed = confirmInput === confirmText;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-[#131315] border border-stone-200/90 dark:border-white/10 sm:max-w-md rounded-lg p-4 sm:p-5">
        <DialogHeader className="space-y-0.5">
          <DialogTitle
            className={cn(
              'flex items-center gap-2 text-base font-extrabold',
              destructive ? 'text-[rgb(var(--signal-fault))]' : 'text-[#5a63df]'
            )}
          >
            {destructive ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <LockKeyhole className="h-4 w-4" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription
            className={cn(MICRO, 'text-stone-500 dark:text-stone-400 normal-case')}
          >
            {description}
          </DialogDescription>
        </DialogHeader>

        {itemIdentifier && (
          <div className="text-xs font-bold text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-white/3 p-2.5 rounded-md border border-stone-200/70 dark:border-white/6">
            {itemIdentifier}
          </div>
        )}

        <div className="space-y-2 py-1">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            To confirm, type{' '}
            <span className={cn(NUM, 'font-bold text-stone-900 dark:text-stone-50 select-all')}>
              {confirmText}
            </span>{' '}
            below:
          </p>
          <Input
            aria-label="Confirmation text"
            disabled={busy}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={confirmText}
            autoComplete="off"
            className={cn(
              NUM,
              'h-10 rounded-md border-[rgb(var(--signal-fault)/0.3)] bg-white dark:bg-[#131315] text-xs font-medium focus-visible:ring-[rgb(var(--signal-fault)/0.4)]'
            )}
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-[rgb(var(--signal-fault))]">
            {error}
          </p>
        )}
        <DialogFooter className="sm:justify-between gap-2">
          <AdminButton variant="ghost" onClick={handleClose} disabled={busy}>
            Cancel
          </AdminButton>
          <AdminButton
            variant={destructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={!isConfirmed || busy}
            loading={busy}
            className="min-w-[100px] justify-center"
          >
            {busy ? pendingLabel : actionLabel}
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefinedDeleteModal;
