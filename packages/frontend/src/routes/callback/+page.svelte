<script lang="ts">
import { redirectToHome } from '$lib/auth/navigation';

let hasStarted = false;

/**
 * コールバック処理後にホームへ遷移する。
 */
function triggerCallbackRedirect(): void {
	if (hasStarted) {
		return;
	}
	hasStarted = true;
	redirectToHome(window.location.origin);
}

if (typeof window !== 'undefined') {
	triggerCallbackRedirect();
}
</script>

<div></div>

<style>
div {
	height: 500px;
}
</style>
