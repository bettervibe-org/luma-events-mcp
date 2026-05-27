import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type GetGuestInput = {
	event_id: string;
	id: string;
};

export const getGuestDefinition = {
	name: "get-guest",
	description:
		"Get detailed info for a single event guest. The id field accepts a guest ID (gst-...), guest key (g-...), ticket key, or email address.",
	inputSchema: {
		event_id: z.string().describe("Event ID (e.g. evt-...)"),
		id: z
			.string()
			.describe(
				"Guest identifier: guest ID (gst-...), guest key (g-...), or email",
			),
	},
	returns:
		"Full guest object with approval status, ticket info, event_ticket_orders, and profile",
} as const;

export function registerGetGuest(client: LumaClient, server: McpServer) {
	server.registerTool(
		getGuestDefinition.name,
		{
			description: getGuestDefinition.description,
			inputSchema: getGuestDefinition.inputSchema,
		},
		async (args: GetGuestInput) => {
			const params = new URLSearchParams({
				event_id: args.event_id,
				id: args.id,
			});
			const data = await client.request(
				"GET",
				`/v1/event/get-guest?${params.toString()}`,
			);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
