import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { getToolPaths } from './paths';
import type { DetectionResult, ToolName, Platform, ToolInfo } from './types';

export async function detectTools(): Promise<DetectionResult> {
  const platform = os.platform() as Platform;
  const toolPaths = getToolPaths(platform);
  const tools: ToolInfo[] = [];

  for (const [toolName, configPath] of Object.entries(toolPaths) as [ToolName, string][]) {
    let detected = false;

    try {
      // Check if config file exists OR if parent directory exists
      if (fs.existsSync(configPath)) {
        detected = true;
      } else {
        const parentDir = path.dirname(configPath);
        if (fs.existsSync(parentDir)) {
          detected = true;
        }
      }
    } catch (error) {
      // Gracefully handle errors (missing permissions, etc.)
      detected = false;
    }

    tools.push({
      name: toolName,
      configPath,
      detected
    });
  }

  return {
    tools,
    platform
  };
}
