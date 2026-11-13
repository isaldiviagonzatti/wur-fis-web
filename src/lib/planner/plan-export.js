/**
 * Exports of a plan: the plan file (to reopen later or share), a CSV of what
 * the plan analyses, sorted by food-system element, and a PNG of the board.
 */
import { getViewportForBounds } from '@xyflow/svelte';
import interLatinUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import { KIND_LABELS, papersFor } from './planner-data.js';

const PNG_WIDTH = 2400;
const EXAMPLE_PAPERS = 3;

export function planFilename(title, extension) {
	const slug = (title || 'foodshed-plan')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return `${slug || 'foodshed-plan'}.${extension}`;
}

function downloadUrl(url, filename) {
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.append(link);
	link.click();
	link.remove();
}

function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	downloadUrl(url, filename);
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadPlanFile(plan) {
	const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
	downloadBlob(blob, planFilename(plan.title, 'json'));
}

export async function readPlanFile(file) {
	try {
		return JSON.parse(await file.text());
	} catch {
		throw new Error('This file could not be read as a plan.');
	}
}

const CSV_COLUMNS = [
	['zone', 'Zone'],
	['element', 'Food-system element'],
	['in_scope', 'In scope'],
	['type', 'Type'],
	['item', 'Item'],
	['group', 'Group'],
	['description', 'Description'],
	['note', 'Your note'],
	['papers', 'Papers in review'],
	['example_papers', 'Example papers'],
	['sources', 'Example data sources']
];

function csvCell(value) {
	const text = String(value ?? '');
	return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function itemColumns(content, node) {
	if (node.type === 'note') return { type: 'Note', item: node.data.text };
	const card = content.cardsById.get(node.data.ref);
	const examples = papersFor(content, card.papers)
		.slice(0, EXAMPLE_PAPERS)
		.map((paper) => (paper.doi ? `https://doi.org/${paper.doi}` : paper.title));
	return {
		type: KIND_LABELS[card.kind],
		item: card.label,
		group: card.group,
		description: card.description,
		note: node.data.note,
		papers: card.papers.length,
		example_papers: examples.join(' | '),
		sources: card.sources.map((s) => (s.url ? `${s.name} (${s.url})` : s.name)).join(' | ')
	};
}

/**
 * One row per element-item link, ordered as the board reads: drivers,
 * activities, outcomes, resilience. Elements in scope without items still get
 * a row, and items not linked to any element come last.
 */
export function planCsvRows(content, nodes, edges) {
	const byId = new Map(nodes.map((node) => [node.id, node]));
	const linked = new Set(edges.map((edge) => edge.source));
	const rows = [];
	for (const element of content.elements) {
		const node = byId.get(element.id);
		const base = {
			zone: content.zonesById.get(element.zone)?.label,
			element: element.label,
			in_scope: node?.data.inScope ? 'yes' : 'no'
		};
		const links = edges.filter((edge) => edge.target === element.id && byId.has(edge.source));
		for (const edge of links) rows.push({ ...base, ...itemColumns(content, byId.get(edge.source)) });
		if (!links.length && node?.data.inScope) rows.push(base);
	}
	for (const node of nodes) {
		if ((node.type === 'card' || node.type === 'note') && !linked.has(node.id)) {
			rows.push({ element: 'Not linked to an element', in_scope: '', ...itemColumns(content, node) });
		}
	}
	return rows;
}

export function downloadPlanCsv(content, { title, nodes, edges }) {
	const rows = planCsvRows(content, nodes, edges);
	const lines = [
		CSV_COLUMNS.map(([, header]) => csvCell(header)).join(','),
		...rows.map((row) => CSV_COLUMNS.map(([key]) => csvCell(row[key])).join(','))
	];
	// The byte-order mark makes Excel read the file as UTF-8.
	const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
	downloadBlob(blob, planFilename(title, 'csv'));
}

function union(a, b) {
	const x = Math.min(a.x, b.x);
	const y = Math.min(a.y, b.y);
	return {
		x,
		y,
		width: Math.max(a.x + a.width, b.x + b.width) - x,
		height: Math.max(a.y + a.height, b.y + b.height) - y
	};
}

let fontCss = null;

function asDataUrl(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

/**
 * The site's Inter font as CSS with its Latin file inlined, so the image keeps
 * the site's font. It is the self-hosted variable file the page already uses,
 * all weights in one 48 KB file and usually cached by now. Empty if it cannot be
 * fetched, so the export still works, in a fallback font.
 */
async function interFontCss() {
	if (fontCss !== null) return fontCss;
	try {
		const data = await asDataUrl(await (await fetch(interLatinUrl)).blob());
		fontCss = `@font-face { font-family: 'Inter Variable'; font-style: normal; font-weight: 100 900; src: url(${data}) format('woff2'); }`;
	} catch {
		fontCss = '';
	}
	return fontCss;
}

/**
 * Render the whole board, diagram and every card, to a PNG. The viewport
 * element is drawn at a transform that frames `bounds` instead of what is on
 * screen, the approach of Svelte Flow's image-download example.
 */
export async function downloadBoardPng({ viewportElement, boardBounds, nodesBounds, title }) {
	const { toPng } = await import('html-to-image');
	const bounds = nodesBounds.width ? union(boardBounds, nodesBounds) : boardBounds;
	const width = PNG_WIDTH;
	const height = Math.round((PNG_WIDTH * bounds.height) / bounds.width);
	const viewport = getViewportForBounds(bounds, width, height, 0.05, 4, 0.03);
	const fontEmbedCSS = await interFontCss();
	const dataUrl = await toPng(viewportElement, {
		backgroundColor: getComputedStyle(document.body).backgroundColor,
		width,
		height,
		...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
		style: {
			width: `${width}px`,
			height: `${height}px`,
			transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
		}
	});
	downloadUrl(dataUrl, planFilename(title, 'png'));
}
