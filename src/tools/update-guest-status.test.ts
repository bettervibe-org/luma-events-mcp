import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerUpdateGuestStatus } from "./update-guest-status.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerUpdateGuestStatus", () => {
	test("declines a guest", async () => {
		const mockClient = { request: vi.fn().mockResolvedValue({ ok: true }) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "update-guest-status") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerUpdateGuestStatus(mockClient as unknown as LumaClient, server);
		await handler!({
			event_id: "evt-123",
			guest: { email: "a@b.com" },
			status: "declined",
		});

		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/update-guest-status",
			{
				event_id: "evt-123",
				guest: { email: "a@b.com" },
				status: "declined",
			},
		);
	});
});
