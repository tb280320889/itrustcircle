import type { AlertEvent, AlertEventError, AlertEventResult } from '../../shared/alert-event';

type RequestHeaders = {
	authorization?: string;
};

export type AlertEventRepository = {
	hasEvent: (eventId: string) => Promise<boolean>;
	saveEvent: (event: AlertEvent) => Promise<void>;
};

export type AuthVerifier = {
	verify: (token: string) => Promise<{ sentinelId: string; towerId: string } | null>;
};

type AlertEventRequest = {
	headers: RequestHeaders;
	body: Partial<AlertEvent>;
	repository: AlertEventRepository;
	verifier: AuthVerifier;
	requestIdFactory: () => string;
};

export type AlertEventResponse = {
	status: number;
	body: AlertEventResult | AlertEventError;
};

const REQUIRED_FIELDS: Array<keyof AlertEvent> = [
	'api_version',
	'event_id',
	'sentinel_id',
	'tower_id',
	'profile_id',
	'timestamp',
	'trigger_reason',
	'device_meta',
	'cancelled_count'
];

const VERSION_PATTERN = /^\d+\.\d+$/;

export async function handleAlertEventRequest({
	headers,
	body,
	repository,
	verifier,
	requestIdFactory
}: AlertEventRequest): Promise<AlertEventResponse> {
	const requestId = requestIdFactory();
	const authHeader = headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return unauthorized(requestId, 'Missing or invalid authorization token');
	}
	const token = authHeader.slice('Bearer '.length).trim();
	const auth = await verifier.verify(token);
	if (!auth) {
		return unauthorized(requestId, 'Missing or invalid authorization token');
	}

	const missingField = REQUIRED_FIELDS.find((field) => body[field] === undefined);
	if (missingField) {
		return badRequest(requestId, 'MISSING_REQUIRED_FIELD', `Missing required field: ${missingField}`);
	}

	const event = body as AlertEvent;

	if (!VERSION_PATTERN.test(event.api_version)) {
		return badRequest(requestId, 'INVALID_PAYLOAD', 'Invalid api_version format');
	}

	if (!event.api_version.startsWith('1.')) {
		return badRequest(requestId, 'UNSUPPORTED_VERSION', `Unsupported api_version: ${event.api_version.split('.')[0]}.x`);
	}

	const typeError = validateFieldTypes(event);
	if (typeError) {
		return badRequest(requestId, 'INVALID_FIELD_TYPE', `Invalid field type: ${typeError}`);
	}

	const metaMissing = validateDeviceMeta(event.device_meta);
	if (metaMissing) {
		return badRequest(requestId, 'MISSING_REQUIRED_FIELD', `Missing required field: ${metaMissing}`);
	}

	if (event.trigger_reason !== 'ble_disconnect') {
		return badRequest(requestId, 'INVALID_PAYLOAD', 'Invalid trigger_reason');
	}

	if (event.sentinel_id !== auth.sentinelId || event.tower_id !== auth.towerId) {
		return forbidden(requestId, 'Token subject does not match payload');
	}

	const exists = await repository.hasEvent(event.event_id);
	if (exists) {
		return ok({ result: 'duplicate', request_id: requestId });
	}

	await repository.saveEvent(event);
	return ok({ result: 'created', request_id: requestId });
}

function validateFieldTypes(event: AlertEvent): string | null {
	if (typeof event.api_version !== 'string') return 'api_version';
	if (typeof event.event_id !== 'string') return 'event_id';
	if (typeof event.sentinel_id !== 'string') return 'sentinel_id';
	if (typeof event.tower_id !== 'string') return 'tower_id';
	if (typeof event.profile_id !== 'string') return 'profile_id';
	if (typeof event.timestamp !== 'number') return 'timestamp';
	if (typeof event.trigger_reason !== 'string') return 'trigger_reason';
	if (typeof event.cancelled_count !== 'number') return 'cancelled_count';
	if (!event.device_meta || typeof event.device_meta !== 'object') return 'device_meta';
	if (event.location !== undefined && !isValidLocation(event.location)) return 'location';
	return null;
}

function validateDeviceMeta(deviceMeta: AlertEvent['device_meta']): string | null {
	if (typeof deviceMeta.device_name !== 'string') return 'device_meta.device_name';
	if (typeof deviceMeta.last_seen !== 'number') return 'device_meta.last_seen';
	if (deviceMeta.rssi_last !== undefined && typeof deviceMeta.rssi_last !== 'number') {
		return 'device_meta.rssi_last';
	}
	return null;
}

function isValidLocation(location: AlertEvent['location']): boolean {
	if (!location || typeof location !== 'object') return false;
	return (
		typeof location.latitude === 'number' &&
		typeof location.longitude === 'number' &&
		typeof location.accuracy === 'number' &&
		typeof location.timestamp === 'number'
	);
}

function ok(body: AlertEventResult): AlertEventResponse {
	return { status: 200, body };
}

function unauthorized(requestId: string, message: string): AlertEventResponse {
	return {
		status: 401,
		body: {
			error: {
				code: 'INVALID_AUTH',
				message,
				request_id: requestId
			}
		}
	};
}

function forbidden(requestId: string, message: string): AlertEventResponse {
	return {
		status: 403,
		body: {
			error: {
				code: 'FORBIDDEN',
				message,
				request_id: requestId
			}
		}
	};
}

function badRequest(
	requestId: string,
	code: AlertEventError['error']['code'],
	message: string
): AlertEventResponse {
	return {
		status: 400,
		body: {
			error: {
				code,
				message,
				request_id: requestId
			}
		}
	};
}
