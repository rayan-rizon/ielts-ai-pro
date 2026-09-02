import { jsPDF } from 'jspdf';

const COLORS = {
  ink: [15, 23, 42], // slate-900
  muted: [100, 116, 139], // slate-500
  slateLight: [51, 65, 85], // slate-700
  line: [226, 232, 240], // slate-200
  brand: [86, 97, 233], // #5661e9
  brandDark: [67, 76, 204], // #434ccc
  brandSoft: [239, 237, 255], // #efedff
  green: [16, 185, 129], // emerald-500
  greenSoft: [236, 253, 245],
  amber: [245, 158, 11], // amber-500
  amberSoft: [254, 243, 199],
  red: [225, 29, 72], // rose-600
  redSoft: [254, 242, 242],
  white: [255, 255, 255],
  cardBg: [248, 250, 252], // slate-50
};

const safeText = (value) =>
  String(value ?? '')
    .replace(/[–—−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');

const highestKnownNumber = (...values) => {
  const numbers = values.map(Number).filter(Number.isFinite);
  return numbers.length ? Math.max(0, ...numbers) : 0;
};

const _formatBand = (value) => {
  const score = Number(value);
  return Number.isFinite(score) ? score.toFixed(1) : '0.0';
};

const titleCase = (value) =>
  safeText(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const setText = (doc, color, size, style = 'normal') => {
  doc.setTextColor(...color);
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
};

const drawRoundedCard = (doc, x, y, width, height, fill = COLORS.white, border = COLORS.line) => {
  doc.setFillColor(...fill);
  doc.setDrawColor(...border);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, width, height, 3.5, 3.5, 'FD');
};

const drawProgress = (
  doc,
  x,
  y,
  width,
  percent,
  color = COLORS.brand,
  trackColor = [226, 232, 240]
) => {
  const clampedPercent = Math.max(0, Math.min(100, Number(percent) || 0));
  doc.setFillColor(...trackColor);
  doc.roundedRect(x, y, width, 2.2, 1.1, 1.1, 'F');
  if (clampedPercent > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, Math.max(2.2, (width * clampedPercent) / 100), 2.2, 1.1, 1.1, 'F');
  }
};

const drawCircularGauge = (doc, cx, cy, radius, score, maxScore = 9) => {
  const safeScore = Math.max(0, Math.min(maxScore, Number(score) || 0));
  const fraction = safeScore / maxScore;

  // Solid White Inner Circle Background for high visibility
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.brandSoft);
  doc.circle(cx, cy, radius + 1, 'FD');

  // Background track circle
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(2.5);
  doc.circle(cx, cy, radius, 'D');

  // Active score arc (vector path)
  if (fraction > 0) {
    doc.setDrawColor(...COLORS.brand);
    doc.setLineWidth(3.0);

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
  }

  // Center Score Label
  setText(doc, COLORS.brandDark, 6, 'bold');
  doc.text('ESTIMATED BAND', cx, cy - 2.5, { align: 'center' });
  setText(doc, COLORS.ink, 13, 'bold');
  doc.text(safeScore.toFixed(1), cx, cy + 4, { align: 'center' });
};

const getThemeColors = (percent) => {
  if (percent >= 70) return { text: COLORS.green, fill: COLORS.greenSoft, border: [167, 243, 208] };
  if (percent >= 45) return { text: COLORS.amber, fill: COLORS.amberSoft, border: [253, 230, 138] };
  return { text: COLORS.red, fill: COLORS.redSoft, border: [254, 202, 202] };
};

const footer = (doc, pageNumber) => {
  doc.setDrawColor(...COLORS.line);
  doc.line(14, 285, 196, 285);
  setText(doc, COLORS.muted, 7);
  doc.text('IELTS Ai Pro • Comprehensive Evaluation Report', 14, 290);
  doc.text(`Page ${pageNumber}`, 196, 290, { align: 'right' });
};

const drawHeader = (doc, typeLabel, title, generatedAt, continuation = false) => {
  doc.setFillColor(...COLORS.brand);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(...COLORS.brandDark);
  doc.circle(195, 5, 28, 'F');

  setText(doc, COLORS.white, 18, 'bold');
  doc.text(`IELTS ${typeLabel.toUpperCase()} REPORT${continuation ? ' (continued)' : ''}`, 14, 16);
  setText(doc, COLORS.white, 8.5);
  doc.text('Official AI-Powered Diagnostic Evaluation', 14, 23);
  doc.text(`Generated: ${generatedAt.toLocaleDateString('en-GB')}`, 14, 29);
};

