<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import SvelteMarkdown from '@humanspeak/svelte-markdown';
import { markedKatex } from '@humanspeak/svelte-markdown/extensions';
import 'katex/dist/katex.min.css';
import { renderers } from './renderers';

/**
 * Markdown 描画コンポーネント
 * @description source として渡された markdown 文字列を SvelteMarkdown でパースし、
 *              独自スタイル付きの renderers + markedKatex 拡張で描画する
 *              ページ側でタイトル等を <svelte:head> で別途定義する想定のため、
 *              本コンポーネントは本文ブロックのみを担う
 */

interface Props {
	source: string;
}

const { source }: Props = $props();

const extensions = [markedKatex()];
</script>

<div class="markdown-body">
	<SvelteMarkdown {source} {renderers} {extensions} />
</div>

<style>
	.markdown-body {
		color: #fff;
		line-height: 1.7;
		word-wrap: break-word;
	}

	/* KaTeX が生成する .katex-display は子コンポーネント外の DOM として出力されるため、
	   :global 経由で横スクロール対応する (画面幅を超える数式に必要) */
	.markdown-body :global(.katex-display) {
		overflow-x: auto;
		overflow-y: hidden;
		padding: 6px 0;
		margin: 1em 0;
	}

	/* KaTeX のインライン数式 (.katex) はフォントサイズを本文に揃える。
	   ライブラリ既定 CSS が 1.21em を強制するため :global で打ち消す必要がある */
	.markdown-body :global(.katex) {
		font-size: 1.5em;
	}

	/* モバイル表示 */
	@media (max-width: 899px) {
		.markdown-body :global(.katex) {
			font-size: 1.2em;
		}
	}
</style>
