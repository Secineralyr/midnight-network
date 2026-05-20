<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import type { Snippet } from 'svelte';

/**
 * リンクレンダラー
 * @description markdown の `[text](url "title")` を <a> として描画
 *              外部リンク (http/https/protocol-relative) は新規タブで開き noopener を付与
 */

interface Props {
	href?: string;
	title?: string;
	children?: Snippet;
}

const { href, title, children }: Props = $props();

const EXTERNAL_URL_RE = /^(?:https?:)?\/\//;
const isExternal = $derived(typeof href === 'string' && EXTERNAL_URL_RE.test(href));
</script>

{#if isExternal}
	<a class="md-link" {href} {title} target="_blank" rel="noopener noreferrer">{@render children?.()}</a>
{:else}
	<a class="md-link" {href} {title}>{@render children?.()}</a>
{/if}

<style>
	.md-link {
		color: #e2e7ff;
		text-decoration: underline;
		text-underline-offset: 2px;
		text-decoration-color: #6970cf;
		transition: color 150ms ease, text-decoration-color 150ms ease;
	}

	.md-link:hover {
		color: #fff;
		text-decoration-color: #b8c4ff;
	}
</style>
