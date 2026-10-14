import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

const MatchingFeaturesBuilder = ({ initialData, onChange, theme, startNum }) => {
  // Default theme fallback
  const t = theme || {
    primary: 'bg-primary',
    text: 'text-primary',
    light: 'bg-muted/30',
    border: 'border-border',
  };

  // Structure:
  // {
  //   box_title: "List of Scientists",
  //   style: "ABC", // "ABC" or "ROMAN"
  //   mode: "list", // "list" or "paragraph"
  //   options: ["Roger Angel", "Phil Rasch", ...],
  //   questions: [ ... ] (For 'list' mode)
  //   text: "Some text with [1] gaps.", (For 'paragraph' mode)
  //   answers: { 1: "A", 2: "B" } (For 'paragraph' mode)
  // }

  const data = {
    box_title: initialData?.box_title || 'List of Features',
    questions_title: initialData?.questions_title || '',
    style: initialData?.style || 'ABC',
    mode: initialData?.mode || 'list',
    options: initialData?.options || ['', '', ''],
    questions: initialData?.questions || [
      { id: 'q1', text: '', answer: '' },
      { id: 'q2', text: '', answer: '' },
    ],

    text: initialData?.text || '',
    answers: initialData?.answers || {},
    ...initialData,
  };

  const updateField = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  // Sync initial state on mount/changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onChange(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [
    data.mode,
    data.style,
    JSON.stringify(data.options),
    JSON.stringify(data.questions),
    data.text,
    JSON.stringify(data.answers),
  ]);

  const getOptionLabel = (index) => {
    if (data.style === 'ROMAN') {
      const romans = [
        'i',
        'ii',
        'iii',
        'iv',
        'v',
        'vi',
        'vii',
        'viii',
        'ix',
        'x',
        'xi',
        'xii',
        'xiii',
        'xiv',
        'xv',
        'xvi',
        'xvii',
        'xviii',
        'xix',
        'xx',
      ];

      return romans[index] || String(index + 1);
    }
    return String.fromCharCode(65 + index); // default ABC
  };

  const updateOption = (index, val) => {
    const newOptions = [...data.options];
    newOptions[index] = val;
    updateField('options', newOptions);
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

  const updateQuestion = (index, field, val) => {
    const newQuestions = [...data.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: val };
    updateField('questions', newQuestions);
  };

  const addQuestion = () => {
    updateField('questions', [...data.questions, { id: `mq${Date.now()}`, text: '', answer: '' }]);
  };

  const removeQuestion = (index) => {
    updateField(
      'questions',
      data.questions.filter((_, i) => i !== index)
    );
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    updateField('text', newText);
    // Automatically sync answers object with brackets found in text [1], [2] etc
    // logic: find all [n], ensure `answers` has key n.
    // Actually, let's just let the user insert placeholders and we render inputs based on regex match
  };

  const insertPlaceholder = () => {
    // Find next available number
    const matches = data.text.match(/\[(\d+)\]/g);
    let nextNum = startNum || 1;
    if (matches) {
      const nums = matches.map((m) => parseInt(m.match(/\d+/)[0]));
      nextNum = Math.max(...nums) + 1;
    }
    const textarea = document.getElementById('paragraph-text');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = data.text;
      const newText = text.substring(0, start) + `[${nextNum}]` + text.substring(end);
      updateField('text', newText);
    } else {
      updateField('text', data.text + ` [${nextNum}]`);
    }
  };

  // Extract placeholders for rendering answer inputs
  const placeholders = (data.text.match(/\[(\d+)\]/g) || []).map((m) => m.match(/\d+/)[0]);

  return (
    <div className="space-y-6" data-oid="oith8mp">
      <div className="grid grid-cols-2 gap-4" data-oid="003ok_c">
        <div data-oid="74a01l_">
          <label
            className="text-xs font-semibold uppercase text-muted-foreground mb-1 block"
            data-oid="5y5-_3q"
          >
            Numbering Style
          </label>
          <Select
            value={data.style}
            onValueChange={(val) => updateField('style', val)}
            data-oid="i1fw582"
          >
            <SelectTrigger className="shadow-none bg-background" data-oid="7hwpm1e">
              <SelectValue data-oid="eo1u-wp" />
            </SelectTrigger>
            <SelectContent
              data-oid="wnrdc9o"
              className="shadow-none rounded-lg border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-[#19181f] max-h-64"
            >
              <SelectGroup>
                <SelectItem value="ABC" data-oid="1m5f65m">
                  A, B, C...
                </SelectItem>
                <SelectItem value="ROMAN" data-oid="8nm8c0w">
                  i, ii, iii...
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div data-oid="faproid">
          <label
            className="text-xs font-semibold uppercase text-muted-foreground mb-1 block"
            data-oid="62p9nxc"
          >
            Question Mode
          </label>
          <Select
            value={data.mode}
            onValueChange={(val) => updateField('mode', val)}
            data-oid="z3:3p7_"
          >
            <SelectTrigger className="shadow-none bg-background" data-oid="4qws-m2">
              <SelectValue data-oid="edzz-5n" />
            </SelectTrigger>
            <SelectContent
              data-oid="_5:o4bj"
              className="shadow-none rounded-lg border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-[#19181f] max-h-64"
            >
              <SelectGroup>
                <SelectItem value="list" data-oid="v20437e">
                  List of Statements
                </SelectItem>
                <SelectItem value="paragraph" data-oid="_562dul">
                  Paragraph Text
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Box Definition */}
      <div className={`p-4 rounded-lg border ${t.light} ${t.border}`} data-oid="j2djat:">
        <div className="mb-4" data-oid="11089ny">
          <label
            className="text-xs font-semibold uppercase text-muted-foreground mb-1 block"
            data-oid="98n9p4x"
          >
            Box Title (e.g., List of Scientists)
          </label>
          <Input
            value={data.box_title}
            onChange={(e) => updateField('box_title', e.target.value)}
            placeholder="Box Title"
            className="font-medium bg-background"
            data-oid="0l4ej2s"
          />
        </div>

        <div data-oid="fblc:ju">
          <label
            className="text-xs font-semibold uppercase text-muted-foreground mb-2 block"
            data-oid="zyypc0l"
          >
            Options (The content inside the box)
          </label>
          <div className="space-y-2" data-oid="_i:48ok">
            <AnimatePresence>
              {data.options.map((opt, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.96, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-2 items-center"
                  data-oid="xggaaj5"
                >
                  <Badge
                    variant="outline"
                    className="w-10 h-8 flex items-center justify-center bg-background font-mono"
                    data-oid="z-s1l39"
                  >
                    {getOptionLabel(i)}
                  </Badge>
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${getOptionLabel(i)}`}
                    className="bg-background"
                    data-oid="3z:dfnm"
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(i)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 transition-all duration-150 ease-smooth-out active:scale-90"
                    data-oid="n05as9j"
                  >
                    <Trash2 className="w-4 h-4" data-oid="lrxf521" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
              className="w-full mt-2 border-dashed bg-background transition-all duration-150 ease-smooth-out active:scale-95"
              data-oid="18wnefn"
            >
              <Plus className="w-3 h-3 mr-1" data-oid="bco:pll" /> Add Option
            </Button>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div data-oid="jpi08gq">
        {data.mode === 'paragraph' ? (
          <div className="space-y-4" data-oid="k41pkcg">
            <div data-oid="s_title_blk">
              <label className="text-sm font-medium mb-1 block" data-oid="lbl_title">
                Summary Title (Optional)
              </label>
              <Input
                value={data.questions_title}
                onChange={(e) => updateField('questions_title', e.target.value)}
                placeholder="e.g. Jeremy Bentham"
                className="font-medium bg-background"
                data-oid="inp_title"
              />
            </div>

            <div data-oid="ssqqott">
              <label className="text-sm font-medium mb-1 block" data-oid="w4554wz">
                Paragraph Text (Use the button to insert question placeholders)
              </label>
              <div className="relative" data-oid="7lyxwim">
                <Textarea
                  id="paragraph-text"
                  value={data.text}
                  onChange={handleTextChange}
                  placeholder="Enter the text here. Example: Researchers found that [1] was caused by..."
                  className="min-h-[150px] font-mono text-sm bg-background"
                  data-oid="sa15jcv"
                />

                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-2 right-2 text-xs transition-all duration-150 ease-smooth-out active:scale-95"
                  onClick={insertPlaceholder}
                  data-oid="h-5d9n8"
                >
                  Insert Gap [N]
                </Button>
              </div>
            </div>

            {placeholders.length > 0 && (
              <div className={`p-4 rounded-lg border ${t.light} ${t.border}`} data-oid="l3yjd5.">
                <label
                  className="text-xs font-semibold uppercase text-muted-foreground mb-2 block"
                  data-oid="ndjjnzo"
                >
                  Correct Answers
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3" data-oid="qkc2qlh">
                  {placeholders.map((num) => (
                    <div key={num} className="flex items-center gap-2" data-oid="2vo-__2">
                      <Badge
                        variant="secondary"
                        className="h-8 w-8 flex justify-center bg-background"
                        data-oid="1.v5:2j"
                      >
                        {num}
                      </Badge>
                      <Select
                        value={data.answers?.[num] || ''}
                        onValueChange={(val) => {
                          updateField('answers', { ...data.answers, [num]: val });
                        }}
                        data-oid="5i8w42h"
                      >
                        <SelectTrigger className="shadow-none h-8 bg-background" data-oid="auw6ig3">
                          <SelectValue placeholder="?" data-oid="r2ksz_u" />
                        </SelectTrigger>
                        <SelectContent
                          data-oid="r1elpu4"
                          className="shadow-none rounded-lg border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-[#19181f] max-h-64"
                        >
                          <SelectGroup>
                            {data.options.map((_, optIdx) => (
                              <SelectItem
                                key={optIdx}
                                value={getOptionLabel(optIdx)}
                                data-oid="_n130w:"
                              >
                                {getOptionLabel(optIdx)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div data-oid="lqytp.d">
            <div className="flex items-center justify-between mb-3" data-oid="pk5v3wd">
              <label className="text-sm font-medium" data-oid="e.pe7s-">
                Questions / Statements
              </label>
              <div className="w-64" data-oid="iim_-dc">
                <Input
                  value={data.questions_title}
                  onChange={(e) => updateField('questions_title', e.target.value)}
                  placeholder="e.g. Statements"
                  className="h-8 text-xs bg-background"
                  data-oid="c:-qkwm"
                />
              </div>
            </div>
            <div className="space-y-3" data-oid="yu-31aa">
              <AnimatePresence>
                {data.questions.map((q, i) => (
                  <motion.div
                    key={q.id || i}
                    initial={{ opacity: 0, scale: 0.96, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="flex gap-3 items-start p-2 border rounded-lg bg-background transition-all duration-150 ease-smooth-out hover:border-stone-300 dark:hover:border-white/20"
                    data-oid="44t4f3c"
                  >
                    <div className="flex-1" data-oid=".6jjbem">
                      <Input
                        value={q.text}
                        onChange={(e) => updateQuestion(i, 'text', e.target.value)}
                        placeholder="Statement text..."
                        className="mb-0 bg-transparent border-0 focus-visible:ring-0 px-0"
                        data-oid="u3ffat_"
                      />
                    </div>
                    <div className="w-24" data-oid="jis-2c9">
                      <Select
                        value={q.answer}
                        onValueChange={(val) => updateQuestion(i, 'answer', val)}
                        data-oid="elx49ml"
                      >
                        <SelectTrigger data-oid="zs2sgro">
                          <SelectValue placeholder="Ans" data-oid="dc.9r34" />
                        </SelectTrigger>
                        <SelectContent
                          data-oid="z2:12aa"
                          className="shadow-none rounded-lg border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-[#19181f] max-h-64"
                        >
                          <SelectGroup>
                            {data.options.map((_, optIdx) => (
                              <SelectItem
                                key={optIdx}
                                value={getOptionLabel(optIdx)}
                                data-oid="x0-4qcy"
                              >
                                {getOptionLabel(optIdx)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(i)}
                      className="text-muted-foreground hover:text-destructive mt-1 h-8 w-8 p-0 transition-all duration-150 ease-smooth-out active:scale-90"
                      data-oid="fq6.335"
                    >
                      <Trash2 className="w-4 h-4" data-oid="fj1r7l:" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <Button
                variant="outline"
                size="sm"
                onClick={addQuestion}
                className={`w-full border-dashed ${t.text} hover:${t.light}`}
                data-oid=".w:fpcz"
              >
                <Plus className="w-3 h-3 mr-1" data-oid="m_1ri8n" /> Add Statement
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchingFeaturesBuilder;
