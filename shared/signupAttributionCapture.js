/** Self-contained so Vite and the server-rendered blog can inline the same code. */
export function captureSignupAttribution() {
  try {
    var key = 'attribution_first_touch';
    var now = Date.now();
    var maxAge = 30 * 24 * 60 * 60 * 1000;
    var internal = function (url) {
      return (
        url.origin === window.location.origin ||
        (['ieltsai.pro', 'www.ieltsai.pro'].includes(url.hostname) &&
          ['ieltsai.pro', 'www.ieltsai.pro'].includes(window.location.hostname))
      );
    };
    var nonAcquisition = function (url) {
      return internal(url) || /^accounts\.google\.[a-z.]+$/i.test(url.hostname);
    };
    var previous;
    try {
      previous = JSON.parse(window.localStorage.getItem(key));
    } catch {
      /* replace malformed data */
    }
    if (previous && typeof previous === 'object') {
      var captured = Date.parse(previous.captured_at);
      var hasTags = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'gclid',
        'fbclid',
      ].some(function (field) {
        return Boolean(previous[field]);
      });
      var validReferrer = false;
      try {
        validReferrer = Boolean(previous.referrer) && !nonAcquisition(new URL(previous.referrer));
      } catch {
        /* invalid referrer */
      }
      if (
        Number.isFinite(captured) &&
        captured <= now &&
        now - captured <= maxAge &&
        (hasTags || validReferrer || previous.version === 2)
      )
        return previous;
    }
    var url = new URL(window.location.href);
    var params = url.searchParams;
    var referrer = null;
    try {
      var from = new URL(document.referrer);
      if (!nonAcquisition(from))
        referrer =
          from.origin === 'null'
            ? from.protocol + '//' + from.hostname + from.pathname
            : from.origin + from.pathname;
    } catch {
      /* no referrer */
    }
    var attribution = { version: 2, referrer: referrer, captured_at: new Date(now).toISOString() };
    [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'gclid',
      'fbclid',
    ].forEach(function (field) {
      attribution[field] = params.get(field) || null;
    });
    // Keep only acquisition parameters, never credentials, email addresses or other URL data.
    var safeParams = new URLSearchParams();
    Object.keys(attribution).forEach(function (field) {
      if (/^(utm_|gclid$|fbclid$)/.test(field) && attribution[field])
        safeParams.set(field, attribution[field]);
    });
    attribution.landing_page = url.pathname + (safeParams.size ? '?' + safeParams.toString() : '');
    // Keep even a no-signal landing: a later ad must not replace a direct first visit.
    window.__signupAttribution = attribution;
    try {
      window.localStorage.setItem(key, JSON.stringify(attribution));
    } catch {
      /* in-memory fallback */
    }
    return attribution;
  } catch {
    /* measurement must never break navigation */
  }
}

export const signupAttributionScript = `(${captureSignupAttribution.toString()})();`;
