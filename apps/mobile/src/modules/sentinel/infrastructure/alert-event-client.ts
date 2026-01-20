import type { AlertEvent, AlertEventError, AlertEventResult } from '../../shared/alert-event';
import { SecureTokenStoreError, type SecureTokenStore } from '../../shared/security/secure-token-store';

export type RetryPolicy = {
	baseDelayMs: number;
	backoffFactor: number;
	maxDelayMs: number;
	maxRetries: number;
};

export type HttpResponse = {
	status: number;
	body: AlertEventResult | AlertEventError;
};

export type AlertEventClientDependencies = {
	endpointUrl: string;
	tokenStore: SecureTokenStore;
	retryPolicy: RetryPolicy;
	httpClient: (request: {
		url: string;
		headers: Record<string, string>;
		body: AlertEvent;
	}) => Promise<HttpResponse>;
	sleep: (ms: number) => Promise<void>;
};

export type SendBlockReason = {
	code: 'AUTH_TOKEN_MISSING' | 'AUTH_TOKEN_UNAVAILABLE' | 'AUTH_TOKEN_READ_FAILED';
	message: string;
	error?: SecureTokenStoreError;
};

function getTokenUnavailableMessage(error: unknown): string {
	if (error instanceof SecureTokenStoreError) {
		switch (error.code) {
			case 'UNAVAILABLE':
				return 'Secure storage unavailable. Native implementation may be missing or disabled. Check device security settings or rebuild with native plugins.';
			case 'READ_FAILED':
				return 'Secure storage read failed. Check device security settings or retry.';
			default:
				return `Secure storage error (${error.code}). Check device security settings.`;
		}
	}
	return 'Secure storage unavailable. Check device security settings and retry pairing.';
}

export type SendResult = {
	status: 'sent' | 'failed';
	attempts: number;
	lastResponse?: HttpResponse;
	lastError?: unknown;
	blockReason?: SendBlockReason;
};

const RETRYABLE_STATUS = new Set([500, 503]);
const RETRYABLE_CODES = new Set(['INTERNAL_ERROR', 'SERVICE_UNAVAILABLE']);

export async function sendAlertEvent({
	event,
	deps
}: {
	event: AlertEvent;
	deps: AlertEventClientDependencies;
}): Promise<SendResult> {
	let authToken: string | null;
	try {
		authToken = await deps.tokenStore.getToken();
	} catch (error) {
		return {
			status: 'failed',
			attempts: 0,
			blockReason: {
				code: error instanceof SecureTokenStoreError && error.code === 'UNAVAILABLE' ? 'AUTH_TOKEN_UNAVAILABLE' : 'AUTH_TOKEN_READ_FAILED',
				message: getTokenUnavailableMessage(error),
				error: error instanceof SecureTokenStoreError ? error : undefined
			}
		};
	}

	if (!authToken) {
		return {
			status: 'failed',
			attempts: 0,
			blockReason: {
				code: 'AUTH_TOKEN_MISSING',
				message: 'Missing auth token. Re-pair with Tower before sending.'
			}
		};
	}

	let attempts = 0;
	let delay = deps.retryPolicy.baseDelayMs;

	while (attempts < deps.retryPolicy.maxRetries) {
		attempts += 1;
		let response: HttpResponse;
		try {
			response = await deps.httpClient({
				url: deps.endpointUrl,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${authToken}`
				},
				body: event
			});
		} catch (error) {
			if (attempts >= deps.retryPolicy.maxRetries) {
				return { status: 'failed', attempts, lastError: error };
			}
			await deps.sleep(delay);
			delay = Math.min(Math.round(delay * deps.retryPolicy.backoffFactor), deps.retryPolicy.maxDelayMs);
			continue;
		}

		if (response.status === 200) {
			const result = response.body as AlertEventResult;
			if (result.result === 'created' || result.result === 'duplicate') {
				return { status: 'sent', attempts, lastResponse: response };
			}
		}

		const error = (response.body as AlertEventError | undefined)?.error;
		const retryable =
			RETRYABLE_STATUS.has(response.status) ||
			(error?.code && RETRYABLE_CODES.has(error.code));

		if (!retryable) {
			return { status: 'failed', attempts, lastResponse: response };
		}

		if (attempts >= deps.retryPolicy.maxRetries) {
			return { status: 'failed', attempts, lastResponse: response };
		}

		await deps.sleep(delay);
		delay = Math.min(Math.round(delay * deps.retryPolicy.backoffFactor), deps.retryPolicy.maxDelayMs);
	}

	return { status: 'failed', attempts };
}
