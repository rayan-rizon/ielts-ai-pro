import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Minus,
  RotateCcw,
  Eye,
  EyeOff,
  Grid3X3,
  Eraser,
  AlignCenter,
  Type,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TableBuilder = ({ initialData, onChange, className = '', theme, startNum }) => {
  // Default theme fallback
  const t = theme || {
    primary: 'bg-primary',
    text: 'text-primary',
    light: 'bg-muted/30',
    border: 'border-border',
    hover: 'hover:bg-muted/50',
  };

  const [tableData, setTableData] = useState({
    headers: ['Head 1', 'Head 2'],
    rows: [
      ['', ''],
      ['', ''],
    ],

    blanks: [], // Array of {row, col, answer, blankNumber}
    title: '', // NEW: Table Title
  });

  const [showPreview, setShowPreview] = useState(false);

  // Sync blanks with text content
  // Sync with parent
  const onChangeRef = React.useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Prevent infinite loops by tracking the last emitted string
  const lastEmittedRef = React.useRef(null);

  // Sync from parent (initialData) -> local state
  useEffect(() => {
    if (initialData) {
      // Check if incoming data is actually different from current local state to avoid unnecessary resets
      // This prevents the loop: Local Change -> onChange -> Parent Update -> initialData Update -> Local Reset -> Loop
      const incomingState = {
        headers: initialData.table_headers || ['Head 1', 'Head 2'],
        rows: initialData.table_rows || [
          ['', ''],
          ['', ''],
        ],
        blanks: initialData.blank_positions || [],
        title: initialData.title || '',
      };

      // Construct a comparable object from current state
      const currentComparable = {
        headers: tableData.headers,
        rows: tableData.rows,
        blanks: tableData.blanks,
        title: tableData.title,
      };

      if (JSON.stringify(incomingState) !== JSON.stringify(currentComparable)) {
        setTableData(incomingState);
      }
    }
  }, [initialData]);

  // Sync from local state -> parent (onChange)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onChangeRef.current) {
        const payload = {
          headers: tableData.headers,
          rows: tableData.rows,
          blanks: tableData.blanks,
          title: tableData.title,
          table_headers: tableData.headers,
          table_rows: tableData.rows,
          blank_positions: tableData.blanks,
          blanks_count: tableData.blanks.length,
        };

        const payloadString = JSON.stringify(payload);

        // Only emit if data actually changed
        if (payloadString !== lastEmittedRef.current) {
          lastEmittedRef.current = payloadString;
          onChangeRef.current(payload);
        }
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [tableData]);

  // AUTO-SYNC BLANKS FROM TEXT
  // If user types "__BLANK_15__" manually, it should appear in the answers list
  useEffect(() => {
    const detectedBlanks = [];
    tableData.rows.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        const matches = (cell || '').matchAll(/__BLANK_(\d+)__/g);
        for (const match of matches) {
          const num = parseInt(match[1]);
          // Deduplicate: Only add if this blank number hasn't been seen yet
          if (!detectedBlanks.some((b) => b.blankNumber === num)) {
            // Find if we already have an answer for this blank in current state
            const existing = tableData.blanks.find((b) => b.blankNumber === num);
            detectedBlanks.push({
              row: rIdx,
              col: cIdx,
              blankNumber: num,
              answer: existing?.answer || '',
              id: `${rIdx}_${cIdx}_${num}`,
            });
          }
        }
      });
    });

    // Detect if we actually need to update to avoid infinite loop
    const currentBlanksStr = JSON.stringify(
      tableData.blanks
        .sort((a, b) => a.blankNumber - b.blankNumber)
        .map((b) => ({ n: b.blankNumber, r: b.row, c: b.col }))
    );
    const detectedBlanksStr = JSON.stringify(
      detectedBlanks
        .sort((a, b) => a.blankNumber - b.blankNumber)
        .map((b) => ({ n: b.blankNumber, r: b.row, c: b.col }))
    );

    if (currentBlanksStr !== detectedBlanksStr) {
      setTableData((prev) => ({
        ...prev,
        blanks: detectedBlanks.sort((a, b) => a.blankNumber - b.blankNumber),
      }));
    }
  }, [tableData.rows]);

  // --- Actions ---
  const addRow = () =>
    setTableData((prev) => ({
      ...prev,
      rows: [...prev.rows, new Array(prev.headers.length).fill('')],
    }));
  const addColumn = () =>
    setTableData((prev) => ({
      ...prev,
      headers: [...prev.headers, 'New Column'],
      rows: prev.rows.map((r) => [...r, '']),
    }));

  const removeRow = (idx) => {
    setTableData((prev) => {
      if (prev.rows.length <= 1) return prev;
      const newRows = prev.rows.filter((_, i) => i !== idx);
      // Adjust blanks
      const newBlanks = prev.blanks
        .filter((b) => b.row !== idx)
        .map((b) => (b.row > idx ? { ...b, row: b.row - 1 } : b));
      return { ...prev, rows: newRows, blanks: newBlanks };
    });
  };

  const removeColumn = (idx) => {
    setTableData((prev) => {
      if (prev.headers.length <= 1) return prev;
      const newHeaders = prev.headers.filter((_, i) => i !== idx);
      const newRows = prev.rows.map((r) => r.filter((_, i) => i !== idx));
      const newBlanks = prev.blanks
        .filter((b) => b.col !== idx)
        .map((b) => (b.col > idx ? { ...b, col: b.col - 1 } : b));
      return { ...prev, headers: newHeaders, rows: newRows, blanks: newBlanks };
    });
  };

  const updateHeader = (idx, val) =>
    setTableData((prev) => ({
      ...prev,
      headers: prev.headers.map((h, i) => (i === idx ? val : h)),
    }));
  const updateCell = (rIdx, cIdx, val) =>
    setTableData((prev) => ({
      ...prev,
      rows: prev.rows.map((r, i) => (i === rIdx ? r.map((c, j) => (j === cIdx ? val : c)) : r)),
    }));

  // --- Selection Tracking ---
  const [lastSelection, setLastSelection] = useState(null);

  const handleSelect = (rIdx, cIdx, e) => {
    setLastSelection({
      row: rIdx,
      col: cIdx,
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    });
  };

  // --- Blank Management ---
  const addBlank = (rIdx, cIdx) => {
    setTableData((prev) => {
      const cellText = prev.rows[rIdx][cIdx] || '';
      const nextBlankNum =
        prev.blanks.length > 0
          ? Math.max(...prev.blanks.map((b) => b.blankNumber || 0)) + 1
          : startNum || 1;
      const blankTag = `__BLANK_${nextBlankNum}__`;

      let newText = cellText;

      // Check if we have a valid selection for this cell
      if (lastSelection && lastSelection.row === rIdx && lastSelection.col === cIdx) {
        const { start, end } = lastSelection;
        // Replace selection
        const prefix = cellText.substring(0, start);
        const suffix = cellText.substring(end);
        newText = prefix + blankTag + suffix;
      } else {
        // Append to end
        newText = cellText + (cellText ? ' ' : '') + blankTag;
      }

      // Update cell content
      const newRows = prev.rows.map((r, i) =>
        i === rIdx ? r.map((c, j) => (j === cIdx ? newText : c)) : r
      );

      // Add new blank metadata
      const newBlank = {
        row: rIdx,
        col: cIdx,
        answer: '',
        blankNumber: nextBlankNum,
        id: `${rIdx}_${cIdx}_${nextBlankNum}`, // Add unique ID
      };

      return { ...prev, rows: newRows, blanks: [...prev.blanks, newBlank] };
    });
    setLastSelection(null); // Clear selection after adding
  };

  const updateBlankAnswer = (blankNum, val) => {
    setTableData((prev) => ({
      ...prev,
      blanks: prev.blanks.map((b) => (b.blankNumber === blankNum ? { ...b, answer: val } : b)),
    }));
  };

  const hasBlank = (r, c) => tableData.blanks.some((b) => b.row === r && b.col === c);
  const getBlanksInCell = (r, c) => tableData.blanks.filter((b) => b.row === r && b.col === c);

  return (
    <div className={`space-y-4 ${className}`} data-oid="_1vbqbs">
      {/* NEW: Table Title Input */}
      <div className="space-y-1" data-oid=":bvt9ik">
        <label className="text-xs font-medium text-muted-foreground uppercase" data-oid=".e6k7t:">
          Table Title (Optional)
        </label>
        <Input
          value={tableData.title || ''}
          onChange={(e) => setTableData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="e.g. Tourist attractions in Manham"
          className="font-bold text-lg border-x-0 border-t-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent"
          data-oid="lr.klqi"
        />
      </div>

      {/* Editor Toolbar */}
      <div
        className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-slate-50/80 to-gray-50/80 dark:from-slate-800/50 dark:to-gray-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm shadow-slate-500/10 overflow-x-auto"
        data-oid="wyde:xp"
      >
        <div className="flex items-center gap-2 flex-shrink-0" data-oid="lj-c:xe">
          <Button
            variant="outline"
            size="sm"
            onClick={addColumn}
            className="bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all duration-200 whitespace-nowrap"
            data-oid="atkqi_x"
          >
            <Plus className="w-3 h-3 mr-1" data-oid="tp456l2" /> Add Column
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            className="bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all duration-200 whitespace-nowrap"
            data-oid="tss3kdj"
          >
            <Plus className="w-3 h-3 mr-1" data-oid="y52gg93" /> Add Row
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setTableData({
                headers: ['Head 1', 'Head 2'],
                rows: [
                  ['', ''],
                  ['', ''],
                ],

                blanks: [],
              })
            }
            className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 whitespace-nowrap"
            data-oid="1h0_wbj"
          >
            <RotateCcw className="w-3 h-3 mr-1" data-oid="ocl-.uv" /> Reset
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" data-oid="1y45o1f">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className={`${t.text} ${t.hover} transition-all duration-200 whitespace-nowrap`}
            data-oid="ck02ylo"
          >
            {showPreview ? (
              <EyeOff className="w-3 h-3 mr-1" data-oid="3o.:qiw" />
            ) : (
              <Eye className="w-3 h-3 mr-1" data-oid="mcbay7_" />
            )}{' '}
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div
        className="border rounded-xl overflow-hidden bg-background shadow-lg ring-1 ring-slate-900/10 dark:ring-slate-100/10"
        data-oid="p6lf5rd"
      >
        <div className="overflow-x-auto max-w-full" data-oid="qi-s316">
          <table className="w-full text-sm border-collapse" data-oid="c_18e_d">
            <thead data-oid="-.p6.0t">
              <tr
                className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border-b border-slate-200/60 dark:border-slate-700/60"
                data-oid="2_s_vdf"
              >
                {tableData.headers.map((h, i) => (
                  <th
                    key={i}
                    className="p-3 border-r border-slate-200/60 dark:border-slate-700/60 min-w-[150px] relative group h-14"
                    data-oid="3_k104k"
                  >
                    <Input
                      value={h}
                      onChange={(e) => updateHeader(i, e.target.value)}
                      className="h-9 border-transparent hover:border-slate-300 dark:hover:border-slate-600 bg-transparent text-center font-bold text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-400 dark:focus:border-blue-500 rounded-md transition-all duration-200 shadow-sm"
                      placeholder="Header..."
                      data-oid="zdmry.c"
                    />

                    <button
                      onClick={() => removeColumn(i)}
                      className="absolute -top-2 -right-2 bg-red-100 dark:bg-red-900/50 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-200 dark:hover:bg-red-800/50 shadow-sm hover:shadow-md"
                      title="Remove Column"
                      data-oid="o:3a2sk"
                    >
                      <Minus className="w-3 h-3" data-oid="a873_a:" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody data-oid="o_7:9vy">
              {tableData.rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={`border-b border-slate-100 dark:border-slate-800 last:border-0 group/row transition-colors duration-200 ${rIdx % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50/30 dark:bg-slate-800/30'} hover:bg-slate-50/50 dark:hover:bg-slate-800/50`}
                  data-oid="ahek94i"
                >
                  {row.map((cell, cIdx) => {
                    const cellBlanks = getBlanksInCell(rIdx, cIdx);
                    return (
                      <td
                        key={cIdx}
                        className={`p-3 border-r border-slate-100 dark:border-slate-800 min-w-[150px] relative align-top ${cellBlanks.length > 0 ? 'bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10' : ''} transition-colors duration-200`}
                        data-oid="h1iedf1"
                      >
                        <div className="relative group/cell" data-oid="1rl53js">
                          <Textarea
                            value={cell}
                            onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                            onSelect={(e) => handleSelect(rIdx, cIdx, e)}
                            className={`min-h-[60px] text-xs resize-y border-transparent hover:border-slate-300 dark:hover:border-slate-600 bg-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-blue-400 dark:focus:border-blue-500 rounded-md transition-all duration-200 shadow-sm ${cellBlanks.length > 0 ? 'border-blue-200/60 dark:border-blue-800/50' : ''}`}
                            placeholder="Content..."
                            rows={2}
                            data-oid="3_7qfwt"
                          />

                          {/* Cell Tools */}
                          <div
                            className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover/cell:opacity-100 transition-all duration-200 z-10"
                            data-oid="phgfkee"
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                              onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
                              onClick={() => {
                                const newVal = cell ? cell + '\n• ' : '• ';
                                updateCell(rIdx, cIdx, newVal);
                              }}
                              title="Add Bullet Point"
                              data-oid="8zd8.tn"
                            >
                              <span className="text-xs leading-none" data-oid="8a7fk.w">
                                •
                              </span>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400"
                              onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
                              onClick={() => addBlank(rIdx, cIdx)}
                              title="Insert Blank at Cursor"
                              data-oid="z2_m3ib"
                            >
                              <Type className="w-3 h-3" data-oid="jb5_.fv" />
                            </Button>
                          </div>
                        </div>
                        {cIdx === 0 && (
                          <button
                            onClick={() => removeRow(rIdx)}
                            className="absolute -left-2 top-1/2 -translate-y-1/2 bg-red-100 dark:bg-red-900/50 text-red-500 rounded-full p-0.5 opacity-0 group-hover/row:opacity-100 transition-all duration-200 hover:bg-red-200 dark:hover:bg-red-800/50 shadow-sm hover:shadow-md z-10"
                            title="Remove Row"
                            data-oid="4kybo7c"
                          >
                            <Minus className="w-3 h-3" data-oid="t1klh12" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Preview */}
      <AnimatePresence data-oid="betwhw:">
        {showPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border rounded-lg bg-background p-4"
            data-oid="mlf2bbu"
          >
            <h4
              className="text-sm font-bold text-muted-foreground uppercase mb-2"
              data-oid="i3ouxde"
            >
              Student Preview
            </h4>
            <table
              className="w-full border-collapse border border-border text-sm"
              data-oid="5lsetp6"
            >
              <thead data-oid="knq0f:1">
                <tr className="bg-muted/50" data-oid="-ldf56b">
                  {tableData.headers.map((h, i) => (
                    <th key={i} className="border border-border p-2 text-left" data-oid="dru3:v0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody data-oid="r2wvq:l">
                {tableData.rows.map((row, rIdx) => (
                  <tr key={rIdx} data-oid="ds363p:">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="border border-border p-2 align-top"
                        data-oid="0p.b4iz"
                      >
                        {/* Parse and display inline blanks */}
                        <span className="whitespace-pre-wrap" data-oid="n9s.2x9">
                          {cell.split(/(__BLANK_\d+__)/g).map((part, i) => {
                            if (part.match(/__BLANK_\d+__/)) {
                              return (
                                <span
                                  key={i}
                                  className="inline-block w-16 border-b border-gray-400 dark:border-slate-500 mx-1"
                                  data-oid="iqyb-cg"
                                ></span>
                              );
                            }

                            // Render bold markers
                            const innerParts = part.split(/(\*\*[^*]+\*\*)/g);
                            return innerParts.map((inner, j) => {
                              if (inner.startsWith('**') && inner.endsWith('**')) {
                                return (
                                  <strong key={j} className="font-bold">
                                    {inner.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return inner;
                            });
                          })}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blanks Summary */}
      {tableData.blanks.length > 0 && (
        <div className={`rounded-lg p-3 border ${t.light} ${t.border}`} data-oid="_ueyj62">
          <div className="flex items-center gap-2 mb-2" data-oid="-hyilfe">
            <Badge
              variant="outline"
              className={`bg-background ${t.text} ${t.border}`}
              data-oid="pgfr15w"
            >
              {tableData.blanks.length} Blanks
            </Badge>
            <span className={`text-xs font-medium ${t.text}`} data-oid="1hx6x:s">
              Verify your answers below
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2" data-oid="xgm0o68">
            {tableData.blanks
              .sort((a, b) => a.blankNumber - b.blankNumber)
              .map((b, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 bg-background p-1.5 rounded-lg border shadow-sm ${t.border}`}
                  data-oid=":kml064"
                >
                  <div
                    className={`w-5 h-5 rounded-full ${t.light} ${t.text} flex items-center justify-center text-[10px] font-bold shrink-0`}
                    data-oid="e91r-qj"
                  >
                    {b.blankNumber}
                  </div>
                  <Input
                    value={b.answer}
                    onChange={(e) => updateBlankAnswer(b.blankNumber, e.target.value)}
                    className="h-6 text-xs border-0 p-0 focus-visible:ring-0 bg-transparent"
                    placeholder="Answer..."
                    data-oid="s7q4:ii"
                  />
                </div>
              ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2" data-oid="p_rsbw7">
            * Blanks are numbered in order of creation. Ensure placeholders match these numbers.
          </p>
        </div>
      )}
    </div>
  );
};

export default TableBuilder;
