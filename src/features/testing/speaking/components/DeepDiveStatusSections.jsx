import React from 'react';
import { Bot, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DeepDiveHeader({ detailedFeedback, isAllExpanded, onToggleExpandAll }) {
  return (
    <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-4">
      <h3 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-orange-500" />
        </div>
        Question Deep Dive
      </h3>
      <div className="flex items-center gap-3">
        {detailedFeedback && (
          <ExpandCollapseButton isAllExpanded={isAllExpanded} onClick={onToggleExpandAll} />
        )}
      </div>
    </div>
  );
}

function ExpandCollapseButton({ isAllExpanded, onClick }) {
  const Icon = isAllExpanded ? ChevronUp : ChevronDown;
  const label = isAllExpanded ? 'Collapse All' : 'Expand All';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-600 transition-colors hidden md:flex"
    >
      <Icon className="w-3 h-3 mr-1.5" /> {label}
    </Button>
  );
}

export function DeepDiveErrorState({ onRetry }) {
  return (
    <div className="p-8 text-center rounded-[2rem] border border-red-500/20 bg-red-500/5">
      <p className="text-sm text-muted-foreground mb-3">
        Deep dive analysis could not be generated.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="text-xs font-bold">
        <RefreshCw className="w-3 h-3 mr-1.5" /> Retry
      </Button>
    </div>
  );
}

export function DeepDiveEmptyPrompt({ onGenerate }) {
  return (
    <div className="p-8 text-center rounded-[2rem] border border-orange-500/20 bg-orange-500/5">
      <p className="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">
        Generate an optional question-by-question review when you need detailed corrections and
        stronger sample answers.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerate}
        className="text-xs font-bold border-orange-500/30 hover:bg-orange-500/10"
      >
        <Sparkles className="w-3 h-3 mr-1.5" /> Generate Deep Dive
      </Button>
    </div>
  );
}
