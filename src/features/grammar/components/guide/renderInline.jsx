import React from 'react';

function isStrongToken(raw) {
  const isAsteriskBold = raw.startsWith('**') && raw.endsWith('**');
  const isUnderscoreBold = raw.startsWith('__') && raw.endsWith('__');
  return isAsteriskBold || isUnderscoreBold;
}

function isEmToken(raw) {
  const isAsteriskItalic = raw.startsWith('*') && raw.endsWith('*');
  const isUnderscoreItalic = raw.startsWith('_') && raw.endsWith('_');
  return isAsteriskItalic || isUnderscoreItalic;
}

function parseToken(raw) {
  if (isStrongToken(raw)) {
    return { type: 'strong', value: raw.slice(2, -2).replace(/\uE000/g, '_') };
  }
  if (isEmToken(raw)) {
    return { type: 'em', value: raw.slice(1, -1).replace(/\uE000/g, '_') };
  }
  return { type: 'text', value: raw.replace(/\uE000/g, '_') };
}

function tokenize(s) {
  const tokens = [];
  const regex = /(\*\*[^*]+?\*\*|__[^_]+?__|\*[^*]+?\*|_[^_]+?_)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(s)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        value: s.slice(lastIndex, match.index).replace(/\uE000/g, '_'),
      });
    }
    tokens.push(parseToken(match[0]));
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < s.length) {
    tokens.push({
      type: 'text',
      value: s.slice(lastIndex).replace(/\uE000/g, '_'),
    });
  }
  return tokens;
}

function renderToken(token, index, keyPrefix) {
  if (token.type === 'strong') {
    return (
      <strong
        key={`${keyPrefix}-strong-${index}`}
        className="font-extrabold text-slate-900 dark:text-white"
      >
        {renderInline(token.value, `${keyPrefix}-s-${index}`)}
      </strong>
    );
  }
  if (token.type === 'em') {
    return (
      <em
        key={`${keyPrefix}-em-${index}`}
        className="font-semibold italic text-slate-800 dark:text-slate-100"
      >
        {renderInline(token.value, `${keyPrefix}-e-${index}`)}
      </em>
    );
  }
  return <span key={`${keyPrefix}-text-${index}`}>{token.value}</span>;
}

export function renderInline(value, keyPrefix) {
  const str = String(value || '');
  if (!str) return null;
  if (!/[*_]/.test(str)) {
    return str;
  }

  const ESCAPED_UNDERSCORE = '\uE000';
  const s = str.replace(/\\_/g, ESCAPED_UNDERSCORE);
  const tokens = tokenize(s);

  return tokens.map((token, index) => renderToken(token, index, keyPrefix));
}
