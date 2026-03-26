import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2 } from 'lucide-react';

const RefinedDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  description = 'This action cannot be undone.',
  itemIdentifier = null,
  confirmText = 'DELETE',
  isLoading = false,
}) => {
  const [confirmInput, setConfirmInput] = useState('');

  const handleConfirm = () => {
    if (confirmInput === confirmText) {
      onConfirm();
      setConfirmInput(''); // Reset for next time
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
    <Dialog open={isOpen} onOpenChange={handleClose} data-oid="pv_qo9w">
      <DialogContent className="sm:max-w-md" data-oid="5.3xq26">
        <DialogHeader data-oid="96hnfwm">
          <DialogTitle className="flex items-center gap-2 text-destructive" data-oid="f3i2b88">
            <AlertTriangle className="h-5 w-5" data-oid="95a68y7" />
            {title}
          </DialogTitle>
          <DialogDescription data-oid="boyg1xm">
            {description}
            {itemIdentifier && (
              <div
                className="mt-2 text-foreground font-medium bg-muted p-2 rounded border border-border"
                data-oid=":0wtrpt"
              >
                {itemIdentifier}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2" data-oid="l-9vaif">
          <p className="text-sm text-muted-foreground" data-oid="5si9:_i">
            To confirm, please type{' '}
            <span className="font-bold text-foreground select-all" data-oid="wc1ceh0">
              {confirmText}
            </span>{' '}
            below:
          </p>
          <Input
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={confirmText}
            className="border-destructive/30 focus-visible:ring-destructive"
            autoComplete="off"
            data-oid="g:j8vtg"
          />
        </div>

        <DialogFooter className="sm:justify-between gap-2" data-oid="10b91j2">
          <Button variant="ghost" onClick={handleClose} disabled={isLoading} data-oid="ikzw451">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
            className="min-w-[100px]"
            data-oid="5ui3o6h"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="59pm7ap" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefinedDeleteModal;
