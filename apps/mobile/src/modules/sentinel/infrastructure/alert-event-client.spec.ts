import { describe, expect, it } from 'vitest';
import type { AlertEvent } from '../../shared/alert-event';
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

function createDeps(responseSequence: HttpResponse[]): AlertEventClientDependencies {
	let index = 0;
	const delays: number[] = [];
	return {
		endpointUrl: 'https://tower.example.com/api/alerts',
		authToken: 'valid-token',
		retryPolicy: {
			baseDelayMs: 100,
			backoffFactor: 2,
			maxDelayMs: 500,
			maxRetries: 3
		},
		async httpClient() {
			const response = responseSequence[Math.min(index, responseSequence.length - 1)];
			index += 1;
			return response;
		},
		async sleep(ms: number) {
			delays.push(ms);
		},
		getDelays() {
			return delays;
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
		expect(deps.getDelays()).toEqual([100]);
	});

	it('does not retry on 400 invalid payload', async () => {
		const deps = createDeps([
			{ status: 400, body: { error: { code: 'INVALID_PAYLOAD', message: 'bad', request_id: 'req-1' } } }
		]);

		const result = await sendAlertEvent({ event: baseEvent, deps });

		expect(result.status).toBe('failed');
		expect(result.attempts).toBe(1);
		expect(deps.getDelays()).toEqual([]);
	});

	it('treats duplicate as sent', async () => {
		const deps = createDeps([{ status: 200, body: { result: 'duplicate', request_id: 'req-1' } }]);

		const result = await sendAlertEvent({ event: baseEvent, deps });

		expect(result.status).toBe('sent');
		expect(result.attempts).toBe(1);
	});
});
