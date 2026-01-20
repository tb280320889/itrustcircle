import { describe, expect, it } from 'vitest';
import { isTrustedLan } from './trusted-lan';

describe('trusted lan', () => {
	it('accepts wifi with matching RFC1918 subnet', () => {
		const result = isTrustedLan({
			network: { connectionType: 'wifi', deviceIp: '192.168.1.10' },
			towerHost: '192.168.1.20'
		});

		expect(result).toBe(true);
	});

	it('rejects when subnet differs', () => {
		const result = isTrustedLan({
			network: { connectionType: 'wifi', deviceIp: '10.0.1.10' },
			towerHost: '10.0.2.20'
		});

		expect(result).toBe(false);
	});

	it('rejects non-wifi networks', () => {
		const result = isTrustedLan({
			network: { connectionType: 'cellular', deviceIp: '192.168.1.10' },
			towerHost: '192.168.1.20'
		});

		expect(result).toBe(false);
	});
});
