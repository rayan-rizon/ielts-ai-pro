import jsPDF from 'jspdf';
import {
  essayParagraphs,
  segmentModelParagraph,
} from '../../../../../supabase/functions/_shared/writingBandModels';
import { reportLanguage } from '../../../../../supabase/functions/_shared/reportLanguages';
import {
  CRITERIA,
  buildChartCheck,
  buildCriteria,
  buildMistakeGroups,
  buildNextStep,
  buildPriorities,
  buildStrengths,
  combinedWritingBand,
  describeMarking,
  minimumWordsFor,
  taskTypeOf,
} from './writingReportModel';
import { writingSourceForMarking } from './evaluationEvidence';
import { reportT } from '../report/reportStrings';
import { loadReportFont, reportFontFamily } from '../report/useReportFonts';
import {
  buildEssayMap,
  buildLadder,
  buildPractice,
  markEssay,
  numberMistakes,
} from '../report/reportViewModel';
import { drillText } from '../report/drillText';
import { paragraphName } from '../report/components/paragraphName';
import { CONTENT, PAGE, createTextWriter } from './pdfTextWriter';

/**
 * A printable copy of the Writing report: the same facts, in the same order and
 * the same language as the on-screen report.
 */

const C = {
  ink: [15, 23, 42],
  body: [51, 65, 85],
  muted: [100, 116, 139],
  faint: [148, 163, 184],
  line: [228, 226, 240],
  well: [244, 243, 251],
  tint: [246, 245, 254],
  accent: [90, 99, 223],
  ok: [22, 150, 108],
  warn: [186, 124, 26],
  fault: [201, 60, 52],
  white: [255, 255, 255],
  // The result slip, and text that sits on it.
  slip: [23, 24, 61],
  slipBox: [39, 40, 78],
  slipLine: [58, 60, 100],
  slipSoft: [201, 204, 243],
  slipFaint: [169, 173, 219],
  slipAmber: [240, 181, 74],
  slipGreen: [127, 224, 187],
  slipRing: [154, 161, 255],
};

const STATUS_COLOR = { ok: C.ok, warn: C.warn, fault: C.fault, unknown: C.muted };
const MODEL_CRITERION = { task: 0, coherence: 1, vocabulary: 2, grammar: 3 };

const formatBand = (value) =>
  Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value).toFixed(1) : '-';

function heading(w, text, size = 12) {
  w.ensure(14);
  w.y += 2;
  w.write(text, { size, style: 'bold', gap: 2.5 });
}

const body = (w, text, options = {}) => w.write(text, { size: 9.5, color: C.body, ...options });

// ─── Result slip ──────────────────────────────────────────────────────────────

// The same compact card as on screen: the band beside its reason, then one line per score.
const SLIP_INSET = 5;
const BAND_BOX = 26;
const LADDER_LABEL = 70;
const SCORE_COLUMN = 11;
const ROW_HEIGHT = 8;

function drawTrack(w, { row, ladder, middle, left, width }) {
  const { doc } = w;
  const at = (percent) => left + (width * percent) / 100;
  doc.setDrawColor(...C.slipLine);
  doc.setLineWidth(0.5);
  doc.line(left, middle, left + width, middle);
  doc.setDrawColor(...C.slipAmber);
  doc.setLineWidth(0.35);
  doc.setLineDashPattern([0.9, 0.9], 0);
  doc.line(
    at(ladder.eightAt),
    middle - ROW_HEIGHT / 2,
    at(ladder.eightAt),
    middle + ROW_HEIGHT / 2
  );
  doc.setLineDashPattern([], 0);
  if (ladder.targetAt !== null) {
    doc.setDrawColor(...C.slipRing);
    doc.setLineWidth(0.5);
    doc.line(at(row.at), middle, at(ladder.targetAt), middle);
    doc.setFillColor(...C.slip);
    doc.circle(at(ladder.targetAt), middle, 1.7, 'FD');
  }
  doc.setFillColor(...(row.isLowest ? C.slipAmber : row.atTarget ? C.slipGreen : C.white));
  doc.circle(at(row.at), middle, 1.35, 'F');
}

