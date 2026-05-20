<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
/**
 * コードブロックレンダラー
 * @description フェンス付きコードブロックを <pre><code> として描画
 *              言語識別子は `lang-{lang}` の class として保持し、後段の syntax highlight 拡張用に開放
 */

interface Props {
	lang: string;
	text: string;
}

const { lang, text }: Props = $props();

const langClass = $derived(lang ? `lang-${lang}` : undefined);
</script>

<pre class={['md-code-block', langClass]}><code>{text}</code></pre>

<style>
	.md-code-block {
		margin: 1em 0;
		padding: 12px 14px;
		background: #201e3a;
		border: 1px solid #35325a;
		border-radius: 4px;
		overflow-x: auto;
		font-family: 'M PLUS 2', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.9em;
		line-height: 1.5;
		color: #fff;
	}

	.md-code-block code {
		font-family: inherit;
		color: inherit;
		background: none;
	}
</style>
