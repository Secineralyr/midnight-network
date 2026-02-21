<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import { startLogout } from '$lib/auth/logout';

let errorMessage = $state('');
let hasStarted = false;

/**
 * ログアウト処理を1度だけ実行する。
 */
function triggerLogout(): void {
	if (hasStarted) {
		return;
	}
	hasStarted = true;
	startLogout(window.location.origin).catch((error) => {
		errorMessage = error instanceof Error ? error.message : 'ログアウトに失敗しました。';
	});
}

if (typeof window !== 'undefined') {
	triggerLogout();
}
</script>

<div>
	{#if errorMessage}
		<p>{errorMessage}</p>
	{/if}
</div>

<style>
div {
	height: 500px;
}
</style>