const rowTone = (row) => (row.isLowest ? C.slipAmber : row.atTarget ? C.slipGreen : C.white);

function drawLadderRow(w, t, { row, ladder, top }) {
  const x = PAGE.margin + SLIP_INSET;
  const status = row.isLowest ? 'lowestArea' : row.atTarget ? 'atTarget' : null;
  w.place(row.label, top + (status ? 0.6 : 2.2), {
    x,
    width: LADDER_LABEL,
    size: 8.5,
    style: 'bold',
    color: C.white,
    english: true,
  });
  if (status)
    w.place(t(status), top + 4.4, {
      x,
      width: LADDER_LABEL,
      size: 6.5,
      style: 'bold',
      color: rowTone(row),
      // Stays under the English criterion name it describes.
      align: 'left',
    });
  const left = x + LADDER_LABEL + 3;
  const right = PAGE.margin + CONTENT - SLIP_INSET;
  drawTrack(w, {
    row,
    ladder,
    middle: top + ROW_HEIGHT / 2,
    left,
    width: right - SCORE_COLUMN - 4 - left,
  });
  w.place(formatBand(row.score), top + 2, {
    x: right - SCORE_COLUMN,
    width: SCORE_COLUMN,
    size: 9.5,
    style: 'bold',
    color: rowTone(row),
    english: true,
    align: 'right',
  });
}

/** The lines beside the band, each as [text, style]. */
function headlineLines(t, feedback) {
  const taskType = taskTypeOf(feedback);
  const count = Number(feedback.wordCount);
  const minimum = minimumWordsFor(taskType);
  const short = Boolean(feedback.isBelowMinimumWordCount) || count < minimum;
  const words =
    count > 0
      ? `${t('wordsCount', { count })} - ${t(short ? 'wordsUnder' : 'wordsOk', { min: minimum })}`
      : '';
  const why = feedback.summary ? t('whyYouGot', { band: formatBand(feedback.overallBand) }) : '';
  return [
    [t('resultHeading', { task: taskType }), { size: 11, style: 'bold', color: C.white }],
    [words, { size: 8, color: short ? C.slipAmber : C.slipGreen }],
    [why, { size: 8, style: 'bold', color: C.slipSoft }],
    [feedback.summary || '', { size: 9.5, color: C.white }],
  ].filter(([text]) => text);
}

function drawLegend(w, t, ladder, top) {
  const x = PAGE.margin + SLIP_INSET;
  const full = CONTENT - SLIP_INSET * 2;
  const titleWidth = 80;
  const keyWidth = full - titleWidth - 2;
  const target =
    ladder.target === null ? '' : `   ${t('legendTarget')} ${formatBand(ladder.target)}`;
  // Title on the reading side, key on the other.
  w.place(t('ladderTitle'), top, {
    x: w.rtl ? x + keyWidth + 2 : x,
    width: titleWidth,
    size: 9,
    style: 'bold',
    color: C.white,
  });
  w.place(`${t('legendBand8')} - - -${target}`, top + 0.4, {
    x: w.rtl ? x : x + titleWidth + 2,
    width: keyWidth,
    size: 7.5,
    color: C.slipSoft,
    align: w.rtl ? 'left' : 'right',
  });
}

function drawBandBox(w, t, { band, x, top }) {
  w.doc.setFillColor(...C.slipBox);
  w.doc.roundedRect(x, top, BAND_BOX, 19, 2.5, 2.5, 'F');
  const centred = { x, width: BAND_BOX, english: true, align: 'center' };
  w.place(formatBand(band), top + 2.2, { ...centred, size: 26, style: 'bold', color: C.white });
  w.place(t('outOf9'), top + 13.6, {
    x,
    width: BAND_BOX,
    size: 7,
    color: C.slipFaint,
    align: 'center',
  });
}

