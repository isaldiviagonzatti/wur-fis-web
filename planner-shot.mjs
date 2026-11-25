/** Walks the foodshed planner (questions, board, toolshed, export) and screenshots each step. */
import { chromium } from 'playwright';

const out = process.argv[2];
const base = process.argv[3] ?? 'http://localhost:5173';
const browser = await chromium.launch();
const errors = [];

function watch(page, name) {
	page.on('pageerror', (error) => errors.push(`${name} pageerror: ${error.message}`));
	page.on('console', (message) => {
		if (message.type() === 'error' || message.type() === 'warning') {
			errors.push(`${name} console.${message.type()}: ${message.text().slice(0, 300)}`);
		}
	});
}

async function fresh(page) {
	await page.goto(`${base}/foodshed/planner`, { waitUntil: 'networkidle' });
	await page.evaluate(() => localStorage.clear());
	await page.reload({ waitUntil: 'networkidle' });
	await page.getByRole('heading', { name: 'Which part of the food system do you work in?' }).waitFor();
	await page.evaluate(() => document.fonts.ready);
}

async function boxes(page, ids) {
	return page.evaluate((ids) => {
		return ids.map((id) => {
			const r = document.querySelector(`.svelte-flow__node[data-id="${id}"]`)?.getBoundingClientRect();
			return r ? { id, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) } : { id, missing: true };
		});
	}, ids);
}

// Desktop, light: the questions.
const desk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
watch(desk, 'desktop');
await fresh(desk);
await desk.getByRole('combobox', { name: 'Other role' }).click();
await desk.getByRole('option', { name: 'Researcher' }).waitFor();
await desk.screenshot({ path: `${out}/01a-actor-other.png` });
await desk.getByRole('option', { name: 'Researcher' }).click();
console.log('other chosen', await desk.getByRole('combobox', { name: 'Other role' }).innerText());
await desk.getByRole('button', { name: /^Processing/ }).click();
console.log('other after tile', await desk.getByRole('combobox', { name: 'Other role' }).innerText());
await desk.waitForTimeout(500);
console.log('listbox open', await desk.getByRole('listbox').count());
await desk.screenshot({ path: `${out}/01-actor.png`, fullPage: true });
await desk.getByRole('button', { name: /^Next/ }).click();
await desk.getByRole('textbox', { name: 'Objective of the plan' }).fill('Make the city supply of fresh vegetables less dependent on one region');
await desk.getByRole('button', { name: 'Trade and sourcing' }).click();
await desk.screenshot({ path: `${out}/02-objective.png`, fullPage: true });
await desk.getByRole('button', { name: /^Next/ }).click();
await desk.getByRole('button', { name: /^Availability/ }).click();
await desk.getByRole('button', { name: /^Environmental/ }).click();
await desk.getByRole('button', { name: 'What is Access?' }).hover();
await desk.waitForTimeout(900);
await desk.screenshot({ path: `${out}/03-outcomes.png`, fullPage: true });
await desk.getByRole('button', { name: /^Next/ }).click();
await desk.getByRole('button', { name: /^Transform/ }).click();
await desk.screenshot({ path: `${out}/04-resilience.png`, fullPage: true });
await desk.getByRole('button', { name: /^Open the board/ }).click();
await desk.locator('.svelte-flow__node[data-id="availability"]').waitFor();
await desk.waitForTimeout(600);
await desk.screenshot({ path: `${out}/05-board-overview.png` });
console.log('driver boxes', JSON.stringify(await boxes(desk, ['production_supply', 'distribution_trade', 'consumption_demand'])));
console.log('in scope', await desk.locator('.svelte-flow__node-element .in-scope, .svelte-flow__node-element [data-in-scope="true"]').count());

// An element, a zone, a library card.
await desk.locator('.svelte-flow__node[data-id="availability"]').click();
await desk.waitForTimeout(300);
await desk.screenshot({ path: `${out}/06-element.png` });
await desk.locator('.svelte-flow__node[data-id="zone:drivers"]').click();
await desk.waitForTimeout(300);
await desk.screenshot({ path: `${out}/07-zone.png` });
await desk.getByRole('tab', { name: 'Indicators' }).click();
await desk.getByRole('button', { name: /^Add .* to the board$/ }).first().click();
await desk.waitForTimeout(400);
await desk.screenshot({ path: `${out}/08-card-added.png` });
await desk.getByRole('button', { name: 'Your plan', exact: true }).click();
const add = desk.getByRole('button', { name: /^Add .* to the board$/ });
console.log('recommendation add buttons in view', await add.count());

const [download] = await Promise.all([desk.waitForEvent('download'), desk.getByRole('button', { name: 'PNG' }).click()]);
await download.saveAs(`${out}/09-export.png`);
console.log('png export', download.suggestedFilename());

await desk.getByRole('button', { name: 'Switch to dark mode' }).click();
await desk.waitForTimeout(400);
await desk.screenshot({ path: `${out}/10-board-dark.png` });
await desk.getByRole('button', { name: 'Questions' }).click();
await desk.getByRole('button', { name: /^4 Resilience|Resilience$/ }).click();
await desk.screenshot({ path: `${out}/11-resilience-dark.png`, fullPage: true });
await desk.getByRole('button', { name: 'Back to the board' }).click();

// Reload: the plan comes back from the browser, on the board.
await desk.reload({ waitUntil: 'networkidle' });
await desk.locator('.svelte-flow__node[data-id="availability"]').waitFor();
console.log('after reload: cards on board', await desk.locator('.svelte-flow__node-card').count(), 'objective', await desk.locator('.svelte-flow__node-objective textarea').inputValue());
await desk.close();

// Phone.
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
watch(phone, 'phone');
await fresh(phone);
await phone.screenshot({ path: `${out}/12-phone-actor.png`, fullPage: true });
await phone.getByRole('button', { name: 'Skip the questions' }).click();
await phone.locator('.svelte-flow__node[data-id="availability"]').waitFor();
await phone.waitForTimeout(500);
await phone.screenshot({ path: `${out}/13-phone-board.png` });
await phone.close();

await browser.close();
console.log(errors.length ? errors.join('\n') : 'no page or console errors');
