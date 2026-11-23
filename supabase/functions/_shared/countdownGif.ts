// A live countdown for email. Mail clients do not run scripts, so the clock is an
// animated GIF drawn at the moment the message is opened: the first frame shows the
// time left right now and each later frame is one second further on. The GIF is
// built here, byte for byte, so it runs anywhere (Deno edge, Node, tests) with no
// image library. Clients that show only a GIF's first frame still see the correct
// time at open.

import { encodeGif, type GifBox, type GifFrame } from './gifEncoder.ts';

const W = 560;
const H = 128;
const TILE_W = 176;
const TILE_H = 120;
const GAP = 12;
const X0 = 4;
const Y0 = 4;

const BG = 0;
const TILE = 1;
const BORDER = 2;
const INK = 3;
const MUTED = 4;
const RED = 5;
const PALETTE = [
  [0xfd, 0xf5, 0xf4], // matches the offer card behind it
  [0xff, 0xff, 0xff],
  [0xef, 0xe1, 0xdf],
  [0x26, 0x24, 0x38],
  [0x68, 0x65, 0x7a],
  [0xc9, 0x3c, 0x34],
  [0xff, 0xff, 0xff],
  [0xff, 0xff, 0xff],
];

const DIGITS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
};

const LETTERS: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['111', '101', '101', '101', '101'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  Y: ['101', '101', '010', '010', '010'],
};

const DIGIT_SCALE = 7;
const LABEL_SCALE = 3;

type Frame = Uint8Array;
type Box = GifBox;
type Point = { x: number; y: number };
type Ink = { scale: number; color: number };
type Font = { glyphs: Record<string, string[]>; width: number };
type TextStyle = Ink & { font: Font };

function fillRect(px: Frame, box: Box, color: number) {
  for (let row = box.y; row < box.y + box.h; row++) {
    px.fill(color, row * W + box.x, row * W + box.x + box.w);
  }
}

// The pixels cut from one corner of a tile, so it reads as a rounded card.
const CORNER = [0, 1, 2, 3, 4].flatMap((dy) =>
  Array.from({ length: 5 - dy }, (_, dx) => ({ dx, dy }))
);

// A tile with its corners cut: the four corners are the same cut, mirrored.
function drawTile(px: Frame, at: Point) {
  fillRect(px, { ...at, w: TILE_W, h: TILE_H }, BORDER);
  fillRect(px, { x: at.x + 2, y: at.y + 2, w: TILE_W - 4, h: TILE_H - 4 }, TILE);
  const right = at.x + TILE_W - 1;
  const bottom = at.y + TILE_H - 1;
  for (const { dx, dy } of CORNER) {
    px[(at.y + dy) * W + at.x + dx] = BG;
    px[(at.y + dy) * W + right - dx] = BG;
    px[(bottom - dy) * W + at.x + dx] = BG;
    px[(bottom - dy) * W + right - dx] = BG;
  }
}

function drawGlyph(px: Frame, glyph: string[], at: Point, ink: Ink) {
  glyph.forEach((rowBits, row) => {
    [...rowBits].forEach((bit, col) => {
      if (bit !== '1') return;
      fillRect(
        px,
        { x: at.x + col * ink.scale, y: at.y + row * ink.scale, w: ink.scale, h: ink.scale },
        ink.color
      );
    });
  });
}

function drawText(px: Frame, text: string, style: TextStyle, centre: Point) {
  const advance = (style.font.width + 1) * style.scale;
  let x = Math.round(centre.x - (text.length * advance - style.scale) / 2);
  for (const char of text) {
    drawGlyph(px, style.font.glyphs[char], { x, y: centre.y }, style);
    x += advance;
  }
}

type Tile = { value: number; label: string };

function tilesFor(secondsLeft: number): Tile[] {
  const s = Math.max(0, Math.floor(secondsLeft));
  if (s >= 86400) {
    return [
      { value: Math.floor(s / 86400), label: 'DAYS' },
      { value: Math.floor((s % 86400) / 3600), label: 'HRS' },
      { value: Math.floor((s % 3600) / 60), label: 'MIN' },
    ];
  }
  return [
    { value: Math.floor(s / 3600), label: 'HRS' },
    { value: Math.floor((s % 3600) / 60), label: 'MIN' },
    { value: s % 60, label: 'SEC' },
  ];
}

