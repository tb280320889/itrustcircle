import type { AlertEvent } from '../../../modules/shared/alert-event';
import type { AlertEventRepository, AuthVerifier } from '../../../modules/tower/application/alert-event-service';

const inMemoryStore = new Map<string, AlertEvent>();

let repository: AlertEventRepository = {
	async hasEvent(eventId: string) {
		return inMemoryStore.has(eventId);
	},
	async saveEvent(event: AlertEvent) {
		inMemoryStore.set(event.event_id, event);
	}
};

let verifier: AuthVerifier = {
	async verify(token: string) {
		if (token === 'valid-token') {
			return { sentinelId: 'sentinel-001', towerId: 'tower-001' };
		}
		return null;
	}
};

let requestIdFactory = () => crypto.randomUUID();

export function getAlertEventRepository() {
	return repository;
}

export function getAuthVerifier() {
	return verifier;
}

export function getRequestIdFactory() {
	return requestIdFactory;
}

export function setRequestIdFactory(factory: () => string) {
	requestIdFactory = factory;
}

export function resetAlertEventDependencies() {
	inMemoryStore.clear();
	repository = {
		async hasEvent(eventId: string) {
			return inMemoryStore.has(eventId);
		},
		async saveEvent(event: AlertEvent) {
			inMemoryStore.set(event.event_id, event);
		}
	};
	verifier = {
		async verify(token: string) {
			if (token === 'valid-token') {
				return { sentinelId: 'sentinel-001', towerId: 'tower-001' };
			}
			return null;
		}
	};
	requestIdFactory = () => crypto.randomUUID();
}
