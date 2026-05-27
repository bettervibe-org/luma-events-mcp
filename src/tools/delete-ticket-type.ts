import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type DeleteTicketTypeInput = {
	event_ticket_type_api_id: string;
};

export const deleteTicketTypeDefinition = {
	name: "delete-ticket-type",
	description:
		"Delete a ticket type (soft-delete). Cannot delete if tickets have been sold or if it is the last visible ticket type.",
	inputSchema: {
		event_ticket_type_api_id: z
			.string()
			.describe("Ticket type ID (e.g. ett-...)"),
	},
	returns: "Confirmation of the deleted ticket type",
} as const;

export function registerDeleteTicketType(
	client: LumaClient,
	server: McpServer,
) {
	server.registerTool(
		deleteTicketTypeDefinition.name,
		{
			description: deleteTicketTypeDefinition.description,
			inputSchema: deleteTicketTypeDefinition.inputSchema,
		},
		async (args: DeleteTicketTypeInput) => {
			const data = await client.request(
				"POST",
				"/v1/event/ticket-types/delete",
				{ event_ticket_type_api_id: args.event_ticket_type_api_id },
			);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
