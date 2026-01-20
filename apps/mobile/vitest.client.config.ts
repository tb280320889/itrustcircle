import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// Browser Mode needs a real listening Vite server (middlewareMode=false).
	server: {
		middlewareMode: false
	},
	test: {
		expect: { requireAssertions: true },
		include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [{ browser: 'chromium' }],
			api: {
				host: '127.0.0.1',
				port: 63315,
				strictPort: true
			}
		}
	}
});
