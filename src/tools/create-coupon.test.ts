import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerCreateCoupon } from "./create-coupon.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerCreateCoupon", () => {
	test("creates a coupon with required fields", async () => {
		const created = { code: "EARLY20", id: "coup-1" };
		const mockClient = { request: vi.fn().mockResolvedValue(created) };

		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "create-coupon") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerCreateCoupon(mockClient as unknown as LumaClient, server);

		const result = await handler!({
			event_id: "evt-123",
			code: "EARLY20",
			discount: { type: "percent", percent_off: 20 },
		});

		expect(JSON.parse(result.content[0].text)).toEqual(created);
		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/event/create-coupon",
			{
				event_id: "evt-123",
				code: "EARLY20",
				discount: { type: "percent", percent_off: 20 },
			},
		);
	});
});
