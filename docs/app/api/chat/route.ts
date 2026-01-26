import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { google } from "@ai-sdk/google";
import { createMCPClient } from '@ai-sdk/mcp';

export const maxDuration = 60;

const mcpClient = await createMCPClient({
    transport: {
        type: 'http',
        url: 'https://data-gv-at.fastmcp.app/mcp',
        headers: { Authorization: 'Bearer fmcp_3Zu1SNSprZ1MRhX6GzPxICQme9aAUhrXMmqqZt6UusQ' },
    },
});

const tools = await mcpClient.tools()

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
        model: google("gemini-2.5-flash"),
        messages: await convertToModelMessages(messages),
        tools: tools,
    });

    return result.toUIMessageStreamResponse({
        sendSources: true,
        sendReasoning: true,
    });
}