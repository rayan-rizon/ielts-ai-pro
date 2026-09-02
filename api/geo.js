/**
 * Resolve the visitor's country without asking them.
 *
 * Vercel resolves the client IP to a country at the edge and attaches it to
 * every request, so this costs no third-party lookup, no API key, and no
 * consent prompt — it is the same signal the CDN already used to route the
 * request. A two-letter country code is not personal data on its own and is
 * never stored alongside the IP it came from.
 *
 * `users.country` was null for every row, which made it impossible to tell
 * whether a geo-targeted campaign was converting anywhere, or to decide which
 * markets deserve regional pricing and a local payment rail.
 */

const ISO_COUNTRY = /^[A-Z]{2}$/;

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const header = req.headers['x-vercel-ip-country'];
  const raw = typeof header === 'string' ? header.trim().toUpperCase() : '';

  // `XX` and `T1` are Vercel's placeholders for unknown and Tor. Both mean "no
  // usable country" and must not be written to a profile as if they were real.
  const country = ISO_COUNTRY.test(raw) && raw !== 'XX' && raw !== 'T1' ? raw : null;

  // Per-visitor by definition — a cached response would hand one visitor's
  // country to everyone behind the same edge node.
  res.setHeader('Cache-Control', 'no-store, private');

  return res.status(200).json({ country });
}
