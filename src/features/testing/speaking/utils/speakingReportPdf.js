import { jsPDF } from 'jspdf';
import { buildSpeakingReport } from './buildSpeakingReport';
import { formatBandScore } from './speakingReportSummary';
import {
  CRITERION_HELP,
  ISSUE_LABELS,
  LENGTH_TARGETS,
  answerIssues,
  formatSeconds,
  lengthRatio,
  lengthStatus,
} from './speakingReportInsights';
import { planWeek } from './speakingReportPractice';
import { describeSound } from './speakingDrillLibrary';

/**
 * Printable version of the speaking report. Same content and order as the
 * page (it renders the same `buildSpeakingReport` object), laid out for A4:
 * band and next step, answer lengths, a 7-day plan with boxes to tick by
 * hand, every answer with its stronger version, then the scoring notes.
 */

const PAGE = { width: 210, height: 297, margin: 14, bottom: 280 };
const CONTENT = PAGE.width - PAGE.margin * 2;
const PT = 0.3528; // mm per point

const C = {
  ink: [15, 23, 42],
  body: [51, 65, 85],
  muted: [100, 116, 139],
  faint: [148, 163, 184],
  line: [228, 226, 240],
  well: [244, 243, 251],
  accent: [90, 99, 223],
  accentSoft: [238, 239, 252],
  ok: [22, 150, 108],
  warn: [186, 124, 26],
  fault: [201, 60, 52],
  white: [255, 255, 255],
};

const LENGTH_COLOR = { ok: C.accent, short: C.warn, 'very-short': C.fault, unknown: C.faint };

/** The PDF's built-in font has no phonetic symbols; spell them out instead. */
const IPA_TO_PLAIN = [
  [/tʃ/g, 'ch'],
  [/dʒ/g, 'j'],
  [/[θð]/g, 'th'],
  [/ʃ/g, 'sh'],
  [/ʒ/g, 'zh'],
  [/ŋ/g, 'ng'],
  [/æ/g, 'a'],
  [/ɪ/g, 'i'],
  [/ʊ/g, 'oo'],
  [/ɜ/g, 'er'],
  [/ə/g, 'uh'],
  [/ʌ/g, 'u'],
  [/[ɒɔ]/g, 'o'],
  [/ɑ/g, 'ah'],
  [/ː/g, ''],
];

export const normalizePdfText = (value) =>
  IPA_TO_PLAIN.reduce((text, [pattern, plain]) => text.replace(pattern, plain), String(value ?? ''))
    .replace(/[–—−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/→/g, '->')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '');

function createWriter(doc) {
  let y = PAGE.margin;

  const font = (size, style = 'normal', color = C.ink) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  const lines = (text, width, size, style = 'normal') => {
    font(size, style);
    const safe = normalizePdfText(text);
    return safe ? doc.splitTextToSize(safe, width) : [];
  };

  const blockHeight = (lineCount, size, lineHeight = 1.35) => lineCount * size * PT * lineHeight;

  /** Writes wrapped text at (x, top) and returns the y below it. */
  const write = (
    text,
    x,
    top,
    width,
    { size = 9, style = 'normal', color = C.body, lineHeight = 1.35 } = {}
  ) => {
    const wrapped = lines(text, width, size, style);
    if (wrapped.length === 0) return top;
    font(size, style, color);
    doc.text(wrapped, x, top + size * PT, { lineHeightFactor: lineHeight, baseline: 'alphabetic' });
    return top + blockHeight(wrapped.length, size, lineHeight);
  };

  const ensure = (height) => {
    if (y + height <= PAGE.bottom) return;
    doc.addPage();
    y = PAGE.margin;
  };

  const heading = (text, { size = 13, space = 4 } = {}) => {
    ensure(size * PT * 2 + 12);
    doc.setFillColor(...C.accent);
    doc.rect(PAGE.margin, y + 0.6, 1, size * PT + 0.6, 'F');
    font(size, 'bold', C.ink);
    doc.text(normalizePdfText(text), PAGE.margin + 3.5, y + size * PT);
    y += size * PT + space;
  };

  return {
    doc,
    font,
    lines,
    blockHeight,
    write,
    ensure,
    heading,
    get y() {
      return y;
    },
    set y(value) {
      y = value;
    },
  };
}

