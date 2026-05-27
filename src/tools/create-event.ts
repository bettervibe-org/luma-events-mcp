import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type CreateEventInput = {
	name: string;
	start_at: string;
	timezone: string;
	end_at?: string | undefined;
	description_md?: string | undefined;
	meeting_url?: string | undefined;
	geo_address_json?: Record<string, unknown> | undefined;
	geo_latitude?: number | undefined;
	geo_longitude?: number | undefined;
	cover_url?: string | undefined;
	visibility?: string | undefined;
	max_capacity?: number | undefined;
};

export const createEventDefinition = {
	name: "create-event",
	description: "Create a new event on the calendar",
	inputSchema: {
		name: z.string().describe("Event title"),
		start_at: z
			.string()
			.datetime({ offset: true })
			.describe("Start datetime (ISO 8601)"),
		timezone: z.string().describe("IANA timezone (e.g. America/New_York)"),
		end_at: z
			.string()
			.datetime({ offset: true })
			.optional()
			.describe("End datetime (ISO 8601)"),
		description_md: z
			.string()
			.optional()
			.describe("Event description in markdown"),
		meeting_url: z.string().optional().describe("Virtual event URL"),
		geo_address_json: z
			.record(z.string(), z.unknown())
			.optional()
			.describe("Address object with city, place, etc."),
		geo_latitude: z.number().optional().describe("Latitude"),
		geo_longitude: z.number().optional().describe("Longitude"),
		cover_url: z
			.string()
			.optional()
			.describe("Cover image URL (must be Luma CDN)"),
		visibility: z
			.enum(["public", "members-only", "private"])
			.optional()
			.describe("Event visibility"),
		max_capacity: z.number().optional().describe("Maximum attendee capacity"),
	},
	returns: "The created event object",
} as const;

export function registerCreateEvent(client: LumaClient, server: McpServer) {
	server.registerTool(
		createEventDefinition.name,
		{
			description: createEventDefinition.description,
			inputSchema: createEventDefinition.inputSchema,
		},
		async (args: CreateEventInput) => {
			const body: Record<string, unknown> = {
				name: args.name,
				start_at: args.start_at,
				timezone: args.timezone,
			};
			if (args.end_at !== undefined) body.end_at = args.end_at;
			if (args.description_md !== undefined)
				body.description_md = args.description_md;
			if (args.meeting_url !== undefined) body.meeting_url = args.meeting_url;
			if (args.geo_address_json !== undefined)
				body.geo_address_json = args.geo_address_json;
			if (args.geo_latitude !== undefined)
				body.coordinate = {
					latitude: args.geo_latitude,
					longitude: args.geo_longitude,
				};
			if (args.cover_url !== undefined) body.cover_url = args.cover_url;
			if (args.visibility !== undefined) body.visibility = args.visibility;
			if (args.max_capacity !== undefined)
				body.max_capacity = args.max_capacity;

			const data = await client.request("POST", "/v1/event/create", body);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
