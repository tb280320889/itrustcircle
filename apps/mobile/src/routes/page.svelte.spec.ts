import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('renders connection configuration and status', async () => {
		render(Page);

		const title = page.getByRole('heading', { level: 1 });
		const configHeading = page.getByRole('heading', { name: 'Connection Configuration' });
		const statusHeading = page.getByRole('heading', { name: 'Connection Status' });
		const toggleLabel = page.getByText('Allow HTTP on trusted LAN');

		await expect.element(title).toBeInTheDocument();
		await expect.element(configHeading).toBeInTheDocument();
		await expect.element(statusHeading).toBeInTheDocument();
		await expect.element(toggleLabel).toBeInTheDocument();
	});
});
