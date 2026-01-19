export type DeviceMeta = {
	device_name: string;
	last_seen: number;
	rssi_last?: number;
};

export type AlertEventLocation = {
	latitude: number;
	longitude: number;
	accuracy: number;
	timestamp: number;
};

export type AlertEvent = {
	api_version: string;
	event_id: string;
	sentinel_id: string;
	tower_id: string;
	profile_id: string;
	timestamp: number;
	trigger_reason: string;
	device_meta: DeviceMeta;
	cancelled_count: number;
	location?: AlertEventLocation;
};

export type AlertEventResult = {
	result: 'created' | 'duplicate';
	request_id: string;
};

export type AlertEventError = {
	error: {
		code:
			| 'INVALID_AUTH'
			| 'FORBIDDEN'
			| 'INVALID_PAYLOAD'
			| 'MISSING_REQUIRED_FIELD'
			| 'INVALID_FIELD_TYPE'
			| 'UNSUPPORTED_VERSION'
			| 'INTERNAL_ERROR'
			| 'SERVICE_UNAVAILABLE';
		message: string;
		request_id: string;
	};
};
