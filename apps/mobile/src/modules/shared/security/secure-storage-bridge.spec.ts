import { describe, expect, it } from 'vitest';
import {
	getSecureStorageBridge,
	resetSecureStorageBridge,
	setSecureStorageBridge,
	type SecureStorageBridge
} from './secure-storage-bridge';

describe('secure storage bridge', () => {
	it('allows overriding and resetting the bridge', async () => {
		const mockBridge: SecureStorageBridge = {
			async isAvailable() {
				return true;
			},
			async getToken() {
				return 'token';
			},
			async setToken() {},
			async deleteToken() {}
		};

		setSecureStorageBridge(mockBridge);
		expect(await getSecureStorageBridge().isAvailable()).toBe(true);

		resetSecureStorageBridge();
		expect(getSecureStorageBridge()).not.toBe(mockBridge);
	});
});
