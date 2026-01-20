import type { HttpExceptionConfig } from './http-exception-config';
import { evaluateHttpExceptionPolicy } from './http-exception-policy';
import { hasNetworkBoundaryChanged } from './network-boundary';
import { isTrustedLan, type NetworkSnapshot } from './trusted-lan';

export type HttpExceptionState = {
	enabled: boolean;
	trustedLan: boolean;
	requiresReconfirm: boolean;
	reason?: 'UNTRUSTED_LAN' | 'NO_CONFIRMATION' | 'CONFIRMATION_EXPIRED';
};

export function reconcileHttpExceptionOnNetworkChange({
	previous,
	next,
	towerHost,
	config,
	now,
	forceReevaluate = false
}: {
	previous: NetworkSnapshot;
	next: NetworkSnapshot;
	towerHost: string;
	config: HttpExceptionConfig;
	now: number;
	forceReevaluate?: boolean;
}): { config: HttpExceptionConfig; state: HttpExceptionState } {
	const boundaryChanged = hasNetworkBoundaryChanged(previous, next);
	const shouldReevaluate = boundaryChanged || forceReevaluate;
	const trustedLan = isTrustedLan({ network: next, towerHost });
	const policy = evaluateHttpExceptionPolicy(config, now);

	let enabled = config.enabled && trustedLan && policy.enabled;
	let requiresReconfirm = policy.requiresReconfirm;
	let reason: HttpExceptionState['reason'] = policy.reason;

	if (!trustedLan) {
		enabled = false;
		requiresReconfirm = false;
		reason = 'UNTRUSTED_LAN';
	}

	let nextConfig = config;
	const mustDisablePersisted =
		config.enabled &&
		(!trustedLan || policy.requiresReconfirm || policy.reason === 'NO_CONFIRMATION');

	if (mustDisablePersisted || (!enabled && shouldReevaluate)) {
		nextConfig = { enabled: false, confirmedAt: null };
	}

	return {
		config: nextConfig,
		state: {
			enabled,
			trustedLan,
			requiresReconfirm,
			reason
		}
	};
}
