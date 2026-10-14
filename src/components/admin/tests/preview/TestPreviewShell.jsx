import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Pill } from '@/features/dashboard/components/primitives.jsx';
import { X, RotateCcw } from 'lucide-react';
export default function TestPreviewShell({ title, moduleName, onClose, onReset, children }) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/65" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col bg-[#f8f8fb] dark:bg-[#08080a] text-foreground outline-none overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <Dialog.Title className="sr-only">Full {moduleName} student preview</Dialog.Title>
          <Dialog.Description className="sr-only">
            Current editor content. Preview answers stay local and no student session is created.
          </Dialog.Description>
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#e4e2f0] dark:border-white/[0.07] bg-white dark:bg-[#131315]">
            <div className="flex items-center gap-2 min-w-0">
              <Pill tone="accent">Student preview</Pill>
              <span className="text-xs truncate">
                {title || `${moduleName} test`} · no submissions
              </span>
            </div>
            <div className="flex gap-2">
              {onReset && (
                <Button size="sm" variant="outline" onClick={onReset}>
                  <RotateCcw className="size-3.5 mr-1.5" />
                  Reset preview
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                aria-label="Close student preview"
                onClick={onClose}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
