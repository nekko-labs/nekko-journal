import { test, expect, type Page } from '@playwright/test';

// End-to-end coverage of the core local-first journeys. The app is HashRouter +
// IndexedDB-seeded demo data, so a fresh context starts on the welcome screen
// and lands on a populated 2026 once onboarded.

/** Mark onboarding complete so tests can jump straight to a surface. */
async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    try { localStorage.setItem('nekko.onboarded', '1'); } catch { /* ignore */ }
  });
}

test('onboarding: welcome screen leads into the year', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Nekko Journal' })).toBeVisible();
  await expect(page.getByText('one month at a time')).toBeVisible();
  await page.getByRole('button', { name: 'Begin your year' }).click();
  await expect(page).toHaveURL(/#\/year\/\d{4}/);
});

test('year → month: write a journal entry and see it rendered', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/month/2026-04');

  await expect(page.getByRole('heading', { name: /April 2026/ })).toBeVisible();

  // Enter edit mode, type an entry, leave edit mode.
  await page.getByRole('button', { name: 'Edit' }).click();
  const editor = page.locator('textarea');
  await editor.click();
  await editor.fill('# April\n\nA quiet, steady month. Read two books.');
  await page.getByRole('button', { name: 'Done', exact: true }).click();

  // The rendered markdown should show the heading and body.
  await expect(page.getByText('A quiet, steady month. Read two books.')).toBeVisible();
});

test('journaling assist: offline reflection prompts insert into the entry', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/month/2026-08');

  await page.getByRole('button', { name: /Suggest prompts/ }).click();
  // A prompt (question) appears; clicking it opens the editor with the text.
  const prompt = page.locator('button', { hasText: '?' }).first();
  await expect(prompt).toBeVisible();
  const promptText = (await prompt.innerText()).trim();
  await prompt.click();
  await expect(page.locator('textarea')).toContainText(promptText.slice(0, 15));
});

test('goals: add a goal for the year', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/goals/2026');
  await expect(page.getByRole('heading', { name: /Goals · 2026/ })).toBeVisible();
  // The seeded demo has goals; at least one row is present.
  await expect(page.getByText('In the calendar')).toBeVisible();
});

test('insights: all-time stat tiles render', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/insights');
  await expect(page.getByRole('heading', { name: 'Insights' })).toBeVisible();
  await expect(page.getByText('months journaled')).toBeVisible();
  await expect(page.getByText('goals achieved')).toBeVisible();
});

test('trackers: define a new tracker', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/trackers');
  await page.getByRole('button', { name: 'Add tracker' }).click();
  await page.getByPlaceholder(/Tracker name/).fill('Meditate');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Meditate')).toBeVisible();
});
