import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerListTicketTypes } from "./list-ticket-types.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerListTicketTypes", () => {
	test("fetches ticket types for an event", async () => {
		const ticketData = [
			{ api_id: "ett-1", name: "General", price: 0 },
			{ api_id: "ett-2", name: "VIP", price: 5000 },
		];
		const mockClient = { request: vi.fn().mockResolvedValue(ticketData) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "list-ticket-types") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerListTicketTypes(mockClient as unknown as LumaClient, server);
		const result = await handler!({ event_id: "evt-123" });
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed).toEqual(ticketData);
		expect(mockClient.request).toHaveBeenCalledWith(
			"GET",
			"/v1/event/ticket-types/list?event_id=evt-123",
		);
	});
});
