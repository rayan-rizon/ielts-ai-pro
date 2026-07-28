import { BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { skillLabel } from '../constants';

function GuideContent({ content }) {
  const lines = String(content || '').split('\n');
  return (
    <div className="space-y-3 text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={`${trimmed}-${index}`}
              className="pt-2 text-base font-extrabold text-slate-950 dark:text-white"
            >
              {trimmed.slice(3)}
            </h3>
          );
        }
        if (trimmed.startsWith('- ')) {
          return (
            <div key={`${trimmed}-${index}`} className="flex gap-2 pl-1">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6872e8]" />
              <span>{trimmed.slice(2).replaceAll('**', '')}</span>
            </div>
          );
        }
        return <p key={`${trimmed}-${index}`}>{trimmed.replaceAll('**', '')}</p>;
      })}
    </div>
  );
}

export default function GrammarResourceDialog({ resource, onOpenChange }) {
  return (
    <Dialog open={Boolean(resource)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl border-[#e3e6f4] bg-white p-0 dark:border-white/10 dark:bg-[#10131f]">
        {resource && (
          <>
            <DialogHeader className="border-b border-[#eceef7] bg-[#fafbff] px-6 py-5 text-left dark:border-white/10 dark:bg-white/[0.025]">
              <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#5963d9]">
                <BookOpen className="h-4 w-4" />
                {skillLabel(resource.skill_code)} · {resource.estimated_minutes} min
              </div>
              <DialogTitle className="text-xl font-extrabold tracking-tight">
                {resource.title}
              </DialogTitle>
              <DialogDescription className="font-medium leading-5">
                {resource.summary}
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-5">
              <GuideContent content={resource.content_markdown} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
