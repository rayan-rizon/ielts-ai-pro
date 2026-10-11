const compiledSources = new Map();

function compileSource(source) {
  const cached = compiledSources.get(source);
  if (cached) return cached;
  const names = [];
  const pattern = source.split('/').map(segment => {
    if (segment.startsWith(':')) {
      names.push(segment.replace(/^:/, '').replace(/\*$/, ''));
      return segment.endsWith('*') ? '(.*)' : '([^/]+)';
    }
    if (segment.startsWith('(') && segment.endsWith(')')) return segment;
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('/');
  const compiled = { names, pattern: new RegExp(`^${pattern}$`) };
  // Configuration has a fixed small rule set; bound the reusable cache anyway.
  if (compiledSources.size >= 256) compiledSources.delete(compiledSources.keys().next().value);
  compiledSources.set(source, compiled);
  return compiled;
}

export function matchSource(source, pathname) {
  const { names, pattern } = compileSource(source);
  const match = pattern.exec(pathname);
  if (!match) return null;
  return Object.fromEntries(names.map((name, i) => [name, match[i + 1]]));
}

export function resolveRule(rules, pathname) {
  for (const rule of rules) {
    const params = matchSource(rule.source, pathname);
    if (params === null) continue;
    let destination = rule.destination;
    for (const [name, value] of Object.entries(params)) destination = destination.replaceAll(`:${name}`, value);
    return { ...rule, destination };
  }
  return null;
}

export function configuredHeaders(rules, pathname) {
  const headers = new Headers();
  for (const rule of rules) {
    if (matchSource(rule.source, pathname) === null) continue;
    for (const { key, value } of rule.headers) headers.set(key, value);
  }
  return headers;
}
