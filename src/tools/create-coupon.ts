import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type CreateCouponInput = {
	event_id: string;
	code: string;
	discount: Record<string, unknown>;
	remaining_count?: number | undefined;
	valid_start_at?: string | undefined;
	valid_end_at?: string | undefined;
};

export const createCouponDefinition = {
	name: "create-coupon",
	description:
		"Create a coupon for an event. Coupon terms cannot be edited after creation.",
	inputSchema: {
		event_id: z.string().describe("Event ID (e.g. evt-...)"),
		code: z.string().describe("Coupon code (1-20 chars, case-insensitive)"),
		discount: z
			.record(z.string(), z.unknown())
			.describe("Discount object (e.g. { type: 'percent', percent_off: 20 })"),
		remaining_count: z
			.number()
			.optional()
			.describe("Number of uses (0-1000000; use 1000000 for unlimited)"),
		valid_start_at: z.string().optional().describe("Validity start (ISO 8601)"),
		valid_end_at: z.string().optional().describe("Validity end (ISO 8601)"),
	},
	returns: "The created coupon object",
} as const;

export function registerCreateCoupon(client: LumaClient, server: McpServer) {
	server.registerTool(
		createCouponDefinition.name,
		{
			description: createCouponDefinition.description,
			inputSchema: createCouponDefinition.inputSchema,
		},
		async (args: CreateCouponInput) => {
			const body: Record<string, unknown> = {
				event_id: args.event_id,
				code: args.code,
				discount: args.discount,
			};
			if (args.remaining_count !== undefined)
				body.remaining_count = args.remaining_count;
			if (args.valid_start_at !== undefined)
				body.valid_start_at = args.valid_start_at;
			if (args.valid_end_at !== undefined)
				body.valid_end_at = args.valid_end_at;

			const data = await client.request(
				"POST",
				"/v1/event/create-coupon",
				body,
			);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(data) }],
			};
		},
	);
}
