/**
 * Nagad reconciliation report: one row per order with both references Nagad
 * matches on (payment_ref_id from Initialize, issuer_payment_ref = their
 * issuerPaymentRefNo / TrxID). No customer contact details, so the file can be
 * sent to Nagad as is.
 */

export const NAGAD_REPORT_COLUMNS = [
  ['order_id', 'order_id'],
  ['payment_ref_id', 'payment_ref_id'],
  ['issuer_payment_ref', 'issuer_payment_ref'],
  ['status', 'status'],
  ['nagad_status', 'nagad_status'],
  ['nagad_status_code', 'nagad_status_code'],
  ['amount', 'amount'],
  ['paid_amount', 'paid_amount'],
  ['currency', 'currency'],
  ['environment', 'environment'],
  ['plan', 'tier'],
  ['billing_interval', 'billing_interval'],
  ['created_at', 'created_at'],
  ['paid_at', 'paid_at'],
];

export const NAGAD_REPORT_SELECT = [
  ...new Set(NAGAD_REPORT_COLUMNS.map(([, field]) => field)),
].join(', ');

// References are compared character for character, so they are never altered.
const EXACT = new Set(['order_id', 'payment_ref_id', 'issuer_payment_ref']);

function cell(value, field) {
  if (value == null) return '';
  let text = String(value);
  // A leading =, +, - or @ would run as a formula when the file is opened in
  // a spreadsheet. References are left exact for Nagad to match on.
  if (!EXACT.has(field) && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildNagadReconciliationCsv(rows) {
  const header = NAGAD_REPORT_COLUMNS.map(([label]) => label).join(',');
  const lines = (rows || []).map((row) =>
    NAGAD_REPORT_COLUMNS.map(([, field]) => cell(row[field], field)).join(',')
  );
  return `${[header, ...lines].join('\r\n')}\r\n`;
}

export function nagadReportFilename(environment, now = new Date()) {
  const stamp = now.toISOString().slice(0, 10);
  return `nagad-reconciliation-${environment || 'all'}-${stamp}.csv`;
}
