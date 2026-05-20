<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
/**
 * インラインコードレンダラー
 * @description markdown の `` `code` `` を <code> として描画
 *              raw から囲みのバックティックのみを取り除く (上書きされる前段の挙動と同等)
 */

interface Props {
	raw: string;
}

const { raw }: Props = $props();

const BACKTICK_RE = /`/g;
const text = $derived(raw.replace(BACKTICK_RE, ''));
</script>

<code class="md-codespan">{text}</code>

<style>
	.md-codespan {
		padding: 2px 6px;
		background: #2f2d53;
		border-radius: 3px;
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.9em;
		color: #fff;
	}
</style>
