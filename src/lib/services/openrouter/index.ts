import { OpenRouterService } from './openrouter.service';
import { SCHEMAS } from './schemas';
import type { OpenRouterConfig } from './types';

// Re-export error types
export * from './errors';

// Re-export types
export type * from './types';

/**
 * Creates a new instance of the OpenRouter service with the specified configuration.
 * 
 * This service provides an interface to generate educational flashcards and other
 * content using various AI models from OpenRouter.
 * 
 * @param config - Optional configuration for the service
 * @returns An initialized OpenRouterService instance
 * 
 * @example
 * ```typescript
 * // Basic usage
 * import { createOpenRouterService } from '@/lib/services/openrouter';
 * 
 * const openRouter = createOpenRouterService();
 * 
 * // Simple request
 * const response = await openRouter.chat({
 *   userMessage: "Create a flashcard about photosynthesis"
 * });
 * 
 * console.log(response.content);
 * ```
 * 
 * @example
 * ```typescript
 * // Using with structured formats
 * import { createOpenRouterService, SCHEMAS } from '@/lib/services/openrouter';
 * 
 * const openRouter = createOpenRouterService();
 * 
 * // Get a structured flashcard
 * const response = await openRouter.chat({
 *   userMessage: "Create a flashcard about photosynthesis",
 *   responseFormat: SCHEMAS.FLASHCARD,
 *   model: "anthropic/claude-3-opus-20240229",
 *   parameters: {
 *     temperature: 0.3,
 *     max_tokens: 500
 *   }
 * });
 * 
 * const flashcard = response.content as FlashcardContent;
 * console.log(`Front: ${flashcard.front}`);
 * console.log(`Back: ${flashcard.back}`);
 * ```
 * 
 * @example
 * ```typescript
 * // Streaming response
 * import { createOpenRouterService } from '@/lib/services/openrouter';
 * 
 * const openRouter = createOpenRouterService();
 * 
 * // Get a streaming response
 * const stream = await openRouter.stream({
 *   systemMessage: "You are an educational assistant creating flashcards.",
 *   userMessage: "Create a detailed flashcard about DNA replication"
 * });
 * 
 * // Process the stream
 * for await (const chunk of stream) {
 *   console.log(chunk.content);
 *   if (chunk.done) break;
 * }
 * ```
 */
export function createOpenRouterService(config?: OpenRouterConfig): OpenRouterService {
  return new OpenRouterService(config);
}

/**
 * Predefined JSON schemas for structured AI responses.
 * Contains ready-to-use schemas for educational content like:
 * - FLASHCARD: For creating educational flashcards
 * - MULTIPLE_CHOICE: For multiple choice questions
 * - TRUE_FALSE: For true/false questions
 * - FILL_IN_BLANK: For fill-in-the-blank exercises
 * - MATCHING: For matching exercises
 * 
 * @example
 * ```typescript
 * import { createOpenRouterService, SCHEMAS } from '@/lib/services/openrouter';
 * 
 * const openRouter = createOpenRouterService();
 * const response = await openRouter.chat({
 *   userMessage: "Create a multiple choice question about the solar system",
 *   responseFormat: SCHEMAS.MULTIPLE_CHOICE
 * });
 * ```
 */
export { SCHEMAS };

/**
 * Main OpenRouter service class.
 * For most use cases, use the createOpenRouterService factory function instead.
 * Direct access to the class is provided for advanced customization scenarios.
 */
export { OpenRouterService }; 