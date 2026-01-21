import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';
import { HTTP_EXCEPTION_ENABLED_KEY, HTTP_EXCEPTION_CONFIRMED_AT_KEY } from '../modules/shared/security/http-exception-config';

describe('Connection Guardrails UI Logic', () => {
	beforeEach(() => {
		localStorage.clear();
		// Mock window.confirm
		vi.stubGlobal('confirm', vi.fn(() => true));
		
		// Mock navigator.connection
		const mockConnection = {
			type: 'wifi',
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		};
		vi.stubGlobal('navigator', {
			...navigator,
			connection: mockConnection
		});
	});

	it('Case 1: Default Disabled - Should initialize with HTTP exception disabled', async () => {
		render(Page);
		const status = page.getByText('Disabled');
		await expect.element(status).toBeInTheDocument();
	});

	it('Case 2: Persistence - Should recover Tower host and Device IP from localStorage', async () => {
		localStorage.setItem('tower_host', '192.168.1.50');
		localStorage.setItem('device_ip', '192.168.1.10');
		
		render(Page);
		
		const hostInput = page.getByPlaceholder('192.168.1.20 or https://tower.local');
		const ipInput = page.getByPlaceholder('192.168.1.10');
		
		await expect.element(hostInput).toHaveValue('192.168.1.50');
		await expect.element(ipInput).toHaveValue('192.168.1.10');
	});

	it('Case 3: Block Untrusted LAN - Should prevent enabling toggle for public IP', async () => {
		render(Page);
		
		const hostInput = page.getByPlaceholder('192.168.1.20 or https://tower.local');
		await userEvent.fill(hostInput, '8.8.8.8');
		
		const toggle = page.getByRole('checkbox');
		await userEvent.click(toggle);
		
		// Should still be disabled and show error message
		await expect.element(toggle).not.toBeChecked();
		const error = page.getByText('Connect to Wi-Fi and ensure Tower address resolves to an RFC1918 private IP');
		await expect.element(error).toBeInTheDocument();
	});

	it('Case 4: Enable on Trusted LAN - Should allow enabling with confirmation', async () => {
		render(Page);
		
		const hostInput = page.getByPlaceholder('192.168.1.20 or https://tower.local');
		await userEvent.fill(hostInput, '192.168.1.50');
		
		// Wait for Trusted LAN to be confirmed
		await expect.element(page.getByText('Trusted LAN confirmed')).toBeInTheDocument();
		
		const toggle = page.getByRole('checkbox');
		await userEvent.click(toggle);
		
		expect(window.confirm).toHaveBeenCalled();
		await expect.element(toggle).toBeChecked();
		
		const banner = page.getByText('HTTP traffic is not encrypted');
		await expect.element(banner).toBeInTheDocument();
	});

	it('Case 5: Disable Logic - Should clear confirmation when disabled', async () => {
		localStorage.setItem(HTTP_EXCEPTION_ENABLED_KEY, 'true');
		localStorage.setItem(HTTP_EXCEPTION_CONFIRMED_AT_KEY, Date.now().toString());
		localStorage.setItem('tower_host', '192.168.1.50');
		
		render(Page);
		
		const toggle = page.getByRole('checkbox');
		await expect.element(toggle).toBeChecked();
		
		await userEvent.click(toggle);
		await expect.element(toggle).not.toBeChecked();
		
		expect(localStorage.getItem(HTTP_EXCEPTION_CONFIRMED_AT_KEY)).toBeNull();
	});

	it('Case 7: Invalid Host Input - Should handle malformed URLs gracefully', async () => {
		render(Page);
		
		const hostInput = page.getByPlaceholder('192.168.1.20 or https://tower.local');
		await userEvent.fill(hostInput, '!!invalid_host!!');
		
		const toggle = page.getByRole('checkbox');
		await userEvent.click(toggle);
		
		await expect.element(toggle).not.toBeChecked();
	});

	it('Case 8: Subnet Strict Check - Should fail if device and tower are on different subnets', async () => {
		render(Page);
		
		const hostInput = page.getByPlaceholder('192.168.1.20 or https://tower.local');
		const ipInput = page.getByPlaceholder('192.168.1.10');
		
		await userEvent.fill(hostInput, '192.168.1.50');
		await userEvent.fill(ipInput, '10.0.0.1'); // Different subnet
		
		const statusLabel = page.getByText('Trusted LAN not confirmed');
		await expect.element(statusLabel).toBeInTheDocument();
		
		const toggle = page.getByRole('checkbox');
		await userEvent.click(toggle);
		await expect.element(toggle).not.toBeChecked();
	});

	it('Case 6 & 10: Network Change & Auto-Evaluation - Should disable when switching to cellular or offline', async () => {
		localStorage.setItem(HTTP_EXCEPTION_ENABLED_KEY, 'true');
		localStorage.setItem(HTTP_EXCEPTION_CONFIRMED_AT_KEY, Date.now().toString());
		localStorage.setItem('tower_host', '192.168.1.50');
		
		render(Page);
		
		const toggle = page.getByRole('checkbox');
		await expect.element(toggle).toBeChecked();
		
		// Simulate switching to cellular
		const mockConnection = {
			type: 'cellular',
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		};
		vi.stubGlobal('navigator', { ...navigator, connection: mockConnection });
		
		// Trigger the 'change' event manually if possible, or just wait for the component to re-read
		// The component listens for 'change' on navigator.connection
		window.dispatchEvent(new Event('online')); // Trigger a re-evaluation
		
		await expect.element(toggle).not.toBeChecked();
		await expect.element(page.getByText('HTTP exception disabled because the network is not trusted.')).toBeInTheDocument();
	});

	it('Case 9: Expiration Check - Should disable if confirmation is > 24h old', async () => {
		const twoDaysAgo = Date.now() - (48 * 60 * 60 * 1000);
		localStorage.setItem(HTTP_EXCEPTION_ENABLED_KEY, 'true');
		localStorage.setItem(HTTP_EXCEPTION_CONFIRMED_AT_KEY, twoDaysAgo.toString());
		localStorage.setItem('tower_host', '192.168.1.50');
		
		render(Page);
		
		const toggle = page.getByRole('checkbox');
		// Use a longer timeout or wait for state to settle
		await expect.element(toggle).not.toBeChecked({ timeout: 5000 });
		
		const message = page.getByText('HTTP exception disabled because confirmation expired.');
		await expect.element(message).toBeInTheDocument();
	});
});
