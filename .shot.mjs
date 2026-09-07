import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
await page.goto('http://localhost:5173/yield-forecast', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
await page.getByText('Select crop', { exact: true }).click();
await page.waitForTimeout(600);
await page.getByRole('option', { name: /^Maize/i }).first().click();
await page.waitForTimeout(5000);

// Report the aggregation menu order.
await page.getByText('Grid cells', { exact: true }).click();
await page.waitForTimeout(600);
const order = await page.getByRole('option').allTextContents();
console.log('AGGREGATION ORDER:', order.map((s) => s.trim()).join(' > '));
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

await page.getByText('Zoom to', { exact: true }).click();
await page.waitForTimeout(600);
await page.getByRole('option', { name: /Ghana/i }).first().click();
await page.waitForTimeout(6000);

// Click a published Ghana cell.
await page.mouse.click(865, 285);
await page.waitForTimeout(3000);
const panel = () => page.locator('div.rounded-md.bg-muted\\/30.p-3').last();
console.log('AFTER CELL CLICK:', (await panel().innerText()).split('\n').slice(0, 3).join(' | '));
await page.screenshot({ path: process.argv[2] });

// Switch to Country, where Ghana is filtered out.
await page.getByText('Grid cells', { exact: true }).click();
await page.waitForTimeout(600);
await page.getByRole('option', { name: /^Country/i }).first().click();
await page.waitForTimeout(6000);
const text = await panel().innerText();
console.log('AFTER SWITCH TO COUNTRY:', text.split('\n').join(' | '));
console.log('contains a degree coordinate?', /°/.test(text));
await page.screenshot({ path: process.argv[3] });
console.log(errors.length ? 'ERRORS: ' + errors.join(' | ') : 'no page errors');
await browser.close();
