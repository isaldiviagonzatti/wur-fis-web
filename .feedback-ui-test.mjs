import { chromium } from 'playwright';

const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto('http://localhost:8788/data-explorer/crop-statistics?tab=methodology');
await page.getByRole('button', { name: 'Feedback' }).click();
const dialog = page.getByRole('dialog');
await dialog.waitFor();
const box = await dialog.boundingBox();
console.log('dialog box', JSON.stringify(box));

const sendButton = dialog.getByRole('button', { name: 'Send' });
console.log('send disabled before typing:', await sendButton.isDisabled());

await dialog.locator('[data-slot="select-trigger"]').click();
await page.getByRole('option', { name: 'Question about the data' }).click();
await dialog.getByLabel('Message').fill('UI test: yield units on the crop statistics page?');
await dialog.getByLabel(/Email/).fill('tester@example.org');
await page.screenshot({ path: `${out}/feedback-form.png` });

await page.waitForFunction(() => !document.body.innerText.includes('Running a quick spam check'), null, { timeout: 30000 });
console.log('send disabled after token:', await sendButton.isDisabled());
await sendButton.click();
await dialog.getByText('Thank you. Your feedback has been saved.').waitFor();
console.log('thank-you shown');

await dialog.getByRole('button', { name: 'Close' }).first().click();
await dialog.waitFor({ state: 'hidden' });

await page.getByRole('button', { name: 'Dark mode' }).click();
await page.getByRole('button', { name: 'Feedback' }).click();
await dialog.waitFor();
console.log('reopened shows form:', await dialog.getByLabel('Message').isVisible());
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/feedback-form-dark.png` });

await page.setViewportSize({ width: 390, height: 780 });
await page.waitForTimeout(300);
console.log('mobile dialog box', JSON.stringify(await dialog.boundingBox()));
await page.screenshot({ path: `${out}/feedback-form-mobile.png` });

console.log('page errors:', JSON.stringify(errors));
await browser.close();
