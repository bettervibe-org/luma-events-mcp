const DEFAULT_BASE_URL = "https://public-api.luma.com";

export class LumaApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly body: string,
	) {
		super(`Luma API ${status}: ${body}`);
		this.name = "LumaApiError";
	}
}

type PaginatedResponse<T> = {
	entries: T[];
	has_more: boolean;
	next_cursor?: string | undefined;
};

export class LumaClient {
	private readonly apiKey: string;
	private readonly baseUrl: string;

	constructor(apiKey: string, baseUrl?: string) {
		this.apiKey = apiKey;
		this.baseUrl = baseUrl ?? process.env.LUMA_BASE_URL ?? DEFAULT_BASE_URL;
	}

	async request<T>(method: string, path: string, body?: unknown): Promise<T> {
		const url = `${this.baseUrl}${path}`;
		const headers: Record<string, string> = {
			"x-luma-api-key": this.apiKey,
			"content-type": "application/json",
		};

		const res = await fetch(url, {
			method,
			headers,
			...(body !== undefined && { body: JSON.stringify(body) }),
		});

		const text = await res.text();
		if (!res.ok) {
			throw new LumaApiError(res.status, text);
		}

		return text ? (JSON.parse(text) as T) : (undefined as T);
	}

	async paginate<T>(
		path: string,
		params?: Record<string, string>,
	): Promise<T[]> {
		const all: T[] = [];
		let cursor: string | undefined;

		do {
			const searchParams = new URLSearchParams(params);
			if (cursor) searchParams.set("pagination_cursor", cursor);
			const query = searchParams.toString();
			const fullPath = query ? `${path}?${query}` : path;

			const page = await this.request<PaginatedResponse<T>>("GET", fullPath);
			all.push(...page.entries);
			cursor = page.has_more ? page.next_cursor : undefined;
		} while (cursor);

		return all;
	}

	async paginateSingle<T>(
		path: string,
		params?: Record<string, string>,
		paginationLimit?: number,
		paginationCursor?: string,
	): Promise<{ entries: T[]; next_cursor?: string | undefined }> {
		const searchParams = new URLSearchParams(params);
		if (paginationLimit)
			searchParams.set("pagination_limit", String(paginationLimit));
		if (paginationCursor)
			searchParams.set("pagination_cursor", paginationCursor);
		const query = searchParams.toString();
		const fullPath = query ? `${path}?${query}` : path;

		const page = await this.request<PaginatedResponse<T>>("GET", fullPath);
		return {
			entries: page.entries,
			next_cursor: page.has_more ? page.next_cursor : undefined,
		};
	}

	async testConnection(): Promise<void> {
		await this.request("GET", "/v1/calendar/get");
	}
}
