import { derived, writable } from 'svelte/store';

const userSettingsOpenedWritable = writable<boolean>(false);

export const userSettingsOpened = derived(userSettingsOpenedWritable, (state) => state);

export function setUserSettingsOpened(state: boolean): void {
	userSettingsOpenedWritable.set(state);
}
