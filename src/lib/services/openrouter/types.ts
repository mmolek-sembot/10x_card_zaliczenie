export interface OpenRouterConfig {
  apiKey?: string; // Optional if set in environment variables
  baseUrl?: string; // Default to OpenRouter API URL
  defaultModel?: string; // Default model to use
  defaultSystemMessage?: string; // Default system message
  defaultParameters?: ModelParameters; // Default parameters
  timeout?: number; // Request timeout in ms
  retryOptions?: RetryOptions; // Retry configuration
  cacheOptions?: CacheOptions; // Caching configuration
}

export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  max_tokens?: number;
  stop?: string[];
}

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface CacheOptions {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string;
  name?: string;
}

export interface ResponseFormat {
  type: 'text' | 'json_object' | 'json_schema';
  json_schema?: Record<string, any>;
}

export interface SchemaOptions {
  strict?: boolean;
  name?: string;
}

export interface ChatOptions {
  messages?: ChatMessage[]; // Full conversation history
  userMessage?: string; // Shorthand for a single user message
  systemMessage?: string; // Override default system message
  model?: string; // Override default model
  models?: string[]; // Prioritized list of models to try
  responseFormat?: ResponseFormat; // Structured response format
  parameters?: ModelParameters; // Override default parameters
  parameterPreset?: 'creative' | 'balanced' | 'precise'; // Predefined parameter sets
  cache?: boolean; // Whether to use cache for this request
  abortSignal?: AbortSignal; // For cancelling requests
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponse {
  content: string | object; // Response content (object if JSON response)
  model: string; // Model that generated the response
  usage: TokenUsage; // Token usage information
  id: string; // Response ID
  metadata: Record<string, any>; // Additional metadata
}

export interface ChatResponseChunk {
  content: string; // Content fragment
  done: boolean; // Whether this is the last chunk
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
  provider?: string;
}

export interface FlashcardContent {
  front: string;
  back: string;
  difficulty?: number;
  tags?: string[];
}

/**
 * Represents a collection of flashcards returned from FLASHCARD_COLLECTION schema
 */
export interface FlashcardCollectionContent {
  flashcards: Array<{
    front: string;
    back: string;
  }>;
} 