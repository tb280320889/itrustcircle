import { describe, expect, it } from 'vitest';
import { handleAlertEventRequest, type AlertEventRepository, type AuthVerifier } from './alert-event-service';
import type { AlertEvent } from '../../shared/alert-event';

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
		last_seen: 1704067195000,
		rssi_last: -65
	},
	cancelled_count: 0
};

function createRepository(): AlertEventRepository {
	const seen = new Map<string, AlertEvent>();
	return {
		async hasEvent(eventId: string) {
			return seen.has(eventId);
		},
		async saveEvent(event: AlertEvent) {
			seen.set(event.event_id, event);
		}
	};
}

function createVerifier(): AuthVerifier {
	return {
		async verify(token: string) {
			if (token === 'valid-token') {
				return { sentinelId: 'sentinel-001', towerId: 'tower-001' };
			}
			if (token === 'mismatch-token') {
				return { sentinelId: 'sentinel-999', towerId: 'tower-001' };
			}
			return null;
		}
	};
}

describe('handleAlertEventRequest', () => {
	it('returns 200 created for new event', async () => {
		const response = await handleAlertEventRequest({
			headers: { authorization: 'Bearer valid-token' },
			body: baseEvent,
			repository: createRepository(),
			verifier: createVerifier(),
			requestIdFactory: () => 'req-1'
		});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ result: 'created', request_id: 'req-1' });
	});

	it('returns 200 duplicate when event already exists', async () => {
		const repository = createRepository();
		await repository.saveEvent(baseEvent);
		const response = await handleAlertEventRequest({
			headers: { authorization: 'Bearer valid-token' },
			body: baseEvent,
			repository,
			verifier: createVerifier(),
			requestIdFactory: () => 'req-2'
		});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ result: 'duplicate', request_id: 'req-2' });
	});

	it('returns 400 when required field missing', async () => {
		const { event_id, ...invalidEvent } = baseEvent;
		const response = await handleAlertEventRequest({
			headers: { authorization: 'Bearer valid-token' },
			body: invalidEvent,
			repository: createRepository(),
			verifier: createVerifier(),
			requestIdFactory: () => 'req-3'
		});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: {
				code: 'MISSING_REQUIRED_FIELD',
				message: 'Missing required field: event_id',
				request_id: 'req-3'
			}
		});
	});

	it('returns 401 when auth missing', async () => {
		const response = await handleAlertEventRequest({
			headers: {},
			body: baseEvent,
			repository: createRepository(),
			verifier: createVerifier(),
			requestIdFactory: () => 'req-4'
		});

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: {
				code: 'INVALID_AUTH',
				message: 'Missing or invalid authorization token',
				request_id: 'req-4'
			}
		});
	});

	it('returns 403 when token subject mismatches payload', async () => {
		const response = await handleAlertEventRequest({
			headers: { authorization: 'Bearer mismatch-token' },
			body: baseEvent,
			repository: createRepository(),
			verifier: createVerifier(),
			requestIdFactory: () => 'req-5'
		});

		expect(response.status).toBe(403);
		expect(response.body).toEqual({
			error: {
				code: 'FORBIDDEN',
				message: 'Token subject does not match payload',
				request_id: 'req-5'
			}
		});
	});

	it('returns 400 when trigger_reason invalid', async () => {
		const response = await handleAlertEventRequest({
			headers: { authorization: 'Bearer valid-token' },
			body: { ...baseEvent, trigger_reason: 'manual' },
			repository: createRepository(),
			verifier: createVerifier(),
			requestIdFactory: () => 'req-6'
		});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: {
				code: 'INVALID_PAYLOAD',
				message: 'Invalid trigger_reason',
				request_id: 'req-6'
			}
		});
	});
});
