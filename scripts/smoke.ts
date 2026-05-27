#!/usr/bin/env tsx
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type ToolResult = {
	content: Array<{ type: string; text: string }>;
	isError?: boolean;
};

function unwrapText(result: unknown): string {
	const r = result as ToolResult;
	const first = r.content?.[0];
	if (!first || first.type !== "text") {
		throw new Error(`Unexpected tool result shape: ${JSON.stringify(result)}`);
	}
	if (r.isError) {
		throw new Error(`Tool returned error: ${first.text}`);
	}
	return first.text;
}

function log(step: string, detail?: unknown) {
	const suffix =
		detail === undefined
			? ""
			: ` ${typeof detail === "string" ? detail : JSON.stringify(detail)}`;
	console.log(`▶ ${step}${suffix}`);
}

async function main() {
	function requireEnv(name: string): string {
		const value = process.env[name];
		if (!value) {
			console.error(`Missing env var: ${name}`);
			process.exit(1);
		}
		return value;
	}

	const transport = new StdioClientTransport({
		command: "node",
		args: ["dist/index.js"],
		env: {
			PATH: process.env.PATH ?? "",
			LUMA_API_KEY: requireEnv("LUMA_API_KEY"),
			...(process.env.LUMA_BASE_URL && {
				LUMA_BASE_URL: process.env.LUMA_BASE_URL,
			}),
		},
		stderr: "inherit",
	});

	const client = new Client({
		name: "luma-events-mcp-smoke",
		version: "0.0.0",
	});
	await client.connect(transport);
	log("connected to server");

	const { tools } = await client.listTools();
	const toolNames = tools.map((t) => t.name).sort();
	log("tools registered", toolNames);

	const expected = [
		"add-guests",
		"create-coupon",
		"create-event",
		"create-ticket-type",
		"get-calendar",
		"get-event",
		"get-guest",
		"list-coupons",
		"list-events",
		"list-guests",
		"list-ticket-types",
		"send-invites",
		"update-event",
		"update-guest-status",
	];
	for (const name of expected) {
		if (!toolNames.includes(name)) throw new Error(`Missing tool: ${name}`);
	}

	const calendarRaw = unwrapText(
		await client.callTool({ name: "get-calendar", arguments: {} }),
	);
	const calendar = JSON.parse(calendarRaw);
	log("get-calendar", calendar);

	const eventsRaw = unwrapText(
		await client.callTool({
			name: "list-events",
			arguments: {},
		}),
	);
	const events = JSON.parse(eventsRaw) as Array<{ id: string; name: string }>;
	log("list-events", `${events.length} events`);

	if (events.length > 0) {
		const firstEvent = events[0]!;
		const eventRaw = unwrapText(
			await client.callTool({
				name: "get-event",
				arguments: { event_id: firstEvent.id },
			}),
		);
		log("get-event", JSON.parse(eventRaw).event?.name ?? firstEvent.id);

		const guestsRaw = unwrapText(
			await client.callTool({
				name: "list-guests",
				arguments: { event_id: firstEvent.id },
			}),
		);
		const guests = JSON.parse(guestsRaw);
		log("list-guests", `${Array.isArray(guests) ? guests.length : "?"} guests`);

		const ticketsRaw = unwrapText(
			await client.callTool({
				name: "list-ticket-types",
				arguments: { event_id: firstEvent.id },
			}),
		);
		log("list-ticket-types", JSON.parse(ticketsRaw));
	}

	await client.close();
	console.log("\n✅ smoke test passed");
}

main().catch((err) => {
	console.error("\n❌ smoke test failed:", err);
	process.exit(1);
});
