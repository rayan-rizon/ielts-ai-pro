import { Button } from '@/components/ui/button';
import { Panel, MUTED } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

function ObjectiveLibraryError({ onRetry }) {
  return (
    <Panel className="items-start gap-3 p-4">
      <p role="alert" className={cn(MUTED, 'text-sm')}>
        The tests couldn’t load. Try again.
      </p>
      <Button variant="outline" size="sm" onClick={() => onRetry()}>
        Try again
      </Button>
    </Panel>
  );
}

export default function ObjectiveLibraryResults({ error, onRetry, loading, skeleton, children }) {
  if (error) return <ObjectiveLibraryError onRetry={onRetry} />;
  return loading ? skeleton : children;
}
