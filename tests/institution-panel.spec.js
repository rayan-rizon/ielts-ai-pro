import { test, expect } from '@playwright/test';
// Render the real components with a mocked transport. SQL tests separately verify permissions/lifecycle.
const institution = {
  id: 'school',
  name: 'IELTS Centre',
  owner_email: 'owner@example.com',
  contact_email: 'office@example.com',
  currency: 'USD',
  status: 'active',
  updated_at: '2026-10-01T00:00:00Z',
};
const allocation = {
  id: 'grant',
  institution_id: 'school',
  tier: 'premium',
  quantity: 3,
  access_days: 30,
  amount_minor: 0,
  currency: 'USD',
  source: 'complimentary',
  status: 'complimentary',
  activation_deadline: '2099-01-01T00:00:00Z',
  created_at: '2026-10-01T00:00:00Z',
};
const seats = [
  {
    id: 'available',
    order_id: 'grant',
    status: 'available',
    tier: 'premium',
    source: 'complimentary',
    activation_deadline: allocation.activation_deadline,
  },
  {
    id: 'student',
    order_id: 'grant',
    status: 'active',
    tier: 'premium',
    source: 'complimentary',
    recipient_email: 'student@example.com',
    recipient_name: 'Student',
    activated_at: '2026-10-01T00:00:00Z',
    access_until: '2099-01-01T00:00:00Z',
  },
  {
    id: 'waiting',
    order_id: 'grant',
    status: 'waiting',
    tier: 'premium',
    source: 'complimentary',
    recipient_email: 'paid@example.com',
  },
];
const fixture = {
  institution,
  seats,
  orders: [allocation],
  pricing: [
    {
      id: 'price',
      kind: 'default',
      tier: 'pro',
      months: 1,
      quantity: 1,
      currency: 'USD',
      amount: 9.99,
      enabled: true,
    },
  ],
  audit: [],
};
async function renderFixture(page, { admin = false, student = false } = {}) {
  page.on('pageerror', (error) =>
    console.error('Institution fixture browser error:', error.message)
  );
  page.on('console', (message) => {
    if (message.type() === 'error') console.error('Institution fixture console:', message.text());
  });
  const calls = [];
  await page.route('**/__supabase/functions/institutions', async (route) => {
    const body = route.request().postDataJSON();
    calls.push(body);
    let data =
      body.action === 'list'
        ? { enabled: true, institutions: [institution], pricing: fixture.pricing }
        : fixture;
    if (body.action === 'quote')
      data = { amount_minor: 9990, currency: 'USD', quantity: 10, pricing_kind: 'default' };
    if (body.action === 'import')
      data = {
        results: body.data.rows.map((row) => ({
          ...row,
          url: 'https://www.ieltsai.pro/institution/accept?token=test',
          delivery_error: null,
        })),
      };
    if (body.action === 'grant') data = { id: 'new-grant' };
    if (body.action === 'invite')
      data = { url: 'https://www.ieltsai.pro/institution/accept?token=test', delivery_error: null };
    await route.fulfill({ json: { data } });
  });
  await page.route('**/__institution_fixture', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/src/index.css"></head><body><div id="root"></div><script type="module">
 import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
 window.institutionFixtureAdmin=${admin};window.institutionFixtureStudent=${student};
 </script><script type="module" src="/tests/fixtures/institution-panel.jsx"></script></body></html>`,
    })
  );
  await page.goto('/__institution_fixture');
  return calls;
}
test('owner sees seats, students and a calculated prepaid price', async ({ page }) => {
  const calls = await renderFixture(page);
  await expect(page.getByRole('heading', { name: 'IELTS Centre' })).toBeVisible();
  await page.getByRole('button', { name: 'Students', exact: true }).click();
  await expect(page.getByText('student@example.com', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Buy seats', exact: true }).click();
  await page.getByRole('button', { name: 'Calculate price' }).click();
  await expect(page.getByText('$99.90', { exact: true })).toBeVisible();
  expect(calls.some((c) => c.action === 'quote' && c.data.quantity === 10)).toBe(true);
  await expect(page.getByRole('button', { name: 'Grant free seats' })).toHaveCount(0);
});
test('admin grants seats and section navigation remains inside Institutions', async ({ page }) => {
  const calls = await renderFixture(page, { admin: true });
  await page.getByRole('button', { name: /IELTS Centre/ }).click();
  await expect(page.getByText('Platform admin management', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Grant free seats' }).click();
  await page.getByLabel('Seats', { exact: true }).fill('5');
  await page.getByLabel('Access days').fill('14');
  await page.getByLabel('Reason').fill('Trial allocation');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(calls.find((c) => c.action === 'grant')?.data).toMatchObject({
    institution_id: 'school',
    quantity: '5',
    access_days: '14',
    reason: 'Trial allocation',
  });
  await page.getByRole('button', { name: 'Students', exact: true }).click();
  await expect(page).toHaveURL(/tab=institutions.*section=students/);
});
test('owner panel stays within a mobile viewport in both themes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await renderFixture(page);
  await expect(page.getByRole('heading', { name: 'IELTS Centre' })).toBeVisible();
  for (const dark of [false, true]) {
    await page.evaluate((value) => document.documentElement.classList.toggle('dark', value), dark);
    await page.screenshot({
      path: `/tmp/ielts-institution-${dark ? 'dark' : 'light'}-mobile.png`,
      fullPage: true,
    });
    for (const section of ['Overview', 'Students', 'Buy seats', 'Billing', 'Settings']) {
      await page.getByRole('button', { name: section, exact: true }).click();
      await expect(page.getByRole('button', { name: section, exact: true })).toHaveAttribute(
        'aria-current',
        'page'
      );
      await page.screenshot({
        path: `/tmp/ielts-institution-${section}-${dark ? 'dark' : 'light'}-mobile.png`,
        fullPage: true,
      });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${section} ${dark ? 'dark' : 'light'} must not overflow`
      ).toBe(true);
    }
  }
});

test('student sees reserved sponsored access and personal billing management', async ({ page }) => {
  await renderFixture(page, { student: true });
  await expect(page.getByText('Access provided by IELTS Centre')).toBeVisible();
  await expect(
    page.getByText(/A recurring personal subscription can postpone activation/)
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Manage Stripe billing' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel subscription' })).toBeVisible();
});

test('CSV preview excludes duplicate rows and sends a checked batch', async ({ page }) => {
  const calls = await renderFixture(page);
  await page.getByRole('button', { name: 'Students', exact: true }).click();
  await page.getByRole('combobox', { name: 'Seat allocation' }).selectOption('grant');
  await page.getByLabel('Import CSV (email,name)').setInputFiles({
    name: 'students.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'email,name\na@example.com,First\na@example.com,Duplicate\nb@example.com,Second\n'
    ),
  });
  await expect(page.getByText('Duplicate email')).toBeVisible();
  await page.getByRole('button', { name: 'Send 2 invitations' }).click();
  await expect(page.getByText('a@example.com: Sent')).toBeVisible();
  expect(calls.find((c) => c.action === 'import')?.data.rows).toEqual([
    { email: 'a@example.com', name: 'First' },
    { email: 'b@example.com', name: 'Second' },
  ]);
});
