import { describe, expect, expectTypeOf, it } from 'vitest';
import { AUTH_TOKEN_STORAGE_KEY, type SecureTokenStore } from './secure-token-store';

describe('secure token store', () => {
	it('defines the expected interface', () => {
		expectTypeOf<SecureTokenStore>().toEqualTypeOf<{
			isAvailable: () => Promise<boolean>;
			getToken: () => Promise<string | null>;
			setToken: (token: string) => Promise<void>;
			deleteToken: () => Promise<void>;
		}>();
		expect(AUTH_TOKEN_STORAGE_KEY).toBe('auth_token');
	});
});
