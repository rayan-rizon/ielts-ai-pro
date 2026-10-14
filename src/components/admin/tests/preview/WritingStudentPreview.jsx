import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TaskPanelView } from '@/features/testing/writing/components/WritingTest/components/TaskPanel';
import { WritingEditor } from '@/features/testing/writing/components/WritingTest/components/WritingEditor';
import TestPreviewShell from './TestPreviewShell';
export default function WritingStudentPreview({ tasks, title, onClose }) {
  const [active, setActive] = useState('Task 1'),
    [drafts, setDrafts] = useState({ 'Task 1': '', 'Task 2': '' }),
    [showSample, setShowSample] = useState(false),
    [finished, setFinished] = useState(false);
  const writing = drafts[active] || '';
  const setWriting = useCallback(
    (value) =>
      setDrafts((previous) =>
        previous[active] === value ? previous : { ...previous, [active]: value }
      ),
    [active]
  );
  const count = (writing.replace(/<[^>]*>/g, ' ').match(/\S+/g) || []).length;
  return (
    <TestPreviewShell
      moduleName="Writing"
      title={title}
      onClose={onClose}
      onReset={() => {
        setDrafts({ 'Task 1': '', 'Task 2': '' });
        setFinished(false);
      }}
    >
      <div className="flex justify-between items-center gap-3 p-3 border-b border-[#e4e2f0] dark:border-white/[0.07] bg-white dark:bg-[#131315]">
        <div className="flex gap-2">
          {['Task 1', 'Task 2'].map((task) => (
            <Button
              key={task}
              size="sm"
              variant={task === active ? 'default' : 'outline'}
              onClick={() => {
                setActive(task);
                setShowSample(false);
              }}
            >
              {task}
            </Button>
          ))}
        </div>
        <span className="font-mono text-xs">60:00</span>
        <Button size="sm" onClick={() => setFinished(true)}>
          Finish preview
        </Button>
      </div>
      {finished && (
        <p role="status" className="p-2 text-xs">
          Preview complete. Your sample writing was not submitted or evaluated.
        </p>
      )}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        <div className="md:w-1/2 h-1/2 md:h-full shrink-0">
          <TaskPanelView
            task={{ ...tasks[active], activeType: active }}
            showSample={showSample}
            setShowSample={setShowSample}
            isInset
          />
        </div>
        <div className="md:w-1/2 h-1/2 md:h-full min-h-64">
          <WritingEditor
            key={active}
            writing={writing}
            setWriting={setWriting}
            wordCount={count}
            targetLimit={active === 'Task 1' ? 150 : 250}
            isCompleted={finished}
            previewMode
            title={active}
          />
        </div>
      </div>
    </TestPreviewShell>
  );
}
