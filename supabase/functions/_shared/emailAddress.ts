// Domains reserved by RFC 2606 / RFC 6761 can never receive mail. Accounts
// created with them are QA or seed fixtures, and Resend rejects every send to
// them, so dispatching only produces failures that read as a provider outage.
const RESERVED_DOMAINS = new Set(['example.com', 'example.net', 'example.org', 'localhost']);
const RESERVED_TLDS = ['.example', '.test', '.invalid', '.localhost'];

const DOMAIN_CORRECTIONS: Record<string, string> = {
  'gmail.come': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cmo': 'gmail.com',
  'yahoo.con': 'yahoo.com',
  'outlook.con': 'outlook.com',
  'hotmail.con': 'hotmail.com',
};

export function emailDomainSuggestion(address: string): string | null {
  const domain = address.trim().toLowerCase().split('@')[1];
  return DOMAIN_CORRECTIONS[domain] || null;
}

export function isUndeliverableEmail(address: string | null | undefined): boolean {
  const domain = String(address || '')
    .trim()
    .toLowerCase()
    .split('@')[1];
  if (!domain) return true;
  if (emailDomainSuggestion(String(address))) return true;
  if (RESERVED_DOMAINS.has(domain)) return true;
  if ([...RESERVED_DOMAINS].some((reserved) => domain.endsWith(`.${reserved}`))) return true;
  return RESERVED_TLDS.some((tld) => domain.endsWith(tld));
}
