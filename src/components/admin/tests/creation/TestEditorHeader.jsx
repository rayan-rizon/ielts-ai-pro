import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ChevronUp, Loader2, Save, ShieldCheck } from 'lucide-react';

/**
 * Reusable Header for all Test Editors
 * Standardizes layout, styling, and metadata controls.
 */
const TestEditorHeader = ({
  title,
  theme,
  metadata = {},
  onMetadataChange,
  onTitleChange,
  onSave,
  onCancel,
  isSaving,
  lastSaved,
  showActiveToggle = false,
  leftActions /* Slot for undo/redo */,
  children /* Slot for extra buttons like "Show Passage" */,
}) => {
  // Helper to update specific metadata field
  const updateMeta = (field, value) => {
    onMetadataChange({ ...metadata, [field]: value });
  };

  const effectiveTheme = theme || {
    border: 'border-slate-200',
    light: 'bg-slate-50',
    text: 'text-slate-600',
    primary: 'bg-slate-900',
    primaryHover: 'hover:bg-slate-800',
    icon: ShieldCheck,
  };

  return (
    <div
      className={`px-4 sm:px-6 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b sticky top-0 flex flex-col lg:flex-row justify-between items-start lg:items-center shadow-sm z-50 gap-3 sm:gap-4 transition-all duration-300 ${effectiveTheme.border}`}
      data-oid="hbg5tnl"
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full min-w-0" data-oid=".jwbil7">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="shrink-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
          data-oid="pbsi-2d"
        >
          <ChevronUp className="h-5 w-5 -rotate-90 text-slate-500" data-oid="b3i0o_w" />
        </Button>

        <div
          className={`p-2.5 rounded-xl shrink-0 shadow-sm transition-transform hover:scale-110 ${effectiveTheme.light} ${effectiveTheme.text}`}
          data-oid="-w1qy:2"
        >
          <effectiveTheme.icon className="w-5 h-5" data-oid="4ram4_k" />
        </div>

        <div className="flex flex-col gap-1 w-full min-w-0" data-oid="_5sp-n8">
          <div
            className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-6"
            data-oid="mcvq5lt"
          >
            <div className="flex-1 min-w-0" data-oid="title-wrapper">
              <Input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="font-black text-lg sm:text-xl border-transparent px-0 hover:px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 border-b-2 border-b-transparent focus:border-b-blue-500 transition-all h-9 w-full focus-visible:ring-0 bg-transparent dark:text-white dark:placeholder-slate-500 placeholder:text-slate-400 tracking-tight rounded-none"
                placeholder="Untitled Test"
                data-oid="tj5:ft."
              />
            </div>

            {/* Metadata Pills Container */}
            <div className="flex items-center gap-2 flex-wrap min-w-0" data-oid="mecnn26">
              {/* Access Pill */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm transition-colors shrink-0 ${effectiveTheme.light} ${effectiveTheme.border} hover:bg-white dark:hover:bg-slate-800`}
                data-oid="lse70ga"
              >
                <span
                  className={`text-[10px] uppercase font-black tracking-widest opacity-60 ${effectiveTheme.text}`}
                  data-oid="nfe5f91"
                >
                  Access
                </span>
                <Select
                  value={metadata.access_tier || 'free'}
                  onValueChange={(v) => updateMeta('access_tier', v)}
                  data-oid=":rx1w-8"
                >
                  <SelectTrigger
                    className="h-4 w-auto gap-1 border-0 bg-transparent p-0 text-xs font-bold focus:ring-0 text-slate-900 dark:text-slate-100 min-w-[50px]"
                    data-oid="hdpyfip"
                  >
                    <SelectValue data-oid="_cvfqj-" />
                  </SelectTrigger>
                  <SelectContent data-oid="63e1u-v">
                    <SelectItem value="free" data-oid="ak2khxu">
                      Free
                    </SelectItem>
                    <SelectItem value="pro" data-oid="kzl8k5o">
                      Pro
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Toggle (Optional) */}
              {showActiveToggle && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm shrink-0"
                  data-oid="4l:ccur"
                >
                  <label
                    htmlFor="active-switch"
                    className="text-[10px] uppercase font-black tracking-widest text-slate-500 cursor-pointer"
                    data-oid="4hqtn5i"
                  >
                    Active
                  </label>
                  <Switch
                    id="active-switch"
                    checked={!!metadata.is_active}
                    onCheckedChange={(c) => updateMeta('is_active', c)}
                    className="scale-75 origin-left"
                    data-oid="jqcsic-"
                  />
                </div>
              )}

              {/* Official Cambridge Pill */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm transition-all duration-300 shrink-0 ${metadata.is_official_cambridge ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 shadow-amber-200/20' : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700'}`}
                data-oid="ec3-2rz"
              >
                <div className="flex items-center gap-2" data-oid="rrp432a">
                  <ShieldCheck
                    className={`w-4 h-4 transition-colors ${metadata.is_official_cambridge ? 'text-amber-500 fill-amber-500/10' : 'text-slate-300'}`}
                    data-oid="-stiqtv"
                  />

                  <span
                    className={`text-xs font-bold tracking-tight ${metadata.is_official_cambridge ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'}`}
                    data-oid="ipjijkj"
                  >
                    Official
                  </span>
                </div>
                <Checkbox
                  checked={!!metadata.is_official_cambridge}
                  onCheckedChange={(c) => updateMeta('is_official_cambridge', c)}
                  className={`h-4 w-4 rounded-md transition-all ${metadata.is_official_cambridge ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'}`}
                  data-oid="pc8otj8"
                />
              </div>

              {/* Cambridge Year/Num Selectors */}
              {metadata.is_official_cambridge && (
                <div
                  className="flex gap-2 animate-in fade-in zoom-in-95 duration-300 shrink-0"
                  data-oid="g3ckqhb"
                >
                  <Select
                    value={String(metadata.cambridge_year || new Date().getFullYear())}
                    onValueChange={(v) => updateMeta('cambridge_year', parseInt(v))}
                    data-oid="3-34gi5"
                  >
                    <SelectTrigger
                      className="h-8 w-24 rounded-xl border-amber-200 bg-amber-50/50 text-xs font-bold text-amber-900 dark:text-amber-400 dark:border-amber-950 dark:bg-amber-950/20"
                      data-oid="c37j9ee"
                    >
                      <SelectValue placeholder="Year" data-oid="h0s-tcr" />
                    </SelectTrigger>
                    <SelectContent data-oid="eigv.:7">
                      {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i + 1).map(
                        (y) => (
                          <SelectItem key={y} value={String(y)} data-oid="0jwi:bx">
                            {y}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(metadata.cambridge_test_number || 1)}
                    onValueChange={(v) => updateMeta('cambridge_test_number', parseInt(v))}
                    data-oid="k7r2ilv"
                  >
                    <SelectTrigger
                      className="h-8 w-24 rounded-xl border-amber-200 bg-amber-50/50 text-xs font-bold text-amber-900 dark:text-amber-400 dark:border-amber-950 dark:bg-amber-950/20"
                      data-oid="liz0al4"
                    >
                      <SelectValue placeholder="Test #" data-oid="7uehmxk" />
                    </SelectTrigger>
                    <SelectContent data-oid="oamropu">
                      {[1, 2, 3, 4].map((num) => (
                        <SelectItem key={num} value={String(num)} data-oid="mzp4on2">
                          Test {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Slot for extra controls (e.g. Show Passage) */}
              {children}
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-between lg:justify-end mt-2 lg:mt-0"
        data-oid="30pm5bi"
      >
        {/* Left Actions Slot (Undo/Redo) */}
        {leftActions && (
          <div
            className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl"
            data-oid="7l-sugo"
          >
            {leftActions}
          </div>
        )}

        {/* Last Saved Indicator */}
        {lastSaved && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 hidden sm:flex animate-in fade-in"
            data-oid="obai_kp"
          >
            <div className="relative flex h-2 w-2" data-oid="zxbdqlj">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                data-oid="a3m0fvt"
              ></span>
              <span
                className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"
                data-oid="du3hyjb"
              ></span>
            </div>
            <span className="text-[10px] font-bold tracking-tight" data-oid="uk5zj.k">
              Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto" data-oid="dxz3xe4">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-bold px-4 rounded-xl text-xs uppercase tracking-widest"
            data-oid="oio0e81"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSave(false)}
            disabled={isSaving}
            className={`shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 font-black rounded-xl h-10 px-6 text-xs uppercase tracking-widest ${effectiveTheme.primary} ${effectiveTheme.primaryHover} text-white hover:-translate-y-0.5 active:translate-y-0`}
            data-oid="wg9zj23"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" data-oid="rz.hxqy" />
            ) : (
              <Save className="w-4 h-4 mr-2" data-oid="4s7dfs-" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestEditorHeader;