function drawHeader(w, { testTitle, dateLabel }) {
  const { doc } = w;
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, PAGE.width, 2.5, 'F');
  w.font(9, 'normal', C.muted);
  doc.text('Speaking report', PAGE.margin, 13);
  if (dateLabel)
    doc.text(normalizePdfText(dateLabel), PAGE.width - PAGE.margin, 13, { align: 'right' });
  w.y = w.write(testTitle || 'IELTS Speaking test', PAGE.margin, 15, CONTENT, {
    size: 17,
    style: 'bold',
    color: C.ink,
    lineHeight: 1.2,
  });
  w.y += 5;
}

function drawVerdictAndFix(w, report, finalEvaluation) {
  const { doc } = w;
  const top = w.y;
  const leftW = 62;
  const gap = 5;
  const rightX = PAGE.margin + leftW + gap;
  const rightW = CONTENT - leftW - gap;

  // Left: band and criteria.
  let ly = top + 6;
  w.font(8.5, 'normal', C.muted);
  doc.text('Overall band', PAGE.margin + 5, ly + 3);
  w.font(34, 'bold', C.ink);
  doc.text(formatBandScore(report.summary.overallScore), PAGE.margin + 5, ly + 16);
  w.font(8.5, 'bold', C.body);
  doc.text(normalizePdfText(report.summary.bandInfo.label), PAGE.margin + leftW - 5, ly + 16, {
    align: 'right',
  });
  ly += 22;
  if (report.summary.isTranscriptEstimate) {
    ly = w.write(
      'Estimate: pronunciation could not be measured.',
      PAGE.margin + 5,
      ly,
      leftW - 10,
      {
        size: 7.5,
        color: C.warn,
        style: 'bold',
      }
    );
    ly += 2;
  }

  const lowestKey = report.holdingBack && !report.holdingBack.level ? report.holdingBack.key : null;
  report.criteria.forEach((criterion) => {
    const isLowest = criterion.key === lowestKey;
    w.font(8.5, 'normal', C.body);
    doc.text(normalizePdfText(criterion.label), PAGE.margin + 5, ly + 3);
    w.font(9.5, 'bold', C.ink);
    doc.text(
      criterion.value == null ? '-' : formatBandScore(criterion.value),
      PAGE.margin + leftW - 5,
      ly + 3,
      { align: 'right' }
    );
    const barW = leftW - 10;
    doc.setFillColor(...C.well);
    doc.roundedRect(PAGE.margin + 5, ly + 5, barW, 1.4, 0.7, 0.7, 'F');
    if (criterion.value != null) {
      doc.setFillColor(...(isLowest ? C.warn : C.accent));
      doc.roundedRect(PAGE.margin + 5, ly + 5, barW * (criterion.value / 9), 1.4, 0.7, 0.7, 'F');
    }
    ly += 10;
  });

  if (report.holdingBack) {
    ly += 1;
    doc.setDrawColor(...C.line);
    doc.line(PAGE.margin + 5, ly, PAGE.margin + leftW - 5, ly);
    ly += 3;
    ly = w.write(
      report.holdingBack.level
        ? 'All your scores are the same'
        : `${report.holdingBack.label} is your weakest area`,
      PAGE.margin + 5,
      ly,
      leftW - 10,
      { size: 8.5, style: 'bold', color: C.ink }
    );
    ly = w.write(finalEvaluation.targetBandTips, PAGE.margin + 5, ly + 1, leftW - 10, {
      size: 7.8,
      color: C.muted,
    });
  }
  const leftBottom = ly + 5;

  // Right: the next step.
  const fix = report.topFix;
  let ry = top + 6;
  const innerX = rightX + 6;
  const innerW = rightW - 11;
  if (fix) {
    w.font(8.5, 'bold', C.accent);
    doc.text('Your next step', innerX, ry + 3);
    ry += 6;
    ry = w.write(fix.title, innerX, ry, innerW, {
      size: 15,
      style: 'bold',
      color: C.ink,
      lineHeight: 1.15,
    });
    ry = w.write(fix.body, innerX, ry + 2, innerW, { size: 9, color: C.body });
    if (fix.evidence)
      ry = w.write(fix.evidence, innerX, ry + 1.5, innerW, {
        size: 8.5,
        style: 'bold',
        color: C.muted,
      });

    const answer = fix.answer;
    if (answer) {
      ry += 4;
      const ref = answer.isLongTurn
        ? 'Part 2 talk'
        : `Part ${answer.part}, question ${answer.number}`;
      ry = w.write(ref, innerX, ry, innerW, { size: 8, color: C.muted });
      if (answer.question)
        ry = w.write(answer.question, innerX, ry, innerW, { size: 9, style: 'bold', color: C.ink });
      ry += 2;
      ry = quoteBox(w, 'You said', answer.text, innerX, ry, innerW, { fill: C.well });
      if (answer.feedback?.suggestedAnswer) {
        ry = quoteBox(
          w,
          'A stronger answer',
          answer.feedback.suggestedAnswer,
          innerX,
          ry + 2,
          innerW,
          {
            fill: C.accentSoft,
            labelColor: C.accent,
            rule: true,
          }
        );
      }
    }
  } else {
    ry = w.write(
      'Your next step appears once your answers have been analysed.',
      innerX,
      ry,
      innerW,
      {
        size: 9,
        color: C.muted,
      }
    );
  }
  const rightBottom = ry + 5;

  const bottom = Math.max(leftBottom, rightBottom);
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.roundedRect(PAGE.margin, top, leftW, bottom - top, 2.5, 2.5, 'S');
  doc.roundedRect(rightX, top, rightW, bottom - top, 2.5, 2.5, 'S');
  doc.setFillColor(...C.accent);
  doc.rect(rightX, top + 2.5, 0.9, bottom - top - 5, 'F');
  w.y = bottom + 7;
}

