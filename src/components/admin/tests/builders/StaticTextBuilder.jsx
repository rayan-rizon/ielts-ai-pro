import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const StaticTextBuilder = ({ initialData, onChange }) => {
  // Structure: { text: "HTML Content" }
  const data = {
    text: initialData?.text || '',
    ...initialData,
  };

  const handleChange = (val) => {
    onChange({ ...data, text: val });
  };

  return (
    <div className="space-y-2" data-oid="cmhcv.m">
      <label
        className="text-xs font-semibold uppercase text-muted-foreground mb-1 block"
        data-oid="13zx-.w"
      >
        Header / Title / Instruction Text
      </label>
      <div className="bg-background rounded-md border overflow-hidden" data-oid="qafhi9d">
        <ReactQuill
          theme="snow"
          value={data.text}
          onChange={handleChange}
          className="h-32 mb-12 dark:text-slate-200 [&>.ql-toolbar]:bg-muted/30 [&>.ql-toolbar]:border-b-border [&>.ql-container]:border-0"
          placeholder="Enter header or instruction text..."
          modules={{
            toolbar: [
              ['bold', 'italic', 'underline', 'strike'],
              [{ header: 1 }, { header: 2 }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ color: [] }, { background: [] }],
              ['clean'],
            ],
          }}
          data-oid="tpi8yf7"
        />
      </div>
      <p className="text-[10px] text-muted-foreground pt-2" data-oid="9kkjq9f">
        This text will appear in the test but does not contain any questions. Use it for section
        headers or specific instructions.
      </p>
    </div>
  );
};

export default StaticTextBuilder;
