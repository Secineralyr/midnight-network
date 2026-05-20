<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import type { Snippet } from 'svelte';

/**
 * 引用レンダラー
 * @description markdown の `>` を <blockquote> として描画
 */

interface Props {
	children?: Snippet;
}

const { children }: Props = $props();
</script>

<blockquote class="md-blockquote">{@render children?.()}</blockquote>

<style>
	.md-blockquote {
		margin: 1em 0;
		padding: 8px 16px;
		border-left: 3px solid #b8c4ff;
		background: #201e3a;
		color: #ddd;
		border-radius: 0 4px 4px 0;
	}
</style>
