import { describe, it, expect } from 'vitest';
import { parseStudentCsv } from '@/features/institution/services/csv';
describe('Institution CSV invitations', () => {
  it('handles BOM, reordered headers, quoted commas and escaped quotes', () =>
    expect(parseStudentCsv('\uFEFFname,email\r\n"Lee, ""Sam""",Sam@Example.com\r\n')).toEqual([
      { row: 2, email: 'sam@example.com', name: 'Lee, "Sam"', error: null },
    ]));
  it('flags duplicates and invalid emails for preview', () =>
    expect(
      parseStudentCsv('email,name\na@example.com,A\nA@example.com,B\nbad,C').map((x) => x.error)
    ).toEqual([null, 'Duplicate email', 'Invalid email']));
  it('supports multiline fields', () =>
    expect(parseStudentCsv('email,name\na@example.com,"A\nB"')[0].name).toBe('A\nB'));
  it('requires an email column and complete quoting', () => {
    expect(() => parseStudentCsv('name\nA')).toThrow('email column');
    expect(() => parseStudentCsv('email,name\na@example.com,"A')).toThrow('unfinished');
  });
});
