import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type UpdateEventInput = {
	event_id: string;
	suppress_notifications?: boolean | undefined;
	name?: string | undefined;
	start_at?: string | undefined;
	end_at?: string | undefined;
	timezone?: string | undefined;
	description_md?: string | undefined;
	meeting_url?: string | undefined;
	cover_url?: string | undefined;
	visibility?: string | undefined;
	max_capacity?: number | undefined;
};

export const updateEventDefinition = {
	name: "update-event",
	description: "Update an existing event. Only provided fields are changed.",
	inputSchema: {
		event_id: z.string().describe("Event ID (e.g. evt-...)"),
		suppress_notifications: z
			.boolean()
			.optional()
			.describe("Prevent guest notifications for name/time/location changes"),
		name: z.string().optional().describe("Event title"),
		start_at: z
			.string()
			.datetime({ offset: true })
			.optional()
			.describe("Start datetime (ISO 8601)"),
		end_at: z
			.string()
			.datetime({ offset: true })
			.optional()
			.describe("End datetime (ISO 8601)"),
		timezone: z.string().optional().describe("IANA timezone"),
		description_md: z
			.string()
			.optional()
			.describe("Event description in markdown"),
		meeting_url: z.string().optional().describe("Virtual event URL"),
		cover_url: z.string().optional().describe("Cover image URL"),
		visibility: z
			.enum(["public", "members-only", "private"])
			.optional()
			.describe("Event visibility"),
		max_capacity: z.number().optional().describe("Maximum attendee capacity"),
	},
	returns: "The updated event object",
} as const;

export function registerUpdateEvent(client: LumaClient, server: McpServer) {
	server.registerTool(
		updateEventDefinition.name,
		{
			description: updateEventDefinition.description,
			inputSchema: updateEventDefinition.inputSchema,
		},
		async (args: UpdateEventInput) => {
			const body: Record<string, unknown> = { event_id: args.event_id };
			if (args.suppress_notifications !== undefined)
				body.suppress_notifications = args.suppress_notifications;
			if (args.name !== undefined) body.name = args.name;
			if (args.start_at !== undefined) body.start_at = args.start_at;
			if (args.end_at !== undefined) body.end_at = args.end_at;
			if (args.timezone !== undefined) body.timezone = args.timezone;
			if (args.description_md !== undefined)
				body.description_md = args.description_md;
			if (args.meeting_url !== undefined) body.meeting_url = args.meeting_url;
			if (args.cover_url !== undefined) body.cover_url = args.cover_url;
			if (args.visibility !== undefined) body.visibility = args.visibility;
			if (args.max_capacity !== undefined)
				body.max_capacity = args.max_capacity;

			const data = await client.request("POST", "/v1/event/update", body);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
