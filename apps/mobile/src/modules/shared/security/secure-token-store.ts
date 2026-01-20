export const AUTH_TOKEN_STORAGE_KEY = 'auth_token';

export type SecureTokenStoreErrorCode =
	| 'UNAVAILABLE'
	| 'READ_FAILED'
	| 'WRITE_FAILED'
	| 'DELETE_FAILED';

export class SecureTokenStoreError extends Error {
	readonly code: SecureTokenStoreErrorCode;
	readonly cause?: unknown;

	constructor(code: SecureTokenStoreErrorCode, message: string, cause?: unknown) {
		super(message);
		this.name = 'SecureTokenStoreError';
		this.code = code;
		this.cause = cause;
	}
}

export type SecureTokenStore = {
	isAvailable: () => Promise<boolean>;
	getToken: () => Promise<string | null>;
	setToken: (token: string) => Promise<void>;
	deleteToken: () => Promise<void>;
};
