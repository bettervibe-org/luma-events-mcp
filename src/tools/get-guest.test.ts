import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerGetGuest } from "./get-guest.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerGetGuest", () => {
	test("fetches guest by ID", async () => {
		const guestData = { id: "gst-1", user_email: "test@example.com" };
		const mockClient = { request: vi.fn().mockResolvedValue(guestData) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "get-guest") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerGetGuest(mockClient as unknown as LumaClient, server);
		const result = await handler!({ event_id: "evt-123", id: "gst-1" });
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed).toEqual(guestData);
		expect(mockClient.request).toHaveBeenCalledWith(
			"GET",
			"/v1/event/get-guest?event_id=evt-123&id=gst-1",
		);
	});

	test("fetches guest by email", async () => {
		const mockClient = { request: vi.fn().mockResolvedValue({}) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "get-guest") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerGetGuest(mockClient as unknown as LumaClient, server);
		await handler!({ event_id: "evt-123", id: "user@example.com" });

		expect(mockClient.request).toHaveBeenCalledWith(
			"GET",
			expect.stringContaining("id=user%40example.com"),
		);
	});
});
