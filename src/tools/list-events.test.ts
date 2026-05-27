import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerListEvents } from "./list-events.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

function captureTool(
	name: string,
	server: McpServer,
	registerFn: (client: unknown, server: McpServer) => void,
	mockClient: unknown,
): ToolHandler {
	let handler: ToolHandler | null = null;
	const originalRegisterTool = server.registerTool.bind(server);
	server.registerTool = vi.fn((n: string, config: unknown, h: ToolHandler) => {
		if (n === name) handler = h;
		return originalRegisterTool(n, config, h);
	}) as typeof server.registerTool;
	registerFn(mockClient as LumaClient, server);
	if (!handler) throw new Error(`Tool ${name} not registered`);
	return handler;
}

describe("registerListEvents", () => {
	test("auto-paginates when no pagination params given", async () => {
		const events = [{ api_id: "evt-1" }, { api_id: "evt-2" }];
		const mockClient = { paginate: vi.fn().mockResolvedValue(events) };

		const server = new McpServer({ name: "test", version: "0.1.0" });
		const handler = captureTool(
			"list-events",
			server,
			registerListEvents,
			mockClient,
		);

		const result = await handler({});
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed).toEqual(events);
		expect(mockClient.paginate).toHaveBeenCalledWith(
			"/v1/calendar/list-events",
			{},
		);
	});

	test("passes after/before params", async () => {
		const mockClient = { paginate: vi.fn().mockResolvedValue([]) };
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const handler = captureTool(
			"list-events",
			server,
			registerListEvents,
			mockClient,
		);

		await handler({
			after: "2025-01-01T00:00:00Z",
			before: "2025-12-31T00:00:00Z",
		});

		expect(mockClient.paginate).toHaveBeenCalledWith(
			"/v1/calendar/list-events",
			{ after: "2025-01-01T00:00:00Z", before: "2025-12-31T00:00:00Z" },
		);
	});

	test("returns single page when pagination params given", async () => {
		const page = { entries: [{ api_id: "evt-1" }], next_cursor: "abc" };
		const mockClient = { paginateSingle: vi.fn().mockResolvedValue(page) };

		const server = new McpServer({ name: "test", version: "0.1.0" });
		const handler = captureTool(
			"list-events",
			server,
			registerListEvents,
			mockClient,
		);

		const result = await handler({ pagination_limit: 10 });
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed).toEqual(page);
	});
});
