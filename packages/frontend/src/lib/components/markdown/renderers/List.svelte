<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import type { Snippet } from 'svelte';

/**
 * リストレンダラー
 * @description ordered=true なら <ol>、それ以外は <ul> として描画
 *              global.css の `ul, ol { list-style: none }` リセットを
 *              クラス付きセレクタで打ち消し、markdown の表示を復活させる
 */

interface Props {
	ordered?: boolean;
	start?: number;
	children?: Snippet;
}

const { ordered = false, start = 1, children }: Props = $props();
</script>

{#if ordered}
	<ol class="md-list md-list-ordered" {start}>{@render children?.()}</ol>
{:else}
	<ul class="md-list md-list-unordered">{@render children?.()}</ul>
{/if}

<style>
	.md-list {
		margin: 0.5em 0;
		padding-left: 1.6em;
		line-height: 1.7;
	}

	.md-list-ordered {
		list-style: decimal;
	}

	.md-list-unordered {
		list-style: disc;
	}

	/* ネストしたリストはライブラリが children snippet 越しに別コンポーネントで描画するため
	   Svelte の scope 静的解析では対応関係を確証できない。:global で内側 .md-list に余白を与える */
	.md-list :global(.md-list) {
		margin: 0.2em 0;
	}
</style>
