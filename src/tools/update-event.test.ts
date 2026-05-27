import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerUpdateEvent } from "./update-event.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerUpdateEvent", () => {
	test("sends only event_id when no optional fields provided", async () => {
		const mockClient = { request: vi.fn().mockResolvedValue({}) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "update-event") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerUpdateEvent(mockClient as unknown as LumaClient, server);
		await handler!({ event_id: "evt-123" });

		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/update",
			{ event_id: "evt-123" },
		);
	});

	test("includes changed fields in request body", async () => {
		const mockClient = { request: vi.fn().mockResolvedValue({}) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "update-event") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerUpdateEvent(mockClient as unknown as LumaClient, server);
		await handler!({
			event_id: "evt-123",
			name: "Updated Name",
			suppress_notifications: true,
		});

		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/update",
			{
				event_id: "evt-123",
				name: "Updated Name",
				suppress_notifications: true,
			},
		);
	});
});