const DIGIT_FONT: Font = { glyphs: DIGITS, width: 5 };
const LABEL_FONT: Font = { glyphs: LETTERS, width: 3 };

export function drawCountdownFrame(secondsLeft: number): Frame {
  const px = new Uint8Array(W * H).fill(BG);
  // Under an hour the numbers turn red: the same cue the in-app offer strip uses.
  const digits: TextStyle = {
    font: DIGIT_FONT,
    scale: DIGIT_SCALE,
    color: secondsLeft < 3600 ? RED : INK,
  };
  const labels: TextStyle = { font: LABEL_FONT, scale: LABEL_SCALE, color: MUTED };
  tilesFor(secondsLeft).forEach((tile, index) => {
    const x = X0 + index * (TILE_W + GAP);
    drawTile(px, { x, y: Y0 });
    const centre = x + TILE_W / 2;
    const value = String(Math.min(99, tile.value)).padStart(2, '0');
    drawText(px, value, digits, { x: centre, y: Y0 + 20 });
    drawText(px, tile.label, labels, { x: centre, y: Y0 + 20 + 7 * DIGIT_SCALE + 14 });
  });
  return px;
}

// The smallest box that changed since the last frame: only the ticking digits are
// resent, which keeps a minute of animation to a few kilobytes.
function changedBox(prev: Frame, next: Frame): GifBox {
  let minX = W;
  let minY = H;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (prev[y * W + x] === next[y * W + x]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      maxY = y;
    }
  }
  return maxX < 0
    ? { x: 0, y: 0, w: 1, h: 1 }
    : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function crop(frame: Frame, box: GifBox) {
  const out = new Uint8Array(box.w * box.h);
  for (let row = 0; row < box.h; row++) {
    out.set(
      frame.subarray((box.y + row) * W + box.x, (box.y + row) * W + box.x + box.w),
      row * box.w
    );
  }
  return out;
}

export const COUNTDOWN_SIZE = { width: W, height: H };

/**
 * The countdown as a GIF. Frame 0 shows `secondsLeft`, each later frame one second
 * less. It plays once and holds the last frame; it never loops back to a time that
 * has already passed. A span of a day or more is a single still frame.
 */
export function renderCountdownGif(secondsLeft: number, seconds = 60): Uint8Array {
  const start = Math.max(0, Math.floor(secondsLeft));
  const count = start >= 86400 ? 1 : Math.min(Math.max(seconds, 1), start + 1);
  const frames: GifFrame[] = [];
  let previous: Frame | null = null;
  for (let i = 0; i < count; i++) {
    const frame = drawCountdownFrame(start - i);
    const box = previous ? changedBox(previous, frame) : { x: 0, y: 0, w: W, h: H };
    const delay = i === count - 1 ? 600 : 100; // the last frame is held, in 1/100 s
    frames.push({ box, pixels: previous ? crop(frame, box) : frame, delay });
    previous = frame;
  }
  return encodeGif({ width: W, height: H, palette: PALETTE, frames });
}

/**
 * The email-countdown URL for an offer deadline, or null when there is no valid deadline.
 * With a delivery, loading the image also starts the offer's 24 hours (see the function).
 */
export function countdownImageUrl(
  functionsBaseUrl: string,
  expiresAt?: string | null,
  delivery?: { id: string; token: string } | null
) {
  const seconds = expiresAt ? Math.floor(Date.parse(expiresAt) / 1000) : NaN;
  if (!functionsBaseUrl || !Number.isFinite(seconds)) return null;
  const url = new URL(`${functionsBaseUrl.replace(/\/$/, '')}/email-countdown`);
  url.searchParams.set('e', String(seconds));
  if (delivery) {
    url.searchParams.set('d', delivery.id);
    url.searchParams.set('t', delivery.token);
  }
  return url.toString();
}
