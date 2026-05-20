<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import type { Snippet } from 'svelte';

/**
 * 段落レンダラー
 * @description markdown の段落を <p> として描画
 */

interface Props {
	children?: Snippet;
}

const { children }: Props = $props();
</script>

<p class="md-paragraph">{@render children?.()}</p>

<style>
	.md-paragraph {
		margin: 0.75em 0;
		line-height: 1.7;
		color: #fff;
	}
</style>
