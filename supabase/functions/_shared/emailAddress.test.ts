import { assertEquals } from 'jsr:@std/assert@1';
import { isUndeliverableEmail } from './emailAddress.ts';

Deno.test('reserved test domains are undeliverable', () => {
  for (const address of [
    'qa@example.com',
    'QA@Example.ORG',
    'a@mail.example.net',
    'a@foo.test',
    'a@foo.invalid',
    'a@localhost',
    'a@foo.example',
    'not-an-email',
    '',
  ]) {
    assertEquals(isUndeliverableEmail(address), true, address);
  }
});

Deno.test('real domains are deliverable', () => {
  for (const address of ['learner@gmail.com', 'a@examples.com', 'a@ieltsai.pro', 'a@testing.io']) {
    assertEquals(isUndeliverableEmail(address), false, address);
  }
});
