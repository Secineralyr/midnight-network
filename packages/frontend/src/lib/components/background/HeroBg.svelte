<script lang="ts">
import type { Container, Engine, ILoadParams } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { onMount } from 'svelte';
import { page } from '$app/state';

/**
 * ヒーロー背景コンポーネント
 * @description tsparticlesを使用したネットワークパーティクル背景
 */

let containerElement: HTMLDivElement | undefined = $state();
let particlesContainer: Container | undefined = $state();

/**
 * パーティクルの設定オプション
 */
const particlesOptions: ILoadParams['options'] = {
	background: {
		color: {
			value: 'transparent',
		},
	},
	fpsLimit: 60,
	particles: {
		number: {
			value: 80,
			density: {
				enable: true,
				width: 800,
				height: 1000,
			},
		},
		color: { value: '#337be3' },

		// v3: shape.stroke は廃止 → particles.stroke
		stroke: { width: 0, color: { value: '#000000' } },

		shape: {
			type: 'circle',
			// v3: image/polygon は shape.options 側（破壊的変更）
			options: {
				polygon: { sides: 5 },
			},
		},

		opacity: {
			value: 0.5,
			animation: { enable: false, speed: 1, sync: false },
		},

		// particles.js の size.random: true は v3 だと value を range にするのが安全
		size: {
			value: { min: 0.1, max: 5 },
			animation: { enable: false, speed: 218.1818181818182, sync: false },
		},

		links: {
			enable: true,
			distance: 200,
			color: '#7e7ef7',
			opacity: 0.4,
			width: 1,
		},

		move: {
			enable: true,
			speed: 1,
			direction: 'none',
			random: false,
			straight: false,
			outModes: { default: 'out' },
			attract: {
				enable: false,
				rotate: { x: 600, y: 1200 },
			},
		},
	},

	interactivity: {
		detectsOn: 'canvas',
		events: {
			onHover: { enable: false, mode: 'repulse' },
			onClick: { enable: false, mode: 'push' },

			// v3: boolean ではなく object
			resize: { enable: true, delay: 0 },
		},
		modes: {
			grab: { distance: 400, links: { opacity: 1 } },
			bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
			repulse: { distance: 200, duration: 0.4 },
			push: { quantity: 4 },
			remove: { quantity: 2 },
		},
	},
	detectRetina: true,
	style: {
		height: '850px',
	},
};

onMount(() => {
	let engine: Engine | undefined;

	async function initParticles(): Promise<void> {
		if (!containerElement) {
			return;
		}

		const { tsParticles } = await import('@tsparticles/engine');
		engine = tsParticles;

		await loadSlim(engine);

		particlesContainer = await engine.load({
			id: 'hero-particles',
			element: containerElement,
			options: particlesOptions,
		});
	}

	initParticles();

	return () => {
		if (particlesContainer) {
			particlesContainer.destroy();
		}
	};
});
</script>

<div class={{ 'hero-bg': true, 'is-home': page.url.pathname === '/' }}>
	<div bind:this={containerElement}></div>
</div>

<style>
	.hero-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: -1;
		overflow: hidden;
		width: 100%;
		mask-image: linear-gradient(to bottom, black 0%, black 80%, transparent 90%);
		transition: height 0.2s ease-in-out;
	}

	.is-home {
		height: 850px;
	}

	.hero-bg:not(.is-home) {
		height: 350px;
	}
</style>