/** A labelled box around quoted text, sized to fit. Returns the y below it. */
function quoteBox(w, label, text, x, top, width, { fill, labelColor = C.muted, rule = false }) {
  const { doc } = w;
  const textLines = w.lines(text, width - 8, 8.8);
  const height = 4 + 3.5 + w.blockHeight(textLines.length, 8.8) + 3;
  doc.setFillColor(...fill);
  doc.roundedRect(x, top, width, height, 1.8, 1.8, 'F');
  if (rule) {
    doc.setFillColor(...C.accent);
    doc.rect(x, top + 1, 0.7, height - 2, 'F');
  }
  w.font(7.8, 'bold', labelColor);
  doc.text(normalizePdfText(label), x + 4, top + 4.8);
  w.write(text, x + 4, top + 7, width - 8, { size: 8.8, color: C.ink });
  return top + height;
}

function drawLengths(w, report) {
  const { doc } = w;
  const { delivery, basis, answers } = report;
  w.heading('How much you said');

  // Stat row.
  const stats = [
    [
      'Speaking time',
      delivery.speakingMs == null ? 'Not recorded' : formatSeconds(delivery.speakingMs),
    ],
    ['Words', String(delivery.words)],
    ['Pace', delivery.wordsPerMinute == null ? 'Not measured' : `${delivery.wordsPerMinute} wpm`],
    ['Clarity', delivery.clarity == null ? 'Not measured' : `${delivery.clarity}/100`],
  ];
  w.ensure(16 + 52);
  const cellW = CONTENT / 4;
  const top = w.y;
  doc.setDrawColor(...C.line);
  doc.roundedRect(PAGE.margin, top, CONTENT, 14, 2, 2, 'S');
  stats.forEach(([label, value], index) => {
    const x = PAGE.margin + index * cellW;
    if (index > 0) doc.line(x, top + 2, x, top + 12);
    w.font(7.5, 'normal', C.muted);
    doc.text(label, x + 4, top + 5.2);
    w.font(11, 'bold', C.ink);
    doc.text(normalizePdfText(value), x + 4, top + 11);
  });
  w.y = top + 20;

  if (answers.length === 0) {
    w.y =
      w.write('No answers were saved for this test.', PAGE.margin, w.y, CONTENT, {
        size: 9,
        color: C.muted,
      }) + 6;
    return;
  }

  // Bars: same scale as the page, target line at the same height in every part.
  const chartTop = w.y;
  const chartH = 30;
  const CAP = 1.6;
  const targetY = chartTop + chartH - chartH / CAP;
  const gutter = 12;
  const parts = [1, 2, 3].map((part) => answers.filter((answer) => answer.part === part));
  const weights = parts.map((list) => Math.max(list.length, 1.5));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const groupGap = 6;
  const usable = CONTENT - gutter - groupGap * 2;
  let gx = PAGE.margin + gutter;

  w.font(7, 'normal', C.muted);
  doc.text('target', PAGE.margin + gutter - 2, targetY + 1, { align: 'right' });

  parts.forEach((list, index) => {
    const part = index + 1;
    const groupW = (usable * weights[index]) / totalWeight;
    doc.setDrawColor(...C.muted);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(gx, targetY, gx + groupW, targetY);
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(...C.line);
    doc.line(gx, chartTop + chartH, gx + groupW, chartTop + chartH);

    const barW = Math.min(5, (groupW - 2) / Math.max(list.length, 1) - 1.5);
    const barsW = list.length * barW + (list.length - 1) * 1.5;
    let bx = gx + (groupW - barsW) / 2;
    list.forEach((answer) => {
      const ratio = lengthRatio(answer, basis);
      const height = ratio == null ? 1.5 : Math.max(1, (Math.min(ratio, CAP) / CAP) * chartH);
      doc.setFillColor(...LENGTH_COLOR[lengthStatus(answer, basis)]);
      doc.rect(bx, chartTop + chartH - height, barW, height, 'F');
      bx += barW + 1.5;
    });

    const short = list.filter((answer) =>
      ['short', 'very-short'].includes(lengthStatus(answer, basis))
    ).length;
    w.font(8.5, 'bold', C.ink);
    doc.text(`Part ${part}`, gx + groupW / 2, chartTop + chartH + 5, { align: 'center' });
    w.font(7.5, 'normal', C.muted);
    doc.text(
      list.length === 0
        ? 'No answers'
        : short === 0
          ? 'All long enough'
          : `${short} of ${list.length} too short`,
      gx + groupW / 2,
      chartTop + chartH + 9,
      { align: 'center' }
    );
    doc.text(
      normalizePdfText(
        basis === 'time' ? LENGTH_TARGETS[part].short : `${LENGTH_TARGETS[part].words}+ words`
      ),
      gx + groupW / 2,
      chartTop + chartH + 12.5,
      { align: 'center' }
    );
    gx += groupW + groupGap;
  });

  // Legend.
  let lx = PAGE.margin;
  const ly = chartTop + chartH + 18;
  [
    ['Long enough', C.accent],
    ['Too short', C.warn],
    ['Much too short', C.fault],
  ].forEach(([label, color]) => {
    doc.setFillColor(...color);
    doc.rect(lx, ly - 2.2, 2.4, 2.4, 'F');
    w.font(7.5, 'normal', C.muted);
    doc.text(label, lx + 3.5, ly);
    lx += doc.getTextWidth(label) + 10;
  });
  if (basis === 'words') {
    doc.text("Measured in words, because answer times weren't saved.", lx, ly);
  }
  w.y = ly + 8;
}

