import adapter from '@sveltejs/adapter-static';
import type { Config } from '@sveltejs/kit';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

const mdsvexPreprocessor = mdsvex({ extensions: ['.md'] });

const config: Config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		vitePreprocess(),
		{
			...mdsvexPreprocessor,
			markup: ({ content, filename }) => mdsvexPreprocessor.markup({ content, filename: filename ?? '' }),
		},
	],
	kit: {
		adapter: adapter({
			pages: 'dist',
			assets: 'dist',
			fallback: 'index.html',
		}),
		prerender: {
			entries: ['*'],
		},
	},
};

export default config;
