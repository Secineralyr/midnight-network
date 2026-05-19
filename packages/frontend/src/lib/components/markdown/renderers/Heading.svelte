<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import type { SvelteMarkdownOptions } from '@humanspeak/svelte-markdown';
import type { Snippet } from 'svelte';

/**
 * 見出しレンダラー
 * @description markdown の `#`〜`######` を h1〜h6 として描画
 *              options.headerIds が true なら slug() から id を生成
 */

interface Props {
	depth: number;
	raw: string;
	text: string;
	options: SvelteMarkdownOptions;
	slug: (val: string) => string;
	children?: Snippet;
}

const { depth, raw, text, options, slug, children }: Props = $props();

const id = $derived(options.headerIds ? `${options.headerPrefix ?? ''}${slug(text)}` : undefined);
</script>

{#if depth === 1}
	<h1 class="md-h1" {id}>{@render children?.()}</h1>
{:else if depth === 2}
	<h2 class="md-h2" {id}>{@render children?.()}</h2>
{:else if depth === 3}
	<h3 class="md-h3" {id}>{@render children?.()}</h3>
{:else if depth === 4}
	<h4 class="md-h4" {id}>{@render children?.()}</h4>
{:else if depth === 5}
	<h5 class="md-h5" {id}>{@render children?.()}</h5>
{:else if depth === 6}
	<h6 class="md-h6" {id}>{@render children?.()}</h6>
{:else}
	{raw}
{/if}

<style>
	.md-h1,
	.md-h2,
	.md-h3,
	.md-h4,
	.md-h5,
	.md-h6 {
		font-family: 'M PLUS 2', sans-serif;
		color: #fff;
		font-weight: 600;
		line-height: 1.3;
	}

	.md-h1 {
		font-size: 2rem;
		margin: 1.6em 0 0.6em;
		padding-bottom: 0.3em;
		border-bottom: 1px solid #35325a;
	}

	.md-h2 {
		font-size: 1.6rem;
		margin: 1.4em 0 0.5em;
		padding-bottom: 0.25em;
		border-bottom: 1px solid #35325a;
	}

	.md-h3 {
		font-size: 1.3rem;
		margin: 1.2em 0 0.4em;
	}

	.md-h4 {
		font-size: 1.15rem;
		margin: 1.1em 0 0.4em;
	}

	.md-h5 {
		font-size: 1rem;
		margin: 1em 0 0.3em;
	}

	.md-h6 {
		font-size: 0.9rem;
		margin: 1em 0 0.3em;
		color: #ddd;
	}
</style>
