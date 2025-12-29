<script lang="ts">
import type { Container, Engine } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { onMount } from 'svelte';

/**
 * ヒーロー背景コンポーネント
 * @description tsparticlesを使用したネットワークパーティクル背景
 */

let containerElement: HTMLDivElement | undefined = $state();
let particlesContainer: Container | undefined = $state();

/**
 * パーティクルの設定オプション
 */
const particlesOptions = {
	background: {
		color: {
			value: 'transparent',
		},
	},
	fpsLimit: 60,
	particles: {
		color: {
			value: '#6b8cff',
		},
		links: {
			color: '#6b8cff',
			distance: 150,
			enable: true,
			opacity: 0.3,
			width: 1,
		},
		move: {
			enable: true,
			speed: 0.5,
			direction: 'none' as const,
			random: true,
			straight: false,
			outModes: {
				default: 'bounce' as const,
			},
		},
		number: {
			density: {
				enable: true,
				area: 800,
			},
			value: 80,
		},
		opacity: {
			value: 0.5,
		},
		shape: {
			type: 'circle',
		},
		size: {
			value: { min: 1, max: 3 },
		},
	},
	detectRetina: true,
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

<div class="hero-bg">
	<div class="hero-bg__particles" bind:this={containerElement}></div>
	<div class="hero-bg__gradient"></div>
</div>

<style>
	.hero-bg {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: -1;
		overflow: hidden;
	}

	.hero-bg__particles {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}

	.hero-bg__gradient {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(
			ellipse at 50% 0%,
			transparent 0%,
			var(--color-bg-primary) 70%
		);
		pointer-events: none;
	}
</style>
