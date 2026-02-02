import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
	return {
		server:
			mode === 'development'
				? {
						host: '0.0.0.0',
						proxy: {
							'/api': 'http://localhost:8787',
						},
					}
				: undefined,
		plugins: [sveltekit()],
	};
});
