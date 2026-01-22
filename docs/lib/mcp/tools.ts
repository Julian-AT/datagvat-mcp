/**
 * MCP to AI SDK Tool Converter
 *
 * Converts MCP tool definitions to Vercel AI SDK tool format with Zod schema validation.
 * Enables seamless integration between MCP server tools and AI SDK streaming chat.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { CoreTool } from 'ai';
import { tool } from 'ai';
import { z } from 'zod';
import { mcpClient } from './client';

/**
 * JSON Schema to Zod type mapping
 *
 * Converts JSON Schema type strings to Zod schema constructors.
 * Handles basic types - complex schemas require manual conversion.
 */
function jsonSchemaTypeToZod(type: string | undefined, nullable = false): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (type) {
    case 'string':
      schema = z.string();
      break;
    case 'number':
      schema = z.number();
      break;
    case 'integer':
      schema = z.number().int();
      break;
    case 'boolean':
      schema = z.boolean();
      break;
    case 'array':
      // Default to array of unknown - should be refined based on items schema
      schema = z.array(z.unknown());
      break;
    case 'object':
      // Default to record of unknown - should be refined based on properties
      schema = z.record(z.unknown());
      break;
    default:
      // Unknown type defaults to any for flexibility
      schema = z.any();
      break;
  }

  return nullable ? schema.nullable() : schema;
}

/**
 * Convert JSON Schema object to Zod schema
 *
 * Handles object schemas with properties and required fields.
 * Supports anyOf patterns for nullable types.
 *
 * @param schema - JSON Schema definition from MCP tool inputSchema
 * @returns Zod schema for validation
 */
function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodObject<z.ZodRawShape> {
  // biome-ignore lint/suspicious/noExplicitAny: JSON Schema properties have dynamic structure
  const properties = schema.properties as Record<string, any> | undefined;
  const required = (schema.required as string[]) ?? [];

  if (!properties) {
    // No properties defined - accept empty object
    return z.object({});
  }

  const zodShape: z.ZodRawShape = {};

  for (const [key, prop] of Object.entries(properties)) {
    const isRequired = required.includes(key);

    // Handle anyOf patterns (e.g., string | null)
    if (prop.anyOf) {
      // Find the non-null type
      // biome-ignore lint/suspicious/noExplicitAny: anyOf array items have dynamic schema structure
      const types = prop.anyOf.map((t: any) => t.type).filter((t: string) => t !== 'null');
      const primaryType = types[0];
      // biome-ignore lint/suspicious/noExplicitAny: anyOf array items have dynamic schema structure
      const isNullable = prop.anyOf.some((t: any) => t.type === 'null');

      const baseSchema = jsonSchemaTypeToZod(primaryType, isNullable);
      zodShape[key] = isRequired ? baseSchema : baseSchema.optional();
    }
    // Handle direct type
    else if (prop.type) {
      const baseSchema = jsonSchemaTypeToZod(prop.type);
      zodShape[key] = isRequired ? baseSchema : baseSchema.optional();
    }
    // Handle array type with items
    else if (prop.type === 'array' && prop.items) {
      const itemSchema = jsonSchemaTypeToZod(prop.items.type);
      const arraySchema = z.array(itemSchema);
      zodShape[key] = isRequired ? arraySchema : arraySchema.optional();
    }
    // Fallback to any
    else {
      zodShape[key] = isRequired ? z.any() : z.any().optional();
    }
  }

  return z.object(zodShape);
}

/**
 * Tool execution result type
 *
 * Either successful result or error with message.
 */
type ToolResult = { error: false; data: unknown } | { error: true; message: string };

/**
 * Convert MCP tools to AI SDK tool format
 *
 * Maps each MCP tool to an AI SDK tool with:
 * - Description from MCP tool
 * - Zod schema converted from JSON Schema inputSchema
 * - Execute function that calls mcpClient.callTool()
 *
 * Error handling: Returns structured error objects instead of throwing to prevent
 * breaking the streaming response.
 *
 * @param mcpTools - Array of MCP tool definitions from listTools()
 * @returns Record mapping tool names to AI SDK CoreTool instances
 *
 * @example
 * ```typescript
 * const mcpTools = await mcpClient.listTools();
 * const aiTools = convertMCPTools(mcpTools);
 *
 * const result = streamText({
 *   model: openaiCompatible('claude-3-5-sonnet'),
 *   tools: aiTools,
 *   messages,
 * });
 * ```
 */
export function convertMCPTools(mcpTools: Tool[]): Record<string, CoreTool> {
  const tools: Record<string, CoreTool> = {};

  for (const mcpTool of mcpTools) {
    const { name, description, inputSchema } = mcpTool;

    // Convert JSON Schema to Zod
    const zodSchema = jsonSchemaToZod(inputSchema as Record<string, unknown>);

    // Create AI SDK tool wrapper
    tools[name] = tool({
      description: description ?? `Call ${name} tool`,
      parameters: zodSchema,
      execute: async (args): Promise<ToolResult> => {
        try {
          // Call MCP tool through client
          const result = await mcpClient.callTool(name, args);

          // Extract content from MCP result
          // MCP returns { content: [...] } where content is array of text/image/resource
          if (result.content && Array.isArray(result.content)) {
            const textContent = result.content
              .filter((c) => c.type === 'text')
              .map((c) => ('text' in c ? c.text : ''))
              .join('\n');

            return {
              error: false,
              data: textContent || result.content,
            };
          }

          // Fallback: return raw result
          return {
            error: false,
            data: result,
          };
        } catch (error) {
          // Return error as result, don't throw (breaks streaming)
          return {
            error: true,
            message: error instanceof Error ? error.message : 'Tool execution failed',
          };
        }
      },
    });
  }

  return tools;
}

/**
 * Initialize AI SDK tools from MCP server
 *
 * Convenience function that lists tools from MCP server and converts them.
 * Use this in API routes to get ready-to-use AI SDK tools.
 *
 * @returns Record of AI SDK tools ready for streamText()
 * @throws {Error} If MCP client connection or tool listing fails
 *
 * @example
 * ```typescript
 * export async function POST(req: Request) {
 *   const tools = await initializeAITools();
 *
 *   const result = streamText({
 *     model: openaiCompatible('claude-3-5-sonnet'),
 *     tools,
 *     messages,
 *   });
 *
 *   return result.toUIMessageStreamResponse();
 * }
 * ```
 */
export async function initializeAITools(): Promise<Record<string, CoreTool>> {
  const mcpTools = await mcpClient.listTools();
  return convertMCPTools(mcpTools);
}
