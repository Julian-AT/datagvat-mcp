import { z } from 'zod';

export const pageFeedback = z.object({
  url: z.string(),
  opinion: z.enum(['positive', 'negative']),
  message: z.string().optional(),
});

export type PageFeedback = z.infer<typeof pageFeedback>;

export const blockFeedback = z.object({
  url: z.string(),
  blockId: z.string(),
  blockBody: z.string().optional(),
  message: z.string(),
});

export type BlockFeedback = z.infer<typeof blockFeedback>;

export interface ActionResponse {
  githubUrl?: string;
}
