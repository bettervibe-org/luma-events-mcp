import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerListCoupons } from "./list-coupons.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerListCoupons", () => {
	test("auto-paginates all coupons", async () => {
		const coupons = [{ code: "EARLY" }, { code: "VIP" }];
		const mockClient = { paginate: vi.fn().mockResolvedValue(coupons) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "list-coupons") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerListCoupons(mockClient as unknown as LumaClient, server);
		const result = await handler!({ event_id: "evt-123" });
		expect(JSON.parse(result.content[0].text)).toEqual(coupons);
	});
});
