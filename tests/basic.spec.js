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
});
