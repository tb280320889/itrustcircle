export type NetworkSnapshot = {
	connectionType: 'wifi' | 'cellular' | 'unknown';
	deviceIp?: string;
};

export function isTrustedLan({
	network,
	towerHost
}: {
	network: NetworkSnapshot;
	towerHost: string;
}): boolean {
	if (network.connectionType !== 'wifi') {
		return false;
	}
	const towerIp = extractIpv4(towerHost);
	if (!towerIp || !isPrivateIpv4(towerIp)) {
		return false;
	}
	if (!network.deviceIp) {
		// Compatible spec: Wi-Fi + RFC1918 implies trusted if deviceIp unavailable
		return true;
	}
	const deviceIp = parseIpv4(network.deviceIp);
	if (!deviceIp) {
		return false;
	}
	return isSameSubnet(deviceIp, towerIp);
}

function extractIpv4(host: string): number[] | null {
	const normalized = host.includes('://') ? safeUrlHost(host) : host;
	const hostname = normalized.split('/')[0]?.split(':')[0] ?? '';
	return parseIpv4(hostname);
}

function safeUrlHost(value: string): string {
	try {
		return new URL(value).host;
	} catch {
		return value;
	}
}

function parseIpv4(value: string): number[] | null {
	const parts = value.split('.');
	if (parts.length !== 4) return null;
	const bytes = parts.map((part) => Number(part));
	if (bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) return null;
	return bytes;
}

function isPrivateIpv4(ip: number[]): boolean {
	if (ip[0] === 10) return true;
	if (ip[0] === 172 && ip[1] >= 16 && ip[1] <= 31) return true;
	if (ip[0] === 192 && ip[1] === 168) return true;
	return false;
}

function isSameSubnet(a: number[], b: number[]): boolean {
	return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
