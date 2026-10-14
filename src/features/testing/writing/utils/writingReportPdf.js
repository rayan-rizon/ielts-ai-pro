import { jsPDF } from 'jspdf';
import {
  buildChartCheck,
  buildCriteria,
  buildMistakeGroups,
  buildNextStep,
  buildPriorities,
  buildStrengths,
  combinedWritingBand,
  describeMarking,
} from './writingReportModel';
import { writingSourceForMarking } from './evaluationEvidence';

/**
 * Printable Writing report. Same content and order as the screen (it uses the
 * same report model): band and why, scores with reasons, the next step, the
 * Task 1 chart check, every fix in full, strengths, then the essay itself with
 * each paragraph's note, so a teacher or the learner can mark it up by hand.
 *
 * A missing score is shown as a dash. It is never filled in with a number.
 */

const PAGE = { width: 210, margin: 14, bottom: 280 };
const CONTENT = PAGE.width - PAGE.margin * 2;
const PT = 0.3528;

const C = {
  ink: [15, 23, 42],
  body: [51, 65, 85],
  muted: [100, 116, 139],
  faint: [148, 163, 184],
  line: [228, 226, 240],
  well: [244, 243, 251],
  accent: [90, 99, 223],
  ok: [22, 150, 108],
  warn: [186, 124, 26],
  fault: [201, 60, 52],
  white: [255, 255, 255],
};

const STATUS_COLOR = { ok: C.ok, warn: C.warn, fault: C.fault, unknown: C.muted };

export const safeText = (value) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[–—−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/→/g, '->')
    .replace(/\s+/g, ' ')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();

const formatBand = (value) =>
  Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value).toFixed(1) : '-';

function createWriter(doc) {
  let y = PAGE.margin;
  const font = (size, style = 'normal', color = C.ink) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const lines = (text, width, size, style = 'normal') => {
    font(size, style);
    const clean = safeText(text);
    return clean ? doc.splitTextToSize(clean, width) : [];
  };
  const height = (count, size, lineHeight = 1.35) => count * size * PT * lineHeight;
  const ensure = (needed) => {
    if (y + needed <= PAGE.bottom) return;
    doc.addPage();
    y = PAGE.margin;
  };
  /** Writes wrapped text, breaking across pages line by line. Returns nothing; advances y. */
  const write = (
    text,
    x,
    width,
    { size = 9, style = 'normal', color = C.body, lineHeight = 1.35, gap = 0 } = {}
  ) => {
    const wrapped = lines(text, width, size, style);
    const step = size * PT * lineHeight;
    wrapped.forEach((line) => {
      ensure(step);
      font(size, style, color);
      doc.text(line, x, y + size * PT);
      y += step;
    });
    if (wrapped.length) y += gap;
  };
  const heading = (text, size = 11.5) => {
    ensure(size * PT + 14);
    doc.setFillColor(...C.accent);
    doc.rect(PAGE.margin, y + 0.5, 0.9, size * PT + 0.5, 'F');
    font(size, 'bold', C.ink);
    doc.text(safeText(text), PAGE.margin + 3.2, y + size * PT);
    y += size * PT + 3.5;
  };
  const rule = () => {
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, y, PAGE.margin + CONTENT, y);
  };
  return {
    doc,
    font,
    lines,
    height,
    ensure,
    write,
    heading,
    rule,
    get y() {
      return y;
    },
    set y(value) {
      y = value;
    },
  };
}

