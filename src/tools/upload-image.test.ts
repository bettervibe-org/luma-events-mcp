import { readFile } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test, vi } from "vitest";
import type { LumaClient } from "../luma-client.js";
import { registerUploadImage } from "./upload-image.js";

vi.mock("node:fs/promises", () => ({
	readFile: vi.fn(),
}));

type ToolHandler = (params: Record<string, unknown>) => Promise<{
	content: { type: string; text: string }[];
}>;

describe("registerUploadImage", () => {
	function setup() {
		const mockClient = { request: vi.fn() };
		let handler: ToolHandler | null = null;
		const server = new McpServer({ name: "test", version: "0.1.0" });
		const orig = server.registerTool.bind(server);
		server.registerTool = vi.fn((n: string, c: unknown, h: ToolHandler) => {
			if (n === "upload-image") handler = h;
			return orig(n, c, h);
		}) as typeof server.registerTool;

		registerUploadImage(mockClient as unknown as LumaClient, server);
		return { mockClient, handler: handler!, server };
	}

	test("uploads image and returns CDN URL", async () => {
		const { mockClient, handler } = setup();
		const fileData = Buffer.from("fake-png-data");

		vi.mocked(readFile).mockResolvedValue(fileData);
		mockClient.request.mockResolvedValue({
			upload_url: "https://storage.example.com/presigned",
			file_url: "https://cdn.lu.ma/images/abc123.png",
		});

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			text: vi.fn().mockResolvedValue(""),
		});
		vi.stubGlobal("fetch", mockFetch);

		const result = await handler({
			file_path: "/tmp/cover.png",
			purpose: "event-cover",
		});

		expect(JSON.parse(result.content[0].text)).toEqual({
			file_url: "https://cdn.lu.ma/images/abc123.png",
		});

		expect(readFile).toHaveBeenCalledWith("/tmp/cover.png");
		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/images/create-upload-url",
			{ purpose: "event-cover", content_type: "image/png" },
		);
		expect(mockFetch).toHaveBeenCalledWith(
			"https://storage.example.com/presigned",
			{
				method: "PUT",
				headers: { "Content-Type": "image/png" },
				body: fileData,
			},
		);

		vi.unstubAllGlobals();
	});

	test("uses custom content_type when provided", async () => {
		const { mockClient, handler } = setup();

		vi.mocked(readFile).mockResolvedValue(Buffer.from("jpeg-data"));
		mockClient.request.mockResolvedValue({
			upload_url: "https://storage.example.com/presigned",
			file_url: "https://cdn.lu.ma/images/abc123.jpg",
		});

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			text: vi.fn().mockResolvedValue(""),
		});
		vi.stubGlobal("fetch", mockFetch);

		await handler({
			file_path: "/tmp/photo.jpg",
			purpose: "event-cover",
			content_type: "image/jpeg",
		});

		expect(mockClient.request).toHaveBeenCalledWith(
			"POST",
			"/v1/images/create-upload-url",
			{ purpose: "event-cover", content_type: "image/jpeg" },
		);
		expect(mockFetch).toHaveBeenCalledWith(
			"https://storage.example.com/presigned",
			expect.objectContaining({
				headers: { "Content-Type": "image/jpeg" },
			}),
		);

		vi.unstubAllGlobals();
	});

	test("throws when PUT to upload URL fails", async () => {
		const { mockClient, handler } = setup();

		vi.mocked(readFile).mockResolvedValue(Buffer.from("data"));
		mockClient.request.mockResolvedValue({
			upload_url: "https://storage.example.com/presigned",
			file_url: "https://cdn.lu.ma/images/abc123.png",
		});

		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 403,
			text: vi.fn().mockResolvedValue("Forbidden"),
		});
		vi.stubGlobal("fetch", mockFetch);

		await expect(
			handler({ file_path: "/tmp/cover.png", purpose: "event-cover" }),
		).rejects.toThrow("Image upload failed (403): Forbidden");

		vi.unstubAllGlobals();
	});
});
