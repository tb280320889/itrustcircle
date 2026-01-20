import { describe, expect, it } from 'vitest';
import { hasNetworkBoundaryChanged } from './network-boundary';

describe('network boundary', () => {
	it('detects connection type changes', () => {
		const changed = hasNetworkBoundaryChanged(
			{ connectionType: 'wifi', deviceIp: '192.168.1.10' },
			{ connectionType: 'cellular', deviceIp: '10.0.0.2' }
		);

		expect(changed).toBe(true);
	});

	it('detects device ip changes', () => {
		const changed = hasNetworkBoundaryChanged(
			{ connectionType: 'wifi', deviceIp: '192.168.1.10' },
			{ connectionType: 'wifi', deviceIp: '192.168.1.20' }
		);

		expect(changed).toBe(true);
	});

	it('ignores unchanged snapshots', () => {
		const changed = hasNetworkBoundaryChanged(
			{ connectionType: 'wifi', deviceIp: '192.168.1.10' },
			{ connectionType: 'wifi', deviceIp: '192.168.1.10' }
		);

		expect(changed).toBe(false);
	});
});
