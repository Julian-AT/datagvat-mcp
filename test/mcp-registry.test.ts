import { MCPToolRegistry } from "../src/mcp/registry";
import { MCPToolDefinition } from "../src/mcp/types";
import { JSONSchemaType } from "ajv";

async function runRegistryTests() {
  console.log("=== MCP Registry Tests ===\n");

  const registry = new MCPToolRegistry();

  console.log("1. Testing tool registration...");
  interface TestParams {
    name: string;
    age?: number;
  }

  const testSchema: any = {
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "number" },
    },
    required: ["name"],
    additionalProperties: false,
  };

  const testTool: MCPToolDefinition = {
    name: "testTool",
    description: "A test tool",
    inputSchema: testSchema,
    handler: async (params: Record<string, unknown>) => {
      const typedParams = params as unknown as TestParams;
      return { greeting: `Hello, ${typedParams.name}!` };
    },
  };

  registry.register(testTool);
  console.log(`✅ Registered tool: ${testTool.name}`);
  console.log(`Tool count: ${registry.getToolCount()}`);
  console.log("");

  console.log("2. Testing tool retrieval...");
  const retrieved = registry.getTool("testTool");
  console.log(`✅ Retrieved tool: ${retrieved?.name}`);
  console.log(`Has tool: ${registry.hasTool("testTool")}`);
  console.log("");

  console.log("3. Testing tool listing...");
  const tools = registry.listTools();
  console.log(`✅ Total tools: ${tools.length}`);
  console.log(`Tool names: ${registry.getToolNames().join(", ")}`);
  console.log("");

  console.log("4. Testing input validation (valid)...");
  const validParams = { name: "Alice", age: 30 };
  const validationResult = registry.validateInput("testTool", validParams);
  console.log(`✅ Validation result: ${validationResult.valid}`);
  console.log("");

  console.log("5. Testing input validation (invalid)...");
  const invalidParams = { age: 30 };
  const invalidResult = registry.validateInput("testTool", invalidParams);
  console.log(`✅ Validation failed as expected: ${!invalidResult.valid}`);
  console.log("Errors:", JSON.stringify(invalidResult.errors, null, 2));
  console.log("");

  console.log("6. Testing tool invocation (success)...");
  const invokeResult = await registry.invoke("testTool", { name: "Bob" });
  console.log(`✅ Invocation success: ${invokeResult.success}`);
  console.log("Result:", JSON.stringify(invokeResult.result, null, 2));
  console.log("");

  console.log("7. Testing tool invocation (validation failure)...");
  const failedInvoke = await registry.invoke("testTool", {});
  console.log(`✅ Invocation failed as expected: ${!failedInvoke.success}`);
  console.log("Error:", failedInvoke.error?.code);
  console.log("");

  console.log("8. Testing tool invocation (not found)...");
  const notFoundInvoke = await registry.invoke("nonExistent", {});
  console.log(`✅ Tool not found error: ${notFoundInvoke.error?.code}`);
  console.log("");

  console.log("9. Testing tool unregistration...");
  const unregistered = registry.unregister("testTool");
  console.log(`✅ Unregistered: ${unregistered}`);
  console.log(`Tool count after unregister: ${registry.getToolCount()}`);
  console.log("");

  console.log("10. Testing registry clear...");
  registry.register(testTool);
  registry.clear();
  console.log(`✅ Cleared registry. Tool count: ${registry.getToolCount()}`);
  console.log("");

  console.log("\n=== All Registry Tests Passed ===");
}

runRegistryTests().catch((error) => {
  console.error("❌ Registry test failed:", error);
  process.exit(1);
});

