/**
 * Fetch JSON once per URL. Requests are cached as promises, so a second caller
 * asking for the same file while it is in flight shares the request.
 */
const cache = new Map();

export function fetchJson(url) {
	if (cache.has(url)) return cache.get(url);
	const request = fetch(url).then((response) => {
		if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
		return response.json();
	});
	cache.set(url, request);
	return request;
}
