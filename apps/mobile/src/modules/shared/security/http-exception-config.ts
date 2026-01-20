export type HttpExceptionConfig = {
	enabled: boolean;
	confirmedAt: number | null;
};

export type HttpExceptionConfigStore = {
	getConfig: () => Promise<HttpExceptionConfig>;
	setConfig: (config: HttpExceptionConfig) => Promise<void>;
};

type StorageLike = {
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
	removeItem: (key: string) => void;
};

export const HTTP_EXCEPTION_ENABLED_KEY = 'http_exception_enabled';
export const HTTP_EXCEPTION_CONFIRMED_AT_KEY = 'http_exception_confirmed_at';

export const DEFAULT_HTTP_EXCEPTION_CONFIG: HttpExceptionConfig = {
	enabled: false,
	confirmedAt: null
};

export function createHttpExceptionConfigStore(storage: StorageLike): HttpExceptionConfigStore {
	return {
		async getConfig() {
			const enabledRaw = storage.getItem(HTTP_EXCEPTION_ENABLED_KEY);
			const confirmedRaw = storage.getItem(HTTP_EXCEPTION_CONFIRMED_AT_KEY);
			const enabled = enabledRaw === 'true';
			const confirmedAt = confirmedRaw ? Number(confirmedRaw) : null;

			return {
				enabled,
				confirmedAt: Number.isFinite(confirmedAt) ? confirmedAt : null
			};
		},
		async setConfig(config) {
			storage.setItem(HTTP_EXCEPTION_ENABLED_KEY, String(config.enabled));
			if (config.enabled && config.confirmedAt != null) {
				storage.setItem(HTTP_EXCEPTION_CONFIRMED_AT_KEY, String(config.confirmedAt));
			} else {
				storage.removeItem(HTTP_EXCEPTION_CONFIRMED_AT_KEY);
			}
		}
	};
}
