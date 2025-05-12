import { z } from 'zod';

/**
 * Validation schema for the POST /api/generations endpoint.
 * Ensures that source_text meets length requirements (1000-10000 characters).
 */
export const generateFlashcardsSchema = z.object({
  source_text: z
    .string({
      required_error: 'Source text is required',
    })
    .min(1000, 'Source text must be at least 1000 characters long')
    .max(10000, 'Source text must not exceed 10000 characters'),
});

// Type inference from the schema for TypeScript type safety
export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
