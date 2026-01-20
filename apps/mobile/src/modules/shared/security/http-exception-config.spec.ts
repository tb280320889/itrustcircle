import { describe, expect, it } from 'vitest';
import {
	createHttpExceptionConfigStore,
	DEFAULT_HTTP_EXCEPTION_CONFIG
} from './http-exception-config';

function createMemoryStorage() {
	const store = new Map<string, string>();
	return {
		getItem(key: string) {
			return store.get(key) ?? null;
		},
		setItem(key: string, value: string) {
			store.set(key, value);
		},
		removeItem(key: string) {
			store.delete(key);
		}
	};
}

describe('http exception config store', () => {
	it('returns default config when empty', async () => {
		const storage = createMemoryStorage();
		const store = createHttpExceptionConfigStore(storage);

		await expect(store.getConfig()).resolves.toEqual(DEFAULT_HTTP_EXCEPTION_CONFIG);
	});

	it('persists enabled and confirmedAt', async () => {
		const storage = createMemoryStorage();
		const store = createHttpExceptionConfigStore(storage);

		await store.setConfig({ enabled: true, confirmedAt: 1700000000000 });

		await expect(store.getConfig()).resolves.toEqual({
			enabled: true,
			confirmedAt: 1700000000000
		});
	});
});
