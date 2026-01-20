export async function createTokenFingerprint(token: string): Promise<string> {
	const data = new TextEncoder().encode(token);
	const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
	return toHex(digest).slice(0, 8);
}

export async function formatTokenFingerprint(token: string): Promise<string> {
	return `token_fingerprint=${await createTokenFingerprint(token)}`;
}

function toHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}
