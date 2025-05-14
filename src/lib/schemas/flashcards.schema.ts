import { z } from 'zod';
import type { FlashcardSource } from '../../types';

export const flashcardsQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  source: z.enum(['ai-full', 'ai-edited', 'manual'] as const).optional(),
  sort: z.enum(['created_at', 'updated_at', 'id'] as const).default('created_at'),
  order: z.enum(['asc', 'desc'] as const).default('desc')
});

export type FlashcardsQuerySchemaType = z.infer<typeof flashcardsQuerySchema>;
