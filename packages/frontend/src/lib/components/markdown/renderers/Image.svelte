<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
/**
 * 画像レンダラー
 * @description markdown の `![alt](src "title")` を figure + img として描画
 *              title が存在すれば figcaption も描画
 *              loading="lazy" でブラウザネイティブの遅延読み込みを使用
 */

interface Props {
	href?: string;
	title?: string;
	text?: string;
}

const { href, title, text = '' }: Props = $props();
</script>

<figure class="md-figure">
	<img class="md-image" src={href} alt={text} {title} loading="lazy" />
	{#if title}
		<figcaption class="md-figcaption">{title}</figcaption>
	{/if}
</figure>

<style>
	.md-figure {
		margin: 1em 0;
		text-align: center;
	}

	.md-image {
		max-width: 100%;
		height: auto;
		border-radius: 4px;
		display: inline-block;
	}

	.md-figcaption {
		font-size: 0.85em;
		color: #6b6f7e;
		margin-top: 6px;
	}
</style>
