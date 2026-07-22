import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-vercel';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter({
			runtime: 'nodejs22.x'
		})
	},

	preprocess: [
		mdsvex({
			extensions: ['.svx'],
			smartypants: true,
			layout: join(dirname(fileURLToPath(import.meta.url)), './src/lib/prose.svelte')
		})
	],
	extensions: ['.svelte', '.svx']
};

export default config;
