import type { ResponseFormat, SchemaOptions } from './types';

/**
 * Creates a JSON schema format for structured LLM responses.
 * This function configures the response format for OpenRouter API to return
 * responses that conform to the provided JSON schema structure.
 *
 * @param schema - The JSON Schema object that defines the expected response structure
 * @param options - Optional configuration for schema validation
 * @param options.name - Optional name for the schema (defaults to 'response')
 * @param options.strict - Whether to enforce strict schema validation (defaults to true)
 * @returns A properly formatted ResponseFormat object for the OpenRouter API
 *
 * @example
 * ```typescript
 * // Create a schema for a simple Q&A format
 * const qaSchema = createJsonSchema({
 *   type: "object",
 *   properties: {
 *     question: { type: "string" },
 *     answer: { type: "string" },
 *     confidence: { type: "number", minimum: 0, maximum: 1 }
 *   },
 *   required: ["question", "answer"]
 * }, { name: "qa_item" });
 *
 * // Use the schema in a request
 * const response = await openRouter.chat({
 *   userMessage: "What is the capital of France?",
 *   responseFormat: qaSchema
 * });
 * ```
 */
export function createJsonSchema(schema: object, options?: SchemaOptions): ResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: options?.name || 'response',
      strict: options?.strict === undefined ? true : options.strict,
      schema,
    },
  };
}

/**
 * Predefined schemas for common educational content formats.
 * These schemas can be used directly with the OpenRouter API to generate
 * structured responses in standardized formats for educational purposes.
 *
 * @example
 * ```typescript
 * // Generate a flashcard about photosynthesis
 * const flashcardResponse = await openRouter.chat({
 *   userMessage: "Create a flashcard about photosynthesis",
 *   responseFormat: SCHEMAS.FLASHCARD
 * });
 *
 * // Generate a multiple choice question about history
 * const mcqResponse = await openRouter.chat({
 *   userMessage: "Create a multiple choice question about World War II",
 *   responseFormat: SCHEMAS.MULTIPLE_CHOICE
 * });
 * ```
 */
