import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type GetEventInput = {
	event_id: string;
};

export const getEventDefinition = {
	name: "get-event",
	description: "Get admin details of a specific event by its ID",
	inputSchema: {
		event_id: z.string().describe("Event ID (e.g. evt-...)"),
	},
	returns:
		"Full event object including name, dates, location, description, and ticket info",
} as const;

export function registerGetEvent(client: LumaClient, server: McpServer) {
	server.registerTool(
		getEventDefinition.name,
		{
			description: getEventDefinition.description,
			inputSchema: getEventDefinition.inputSchema,
		},
		async (args: GetEventInput) => {
			const data = await client.request(
				"GET",
				`/v1/event/get?id=${encodeURIComponent(args.event_id)}`,
			);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
