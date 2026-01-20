import { describe, expect, it, vi } from 'vitest';
import type { AlertEvent } from '../../shared/alert-event';
import {
	SecureTokenStoreError,
	type SecureTokenStore
} from '../../shared/security/secure-token-store';
import {
	sendAlertEvent,
	type AlertEventClientDependencies,
	type HttpResponse
} from './alert-event-client';

const baseEvent: AlertEvent = {
	api_version: '1.0',
	event_id: '550e8400-e29b-41d4-a716-446655440000',
	sentinel_id: 'sentinel-001',
	tower_id: 'tower-001',
	profile_id: 'child',
	timestamp: 1704067200000,
	trigger_reason: 'ble_disconnect',
	device_meta: {
		device_name: 'Smart Watch',
		last_seen: 1704067195000
	},
	cancelled_count: 0
};

function createTokenStore(token: string | null = 'valid-token'): SecureTokenStore {
	return {
		isAvailable: vi.fn(async () => true),
		getToken: vi.fn(async () => token),
		setToken: vi.fn(async () => undefined),
		deleteToken: vi.fn(async () => undefined)
	};
}

function createDeps(
	responseSequence: HttpResponse[],
	options?: { tokenStore?: SecureTokenStore }
): AlertEventClientDependencies {
	let index = 0;
	const httpClient = vi.fn(async () => {
		const response = responseSequence[Math.min(index, responseSequence.length - 1)];
		index += 1;
		return response;
	});
	return {
		endpointUrl: 'https://tower.example.com/api/alerts',
		tokenStore: options?.tokenStore ?? createTokenStore(),
		retryPolicy: {
			baseDelayMs: 100,
			backoffFactor: 2,
			maxDelayMs: 500,
			maxRetries: 3
		},
		httpClient,
		async sleep(_ms: number) {
		}
	};
}

describe('sendAlertEvent', () => {
	it('retries on 500 then succeeds', async () => {
		const deps = createDeps([
			{ status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'err', request_id: 'req-1' } } },
			{ status: 200, body: { result: 'created', request_id: 'req-2' } }
		]);

		const result = await sendAlertEvent({ event: baseEvent, deps });

		expect(result.status).toBe('sent');
		expect(result.attempts).toBe(2);
	});

	it('does not retry on 400 invalid payload', async () => {
		const deps = createDeps([
			{ status: 400, body: { error: { code: 'INVALID_PAYLOAD', message: 'bad', request_id: 'req-1' } } }
		]);

		const result = await sendAlertEvent({ event: baseEvent, deps });

		expect(result.status).toBe('failed');
		expect(result.attempts).toBe(1);
	});

	it('treats duplicate as sent', async () => {
		const deps = createDeps([{ status: 200, body: { result: 'duplicate', request_id: 'req-1' } }]);

		const result = await sendAlertEvent({ event: baseEvent, deps });

		expect(result.status).toBe('sent');
		expect(result.attempts).toBe(1);
	});

	it('blocks when token missing', async () => {
		const tokenStore = createTokenStore(null);
		const deps = createDeps(
			[{ status: 200, body: { result: 'created', request_id: 'req-1' } }],
			{ tokenStore }
		);

		const result = await sendAlertEvent({ event: baseEvent, deps });

		expect(result.status).toBe('failed');
		expect(result.attempts).toBe(0);
		expect(result.blockReason?.code).toBe('AUTH_TOKEN_MISSING');
		expect(deps.httpClient).not.toHaveBeenCalled();
	});

	it('blocks when token storage throws', async () => {
		const tokenStore: SecureTokenStore = {
			isAvailable: vi.fn(async () => true),
			getToken: vi.fn(async () => {
				throw new SecureTokenStoreError('READ_FAILED', 'read failed');
			}),
			setToken: vi.fn(async () => undefined),
			deleteToken: vi.fn(async () => undefined)
		};
		const deps = createDeps(
			[{ status: 200, body: { result: 'created', request_id: 'req-1' } }],
			{ tokenStore }
		);

		const result = await sendAlertEvent({ event: baseEvent, deps });

		expect(result.status).toBe('failed');
		expect(result.attempts).toBe(0);
		expect(result.blockReason?.code).toBe('AUTH_TOKEN_READ_FAILED');
		expect(deps.httpClient).not.toHaveBeenCalled();
	});
});
