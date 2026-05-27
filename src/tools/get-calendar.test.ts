import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerGetCalendar } from "./get-calendar.js";

type ToolHandler = () => Promise<{ content: { type: string; text: string }[] }>;

describe("registerGetCalendar", () => {
	test("returns calendar data", async () => {
		const calendarData = { api_id: "cal-123", name: "My Calendar" };
		const mockClient = {
			request: vi.fn().mockResolvedValue(calendarData),
		};

		let toolHandler: ToolHandler | null = null;
		const server = new McpServer({ name: "test-server", version: "0.1.0" });
		const originalRegisterTool = server.registerTool.bind(server);
		server.registerTool = vi.fn(
			(name: string, config: unknown, handler: ToolHandler) => {
				if (name === "get-calendar") toolHandler = handler;
				return originalRegisterTool(name, config, handler);
			},
		) as typeof server.registerTool;

		registerGetCalendar(mockClient as unknown as LumaClient, server);
		expect(toolHandler).toBeDefined();

		const result = await toolHandler!();
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed).toEqual(calendarData);
		expect(mockClient.request).toHaveBeenCalledWith("GET", "/v1/calendar/get");
	});
});
