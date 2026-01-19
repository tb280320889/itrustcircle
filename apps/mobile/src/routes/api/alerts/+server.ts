import { json } from '@sveltejs/kit';
import { handleAlertEventRequest } from '../../../modules/tower/application/alert-event-service';
import {
	getAlertEventRepository,
	getAuthVerifier,
	getRequestIdFactory
} from './dependencies';

export async function POST({ request }: { request: Request }) {
	const requestIdFactory = getRequestIdFactory();
	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		const body = {
			error: {
				code: 'INVALID_PAYLOAD',
				message: 'Invalid JSON body',
				request_id: requestIdFactory()
			}
		};
		return json(body, { status: 400 });
	}

	const response = await handleAlertEventRequest({
		headers: {
			authorization: request.headers.get('authorization') ?? undefined
		},
		body: payload as Record<string, unknown>,
		repository: getAlertEventRepository(),
		verifier: getAuthVerifier(),
		requestIdFactory
	});

	return json(response.body, { status: response.status });
}
