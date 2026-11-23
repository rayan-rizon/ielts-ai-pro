// A small GIF89a writer: a global palette, then frames that may each cover only part
// of the picture. It has no dependencies, so it runs on Deno, Node and in tests.

export type GifBox = { x: number; y: number; w: number; h: number };
export type GifFrame = { box: GifBox; pixels: Uint8Array; delay: number };
export type GifSpec = { width: number; height: number; palette: number[][]; frames: GifFrame[] };

// Packs variable-width codes into bytes, least significant bit first, as GIF needs.
class CodeWriter {
  readonly bytes: number[] = [];
  private bits = 0;
  private count = 0;
  write(code: number, size: number) {
    this.bits |= code << this.count;
    this.count += size;
    while (this.count >= 8) {
      this.bytes.push(this.bits & 255);
      this.bits >>>= 8;
      this.count -= 8;
    }
  }
  finish() {
    if (this.count > 0) this.bytes.push(this.bits & 255);
    return this.bytes;
  }
}

// The string table and code width, which grow together as the data is read.
class LzwEncoder {
  private readonly clear: number;
  private readonly end: number;
  private readonly out = new CodeWriter();
  private dict = new Map<number, number>();
  private next: number;
  private size: number;
  private prefix: number;

  constructor(
    private readonly minCodeSize: number,
    first: number
  ) {
    this.clear = 1 << minCodeSize;
    this.end = this.clear + 1;
    this.next = this.end + 1;
    this.size = minCodeSize + 1;
    this.prefix = first;
    this.out.write(this.clear, this.size);
  }

  push(symbol: number) {
    const key = (this.prefix << 8) | symbol;
    const known = this.dict.get(key);
    if (known !== undefined) {
      this.prefix = known;
      return;
    }
    this.out.write(this.prefix, this.size);
    this.learn(key);
    this.prefix = symbol;
  }

  private learn(key: number) {
    if (this.next < 4096) {
      this.dict.set(key, this.next++);
      if (this.next > 1 << this.size && this.size < 12) this.size++;
      return;
    }
    // The table is full: tell the decoder to start again.
    this.out.write(this.clear, this.size);
    this.dict = new Map();
    this.next = this.end + 1;
    this.size = this.minCodeSize + 1;
  }

  finish() {
    this.out.write(this.prefix, this.size);
    this.out.write(this.end, this.size);
    return this.out.finish();
  }
}

function lzw(indices: Uint8Array, minCodeSize: number): number[] {
  const encoder = new LzwEncoder(minCodeSize, indices[0]);
  for (let i = 1; i < indices.length; i++) encoder.push(indices[i]);
  return encoder.finish();
}

function subBlocks(data: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < data.length; i += 255) {
    const chunk = data.slice(i, i + 255);
    out.push(chunk.length, ...chunk);
  }
  out.push(0);
  return out;
}

const le16 = (n: number) => [n & 255, (n >> 8) & 255];

/** Encode frames as a GIF. A frame's `delay` is in 1/100 s; no loop block, so it plays once. */
export function encodeGif(spec: GifSpec): Uint8Array {
  const bits = Math.max(2, Math.ceil(Math.log2(spec.palette.length)));
  const bytes: number[] = [
    ...[...'GIF89a'].map((c) => c.charCodeAt(0)),
    ...le16(spec.width),
    ...le16(spec.height),
    0x80 | 0x70 | (bits - 1), // global palette, 8-bit colour resolution
    0,
    0,
    ...spec.palette.flat(),
  ];
  for (const { box, pixels, delay } of spec.frames) {
    bytes.push(0x21, 0xf9, 4, 0x04, ...le16(delay), 0, 0);
    bytes.push(0x2c, ...le16(box.x), ...le16(box.y), ...le16(box.w), ...le16(box.h), 0);
    bytes.push(bits, ...subBlocks(lzw(pixels, bits)));
  }
  bytes.push(0x3b);
  return Uint8Array.from(bytes);
}
