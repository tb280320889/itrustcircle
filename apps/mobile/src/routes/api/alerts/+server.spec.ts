import { describe, expect, it, beforeEach } from 'vitest';
import { POST } from './+server';
import { resetAlertEventDependencies, setRequestIdFactory } from './dependencies';
import type { AlertEvent } from '../../../modules/shared/alert-event';

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

beforeEach(() => {
	resetAlertEventDependencies();
	setRequestIdFactory(() => 'req-test');
});

describe('POST /api/alerts', () => {
	it('returns 200 created with request_id', async () => {
		const request = new Request('https://example.test/api/alerts', {
			method: 'POST',
			headers: {
				Authorization: 'Bearer valid-token',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(baseEvent)
		});

		const response = await POST({ request } as Parameters<typeof POST>[0]);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({ result: 'created', request_id: 'req-test' });
	});

	it('returns 200 duplicate on second post', async () => {
		const createRequest = () =>
			new Request('https://example.test/api/alerts', {
				method: 'POST',
				headers: {
					Authorization: 'Bearer valid-token',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(baseEvent)
			});

		await POST({ request: createRequest() } as Parameters<typeof POST>[0]);
		const response = await POST({ request: createRequest() } as Parameters<typeof POST>[0]);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({ result: 'duplicate', request_id: 'req-test' });
	});

	it('returns 401 when authorization missing', async () => {
		const request = new Request('https://example.test/api/alerts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(baseEvent)
		});

		const response = await POST({ request } as Parameters<typeof POST>[0]);
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.error.code).toBe('INVALID_AUTH');
	});

	it('returns 400 when payload is invalid json', async () => {
		const request = new Request('https://example.test/api/alerts', {
			method: 'POST',
			headers: {
				Authorization: 'Bearer valid-token',
				'Content-Type': 'application/json'
			},
			body: '{'
		});

		const response = await POST({ request } as Parameters<typeof POST>[0]);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe('INVALID_PAYLOAD');
	});
});
