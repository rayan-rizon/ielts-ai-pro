import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { uploadToR2 } from '@/lib/r2';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Upload, ImageIcon, Loader2 } from 'lucide-react';

const MapLabelingBuilder = ({ initialData, onChange, theme }) => {
  // Default theme fallback
  const t = theme || {
    primary: 'bg-primary',
    text: 'text-primary',
    light: 'bg-muted',
    border: 'border-border',
  };

  const data = {
    image_url: initialData?.image_url || '',
    mode: initialData?.mode || 'dropdown', // 'dropdown' (matching) or 'text' (fill gap)
    options: initialData?.options || [], // For matching mode
    questions: initialData?.questions || [
      { id: `mq${Date.now()}`, label: '1', correct_answer: '' },
    ],

    ...initialData,
  };

  const updateField = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const [uploading, setUploading] = useState(false);

  const addQuestion = () => {
    const nextLabel =
      data.questions.length > 0
        ? String(parseInt(data.questions[data.questions.length - 1].label) + 1)
        : '1';
    updateField('questions', [
      ...data.questions,
      { id: `mq${Date.now()}`, label: nextLabel, correct_answer: '' },
    ]);
  };

  const removeQuestion = (index) => {
    updateField(
      'questions',
      data.questions.filter((_, i) => i !== index)
    );
  };

  const updateQuestion = (index, field, value) => {
    const newQs = [...data.questions];
    newQs[index] = { ...newQs[index], [field]: value };
    updateField('questions', newQs);
  };

  const addOption = () => {
    updateField('options', [...data.options, '']);
  };

  const removeOption = (index) => {
    updateField(
      'options',
      data.options.filter((_, i) => i !== index)
    );
  };

  const updateOption = (index, val) => {
    const newOpts = [...data.options];
    newOpts[index] = val;
    updateField('options', newOpts);
  };

  return (
    <div className="space-y-6" data-oid="e6qygsn">
      <div className={`p-4 rounded-lg border space-y-4 ${t.light} ${t.border}`} data-oid="6341w2k">
        <div className="flex items-start gap-4" data-oid="g5y-08z">
          <div
            className="w-32 h-32 bg-background rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground overflow-hidden relative group"
            data-oid="e:qq16n"
          >
            {data.image_url ? (
              <>
                <img
                  src={data.image_url}
                  alt="Map"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.classList.add('bg-red-50');
                    // We can't easily show a toast from here without causing loops if generic,
                    // but we can show a visual indicator
                    const span1 = document.createElement('span');
                    span1.textContent = 'Failed to load';
                    const span2 = document.createElement('span');
                    span2.className = 'text-[9px] mt-1 text-red-400';
                    span2.textContent = 'Try uploading manually';
                    e.target.parentElement.appendChild(span1);
                    e.target.parentElement.appendChild(span2);
                  }}
                  data-oid="ztz8_ab"
                />

                <div
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                  data-oid="4pq8ohc"
                >
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateField('image_url', '')}
                    data-oid="en7zb8e"
                  >
                    <Trash2 className="w-4 h-4" data-oid="4277z.m" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-stone-500 dark:text-stone-400" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" data-oid=":o671k." />
                    <span className="text-xs text-center px-2" data-oid="kqgvx0s">
                      No Image
                    </span>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex-1 space-y-3" data-oid="wc6r3g0">
            <div data-oid="ux11a02">
              <Label className="mb-1 block" data-oid="cwrszvd">
                Map/Diagram Image
              </Label>
              <div className="flex gap-2" data-oid="8xx_669">
                <Input
                  value={data.image_url}
                  onChange={(e) => updateField('image_url', e.target.value)}
                  placeholder="Paste URL or upload..."
                  className="flex-1 bg-background"
                  data-oid="-d44i1f"
                />

                <div className="relative" data-oid="on95-j5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative overflow-hidden bg-background"
                    data-oid="10x82g6"
                  >
                    <Upload className="w-4 h-4" data-oid="5tscr9h" />
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const { file_url } = await uploadToR2(file);
                          if (file_url) updateField('image_url', file_url);
                        } catch (err) {
                          console.error('Upload failed', err);
                        } finally {
                          setUploading(false);
                        }
                      }}
                      data-oid="fm4gghu"
                    />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1" data-oid="6qjqqzz">
                Upload the map image. The system will display it for students to label.
              </p>
            </div>
            <div data-oid=":wdbeo.">
              <Label className="mb-1 block" data-oid="ek85861">
                Answer Mode
              </Label>
              <Select
                value={data.mode}
                onValueChange={(val) => updateField('mode', val)}
                data-oid="hglw2_y"
              >
                <SelectTrigger className="bg-background" data-oid="mef4o5t">
                  <SelectValue data-oid="uerwotk" />
                </SelectTrigger>
                <SelectContent data-oid="kxg6b98">
                  <SelectItem value="dropdown" data-oid="ur6.307">
                    Selection List (Matching)
                  </SelectItem>
                  <SelectItem value="text" data-oid="d3xi8f1">
                    Direct Input (Short Answer)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Questions/Labels Definition */}
      <div className="grid md:grid-cols-2 gap-6" data-oid="dm7tr0t">
        <div data-oid="l9hj20p">
          <div className="flex items-center justify-between mb-2" data-oid="ydo2ok.">
            <Label data-oid="58.r07d">Label Questions</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={addQuestion}
              className={`h-6 gap-1 ${t.text} hover:${t.light} transition-all duration-150 ease-smooth-out active:scale-95`}
              data-oid="24zyojk"
            >
              <Plus className="w-3 h-3" data-oid="buahkdw" /> Add Label
            </Button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2" data-oid="jq.:um5">
            <AnimatePresence>
              {data.questions.map((q, idx) => (
                <motion.div
                  key={q.id || idx}
                  initial={{ opacity: 0, scale: 0.96, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-2 items-center"
                  data-oid="dh8az2_"
                >
                  <Badge
                    variant="outline"
                    className="w-12 h-9 flex items-center justify-center font-mono bg-background shrink-0"
                    data-oid="5i1.2mn"
                  >
                    {q.questionNumber || q.label || idx + 1}
                  </Badge>

                  {/* Show question text if available */}
                  {q.text && (
                    <div
                      className="flex-1 min-w-[120px] text-sm text-slate-700 dark:text-slate-300 truncate"
                      data-oid="s8nu2ca"
                    >
                      {q.text}
                    </div>
                  )}

                  {data.mode === 'dropdown' ? (
                    <Select
                      value={q.correct_answer || q.answer || ''}
                      onValueChange={(val) => updateQuestion(idx, 'correct_answer', val)}
                      data-oid="fofo-v8"
                    >
                      <SelectTrigger
                        className={`${q.text ? 'w-40' : 'flex-1'} bg-background`}
                        data-oid="qczlyo8"
                      >
                        <SelectValue placeholder="Select Answer" data-oid="vd3enib" />
                      </SelectTrigger>
                      <SelectContent data-oid="suw7vo6">
                        {data.options.map((opt, oIdx) => (
                          <SelectItem key={oIdx} value={opt || `opt-${oIdx}`} data-oid=":et.k6f">
                            {opt || '(Empty)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={q.correct_answer || q.answer || ''}
                      onChange={(e) => updateQuestion(idx, 'correct_answer', e.target.value)}
                      placeholder="Correct Answer"
                      className={`${q.text ? 'w-40' : 'flex-1'} bg-background`}
                      data-oid="-:scffs"
                    />
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(idx)}
                    className="text-muted-foreground hover:text-destructive h-9 w-9 shrink-0 transition-all duration-150 ease-smooth-out active:scale-90"
                    data-oid="v2v:_ng"
                  >
                    <Trash2 className="w-4 h-4" data-oid="mq.z03w" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            {data.questions.length === 0 && (
              <div
                className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20"
                data-oid="n3j1:ac"
              >
                No labels defined. Click "Add Label".
              </div>
            )}
          </div>
        </div>

        {/* Options List (Only for Dropdown Mode) */}
        {data.mode === 'dropdown' && (
          <div data-oid="ymk.ngk">
            <div className="flex items-center justify-between mb-2" data-oid="ld97omn">
              <Label data-oid=".jnm2va">Available Options (A, B, C...)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addOption}
                className={`h-6 gap-1 ${t.text} hover:${t.light} transition-all duration-150 ease-smooth-out active:scale-95`}
                data-oid="m4x_.tc"
              >
                <Plus className="w-3 h-3" data-oid="pfyjjhj" /> Add Option
              </Button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2" data-oid="cng:wnm">
              <AnimatePresence>
                {data.options.map((opt, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.96, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="flex gap-2 items-center"
                    data-oid="hdrl1r6"
                  >
                    <div
                      className="w-8 flex items-center justify-center font-bold text-muted-foreground text-sm"
                      data-oid="g9vaxwz"
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="bg-background"
                      data-oid="3uzv_fy"
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(idx)}
                      className="text-muted-foreground hover:text-destructive h-9 w-9 transition-all duration-150 ease-smooth-out active:scale-90"
                      data-oid="62kit8g"
                    >
                      <Trash2 className="w-4 h-4" data-oid="zc54itl" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {data.options.length === 0 && (
                <div
                  className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20"
                  data-oid="u-el_xs"
                >
                  No options added.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapLabelingBuilder;
