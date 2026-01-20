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

	let towerHost = $state('');
	let deviceIp = $state('');
	let config = $state<HttpExceptionConfig>(DEFAULT_HTTP_EXCEPTION_CONFIG);
	let networkSnapshot = $state<NetworkSnapshot>({ connectionType: 'unknown' });
	let exceptionState = $state<HttpExceptionState>({
		enabled: false,
		trustedLan: false,
		requiresReconfirm: false
	});
	let actionMessage = $state('');
	let mounted = $state(false);

	let trustedLabel = $derived(
		exceptionState.trustedLan ? 'Trusted LAN confirmed' : 'Trusted LAN not confirmed'
	);

	let statusMessage = $derived.by(() => {
		if (exceptionState.reason === 'UNTRUSTED_LAN') {
			return 'HTTP exception disabled because the network is not trusted.';
		} else if (exceptionState.reason === 'CONFIRMATION_EXPIRED') {
			return 'HTTP exception disabled because confirmation expired.';
		} else if (exceptionState.reason === 'NO_CONFIRMATION') {
			return 'HTTP exception disabled until you confirm the risk again.';
		}
		return '';
	});

	let confirmedLabel = $derived(
		config.confirmedAt != null ? new Date(config.confirmedAt).toLocaleString() : 'Not confirmed'
	);

	function readNetworkSnapshot(): NetworkSnapshot {
		const connection = (
			navigator as Navigator & { connection?: { type?: string; effectiveType?: string } }
		).connection;
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
		exceptionState = result.state;

		const configChanged =
			config.enabled !== result.config.enabled || config.confirmedAt !== result.config.confirmedAt;

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
			if (!exceptionState.trustedLan) {
				input.checked = false;
				actionMessage =
					'Connect to Wi-Fi and ensure Tower address resolves to an RFC1918 private IP. Providing device IP enables stricter verification.';
				return;
			}
			const needsConfirm = exceptionState.requiresReconfirm || config.confirmedAt == null;
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

			// Update local exceptionState first to prevent UI flicker
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
		const connection = (
			navigator as Navigator & {
				connection?: {
					addEventListener?: (name: string, callback: () => void) => void;
					removeEventListener?: (name: string, callback: () => void) => void;
				};
			}
		).connection;
		connection?.addEventListener?.('change', handler);

		return () => {
			window.removeEventListener('online', handler);
			window.removeEventListener('offline', handler);
			connection?.removeEventListener?.('change', handler);
		};
	});

	$effect(() => {
		if (mounted) {
			localStorage.setItem(STORAGE_TOWER_HOST_KEY, towerHost);
			if (deviceIp.trim()) {
				localStorage.setItem(STORAGE_DEVICE_IP_KEY, deviceIp);
			} else {
				localStorage.removeItem(STORAGE_DEVICE_IP_KEY);
			}
			reconcile(readNetworkSnapshot(), true);
		}
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap"
	/>
</svelte:head>

<div class="min-h-screen max-w-3xl mx-auto flex flex-col gap-8 p-6 pb-24 pt-16 font-sans text-[#1e1b16]">
	<header class="flex flex-col gap-4">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7a6652] text-[#f7f3e9] shadow-sm">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
				</svg>
			</div>
			<div>
				<p class="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6652]">Guardian Core</p>
				<h1 class="m-0 text-3xl font-bold tracking-tight text-[#2b241b] sm:text-4xl">Connection Guardrails</h1>
			</div>
		</div>
		<p class="m-0 max-w-xl text-lg leading-relaxed text-[#4f4132]/90">
			Manage the HTTP exception workflow for AlertEvent delivery and keep sensitive tokens protected.
		</p>
	</header>

	<section
		class="flex flex-col gap-6 rounded-3xl bg-[#fffaf2] p-6 shadow-[0_2px_8px_-2px_rgba(30,24,16,0.08),0_12px_24px_-8px_rgba(30,24,16,0.06)] sm:p-8"
	>
		<div class="flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-[#b56338]"
			>
				<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
				<circle cx="12" cy="12" r="3" />
			</svg>
			<h2 class="m-0 text-xl font-semibold text-[#2b241b]">Configuration</h2>
		</div>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
			<label class="flex flex-col gap-2">
				<span class="text-xs font-medium uppercase tracking-wider text-[#7a6652]">Tower address</span>
				<div class="relative">
					<input
						placeholder="192.168.1.20 or https://tower.local"
						bind:value={towerHost}
						class="w-full rounded-xl border border-[#d8c7b1] bg-[#fffdf9] py-3 pl-10 pr-4 text-sm font-medium text-[#1e1b16] placeholder-[#917a62]/60 shadow-sm transition-all duration-200 focus:border-[#b56338] focus:outline-none focus:ring-2 focus:ring-[#b56338]/10"
					/>
					<div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#917a62]">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
							<circle cx="12" cy="10" r="3" />
						</svg>
					</div>
				</div>
			</label>
			<label class="flex flex-col gap-2">
				<span class="text-xs font-medium uppercase tracking-wider text-[#7a6652]">Local device IP</span>
				<div class="relative">
					<input
						placeholder="192.168.1.10"
						bind:value={deviceIp}
						class="w-full rounded-xl border border-[#d8c7b1] bg-[#fffdf9] py-3 pl-10 pr-4 text-sm font-medium text-[#1e1b16] placeholder-[#917a62]/60 shadow-sm transition-all duration-200 focus:border-[#b56338] focus:outline-none focus:ring-2 focus:ring-[#b56338]/10"
					/>
					<div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#917a62]">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<rect width="16" height="10" x="2" y="6" rx="2" />
							<path d="M12 2v4" />
							<path d="M12 16v6" />
							<path d="M8 22h8" />
							<path d="M8 2h8" />
						</svg>
					</div>
				</div>
			</label>
		</div>

		<div class="flex flex-col gap-4 rounded-2xl bg-[#f7f3e9]/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-semibold text-[#2b241b]">Allow HTTP on trusted LAN</span>
				<span class="text-xs text-[#7a6652]">Bypasses HTTPS requirements for local testing</span>
			</div>
			
			<div class="flex items-center gap-4">
				<span
					class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-colors duration-200 {exceptionState.trustedLan
						? 'bg-[#d8f0d4] text-[#1f4b1d] ring-1 ring-[#1f4b1d]/10'
						: 'bg-[#e8e0d5] text-[#6f5a45]'}"
				>
					{#if exceptionState.trustedLan}
						<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
					{/if}
					{trustedLabel}
				</span>

				<label class="relative inline-flex cursor-pointer items-center">
					<input
						type="checkbox"
						checked={exceptionState.enabled}
						onchange={handleToggle}
						class="peer sr-only"
					/>
					<div
						class="peer h-7 w-12 rounded-full bg-[#d8c7b1] transition-all duration-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#b56338]/20 peer-checked:bg-[#b56338] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-sm"
					></div>
				</label>
			</div>
		</div>

		{#if actionMessage}
			<div class="flex items-start gap-3 rounded-xl border border-[#e6d0b3] bg-[#fff8e6] p-4 text-sm text-[#7b6652]">
				<svg class="mt-0.5 shrink-0 text-[#b56338]" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
				<p class="m-0 leading-relaxed">{actionMessage}</p>
			</div>
		{/if}

		{#if exceptionState.enabled}
			<div class="flex items-start gap-3 rounded-xl border border-[#f2c4a0] bg-[#fff0e0] p-4 text-sm text-[#8a4a2a]">
				<svg class="mt-0.5 shrink-0 text-[#b56338]" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
				<p class="m-0 leading-relaxed font-medium">
					HTTP traffic is not encrypted. Only use this on a trusted private network for short-term testing.
				</p>
			</div>
		{/if}
	</section>

	<section
		class="flex flex-col gap-6 rounded-3xl bg-[#fffaf2] p-6 shadow-[0_2px_8px_-2px_rgba(30,24,16,0.08),0_12px_24px_-8px_rgba(30,24,16,0.06)] sm:p-8"
	>
		<div class="flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-[#7a6652]"
			>
				<rect width="20" height="16" x="2" y="4" rx="2" />
				<path d="M6 8h.01" />
				<path d="M10 8h.01" />
				<path d="M14 8h.01" />
				<path d="M18 8h.01" />
				<path d="M6 12h.01" />
				<path d="M10 12h.01" />
				<path d="M14 12h.01" />
				<path d="M18 12h.01" />
				<path d="M6 16h.01" />
				<path d="M10 16h.01" />
				<path d="M14 16h.01" />
				<path d="M18 16h.01" />
			</svg>
			<h2 class="m-0 text-xl font-semibold text-[#2b241b]">Connection Status</h2>
		</div>

		<div class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-6">
			<div class="flex flex-col gap-1.5">
				<span class="text-[10px] font-bold uppercase tracking-widest text-[#917a62]">Network</span>
				<div class="flex items-center gap-2">
					<div class="h-2 w-2 rounded-full {networkSnapshot.connectionType !== 'unknown' ? 'bg-[#2f5b2d]' : 'bg-[#d8c7b1]'}"></div>
					<span class="text-sm font-medium text-[#2f271e]">{networkSnapshot.connectionType}</span>
				</div>
			</div>
			
			<div class="flex flex-col gap-1.5">
				<span class="text-[10px] font-bold uppercase tracking-widest text-[#917a62]">Device IP</span>
				<span class="text-sm font-medium text-[#2f271e]">{deviceIp.trim() || '—'}</span>
			</div>
			
			<div class="flex flex-col gap-1.5">
				<span class="text-[10px] font-bold uppercase tracking-widest text-[#917a62]">HTTP Exception</span>
				<span class="inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium {exceptionState.enabled ? 'bg-[#fff0e0] text-[#8a4a2a]' : 'bg-[#f0e4d3] text-[#6f5a45]'}">
					{exceptionState.enabled ? 'Enabled' : 'Disabled'}
				</span>
			</div>
			
			<div class="flex flex-col gap-1.5">
				<span class="text-[10px] font-bold uppercase tracking-widest text-[#917a62]">Confirmed At</span>
				<span class="text-sm font-medium text-[#2f271e] truncate" title={confirmedLabel}>{confirmedLabel}</span>
			</div>
		</div>
		
		{#if statusMessage}
			<div class="mt-2 flex items-center gap-2 border-t border-[#f0e4d3] pt-4">
				<svg class="text-[#7b6652]" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
				<p class="m-0 text-xs font-medium text-[#7b6652]">{statusMessage}</p>
			</div>
		{/if}
	</section>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
		background: radial-gradient(circle at top, #f7f3e9 0%, #efe6d8 45%, #e9ddcc 100%);
		background-attachment: fixed;
		color: #1e1b16;
		-webkit-font-smoothing: antialiased;
	}
</style>
