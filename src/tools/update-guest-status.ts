import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type UpdateGuestStatusInput = {
	event_id: string;
	guest: Record<string, unknown>;
	status: string;
	should_refund?: boolean | undefined;
};

export const updateGuestStatusDefinition = {
	name: "update-guest-status",
	description: "Update a guest's approval status (approve or decline)",
	inputSchema: {
		event_id: z.string().describe("Event ID (e.g. evt-...)"),
		guest: z
			.record(z.string(), z.unknown())
			.describe(
				"Guest identifier object (e.g. { email: '...' } or { id: 'gst-...' })",
			),
		status: z
			.enum(["approved", "declined"])
			.describe("New status for the guest"),
		should_refund: z
			.boolean()
			.optional()
			.describe("Refund the guest if declining a paid ticket"),
	},
	returns: "Confirmation of status update",
} as const;

export function registerUpdateGuestStatus(
	client: LumaClient,
	server: McpServer,
) {
	server.registerTool(
		updateGuestStatusDefinition.name,
		{
			description: updateGuestStatusDefinition.description,
			inputSchema: updateGuestStatusDefinition.inputSchema,
		},
		async (args: UpdateGuestStatusInput) => {
			const body: Record<string, unknown> = {
				event_id: args.event_id,
				guest: args.guest,
				status: args.status,
			};
			if (args.should_refund !== undefined)
				body.should_refund = args.should_refund;

			const data = await client.request(
				"POST",
				"/v1/event/update-guest-status",
				body,
			);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
