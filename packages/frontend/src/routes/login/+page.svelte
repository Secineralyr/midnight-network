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

<main>
	{#if errorMessage}
		<p>{errorMessage}</p>
	{/if}
</main>
