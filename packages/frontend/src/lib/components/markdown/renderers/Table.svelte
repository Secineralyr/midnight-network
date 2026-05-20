<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import type { Snippet } from 'svelte';

/**
 * テーブルレンダラー
 * @description markdown のテーブルを <table> として描画
 *              横幅が広い場合に備えてラッパー側で横スクロール可能にする
 */

interface Props {
	children?: Snippet;
}

const { children }: Props = $props();
</script>

<div class="md-table-wrap">
	<table class="md-table">{@render children?.()}</table>
</div>

<style>
	.md-table-wrap {
		margin: 1em 0;
		overflow-x: auto;
		border-radius: 4px;
		border: 2px solid #1c1724;
	}

	.md-table {
		width: 100%;
		border-collapse: collapse;
		background: #201e3a;
		font-size: 0.95em;
	}
</style>