function drawPlan(w, report, { week, practiceDays = {} }) {
  const { doc } = w;
  if (report.drills.length === 0) return;
  w.heading('Your 7-day plan');
  w.y = w.write(
    'Three short exercises chosen from this test. Start with number 1. Tick a box each day you do one.',
    PAGE.margin,
    w.y,
    CONTENT,
    { size: 8.8, color: C.muted }
  );
  w.y += 3;

  report.drills.forEach((drill, index) => {
    const innerW = CONTENT - 14;
    const reasonLines = w.lines(drill.reason, innerW, 8.3);
    const stepLines = drill.steps.map((step) => w.lines(step, innerW - 5, 8.3));
    const pairLines = (drill.pairs || []).map((pair) =>
      w.lines(`${describeSound(pair.sound)}:  ${pair.pairs}`, innerW, 8.3)
    );
    const height =
      6 +
      5 +
      w.blockHeight(reasonLines.length, 8.3) +
      2 +
      stepLines.reduce((sum, list) => sum + w.blockHeight(list.length, 8.3) + 0.8, 0) +
      pairLines.reduce((sum, list) => sum + w.blockHeight(list.length, 8.3), 0) +
      12;
    w.ensure(height + 4);
    const top = w.y;
    doc.setDrawColor(...C.line);
    doc.roundedRect(PAGE.margin, top, CONTENT, height, 2, 2, 'S');

    doc.setFillColor(...(index === 0 ? C.accent : C.well));
    doc.circle(PAGE.margin + 6, top + 6, 2.6, 'F');
    w.font(8, 'bold', index === 0 ? C.white : C.body);
    doc.text(String(index + 1), PAGE.margin + 6, top + 7.1, { align: 'center' });
    w.font(10, 'bold', C.ink);
    doc.text(normalizePdfText(drill.title), PAGE.margin + 11, top + 7.2);
    w.font(8, 'normal', C.muted);
    doc.text(`${drill.minutes} min a day`, PAGE.width - PAGE.margin - 4, top + 7.2, {
      align: 'right',
    });

    let y = w.write(drill.reason, PAGE.margin + 11, top + 9.5, innerW, {
      size: 8.3,
      color: C.muted,
    });
    y += 1.5;
    drill.steps.forEach((step, stepIndex) => {
      w.font(8.3, 'normal', C.faint);
      doc.text(`${stepIndex + 1}.`, PAGE.margin + 11, y + 8.3 * PT);
      y = w.write(step, PAGE.margin + 16, y, innerW - 5, { size: 8.3, color: C.body }) + 0.8;
    });
    (drill.pairs || []).forEach((pair) => {
      y = w.write(`${describeSound(pair.sound)}:  ${pair.pairs}`, PAGE.margin + 11, y, innerW, {
        size: 8.3,
        color: C.ink,
      });
    });

    // Seven boxes to tick by hand, pre-ticked for days already done online.
    const done = practiceDays[drill.id] || [];
    const boxY = top + height - 8.5;
    week.forEach((day, dayIndex) => {
      const bx = PAGE.margin + 11 + dayIndex * 13;
      const checked = done.includes(day.key);
      doc.setDrawColor(...(checked ? C.accent : C.faint));
      if (checked) {
        doc.setFillColor(...C.accent);
        doc.roundedRect(bx, boxY, 4.5, 4.5, 0.8, 0.8, 'FD');
        doc.setDrawColor(...C.white);
        doc.setLineWidth(0.6);
        doc.line(bx + 1, boxY + 2.3, bx + 2, boxY + 3.3);
        doc.line(bx + 2, boxY + 3.3, bx + 3.6, boxY + 1.2);
        doc.setLineWidth(0.3);
      } else {
        doc.roundedRect(bx, boxY, 4.5, 4.5, 0.8, 0.8, 'S');
      }
      w.font(7, 'normal', C.muted);
      doc.text(normalizePdfText(day.short), bx + 6, boxY + 3.4);
    });
    w.y = top + height + 4;
  });
  w.y += 3;
}

