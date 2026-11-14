/** Screenshots favicon candidates at tab sizes for a design check. */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const [dir, ...names] = process.argv.slice(2);
const rows = names
	.map((n) => {
		const src = 'data:image/svg+xml;base64,' + readFileSync(`${dir}/${n}.svg`).toString('base64');
		return `<div style="display:flex;gap:16px;align-items:center;font:12px sans-serif;margin:8px">
			<span style="width:70px">${n}</span>
			${[16, 32, 64].map((s) => `<img src="${src}" width="${s}" height="${s}">`).join('')}</div>`;
	})
	.join('');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 260, height: 90 * names.length }, deviceScaleFactor: 2 });
await page.setContent(`<body style="margin:0;background:#fff">${rows}</body>`);
await page.screenshot({ path: `${dir}/favicons.png`, fullPage: true });
await browser.close();
