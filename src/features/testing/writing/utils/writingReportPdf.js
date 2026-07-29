import { jsPDF } from 'jspdf';

const safeText = (value) =>
  String(value ?? '')
    .replace(/[–—−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');

const writeWrapped = (doc, text, x, y, width) => {
  const lines = doc.splitTextToSize(safeText(text), width);
  doc.text(lines, x, y, { lineHeightFactor: 1.25 });
  return y + lines.length * 4.2;
};

const addPageIfNeeded = (doc, y) => {
  if (y < 270) return y;
  doc.addPage();
  return 20;
};

const getScore = (scores, keys) => {
  for (const key of keys) {
    const score = Number(scores?.[key]);
    if (Number.isFinite(score)) return score.toFixed(1);
  }
  return 'Not available';
};

export const createWritingReportPdf = ({ feedbacks, generatedAt = new Date() }) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const reports = Object.entries(feedbacks || {}).filter(([, feedback]) => feedback?.overallBand);

  doc.setProperties({ title: 'IELTS Writing Report', author: 'IELTS Ai Pro' });
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 42, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.text('Writing Report', 14, 19);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Downloaded ${generatedAt.toLocaleDateString('en-GB')}`, 14, 28);
  doc.text('AI-assisted practice feedback', 14, 35);

  let y = 55;
  reports.forEach(([taskName, feedback]) => {
    y = addPageIfNeeded(doc, y + 30);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(safeText(taskName), 14, y);
    y += 9;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(`Estimated band: ${Number(feedback.overallBand).toFixed(1)}`, 14, y);
    y += 8;

    const scores = feedback.criteriaScores || {};
    const criteria = [
      ['Task response', ['TaskAchievement', 'TaskResponse']],
      ['Coherence', ['CoherenceAndCohesion']],
      ['Vocabulary', ['LexicalResource']],
      ['Grammar', ['GrammaticalRangeAndAccuracy']],
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      criteria.map(([label, keys]) => `${label}: ${getScore(scores, keys)}`).join('   '),
      14,
      y
    );
    y += 10;

    const sections = [
      ['Summary', feedback.summary],
      [
        'Strengths',
        (feedback.strengths || [])
          .slice(0, 3)
          .map((item) => `• ${item}`)
          .join('\n'),
      ],
      [
        'What to work on',
        (feedback.priorities || feedback.suggestions || [])
          .slice(0, 3)
          .map((item) => `• ${item.action || item.issue || item}`)
          .join('\n'),
      ],
      [
        'Corrections',
        (feedback.corrections || [])
          .slice(0, 5)
          .map((item) => `• ${item.original} → ${item.correction}`)
          .join('\n'),
      ],
    ];
    sections.forEach(([heading, content]) => {
      if (!content) return;
      y = addPageIfNeeded(doc, y + 16);
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(heading, 14, y);
      y += 6;
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      y = writeWrapped(doc, content, 18, y, 174) + 5;
    });
    y += 4;
  });

  if (!reports.length) {
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(11);
    doc.text('No completed writing feedback is available yet.', 14, y);
  }

  return { doc, filename: 'writing-report.pdf' };
};

export const downloadWritingReportPdf = (options) => {
  const result = createWritingReportPdf(options);
  result.doc.save(result.filename);
  return result.filename;
};
