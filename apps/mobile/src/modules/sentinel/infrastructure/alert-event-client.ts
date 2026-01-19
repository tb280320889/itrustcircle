import type { AlertEvent, AlertEventError, AlertEventResult } from '../../shared/alert-event';

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
	authToken: string;
	retryPolicy: RetryPolicy;
	httpClient: (request: {
		url: string;
		headers: Record<string, string>;
		body: AlertEvent;
	}) => Promise<HttpResponse>;
	sleep: (ms: number) => Promise<void>;
	getDelays?: () => number[];
};

export type SendResult = {
	status: 'sent' | 'failed';
	attempts: number;
	lastResponse?: HttpResponse;
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
	let attempts = 0;
	let delay = deps.retryPolicy.baseDelayMs;

	while (attempts < deps.retryPolicy.maxRetries) {
		attempts += 1;
		const response = await deps.httpClient({
			url: deps.endpointUrl,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${deps.authToken}`
			},
			body: event
		});

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