function drawAnswers(w, report) {
  const { doc } = w;
  if (report.answers.length === 0) return;
  w.heading('Your answers');

  [1, 2, 3].forEach((partNumber) => {
    const list = report.answers.filter((answer) => answer.part === partNumber);
    if (list.length === 0) return;
    const part = report.summary.parts.find((item) => item.key === `part${partNumber}`);

    w.ensure(30);
    w.font(11, 'bold', C.ink);
    const partTitle = `Part ${partNumber}${part?.band != null ? `  -  band ${formatBandScore(part.band)}` : ''}`;
    doc.text(partTitle, PAGE.margin, w.y + 4);
    w.y += 6;
    if (part?.observation) {
      w.y = w.write(part.observation, PAGE.margin, w.y, CONTENT, { size: 8.5, color: C.muted }) + 2;
    }

    list.forEach((answer) => drawAnswer(w, answer, report.basis));
    w.y += 2;
  });
}

function drawAnswer(w, answer, basis) {
  const { doc } = w;
  const feedback = answer.feedback;
  const issues = answerIssues(answer, basis);
  const errors = feedback?.grammaticalErrors || [];
  const label = answer.isLongTurn ? 'Talk' : `Q${answer.number}`;
  const length =
    basis === 'time' && answer.durationMs != null
      ? `${formatSeconds(answer.durationMs)}, ${answer.words} words`
      : `${answer.words} words`;
  const meta = [length, ...issues.map((issue) => ISSUE_LABELS[issue])].join('   ');

  const questionLines = w.lines(answer.question || 'Question not saved', CONTENT - 10, 9.5, 'bold');
  const saidLines = w.lines(answer.text, CONTENT - 8, 8.8);
  const strongerLines = feedback?.suggestedAnswer
    ? w.lines(feedback.suggestedAnswer, CONTENT - 8, 8.8)
    : [];
  const firstChunk =
    w.blockHeight(questionLines.length, 9.5) +
    6 +
    7 +
    w.blockHeight(Math.min(saidLines.length, 4), 8.8);
  w.ensure(firstChunk + 6);

  doc.setDrawColor(...C.line);
  doc.line(PAGE.margin, w.y, PAGE.margin + CONTENT, w.y);
  w.y += 3.5;
  w.font(8.5, 'bold', C.faint);
  doc.text(label, PAGE.margin, w.y + 9.5 * PT);
  w.y = w.write(answer.question || 'Question not saved', PAGE.margin + 10, w.y, CONTENT - 10, {
    size: 9.5,
    style: 'bold',
    color: C.ink,
  });
  w.y = w.write(meta, PAGE.margin + 10, w.y + 0.5, CONTENT - 10, { size: 7.8, color: C.muted }) + 2;

  const boxHeight = (count) => 4 + 3.5 + w.blockHeight(count, 8.8) + 3;
  w.ensure(boxHeight(saidLines.length));
  w.y = quoteBox(w, 'You said', answer.text, PAGE.margin, w.y, CONTENT, { fill: C.well }) + 2;
  if (strongerLines.length > 0) {
    w.ensure(boxHeight(strongerLines.length));
    w.y =
      quoteBox(w, 'A stronger answer', feedback.suggestedAnswer, PAGE.margin, w.y, CONTENT, {
        fill: C.accentSoft,
        labelColor: C.accent,
        rule: true,
      }) + 2;
  }

  const why = feedback?.why || feedback?.feedback;
  if (why) {
    w.ensure(10);
    w.y =
      w.write(
        `${feedback?.why ? 'Why it works: ' : 'Examiner note: '}${why}`,
        PAGE.margin,
        w.y,
        CONTENT,
        {
          size: 8.5,
          color: C.body,
        }
      ) + 1.5;
  }
  const drift =
    feedback?.topicDrift && feedback.topicDrift.trim().toLowerCase() !== 'null'
      ? feedback.topicDrift
      : '';
  if (drift) {
    w.ensure(8);
    w.y =
      w.write(`Off topic: ${drift}`, PAGE.margin, w.y, CONTENT, { size: 8.3, color: C.warn }) + 1.5;
  }
  if (errors.length > 0) {
    w.ensure(8);
    w.font(8.3, 'bold', C.ink);
    doc.text('Corrections', PAGE.margin, w.y + 8.3 * PT);
    w.y += 4.5;
    errors.forEach((error) => {
      w.ensure(8);
      const text = `${error.incorrect}  ->  ${error.correct}${error.explanation ? `   (${error.explanation})` : ''}`;
      w.y = w.write(text, PAGE.margin + 3, w.y, CONTENT - 3, { size: 8.3, color: C.body }) + 0.8;
    });
  }
  w.y += 3;
}

