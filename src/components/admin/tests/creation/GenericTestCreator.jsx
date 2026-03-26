import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';

// --- History Hook ---
const useHistory = (initialState) => {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState([initialState]);
  const [pointer, setPointer] = useState(0);

  const set = (newState) => {
    const next = typeof newState === 'function' ? newState(state) : newState;
    const newHistory = history.slice(0, pointer + 1);
    newHistory.push(next);
    setHistory(newHistory);
    setPointer(newHistory.length - 1);
    setState(next);
  };

  const undo = () => {
    if (pointer > 0) {
      setPointer(pointer - 1);
      setState(history[pointer - 1]);
    }
  };

  const redo = () => {
    if (pointer < history.length - 1) {
      setPointer(pointer + 1);
      setState(history[pointer + 1]);
    }
  };

  return [state, set, undo, redo, pointer > 0, pointer < history.length - 1];
};

const GenericTestCreator = ({ initialData, onSave, onCancel, testType }) => {
  const [formData, setFormData, undo, redo, canUndo, canRedo] = useHistory({
    title: initialData?.title || '',
    access_tier: initialData?.access_tier || 'free',
    test_type: testType,
    is_official_cambridge: initialData?.is_official_cambridge || false,
    cambridge_year: initialData?.cambridge_year || new Date().getFullYear(),
    cambridge_test_number: initialData?.cambridge_test_number || 1,
    // Keep complex structures as JSON string for editing
    raw_data: JSON.stringify(
      {
        listening_sections: initialData?.content
          ? typeof initialData.content === 'string'
            ? JSON.parse(initialData.content)
            : initialData.content
          : initialData?.listening_sections || [],
        speaking_parts: initialData?.speaking_parts || [],
        writing_tasks: initialData?.writing_tasks || [],
      },
      null,
      2
    ),
  });

  // Auto-save Effect
  useEffect(() => {
    if (!initialData && typeof localStorage !== 'undefined') {
      const timer = setTimeout(() => {
        localStorage.setItem(
          `${testType}_test_draft`,
          JSON.stringify({ formData, timestamp: Date.now() })
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, testType, initialData]);

  // Load draft on mount
  useEffect(() => {
    if (!initialData && typeof localStorage !== 'undefined') {
      const draft = localStorage.getItem(`${testType}_test_draft`);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.formData && parsed.formData.testType === testType) {
            setFormData(parsed.formData);
          }
        } catch (e) {}
      }
    }
  }, []);

  // Auto-format title for official tests
  useEffect(() => {
    if (formData.is_official_cambridge) {
      // Book number formula: year - 2005 (e.g., 2015 = IELTS 10)
      const bookNumber = formData.cambridge_year - 2005;
      const formattedTitle = `IELTS ${bookNumber} Academic ${formData.cambridge_year} Test ${formData.cambridge_test_number}`;
      if (formattedTitle !== formData.title) {
        setFormData((prev) => ({ ...prev, title: formattedTitle }));
      }
    }
  }, [formData.is_official_cambridge, formData.cambridge_year, formData.cambridge_test_number]);

  const handleSave = () => {
    try {
      const parsedData = JSON.parse(formData.raw_data);
      onSave({
        ...initialData,
        title: formData.title,
        access_tier: formData.access_tier,
        test_type: testType,
        is_official_cambridge: formData.is_official_cambridge,
        cambridge_year: formData.cambridge_year,
        cambridge_test_number: formData.cambridge_test_number,
        content: formData.raw_data, // Save as stringified JSON if that's what backend expects for 'content' column
      });
    } catch (e) {
      alert('Invalid JSON in test data: ' + e.message);
    }
  };

  return (
    <div className="space-y-6" data-oid="ecj:gto">
      <div className="flex items-center justify-between" data-oid="lmuakyi">
        <h2 className="text-2xl font-bold capitalize text-foreground" data-oid="58:.u0h">
          {testType} Test Editor
        </h2>
        <div className="flex gap-2" data-oid="80lj2q_">
          <div className="flex items-center gap-1 mr-2 bg-muted p-1 rounded-lg" data-oid="noy8rmt">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              data-oid="p95s3fs"
            >
              <span className="text-lg" data-oid="tq09civ">
                ↺
              </span>{' '}
              {/* Fallback icon */}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              data-oid="wl5x0pu"
            >
              <span className="text-lg transform scale-x-[-1] inline-block" data-oid="je930ox">
                ↺
              </span>{' '}
              {/* Fallback for Redo */}
            </Button>
          </div>
          <Button variant="outline" onClick={onCancel} data-oid="q5z6d3l">
            <X className="w-4 h-4 mr-2" data-oid="qy28ifm" /> Cancel
          </Button>
          <Button onClick={handleSave} data-oid="_lus4p6">
            <Save className="w-4 h-4 mr-2" data-oid=":l:1_2t" /> Save
          </Button>
        </div>
      </div>

      <Card data-oid="r378d.-">
        <CardHeader data-oid="nl_w25v">
          <CardTitle data-oid="wv_:.nw">Test Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="5.daor2">
          <div className="grid gap-2" data-oid="7z748qr">
            <Label data-oid="489yi5q">Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Cambridge 15 Test 1"
              data-oid="hni5hbu"
            />
          </div>

          <div className="grid gap-2" data-oid="qms9goc">
            <Label data-oid="j4_mogk">Access Tier</Label>
            <Select
              value={formData.access_tier}
              onValueChange={(val) => setFormData((prev) => ({ ...prev, access_tier: val }))}
              data-oid="f5ivro4"
            >
              <SelectTrigger data-oid="xiq9rxi">
                <SelectValue data-oid="b99ye5e" />
              </SelectTrigger>
              <SelectContent data-oid="tlmm.5o">
                <SelectItem value="free" data-oid="4g-_cvd">
                  Free
                </SelectItem>
                <SelectItem value="pro" data-oid="d3rj4m-">
                  Pro
                </SelectItem>
                <SelectItem value="premium" data-oid="o:i6dsv">
                  Premium
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2" data-oid=".w-3l5t">
            <Label className="flex items-center gap-2 cursor-pointer" data-oid="b87sxfh">
              <input
                type="checkbox"
                checked={formData.is_official_cambridge}
                onChange={(e) =>
                  setFormData({ ...formData, is_official_cambridge: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                data-oid="t6_7gae"
              />

              <span data-oid="sod5fke">Official Cambridge Test</span>
            </Label>

            {formData.is_official_cambridge && (
              <div
                className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300 p-3 bg-muted/30 rounded-lg border border-dashed"
                data-oid="bi2etcs"
              >
                <div className="grid gap-1.5 flex-1" data-oid="e75eri_">
                  <Label data-oid="75kcje1">Year</Label>
                  <Input
                    type="number"
                    min="2000"
                    max="2030"
                    value={formData.cambridge_year}
                    onChange={(e) =>
                      setFormData({ ...formData, cambridge_year: parseInt(e.target.value) })
                    }
                    data-oid="rgxrnky"
                  />
                </div>
                <div className="grid gap-1.5 flex-1" data-oid="i0x7-1l">
                  <Label data-oid="fbw7zqo">Test Number</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.cambridge_test_number}
                    onChange={(e) =>
                      setFormData({ ...formData, cambridge_test_number: parseInt(e.target.value) })
                    }
                    data-oid="iqgt9x3"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2" data-oid="_yv5u5.">
            <Label data-oid="m0cecb4">Access Tier</Label>
            <Select
              value={formData.access_tier}
              onValueChange={(v) => setFormData({ ...formData, access_tier: v })}
              data-oid="gnwj76z"
            >
              <SelectTrigger data-oid="x9x07k6">
                <SelectValue data-oid="cqh-sxp" />
              </SelectTrigger>
              <SelectContent data-oid="f6-d6u4">
                <SelectItem value="free" data-oid="o:8je9-">
                  Free
                </SelectItem>
                <SelectItem value="premium" data-oid="mwrjv4t">
                  Premium
                </SelectItem>
                <SelectItem value="platinum" data-oid="o_s3dfh">
                  Platinum
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2" data-oid="l:yelaa">
            <Label data-oid="5rwzwwu">Test Data (JSON Configuration)</Label>
            <Textarea
              className="font-mono h-96"
              value={formData.raw_data}
              onChange={(e) => setFormData({ ...formData, raw_data: e.target.value })}
              data-oid="603fm7k"
            />

            <p className="text-xs text-muted-foreground" data-oid="j4.ov8q">
              Configure {testType} specific sections here (sections, tasks, prompts). Validation
              will be applied on save.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default GenericTestCreator;
