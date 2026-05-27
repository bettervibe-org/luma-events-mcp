import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type ListCouponsInput = {
	event_id: string;
	pagination_limit?: number | undefined;
	pagination_cursor?: string | undefined;
};

export const listCouponsDefinition = {
	name: "list-coupons",
	description:
		"List all coupons for an event. Without pagination params, returns all coupons; with them, returns one page.",
	inputSchema: {
		event_id: z.string().describe("Event ID (e.g. evt-...)"),
		pagination_limit: z.number().optional().describe("Page size"),
		pagination_cursor: z
			.string()
			.optional()
			.describe("Cursor from a previous page"),
	},
	returns: "Array of coupon objects, or paginated result with next_cursor",
} as const;

export function registerListCoupons(client: LumaClient, server: McpServer) {
	server.registerTool(
		listCouponsDefinition.name,
		{
			description: listCouponsDefinition.description,
			inputSchema: listCouponsDefinition.inputSchema,
		},
		async (args: ListCouponsInput) => {
			const params: Record<string, string> = { event_id: args.event_id };

			const usePagination =
				args.pagination_limit !== undefined ||
				args.pagination_cursor !== undefined;

			if (usePagination) {
				const result = await client.paginateSingle(
					"/v1/event/coupons",
					params,
					args.pagination_limit,
					args.pagination_cursor,
				);
				return {
					content: [{ type: "text" as const, text: JSON.stringify(result) }],
				};
			}

			const entries = await client.paginate("/v1/event/coupons", params);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(entries) }],
			};
		},
	);
}
