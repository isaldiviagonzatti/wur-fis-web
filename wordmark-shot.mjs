/** Screenshots the header wordmark (light, dark, phone) for a design check. */
import { chromium } from 'playwright';

const out = process.argv[2];
const browser = await chromium.launch();

async function shoot(width, name, dark) {
	const page = await browser.newPage({ viewport: { width, height: 400 }, deviceScaleFactor: 3 });
	await page.goto('http://localhost:4173/', { waitUntil: 'load' });
	if (dark) await page.getByRole('button', { name: 'Switch to dark mode' }).click();
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(300);
	await page.getByRole('banner').screenshot({ path: `${out}/${name}-header.png` });
	const mark = page.getByRole('banner').getByRole('link', { name: /, home$/ });
	await mark.screenshot({ path: `${out}/${name}-mark.png` });
	const sizes = await mark.evaluate((a) =>
		[...a.querySelectorAll('span')].map((s) => {
			const cs = getComputedStyle(s);
			return `${s.firstChild.textContent.trim()} ${cs.fontSize}/${cs.lineHeight} ${cs.fontWeight}`;
		})
	);
	console.log(name, sizes.join(' | '));
	await page.close();
}

await shoot(1280, 'desktop-light', false);
await shoot(1280, 'desktop-dark', true);
await shoot(390, 'phone-light', false);
await browser.close();
