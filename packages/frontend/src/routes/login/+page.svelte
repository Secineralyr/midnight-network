<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import { startMisskeyLogin } from '$lib/auth/login';

let errorMessage = $state('');
let hasStarted = false;

/**
 * ログイン処理を1度だけ実行する。
 */
function triggerLogin(): void {
	if (hasStarted) {
		return;
	}
	hasStarted = true;
	startMisskeyLogin(window.location.origin).catch((error) => {
		errorMessage = error instanceof Error ? error.message : 'ログインに失敗しました。';
	});
}

if (typeof window !== 'undefined') {
	triggerLogin();
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
