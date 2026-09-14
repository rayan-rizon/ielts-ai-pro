import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { ScanLine } from 'lucide-react';

// Custom button for inserting gaps in Quill
const ToolBar = ({ id }) => {
  return (
    <div
      id={id}
      className="bg-stone-50 dark:bg-[#18181b] border-b border-stone-200 dark:border-white/10 rounded-t-md p-2 flex items-center gap-2 flex-wrap"
    >
      <span className="ql-formats">
        <select
          className="ql-header text-stone-700 dark:text-stone-200 font-semibold"
          defaultValue=""
          onChange={(e) => e.persist()}
        >
          <option value="1" />
          <option value="2" />
          <option selected />
        </select>
        <button className="ql-bold" />
        <button className="ql-italic" />
        <button className="ql-underline" />
      </span>
      <span className="ql-formats">
        <button className="ql-list" value="ordered" />
        <button className="ql-list" value="bullet" />
        <button className="ql-indent" value="-1" />
        <button className="ql-indent" value="+1" />
      </span>
      <div className="w-px h-6 bg-stone-200 dark:bg-white/10 mx-1" />
      <span className="ql-formats">
        <button className="ql-insertGap w-auto! px-3! flex! items-center! gap-1.5! rounded-lg! h-8! transition-all duration-150 ease-smooth-out active:scale-95 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/50">
          <ScanLine className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">Insert Blank</span>
        </button>
      </span>
    </div>
  );
};

const GapFillBuilder = ({ initialData, onChange }) => {
  const [content, setContent] = useState(initialData?.text || '');
  const [answers, setAnswers] = useState(initialData?.answers || {});
  const [boxTitle, setBoxTitle] = useState(initialData?.box_title || '');
  const [toolbarId] = useState(() => `gap-fill-toolbar-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({
        text: content,
        answers: answers,
        box_title: boxTitle,
        question_count: (content.match(/\[gap\]/g) || []).length,
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [content, answers, boxTitle]);

  const modules = React.useMemo(
    () => ({
      toolbar: {
        container: `#${toolbarId}`,
        handlers: {
          insertGap: function () {
            const range = this.quill.getSelection();
            if (range) {
              this.quill.insertText(range.index, ' [gap] ');
              this.quill.setSelection(range.index + 7);
            }
          },
        },
      },
    }),
    [toolbarId]
  );

  const gapCount = (content.match(/\[gap\]/g) || []).length;
  const gaps = Array.from({ length: gapCount }).map((_, i) => i);

  const updateAnswer = (index, val) => {
    setAnswers((prev) => ({ ...prev, [index]: val }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Box Title (Optional)
          </label>
          <Input
            value={boxTitle}
            onChange={(e) => setBoxTitle(e.target.value)}
            placeholder="e.g. Questions 1-5: Complete the notes..."
            className="h-9 font-medium text-xs bg-white dark:bg-[#131315] border-stone-200 dark:border-white/10 text-stone-900 dark:text-stone-100"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#131315] rounded-xl border border-stone-200 dark:border-white/10 shadow-2xs overflow-hidden">
        <ToolBar id={toolbarId} />
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          placeholder="Start typing context here..."
          modules={modules}
          className="h-64 bg-white dark:bg-[#131315] text-stone-900 dark:text-stone-100 [&>.ql-editor]:min-h-[200px] [&>.ql-toolbar]:hidden [&_.ql-stroke]:stroke-stone-600 [&_.ql-stroke]:dark:stroke-stone-300 [&_.ql-fill]:fill-stone-600 [&_.ql-fill]:dark:fill-stone-300 [&_.ql-picker]:dark:text-stone-200 [&_.ql-picker-options]:dark:bg-[#18181b] [&_.ql-picker-options]:dark:border-white/10 [&_.ql-picker-item]:dark:text-stone-200"
        />
      </div>

      {gaps.length > 0 ? (
        <div className="p-4 rounded-xl border transition-colors bg-stone-50/80 dark:bg-[#18181b]/80 border-stone-200 dark:border-white/10">
          <h4 className="text-xs font-extrabold uppercase tracking-wider mb-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <ScanLine className="w-4 h-4" /> Answer Key & Scoring
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <AnimatePresence>
              {gaps.map((idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.96, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-2 bg-white dark:bg-[#131315] p-1.5 rounded-lg border border-stone-200 dark:border-white/10 shadow-2xs transition-all duration-150 ease-smooth-out hover:border-indigo-400 dark:hover:border-indigo-500 hover:-translate-y-0.5"
                >
                  <Badge className="w-6 h-6 flex items-center justify-center rounded-md bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-200 font-mono font-bold text-[10px] border-0 shrink-0">
                    {idx + 1}
                  </Badge>
                  <Input
                    value={answers[idx] || ''}
                    onChange={(e) => updateAnswer(idx, e.target.value)}
                    placeholder="Answer..."
                    className="h-7 text-xs bg-transparent border-0 focus-visible:ring-0 min-w-0 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 font-medium"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-xl bg-stone-50/50 dark:bg-white/2">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
            No blanks have been added yet. Click "Insert Blank" in the editor toolbar above to add
            questions.
          </p>
        </div>
      )}
    </div>
  );
};

export default GapFillBuilder;
