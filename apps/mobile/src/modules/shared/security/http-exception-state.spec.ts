import { describe, expect, it } from 'vitest';
import { reconcileHttpExceptionOnNetworkChange } from './http-exception-state';

describe('http exception state', () => {
	it('keeps enabled when trusted and unchanged', () => {
		const now = 1_700_000_000_000;
		const result = reconcileHttpExceptionOnNetworkChange({
			previous: { connectionType: 'wifi', deviceIp: '192.168.1.10' },
			next: { connectionType: 'wifi', deviceIp: '192.168.1.10' },
			towerHost: '192.168.1.20',
			config: { enabled: true, confirmedAt: now },
			now
		});

		expect(result.state.enabled).toBe(true);
		expect(result.state.trustedLan).toBe(true);
		expect(result.config.enabled).toBe(true);
	});

	it('disables when network boundary changes to untrusted', () => {
		const now = 1_700_000_000_000;
		const result = reconcileHttpExceptionOnNetworkChange({
			previous: { connectionType: 'wifi', deviceIp: '192.168.1.10' },
			next: { connectionType: 'cellular', deviceIp: '10.0.0.2' },
			towerHost: '192.168.1.20',
			config: { enabled: true, confirmedAt: now },
			now
		});

		expect(result.state.enabled).toBe(false);
		expect(result.state.reason).toBe('UNTRUSTED_LAN');
		expect(result.config.enabled).toBe(false);
	});
});
