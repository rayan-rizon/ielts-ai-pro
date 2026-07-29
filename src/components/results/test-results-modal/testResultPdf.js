import { jsPDF } from 'jspdf';

const COLORS = {
  ink: [15, 23, 42],
  muted: [100, 116, 139],
  line: [226, 232, 240],
  blue: [37, 99, 235],
  blueDark: [30, 64, 175],
  blueSoft: [239, 246, 255],
  green: [5, 150, 105],
  amber: [217, 119, 6],
  red: [225, 29, 72],
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

const formatBand = (value) => {
  const score = Number(value);
  return Number.isFinite(score) ? score.toFixed(1) : 'Not available';
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

const drawRoundedCard = (doc, x, y, width, height, fill = [255, 255, 255]) => {
  doc.setFillColor(...fill);
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, width, height, 3, 3, 'FD');
};

const drawProgress = (doc, x, y, width, percent, color = COLORS.blue) => {
  const clampedPercent = Math.max(0, Math.min(100, Number(percent) || 0));
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(x, y, width, 2.4, 1.2, 1.2, 'F');
  if (clampedPercent > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, Math.max(1.2, (width * clampedPercent) / 100), 2.4, 1.2, 1.2, 'F');
  }
};

const chooseColor = (percent) => {
  if (percent >= 70) return COLORS.green;
  if (percent >= 45) return COLORS.amber;
  return COLORS.red;
};

const footer = (doc, pageNumber) => {
  doc.setDrawColor(...COLORS.line);
  doc.line(14, 286, 196, 286);
  setText(doc, COLORS.muted, 7);
  doc.text('IELTS Ai Pro - Practice result. This is not an official IELTS result.', 14, 291);
  doc.text(`Page ${pageNumber}`, 196, 291, { align: 'right' });
};

const drawHeader = (doc, typeLabel, title, generatedAt, continuation = false) => {
  doc.setFillColor(...COLORS.blue);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setFillColor(...COLORS.blueDark);
  doc.circle(198, 5, 30, 'F');
  setText(doc, [255, 255, 255], 19, 'bold');
  doc.text(`${typeLabel} Test Result${continuation ? ' (continued)' : ''}`, 14, 17);
  setText(doc, [255, 255, 255], 8.5);
  doc.text(title, 14, 25);
  doc.text(`Downloaded ${generatedAt.toLocaleDateString('en-GB')}`, 14, 31);
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
    title: `${title} - Result`,
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
    y = 50;
  };

  const ensureSpace = (needed) => {
    if (y + needed <= 278) return;
    startPage(true);
  };

  const sectionHeading = (label) => {
    ensureSpace(12);
    setText(doc, COLORS.ink, 11, 'bold');
    doc.text(label, 14, y);
    y += 7;
  };

  const row = (label, correctCount, totalCount) => {
    ensureSpace(12);
    const safeTotal = highestKnownNumber(totalCount);
    const safeCorrect = Math.min(safeTotal, highestKnownNumber(correctCount));
    const rowPercent = safeTotal ? Math.round((safeCorrect / safeTotal) * 100) : 0;
    drawRoundedCard(doc, 14, y, 182, 10.5, [255, 255, 255]);
    setText(doc, COLORS.ink, 8.3, 'bold');
    doc.text(safeText(label), 19, y + 4.5, { maxWidth: 104 });
    setText(doc, COLORS.muted, 7.5);
    doc.text(`${safeCorrect}/${safeTotal}`, 154, y + 4.5, { align: 'right' });
    setText(doc, chooseColor(rowPercent), 8.3, 'bold');
    doc.text(`${rowPercent}%`, 190, y + 4.5, { align: 'right' });
    drawProgress(doc, 19, y + 7, 166, rowPercent, chooseColor(rowPercent));
    y += 13;
  };

  startPage();
  drawRoundedCard(doc, 14, y, 182, 36, COLORS.blueSoft);
  setText(doc, COLORS.muted, 8, 'bold');
  doc.text('ESTIMATED BAND', 22, y + 10);
  setText(doc, COLORS.blue, 27, 'bold');
  doc.text(formatBand(bandScore), 22, y + 24);
  doc.setDrawColor(...COLORS.line);
  doc.line(80, y + 7, 80, y + 29);
  setText(doc, COLORS.ink, 10, 'bold');
  doc.text(`${correct} of ${total}`, 91, y + 14);
  setText(doc, COLORS.muted, 8);
  doc.text('questions correct', 91, y + 20);
  drawProgress(doc, 91, y + 25, 84, percentage, chooseColor(percentage));
  setText(doc, chooseColor(percentage), 9, 'bold');
  doc.text(`${percentage}%`, 185, y + 27, { align: 'right' });
  y += 47;

  if (sections.length) {
    sectionHeading(testType === 'listening' ? 'Scores by part' : 'Scores by passage');
    sections.forEach((section, index) => {
      row(
        section.title || `${testType === 'listening' ? 'Part' : 'Passage'} ${index + 1}`,
        section.correct,
        section.total
      );
    });
  }

  if (questionTypes.length) {
    sectionHeading('Scores by question type');
    questionTypes.forEach(([type, stat]) => row(titleCase(type), stat.correct, stat.total));
  }

  if (!sections.length && !questionTypes.length) {
    ensureSpace(20);
    drawRoundedCard(doc, 14, y, 182, 18, [248, 250, 252]);
    setText(doc, COLORS.muted, 8.5);
    doc.text(
      'Detailed question results are not available for this older test attempt.',
      20,
      y + 11
    );
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
