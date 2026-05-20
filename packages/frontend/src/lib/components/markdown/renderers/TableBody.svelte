<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import type { Snippet } from 'svelte';

/**
 * テーブルボディ (tbody) レンダラー
 */

interface Props {
	children?: Snippet;
}

const { children }: Props = $props();
</script>

<tbody class="md-tbody">{@render children?.()}</tbody>

<style>
	.md-tbody {
		color: #fff;
	}
</style>