/** Where everything in the card goes, and how tall it will be. */
function slipLayout(w, t, { feedback, criteria, targetBand }) {
  const ladder = buildLadder(criteria, targetBand);
  const lines = headlineLines(t, feedback);
  const left = PAGE.margin + SLIP_INSET;
  // In a right-to-left report the band sits on the right, its reason on the left.
  const boxX = w.rtl ? PAGE.margin + CONTENT - SLIP_INSET - BAND_BOX : left;
  const beside = {
    x: w.rtl ? left : left + BAND_BOX + 4,
    width: CONTENT - SLIP_INSET * 2 - BAND_BOX - 4,
  };
  const textHeight = lines.reduce(
    (sum, [text, style]) => sum + w.heightOf(text, { ...beside, ...style }) + 0.8,
    0
  );
  const headHeight = Math.max(19, textHeight);
  const marking = describeMarking(feedback.scoreAgreement, t);
  const ladderHeight = ladder.rows.length ? 9 + ladder.rows.length * ROW_HEIGHT : 0;
  const height = SLIP_INSET * 2 + headHeight + ladderHeight + (marking ? 5 : 0);
  return { ladder, lines, boxX, beside, headHeight, marking, height };
}

function drawLadder(w, t, ladder, top) {
  if (!ladder.rows.length) return top;
  w.doc.setDrawColor(...C.slipLine);
  w.doc.setLineWidth(0.2);
  w.doc.line(PAGE.margin + SLIP_INSET, top, PAGE.margin + CONTENT - SLIP_INSET, top);
  drawLegend(w, t, ladder, top + 1.5);
  let y = top + 7;
  for (const row of ladder.rows) {
    drawLadderRow(w, t, { row, ladder, top: y });
    y += ROW_HEIGHT;
  }
  return y;
}

function drawSlip(w, t, report) {
  const layout = slipLayout(w, t, report);
  const { height, beside } = layout;
  w.ensure(height);
  const top = w.y;
  w.doc.setFillColor(...C.slip);
  w.doc.roundedRect(PAGE.margin, top, CONTENT, Math.min(height, PAGE.bottom - top), 3, 3, 'F');

  drawBandBox(w, t, {
    band: report.feedback.overallBand,
    x: layout.boxX,
    top: top + SLIP_INSET,
  });
  let y = top + SLIP_INSET;
  for (const [text, style] of layout.lines) y += w.place(text, y, { ...beside, ...style }) + 0.8;

  y = drawLadder(w, t, layout.ladder, top + SLIP_INSET + layout.headHeight + 2);
  if (layout.marking)
    w.place(layout.marking, y + 1, {
      x: PAGE.margin + SLIP_INSET,
      width: CONTENT - SLIP_INSET * 2,
      size: 7,
      color: C.slipFaint,
    });
  w.y = top + height + 5;
}

// ─── Guidance ─────────────────────────────────────────────────────────────────

/** The examiner's reason for each score; the slip itself stays compact. */
function drawReasons(w, t, criteria) {
  const explained = criteria.filter((criterion) => criterion.note);
  if (!explained.length) return;
  heading(w, t('scoreDetails'));
  for (const criterion of explained) body(w, `${criterion.label}: ${criterion.note}`, { gap: 1.2 });
}

function drawNextStep(w, t, step) {
  if (!step) return;
  w.ensure(30);
  w.write([t('nextStep'), step.criterion].filter(Boolean).join(' - '), {
    size: 9,
    style: 'bold',
    color: C.accent,
    gap: 1,
  });
  w.write(step.title, { size: 13.5, style: 'bold', gap: 1.5 });
  if (step.body) body(w, step.body, { gap: 2 });
  if (step.evidenceText) {
    w.write(t('fromEssay'), { size: 8.5, style: 'bold', color: C.muted, gap: 0.5 });
    w.write(`"${step.evidenceText}"`, { size: 9.5, style: 'italic', english: true, gap: 3 });
  }
}

