import { registerPlugin } from '@capacitor/core';

export type SecureStorageBridge = {
	isAvailable: () => Promise<boolean>;
	getToken: (key: string) => Promise<string | null>;
	setToken: (key: string, value: string) => Promise<void>;
	deleteToken: (key: string) => Promise<void>;
};

const defaultBridge = registerPlugin<SecureStorageBridge>('SecureStorageBridge');
let bridgeOverride: SecureStorageBridge | null = null;

export function getSecureStorageBridge(): SecureStorageBridge {
	return bridgeOverride ?? defaultBridge;
}

export function setSecureStorageBridge(bridge: SecureStorageBridge): void {
	bridgeOverride = bridge;
}

export function resetSecureStorageBridge(): void {
	bridgeOverride = null;
}
