import type { ModelParameters, RetryOptions, ChatMessage } from './types';
import { ValidationError } from './errors';

/**
 * Validates and normalizes model parameters according to OpenRouter API requirements.
 * Checks that parameters are within acceptable ranges and throws validation errors if not.
 *
 * @param parameters - The model parameters to validate
 * @returns The validated parameters object (unchanged if valid)
 * @throws {ValidationError} If any parameter is outside its acceptable range
 *
 * @example
 * ```typescript
 * // Valid parameters
 * const validParams = validateModelParameters({
 *   temperature: 0.7,
 *   top_p: 0.9,
 *   max_tokens: 500
 * });
 *
 * // Will throw ValidationError
 * try {
 *   validateModelParameters({ temperature: 3.0 });
 * } catch (error) {
 *   console.error(error.message); // "Temperature must be between 0 and 2"
 * }
 * ```
 */
export function validateModelParameters(parameters: ModelParameters): ModelParameters {
  const validatedParams: ModelParameters = { ...parameters };

  if (validatedParams.temperature !== undefined) {
    if (validatedParams.temperature < 0 || validatedParams.temperature > 2) {
      throw new ValidationError('Temperature must be between 0 and 2');
    }
  }

  if (validatedParams.top_p !== undefined) {
    if (validatedParams.top_p < 0 || validatedParams.top_p > 1) {
      throw new ValidationError('Top_p must be between 0 and 1');
    }
  }

  if (validatedParams.max_tokens !== undefined) {
    if (validatedParams.max_tokens < 1) {
      throw new ValidationError('Max_tokens must be a positive integer');
    }
  }

  return validatedParams;
}

/**
 * Returns predefined parameter sets for different generation styles.
 * - "creative": Higher temperature and diversity for more creative responses
 * - "balanced": Moderate settings for general-purpose use
 * - "precise": Lower temperature for more focused, deterministic responses
 *
 * @param preset - The parameter preset to use
 * @returns Model parameters configured for the requested preset
 *
 * @example
 * ```typescript
 * // Get creative parameters
 * const creativeParams = getParameterPreset('creative');
 * // { temperature: 1.2, top_p: 0.9, frequency_penalty: 0.2 }
 *
 * // Get precise parameters
 * const preciseParams = getParameterPreset('precise');
 * // { temperature: 0.2, top_p: 0.5, frequency_penalty: 0.0 }
 * ```
 */
export function getParameterPreset(preset: 'creative' | 'balanced' | 'precise'): ModelParameters {
  switch (preset) {
    case 'creative':
      return {
        temperature: 1.2,
        top_p: 0.9,
        frequency_penalty: 0.2,
      };
    case 'balanced':
      return {
        temperature: 0.7,
        top_p: 0.8,
      };
    case 'precise':
      return {
        temperature: 0.2,
        top_p: 0.5,
        frequency_penalty: 0.0,
      };
    default:
      return {};
  }
}

/**
 * Normalizes input options into a consistent message array format for the API.
 * Handles different input patterns (full message array, single user message, etc.)
 * and produces a properly formatted array of chat messages.
 *
 * @param messages - Optional array of existing chat messages
 * @param userMessage - Optional single user message (alternative to messages array)
 * @param systemMessage - Optional system message to prepend
 * @returns A properly formatted array of chat messages
 * @throws {ValidationError} If no messages are provided
 *
 * @example
 * ```typescript
 * // From user message only
 * const messages1 = normalizeMessages(
 *   undefined,
 *   "Create a flashcard about photosynthesis"
 * );
 * // [{ role: 'user', content: 'Create a flashcard about photosynthesis' }]
 *
 * // From system and user messages
 * const messages2 = normalizeMessages(
 *   undefined,
 *   "Create a flashcard about photosynthesis",
 *   "You are an educational assistant."
 * );
 * // [
 * //   { role: 'system', content: 'You are an educational assistant.' },
 * //   { role: 'user', content: 'Create a flashcard about photosynthesis' }
 * // ]
 *
 * // From existing message array
 * const existingMessages = [
 *   { role: 'system', content: 'You are a helpful assistant.' },
 *   { role: 'user', content: 'Hello' },
 *   { role: 'assistant', content: 'Hi there!' }
 * ];
 * const messages3 = normalizeMessages(existingMessages);
 * // Returns a copy of the existingMessages array
 * ```
 */
