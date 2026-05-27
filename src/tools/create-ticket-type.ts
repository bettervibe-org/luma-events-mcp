import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type CreateTicketTypeInput = {
	event_id: string;
	name: string;
	type: string;
	require_approval?: boolean | undefined;
	is_hidden?: boolean | undefined;
	description?: string | undefined;
	max_capacity?: number | undefined;
	cents?: number | undefined;
	currency?: string | undefined;
};

export const createTicketTypeDefinition = {
	name: "create-ticket-type",
	description: "Create a new ticket type for an event",
	inputSchema: {
		event_id: z.string().describe("Event ID (e.g. evt-...)"),
		name: z.string().describe("Ticket type name"),
		type: z.enum(["free", "paid"]).describe("Ticket pricing type"),
		require_approval: z.boolean().optional().describe("Require host approval"),
		is_hidden: z.boolean().optional().describe("Hide from public listing"),
		description: z.string().optional().describe("Ticket type description"),
		max_capacity: z.number().optional().describe("Maximum tickets available"),
		cents: z.number().optional().describe("Price in cents (for paid tickets)"),
		currency: z.string().optional().describe("Currency code (e.g. USD, EUR)"),
	},
	returns: "The created ticket type object",
} as const;

export function registerCreateTicketType(
	client: LumaClient,
	server: McpServer,
) {
	server.registerTool(
		createTicketTypeDefinition.name,
		{
			description: createTicketTypeDefinition.description,
			inputSchema: createTicketTypeDefinition.inputSchema,
		},
		async (args: CreateTicketTypeInput) => {
			const body: Record<string, unknown> = {
				event_id: args.event_id,
				name: args.name,
				type: args.type,
			};
			if (args.require_approval !== undefined)
				body.require_approval = args.require_approval;
			if (args.is_hidden !== undefined) body.is_hidden = args.is_hidden;
			if (args.description !== undefined) body.description = args.description;
			if (args.max_capacity !== undefined)
				body.max_capacity = args.max_capacity;
			if (args.cents !== undefined) body.cents = args.cents;
			if (args.currency !== undefined) body.currency = args.currency;

			const data = await client.request(
				"POST",
				"/v1/event/ticket-types/create",
				body,
			);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
