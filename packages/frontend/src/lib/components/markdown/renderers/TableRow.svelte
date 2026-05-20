<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import type { Snippet } from 'svelte';

/**
 * テーブル行 (tr) レンダラー
 * @description ボディ内の偶数行は薄く zebra にしてスキャナビリティを上げる
 */

interface Props {
	children?: Snippet;
}

const { children }: Props = $props();
</script>

<tr class="md-tr">{@render children?.()}</tr>

<style>
	.md-tr {
		border-bottom: 1px solid #3d477a;
	}

	.md-tr:last-child {
		border-bottom: none;
	}
</style>
