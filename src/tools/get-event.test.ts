import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerGetEvent } from "./get-event.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerGetEvent", () => {
	test("fetches event by ID using the id query param", async () => {
		const eventData = { event: { id: "evt-123", name: "Workshop" } };
		const mockClient = { request: vi.fn().mockResolvedValue(eventData) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "get-event") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerGetEvent(mockClient as unknown as LumaClient, server);
		expect(handler).toBeDefined();

		const result = await handler!({ event_id: "evt-123" });
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed).toEqual(eventData);
		expect(mockClient.request).toHaveBeenCalledWith(
			"GET",
			"/v1/event/get?id=evt-123",
		);
	});
});
