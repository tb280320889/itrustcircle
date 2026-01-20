import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';
import { createTokenFingerprint, formatTokenFingerprint } from './token-fingerprint';

describe('token fingerprint', () => {
	it('returns first 8 hex chars of SHA-256', async () => {
		const token = 'token-123';
		const expected = createHash('sha256').update(token).digest('hex').slice(0, 8);

		await expect(createTokenFingerprint(token)).resolves.toBe(expected);
	});

	it('formats fingerprint for logs', async () => {
		const token = 'token-123';
		const expected = createHash('sha256').update(token).digest('hex').slice(0, 8);

		await expect(formatTokenFingerprint(token)).resolves.toBe(`token_fingerprint=${expected}`);
	});
});
