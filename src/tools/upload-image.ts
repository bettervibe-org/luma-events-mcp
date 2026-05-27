import { readFile } from "node:fs/promises";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LumaClient } from "../luma-client.js";

type UploadImageInput = {
	file_path: string;
	purpose: string;
	content_type?: string | undefined;
};

type CreateUploadUrlResponse = {
	upload_url: string;
	file_url: string;
};

export const uploadImageDefinition = {
	name: "upload-image",
	description:
		"Upload a local image file to Luma's CDN and return the final URL. Reads the file from disk, obtains a presigned upload URL, PUTs the binary, and returns the CDN URL.",
	inputSchema: {
		file_path: z
			.string()
			.describe("Absolute path to the local image file to upload"),
		purpose: z
			.string()
			.describe('Upload purpose (e.g. "event-cover", "avatar")'),
		content_type: z
			.string()
			.optional()
			.describe('MIME type of the image (default: "image/png")'),
	},
	returns: "The Luma CDN URL for the uploaded image",
} as const;

export function registerUploadImage(client: LumaClient, server: McpServer) {
	server.registerTool(
		uploadImageDefinition.name,
		{
			description: uploadImageDefinition.description,
			inputSchema: uploadImageDefinition.inputSchema,
		},
		async (args: UploadImageInput) => {
			const contentType = args.content_type ?? "image/png";

			const fileBuffer = await readFile(args.file_path);

			const { upload_url, file_url } =
				await client.request<CreateUploadUrlResponse>(
					"POST",
					"/v1/images/create-upload-url",
					{ purpose: args.purpose, content_type: contentType },
				);

			const putRes = await fetch(upload_url, {
				method: "PUT",
				headers: { "Content-Type": contentType },
				body: fileBuffer,
			});

			if (!putRes.ok) {
				const body = await putRes.text();
				throw new Error(`Image upload failed (${putRes.status}): ${body}`);
			}

			return {
				content: [
					{ type: "text" as const, text: JSON.stringify({ file_url }) },
				],
			};
		},
	);
}
