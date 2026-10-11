// This cache is exclusively for anonymous, explicitly public SEO content.
export function canReadPublicCache(request) {
  return request.method === 'GET' && !request.headers.has('authorization') &&
    !request.headers.has('cookie');
}

export function canStorePublicResponse(response) {
  const policy = response.headers.get('cache-control') || '';
  return response.status === 200 && !response.headers.has('set-cookie') &&
    !response.headers.has('vary') && /(?:^|,)\s*public\s*(?:,|$)/i.test(policy) &&
    !/(?:^|,)\s*(?:private|no-store|no-cache)\b/i.test(policy);
}
