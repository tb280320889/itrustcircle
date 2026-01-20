import { describe, expect, it } from 'vitest';
import {
	evaluateHttpExceptionPolicy,
	HTTP_EXCEPTION_CONFIRMATION_TTL_MS
} from './http-exception-policy';

describe('http exception policy', () => {
	it('allows enabled within confirmation window', () => {
		const now = 1_700_000_000_000;
		const result = evaluateHttpExceptionPolicy({
			enabled: true,
			confirmedAt: now - HTTP_EXCEPTION_CONFIRMATION_TTL_MS + 1000
		}, now);

		expect(result.enabled).toBe(true);
		expect(result.requiresReconfirm).toBe(false);
	});

	it('disables when confirmation expired', () => {
		const now = 1_700_000_000_000;
		const result = evaluateHttpExceptionPolicy({
			enabled: true,
			confirmedAt: now - HTTP_EXCEPTION_CONFIRMATION_TTL_MS - 1000
		}, now);

		expect(result.enabled).toBe(false);
		expect(result.requiresReconfirm).toBe(true);
		expect(result.reason).toBe('CONFIRMATION_EXPIRED');
	});
});
