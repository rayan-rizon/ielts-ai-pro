// Small RFC 4180 parser: quoted commas, escaped quotes, CRLF, and multiline fields.
export function parseStudentCsv(text) {
  if (text.length > 1024 * 1024) throw new Error('CSV must be smaller than 1 MB');
  const rows = [];
  let row = [],
    field = '',
    quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && source[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (quoted) throw new Error('CSV contains an unfinished quoted field');
  row.push(field);
  if (row.some((x) => x.trim())) rows.push(row);
  if (!rows.length) return [];
  const header = rows[0].map((x) => x.trim().toLowerCase());
  const emailIndex = header.indexOf('email');
  if (emailIndex < 0) throw new Error('CSV needs an email column; name is optional');
  const nameIndex = header.indexOf('name');
  const seen = new Set();
  return rows.slice(1).map((values, index) => {
    const email = (values[emailIndex] || '').trim().toLowerCase();
    const error = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? 'Invalid email'
      : seen.has(email)
        ? 'Duplicate email'
        : null;
    seen.add(email);
    return {
      row: index + 2,
      email,
      name: nameIndex >= 0 ? (values[nameIndex] || '').trim() : '',
      error,
    };
  });
}