function drawScore(w, taskName, feedback, criteria) {
  const { doc } = w;
  w.ensure(40);
  w.font(15, 'bold', C.ink);
  doc.text(safeText(taskName), PAGE.margin, w.y + 15 * PT);
  w.font(26, 'bold', C.ink);
  doc.text(formatBand(feedback.overallBand), PAGE.margin + CONTENT, w.y + 26 * PT, {
    align: 'right',
  });
  w.font(8, 'normal', C.muted);
  doc.text('band', PAGE.margin + CONTENT, w.y + 26 * PT + 4, { align: 'right' });
  w.y += 12;

  if (feedback.summary) {
    w.write(`Why you got ${formatBand(feedback.overallBand)}`, PAGE.margin, CONTENT - 30, {
      size: 9.5,
      style: 'bold',
      color: C.ink,
    });
    w.write(feedback.summary, PAGE.margin, CONTENT - 30, { size: 9.2, color: C.body, gap: 3 });
  }

  criteria.forEach((criterion) => {
    w.ensure(16);
    w.rule();
    w.y += 3;
    w.font(9.5, 'bold', C.ink);
    doc.text(safeText(criterion.label), PAGE.margin, w.y + 9.5 * PT);
    doc.text(formatBand(criterion.score), PAGE.margin + CONTENT, w.y + 9.5 * PT, {
      align: 'right',
    });
    w.y += 5;
    const barWidth = 60;
    doc.setFillColor(...C.well);
    doc.roundedRect(PAGE.margin, w.y, barWidth, 1.3, 0.6, 0.6, 'F');
    doc.setFillColor(...(criterion.isLowest ? C.warn : C.accent));
    doc.roundedRect(PAGE.margin, w.y, barWidth * (criterion.score / 9), 1.3, 0.6, 0.6, 'F');
    w.y += 3.5;
    w.write(criterion.note || criterion.help, PAGE.margin, CONTENT, {
      size: 8.6,
      color: criterion.note ? C.body : C.muted,
      gap: 2,
    });
  });

  const marking = describeMarking(feedback.scoreAgreement);
  if (marking) w.write(marking, PAGE.margin, CONTENT, { size: 7.8, color: C.muted, gap: 2 });
  w.y += 4;
}

function drawNextStep(w, step) {
  const { doc } = w;
  if (!step) return;
  w.heading('Your next step');
  const top = w.y;
  const startPage = doc.getCurrentPageInfo().pageNumber;
  const x = PAGE.margin + 4;
  const width = CONTENT - 4;
  if (step.criterion)
    w.write(step.criterion, x, width, { size: 8, style: 'bold', color: C.accent });
  w.write(step.title, x, width, {
    size: 11.5,
    style: 'bold',
    color: C.ink,
    lineHeight: 1.2,
    gap: 1,
  });
  if (step.body) w.write(step.body, x, width, { size: 9.2, color: C.body, gap: 1.5 });
  if (step.evidenceText) {
    w.write('From your essay:', x, width, { size: 8, color: C.muted });
    w.write(`"${step.evidenceText}"`, x, width, { size: 9, style: 'italic', color: C.ink, gap: 1 });
  }
  if (doc.getCurrentPageInfo().pageNumber === startPage && w.y > top) {
    doc.setFillColor(...C.accent);
    doc.rect(PAGE.margin, top, 0.9, w.y - top, 'F');
  }
  w.y += 5;
}

function drawChartCheck(w, check) {
  const { doc } = w;
  if (!check) return;
  w.heading('What the marker saw in the visual');
  w.ensure(10);
  doc.setFillColor(...STATUS_COLOR[check.status]);
  doc.circle(PAGE.margin + 1.2, w.y + 1.8, 1, 'F');
  w.write(check.message, PAGE.margin + 4, CONTENT - 4, { size: 9.2, color: C.body, gap: 1.5 });
  if (check.features.length) {
    w.write('Main features ([x] = mentioned in your answer):', PAGE.margin, CONTENT, {
      size: 8.8,
      style: 'bold',
      color: C.ink,
    });
    check.features.forEach((feature) =>
      w.write(
        `${feature.covered ? '[x]' : '[ ]'} ${feature.text}${feature.covered ? '' : '  (not clearly in your answer)'}`,
        PAGE.margin + 2,
        CONTENT - 2,
        { size: 8.8 }
      )
    );
  }
  if (check.limitations)
    w.write(check.limitations, PAGE.margin, CONTENT, { size: 8, color: C.muted, gap: 1 });
  w.y += 4;
}

function drawAlsoWorkOn(w, priorities) {
  if (!priorities.length) return;
  w.heading('Also work on');
  priorities.forEach((priority, index) => {
    w.write(
      `${index + 2}. ${priority.issue || priority.action}${priority.criterion ? `  (${priority.criterion})` : ''}`,
      PAGE.margin,
      CONTENT,
      { size: 9.3, style: 'bold', color: C.ink }
    );
    if (priority.issue && priority.action) {
      w.write(priority.action, PAGE.margin + 4, CONTENT - 4, { size: 9, color: C.body, gap: 2 });
    }
  });
  w.y += 3;
}

