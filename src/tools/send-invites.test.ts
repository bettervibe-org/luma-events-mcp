import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerSendInvites } from "./send-invites.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerSendInvites", () => {
	test("sends invites with email and optional message", async () => {
		const mockClient = { request: vi.fn().mockResolvedValue({ ok: true }) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "send-invites") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerSendInvites(mockClient as unknown as LumaClient, server);

		const guests = [
			{ email: "a@b.com", message: "You're invited!" },
			{ email: "c@d.com" },
		];
		await handler!({ event_id: "evt-123", guests });

		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/send-invites",
			{ event_id: "evt-123", guests },
		);
	});
});
