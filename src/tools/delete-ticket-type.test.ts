import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerDeleteTicketType } from "./delete-ticket-type.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerDeleteTicketType", () => {
	test("deletes a ticket type", async () => {
		const deleted = { api_id: "ett-123", deleted: true };
		const mockClient = { request: vi.fn().mockResolvedValue(deleted) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "delete-ticket-type") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerDeleteTicketType(mockClient as unknown as LumaClient, server);

		const result = await handler!({
			event_ticket_type_api_id: "ett-123",
		});

		expect(JSON.parse(result.content[0].text)).toEqual(deleted);
		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/ticket-types/delete",
			{ event_ticket_type_api_id: "ett-123" },
		);
	});
});
