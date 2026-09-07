import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	// Class fields must not be down-levelled. esbuild rewrites them into a
	// `__publicField` helper that it injects into the main bundle but not into web
	// workers, so MapLibre's GeoJSON worker dies on "__publicField is not defined"
	// and every GeoJSON source silently yields zero tiles while vector tiles, which
	// avoid that code path, keep working. es2022 has native class fields.
	esbuild: { target: 'es2022' },
	optimizeDeps: { esbuildOptions: { target: 'es2022' } },
	build: {
		target: 'es2022',
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (!id.includes('node_modules')) return;
					if (id.includes('maplibre-gl') || id.includes('pmtiles')) return 'map-vendor';
					if (id.includes('bits-ui') || id.includes('@floating-ui') || id.includes('svelte-toolbelt')) {
						return 'ui-vendor';
					}
				}
			}
		}
	},
	plugins: [tailwindcss(), sveltekit()]
});
