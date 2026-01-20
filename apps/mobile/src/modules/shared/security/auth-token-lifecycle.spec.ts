import { describe, expect, it, vi } from 'vitest';
import { SecureTokenStoreError } from './secure-token-store';
import { createAuthTokenLifecycle } from './auth-token-lifecycle';

describe('auth token lifecycle', () => {
	it('stores token on pairing', async () => {
		const store = {
			isAvailable: vi.fn(async () => true),
			getToken: vi.fn(async () => null),
			setToken: vi.fn(async () => undefined),
			deleteToken: vi.fn(async () => undefined)
		};

		const lifecycle = createAuthTokenLifecycle(store);
		const result = await lifecycle.recordPairing('token');

		expect(result.status).toBe('ready');
		expect(store.setToken).toHaveBeenCalledWith('token');
	});

	it('blocks when token deletion fails', async () => {
		const store = {
			isAvailable: vi.fn(async () => true),
			getToken: vi.fn(async () => null),
			setToken: vi.fn(async () => undefined),
			deleteToken: vi.fn(async () => {
				throw new SecureTokenStoreError('DELETE_FAILED', 'delete failed');
			})
		};

		const lifecycle = createAuthTokenLifecycle(store);
		const result = await lifecycle.clearPairing();

		expect(result.status).toBe('blocked');
		if (result.status === 'blocked') {
			expect(result.error?.code).toBe('DELETE_FAILED');
			expect(result.userMessage).toBeTruthy();
		}
	});
});
