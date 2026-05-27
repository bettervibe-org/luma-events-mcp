import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type AddGuestsInput = {
	event_id: string;
	guests: Array<Record<string, unknown>>;
	approval_status?: string | undefined;
	send_email?: boolean | undefined;
	ticket?: Record<string, unknown> | undefined;
};

const guestSchema = z.object({
	email: z.string().describe("Guest email address"),
	name: z.string().optional().describe("Guest display name"),
	phone_number: z.string().optional().describe("Phone number"),
});

export const addGuestsDefinition = {
	name: "add-guests",
	description:
		"Add guests to an event. By default guests are approved and receive one default ticket.",
	inputSchema: {
		event_id: z.string().describe("Event ID (e.g. evt-...)"),
		guests: z.array(guestSchema).describe("Array of guest objects with email"),
		approval_status: z
			.enum(["approved", "pending_approval", "waitlist"])
			.optional()
			.describe("Approval status for added guests (default: approved)"),
		send_email: z
			.boolean()
			.optional()
			.describe("Send notification email (default: true)"),
		ticket: z
			.record(z.string(), z.unknown())
			.optional()
			.describe("Ticket type to assign to all guests"),
	},
	returns: "Confirmation of added guests",
} as const;

export function registerAddGuests(client: LumaClient, server: McpServer) {
	server.registerTool(
		addGuestsDefinition.name,
		{
			description: addGuestsDefinition.description,
			inputSchema: addGuestsDefinition.inputSchema,
		},
		async (args: AddGuestsInput) => {
			const body: Record<string, unknown> = {
				event_id: args.event_id,
				guests: args.guests,
			};
			if (args.approval_status !== undefined)
				body.approval_status = args.approval_status;
			if (args.send_email !== undefined) body.send_email = args.send_email;
			if (args.ticket !== undefined) body.ticket = args.ticket;

			const data = await client.request("POST", "/v1/event/add-guests", body);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
