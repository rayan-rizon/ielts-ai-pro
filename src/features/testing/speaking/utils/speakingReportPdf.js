import { jsPDF } from 'jspdf';
import { buildSpeakingReportSummary, formatBandScore } from './speakingReportSummary';

const COLORS = {
  red: [225, 29, 72],
  redDark: [159, 18, 57],
  redLight: [255, 241, 242],
  ink: [24, 24, 27],
  muted: [82, 82, 91],
  line: [228, 228, 231],
  white: [255, 255, 255],
  green: [5, 150, 105],
  greenLight: [236, 253, 245],
};

const normalizePdfText = (value) =>
  String(value ?? '')
    .replace(/[–—−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');

const setText = (doc, color = COLORS.ink, size = 10, style = 'normal') => {
  doc.setTextColor(...color);
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
};

const drawRoundedCard = (doc, x, y, width, height, fill = COLORS.white, stroke = COLORS.line) => {
  doc.setFillColor(...fill);
  doc.setDrawColor(...stroke);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, width, height, 3.5, 3.5, 'FD');
};

const drawWrappedText = (doc, text, x, y, maxWidth, options = {}) => {
  const { color = COLORS.muted, size = 8.5, style = 'normal', lineHeight = 1.25 } = options;
  const safeText = normalizePdfText(text);
  if (!safeText) return y;

  setText(doc, color, size, style);
  const lines = doc.splitTextToSize(safeText, maxWidth);
  doc.text(lines, x, y, { lineHeightFactor: lineHeight });
  return y + lines.length * size * 0.3528 * lineHeight;
};

const drawSectionLabel = (doc, label, x, y, color = COLORS.red) => {
  setText(doc, color, 7.5, 'bold');
  doc.text(normalizePdfText(label).toUpperCase(), x, y);
};

const drawBandGauge = (doc, score, centerX, centerY) => {
  const numericScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  const clampedScore = Math.max(0, Math.min(9, numericScore));
  const radius = 12.5;

  doc.setLineCap('round');
  doc.setLineWidth(2.6);

  // 1. Draw smooth continuous background track (light rose)
  doc.setDrawColor(254, 205, 211);
  const trackSteps = 120;
  for (let i = 0; i < trackSteps; i += 1) {
    const a1 = (-90 + (i * 360) / trackSteps) * (Math.PI / 180);
    const a2 = (-90 + ((i + 1) * 360) / trackSteps) * (Math.PI / 180);
    doc.line(
      centerX + Math.cos(a1) * radius,
      centerY + Math.sin(a1) * radius,
      centerX + Math.cos(a2) * radius,
      centerY + Math.sin(a2) * radius
    );
  }

  // 2. Draw smooth active score progress arc (vibrant red)
  if (clampedScore > 0) {
    doc.setDrawColor(...COLORS.red);
    const scoreAngle = (clampedScore / 9) * 360;
    const scoreSteps = Math.max(1, Math.round(scoreAngle * 0.8));
    for (let i = 0; i < scoreSteps; i += 1) {
      const a1 = (-90 + (i * scoreAngle) / scoreSteps) * (Math.PI / 180);
      const a2 = (-90 + ((i + 1) * scoreAngle) / scoreSteps) * (Math.PI / 180);
      doc.line(
        centerX + Math.cos(a1) * radius,
        centerY + Math.sin(a1) * radius,
        centerX + Math.cos(a2) * radius,
        centerY + Math.sin(a2) * radius
      );
    }
  }

  // 3. Inner white circle disc with score text
  doc.setFillColor(...COLORS.white);
  doc.circle(centerX, centerY, 8.8, 'F');
  setText(doc, COLORS.ink, 16, 'bold');
  doc.text(formatBandScore(score), centerX, centerY + 2, { align: 'center' });
  setText(doc, COLORS.red, 5.2, 'bold');
  doc.text('OUT OF 9', centerX, centerY + 6.6, { align: 'center' });
};

const drawHeader = (doc, title, generatedAt) => {
  doc.setFillColor(...COLORS.red);
  doc.rect(0, 0, 210, 43, 'F');
  doc.setFillColor(...COLORS.redDark);
  doc.circle(193, 4, 30, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.setGState(new doc.GState({ opacity: 0.2 }));
  [15, 19, 23].forEach((radius) => doc.circle(190, 12, radius, 'S'));
  doc.setGState(new doc.GState({ opacity: 1 }));

  setText(doc, COLORS.white, 22, 'bold');
  doc.text('Speaking Report', 14, 20);
  setText(doc, COLORS.white, 9, 'normal');
  doc.text(normalizePdfText(title || 'IELTS Academic'), 14, 29);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text(`Generated ${generatedAt.toLocaleDateString('en-GB')}`, 14, 36);
};

const drawScoreAndSummary = (doc, summary) => {
  drawRoundedCard(doc, 14, 51, 53, 52, COLORS.redLight, [254, 205, 211]);
  drawSectionLabel(doc, 'Overall band score', 20, 60);
  drawBandGauge(doc, summary.overallScore, 40.5, 76);
  setText(doc, COLORS.red, 8.5, 'bold');
  doc.text(normalizePdfText(summary.bandInfo.label), 40.5, 96.5, {
    align: 'center',
    maxWidth: 43,
  });

  drawRoundedCard(doc, 72, 51, 124, 52);
  doc.setFillColor(...COLORS.redLight);
  doc.circle(82, 60, 3.8, 'F');
  setText(doc, COLORS.red, 6.5, 'bold');
  doc.text('AI', 82, 61, { align: 'center' });
  drawSectionLabel(doc, 'Coach summary', 89, 61);
  let summaryY = drawWrappedText(
    doc,
    summary.conciseFeedback || 'Complete more speaking responses to unlock a detailed summary.',
    79,
    69,
    108,
    { color: COLORS.ink, size: 8.8, style: 'normal', lineHeight: 1.25 }
  );

  if (summary.showTargetTip) {
    summaryY += 3;
    doc.setDrawColor(...COLORS.red);
    doc.setLineWidth(0.7);
    doc.line(79, summaryY - 1.5, 79, Math.min(summaryY + 13, 98));
    drawSectionLabel(doc, 'Next score move', 83, summaryY + 1);
    drawWrappedText(doc, summary.conciseTargetTip, 83, summaryY + 6, 103, {
      color: COLORS.muted,
      size: 7.6,
      lineHeight: 1.15,
    });
  }
};

const drawCriteria = (doc, summary, y) => {
  if (summary.criteria.length === 0) return y;
  const height = 13 + summary.criteria.length * 14;
  drawRoundedCard(doc, 14, y, 182, height);
  drawSectionLabel(doc, 'Performance at a glance', 21, y + 10);

  summary.criteria.forEach((criterion, index) => {
    const rowY = y + 18 + index * 14;
    setText(doc, COLORS.ink, 8.2, 'bold');
    doc.text(normalizePdfText(criterion.label), 21, rowY);

    if (criterion.value != null) {
      setText(doc, COLORS.red, 9.5, 'bold');
      doc.text(formatBandScore(criterion.value), 188, rowY, { align: 'right' });
      doc.setFillColor(244, 244, 245);
      doc.roundedRect(21, rowY + 3, 45, 2, 1, 1, 'F');
      doc.setFillColor(...COLORS.red);
      doc.roundedRect(21, rowY + 3, 45 * (criterion.value / 9), 2, 1, 1, 'F');
    }

    drawWrappedText(doc, criterion.note, 73, rowY, 103, {
      color: COLORS.muted,
      size: 7.1,
      lineHeight: 1.1,
    });
  });

  return y + height + 6;
};

const drawListCard = (doc, title, items, x, y, width, theme) => {
  const hasItems = items.length > 0;
  if (!hasItems) return 0;
  const lineCounts = items.map((item) => {
    const content = typeof item === 'string' ? item : `${item.title}: ${item.content}`;
    return doc.splitTextToSize(normalizePdfText(content), width - 18).length;
  });
  const height = Math.max(34, 18 + lineCounts.reduce((sum, count) => sum + count * 4 + 4, 0));

  drawRoundedCard(doc, x, y, width, height, theme.fill, theme.stroke);
  drawSectionLabel(doc, title, x + 7, y + 10, theme.accent);
  let cursorY = y + 18;

  items.forEach((item) => {
    const content = typeof item === 'string' ? item : `${item.title}: ${item.content}`;
    doc.setFillColor(...theme.accent);
    doc.circle(x + 8, cursorY - 1.2, 1.2, 'F');
    cursorY =
      drawWrappedText(doc, content, x + 12, cursorY, width - 18, {
        color: COLORS.ink,
        size: 7.4,
        lineHeight: 1.15,
      }) + 3;
  });

  return height;
};

const drawStrengthsAndImprovements = (doc, summary, y) => {
  const strengthHeight = drawListCard(doc, 'Strengths', summary.strengths, 14, y, 88, {
    fill: COLORS.greenLight,
    stroke: [167, 243, 208],
    accent: COLORS.green,
  });
  const improvementHeight = drawListCard(
    doc,
    'Priority improvements',
    summary.improvements,
    108,
    y,
    88,
    {
      fill: COLORS.redLight,
      stroke: [254, 205, 211],
      accent: COLORS.red,
    }
  );

  return (
    y + Math.max(strengthHeight, improvementHeight) + (strengthHeight || improvementHeight ? 6 : 0)
  );
};

const drawParts = (doc, summary, y) => {
  if (summary.parts.length === 0) return y;
  const height = 38;
  drawRoundedCard(doc, 14, y, 182, height);
  drawSectionLabel(doc, 'Part-by-part performance', 21, y + 10);
  const gap = 4;
  const cardWidth = (168 - gap * (summary.parts.length - 1)) / summary.parts.length;

  summary.parts.forEach((part, index) => {
    const x = 21 + index * (cardWidth + gap);
    doc.setFillColor(...COLORS.redLight);
    doc.roundedRect(x, y + 15, cardWidth, 17, 2, 2, 'F');
    setText(doc, COLORS.red, 7.4, 'bold');
    doc.text(normalizePdfText(part.label), x + 4, y + 21);
    setText(doc, COLORS.ink, 13, 'bold');
    doc.text(formatBandScore(part.band), x + 4, y + 29);
    setText(doc, COLORS.muted, 6.2, 'normal');
    doc.text(normalizePdfText(part.subtitle), x + cardWidth - 4, y + 29, { align: 'right' });
  });

  return y + height + 6;
};

const drawFooter = (doc) => {
  doc.setDrawColor(...COLORS.line);
  doc.line(14, 285, 196, 285);
  setText(doc, COLORS.muted, 6.8, 'normal');
  doc.text('IELTS Ai Pro - Speaking performance summary', 14, 290);
  doc.text('Page 1 of 1', 196, 290, { align: 'right' });
};

export const createSpeakingReportPdf = ({
  finalEvaluation,
  testTitle,
  generatedAt = new Date(),
}) => {
  const summary = buildSpeakingReportSummary(finalEvaluation);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  doc.setProperties({
    title: `${normalizePdfText(testTitle || 'IELTS Speaking')} - Speaking Report`,
    subject: 'IELTS speaking performance summary',
    author: 'IELTS Ai Pro',
    creator: 'IELTS Ai Pro',
  });

  drawHeader(doc, testTitle, generatedAt);
  drawScoreAndSummary(doc, summary);
  let cursorY = drawCriteria(doc, summary, 110);
  cursorY = drawStrengthsAndImprovements(doc, summary, cursorY);
  drawParts(doc, summary, cursorY);
  drawFooter(doc);

  return {
    doc,
    filename:
      summary.overallScore == null
        ? 'speaking-report.pdf'
        : `speaking-report-${formatBandScore(summary.overallScore)}.pdf`,
    summary,
  };
};

export const downloadSpeakingReportPdf = (options) => {
  const result = createSpeakingReportPdf(options);
  result.doc.save(result.filename);
  return result.filename;
};