function drawScoring(w, report) {
  const { doc } = w;
  w.ensure(40);
  w.y += 2;
  w.heading('How you were scored');

  if (report.summary.strengths.length > 0) {
    w.y =
      w.write("What's already working", PAGE.margin, w.y, CONTENT, {
        size: 9,
        style: 'bold',
        color: C.ink,
      }) + 1;
    report.summary.strengths.forEach((item) => {
      w.ensure(8);
      doc.setFillColor(...C.ok);
      doc.circle(PAGE.margin + 1.2, w.y + 2, 0.9, 'F');
      w.y = w.write(item, PAGE.margin + 4, w.y, CONTENT - 4, { size: 8.5, color: C.body }) + 1;
    });
    w.y += 3;
  }

  report.summary.criteria.forEach((criterion) => {
    w.ensure(18);
    doc.setDrawColor(...C.line);
    doc.line(PAGE.margin, w.y, PAGE.margin + CONTENT, w.y);
    w.y += 3;
    w.font(9.5, 'bold', C.ink);
    doc.text(normalizePdfText(criterion.label), PAGE.margin, w.y + 9.5 * PT);
    doc.text(
      criterion.value == null ? '-' : formatBandScore(criterion.value),
      PAGE.margin + CONTENT,
      w.y + 9.5 * PT,
      {
        align: 'right',
      }
    );
    w.y += 4.5;
    if (CRITERION_HELP[criterion.key]) {
      w.y = w.write(CRITERION_HELP[criterion.key], PAGE.margin, w.y, CONTENT, {
        size: 8,
        color: C.muted,
      });
    }
    if (criterion.note) {
      w.y = w.write(criterion.note, PAGE.margin, w.y + 1, CONTENT, { size: 8.5, color: C.body });
    }
    if (criterion.key === 'pronunciation' && report.pronunciationBreakdown) {
      const { problematicSounds = [], wordIssues = [] } = report.pronunciationBreakdown;
      if (problematicSounds.length > 0) {
        w.y = w.write(
          `Sounds to work on: ${problematicSounds.slice(0, 4).map(describeSound).join(', ')}`,
          PAGE.margin,
          w.y + 1,
          CONTENT,
          {
            size: 8.5,
            color: C.ink,
          }
        );
      }
      wordIssues.slice(0, 8).forEach((item) => {
        w.ensure(6);
        w.y = w.write(`${item.word}: ${item.issue}`, PAGE.margin + 3, w.y, CONTENT - 3, {
          size: 8.2,
          color: C.body,
        });
      });
      if (problematicSounds.length || wordIssues.length) {
        w.y = w.write(
          'This was checked on a short part of your recording, so use it as a guide only.',
          PAGE.margin,
          w.y + 0.5,
          CONTENT,
          { size: 7.5, color: C.muted }
        );
      }
    }
    w.y += 3;
  });
}

