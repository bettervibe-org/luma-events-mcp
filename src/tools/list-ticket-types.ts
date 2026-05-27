import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type ListTicketTypesInput = {
	event_id: string;
};

export const listTicketTypesDefinition = {
	name: "list-ticket-types",
	description: "List all ticket types for an event",
	inputSchema: {
		event_id: z.string().describe("Event ID (e.g. evt-...)"),
	},
	returns:
		"Array of ticket type objects with name, price, and availability info",
} as const;

export function registerListTicketTypes(client: LumaClient, server: McpServer) {
	server.registerTool(
		listTicketTypesDefinition.name,
		{
			description: listTicketTypesDefinition.description,
			inputSchema: listTicketTypesDefinition.inputSchema,
		},
		async (args: ListTicketTypesInput) => {
			const data = await client.request(
				"GET",
				`/v1/event/ticket-types/list?event_id=${encodeURIComponent(args.event_id)}`,
			);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
