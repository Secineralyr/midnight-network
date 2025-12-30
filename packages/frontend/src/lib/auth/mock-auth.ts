import { browser } from '$app/environment';

export type MockUser = {
	userId: string;
	username: string;
	avatarUrl?: string;
};

const MOCK_USER: MockUser = {
	userId: 'local-user',
	username: 'local',
};

const LOCAL_STORAGE_KEY = 'mn:mock-auth';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '']);

function isLocalHost(hostname: string): boolean {
	return LOCAL_HOSTNAMES.has(hostname);
}

export function isMockAuthEnabled(): boolean {
	const envValue = import.meta.env.VITE_MOCK_AUTH;
	if (envValue === 'true') {
		return true;
	}
	if (envValue === 'false') {
		return false;
	}

	if (!browser) {
		return import.meta.env.DEV;
	}

	return import.meta.env.DEV || isLocalHost(window.location.hostname);
}

export function getMockUser(): MockUser | null {
	if (!(browser && isMockAuthEnabled())) {
		return null;
	}

	const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
	if (stored === '0') {
		return null;
	}

	return MOCK_USER;
}

export function setMockLoggedIn(isLoggedIn: boolean): void {
	if (!(browser && isMockAuthEnabled())) {
		return;
	}

	window.localStorage.setItem(LOCAL_STORAGE_KEY, isLoggedIn ? '1' : '0');
}
