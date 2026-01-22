import { z } from 'zod';

/**
 * Valid tool names for configuration
 */
export const ToolNameSchema = z.enum(['claude-desktop', 'continue', 'cline'], {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return {
        message: `Expected: claude-desktop, continue, or cline. Got: ${ctx.data}`
      };
    }
    return { message: ctx.defaultError };
  }
});

/**
 * Tool selection must include at least one tool
 */
export const ToolSelectionSchema = z
  .array(ToolNameSchema)
  .min(1, 'Tool selection cannot be empty. Select at least one tool to configure.');

/**
 * Configuration file path validation
 */
export const ConfigPathSchema = z
  .string()
  .min(1, 'Configuration path cannot be empty')
  .refine(
    (path) => {
      // Check for invalid characters in file paths
      const invalidChars = /[<>:"|?*\x00-\x1F]/;
      return !invalidChars.test(path);
    },
    {
      message: 'Configuration path contains invalid characters. Path must be a valid file system path.'
    }
  );

/**
 * Options for the init command
 */
export const InitOptionsSchema = z.object({
  yes: z.boolean().optional(),
  tool: ToolNameSchema.optional()
});

/**
 * Infer TypeScript types from schemas
 */
export type ToolNameType = z.infer<typeof ToolNameSchema>;
export type ToolSelectionType = z.infer<typeof ToolSelectionSchema>;
export type ConfigPathType = z.infer<typeof ConfigPathSchema>;
export type InitOptionsType = z.infer<typeof InitOptionsSchema>;
