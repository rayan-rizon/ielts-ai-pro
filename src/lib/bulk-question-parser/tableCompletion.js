/**
 * Bulk IELTS reading question parser internals.
 */
export const parseTableCompletion = (lines, instructions, startNum) => {
  // 1. Identify Header Row and Body Rows
  const tableLines = lines.filter((l) => l.trim().startsWith('|'));
  const isProcedureAimTable =
    !tableLines.length &&
    lines.some((l) => l.toLowerCase().includes('procedure:') || l.toLowerCase().includes('aim:'));

  // List-based detection: "Label: Value" patterns
  const labelsFound = lines.map((l) => l.trim().match(/^([^:]{3,25}):/)?.[1]).filter(Boolean);
  const uniqueLabels = [...new Set(labelsFound)];
  const isListBasedTable =
    !tableLines.length &&
    !isProcedureAimTable &&
    labelsFound.length > uniqueLabels.length &&
    uniqueLabels.length >= 2;

  const isImplicitTable =
    !tableLines.length &&
    !isProcedureAimTable &&
    !isListBasedTable &&
    instructions.toLowerCase().includes('complete the table');

  if (!tableLines.length && !isProcedureAimTable && !isListBasedTable && !isImplicitTable)
    return [];

  let headers = [];
  let rows = [];
  const blanks = [];
  let currentGapNum = startNum;

  if (isImplicitTable || isListBasedTable || isProcedureAimTable) {
    // --- PSEUDO / IMPLICIT TABLE PARSING ---
    let title = '';

    if (isImplicitTable) {
      headers = ['', ''];
      let currentRow = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.toLowerCase().includes('questions') || line.toLowerCase().includes('answer sheet'))
          continue;

        const isPotentialLabel =
          line.length < 50 &&
          !line.includes('___') &&
          !line.includes('[') &&
          !/^[●•–-]/.test(line) &&
          !/^(complete|choose|write)/i.test(line);

        if (isPotentialLabel) {
          if (currentRow) rows.push(currentRow);
          currentRow = [line, ''];
        } else if (currentRow) {
          currentRow[1] += (currentRow[1] ? '\n' : '') + line;
        } else {
          // Content before first label? Start a row with empty label
          currentRow = ['', line];
        }
      }
      if (currentRow) rows.push(currentRow);
      rows = rows.filter((r) => r[0] || r[1]);
    } else {
      // --- PSEUDO-TABLE PARSING (PROCEDURE / AIM or Generic List) ---
      headers = isProcedureAimTable ? ['Procedure', 'Aim'] : uniqueLabels;
      let currentRow = headers.map(() => null);

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.trim();
        if (!line) continue;

        const labelMatch = line.match(/^([^:]{3,25}):\s*(.*)/);
        if (labelMatch) {
          const label = labelMatch[1];
          const initialValue = labelMatch[2].trim();
          const headerIdx = headers.indexOf(label);

          if (headerIdx !== -1) {
            if (currentRow[headerIdx] !== null) {
              rows.push(currentRow.map((c) => c || ''));
              currentRow = headers.map(() => null);
            }

            let fullValue = initialValue;
            let nextLineIdx = i + 1;
            while (nextLineIdx < lines.length) {
              const nextLine = lines[nextLineIdx].trim();
              if (headers.some((h) => nextLine.startsWith(`${h}:`)) || !nextLine) break;
              fullValue += (fullValue ? '\n' : '') + nextLine;
              nextLineIdx++;
              i++;
            }
            currentRow[headerIdx] = fullValue;
          }
        } else if (
          !line.toLowerCase().startsWith('complete') &&
          !line.toLowerCase().startsWith('choose') &&
          !line.includes('___') &&
          !title
        ) {
          title = line;
        }
      }
      if (currentRow && (currentRow[0] !== null || currentRow[1] !== null)) {
        rows.push(currentRow.map((c) => c || ''));
      }
    }

    // Process rows for gaps common to both pseudo types
    rows = rows.map((row, rIdx) => {
      return row.map((cell, cIdx) => {
        return cell.replace(/_{3,}|(\d+)(?:[:.]|\s+)\s*_{2,}/g, (match, num) => {
          const gapNum = num ? parseInt(num) : currentGapNum++;
          blanks.push({
            blankNumber: gapNum,
            row: rIdx,
            col: cIdx,
            answer: '',
            id: `${rIdx}_${cIdx}_${gapNum}`,
          });
          return `__BLANK_${gapNum}__`;
        });
      });
    });

    return [
      {
        question_number:
          blanks.length > 0 ? Math.min(...blanks.map((b) => b.blankNumber)) : startNum,
        question_text: title || 'Table Completion',
        type: 'table_completion',
        group_instructions: instructions,
        table_data: {
          table_headers: headers,
          table_rows: rows,
          blank_positions: blanks,
          blanks_count: blanks.length,
        },
      },
    ];
  }

  // --- STANDARD MARKDOWN TABLE PARSING ---

  // Parse Header: First line starting with |
  // Assumption: First line is header, second is separator |---|
  let headerLine = tableLines[0];
  let bodyStartIndex = 1;

  // Remove leading/trailing pipes and split
  const parseRow = (line) => {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
  };

  headers = parseRow(headerLine);

  // Check if second line is separator
  if (tableLines[1].includes('---')) {
    bodyStartIndex = 2;
  }

  // Parse Body
  for (let i = bodyStartIndex; i < tableLines.length; i++) {
    const rowContent = parseRow(tableLines[i]);

    // Ensure row has same cols as header (fill with empty if needed)
    while (rowContent.length < headers.length) rowContent.push('');

    // Process cells for blanks [10] -> __BLANK_10__
    const processedRow = rowContent.map((cell, cIdx) => {
      // Match [10], [11], etc.
      return cell.replace(/\[(\d+)\]/g, (match, numStr) => {
        const num = parseInt(numStr);

        // Add to blanks metadata
        // Note: TableBuilder needs row index relative to body
        const rowIdx = i - bodyStartIndex;

        blanks.push({
          blankNumber: num,
          row: rowIdx,
          col: cIdx,
          answer: '', // Will be filled by mergeAnswers later
          id: `${rowIdx}_${cIdx}_${num}`,
        });

        // Return internal placeholder
        return `__BLANK_${num}__`;
      });
    });

    rows.push(processedRow);
  }

  // Find first question number to link this block
  const firstBlank = blanks.sort((a, b) => a.blankNumber - b.blankNumber)[0];
  const qNum = firstBlank ? firstBlank.blankNumber : startNum;

  return [
    {
      question_number: qNum,
      question_text: 'Complete the table',
      type: 'table_completion',
      group_instructions: instructions,
      correct_answer: '', // Not used for table primarily
      table_data: {
        table_headers: headers,
        table_rows: rows,
        blank_positions: blanks,
        blanks_count: blanks.length,
        table_structure: instructions, // Store instructions here too?
      },
    },
  ];
};

/**
 * Parse Answer List (Paste 2)
 * text format: "1. True.2. False" or "1. A.2. B,C" or "1 A 2 B"
 */
