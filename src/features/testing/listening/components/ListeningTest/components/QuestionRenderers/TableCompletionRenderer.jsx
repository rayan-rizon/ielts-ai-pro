import React from 'react';
import { Input } from '@/components/ui/input';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import { sanitizeHtml } from '@/lib/security';
import { cn } from '@/lib/cn';

const TableCompletionRenderer = ({
  question,
  answers,
  handleAnswerChange,
  toggleFlag,
  flaggedQuestions,
  isFinished,
  correctAnswersMap = {},
  isInsideMergedCard,
  cardClass,
}) => {
  // Support both field name conventions
  const tableHeaders = question.table_data.table_headers || question.table_data.headers || [];
  const tableRows = question.table_data.table_rows || question.table_data.rows || [];

  // Use computed display numbers
  const displayStart = question._displayStartNumber || question.question_number || 1;

  // Helper function to format cell content (convert markdown to HTML)
  const formatCellContent = (cell) => {
    if (!cell) return '';
    let formatted = cell;

    // Convert bold markdown (**text**) to bold
    formatted = formatted.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="font-bold text-slate-900 dark:text-slate-100">$1</strong>'
    );

    // Convert italic markdown (*text*) to italic
    formatted = formatted.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em class="italic">$1</em>');

    // Handle bullet points
    if (formatted.includes('•') || formatted.includes('- ')) {
      const bulletRegex = /[•\-]\s*([^•\-\n]+)/g;
      const bullets = [];
      let match;
      while ((match = bulletRegex.exec(formatted)) !== null) {
        bullets.push(match[1].trim());
      }

      if (bullets.length > 0) {
        return `<ul class="list-disc pl-4 space-y-0.5 text-base">${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`;
      }
    }

    // Handle newlines
    formatted = formatted.replace(/\n/g, '<br />');
    formatted = formatted.replace(/<br\s*\/?>/gi, '<br />');

    return sanitizeHtml(formatted);
  };

  // Pre-calculate all gaps in the table for correct numbering and unique key association
  const gapMapping = React.useMemo(() => {
    const mapping = [];
    tableRows.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (!cell) return;
        const cellMatches = cell.match(/\[gap\]|__BLANK__|__BLANK_\d+__/gi) || [];
        cellMatches.forEach((_, gIdx) => {
          mapping.push({
            rIdx,
            cIdx,
            gIdx, // index of the gap within this specific cell
            absoluteIdx: mapping.length,
            number: parseInt(displayStart) + mapping.length,
          });
        });
      });
    });
    return mapping;
  }, [tableRows, displayStart]);

  // Get input styling based on correctness
  const getInputStyle = (answerKey) => {
    const baseStyle =
      'w-32 h-8 px-2 py-1 text-center text-base md:text-sm rounded-lg transition-all duration-200 shadow-sm';

    if (!isFinished) {
      return cn(
        baseStyle,
        'bg-white/70 dark:bg-slate-950/40 border border-slate-300/70 dark:border-slate-700/70 text-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/50',
        'hover:border-slate-400/80 dark:hover:border-slate-600/80 shadow-sm'
      );
    }

    // Review mode - check correctness
    const validation = correctAnswersMap[answerKey];
    const value = answers[answerKey];

    return cn(
      baseStyle,
      'cursor-not-allowed opacity-100 font-semibold',
      validation?.isCorrect
        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        : value
          ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
          : 'bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-foreground'
    );
  };

  const renderCellWithGaps = (cell, rIdx, cIdx) => {
    if (!cell || cell.trim() === '' || cell.trim().toLowerCase() === 'content...') {
      return <span className="text-slate-400 italic text-xs" data-oid="pl_suw0" />;
    }

    // Identify gaps in this cell
    const cellGaps = gapMapping.filter((g) => g.rIdx === rIdx && g.cIdx === cIdx);
    if (cellGaps.length === 0) {
      return (
        <span
          className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatCellContent(cell) }}
          data-oid="qc9i-uj"
        />
      );
    }

    const hasBullets = cell.includes('•') || cell.includes('●') || cell.includes('&bull;');
    const hasNewlines = cell.includes('\n') || cell.includes('<br') || cell.includes('&lt;br');

    if (hasBullets || hasNewlines) {
      let normalizedCell = cell
        .replace(/&bull;/gi, '•')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&lt;br\s*\/?&gt;/gi, '\n');

      let lines = normalizedCell.split('\n').filter((l) => l.trim());
      let currentGapPointer = 0;

      return (
        <ul className="space-y-1.5 text-base list-none pl-1" data-oid="25jna6h">
          {lines.map((line, lineIdx) => {
            const lineMatches = line.match(/\[gap\]|__BLANK__|__BLANK_\d+__/gi) || [];
            const cleanLine = line.replace(/^[•●-]\s*/, '').trim();

            if (lineMatches.length > 0) {
              const lineParts = cleanLine.split(/\[gap\]|__BLANK__|__BLANK_\d+__/gi);
              return (
                <li
                  key={lineIdx}
                  className="flex items-start gap-1 text-slate-600 dark:text-slate-400"
                  data-oid=".cb11kw"
                >
                  <span
                    className="mr-1 text-slate-600 dark:text-slate-400 select-none mt-1"
                    data-oid="2sg6wsk"
                  >
                    •
                  </span>
                  <div
                    className="flex-1 flex flex-wrap items-center gap-x-2 gap-y-3 py-1"
                    data-oid="bshx19x"
                  >
                    {lineParts.map((part, pIdx) => {
                      const elements = [];
                      if (part.trim()) {
                        const subParts = part.trim().split(/(\*\*[^*]+\*\*)/g);
                        elements.push(
                          <span key={`text-${pIdx}`} className="font-medium">
                            {subParts.map((sub, sIdx) => {
                              if (sub.startsWith('**') && sub.endsWith('**')) {
                                return (
                                  <strong
                                    key={sIdx}
                                    className="font-bold text-slate-900 dark:text-slate-100"
                                  >
                                    {sub.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return sub;
                            })}
                          </span>
                        );
                      }

                      // If this isn't the last part, add a gap
                      if (pIdx < lineParts.length - 1) {
                        const gapInfo = cellGaps[currentGapPointer];
                        if (gapInfo) {
                          const answerKey = `${question.id}_${gapInfo.absoluteIdx}`;

                          // Determine circle status
                          let circleStatus = 'default';
                          const validation = correctAnswersMap[answerKey];
                          const value = answers[answerKey];
                          if (isFinished) {
                            circleStatus = validation?.isCorrect
                              ? 'correct'
                              : value
                                ? 'incorrect'
                                : 'unanswered';
                          }

                          elements.push(
                            <span
                              key={`gap-${currentGapPointer}`}
                              className="inline-flex items-center gap-1.5 mx-0.5 whitespace-nowrap"
                            >
                              <QuestionNumberCircle
                                number={gapInfo.number}
                                isFlagged={flaggedQuestions.has(answerKey)}
                                onClick={() => toggleFlag(answerKey)}
                                status={circleStatus}
                                size="md"
                                className="shrink-0"
                                data-oid="jcnpne0"
                              />
                              <Input
                                type="text"
                                className={getInputStyle(answerKey)}
                                placeholder={isFinished ? '' : 'answer'}
                                onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                                value={answers[answerKey] || ''}
                                disabled={isFinished}
                                data-oid="k5u_s6i"
                              />
                            </span>
                          );
                          currentGapPointer++;
                        }
                      }
                      return elements;
                    })}
                  </div>
                </li>
              );
            }

            return (
              <li
                key={lineIdx}
                className="flex items-start gap-1 text-slate-600 dark:text-slate-400"
                data-oid="fog8484"
              >
                <span
                  className="mr-1 text-slate-600 dark:text-slate-400 select-none mt-1"
                  data-oid="258uj3f"
                >
                  •
                </span>
                <span className="font-medium flex-1 py-1" data-oid="z0ksxxx">
                  {cleanLine.split(/(\*\*[^*]+\*\*)/g).map((sub, sIdx) => {
                    if (sub.startsWith('**') && sub.endsWith('**')) {
                      return (
                        <strong key={sIdx} className="font-bold text-slate-900 dark:text-slate-100">
                          {sub.slice(2, -2)}
                        </strong>
                      );
                    }
                    return sub;
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      );
    }

    // Standard single line with potential multiple gaps
    const parts = cell.split(/\[gap\]|__BLANK__|__BLANK_\d+__/gi);
    return (
      <div
        className="flex flex-wrap items-center gap-x-2 gap-y-3 py-1 text-slate-600 dark:text-slate-400 font-medium"
        data-oid="dn3twzm"
      >
        {parts.map((part, pIdx) => {
          const elements = [];
          if (part.trim()) {
            const subParts = part.trim().split(/(\*\*[^*]+\*\*)/g);
            elements.push(
              <span key={`text-${pIdx}`}>
                {subParts.map((sub, sIdx) => {
                  if (sub.startsWith('**') && sub.endsWith('**')) {
                    return (
                      <strong key={sIdx} className="font-bold text-slate-900 dark:text-slate-100">
                        {sub.slice(2, -2)}
                      </strong>
                    );
                  }
                  return sub;
                })}
              </span>
            );
          }

          if (pIdx < parts.length - 1) {
            const gapInfo = cellGaps[pIdx];
            if (gapInfo) {
              const answerKey = `${question.id}_${gapInfo.absoluteIdx}`;

              // Determine circle status
              let circleStatus = 'default';
              const validation = correctAnswersMap[answerKey];
              const value = answers[answerKey];
              if (isFinished) {
                circleStatus = validation?.isCorrect
                  ? 'correct'
                  : value
                    ? 'incorrect'
                    : 'unanswered';
              }

              elements.push(
                <span
                  key={`gap-${pIdx}`}
                  className="inline-flex items-center gap-1.5 mx-0.5 whitespace-nowrap"
                >
                  <QuestionNumberCircle
                    number={gapInfo.number}
                    isFlagged={flaggedQuestions.has(answerKey)}
                    onClick={() => toggleFlag(answerKey)}
                    status={circleStatus}
                    className="shrink-0"
                    data-oid="sbuo91r"
                  />
                  <Input
                    type="text"
                    className={getInputStyle(answerKey)}
                    placeholder={isFinished ? '' : 'answer'}
                    onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                    value={answers[answerKey] || ''}
                    disabled={isFinished}
                    data-oid="okz7g5y"
                  />
                </span>
              );
            }
          }
          return elements;
        })}
      </div>
    );
  };

  return (
    <div key={question.id} id={`question-${question.id}`} className={cardClass} data-oid="0cmm4xp">
      <div className={isInsideMergedCard ? 'px-0' : 'p-3'} data-oid="wnkrdjk">
        <div className="flex gap-4 items-start" data-oid="saux43h">
          <div className="flex-1 w-full overflow-hidden" data-oid="1027k.z">
            <div
              className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"
              data-oid="pwzgsjf"
            >
              <table className="w-full text-base text-left border-collapse" data-oid=":j3mju6">
                <thead data-oid="h6c:cr2">
                  <tr
                    className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700"
                    data-oid="25_-8cm"
                  >
                    {tableHeaders.map((h, i) => (
                      <th
                        key={i}
                        className="px-2 py-2 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-sm md:text-base border-r border-slate-200 dark:border-slate-700 last:border-0"
                        data-oid="2ncd:42"
                      >
                        <span
                          dangerouslySetInnerHTML={{ __html: formatCellContent(h) }}
                          data-oid="z_xiu0u"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className="divide-y divide-slate-100 dark:divide-slate-800"
                  data-oid="gomp5ms"
                >
                  {tableRows.map((row, rIdx) => (
                    <tr key={rIdx} className="bg-white dark:bg-slate-900 group" data-oid="-68lsay">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-2 py-2 border-r border-slate-100 dark:border-slate-800 last:border-0 align-top text-base"
                          data-oid=".:-leog"
                        >
                          {renderCellWithGaps(cell, rIdx, cIdx)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableCompletionRenderer;
