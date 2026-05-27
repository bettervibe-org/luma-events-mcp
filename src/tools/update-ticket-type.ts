import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type UpdateTicketTypeInput = {
	event_ticket_type_api_id: string;
	name?: string | undefined;
	require_approval?: boolean | undefined;
	is_hidden?: boolean | undefined;
	description?: string | undefined;
	valid_start_at?: string | undefined;
	valid_end_at?: string | undefined;
	max_capacity?: number | undefined;
	type?: string | undefined;
	cents?: number | undefined;
	currency?: string | undefined;
	is_flexible?: boolean | undefined;
	min_cents?: number | undefined;
};

export const updateTicketTypeDefinition = {
	name: "update-ticket-type",
	description: "Update an existing ticket type",
	inputSchema: {
		event_ticket_type_api_id: z
			.string()
			.describe("Ticket type ID (e.g. ett-...)"),
		name: z.string().optional().describe("Ticket type name"),
		require_approval: z.boolean().optional().describe("Require host approval"),
		is_hidden: z.boolean().optional().describe("Hide from public listing"),
		description: z.string().optional().describe("Ticket type description"),
		valid_start_at: z
			.string()
			.optional()
			.describe("ISO 8601 start date for ticket sales"),
		valid_end_at: z
			.string()
			.optional()
			.describe("ISO 8601 end date for ticket sales"),
		max_capacity: z.number().optional().describe("Maximum tickets available"),
		type: z.enum(["free", "paid"]).optional().describe("Ticket pricing type"),
		cents: z.number().optional().describe("Price in cents (for paid tickets)"),
		currency: z.string().optional().describe("Currency code (e.g. USD, EUR)"),
		is_flexible: z.boolean().optional().describe("Allow flexible pricing"),
		min_cents: z
			.number()
			.optional()
			.describe("Minimum price in cents (for flexible pricing)"),
	},
	returns: "The updated ticket type object",
} as const;

export function registerUpdateTicketType(
	client: LumaClient,
	server: McpServer,
) {
	server.registerTool(
		updateTicketTypeDefinition.name,
		{
			description: updateTicketTypeDefinition.description,
			inputSchema: updateTicketTypeDefinition.inputSchema,
		},
		async (args: UpdateTicketTypeInput) => {
			const body: Record<string, unknown> = {
				event_ticket_type_api_id: args.event_ticket_type_api_id,
			};
			if (args.name !== undefined) body.name = args.name;
			if (args.require_approval !== undefined)
				body.require_approval = args.require_approval;
			if (args.is_hidden !== undefined) body.is_hidden = args.is_hidden;
			if (args.description !== undefined) body.description = args.description;
			if (args.valid_start_at !== undefined)
				body.valid_start_at = args.valid_start_at;
			if (args.valid_end_at !== undefined)
				body.valid_end_at = args.valid_end_at;
			if (args.max_capacity !== undefined)
				body.max_capacity = args.max_capacity;
			if (args.type !== undefined) body.type = args.type;
			if (args.cents !== undefined) body.cents = args.cents;
			if (args.currency !== undefined) body.currency = args.currency;
			if (args.is_flexible !== undefined) body.is_flexible = args.is_flexible;
			if (args.min_cents !== undefined) body.min_cents = args.min_cents;

			const data = await client.request(
				"POST",
				"/v1/event/ticket-types/update",
				body,
			);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
