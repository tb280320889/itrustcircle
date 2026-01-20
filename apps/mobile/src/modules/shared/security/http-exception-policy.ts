import type { HttpExceptionConfig } from './http-exception-config';

export type HttpExceptionPolicyResult = {
	enabled: boolean;
	requiresReconfirm: boolean;
	reason?: 'NO_CONFIRMATION' | 'CONFIRMATION_EXPIRED';
};

export const HTTP_EXCEPTION_CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;

export function evaluateHttpExceptionPolicy(
	config: HttpExceptionConfig,
	now: number
): HttpExceptionPolicyResult {
	if (!config.enabled) {
		return { enabled: false, requiresReconfirm: false };
	}
	if (config.confirmedAt == null) {
		return { enabled: false, requiresReconfirm: true, reason: 'NO_CONFIRMATION' };
	}
	if (now - config.confirmedAt > HTTP_EXCEPTION_CONFIRMATION_TTL_MS) {
		return { enabled: false, requiresReconfirm: true, reason: 'CONFIRMATION_EXPIRED' };
	}

	return { enabled: true, requiresReconfirm: false };
}
