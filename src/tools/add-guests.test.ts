import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerAddGuests } from "./add-guests.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerAddGuests", () => {
	test("adds guests with required fields", async () => {
		const mockClient = { request: vi.fn().mockResolvedValue({ ok: true }) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "add-guests") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerAddGuests(mockClient as unknown as LumaClient, server);

		const guests = [{ email: "a@b.com" }, { email: "c@d.com", name: "Carol" }];
		await handler!({ event_id: "evt-123", guests });

		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/add-guests",
			{ event_id: "evt-123", guests },
		);
	});

	test("passes optional approval_status and send_email", async () => {
		const mockClient = { request: vi.fn().mockResolvedValue({}) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "add-guests") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerAddGuests(mockClient as unknown as LumaClient, server);
		await handler!({
			event_id: "evt-123",
			guests: [{ email: "x@y.com" }],
			approval_status: "pending_approval",
			send_email: false,
		});

		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/add-guests",
			expect.objectContaining({
				approval_status: "pending_approval",
				send_email: false,
			}),
		);
	});
});
