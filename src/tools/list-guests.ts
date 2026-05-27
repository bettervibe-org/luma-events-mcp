import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type ListGuestsInput = {
	event_id: string;
	approval_status?: string | undefined;
	sort_column?: string | undefined;
	pagination_limit?: number | undefined;
	pagination_cursor?: string | undefined;
};

export const listGuestsDefinition = {
	name: "list-guests",
	description:
		"List guests for an event. Without pagination params, returns all guests; with them, returns one page.",
	inputSchema: {
		event_id: z.string().describe("Event ID (e.g. evt-...)"),
		approval_status: z
			.enum([
				"approved",
				"session",
				"pending_approval",
				"invited",
				"declined",
				"waitlist",
			])
			.optional()
			.describe("Filter by approval status"),
		sort_column: z
			.enum(["name", "email", "created_at", "registered_at", "checked_in_at"])
			.optional()
			.describe("Sort column"),
		pagination_limit: z.number().optional().describe("Page size"),
		pagination_cursor: z
			.string()
			.optional()
			.describe("Cursor from a previous page"),
	},
	returns: "Array of guest objects, or paginated result with next_cursor",
} as const;

export function registerListGuests(client: LumaClient, server: McpServer) {
	server.registerTool(
		listGuestsDefinition.name,
		{
			description: listGuestsDefinition.description,
			inputSchema: listGuestsDefinition.inputSchema,
		},
		async (args: ListGuestsInput) => {
			const params: Record<string, string> = {
				event_id: args.event_id,
			};
			if (args.approval_status) params.approval_status = args.approval_status;
			if (args.sort_column) params.sort_column = args.sort_column;

			const usePagination =
				args.pagination_limit !== undefined ||
				args.pagination_cursor !== undefined;

			if (usePagination) {
				const result = await client.paginateSingle(
					"/v1/event/get-guests",
					params,
					args.pagination_limit,
					args.pagination_cursor,
				);
				return {
					content: [{ type: "text" as const, text: JSON.stringify(result) }],
				};
			}

			const entries = await client.paginate("/v1/event/get-guests", params);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(entries) }],
			};
		},
	);
}
