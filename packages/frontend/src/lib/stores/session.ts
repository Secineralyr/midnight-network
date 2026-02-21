// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { User } from 'better-auth';
import { derived, writable } from 'svelte/store';

type SessionState = {
	user: User | null;
	ready: boolean;
};

const sessionState = writable<SessionState>({ user: null, ready: false });

export const sessionUser = derived(sessionState, (state) => state.user);
export const sessionReady = derived(sessionState, (state) => state.ready);

export function setSessionState(state: SessionState): void {
	sessionState.set(state);
}
