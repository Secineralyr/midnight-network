import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'MidNight Network',
				short_name: 'MidNight',
				description: 'Daily post time competition statistics tool',
				theme_color: '#1c1724',
				background_color: '#1c1724',
				display: 'standalone',
				icons: [
					{
						src: 'logo-192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'logo-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
			},
			devOptions: {
				enabled: false,
			},
			kit: {
				adapterFallback: 'index.html',
			},
		}),
	],
});