export function normalizeMessages(
  messages?: ChatMessage[],
  userMessage?: string,
  systemMessage?: string
): ChatMessage[] {
  if (messages && messages.length > 0) {
    return [...messages];
  }

  const result: ChatMessage[] = [];

  if (systemMessage) {
    result.push({
      role: 'system',
      content: systemMessage,
    });
  }

  if (userMessage) {
    result.push({
      role: 'user',
      content: userMessage,
    });
  }

  if (result.length === 0) {
    throw new ValidationError(
      'No messages provided. Either messages array or userMessage must be specified.'
    );
  }

  return result;
}

/**
 * Implements exponential backoff retry logic for async operations.
 * Automatically retries failed operations with increasing delays between attempts.
 * Some error types (authentication, validation, content filter) will not be retried.
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns A promise that resolves with the result of the function
 * @throws The last error encountered if all retries fail
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, initialDelay: 1000, maxDelay: 10000, backoffFactor: 2 }
 * );
 *
 * // With error handling
 * try {
 *   const data = await withRetry(
 *     async () => {
 *       const response = await fetch('https://api.example.com/data');
 *       if (!response.ok) throw new Error(`HTTP error ${response.status}`);
 *       return response.json();
 *     },
 *     { maxRetries: 3, initialDelay: 1000, maxDelay: 10000, backoffFactor: 2 }
 *   );
 * } catch (error) {
 *   console.error('All retries failed:', error);
 * }
 * ```
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: Error | undefined;
  let delay = options.initialDelay;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (
        error instanceof Error &&
        ['authentication_error', 'validation_error', 'content_filter_error'].includes(
          (error as any).code
        )
      ) {
        throw error;
      }

      if (attempt >= options.maxRetries) {
        break;
      }

      // Wait before next retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * options.backoffFactor, options.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Safely parses JSON with proper error handling.
 *
 * @param text - The JSON string to parse
 * @returns The parsed JavaScript object
 * @throws {ValidationError} If parsing fails
 *
 * @example
 * ```typescript
 * // Successful parsing
 * const data = safeJsonParse('{"name":"John","age":30}');
 * // { name: 'John', age: 30 }
 *
 * // Error handling
 * try {
 *   safeJsonParse('{invalid json}');
 * } catch (error) {
 *   console.error(error.message); // Contains parsing error details
 * }
 * ```
 */
export function safeJsonParse(text: string): object {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ValidationError(`Failed to parse JSON response: ${(error as Error).message}`);
  }
}

/**
 * Merges two objects with the second taking precedence.
 *
 * @param base - The base object
 * @param override - Optional override object with properties to merge
 * @returns A new object with merged properties
 *
 * @example
 * ```typescript
 * const defaults = { color: 'blue', size: 'medium', count: 1 };
 * const userSettings = { color: 'red', count: 5 };
 *
 * const merged = mergeObjects(defaults, userSettings);
 * // { color: 'red', size: 'medium', count: 5 }
 * ```
 */
export function mergeObjects<T>(base: T, override?: Partial<T>): T {
  if (!override) return base;
  return { ...base, ...override };
}

/**
 * Creates a simple in-memory cache with time-based expiration.
 *
 * @param maxSize - Maximum number of items to store in cache
 * @param ttl - Time-to-live in milliseconds for cache items
 * @returns A cache interface with get, set, delete, and clear methods
 *
 * @example
 * ```typescript
 * // Create a cache that stores up to 100 items for 5 minutes each
 * const cache = createSimpleCache<string, object>(100, 5 * 60 * 1000);
 *
 * // Store a value
 * cache.set('user:123', { name: 'John', role: 'admin' });
 *
 * // Retrieve a value
 * const user = cache.get('user:123');
 *
 * // Delete a value
 * cache.delete('user:123');
 *
 * // Clear all values
 * cache.clear();
 * ```
 */
export function createSimpleCache<K, V>(maxSize: number, ttl: number) {
  const cache = new Map<K, { value: V; timestamp: number }>();

  return {
    get(key: K): V | undefined {
      const item = cache.get(key);
      if (!item) return undefined;

      const now = Date.now();
      if (now - item.timestamp > ttl) {
        cache.delete(key);
        return undefined;
      }

      return item.value;
    },

    set(key: K, value: V): void {
      // Evict oldest items if cache is full
      if (cache.size >= maxSize) {
        const iterator = cache.keys();
        const firstItem = iterator.next();
        if (!firstItem.done && firstItem.value !== undefined) {
          cache.delete(firstItem.value);
        }
      }

      cache.set(key, { value, timestamp: Date.now() });
    },

    delete(key: K): boolean {
      return cache.delete(key);
    },

    clear(): void {
      cache.clear();
    },
  };
}
