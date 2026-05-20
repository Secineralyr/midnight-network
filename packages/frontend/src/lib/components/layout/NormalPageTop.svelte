<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
	children?: Snippet;
}

const { children }: Props = $props();
</script>

<div class="page-hero">
	<h1 class="page-title">{@render children?.()}</h1>
</div>

<style>
	.page-hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px;
		text-align: center;
		margin-bottom: 80px;
		margin-top: 80px;
	}

	.page-title {
		font-family: 'Lexend', sans-serif;
		font-size: 2.25rem;
		font-weight: 700;
		color: #ffffff;
	}

	/* モバイル表示 */
	@media (max-width: 899px) {
		.page-hero {
			margin-top: 40px;
			margin-bottom: 30px;
			padding: 15px;
		}
		.page-title {
			font-size: 1.75rem;
		}
	}
</style>
