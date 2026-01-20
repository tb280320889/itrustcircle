import { getSecureStorageBridge } from '../../shared/security/secure-storage-bridge';
import {
	AUTH_TOKEN_STORAGE_KEY,
	SecureTokenStoreError,
	type SecureTokenStore
} from '../../shared/security/secure-token-store';

export function createTowerSecureTokenStore(): SecureTokenStore {
	const bridge = getSecureStorageBridge();

	return {
		async isAvailable() {
			try {
				return await bridge.isAvailable();
			} catch {
				return false;
			}
		},
		async getToken() {
			await ensureAvailable(bridge);
			try {
				const token = await bridge.getToken(AUTH_TOKEN_STORAGE_KEY);
				return token && token.trim().length > 0 ? token : null;
			} catch (error) {
				throw new SecureTokenStoreError('READ_FAILED', 'Failed to read authentication token', error);
			}
		},
		async setToken(token: string) {
			await ensureAvailable(bridge);
			try {
				await bridge.setToken(AUTH_TOKEN_STORAGE_KEY, token);
			} catch (error) {
				throw new SecureTokenStoreError('WRITE_FAILED', 'Failed to store authentication token', error);
			}
		},
		async deleteToken() {
			await ensureAvailable(bridge);
			try {
				await bridge.deleteToken(AUTH_TOKEN_STORAGE_KEY);
			} catch (error) {
				throw new SecureTokenStoreError('DELETE_FAILED', 'Failed to delete authentication token', error);
			}
		}
	};
}

async function ensureAvailable(bridge: ReturnType<typeof getSecureStorageBridge>) {
	try {
		const available = await bridge.isAvailable();
		if (!available) {
			throw new SecureTokenStoreError('UNAVAILABLE', 'Secure storage unavailable');
		}
	} catch (err) {
		throw err instanceof SecureTokenStoreError
			? err
			: new SecureTokenStoreError('UNAVAILABLE', 'Secure storage unavailable', err);
	}
}
