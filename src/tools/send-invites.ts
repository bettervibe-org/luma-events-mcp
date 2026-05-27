import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type SendInvitesInput = {
	event_id: string;
	guests: Array<Record<string, unknown>>;
};

const inviteGuestSchema = z.object({
	email: z.string().describe("Guest email address"),
	message: z
		.string()
		.optional()
		.describe("Personalized invite message (max 200 chars)"),
});

export const sendInvitesDefinition = {
	name: "send-invites",
	description:
		"Send invites to guests for an event. Sends email and SMS if phone is linked.",
	inputSchema: {
		event_id: z.string().describe("Event ID (e.g. evt-...)"),
		guests: z
			.array(inviteGuestSchema)
			.describe("Array of guest objects with email and optional message"),
	},
	returns: "Confirmation of sent invites",
} as const;

export function registerSendInvites(client: LumaClient, server: McpServer) {
	server.registerTool(
		sendInvitesDefinition.name,
		{
			description: sendInvitesDefinition.description,
			inputSchema: sendInvitesDefinition.inputSchema,
		},
		async (args: SendInvitesInput) => {
			const data = await client.request("POST", "/v1/event/send-invites", {
				event_id: args.event_id,
				guests: args.guests,
			});
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
