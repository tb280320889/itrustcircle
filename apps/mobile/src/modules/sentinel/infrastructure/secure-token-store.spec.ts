import { describe, expect, it, vi } from 'vitest';
import {
	setSecureStorageBridge,
	resetSecureStorageBridge,
	type SecureStorageBridge
} from '../../shared/security/secure-storage-bridge';
import {
	AUTH_TOKEN_STORAGE_KEY,
	SecureTokenStoreError
} from '../../shared/security/secure-token-store';
import { createSentinelSecureTokenStore } from './secure-token-store';

describe('sentinel secure token store', () => {
	it('writes and reads tokens through the bridge', async () => {
		const mockBridge: SecureStorageBridge = {
			isAvailable: vi.fn(async () => true),
			getToken: vi.fn(async () => 'stored-token'),
			setToken: vi.fn(async () => undefined),
			deleteToken: vi.fn(async () => undefined)
		};
		setSecureStorageBridge(mockBridge);

		const store = createSentinelSecureTokenStore();
		await store.setToken('stored-token');
		const token = await store.getToken();

		expect(token).toBe('stored-token');
		expect(mockBridge.setToken).toHaveBeenCalledWith(AUTH_TOKEN_STORAGE_KEY, 'stored-token');
		expect(mockBridge.getToken).toHaveBeenCalledWith(AUTH_TOKEN_STORAGE_KEY);

		resetSecureStorageBridge();
	});

	it('throws diagnosable errors when storage is unavailable', async () => {
		const mockBridge: SecureStorageBridge = {
			isAvailable: vi.fn(async () => false),
			getToken: vi.fn(async () => null),
			setToken: vi.fn(async () => undefined),
			deleteToken: vi.fn(async () => undefined)
		};
		setSecureStorageBridge(mockBridge);
		const store = createSentinelSecureTokenStore();

		await expect(store.setToken('token')).rejects.toMatchObject({
			code: 'UNAVAILABLE'
		});

		resetSecureStorageBridge();
	});
});
