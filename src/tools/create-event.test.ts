import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerCreateEvent } from "./create-event.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerCreateEvent", () => {
	test("creates event with required fields", async () => {
		const created = { event: { id: "evt-new", name: "Test Event" } };
		const mockClient = { request: vi.fn().mockResolvedValue(created) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "create-event") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerCreateEvent(mockClient as unknown as LumaClient, server);

		const result = await handler!({
			name: "Test Event",
			start_at: "2025-10-01T10:00:00Z",
			timezone: "Europe/Berlin",
		});

		const parsed = JSON.parse(result.content[0].text);
		expect(parsed).toEqual(created);
		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/create",
			{
				name: "Test Event",
				start_at: "2025-10-01T10:00:00Z",
				timezone: "Europe/Berlin",
			},
		);
	});

	test("includes optional fields when provided", async () => {
		const mockClient = { request: vi.fn().mockResolvedValue({}) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "create-event") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerCreateEvent(mockClient as unknown as LumaClient, server);

		await handler!({
			name: "Workshop",
			start_at: "2025-10-01T10:00:00Z",
			timezone: "Europe/Berlin",
			end_at: "2025-10-01T12:00:00Z",
			description_md: "# Hello",
			visibility: "public",
		});

		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/create",
			expect.objectContaining({
				end_at: "2025-10-01T12:00:00Z",
				description_md: "# Hello",
				visibility: "public",
			}),
		);
	});
});
