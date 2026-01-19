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
