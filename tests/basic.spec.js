const { test, expect } = require('playwright/test');
const fs = require('fs');

const baseURL = 'http://localhost:3000';
const words = fs.readFileSync('words.txt', 'utf-8')
  .trim()
  .split(/\r?\n/);

function countWordsStartingWith(letter) {
  return words.filter(w => w.startsWith(letter)).length;
}

test.describe('Wordle Helper', () => {
  test('shows all words on first load', async ({ page }) => {
    await page.goto(baseURL);
    await expect(page.locator('#result')).toHaveText(`${words.length} possible words`);
  });

  test('filters by first letter', async ({ page }) => {
    await page.goto(baseURL);
    await page.fill('#pos0', 'a');
    const expected = countWordsStartingWith('a');
    await expect(page.locator('#result')).toHaveText(`${expected} possible words`);
    const list = await page.$$eval('#word-list li', els => els.map(el => el.textContent));
    expect(list.every(w => w.startsWith('a'))).toBe(true);
  });

  test('selects letter from popup', async ({ page }) => {
    await page.goto(baseURL);
    await page.click('#pos1');
    await expect(page.locator('#alphabet-popup')).toBeVisible();
    await page.click('#alphabet-popup .popup-letter:has-text("B")');
    await expect(page.locator('#alphabet-popup')).toBeHidden();
    await expect(page.locator('#pos1')).toHaveValue('b');
    await expect(page.locator('.tile', { hasText: 'B' })).toHaveClass(/present/);
  });

  test('absent letters disabled in popup', async ({ page }) => {
    await page.goto(baseURL);
    const tile = page.locator('.tile', { hasText: 'C' });
    await tile.click();
    await tile.click();
    await expect(tile).toHaveClass(/absent/);
    await page.click('#pos2');
    const popupLetter = page.locator('#alphabet-popup .popup-letter:has-text("C")');
    await expect(popupLetter).toHaveClass(/disabled/);
  });

  test('typing count replaces value', async ({ page }) => {
    await page.goto(baseURL);
    const container = page.locator('.tile-container', { has: page.locator('.tile', { hasText: 'D' }) });
    const input = container.locator('input');
    await input.focus();
    await input.type('1');
    await expect(input).toHaveValue('1');
    await input.type('3');
    await expect(input).toHaveValue('3');
  });
});
