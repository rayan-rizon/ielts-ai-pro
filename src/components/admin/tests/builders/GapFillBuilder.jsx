import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Plus, Type, ScanLine, Info, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Custom button for inserting gaps in Quill
const ToolBar = ({ id, theme }) => {
  const t = theme || {
    light: 'bg-blue-50',
    text: 'text-blue-600',
    hover: 'hover:bg-blue-100',
    primaryHover: 'dark:hover:bg-blue-900/50',
  };
  return (
    <div
      id={id}
      className="dark:bg-slate-800 border-b dark:border-slate-700 rounded-t-md p-2 flex items-center gap-2"
      data-oid="79wswhs"
    >
      <span className="ql-formats" data-oid="pjihn5_">
        <select
          className="ql-header"
          defaultValue=""
          onChange={(e) => e.persist()}
          data-oid="ta3ae6."
        >
          <option value="1" data-oid="ku:d-s8" />
          <option value="2" data-oid="eg2s96a" />
          <option selected data-oid="--d8p7f" />
        </select>
        <button className="ql-bold" data-oid="vwo.4vx" />
        <button className="ql-italic" data-oid="82pjnp-" />
        <button className="ql-underline" data-oid="ciz7v8m" />
      </span>
      <span className="ql-formats" data-oid="4-vn8if">
        <button className="ql-list" value="ordered" data-oid="59f_zd-" />
        <button className="ql-list" value="bullet" data-oid="-j-4qzc" />
        <button className="ql-indent" value="-1" data-oid="cuok:19" />
        <button className="ql-indent" value="+1" data-oid="j-arevi" />
      </span>
      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" data-oid="je8r:b5" />
      <span className="ql-formats" data-oid="4v7l0ej">
        <button
          className={`ql-insertGap !w-auto !px-3 !flex !items-center !gap-2 !rounded-md !h-8 transition-colors ${t.light} ${t.text} ${t.hover}`}
          data-oid="2q3u5j:"
        >
          <ScanLine className="w-4 h-4" data-oid="091_2g:" />
          <span className="text-xs font-semibold" data-oid="wmk97n6">
            Insert Blank
          </span>
        </button>
      </span>
    </div>
  );
};

const GapFillBuilder = ({ initialData, onChange, theme }) => {
  // Default theme fallback
  const t = theme || {
    light: 'bg-blue-50/50',
    text: 'text-blue-800',
    border: 'border-blue-100',
    primary: 'bg-blue-500',
    primaryHover: 'hover:bg-blue-600',
  };

  /*
      Structure:
      {
        text: "Some text with [gap] tokens.",
        answers: { "0": "answer1", "1": "answer2" }, // Key corresponds to the index of [gap] in text
        gaps: [ { id: 0, answer: 'x' }, ... ] // Derived ordered list
      }
    */

  const [content, setContent] = useState(initialData?.text || '');
  const [answers, setAnswers] = useState(initialData?.answers || {});
  const [boxTitle, setBoxTitle] = useState(initialData?.box_title || '');
  // Fix: Use useState to ensure ID is stable and doesn't change on re-renders
  const [toolbarId] = useState(() => `gap-fill-toolbar-${Math.random().toString(36).substr(2, 9)}`);

  // We maintain a simple counter to ensure unique IDs for gaps if needed,
  // but primarily we rely on the order of [gap] tokens in the text.

  // Update parent whenever content or answers change
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({
        text: content,
        answers: answers,
        box_title: boxTitle, // NEW: Include box_title in output
        // Helper for the backend/rendering to know how many Qs
        question_count: (content.match(/\[gap\]/g) || []).length,
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [content, answers, boxTitle]);

  // Custom handler to insert [gap] at cursor
  const insertGap = () => {
    // This is a bit hacky with ReactQuill usually, but since we use a custom toolbar handler:
    // The handler is attached in modules below.
    // We actually need a ref to the editor to do this cleanly, or rely on the custom toolbar impl.
    // For simplicity, we'll suggest users use the toolbar button.
  }; // Memoize modules to prevent re-creation on every render which resets ReactQuill
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

  // Parse gaps from text to render answer inputs
  // We treat every occurrence of [gap] as a question in order.
  const gapCount = (content.match(/\[gap\]/g) || []).length;
  const gaps = Array.from({ length: gapCount }).map((_, i) => i);

  const updateAnswer = (index, val) => {
    setAnswers((prev) => ({ ...prev, [index]: val }));
  };

  return (
    <div className="space-y-6" data-oid="_rwn27o">
      <div className="flex flex-col md:flex-row gap-4" data-oid="h6td2vz">
        {/* Box Title Input */}
        <div className="flex-1 space-y-2" data-oid="9o4b1xb">
          <label
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            data-oid="r9av-rw"
          >
            Box Title (Optional)
          </label>
          <Input
            value={boxTitle}
            onChange={(e) => setBoxTitle(e.target.value)}
            placeholder="e.g. Questions 1-5: Complete the notes..."
            className="font-medium bg-background shadow-sm"
            data-oid="xhb1y-c"
          />
        </div>
      </div>

      <div
        className="bg-background rounded-lg border shadow-sm overflow-hidden ring-1 ring-slate-900/5 dark:ring-slate-100/10"
        data-oid="whdswqn"
      >
        <ToolBar id={toolbarId} theme={theme} data-oid="kdskqt7" />
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          placeholder="Start typing context here..."
          modules={modules}
          className="h-64 bg-background dark:text-slate-200 [&>.ql-editor]:min-h-[200px] [&>.ql-toolbar]:hidden [&_.ql-stroke]:dark:stroke-slate-200 [&_.ql-fill]:dark:fill-slate-200"
          data-oid="nhlm3w7"
        />
      </div>

      {gaps.length > 0 ? (
        <div
          className={`p-4 rounded-xl border transition-colors ${t.light} ${t.border}`}
          data-oid="jvmru7h"
        >
          <h4
            className={`text-sm font-bold mb-3 flex items-center gap-2 ${t.text}`}
            data-oid="aigeor4"
          >
            <ScanLine className="w-4 h-4" data-oid="e.t_8di" /> Answer Key & Scoring
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" data-oid="ad:rg84">
            {gaps.map((idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 bg-background p-1.5 rounded-lg border shadow-sm transition-colors hover:border-primary/50`}
                data-oid="wn3lk.b"
              >
                <Badge
                  className="w-6 h-6 flex items-center justify-center rounded-md bg-muted text-muted-foreground font-bold text-[10px] border-0"
                  data-oid="jsrd0f:"
                >
                  {idx + 1}
                </Badge>
                <Input
                  value={answers[idx] || ''}
                  onChange={(e) => updateAnswer(idx, e.target.value)}
                  placeholder="Answer..."
                  className="h-7 text-xs bg-transparent border-0 focus-visible:ring-0 min-w-0"
                  data-oid="tvxiba_"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="text-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/20"
          data-oid="fzrl:_2"
        >
          <p className="text-sm text-muted-foreground" data-oid="6-38j_3">
            No blanks have been added yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default GapFillBuilder;
