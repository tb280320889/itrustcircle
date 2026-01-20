<script lang="ts">
	import { onMount } from 'svelte';
	import {
		DEFAULT_HTTP_EXCEPTION_CONFIG,
		createHttpExceptionConfigStore,
		type HttpExceptionConfig
	} from '../modules/shared/security/http-exception-config';
	import {
		reconcileHttpExceptionOnNetworkChange,
		type HttpExceptionState
	} from '../modules/shared/security/http-exception-state';
	import type { NetworkSnapshot } from '../modules/shared/security/trusted-lan';

	const STORAGE_TOWER_HOST_KEY = 'tower_host';
	const STORAGE_DEVICE_IP_KEY = 'device_ip';
	const configStore = createHttpExceptionConfigStore(localStorage);

	let towerHost = '';
	let deviceIp = '';
	let config: HttpExceptionConfig = DEFAULT_HTTP_EXCEPTION_CONFIG;
	let networkSnapshot: NetworkSnapshot = { connectionType: 'unknown' };
	let state: HttpExceptionState = {
		enabled: false,
		trustedLan: false,
		requiresReconfirm: false
	};
	let actionMessage = '';
	let mounted = false;
	let trustedLabel = '';
	let statusMessage = '';
	let confirmedLabel = '';

	$: trustedLabel = state.trustedLan
		? 'Trusted LAN confirmed'
		: 'Trusted LAN not confirmed';

	$: {
		if (state.reason === 'UNTRUSTED_LAN') {
			statusMessage = 'HTTP exception disabled because the network is not trusted.';
		} else if (state.reason === 'CONFIRMATION_EXPIRED') {
			statusMessage = 'HTTP exception disabled because confirmation expired.';
		} else if (state.reason === 'NO_CONFIRMATION') {
			statusMessage = 'HTTP exception disabled until you confirm the risk again.';
		} else {
			statusMessage = '';
		}
	}

	$: {
		confirmedLabel =
			config.confirmedAt != null ? new Date(config.confirmedAt).toLocaleString() : 'Not confirmed';
	}

	function readNetworkSnapshot(): NetworkSnapshot {
		const connection = (navigator as Navigator & { connection?: { type?: string; effectiveType?: string } })
			.connection;
		const rawType = connection?.type ?? connection?.effectiveType ?? 'unknown';
		const connectionType = normalizeConnectionType(rawType);
		const ip = deviceIp.trim() || undefined;
		return { connectionType, deviceIp: ip };
	}

	function normalizeConnectionType(rawType: string): NetworkSnapshot['connectionType'] {
		if (rawType === 'wifi') return 'wifi';
		if (['cellular', '2g', '3g', '4g', '5g'].includes(rawType)) return 'cellular';
		return 'unknown';
	}

	function reconcile(nextSnapshot: NetworkSnapshot, forceReevaluate = false) {
		const result = reconcileHttpExceptionOnNetworkChange({
			previous: networkSnapshot,
			next: nextSnapshot,
			towerHost,
			config,
			now: Date.now(),
			forceReevaluate
		});
		networkSnapshot = nextSnapshot;
		state = result.state;
		
		const configChanged = 
			config.enabled !== result.config.enabled || 
			config.confirmedAt !== result.config.confirmedAt;
		
		if (configChanged) {
			config = result.config;
			void configStore.setConfig(result.config);
		}
	}

	async function handleToggle(event: Event) {
		const input = event.target as HTMLInputElement;
		const checked = input.checked;
		actionMessage = '';

		if (checked) {
			if (!state.trustedLan) {
				input.checked = false;
				actionMessage = 'Connect to Wi-Fi and ensure Tower address resolves to an RFC1918 private IP. Providing device IP enables stricter verification.';
				return;
			}
			const needsConfirm = state.requiresReconfirm || config.confirmedAt == null;
			let nextConfirmedAt = config.confirmedAt;
			
			if (needsConfirm) {
				const confirmed = window.confirm(
					'HTTP traffic can be intercepted. Only enable this on a trusted LAN. Continue?'
				);
				if (!confirmed) {
					input.checked = false;
					return;
				}
				nextConfirmedAt = Date.now();
			}
			
			// Update local state first to prevent UI flicker
			config = { enabled: true, confirmedAt: nextConfirmedAt };
			// Trigger reconciliation which handles persistence if changed
			reconcile(networkSnapshot, true);
			return;
		}

		// Disable
		config = { enabled: false, confirmedAt: null };
		reconcile(networkSnapshot, true);
	}

	onMount(() => {
		void (async () => {
			const storedHost = localStorage.getItem(STORAGE_TOWER_HOST_KEY) ?? '';
			const storedIp = localStorage.getItem(STORAGE_DEVICE_IP_KEY) ?? '';
			config = await configStore.getConfig();
			towerHost = storedHost;
			deviceIp = storedIp;

			const snapshot = readNetworkSnapshot();
			networkSnapshot = snapshot;
			reconcile(snapshot, true);
			mounted = true;
		})();

		const handler = () => {
			reconcile(readNetworkSnapshot());
		};
		window.addEventListener('online', handler);
		window.addEventListener('offline', handler);
		const connection = (navigator as Navigator & {
			connection?: {
				addEventListener?: (name: string, callback: () => void) => void;
				removeEventListener?: (name: string, callback: () => void) => void;
			};
		}).connection;
		connection?.addEventListener?.('change', handler);

		return () => {
			window.removeEventListener('online', handler);
			window.removeEventListener('offline', handler);
			connection?.removeEventListener?.('change', handler);
		};
	});

	$: if (mounted) {
		localStorage.setItem(STORAGE_TOWER_HOST_KEY, towerHost);
		if (deviceIp.trim()) {
			localStorage.setItem(STORAGE_DEVICE_IP_KEY, deviceIp);
		} else {
			localStorage.removeItem(STORAGE_DEVICE_IP_KEY);
		}
		reconcile(readNetworkSnapshot(), true);
	}
