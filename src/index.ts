#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { LumaClient } from "./luma-client.js";
import { registerAddGuests } from "./tools/add-guests.js";
import { registerCreateCoupon } from "./tools/create-coupon.js";
import { registerCreateEvent } from "./tools/create-event.js";
import { registerCreateTicketType } from "./tools/create-ticket-type.js";
import { registerGetCalendar } from "./tools/get-calendar.js";
import { registerGetEvent } from "./tools/get-event.js";
import { registerGetGuest } from "./tools/get-guest.js";
import { registerListCoupons } from "./tools/list-coupons.js";
import { registerListEvents } from "./tools/list-events.js";
import { registerListGuests } from "./tools/list-guests.js";
import { registerListTicketTypes } from "./tools/list-ticket-types.js";
import { registerSendInvites } from "./tools/send-invites.js";
import { registerUpdateEvent } from "./tools/update-event.js";
import { registerUpdateGuestStatus } from "./tools/update-guest-status.js";

const server = new McpServer({
	name: "luma-events-mcp",
	version: "0.1.0",
});

async function main() {
	const apiKey = process.env.LUMA_API_KEY;
	if (!apiKey) {
		console.error("Missing LUMA_API_KEY environment variable");
		process.exit(1);
	}

	const client = new LumaClient(apiKey);

	try {
		await client.testConnection();
	} catch (error) {
		console.error("Failed to connect to Luma API:", error);
		process.exit(1);
	}

	registerGetCalendar(client, server);
	registerListEvents(client, server);
	registerGetEvent(client, server);
	registerListGuests(client, server);
	registerGetGuest(client, server);
	registerListTicketTypes(client, server);
	registerCreateEvent(client, server);
	registerUpdateEvent(client, server);
	registerAddGuests(client, server);
	registerUpdateGuestStatus(client, server);
	registerSendInvites(client, server);
	registerCreateTicketType(client, server);
	registerListCoupons(client, server);
	registerCreateCoupon(client, server);

	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main();