function drawFixes(w, groups) {
  if (!groups.length) return;
  w.heading('Fix these');
  groups.forEach((group) => {
    w.write(group.label, PAGE.margin, CONTENT, {
      size: 8.5,
      style: 'bold',
      color: C.muted,
      gap: 1,
    });
    group.items.forEach((item) => {
      const line = item.replacement
        ? `"${item.original}"  ->  "${item.replacement}"`
        : `"${item.original}"${item.advice ? `   Suggestion: ${item.advice}` : ''}`;
      w.write(line, PAGE.margin + 2, CONTENT - 2, { size: 9, color: C.ink });
      if (item.explanation)
        w.write(item.explanation, PAGE.margin + 2, CONTENT - 2, { size: 8.3, color: C.muted });
      w.y += 2;
    });
    w.y += 1;
  });
  w.y += 2;
}

function drawStrengths(w, strengths) {
  if (!strengths.length) return;
  w.heading("What's already working");
  strengths.forEach((item) =>
    w.write(`+ ${item}`, PAGE.margin, CONTENT, { size: 9, color: C.body, gap: 1 })
  );
  w.y += 3;
}

const paragraphKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function drawEssay(w, essay, paragraphNotes) {
  const paragraphs = writingSourceForMarking(essay).split('\n\n').filter(Boolean);
  if (!paragraphs.length) return;
  w.heading('Your essay');
  paragraphs.forEach((paragraph, index) => {
    w.write(`Paragraph ${index + 1}`, PAGE.margin, CONTENT, {
      size: 7.8,
      style: 'bold',
      color: C.muted,
    });
    w.write(paragraph, PAGE.margin, CONTENT, { size: 9.6, color: C.ink, lineHeight: 1.5, gap: 1 });
    const key = paragraphKey(paragraph);
    const note = (paragraphNotes || []).find(
      (item) => paragraphKey(item.opening).length >= 3 && key.startsWith(paragraphKey(item.opening))
    )?.note;
    if (note)
      w.write(`Note: ${note}`, PAGE.margin + 3, CONTENT - 3, {
        size: 8.6,
        style: 'italic',
        color: C.accent,
      });
    w.y += 3;
  });
}

export const createWritingReportPdf = ({ feedbacks, drafts = {}, generatedAt = new Date() }) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const reports = Object.entries(feedbacks || {}).filter(
    ([, feedback]) => feedback && (feedback.overallBand || feedback.summary)
  );
  doc.setProperties({ title: 'IELTS Writing report', author: 'IELTS Ai Pro' });

  const w = createWriter(doc);
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, PAGE.width, 2.5, 'F');
  w.font(9, 'normal', C.muted);
  doc.text('IELTS Writing report', PAGE.margin, 13);
  doc.text(
    generatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    PAGE.margin + CONTENT,
    13,
    { align: 'right' }
  );
  w.y = 20;

  if (!reports.length) {
    w.write(
      'No marked writing yet. Finish a writing task to get your report.',
      PAGE.margin,
      CONTENT,
      {
        size: 11,
        style: 'bold',
        color: C.ink,
      }
    );
  }

  const combined = combinedWritingBand(feedbacks);
  if (combined) {
    w.write(`Writing band for both tasks: ${formatBand(combined)}`, PAGE.margin, CONTENT, {
      size: 11,
      style: 'bold',
      color: C.ink,
    });
    w.write('Task 2 counts twice as much as Task 1.', PAGE.margin, CONTENT, {
      size: 8.5,
      color: C.muted,
      gap: 4,
    });
  }

  reports.forEach(([taskName, feedback], index) => {
    if (index > 0) {
      doc.addPage();
      w.y = PAGE.margin;
    }
    const priorities = buildPriorities(feedback);
    const nextStep = buildNextStep(feedback, priorities);
    drawScore(w, taskName, feedback, buildCriteria(feedback));
    drawNextStep(w, nextStep);
    drawChartCheck(w, buildChartCheck(feedback));
    drawAlsoWorkOn(w, nextStep?.rest || []);
    drawFixes(w, buildMistakeGroups(feedback));
    drawStrengths(w, buildStrengths(feedback));
    drawEssay(w, feedback.originalSource || drafts?.[taskName], feedback.paragraphNotes);
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...C.line);
    doc.line(PAGE.margin, 286, PAGE.margin + CONTENT, 286);
    w.font(7, 'normal', C.muted);
    doc.text(
      'IELTS Ai Pro - practice estimate based on the public IELTS band descriptors, not an official score',
      PAGE.margin,
      290.5
    );
    doc.text(`Page ${page} of ${pages}`, PAGE.margin + CONTENT, 290.5, { align: 'right' });
  }

  return { doc, filename: 'writing-report.pdf' };
};

export const downloadWritingReportPdf = (options) => {
  const result = createWritingReportPdf(options);
  result.doc.save(result.filename);
  return result.filename;
};