function drawChartCheck(w, t, check) {
  if (!check) return;
  heading(w, t('chartCheck'));
  w.write(check.message, { size: 9.5, color: STATUS_COLOR[check.status] || C.body, gap: 2 });
  if (!check.features.length) return;
  const covered = check.features.filter((feature) => feature.covered).length;
  w.write(t('featuresMentioned', { covered, total: check.features.length }), {
    size: 8.5,
    style: 'bold',
    color: C.muted,
  });
  for (const feature of check.features) {
    const mark = feature.covered ? '[x]' : '[ ]';
    const missing = feature.covered ? '' : ` (${t('featureMissing')})`;
    body(w, `${mark} ${feature.text}${missing}`, { gap: 0.8 });
  }
}

function drawAlsoWorkOn(w, t, priorities) {
  if (!priorities.length) return;
  heading(w, t('alsoWorkOn'));
  priorities.forEach((priority, index) => {
    w.ensure(14);
    w.write(`${index + 2}. ${priority.issue || priority.action}`, {
      size: 10,
      style: 'bold',
      gap: 0.5,
    });
    if (priority.issue && priority.action) body(w, priority.action, { gap: 2 });
  });
}

function drawEssayMap(w, t, paragraphs) {
  if (!paragraphs.length) return;
  heading(w, t('mapTitle'));
  w.ensure(8);
  const gap = 1;
  const usable = CONTENT - gap * (paragraphs.length - 1);
  let x = PAGE.margin;
  for (const paragraph of paragraphs) {
    const width = (usable * paragraph.share) / 100;
    const tone = paragraph.mistakes === 0 ? C.ok : paragraph.mistakes === 1 ? C.warn : C.fault;
    w.doc.setFillColor(...tone);
    w.doc.roundedRect(x, w.y, Math.max(1, width), 2.4, 1.2, 1.2, 'F');
    x += width + gap;
  }
  w.y += 5.5;
  for (const paragraph of paragraphs) {
    const status = paragraph.mistakes
      ? t('mapToFix', { count: paragraph.mistakes })
      : t('mapClean');
    w.write(
      `${paragraphName(t, paragraph)} · ${t('wordsCount', { count: paragraph.words })} · ${status}`,
      { size: 9, style: 'bold', color: C.body, gap: 0.6 }
    );
    if (paragraph.note) body(w, paragraph.note, { size: 8.5, gap: 1.2 });
  }
}

function drawFixes(w, t, groups) {
  if (!groups.length) return;
  heading(w, t('fixTitle'));
  for (const group of groups) {
    w.ensure(18);
    w.write(group.label, { size: 10, style: 'bold', color: C.body, gap: 1.5 });
    for (const item of group.items) {
      w.ensure(14);
      w.write(`${item.n}. ${item.original}`, { size: 9.5, english: true, gap: 0.3 });
      if (item.replacement)
        w.write(`-> ${item.replacement}`, {
          size: 9.5,
          style: 'bold',
          color: C.ok,
          english: true,
          gap: 0.3,
        });
      else if (item.advice) body(w, `${t('pdfSuggestion')}: ${item.advice}`, { gap: 0.3 });
      if (item.explanation) body(w, item.explanation, { size: 8.5, color: C.muted, gap: 0.3 });
      w.y += 2;
    }
  }
}

function drawStrengths(w, t, strengths) {
  if (!strengths.length) return;
  heading(w, t('strengthsTitle'));
  for (const strength of strengths) body(w, `+ ${strength}`, { gap: 1.2 });
}

// ─── Comparison and essay ─────────────────────────────────────────────────────

const criterionName = (id, taskType) => {
  const { label } = CRITERIA[MODEL_CRITERION[id]];
  return typeof label === 'object' ? label[taskType] : label;
};

const numbered = (segments) =>
  segments.map((segment) => (segment.n ? `${segment.text} [${segment.n}]` : segment.text)).join('');

