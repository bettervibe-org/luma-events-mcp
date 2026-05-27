import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LumaClient } from "../luma-client.js";

export const getCalendarDefinition = {
	name: "get-calendar",
	description: "Get the calendar associated with the current API key",
	inputSchema: {},
	returns: "Calendar object with api_id, name, and geo fields",
} as const;

export function registerGetCalendar(client: LumaClient, server: McpServer) {
	server.registerTool(
		getCalendarDefinition.name,
		{
			description: getCalendarDefinition.description,
			inputSchema: getCalendarDefinition.inputSchema,
		},
		async () => {
			const data = await client.request("GET", "/v1/calendar/get");
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
