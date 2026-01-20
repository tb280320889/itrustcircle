import { SecureTokenStoreError, type SecureTokenStore } from './secure-token-store';

export type AuthTokenLifecycleResult =
	| { status: 'ready' }
	| { status: 'blocked'; error: SecureTokenStoreError; userMessage: string };

export type AuthTokenLifecycle = {
	recordPairing: (token: string) => Promise<AuthTokenLifecycleResult>;
	rotateToken: (token: string) => Promise<AuthTokenLifecycleResult>;
	clearPairing: () => Promise<AuthTokenLifecycleResult>;
	clearCache: () => Promise<AuthTokenLifecycleResult>;
};

const DEFAULT_USER_MESSAGE = 'Secure storage is unavailable. Check device security settings and retry.';

export function createAuthTokenLifecycle(store: SecureTokenStore): AuthTokenLifecycle {
	return {
		async recordPairing(token: string) {
			try {
				await store.setToken(token);
				return { status: 'ready' };
			} catch (error) {
				return blocked(error, 'WRITE_FAILED', DEFAULT_USER_MESSAGE);
			}
		},
		async rotateToken(token: string) {
			try {
				await store.setToken(token);
				return { status: 'ready' };
			} catch (error) {
				return blocked(error, 'WRITE_FAILED', DEFAULT_USER_MESSAGE);
			}
		},
		async clearPairing() {
			try {
				await store.deleteToken();
				return { status: 'ready' };
			} catch (error) {
				return blocked(error, 'DELETE_FAILED', DEFAULT_USER_MESSAGE);
			}
		},
		async clearCache() {
			try {
				await store.deleteToken();
				return { status: 'ready' };
			} catch (error) {
				return blocked(error, 'DELETE_FAILED', DEFAULT_USER_MESSAGE);
			}
		}
	};
}

function blocked(
	error: unknown,
	code: SecureTokenStoreError['code'],
	userMessage: string
): AuthTokenLifecycleResult {
	const secureError =
		error instanceof SecureTokenStoreError
			? error
			: new SecureTokenStoreError(code, userMessage, error);
	return { status: 'blocked', error: secureError, userMessage };
}