function drawComparison(w, t, { taskType, comparison, essayMap }) {
  heading(w, t('bandVersion', { band: comparison.band }), 11);
  for (const paragraph of comparison.paragraphs) {
    w.ensure(30);
    const name = paragraphName(t, essayMap[paragraph.index]);
    w.write(`${name} - ${t('yourParagraph')}`, {
      size: 9,
      style: 'bold',
      color: C.muted,
      gap: 0.8,
    });
    body(w, paragraph.original, { english: true, gap: 2 });
    w.write(t('bandVersion', { band: comparison.band }), {
      size: 9,
      style: 'bold',
      color: C.accent,
      gap: 0.8,
    });
    w.write(numbered(segmentModelParagraph(paragraph.model, paragraph.notes)), {
      size: 9.5,
      english: true,
      gap: 2,
    });
    for (const note of paragraph.notes)
      body(w, `${note.n}. ${criterionName(note.criterion, taskType)}: ${note.why}`, {
        size: 8.5,
        english: t.language !== 'en' && !comparison.notesTranslated,
        gap: 0.8,
      });
    w.y += 2;
  }
}

function drawComparisons(w, t, { taskType, comparisons, essayMap }) {
  if (!comparisons?.length) return;
  heading(w, t('compareTitle'));
  for (const comparison of comparisons) drawComparison(w, t, { taskType, comparison, essayMap });
  body(w, t('studyPattern'), { size: 8.5, color: C.muted, gap: 2 });
}

function drawEssay(w, t, { essay, groups, essayMap }) {
  const marked = markEssay(essay, groups);
  if (!marked.length) return;
  heading(w, t('essayTitle'));
  marked.forEach((segments, index) => {
    const text = segments
      .map((segment) => (segment.n ? `${segment.text} [${segment.n}]` : segment.text))
      .join('');
    body(w, text, { english: true, gap: 2 });
    const note = essayMap[index]?.note;
    if (note)
      w.write(`${t('pdfNote')}: ${note}`, { size: 8.5, style: 'italic', color: C.accent, gap: 3 });
  });
}

/** The same drills as on screen; a printed page needs no buttons. */
function drawPractice(w, t, drills) {
  if (!drills.length) return;
  heading(w, t('practiseTitle'));
  drills.forEach((drill, index) => {
    const text = drillText(t, drill);
    w.ensure(14);
    w.write(`${index + 1}. ${text.title}`, { size: 10, style: 'bold', gap: 0.5 });
    body(w, text.why, { gap: 1.5 });
    for (const entry of drill.words || [])
      body(w, `${entry.original} -> ${entry.alternatives.join(' / ')}`, {
        english: true,
        gap: 0.8,
      });
  });
}

// ─── Document ─────────────────────────────────────────────────────────────────

function drawTask(w, t, { taskName, feedback, essaySource, targetBand, comparisons }) {
  const report = { taskType: taskName, ...feedback };
  const taskType = taskTypeOf(report);
  const priorities = buildPriorities(report);
  const step = buildNextStep(report, priorities, t);
  const fixes = numberMistakes(buildMistakeGroups(report, t));
  const essay = writingSourceForMarking(essaySource);
  const paragraphs = essayParagraphs(essaySource);
  const essayMap = paragraphs.length
    ? buildEssayMap(essaySource, taskType, fixes, report.paragraphNotes)
    : [];

  const criteria = buildCriteria(report, t);
  drawSlip(w, t, { feedback: report, criteria, targetBand });
  if (t.language !== 'en')
    body(w, t('languageNote', { language: reportLanguage(t.language).name }), {
      size: 8.5,
      color: C.muted,
      gap: 3,
    });
  drawReasons(w, t, criteria);
  drawNextStep(w, t, step);
  drawChartCheck(w, t, buildChartCheck(report, t));
  drawAlsoWorkOn(w, t, step?.rest || []);
  drawEssayMap(w, t, essayMap);
  drawFixes(w, t, fixes);
  drawStrengths(w, t, buildStrengths(report));
  drawComparisons(w, t, { taskType, comparisons, essayMap });
  drawEssay(w, t, { essay, groups: fixes, essayMap });
  drawPractice(
    w,
    t,
    buildPractice({
      criteria,
      fixes,
      essayMap,
      vocabulary: report.vocabularyEnhancements,
    })
  );
}