</script>

<svelte:options runes={false} />

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600&display=swap"
	/>
</svelte:head>

<div class="page">
	<header class="hero">
		<p class="kicker">Guardian Core</p>
		<h1>Connection Guardrails</h1>
		<p class="lead">
			Manage the HTTP exception workflow for AlertEvent delivery and keep sensitive tokens protected.
		</p>
	</header>

	<section class="card">
		<h2>Connection Configuration</h2>
		<div class="form-grid">
			<label>
				<span>Tower address</span>
				<input
					placeholder="192.168.1.20 or https://tower.local"
					bind:value={towerHost}
				/>
			</label>
			<label>
				<span>Local device IP</span>
				<input placeholder="192.168.1.10" bind:value={deviceIp} />
			</label>
		</div>

		<div class="toggle-row">
			<label class="toggle">
				<input
					type="checkbox"
					checked={state.enabled}
					on:change={handleToggle}
				/>
				<span>Allow HTTP on trusted LAN</span>
			</label>
			<span class:trusted={state.trustedLan} class="badge">{trustedLabel}</span>
		</div>
		{#if actionMessage}
			<p class="hint">{actionMessage}</p>
		{/if}
		{#if state.enabled}
			<div class="warning">
				HTTP 传输存在被窃听风险，仅建议在可信局域网短时开启。
			</div>
		{/if}
	</section>

	<section class="card">
		<h2>Connection Status</h2>
		<div class="status-grid">
			<div>
				<span class="label">Network type</span>
				<span class="value">{networkSnapshot.connectionType}</span>
			</div>
			<div>
				<span class="label">Device IP</span>
				<span class="value">{deviceIp.trim() || 'Not provided'}</span>
			</div>
			<div>
				<span class="label">HTTP exception</span>
				<span class="value">{state.enabled ? 'Enabled' : 'Disabled'}</span>
			</div>
			<div>
				<span class="label">Last confirmation</span>
				<span class="value">{confirmedLabel}</span>
			</div>
		</div>
		{#if statusMessage}
			<p class="hint">{statusMessage}</p>
		{/if}
	</section>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Space Grotesk', sans-serif;
		background: radial-gradient(circle at top, #f7f3e9 0%, #efe6d8 45%, #e9ddcc 100%);
		color: #1e1b16;
	}

	.page {
		min-height: 100vh;
		padding: 3.5rem 1.5rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 980px;
		margin: 0 auto;
	}

	.hero {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.kicker {
		text-transform: uppercase;
		letter-spacing: 0.2em;
		font-size: 0.7rem;
		color: #7a6652;
		margin: 0;
	}

	h1 {
		font-size: clamp(2rem, 4vw, 3rem);
		margin: 0;
	}

	.lead {
		margin: 0;
		max-width: 640px;
		line-height: 1.5;
		color: #4f4132;
	}

	.card {
		background: #fffaf2;
		border-radius: 20px;
		padding: 2rem;
		box-shadow: 0 18px 36px rgba(30, 24, 16, 0.12);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	h2 {
		margin: 0;
		font-size: 1.4rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: #5d4e3d;
	}

	input {
		border-radius: 12px;
		border: 1px solid #d8c7b1;
		padding: 0.65rem 0.75rem;
		font-size: 0.95rem;
		background: #fffdf9;
		color: #1e1b16;
	}

	.toggle-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		justify-content: space-between;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 1rem;
		color: #2b241b;
	}

	.toggle input {
		accent-color: #b56338;
		width: 1.1rem;
		height: 1.1rem;
	}

	.badge {
		padding: 0.35rem 0.8rem;
		border-radius: 999px;
		background: #f0e4d3;
		font-size: 0.75rem;
		color: #6f5a45;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.badge.trusted {
		background: #d8f0d4;
		color: #2f5b2d;
	}

	.warning {
		background: #fff0e0;
		border: 1px solid #f2c4a0;
		border-radius: 12px;
		padding: 0.75rem 1rem;
		font-size: 0.9rem;
		color: #8a4a2a;
		line-height: 1.4;
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1.2rem;
	}

	.label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #917a62;
	}

	.value {
		font-size: 1rem;
		color: #2f271e;
	}

	.hint {
		margin: 0;
		font-size: 0.85rem;
		color: #7b6652;
		line-height: 1.4;
	}

	@media (max-width: 640px) {
		.page {
			padding: 2.5rem 1.25rem 3.5rem;
		}
		.card {
			padding: 1.5rem;
		}
	}
</style>