function drawInsufficient(w, finalEvaluation) {
  w.heading('No band assigned');
  w.y =
    w.write('More speaking evidence is needed.', PAGE.margin, w.y, CONTENT, {
      size: 10,
      style: 'bold',
      color: C.ink,
    }) + 2;
  w.y =
    w.write(finalEvaluation.feedback, PAGE.margin, w.y, CONTENT, { size: 9, color: C.body }) + 2;
  w.y = w.write(finalEvaluation.targetBandTips, PAGE.margin, w.y, CONTENT, {
    size: 9,
    color: C.body,
  });
}

function drawFooters(doc) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, 286, PAGE.width - PAGE.margin, 286);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text('IELTS Ai Pro - Speaking report', PAGE.margin, 290.5);
    doc.text(`Page ${page} of ${pages}`, PAGE.width - PAGE.margin, 290.5, { align: 'right' });
  }
}

export const createSpeakingReportPdf = ({
  finalEvaluation,
  testTitle,
  report: providedReport,
  allPartsConversation,
  allPartsPronunciation,
  detailedFeedback,
  dateLabel,
  week,
  practiceDays,
  generatedAt = new Date(),
}) => {
  const report =
    providedReport ||
    buildSpeakingReport({
      finalEvaluation,
      allPartsConversation,
      allPartsPronunciation,
      detailedFeedback,
    });
  const { summary } = report;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  doc.setProperties({
    title: `${normalizePdfText(testTitle || 'IELTS Speaking')} - Speaking report`,
    subject: 'IELTS speaking report',
    author: 'IELTS Ai Pro',
    creator: 'IELTS Ai Pro',
  });

  const w = createWriter(doc);
  drawHeader(w, {
    testTitle,
    dateLabel:
      dateLabel ||
      generatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  });

  if (finalEvaluation?.assessmentStatus === 'insufficient_evidence') {
    drawInsufficient(w, finalEvaluation);
  } else {
    drawVerdictAndFix(w, report, finalEvaluation);
    drawLengths(w, report);
    drawPlan(w, report, { week: week || planWeek(generatedAt), practiceDays });
    drawAnswers(w, report);
    drawScoring(w, report);
  }
  drawFooters(doc);

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
