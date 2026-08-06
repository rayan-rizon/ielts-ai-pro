import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
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
}) => {
  const [confirmInput, setConfirmInput] = useState('');

  const handleConfirm = () => {
    if (confirmInput === confirmText) {
      onConfirm();
      setConfirmInput('');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setConfirmInput('');
      onClose();
    }
  };

  const isConfirmed = confirmInput === confirmText;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-[#131315] border border-stone-200/90 dark:border-white/10 sm:max-w-md rounded-lg p-4 sm:p-5">
        <DialogHeader className="space-y-0.5">
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-[rgb(var(--signal-fault))]">
            <AlertTriangle className="h-4 w-4" />
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

        <DialogFooter className="sm:justify-between gap-2">
          <AdminButton variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancel
          </AdminButton>
          <AdminButton
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
            loading={isLoading}
            className="min-w-[100px] justify-center"
          >
            {isLoading ? 'Deleting…' : 'Delete'}
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefinedDeleteModal;
