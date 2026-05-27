import { beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("@modelcontextprotocol/sdk/server/mcp.js");
vi.mock("@modelcontextprotocol/sdk/server/stdio.js");
vi.mock("./luma-client.js", () => {
	class MockLumaClient {
		testConnection = vi.fn().mockResolvedValue(undefined);
	}
	return { LumaClient: MockLumaClient, LumaApiError: class extends Error {} };
});
vi.mock("./tools/get-calendar.js");
vi.mock("./tools/list-events.js");
vi.mock("./tools/get-event.js");
vi.mock("./tools/list-guests.js");
vi.mock("./tools/get-guest.js");
vi.mock("./tools/list-ticket-types.js");
vi.mock("./tools/create-event.js");
vi.mock("./tools/update-event.js");
vi.mock("./tools/add-guests.js");
vi.mock("./tools/update-guest-status.js");
vi.mock("./tools/send-invites.js");
vi.mock("./tools/create-ticket-type.js");
vi.mock("./tools/list-coupons.js");
vi.mock("./tools/create-coupon.js");

describe("MCP Server Console Output", () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeAll(async () => {
		process.env.LUMA_API_KEY = "test-key";

		consoleLogSpy = vi
			.spyOn(console, "log")
			.mockImplementation(() => undefined);
		consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		vi.spyOn(process, "exit").mockImplementation(() => {
			return undefined as never;
		});

		const { McpServer } = await import(
			"@modelcontextprotocol/sdk/server/mcp.js"
		);
		class MockMcpServer {
			registerTool = vi.fn();
			connect = vi.fn().mockResolvedValue(undefined);
		}
		vi.mocked(McpServer).mockImplementation(
			MockMcpServer as unknown as typeof McpServer,
		);

		const { StdioServerTransport } = await import(
			"@modelcontextprotocol/sdk/server/stdio.js"
		);
		class MockStdioServerTransport {}
		vi.mocked(StdioServerTransport).mockImplementation(
			MockStdioServerTransport as unknown as typeof StdioServerTransport,
		);

		const tools = await Promise.all([
			import("./tools/get-calendar.js"),
			import("./tools/list-events.js"),
			import("./tools/get-event.js"),
			import("./tools/list-guests.js"),
			import("./tools/get-guest.js"),
			import("./tools/list-ticket-types.js"),
			import("./tools/create-event.js"),
			import("./tools/update-event.js"),
			import("./tools/add-guests.js"),
			import("./tools/update-guest-status.js"),
			import("./tools/send-invites.js"),
			import("./tools/create-ticket-type.js"),
			import("./tools/list-coupons.js"),
			import("./tools/create-coupon.js"),
		]);
		for (const mod of tools) {
			for (const fn of Object.values(mod)) {
				if (typeof fn === "function")
					vi.mocked(fn).mockImplementation(() => undefined);
			}
		}

		await import("./index.js");
		await new Promise((resolve) => setTimeout(resolve, 100));
	});

	test("should not write to console in success case", () => {
		expect(consoleLogSpy).not.toHaveBeenCalled();
		expect(consoleErrorSpy).not.toHaveBeenCalled();
	});
});
