import { jsPDF } from 'jspdf';

const COLORS = {
  ink: [15, 23, 42], // slate-900
  slateLight: [51, 65, 85], // slate-700
  muted: [100, 116, 139], // slate-500
  line: [226, 232, 240], // slate-200
  brand: [86, 97, 233], // #5661e9
  brandDark: [67, 76, 204], // #434ccc
  brandSoft: [239, 237, 255], // #efedff
  green: [16, 185, 129], // emerald-500
  greenSoft: [236, 253, 245],
  amber: [245, 158, 11], // amber-500
  amberSoft: [254, 243, 199],
  cardBg: [248, 250, 252], // slate-50
  white: [255, 255, 255],
};

const safeText = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[–—−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
};

const getScore = (scores, keys) => {
  for (const key of keys) {
    const score = Number(scores?.[key]);
    if (Number.isFinite(score)) return score.toFixed(1);
  }
  return '7.0';
};

const setText = (doc, color, size, style = 'normal') => {
  doc.setTextColor(...color);
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
};

const drawCard = (doc, x, y, width, height, fill = COLORS.cardBg, border = COLORS.line) => {
  doc.setFillColor(...fill);
  doc.setDrawColor(...border);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 3, 3, 'FD');
};

const writeWrapped = (
  doc,
  text,
  x,
  y,
  width,
  lineHeight = 4.2,
  size = 8.8,
  color = COLORS.slateLight
) => {
  const clean = safeText(text);
  if (!clean) return y;
  setText(doc, color, size);
  const lines = doc.splitTextToSize(clean, width);
  for (const line of lines) {
    if (y > 272) {
      doc.addPage();
      y = 20;
      setText(doc, color, size);
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
};

const drawCircularGauge = (doc, cx, cy, radius, score, maxScore = 9) => {
  const safeScore = Math.max(0, Math.min(maxScore, Number(score) || 0));
  const fraction = safeScore / maxScore;

  // Background subtle track circle
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(2.2);
  doc.circle(cx, cy, radius, 'D');

  // Active score arc (vector path)
  doc.setDrawColor(86, 97, 233); // brand indigo
  doc.setLineWidth(2.6);

  const startAngle = -Math.PI / 2; // top center
  const totalAngle = 2 * Math.PI * fraction;
  const steps = Math.max(16, Math.floor(totalAngle * 12));

  let prevX = cx + radius * Math.cos(startAngle);
  let prevY = cy + radius * Math.sin(startAngle);

  for (let i = 1; i <= steps; i++) {
    const angle = startAngle + (totalAngle * i) / steps;
    const currentX = cx + radius * Math.cos(angle);
    const currentY = cy + radius * Math.sin(angle);
    doc.line(prevX, prevY, currentX, currentY);
    prevX = currentX;
    prevY = currentY;
  }

  // Center Score Label
  setText(doc, COLORS.brandDark, 6, 'bold');
  doc.text('BAND', cx, cy - 2, { align: 'center' });
  setText(doc, COLORS.ink, 11, 'bold');
  doc.text(safeScore.toFixed(1), cx, cy + 3.5, { align: 'center' });
};

const drawCriteriaCard = (doc, x, y, width, height, title, scoreStr, maxScore = 9) => {
  const scoreNum = Number(scoreStr) || 7.0;
  const pct = Math.max(0, Math.min(100, (scoreNum / maxScore) * 100));

  drawCard(doc, x, y, width, height, COLORS.white, COLORS.line);

  // Title
  setText(doc, COLORS.slateLight, 7.5, 'bold');
  doc.text(safeText(title).toUpperCase(), x + 6, y + 7);

  // Score Badge
  doc.setFillColor(...COLORS.brandSoft);
  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(0.2);
  doc.roundedRect(x + width - 19, y + 3, 14, 8, 2, 2, 'FD');
  setText(doc, COLORS.brandDark, 8.5, 'bold');
  doc.text(scoreStr, x + width - 12, y + 8.5, { align: 'center' });

  // Progress Bar Line at Bottom of Card
  const barY = y + height - 2.5;
  const barWidth = width - 12;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(x + 6, barY, barWidth, 1.4, 0.7, 0.7, 'F');

  if (pct > 0) {
    doc.setFillColor(...COLORS.brand);
    doc.roundedRect(x + 6, barY, Math.max(1.4, (barWidth * pct) / 100), 1.4, 0.7, 0.7, 'F');
  }
};

export const createWritingReportPdf = ({ feedbacks, _drafts = {}, generatedAt = new Date() }) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const reports = Object.entries(feedbacks || {}).filter(
    ([, feedback]) => feedback && (feedback.overallBand || feedback.summary)
  );

  doc.setProperties({ title: 'IELTS Writing Report', author: 'IELTS Ai Pro' });

  // Top Banner
  doc.setFillColor(...COLORS.brand);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(...COLORS.brandDark);
  doc.circle(195, 5, 28, 'F');

  setText(doc, COLORS.white, 18, 'bold');
  doc.text('IELTS WRITING REPORT', 14, 16);
  setText(doc, COLORS.white, 8.5);
  doc.text('Official AI-Powered Diagnostic Evaluation', 14, 23);
  doc.text(`Generated: ${generatedAt.toLocaleDateString('en-GB')}`, 14, 29);

  let y = 44;

  if (!reports.length) {
    drawCard(doc, 14, y, 182, 30, COLORS.cardBg);
    setText(doc, COLORS.ink, 11, 'bold');
    doc.text('No completed writing feedback available', 22, y + 12);
    setText(doc, COLORS.muted, 9);
    doc.text(
      'Complete a writing practice task to view your detailed evaluation report.',
      22,
      y + 20
    );
    y += 40;
  } else {
    reports.forEach(([taskName, feedback], index) => {
      if (index > 0 && y > 180) {
        doc.addPage();
        y = 20;
      }

      const overallBand = Number(feedback.overallBand) || 7.0;

      // Section Header Card with Circular Gauge
      drawCard(doc, 14, y, 182, 30, COLORS.brandSoft, COLORS.brand);
      setText(doc, COLORS.brandDark, 14, 'bold');
      doc.text(safeText(taskName).toUpperCase(), 20, y + 12);
      setText(doc, COLORS.muted, 8);
      doc.text('Detailed AI Evaluation & Diagnostic Breakdown', 20, y + 19);

      // Render Circular Score Ring Gauge in PDF Header Card
      drawCircularGauge(doc, 172, y + 15, 10.5, overallBand, 9);

      y += 36;

      // 4 Criteria Scores Grid (2x2) with Progress Bars
      const scores = feedback.criteriaScores || {};
      const criteriaList = [
        { label: 'Task Response / Achievement', keys: ['TaskAchievement', 'TaskResponse'] },
        { label: 'Coherence & Cohesion', keys: ['CoherenceAndCohesion'] },
        { label: 'Lexical Resource', keys: ['LexicalResource'] },
        { label: 'Grammar & Accuracy', keys: ['GrammaticalRangeAndAccuracy'] },
      ];

      const gridY = y;
      criteriaList.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cardX = 14 + col * 93;
        const cardY = gridY + row * 17;
        const scoreStr = getScore(scores, item.keys);
        drawCriteriaCard(doc, cardX, cardY, 89, 14.5, item.label, scoreStr, 9);
      });

      y += 40;

      // Executive Assessment Summary
      const summaryText =
        feedback.summary ||
        feedback.takeaway?.assessment ||
        feedback.takeaway ||
        feedback.assessment;
      if (summaryText) {
        setText(doc, COLORS.ink, 10, 'bold');
        doc.text('Assessment Summary', 14, y);
        y += 5;
        const startY = y + 5;
        const lines = doc.splitTextToSize(safeText(summaryText), 174);
        const cardHeight = Math.max(12, lines.length * 4.2 + 6);
        drawCard(doc, 14, y, 182, cardHeight, COLORS.cardBg);
        writeWrapped(doc, summaryText, 18, startY, 174, 4.2, 8.8, COLORS.ink);
        y += cardHeight + 6;
      }

      // Key Strengths with Green Bullets
      const strengths = (feedback.strengths || []).map((s) =>
        typeof s === 'string' ? s : s.full || s.preview || ''
      );
      if (strengths.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        setText(doc, COLORS.green, 10, 'bold');
        doc.text('Key Strengths', 14, y);
        y += 6;
        strengths.slice(0, 4).forEach((str) => {
          if (!str) return;
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.setFillColor(...COLORS.green);
          doc.circle(16, y - 1.2, 1.5, 'F');
          y = writeWrapped(doc, str, 21, y, 173, 4.2, 8.5, COLORS.slateLight) + 2;
        });
        y += 4;
      }

      // Legacy Priorities Fallback (matches UI logic)
      let sourcePriorities = [];
      if (Array.isArray(feedback.priorities) && feedback.priorities.length > 0) {
        sourcePriorities = feedback.priorities;
      } else {
        const weaknesses = Array.isArray(feedback.weaknesses) ? feedback.weaknesses : [];
        const suggestions = Array.isArray(feedback.suggestions) ? feedback.suggestions : [];
        sourcePriorities = weaknesses.slice(0, 4).map((issue, index) => ({
          issue,
          action: suggestions[index] || 'Review and revise this section.',
        }));
      }

      // Top Priorities for Improvement with Amber Bullets
      const priorities = sourcePriorities
        .map((p) =>
          typeof p === 'string' ? p : p.action || p.preview || p.suggestion || p.issue || ''
        )
        .filter(Boolean);

      if (priorities.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        setText(doc, COLORS.amber, 10, 'bold');
        doc.text('Top Priorities to Improve Score', 14, y);
        y += 6;
        priorities.slice(0, 4).forEach((p) => {
          if (!p) return;
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.setFillColor(...COLORS.amber);
          doc.circle(16, y - 1.2, 1.5, 'F');
          y = writeWrapped(doc, p, 21, y, 173, 4.2, 8.5, COLORS.slateLight) + 2;
        });
        y += 4;
      }

      // Key Sentence Corrections & Upgrades
      const sourceCorrections = Array.isArray(feedback.corrections)
        ? feedback.corrections
        : Array.isArray(feedback.improvements)
          ? feedback.improvements
          : [];
      const corrections = sourceCorrections
        .map((item) => ({
          original: item.original || item.error || '',
          correction: item.correction || item.suggested || item.revision || '',
        }))
        .filter((c) => c.original || c.correction);

      if (corrections.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        setText(doc, COLORS.brand, 10, 'bold');
        doc.text('Key Sentence Corrections', 14, y);
        y += 6;

        corrections.slice(0, 5).forEach((item) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
          const orig = safeText(item.original);
          const corr = safeText(item.correction);
          if (!orig && !corr) return;

          drawCard(doc, 14, y, 182, 16, COLORS.cardBg);

          // Original Badge
          doc.setFillColor(254, 242, 242);
          doc.setDrawColor(254, 202, 202);
          doc.setLineWidth(0.2);
          doc.roundedRect(18, y + 3.5, 18, 4.5, 1, 1, 'FD');
          setText(doc, [220, 38, 38], 6, 'bold');
          doc.text('ORIGINAL', 27, y + 6.7, { align: 'center' });
          setText(doc, COLORS.ink, 8);
          doc.text(`"${orig}"`, 40, y + 7);

          // Revised Badge
          doc.setFillColor(236, 253, 245);
          doc.setDrawColor(167, 243, 208);
          doc.setLineWidth(0.2);
          doc.roundedRect(18, y + 9.5, 18, 4.5, 1, 1, 'FD');
          setText(doc, [5, 150, 105], 6, 'bold');
          doc.text('REVISED', 27, y + 12.7, { align: 'center' });
          setText(doc, COLORS.brandDark, 8, 'bold');
          doc.text(`"${corr}"`, 40, y + 13);

          y += 19;
        });
        y += 2;
      }

      // Vocabulary Upgrades
      const vocabEnhancements = Array.isArray(feedback.vocabularyEnhancements)
        ? feedback.vocabularyEnhancements
        : Array.isArray(feedback.vocabulary_enhancements)
          ? feedback.vocabulary_enhancements
          : [];

      let vocabList = vocabEnhancements
        .map((item) => ({
          original: item.original || item.word || item.error || '',
          enhanced:
            Array.isArray(item.alternatives) && item.alternatives.length > 0
              ? item.alternatives[0]
              : item.enhanced ||
                item.suggestion ||
                item.suggested ||
                item.correction ||
                item.revision ||
                '',
        }))
        .filter((v) => v.original && v.enhanced);

      if (vocabList.length === 0) {
        const allImprovements = Array.isArray(feedback.corrections)
          ? feedback.corrections
          : Array.isArray(feedback.improvements)
            ? feedback.improvements
            : [];
        vocabList = allImprovements
          .filter((c) => {
            const typeStr = String(c.type || '').toLowerCase();
            return (
              typeStr.includes('vocab') || typeStr.includes('lexical') || typeStr.includes('word')
            );
          })
          .map((item) => ({
            original: item.original || item.error || '',
            enhanced: item.correction || item.suggested || item.revision || '',
          }))
          .filter((v) => v.original && v.enhanced);
      }

      if (vocabList.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        setText(doc, COLORS.brand, 10, 'bold');
        doc.text('Premium Vocabulary Upgrades', 14, y);
        y += 6;

        vocabList.slice(0, 5).forEach((item) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
          const orig = safeText(item.original);
          const enhanced = safeText(item.enhanced);
          if (!orig && !enhanced) return;

          drawCard(doc, 14, y, 182, 16, COLORS.cardBg);

          // Basic Badge
          doc.setFillColor(241, 245, 249);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.roundedRect(18, y + 3.5, 20, 4.5, 1, 1, 'FD');
          setText(doc, COLORS.slateLight, 6, 'bold');
          doc.text('BASIC', 28, y + 6.7, { align: 'center' });
          setText(doc, COLORS.ink, 8);
          doc.text(`"${orig}"`, 42, y + 7);

          // Advanced Badge
          doc.setFillColor(239, 237, 255);
          doc.setDrawColor(199, 210, 254);
          doc.setLineWidth(0.2);
          doc.roundedRect(18, y + 9.5, 20, 4.5, 1, 1, 'FD');
          setText(doc, COLORS.brandDark, 6, 'bold');
          doc.text('ADVANCED', 28, y + 12.7, { align: 'center' });
          setText(doc, COLORS.brandDark, 8, 'bold');
          doc.text(`"${enhanced}"`, 42, y + 13);

          y += 19;
        });
        y += 2;
      }

      y += 8;
    });
  }

  // Page Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.line);
    doc.line(14, 285, 196, 285);
    setText(doc, COLORS.muted, 7);
    doc.text('IELTS Ai Pro • Comprehensive Writing Evaluation Report', 14, 290);
    doc.text(`Page ${i} of ${totalPages}`, 196, 290, { align: 'right' });
  }

  return { doc, filename: 'writing-report.pdf' };
};

export const downloadWritingReportPdf = (options) => {
  const result = createWritingReportPdf(options);
  result.doc.save(result.filename);
  return result.filename;
};
