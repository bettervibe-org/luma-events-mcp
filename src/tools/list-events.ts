import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type ListEventsInput = {
	after?: string | undefined;
	before?: string | undefined;
	pagination_limit?: number | undefined;
	pagination_cursor?: string | undefined;
};

export const listEventsDefinition = {
	name: "list-events",
	description:
		"List events for the calendar. Optionally filter by date range. Without pagination params, returns all events; with them, returns one page.",
	inputSchema: {
		after: z
			.string()
			.optional()
			.describe("Only events starting after this ISO 8601 datetime"),
		before: z
			.string()
			.optional()
			.describe("Only events starting before this ISO 8601 datetime"),
		pagination_limit: z.number().optional().describe("Page size (max 50)"),
		pagination_cursor: z
			.string()
			.optional()
			.describe("Cursor from a previous page"),
	},
	returns: "Array of event objects, or paginated result with next_cursor",
} as const;

export function registerListEvents(client: LumaClient, server: McpServer) {
	server.registerTool(
		listEventsDefinition.name,
		{
			description: listEventsDefinition.description,
			inputSchema: listEventsDefinition.inputSchema,
		},
		async (args: ListEventsInput) => {
			const params: Record<string, string> = {};
			if (args.after) params.after = args.after;
			if (args.before) params.before = args.before;

			const usePagination =
				args.pagination_limit !== undefined ||
				args.pagination_cursor !== undefined;

			if (usePagination) {
				const result = await client.paginateSingle(
					"/v1/calendar/list-events",
					params,
					args.pagination_limit,
					args.pagination_cursor,
				);
				return {
					content: [{ type: "text" as const, text: JSON.stringify(result) }],
				};
			}

			const entries = await client.paginate("/v1/calendar/list-events", params);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(entries) }],
			};
		},
	);
}
