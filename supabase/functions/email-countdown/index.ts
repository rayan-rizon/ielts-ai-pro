import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { renderCountdownGif } from '../_shared/countdownGif.ts';

// A live countdown for an offer email. The email embeds this URL as an image; the
// mail client fetches it when the message is opened, so the clock starts at the time
// that is really left, not the time the email was sent. The expiry in the URL is
// only a timestamp: it grants nothing and carries no learner data.
const DAY = 86_400;
const MAX_AHEAD = 30 * DAY;

const headers = {
  'Content-Type': 'image/gif',
  // Never cache: a cached image would freeze the clock at an earlier time.
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
  'Access-Control-Allow-Origin': '*',
};

serve((req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 });
  }
  const expiry = Number(new URL(req.url).searchParams.get('e'));
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(expiry) || expiry < now - 7 * DAY || expiry > now + MAX_AHEAD) {
    return new Response('Invalid countdown', { status: 400 });
  }
  const gif = renderCountdownGif(expiry - now);
  return new Response(req.method === 'HEAD' ? null : gif, {
    headers: { ...headers, 'Content-Length': String(gif.length) },
  });
});
