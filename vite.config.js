import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	build: {
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
