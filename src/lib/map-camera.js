/**
 * Camera helpers shared by the maps: the view that frames the ticked study
 * countries, and moving a map to a view (the country filters, "Clear all" and
 * the map's fit button all go through here).
 */
import { mount, unmount } from 'svelte';
import MapFitButton from '$lib/components/MapFitButton.svelte';
import { COUNTRY_OPTIONS, countriesBounds } from '$lib/domain-options.js';
import { STUDY_AREA_VIEW } from '$lib/map-config.js';

/**
 * The view framing the ticked countries: one box around a subset, or the whole
 * study area when all of them, or none, are ticked.
 */
export function countriesView(values) {
	const bounds = values.length < COUNTRY_OPTIONS.length ? countriesBounds(values) : null;
	return bounds ? { ...STUDY_AREA_VIEW, bounds } : STUDY_AREA_VIEW;
}

/** Move the camera to a view: bounds are fitted to the map's current size, else centre and zoom. */
export function showView(map, view, duration = 900) {
	if (view.bounds) {
		map.fitBounds(view.bounds, { ...(view.fitBoundsOptions ?? { padding: 20 }), duration });
	} else {
		map.flyTo({ center: view.center, zoom: view.zoom, duration, essential: true });
	}
}

/**
 * Add a button under the zoom buttons that returns the camera to `getView()`,
 * for when someone drags or zooms the map without meaning to. Both arguments
 * are functions, read when needed, so the target follows the page's selection.
 * MapLibre accepts any object with onAdd/onRemove as a control; like its own
 * controls, this one removes its container on removal.
 */
export function addFitControl(map, { getView, getLabel }) {
	const container = document.createElement('div');
	container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
	let button = null;
	map.addControl(
		{
			onAdd: () => {
				button = mount(MapFitButton, {
					target: container,
					props: { getLabel, onfit: () => showView(map, getView()) }
				});
				return container;
			},
			onRemove: () => {
				if (button) unmount(button);
				container.remove();
			}
		},
		'top-left'
	);
}
