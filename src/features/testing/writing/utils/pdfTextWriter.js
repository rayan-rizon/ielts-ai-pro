/**
 * A page cursor for jsPDF that never drops text.
 *
 * jsPDF's built-in fonts cover Latin only and it cannot shape Indic or Arabic
 * script, so anything outside Latin-1 is drawn by the browser (which shapes it
 * correctly) and placed as an image. Latin text stays real, selectable text.
 */
export const PAGE = { width: 210, margin: 14, bottom: 280 };
export const CONTENT = PAGE.width - PAGE.margin * 2;
const PT = 0.3528;
// Raster resolution, about 280 dpi.
const PX_PER_MM = 11;

const FAMILY =
  "'Plus Jakarta Sans', 'Hind Siliguri', 'Hind', 'Noto Naskh Arabic', 'Vazirmatn', system-ui, sans-serif";

const flatten = (value) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toLatin = (text) =>
  text
    .replace(/[–—−]/g, '-')
    .replace(/[‘’ʻʼ]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/…/g, '...')
    .replace(/→/g, '->')
    .replace(/•/g, '-')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');

/** The text jsPDF can write itself, or null when it needs the browser to draw it. */
export function latinText(value) {
  const latin = toLatin(flatten(value));
  return /^[\x20-\x7E·×]*$/.test(latin) ? latin : null;
}

const graphemes = (text) =>
  typeof Intl.Segmenter === 'function'
    ? Array.from(new Intl.Segmenter().segment(text), (part) => part.segment)
    : Array.from(text);

/** Greedy wrap by words, breaking a single word only when it cannot fit a line. */
function wrap(text, fits) {
  const lines = [];
  let line = '';
  const push = () => {
    if (line) lines.push(line);
    line = '';
  };
  for (const word of text.split(' ')) {
    const joined = line ? `${line} ${word}` : word;
    if (fits(joined)) {
      line = joined;
      continue;
    }
    push();
    line = fits(word) ? word : breakWord(word, fits, lines);
  }
  push();
  return lines;
}

/** Splits a word too wide for one line; returns the piece still being filled. */
function breakWord(word, fits, lines) {
  let line = '';
  const isFull = (next) => Boolean(line) && !fits(next);
  for (const piece of graphemes(word)) {
    if (isFull(line + piece)) {
      lines.push(line);
      line = '';
    }
    line += piece;
  }
  return line;
}

const cssFont = (font) =>
  `${font.italic ? 'italic ' : ''}${font.weight} ${font.sizePx}px ${font.family}`;

export function createCanvasRasterizer() {
  const canvas = document.createElement('canvas');
  const context = () => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser cannot draw text for the PDF');
    return ctx;
  };
  const measure = (text, font) => {
    const ctx = context();
    ctx.font = cssFont(font);
    return ctx.measureText(text).width;
  };
  return {
    measure,
    render(text, { font, color, rtl }) {
      const pad = Math.ceil(font.sizePx * 0.2);
      canvas.width = Math.ceil(measure(text, font)) + pad * 2;
      canvas.height = Math.ceil(font.sizePx * 1.75);
      const ctx = context();
      ctx.font = cssFont(font);
      ctx.fillStyle = `rgb(${color.join(',')})`;
      ctx.direction = rtl ? 'rtl' : 'ltr';
      ctx.textAlign = rtl ? 'right' : 'left';
      const baselinePx = Math.round(font.sizePx * 1.2);
      ctx.fillText(text, rtl ? canvas.width - pad : pad, baselinePx);
      return {
        dataUrl: canvas.toDataURL('image/png'),
        widthPx: canvas.width,
        heightPx: canvas.height,
        baselinePx,
      };
    },
  };
}

export function createTextWriter(doc, { rasterizer, rtl = false, ink = [15, 23, 42] } = {}) {
  let y = PAGE.margin;
  let canvas = rasterizer;
  const raster = () => (canvas ??= createCanvasRasterizer());

  const optionsFor = (options) => ({
    x: PAGE.margin,
    width: CONTENT,
    size: 10,
    style: 'normal',
    color: ink,
    gap: 1.5,
    // English content (essay, corrections, model text) is never mirrored.
    rtl: options.english ? false : rtl,
    align: null,
    ...options,
  });

  const fontFor = ({ size, style }) => ({
    sizePx: Math.round(size * PT * PX_PER_MM),
    weight: style.startsWith('bold') ? 700 : 400,
    italic: style.endsWith('italic'),
    family: FAMILY,
  });

  /** Lines of one block, with how each will be drawn. */
  function layout(text, options) {
    const latin = latinText(text);
    if (latin !== null) {
      if (!latin) return { lines: [], lineHeight: 0, vector: true };
      doc.setFont('helvetica', options.style);
      doc.setFontSize(options.size);
      return {
        lines: doc.splitTextToSize(latin, options.width),
        lineHeight: options.size * PT * 1.4,
        vector: true,
      };
    }
    const font = fontFor(options);
    const room = options.width * PX_PER_MM - font.sizePx * 0.4;
    return {
      lines: wrap(flatten(text), (line) => raster().measure(line, font) <= room),
      lineHeight: options.size * PT * 1.6,
      vector: false,
      font,
    };
  }

  /** Where a line of `width` starts for the block's alignment. */
  function startOf(options, width) {
    const align = options.align || (options.rtl ? 'right' : 'left');
    const free = options.width - width;
    return options.x + (align === 'right' ? free : align === 'center' ? free / 2 : 0);
  }

  function drawLine(line, block, options, baseline) {
    if (block.vector) {
      doc.setFont('helvetica', options.style);
      doc.setFontSize(options.size);
      doc.setTextColor(...options.color);
      doc.text(line, startOf(options, doc.getTextWidth(line)), baseline);
      return;
    }
    const image = raster().render(line, {
      font: block.font,
      color: options.color,
      rtl: options.rtl,
    });
    const width = Math.min(options.width, image.widthPx / PX_PER_MM);
    const height = image.heightPx / PX_PER_MM;
    const top = baseline - (image.baselinePx ?? block.font.sizePx) / PX_PER_MM;
    doc.addImage(
      image.dataUrl,
      'PNG',
      startOf(options, width),
      top,
      width,
      height,
      undefined,
      'FAST'
    );
  }

  const writer = {
    doc,
    get y() {
      return y;
    },
    set y(next) {
      y = next;
    },
    rtl,
    heightOf(text, options = {}) {
      const block = layout(text, optionsFor(options));
      return block.lines.length * block.lineHeight;
    },
    /** Moves to a new page unless `needed` millimetres still fit. */
    ensure(needed) {
      if (y + needed > PAGE.bottom) {
        doc.addPage();
        y = PAGE.margin;
      }
    },
    /** Wraps and paginates a block at the cursor, then moves the cursor below it. */
    write(text, options = {}) {
      const full = optionsFor(options);
      const block = layout(text, full);
      if (!block.lines.length) return;
      for (const line of block.lines) {
        writer.ensure(block.lineHeight);
        drawLine(line, block, full, y + full.size * PT);
        y += block.lineHeight;
      }
      y += full.gap;
    },
    /** Writes at a fixed spot without moving the cursor (labels beside drawings). */
    place(text, top, options = {}) {
      const full = optionsFor(options);
      const block = layout(text, full);
      block.lines.forEach((line, index) =>
        drawLine(line, block, full, top + full.size * PT + index * block.lineHeight)
      );
      return block.lines.length * block.lineHeight;
    },
  };
  return writer;
}