export const SCHEMAS = {
  /**
   * Schema for educational flashcards with front, back, difficulty level, and tags.
   *
   * Structure:
   * - front: The question or prompt side of the flashcard
   * - back: The answer or explanation side
   * - difficulty: Optional difficulty rating (1-5)
   * - tags: Optional array of topic tags
   *
   * @example
   * ```typescript
   * const response = await openRouter.chat({
   *   userMessage: "Create a biology flashcard about mitochondria",
   *   responseFormat: SCHEMAS.FLASHCARD
   * });
   *
   * const flashcard = response.content as FlashcardContent;
   * console.log(`Question: ${flashcard.front}`);
   * console.log(`Answer: ${flashcard.back}`);
   * if (flashcard.tags) {
   *   console.log(`Tags: ${flashcard.tags.join(', ')}`);
   * }
   * ```
   */
  FLASHCARD: createJsonSchema(
    {
      type: 'object',
      properties: {
        front: { type: 'string' },
        back: { type: 'string' },
        difficulty: { type: 'integer', minimum: 1, maximum: 5 },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['front', 'back'],
    },
    { name: 'flashcard' }
  ),

  /**
   * Schema for multiple choice questions with options, correct answer, and explanation.
   *
   * Structure:
   * - question: The question text
   * - options: Array of possible answers (2-6 items)
   * - correctOptionIndex: Index of the correct option (0-based)
   * - explanation: Optional explanation of the correct answer
   *
   * @example
   * ```typescript
   * const response = await openRouter.chat({
   *   userMessage: "Create a multiple choice question about the solar system",
   *   responseFormat: SCHEMAS.MULTIPLE_CHOICE
   * });
   *
   * const mcq = response.content as any;
   * console.log(`Question: ${mcq.question}`);
   * mcq.options.forEach((option, index) => {
   *   console.log(`${index + 1}. ${option} ${index === mcq.correctOptionIndex ? '✓' : ''}`);
   * });
   * ```
   */
  MULTIPLE_CHOICE: createJsonSchema(
    {
      type: 'object',
      properties: {
        question: { type: 'string' },
        options: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 6,
        },
        correctOptionIndex: { type: 'integer', minimum: 0 },
        explanation: { type: 'string' },
      },
      required: ['question', 'options', 'correctOptionIndex'],
    },
    { name: 'multiple_choice' }
  ),

  /**
   * Schema for true/false questions with a statement, truth value, and explanation.
   *
   * Structure:
   * - statement: The statement to evaluate
   * - isTrue: Boolean indicating whether the statement is true
   * - explanation: Optional explanation of why the statement is true or false
   *
   * @example
   * ```typescript
   * const response = await openRouter.chat({
   *   userMessage: "Create a true/false question about human anatomy",
   *   responseFormat: SCHEMAS.TRUE_FALSE
   * });
   *
   * const tfq = response.content as any;
   * console.log(`Statement: ${tfq.statement}`);
   * console.log(`Answer: ${tfq.isTrue ? 'True' : 'False'}`);
   * ```
   */
  TRUE_FALSE: createJsonSchema(
    {
      type: 'object',
      properties: {
        statement: { type: 'string' },
        isTrue: { type: 'boolean' },
        explanation: { type: 'string' },
      },
      required: ['statement', 'isTrue'],
    },
    { name: 'true_false' }
  ),

  /**
   * Schema for fill-in-the-blank questions with text containing blanks to fill.
   *
   * Structure:
   * - text: Text with placeholders for blanks (e.g., "The capital of France is ___.")
   * - blanks: Array of blank information objects containing:
   *   - id: Identifier for the blank
   *   - correctAnswer: The correct answer for the blank
   *   - alternativeAnswers: Optional array of alternative acceptable answers
   *
   * @example
   * ```typescript
   * const response = await openRouter.chat({
   *   userMessage: "Create a fill-in-the-blank question about capitals of countries",
   *   responseFormat: SCHEMAS.FILL_IN_BLANK
   * });
   *
   * const fib = response.content as any;
   * console.log(`Question: ${fib.text}`);
   * fib.blanks.forEach(blank => {
   *   console.log(`Answer for blank ${blank.id}: ${blank.correctAnswer}`);
   * });
   * ```
   */
  FILL_IN_BLANK: createJsonSchema(
    {
      type: 'object',
      properties: {
        text: { type: 'string' },
        blanks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              correctAnswer: { type: 'string' },
              alternativeAnswers: { type: 'array', items: { type: 'string' } },
            },
            required: ['id', 'correctAnswer'],
          },
        },
      },
      required: ['text', 'blanks'],
    },
    { name: 'fill_in_blank' }
  ),

  /**
   * Schema for matching exercises with pairs of items to match.
   *
   * Structure:
   * - instructions: Optional instructions for the matching exercise
   * - items: Array of pairs to match, each containing:
   *   - left: Item on the left side
   *   - right: Corresponding item on the right side that matches with left
   *
   * @example
   * ```typescript
   * const response = await openRouter.chat({
   *   userMessage: "Create a matching exercise for chemical elements and their symbols",
   *   responseFormat: SCHEMAS.MATCHING
   * });
   *
   * const matching = response.content as any;
   * if (matching.instructions) {
   *   console.log(`Instructions: ${matching.instructions}`);
   * }
   * matching.items.forEach((pair, index) => {
   *   console.log(`${index + 1}. ${pair.left} → ${pair.right}`);
   * });
   * ```
   */
  MATCHING: createJsonSchema(
    {
      type: 'object',
      properties: {
        instructions: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              left: { type: 'string' },
              right: { type: 'string' },
            },
            required: ['left', 'right'],
          },
          minItems: 2,
        },
      },
      required: ['items'],
    },
    { name: 'matching' }
  ),

  /**
   * Schema for a collection of educational flashcards.
   *
   * Structure:
   * - flashcards: Array of flashcard objects, each containing:
   *   - front: The question or prompt side of the flashcard
   *   - back: The answer or explanation side
   *
   * @example
   * ```typescript
   * const response = await openRouter.chat({
   *   userMessage: "Create 5 biology flashcards about cell biology",
   *   responseFormat: SCHEMAS.FLASHCARD_COLLECTION
   * });
   *
   * const collection = response.content as { flashcards: Array<{front: string, back: string}> };
   * collection.flashcards.forEach((card, index) => {
   *   console.log(`Flashcard ${index + 1}:`);
   *   console.log(`Question: ${card.front}`);
   *   console.log(`Answer: ${card.back}`);
   * });
   * ```
   */
  FLASHCARD_COLLECTION: createJsonSchema(
    {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: { type: 'string' },
              back: { type: 'string' },
            },
            required: ['front', 'back'],
          },
          minItems: 1,
        },
      },
      required: ['flashcards'],
    },
    { name: 'flashcard_collection' }
  ),
};
