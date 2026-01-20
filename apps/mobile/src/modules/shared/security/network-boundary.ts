import type { NetworkSnapshot } from './trusted-lan';

export function hasNetworkBoundaryChanged(
	previous: NetworkSnapshot,
	next: NetworkSnapshot
): boolean {
	return previous.connectionType !== next.connectionType || previous.deviceIp !== next.deviceIp;
}
