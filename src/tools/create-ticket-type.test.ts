import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerCreateTicketType } from "./create-ticket-type.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerCreateTicketType", () => {
	test("creates a free ticket type", async () => {
		const created = { id: "ett-new", name: "General" };
		const mockClient = { request: vi.fn().mockResolvedValue(created) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "create-ticket-type") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerCreateTicketType(mockClient as unknown as LumaClient, server);

		const result = await handler!({
			event_id: "evt-123",
			name: "General",
			type: "free",
		});

		expect(JSON.parse(result.content[0].text)).toEqual(created);
		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/ticket-types/create",
			{ event_id: "evt-123", name: "General", type: "free" },
		);
	});

	test("creates a paid ticket type with price", async () => {
		const mockClient = { request: vi.fn().mockResolvedValue({}) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "create-ticket-type") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerCreateTicketType(mockClient as unknown as LumaClient, server);
		await handler!({
			event_id: "evt-123",
			name: "VIP",
			type: "paid",
			cents: 5000,
			currency: "EUR",
		});

		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/ticket-types/create",
			expect.objectContaining({ cents: 5000, currency: "EUR" }),
		);
	});
});