export const createTestResultPdf = ({
  testResults,
  testType,
  testTitle,
  generatedAt = new Date(),
}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const typeLabel = titleCase(testType || 'test');
  const title = safeText(testTitle || `IELTS ${typeLabel} Test`);
  const total = highestKnownNumber(testResults?.totalQuestions, testResults?.total_questions);
  const correct = Math.min(
    total,
    highestKnownNumber(
      testResults?.correctAnswers,
      testResults?.correct_answers,
      testResults?.totalCorrect
    )
  );
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const bandScore = highestKnownNumber(
    testResults?.bandScore,
    testResults?.band_score,
    testResults?.score
  );
  const sections = Array.isArray(testResults?.sectionStats) ? testResults.sectionStats : [];
  const questionTypes = Object.entries(testResults?.typeStats || {}).filter(
    ([, stat]) => stat?.total
  );
  let pageNumber = 1;
  let y = 0;

  doc.setProperties({
    title: `IELTS ${typeLabel} Report`,
    subject: `IELTS ${typeLabel.toLowerCase()} test result`,
    author: 'IELTS Ai Pro',
  });

  const startPage = (continuation = false) => {
    if (continuation) {
      footer(doc, pageNumber);
      doc.addPage();
      pageNumber += 1;
    }
    drawHeader(doc, typeLabel, title, generatedAt, continuation);
    y = 44;
  };

  const ensureSpace = (needed) => {
    if (y + needed <= 278) return;
    startPage(true);
  };

  const sectionHeading = (label) => {
    ensureSpace(12);
    setText(doc, COLORS.brandDark, 10, 'bold');
    doc.text(label, 14, y);
    y += 6;
  };

  const row = (label, correctCount, totalCount) => {
    ensureSpace(16);
    const safeTotal = highestKnownNumber(totalCount);
    const safeCorrect = Math.min(safeTotal, highestKnownNumber(correctCount));
    const rowPercent = safeTotal ? Math.round((safeCorrect / safeTotal) * 100) : 0;
    const theme = getThemeColors(rowPercent);

    // Card container
    drawRoundedCard(doc, 14, y, 182, 14, COLORS.white, COLORS.line);

    // Left Accent Stripe
    doc.setFillColor(...theme.text);
    doc.roundedRect(14, y, 1.8, 14, 0.9, 0.9, 'F');

    // Title label
    setText(doc, COLORS.ink, 8.5, 'bold');
    doc.text(safeText(label), 19, y + 6, { maxWidth: 110 });

    // Correct / Total count badge
    setText(doc, COLORS.muted, 8);
    doc.text(`${safeCorrect} / ${safeTotal} correct`, 150, y + 6, { align: 'right' });

    // Score Percentage Badge Pill
    doc.setFillColor(...theme.fill);
    doc.setDrawColor(...theme.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(162, y + 2.5, 28, 6, 1.5, 1.5, 'FD');
    setText(doc, theme.text, 8, 'bold');
    doc.text(`${rowPercent}%`, 176, y + 6.8, { align: 'center' });

    // Progress Bar Line at bottom of row
    drawProgress(doc, 19, y + 10, 171, rowPercent, theme.text);

    y += 16.5;
  };

  startPage();

  // ─── Top Executive Diagnostic Card (Soft Lavender Fill with Indigo Border) ──────
  const headerCardHeight = 40;
  drawRoundedCard(doc, 14, y, 182, headerCardHeight, COLORS.brandSoft, COLORS.brand);

  // Top Pill Badge
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(0.2);
  doc.roundedRect(20, y + 4.5, 44, 5, 1.2, 1.2, 'FD');
  setText(doc, COLORS.brandDark, 6.5, 'bold');
  doc.text(`IELTS ${typeLabel.toUpperCase()} EVALUATION`, 42, y + 8, { align: 'center' });

  // Main Test Title
  setText(doc, COLORS.brandDark, 12, 'bold');
  const titleLines = doc.splitTextToSize(title.toUpperCase(), 82);
  doc.text(titleLines, 20, y + 16);

  const titleHeight = titleLines.length * 4.2;
  setText(doc, COLORS.muted, 7.5);
  doc.text(`${total} Questions • Detailed Diagnostic Breakdown`, 20, y + 16 + titleHeight);

  // Vertical Divider
  doc.setDrawColor(210, 214, 250);
  doc.setLineWidth(0.3);
  doc.line(108, y + 6, 108, y + headerCardHeight - 6);

  // Middle Stat Box: Correct Answers & Accuracy
  const statsTheme = getThemeColors(percentage);
  setText(doc, COLORS.muted, 7, 'bold');
  doc.text('ACCURACY SCORE', 114, y + 10);

  setText(doc, COLORS.ink, 13, 'bold');
  doc.text(`${correct} / ${total}`, 114, y + 17);
  setText(doc, COLORS.muted, 7.5);
  doc.text('Questions Correct', 114, y + 21.5);

  // Progress Bar for Accuracy (White background track for contrast on lavender)
  drawProgress(doc, 114, y + 25, 38, percentage, statsTheme.text, COLORS.white);

  // Accuracy Pill Badge
  doc.setFillColor(...statsTheme.fill);
  doc.setDrawColor(...statsTheme.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(114, y + 29.5, 26, 5, 1.2, 1.2, 'FD');
  setText(doc, statsTheme.text, 7, 'bold');
  doc.text(`${percentage}% Accuracy`, 127, y + 33, { align: 'center' });

  // Circular Gauge on far right (Floating White Badge)
  drawCircularGauge(doc, 172, y + 20, 13, bandScore, 9);

  y += headerCardHeight + 10;

  // Breakdown Sections
  if (sections.length) {
    sectionHeading(testType === 'listening' ? 'Scores by Part' : 'Scores by Passage');
    sections.forEach((section, index) => {
      row(
        section.title || `${testType === 'listening' ? 'Part' : 'Passage'} ${index + 1}`,
        section.correct,
        section.total
      );
    });
    y += 2;
  }

  if (questionTypes.length) {
    sectionHeading('Scores by Question Type');
    questionTypes.forEach(([type, stat]) => row(titleCase(type), stat.correct, stat.total));
  }

  if (!sections.length && !questionTypes.length) {
    ensureSpace(20);
    drawRoundedCard(doc, 14, y, 182, 18, COLORS.cardBg);
    setText(doc, COLORS.muted, 8.5);
    doc.text('Detailed question results are not available for this test attempt.', 20, y + 11);
  }

  footer(doc, pageNumber);

  return {
    doc,
    filename: `${String(testType || 'test').toLowerCase()}-test-result.pdf`,
  };
};

export const downloadTestResultPdf = (options) => {
  const result = createTestResultPdf(options);
  result.doc.save(result.filename);
  return result.filename;
};
