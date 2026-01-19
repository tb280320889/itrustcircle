import { json } from '@sveltejs/kit';
import { handleAlertEventRequest } from '../../../modules/tower/application/alert-event-service';
import {
	getAlertEventRepository,
	getAuthVerifier,
	getRequestIdFactory,
	type AlertEventRouteOverrides
} from './dependencies';

export async function POST(
	{ request }: { request: Request },
	overrides?: AlertEventRouteOverrides
) {
	const resolvedFactory = getRequestIdFactory(overrides);
	const requestId = resolvedFactory();
	const requestIdFactory = () => requestId;
	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		const body = {
			error: {
				code: 'INVALID_PAYLOAD',
				message: 'Invalid JSON body',
				request_id: requestId
			}
		};
		return json(body, { status: 400 });
	}

	try {
		const response = await handleAlertEventRequest({
			headers: {
				authorization: request.headers.get('authorization') ?? undefined
			},
			body: payload as Record<string, unknown>,
			repository: getAlertEventRepository(overrides),
			verifier: getAuthVerifier(overrides),
			requestIdFactory
		});

		return json(response.body, { status: response.status });
	} catch {
		const body = {
			error: {
				code: 'INTERNAL_ERROR',
				message: 'Internal server error',
				request_id: requestId
			}
		};
		return json(body, { status: 500 });
	}
}
