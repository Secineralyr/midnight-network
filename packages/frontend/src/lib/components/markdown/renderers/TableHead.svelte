<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import type { Snippet } from 'svelte';

/**
 * テーブルヘッダ (thead) レンダラー
 */

interface Props {
	children?: Snippet;
}

const { children }: Props = $props();
</script>

<thead class="md-thead">{@render children?.()}</thead>

<style>
	.md-thead {
		background: #35325a;
	}
</style>
