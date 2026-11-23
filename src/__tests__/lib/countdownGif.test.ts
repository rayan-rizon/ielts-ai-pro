import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import {
  COUNTDOWN_SIZE,
  countdownImageUrl,
  drawCountdownFrame,
  renderCountdownGif,
} from '../../../supabase/functions/_shared/countdownGif';

const PALETTE = [
  [0xfd, 0xf5, 0xf4],
  [255, 255, 255],
  [0xef, 0xe1, 0xdf],
  [0x26, 0x24, 0x38],
  [0x68, 0x65, 0x7a],
  [0xc9, 0x3c, 0x34],
];

// Decode with a real GIF decoder (libvips), so the bytes are proven valid rather
// than merely matching our own encoder.
async function decode(gif: Uint8Array) {
  const raw = await sharp(Buffer.from(gif), { animated: true })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: raw.data, info: raw.info };
}
const mismatches = (
  decoded: Awaited<ReturnType<typeof decode>>,
  frame: number,
  secondsLeft: number
) => {
  const expected = drawCountdownFrame(secondsLeft);
  const frameBytes =
    decoded.info.width * (decoded.info.pageHeight ?? decoded.info.height) * decoded.info.channels;
  let wrong = 0;
  expected.forEach((index, pixel) => {
    const offset = frame * frameBytes + pixel * decoded.info.channels;
    const colour = PALETTE[index];
    if (colour.some((value, channel) => decoded.data[offset + channel] !== value)) wrong++;
  });
  return wrong;
};

describe('countdown gif', () => {
  const start = 14 * 3600 + 2 * 60 + 7;

  it('is a valid animated GIF, one frame per second, at the declared size', async () => {
    const gif = renderCountdownGif(start, 30);
    expect(Buffer.from(gif).subarray(0, 6).toString()).toBe('GIF89a');
    const { info } = await decode(gif);
    expect(info.width).toBe(COUNTDOWN_SIZE.width);
    expect(info.pageHeight).toBe(COUNTDOWN_SIZE.height);
    expect(info.pages).toBe(30);
    const meta = await sharp(Buffer.from(gif), { animated: true }).metadata();
    expect(meta.delay?.slice(0, 29).every((ms) => ms === 1000)).toBe(true);
  });

  it('shows the real time left in frame 0 and counts down by one second each frame', async () => {
    const decoded = await decode(renderCountdownGif(start, 60));
    for (const frame of [0, 1, 2, 17, 59])
      expect(mismatches(decoded, frame, start - frame)).toBe(0);
  });

  it('keeps a minute of animation to a few kilobytes', () => {
    expect(renderCountdownGif(start, 60).length).toBeLessThan(30_000);
  });

  it('never runs past zero and plays once, holding the final frame', async () => {
    const gif = renderCountdownGif(3, 60);
    const { info, data } = await decode(gif);
    expect(info.pages).toBe(4); // 3, 2, 1, 0
    expect(mismatches({ data, info }, 3, 0)).toBe(0);
    const meta = await sharp(Buffer.from(gif), { animated: true }).metadata();
    expect(meta.loop).not.toBe(0); // 0 would mean it loops forever
  });

  it('is a single still frame for a deadline a day or more away, shown in days', async () => {
    const seconds = 3 * 86400 + 5 * 3600 + 9 * 60;
    const decoded = await decode(renderCountdownGif(seconds, 60));
    expect(decoded.info.pages ?? 1).toBe(1);
    expect(mismatches(decoded, 0, seconds)).toBe(0);
  });

  it('turns the digits red in the last hour', () => {
    const red = (secondsLeft: number) => drawCountdownFrame(secondsLeft).includes(5);
    expect(red(59 * 60)).toBe(true);
    expect(red(2 * 3600)).toBe(false);
  });

  it('builds the image URL from a deadline and rejects a missing or bad one', () => {
    expect(countdownImageUrl('https://x.supabase.co/functions/v1/', '2026-11-24T00:00:00Z')).toBe(
      'https://x.supabase.co/functions/v1/email-countdown?e=1795478400'
    );
    expect(
      countdownImageUrl('https://x.supabase.co/functions/v1', '2026-11-24T00:00:00Z', {
        id: 'd-1',
        token: 't-1',
      })
    ).toBe('https://x.supabase.co/functions/v1/email-countdown?e=1795478400&d=d-1&t=t-1');
    expect(countdownImageUrl('https://x.supabase.co/functions/v1', 'nope')).toBeNull();
    expect(countdownImageUrl('https://x.supabase.co/functions/v1', null)).toBeNull();
    expect(countdownImageUrl('', '2026-11-24T00:00:00Z')).toBeNull();
  });
});
