<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import type { Snippet } from 'svelte';

/**
 * テーブルセル (th/td) レンダラー
 * @description header=true なら th、それ以外は td として描画
 *              align が指定されていれば inline style で text-align を反映
 */

interface Props {
	header: boolean;
	align: 'left' | 'center' | 'right' | null;
	children?: Snippet;
}

const { header, align, children }: Props = $props();

const style = $derived(align ? `text-align: ${align}` : undefined);
</script>

{#if header}
	<th class="md-th" {style}>{@render children?.()}</th>
{:else}
	<td class="md-td" {style}>{@render children?.()}</td>
{/if}

<style>
	.md-th,
	.md-td {
		padding: 8px 12px;
		text-align: left;
	}

	.md-th {
		color: #fff;
		font-weight: 600;
		font-family: 'M PLUS 2', sans-serif;
	}

	.md-td {
		color: #fff;
	}
</style>