/** A wide block on the reading side and a narrow one opposite it. */
function splitRow(w, narrow) {
  const wide = CONTENT - narrow - 2;
  return {
    start: { x: w.rtl ? PAGE.margin + narrow + 2 : PAGE.margin, width: wide },
    end: {
      x: w.rtl ? PAGE.margin : PAGE.margin + wide + 2,
      width: narrow,
      align: w.rtl ? 'left' : 'right',
    },
  };
}

function drawHeader(w, t, generatedAt) {
  const { doc } = w;
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, PAGE.width, 3, 'F');
  const row = splitRow(w, 50);
  w.place(t('pdfTitle'), 8, { ...row.start, size: 16, style: 'bold' });
  w.place(
    generatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    9.5,
    { ...row.end, size: 9, color: C.muted, english: true }
  );
  w.y = 20;
}

function drawFooters(w, t) {
  const { doc } = w;
  const pages = doc.getNumberOfPages();
  const row = splitRow(w, 30);
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.2);
    doc.line(PAGE.margin, 286, PAGE.width - PAGE.margin, 286);
    w.place(t('pdfFooter'), 287.5, { ...row.start, size: 7.5, color: C.muted });
    w.place(t('pdfPage', { page, pages }), 287.5, { ...row.end, size: 7.5, color: C.muted });
  }
}

export const createWritingReportPdf = ({
  feedbacks,
  drafts = {},
  generatedAt = new Date(),
  language = 'en',
  targetBand = null,
  comparisons = {},
  rasterizer,
} = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const t = reportT(language);
  const reports = Object.entries(feedbacks || {}).filter(
    ([, feedback]) => feedback && (feedback.overallBand != null || feedback.summary)
  );
  doc.setProperties({ title: 'IELTS Writing report', author: 'IELTS Ai Pro' });
  const w = createTextWriter(doc, { rasterizer, rtl: t.rtl, ink: C.ink });
  drawHeader(w, t, generatedAt);

  const combined = combinedWritingBand(Object.fromEntries(reports));
  if (!reports.length) body(w, t('pdfEmpty'));
  if (combined) {
    w.write(`${t('combinedBand')}: ${combined.toFixed(1)}`, {
      size: 11.5,
      style: 'bold',
      gap: 0.5,
    });
    body(w, t('combinedHint'), { size: 8.5, color: C.muted, gap: 3 });
  }
  reports.forEach(([taskName, feedback], index) => {
    if (index > 0) {
      doc.addPage();
      w.y = PAGE.margin;
    }
    drawTask(w, t, {
      taskName,
      feedback,
      essaySource: feedback.originalSource || drafts?.[taskName],
      targetBand,
      comparisons: comparisons?.[taskName],
    });
  });

  drawFooters(w, t);
  return { doc, filename: 'writing-report.pdf' };
};

/** Waits for the script's web font, so text drawn by the browser looks right. */
async function readyFonts(language) {
  await loadReportFont(language);
  const family = reportFontFamily(language);
  if (!family || !document.fonts?.load) return;
  const sample = reportT(language)('ladderTitle');
  await Promise.all(
    ['400', '700'].map((weight) => document.fonts.load(`${weight} 32px ${family}`, sample))
  ).catch(() => {
    // A system font still shapes the script correctly.
  });
}

export const downloadWritingReportPdf = async (options) => {
  await readyFonts(options?.language);
  const { doc, filename } = createWritingReportPdf(options);
  doc.save(filename);
};
