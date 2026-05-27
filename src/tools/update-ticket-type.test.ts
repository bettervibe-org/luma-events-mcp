import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerUpdateTicketType } from "./update-ticket-type.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerUpdateTicketType", () => {
	test("updates with required field only", async () => {
		const updated = { api_id: "ett-123", name: "General" };
		const mockClient = { request: vi.fn().mockResolvedValue(updated) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "update-ticket-type") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerUpdateTicketType(mockClient as unknown as LumaClient, server);

		const result = await handler!({
			event_ticket_type_api_id: "ett-123",
		});

		expect(JSON.parse(result.content[0].text)).toEqual(updated);
		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/ticket-types/update",
			{ event_ticket_type_api_id: "ett-123" },
		);
	});

	test("updates with optional fields", async () => {
		const mockClient = { request: vi.fn().mockResolvedValue({}) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "update-ticket-type") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerUpdateTicketType(mockClient as unknown as LumaClient, server);
		await handler!({
			event_ticket_type_api_id: "ett-123",
			name: "VIP",
			cents: 5000,
			is_hidden: true,
		});

		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/ticket-types/update",
			expect.objectContaining({
				event_ticket_type_api_id: "ett-123",
				name: "VIP",
				cents: 5000,
				is_hidden: true,
			}),
		);
	});
});
