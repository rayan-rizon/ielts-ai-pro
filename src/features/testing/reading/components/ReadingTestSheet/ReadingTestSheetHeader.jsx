import React from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardList, X } from 'lucide-react';

export default function ReadingTestSheetHeader({ currentPassageIndex, setShowAnswerSheet }) {
  return (
    <div
      className="p-3 border-b border-border/40 flex items-center justify-between bg-muted/80 backdrop-blur-md"
      data-oid="hinh_w0"
    >
      <div className="flex items-center gap-2" data-oid="6-jfbps">
        <div
          className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center"
          data-oid="mv2hypi"
        >
          <ClipboardList className="w-4 h-4 text-primary" data-oid="xzyilry" />
        </div>
        <div data-oid="toc1ckr">
          <h3 className="font-bold text-sm text-foreground" data-oid="fw:s8pl">
            Answer Sheet
          </h3>
          <p className="text-[10px] text-muted-foreground" data-oid="uh6d9q-">
            Passage {currentPassageIndex + 1}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowAnswerSheet(false)}
        className="h-7 w-7 rounded-full hover:bg-muted transition-colors"
        data-oid="2.5g-:k"
      >
        <X className="w-4 h-4 text-muted-foreground" data-oid="c-xxotu" />
      </Button>
    </div>
  );
}
