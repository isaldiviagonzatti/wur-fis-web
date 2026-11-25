/** Screenshots the site header at desktop and phone widths, light and dark. */
import { chromium } from 'playwright';

const [url, dir] = process.argv.slice(2);
const browser = await chromium.launch();
for (const [name, width, dark] of [['desk', 1280, false], ['desk-dark', 1280, true], ['phone', 390, false]]) {
	const page = await browser.newPage({ viewport: { width, height: 300 }, deviceScaleFactor: 2 });
	await page.goto(url, { waitUntil: 'networkidle' });
	if (dark) await page.evaluate(() => document.documentElement.classList.add('dark'));
	await page.screenshot({ path: `${dir}/header-${name}.png`, clip: { x: 0, y: 0, width: Math.min(width, 700), height: 80 } });
	await page.close();
}
await browser.close();
