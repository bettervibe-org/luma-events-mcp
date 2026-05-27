import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerListGuests } from "./list-guests.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerListGuests", () => {
	test("auto-paginates all guests for an event", async () => {
		const guests = [
			{ api_id: "gst-1", email: "a@b.com" },
			{ api_id: "gst-2", email: "c@d.com" },
		];
		const mockClient = { paginate: vi.fn().mockResolvedValue(guests) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "list-guests") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerListGuests(mockClient as unknown as LumaClient, server);
		const result = await handler!({ event_id: "evt-123" });
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed).toEqual(guests);
		expect(mockClient.paginate).toHaveBeenCalledWith("/v1/event/get-guests", {
			event_id: "evt-123",
		});
	});

	test("passes approval_status filter", async () => {
		const mockClient = { paginate: vi.fn().mockResolvedValue([]) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "list-guests") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerListGuests(mockClient as unknown as LumaClient, server);
		await handler!({ event_id: "evt-123", approval_status: "approved" });

		expect(mockClient.paginate).toHaveBeenCalledWith("/v1/event/get-guests", {
			event_id: "evt-123",
			approval_status: "approved",
		});
	});
});
