/** Checks that the planner has no link on the home page, header or footer, but its URL still opens. */
import { chromium } from 'playwright';

const [base, dir] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto(base, { waitUntil: 'networkidle' });
console.log('planner links on home page:', await page.locator('a[href="/foodshed/planner"]').count());
const card = page.locator('[data-slot="card"]', { hasText: 'Foodshed Planner' });
console.log('planner card shown:', await card.count(), '| badge:', await card.getByText('Coming soon').count());
await card.screenshot({ path: `${dir}/planner-card.png` });
const res = await page.goto(`${base}foodshed/planner`, { waitUntil: 'networkidle' });
console.log('/foodshed/planner status:', res.status(), '| h1:', await page.locator('h1').first().innerText());
await browser.close();
