/**
 * ホームへ遷移する。
 */
export function redirectToHome(origin: string): void {
	const url = new URL('/', origin).toString();
	window.location.assign(url);
}
