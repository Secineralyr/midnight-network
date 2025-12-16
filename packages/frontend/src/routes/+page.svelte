<script lang="ts">
import { IconMoonStars } from '@tabler/icons-svelte';
import { animate } from 'motion';
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';

import { orpc } from '$lib/orpc';

let ping = '...';

onMount(async () => {
	animate('h1', { opacity: [0, 1], y: [8, 0] }, { duration: 0.35 });

	try {
		ping = await orpc.ping();
	} catch (error) {
		ping = String(error);
	}

	await import('particles.js');
	type ParticlesJS = (tagId: string, params: unknown) => void;
	const particlesJS = (window as unknown as { particlesJS?: ParticlesJS }).particlesJS;
	particlesJS?.('particles', {
		particles: {
			number: { value: 48 },
			size: { value: 2 },
			move: { enable: true, speed: 0.6 },
			line_linked: { enable: true, opacity: 0.2 },
		},
	});
});
</script>

<div id="particles" class="particles"></div>

<main class="container" in:fade={{ duration: 300, delay: 150 }} out:fade={{ duration: 150 }}>
  <h1 class="title">
    <IconMoonStars size={28} />
    midnight-network
  </h1>

  <p class="subtitle">oRPC ping: {ping}</p>
</main>

<style>
  .particles {
    position: fixed;
    inset: 0;
    z-index: -1;
    background: radial-gradient(1200px 600px at 20% 0%, #1b2b44, transparent),
      radial-gradient(1200px 600px at 80% 0%, #2a1d3f, transparent),
      #0b1020;
  }

  .container {
    padding: 56px 20px;
    max-width: 960px;
    margin: 0 auto;
    color: #e8eefc;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell,
      Noto Sans, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
  }

  .title {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.2px;
    margin: 0 0 10px;
  }

  .subtitle {
    margin: 0;
    opacity: 0.9;
  }
</style>
