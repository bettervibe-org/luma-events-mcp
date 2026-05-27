import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LumaApiError, LumaClient } from "./luma-client.js";

const mockFetch = vi.fn();

beforeEach(() => {
	vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
	vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		text: () => Promise.resolve(JSON.stringify(body)),
	} as Response;
}

describe("LumaClient", () => {
	test("sets x-luma-api-key header", async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
		const client = new LumaClient("test-key", "https://mock.luma.com");
		await client.request("GET", "/v1/calendar/get");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://mock.luma.com/v1/calendar/get",
			expect.objectContaining({
				headers: expect.objectContaining({
					"x-luma-api-key": "test-key",
				}),
			}),
		);
	});

	test("throws LumaApiError on non-2xx", async () => {
		mockFetch.mockResolvedValueOnce(
			jsonResponse({ message: "Unauthorized" }, 401),
		);
		const client = new LumaClient("bad-key", "https://mock.luma.com");

		await expect(
			client.request("GET", "/v1/calendar/get"),
		).rejects.toThrowError(LumaApiError);
	});

	test("sends JSON body for POST requests", async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse({ api_id: "evt-123" }));
		const client = new LumaClient("test-key", "https://mock.luma.com");
		await client.request("POST", "/v1/event/create", { name: "Test" });

		expect(mockFetch).toHaveBeenCalledWith(
			"https://mock.luma.com/v1/event/create",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ name: "Test" }),
			}),
		);
	});

	test("paginate collects all pages", async () => {
		const localFetch = vi.fn();
		vi.stubGlobal("fetch", localFetch);

		localFetch
			.mockResolvedValueOnce(
				jsonResponse({
					entries: [{ id: "1" }, { id: "2" }],
					has_more: true,
					next_cursor: "cursor-abc",
				}),
			)
			.mockResolvedValueOnce(
				jsonResponse({
					entries: [{ id: "3" }],
					has_more: false,
				}),
			);

		const client = new LumaClient("test-key", "https://mock.luma.com");
		const results = await client.paginate("/v1/calendar/list-events");

		expect(results).toHaveLength(3);
		expect(results).toEqual([{ id: "1" }, { id: "2" }, { id: "3" }]);
		expect(localFetch).toHaveBeenCalledTimes(2);

		const secondUrl = localFetch.mock.calls[1]![0] as string;
		expect(secondUrl).toContain("pagination_cursor=cursor-abc");
	});

	test("paginateSingle returns one page with next_cursor", async () => {
		mockFetch.mockResolvedValueOnce(
			jsonResponse({
				entries: [{ id: "1" }],
				has_more: true,
				next_cursor: "cursor-xyz",
			}),
		);

		const client = new LumaClient("test-key", "https://mock.luma.com");
		const result = await client.paginateSingle(
			"/v1/calendar/list-events",
			undefined,
			1,
		);

		expect(result.entries).toEqual([{ id: "1" }]);
		expect(result.next_cursor).toBe("cursor-xyz");
	});

	test("testConnection calls GET /v1/calendar/get", async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse({ api_id: "cal-123" }));
		const client = new LumaClient("test-key", "https://mock.luma.com");
		await client.testConnection();

		expect(mockFetch).toHaveBeenCalledWith(
			"https://mock.luma.com/v1/calendar/get",
			expect.objectContaining({ method: "GET" }),
		);
	});
});
