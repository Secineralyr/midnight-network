<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import NormalPageTop from '$lib/components/layout/NormalPageTop.svelte';
import Markdown from '$lib/components/markdown/Markdown.svelte';

interface Props {
	title: string;
	source: string;
}

const { title, source }: Props = $props();
</script>

<svelte:head>
	<title>{title} - MidNight Network</title>
</svelte:head>

<NormalPageTop>{title}</NormalPageTop>

<div class="spacer">
	<Markdown {source} />
</div>

<style>
	.spacer {
		padding-top: 20px;
	}

	/* モバイル表示 */
	@media (max-width: 899px) {
		.spacer {
			padding-top: unset;
		}
	}
</style>
