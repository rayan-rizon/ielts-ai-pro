import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ArrowDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const FlowchartBuilder = ({ initialData, onChange, theme }) => {
  // Default theme fallback
  const t = theme || {
    primary: 'bg-primary',
    text: 'text-primary',
    light: 'bg-muted/30',
    border: 'border-border',
  };

  // Structure:
  // {
  //   mode: "flowchart", // Fixed
  //   box_title: "Phase 1: Research",
  //   style: "ABC", // "ABC", "ROMAN", "NONE" (for direct input)
  //   answer_mode: "dropdown", // "dropdown" or "input"
  //   steps: [
  //      { id: 's1', text: 'Locate files and [gap] them.', type: 'box' },
  //      { id: 's2', text: 'Review data', type: 'box' }
  //   ],
  //   options: ["select", "organize", "delete", ...], // if answer_mode is dropdown
  //   answers: { "0": "select" } // Map gap index to option
  // }

  const data = {
    box_title: initialData?.box_title || 'Process Flow',
    style: initialData?.style || 'ABC',
    answer_mode: initialData?.answer_mode || 'dropdown',
    steps: initialData?.steps || [
      { id: `s${Date.now()}`, text: 'Step 1: [gap]', type: 'box' },
      { id: `s${Date.now()}+1`, text: 'Step 2: [gap]', type: 'box' },
    ],

    options: initialData?.options || ['', '', ''],
    answers: initialData?.answers || {},
    ...initialData,
  };

  const updateField = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const addStep = () => {
    updateField('steps', [...data.steps, { id: `s${Date.now()}`, text: '', type: 'box' }]);
  };

  const removeStep = (index) => {
    updateField(
      'steps',
      data.steps.filter((_, i) => i !== index)
    );
  };

  const updateStep = (index, val) => {
    const newSteps = [...data.steps];
    newSteps[index] = { ...newSteps[index], text: val };
    updateField('steps', newSteps);
  };

  const insertGap = (index) => {
    const step = data.steps[index];
    updateStep(index, step.text + ' [gap]');
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

  const getOptionLabel = (index) => {
    if (data.style === 'ROMAN') {
      const romans = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
      return romans[index] || String(index + 1);
    }
    return String.fromCharCode(65 + index); // default ABC
  };

  // Preserve the learner-facing question numbers in the answer key so admins
  // do not have to translate "Gap 1" back to Question 8, 9, etc.
  const gapNumbers = data.steps.flatMap((step) => {
    const gapCount = (step.text.match(/\[gap\]/g) || []).length;
    return Array.from({ length: gapCount }, (_, index) => step.gap_numbers?.[index] ?? null);
  });
  const totalGaps = gapNumbers.length;

  return (
    <div className="space-y-6" data-oid="48-f0qe">
      {/* Settings Header */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border ${t.light} ${t.border}`}
        data-oid="1:0floe"
      >
        <div data-oid="3b-3xxw">
          <label
            className="text-xs font-semibold uppercase text-muted-foreground mb-1 block"
            data-oid="7a-.x_w"
          >
            Diagram Title
          </label>
          <Input
            value={data.box_title}
            onChange={(e) => updateField('box_title', e.target.value)}
            placeholder="e.g. Stages of Production"
            className="bg-background"
            data-oid="83krwc5"
          />
        </div>
        <div className="flex gap-4" data-oid="vfyu:8e">
          <div className="flex-1" data-oid="k-zkfd0">
            <label
              className="text-xs font-semibold uppercase text-muted-foreground mb-1 block"
              data-oid=":se8wcy"
            >
              Answer Type
            </label>
            <Select
              value={data.answer_mode}
              onValueChange={(val) => updateField('answer_mode', val)}
              data-oid="zune::w"
            >
              <SelectTrigger className="bg-background" data-oid="hso6jao">
                <SelectValue data-oid="boozj4h" />
              </SelectTrigger>
              <SelectContent data-oid="3cgw4yq">
                <SelectItem value="dropdown" data-oid="_ssy6rj">
                  Selection Box (Matching)
                </SelectItem>
                <SelectItem value="input" data-oid=".hgrf6o">
                  Fill in the blank
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start" data-oid="ht-u7e8">
        {/* Steps Visual Editor */}
        <div className="space-y-4" data-oid="f6-msw3">
          <div className="flex items-center justify-between" data-oid=":dnhiud">
            <h4 className="font-semibold text-sm flex items-center gap-2" data-oid="63y630r">
              <ArrowDown className="w-4 h-4 text-muted-foreground" data-oid="2.qdqck" />
              Process Steps
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={addStep}
              className={`h-7 text-xs ${t.text} hover:${t.light}`}
              data-oid="r_fs-0v"
            >
              <Plus className="w-3 h-3 mr-1" data-oid="uw265wy" /> Add Step
            </Button>
          </div>

          <div className="space-y-0 relative" data-oid="4ciudd-">
            {/* Vertical Line Connector */}
            <div
              className="absolute left-[1.65rem] top-4 bottom-4 w-0.5 bg-border -z-10"
              data-oid="o0ghg0f"
            />

            {data.steps.map((step, i) => (
              <div key={step.id} className="group relative pb-6 last:pb-0" data-oid="ndhp6ws">
                <div className="flex gap-3 items-start" data-oid="ibe96k:">
                  <div
                    className="w-12 h-12 rounded-lg bg-background border shadow-sm flex items-center justify-center shrink-0 z-10 text-xs font-bold text-muted-foreground"
                    data-oid="14_s0lx"
                  >
                    {i + 1}
                  </div>
                  <div
                    className="flex-1 bg-background border rounded-lg p-3 shadow-sm relative group-hover:border-primary/50 transition-colors"
                    data-oid="zdk0nvj"
                  >
                    <Textarea
                      value={step.text}
                      onChange={(e) => updateStep(i, e.target.value)}
                      placeholder="Description... use [gap] for blanks"
                      className="min-h-[60px] resize-none text-sm border-0 focus-visible:ring-0 px-0 shadow-none bg-transparent"
                      data-oid="g:jrxx8"
                    />

                    <div
                      className="flex justify-end gap-2 mt-2 pt-2 border-t border-dashed border-border"
                      data-oid="ebsn9k7"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertGap(i)}
                        className={`h-6 text-[10px] ${t.text} hover:${t.light}`}
                        data-oid="6u46d5x"
                      >
                        + Insert Gap
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(i)}
                        className="h-6 text-[10px] text-muted-foreground hover:text-destructive"
                        data-oid="dx777nd"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
                {i < data.steps.length - 1 && (
                  <div
                    className="absolute left-[1.65rem] -bottom-2 transform -translate-x-1/2 text-border"
                    data-oid="38immo:"
                  >
                    <ArrowDown className="w-4 h-4" data-oid="kobbqa." />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Options / Answers Side */}
        <div className="space-y-6 sticky top-4" data-oid="75_mhnl">
          {data.answer_mode === 'dropdown' && (
            <div className={`p-4 rounded-xl border ${t.light} ${t.border}`} data-oid="hlq6wlo">
              <h4 className="font-semibold text-sm mb-3" data-oid="kmb2h2q">
                Options Box
              </h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1" data-oid="do9srp-">
                {data.options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center" data-oid="fnqz85d">
                    <Badge
                      variant="outline"
                      className="w-8 h-8 flex items-center justify-center bg-background"
                      data-oid="8kevz6g"
                    >
                      {getOptionLabel(i)}
                    </Badge>
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${getOptionLabel(i)}`}
                      className="h-8 bg-background"
                      data-oid="nxjoo0u"
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(i)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      data-oid="j.cn5hv"
                    >
                      <Trash2 className="w-4 h-4" data-oid="vt-p16x" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="w-full border-dashed bg-background"
                  data-oid="lqj__ya"
                >
                  <Plus className="w-3 h-3 mr-1" data-oid="w2e3ypw" /> Add Option
                </Button>
              </div>
            </div>
          )}

          <div className="bg-card p-4 rounded-xl border shadow-sm" data-oid="kcd_qbf">
            <h4 className={`font-semibold text-sm mb-3 ${t.text}`} data-oid="m:9p7y6">
              Answer Key
            </h4>
            {totalGaps === 0 ? (
              <p className="text-xs text-muted-foreground italic" data-oid="cj8ehnw">
                Add [gap] to steps to configure answers.
              </p>
            ) : (
              <div className="space-y-2" data-oid="lx2mzc8">
                {Array.from({ length: totalGaps }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                    data-oid="yyxbm7z"
                  >
                    <span className="text-muted-foreground" data-oid="o_9hx3o">
                      {gapNumbers[i] == null ? `Gap ${i + 1}` : `Question ${gapNumbers[i]}`}
                    </span>
                    {data.answer_mode === 'dropdown' ? (
                      <Select
                        value={data.answers?.[i] || ''}
                        onValueChange={(val) =>
                          updateField('answers', { ...data.answers, [i]: val })
                        }
                        data-oid="0gn5urc"
                      >
                        <SelectTrigger className="w-32 h-8" data-oid="m0h7yws">
                          <SelectValue placeholder="Select" data-oid="lfvsjxu" />
                        </SelectTrigger>
                        <SelectContent data-oid="3jd25h_">
                          {data.options.map((opt, oIdx) => (
                            <SelectItem key={oIdx} value={getOptionLabel(oIdx)} data-oid="q1av522">
                              <span className="font-bold mr-2" data-oid="7019ndh">
                                {getOptionLabel(oIdx)}
                              </span>{' '}
                              {opt.substring(0, 15)}
                              {opt.length > 15 && '...'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={data.answers?.[i] || ''}
                        onChange={(e) =>
                          updateField('answers', { ...data.answers, [i]: e.target.value })
                        }
                        placeholder="Correct Answer"
                        className="w-32 h-8"
                        data-oid="tfit_e9"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            {data.answer_mode === 'input' && totalGaps > 0 && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Separate accepted alternatives with / (for example: fermentation / fermentation
                process).
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowchartBuilder;
