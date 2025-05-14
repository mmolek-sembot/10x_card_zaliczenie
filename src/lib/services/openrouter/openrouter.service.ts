import type { 
  OpenRouterConfig, 
  ChatOptions, 
  ChatResponse, 
  ChatMessage, 
  ModelParameters,
  ResponseFormat,
  ModelInfo,
  ChatResponseChunk,
  RetryOptions,
  CacheOptions
} from './types';
import { 
  AuthenticationError, 
  NetworkError, 
  ValidationError,
  RateLimitError,
  ModelError,
  TimeoutError,
  ContentFilterError,
  InternalServiceError,
  SchemaValidationError,
  QuotaExceededError
} from './errors';
import { 
  validateModelParameters, 
  getParameterPreset, 
  normalizeMessages,
  withRetry,
  safeJsonParse,
  mergeObjects,
  createSimpleCache
} from './utils';
import { createJsonSchema, SCHEMAS } from './schemas';

/**
 * Service for interacting with OpenRouter API to generate educational flashcards
 * and other content using various LLM models.
 * 
 * This service provides a type-safe interface for communicating with OpenRouter,
 * handling authentication, request formatting, error handling, and response processing.
 * 
 * @example
 * ```typescript
 * // Create a service instance with default configuration
 * const openRouter = createOpenRouterService();
 * 
 * // Simple usage with a user message
 * const response = await openRouter.chat({
 *   userMessage: "Create a flashcard about photosynthesis"
 * });
 * 
 * console.log(response.content);
 * ```
 */
export class OpenRouterService {
  // Default configuration values
  private static readonly DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };
  private static readonly DEFAULT_CACHE_OPTIONS: CacheOptions = {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100
  };
  private static readonly DEFAULT_MODEL = 'openai/gpt-4.1-nano';
  private static readonly DEFAULT_SYSTEM_MESSAGE = 'You are a helpful assistant that creates educational content.';
  private static readonly DEFAULT_PARAMETERS: ModelParameters = {
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 1024
  };

  // Private configuration properties
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly defaultSystemMessage: string;
  private readonly defaultParameters: ModelParameters;
  private readonly timeout: number;
  private readonly retryOptions: RetryOptions;
  private readonly cacheOptions: CacheOptions;
  
  // Cache implementation
  private cache: ReturnType<typeof createSimpleCache<string, ChatResponse>> | null = null;

  /**
   * Creates a new instance of OpenRouterService with the provided configuration.
   * 
   * @param config - Configuration options for the service
   * @throws {AuthenticationError} If API key is not provided in config or environment
   * 
   * @example
   * ```typescript
   * // With explicit API key
   * const service = new OpenRouterService({
   *   apiKey: "your-api-key",
   *   defaultModel: "anthropic/claude-3-opus-20240229"
   * });
   * 
   * // Using environment variable for API key
   * const service = new OpenRouterService({
   *   defaultSystemMessage: "You are an expert educational content creator.",
   *   defaultParameters: { temperature: 0.5 }
   * });
   * ```
   */
  constructor(config: OpenRouterConfig = {}) {
    // API Key - first from config, then from env variable
    this.apiKey = config.apiKey || import.meta.env.OPENROUTER_API_KEY;
    if (!this.apiKey) {
      throw new AuthenticationError('API key is required. Provide it in the constructor or set OPENROUTER_API_KEY environment variable.');
    }

    // Initialize configuration with defaults
    this.baseUrl = config.baseUrl || OpenRouterService.DEFAULT_BASE_URL;
    this.defaultModel = config.defaultModel || OpenRouterService.DEFAULT_MODEL;
    this.defaultSystemMessage = config.defaultSystemMessage || OpenRouterService.DEFAULT_SYSTEM_MESSAGE;
    this.defaultParameters = { 
      ...OpenRouterService.DEFAULT_PARAMETERS,
      ...config.defaultParameters
    };
    this.timeout = config.timeout || OpenRouterService.DEFAULT_TIMEOUT;
    this.retryOptions = { 
      ...OpenRouterService.DEFAULT_RETRY_OPTIONS,
      ...config.retryOptions
    };
    this.cacheOptions = { 
      ...OpenRouterService.DEFAULT_CACHE_OPTIONS,
      ...config.cacheOptions
    };

    // Initialize cache if enabled
    if (this.cacheOptions.enabled) {
      this.cache = createSimpleCache<string, ChatResponse>(
        this.cacheOptions.maxSize,
        this.cacheOptions.ttl
      );
    }
  }
  
  /**
   * Retrieves available models from OpenRouter API.
   * 
   * @returns A promise that resolves to an array of available model information
   * @throws Various error types based on API response or network issues
   * 
   * @example
   * ```typescript
   * const openRouter = createOpenRouterService();
   * const models = await openRouter.getAvailableModels();
   * 
   * // Find a specific model
   * const claudeModel = models.find(model => 
   *   model.id.startsWith('anthropic/claude')
   * );
   * ```
   */
  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const response = await withRetry(
        () => this.makeRequest(`${this.baseUrl}/models`, {
          method: 'GET',
          headers: this.getHeaders()
        }),
        this.retryOptions
      );
      
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw this.handleFetchError(error);
    }
  }

  /**
   * Makes a non-streaming chat request to OpenRouter API.
   * 
   * @param options - Options for the chat request
   * @returns A promise that resolves to the chat response
   * @throws Various error types based on API response or network issues
   * 
   * @example
   * ```typescript
   * // Basic usage
   * const response = await openRouter.chat({
   *   userMessage: "Create a flashcard about photosynthesis"
   * });
   * 
   * // With structured output using schema
   * const response = await openRouter.chat({
   *   userMessage: "Create a flashcard about photosynthesis",
   *   responseFormat: OpenRouterService.SCHEMAS.FLASHCARD,
   *   model: "anthropic/claude-3-opus-20240229"
   * });
   * 
   * const flashcard = response.content as FlashcardContent;
   * console.log(`Front: ${flashcard.front}`);
   * console.log(`Back: ${flashcard.back}`);
   * 
   * // With parameter preset
   * const response = await openRouter.chat({
   *   userMessage: "Generate a creative flashcard about quantum physics",
   *   parameterPreset: "creative"
   * });
   * ```
   */
  async chat(options: ChatOptions): Promise<ChatResponse> {
    // Try to get from cache if enabled
    if (this.cache && options.cache !== false) {
      const cacheKey = this.createCacheKey(options);
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    try {
      const requestBody = this.buildRequestBody(options);
      
      const response = await withRetry(
        () => this.makeRequest(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(requestBody)
        }),
        this.retryOptions
      );
      
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      
      const rawResponse = await response.json();
      const processedResponse = this.processResponse(rawResponse, options.responseFormat);
      
      // Cache the response if caching is enabled
      if (this.cache && options.cache !== false) {
        const cacheKey = this.createCacheKey(options);
        this.cache.set(cacheKey, processedResponse);
      }
      
      return processedResponse;
    } catch (error) {
      throw this.handleFetchError(error);
    }
  }
  
  /**
   * Makes a streaming chat request to OpenRouter API.
   * Returns a ReadableStream that emits chunks of the response as they arrive.
   * 
   * @param options - Options for the streaming chat request
   * @returns A promise that resolves to a ReadableStream of response chunks
   * @throws Various error types based on API response or network issues
   * 
   * @example
   * ```typescript
   * // Basic streaming
   * const stream = await openRouter.stream({
   *   systemMessage: "You are an educational assistant creating flashcards.",
   *   userMessage: "Create a detailed flashcard about DNA replication"
   * });
   * 
   * // Process the stream
   * for await (const chunk of stream) {
   *   process.stdout.write(chunk.content);
   *   if (chunk.done) break;
   * }
   * 
   * // With UI updates
   * const stream = await openRouter.stream({
   *   userMessage: "Create a flashcard about neural networks"
   * });
   * 
   * const textElement = document.getElementById('response');
   * let fullText = '';
   * 
   * const reader = stream.getReader();
   * while (true) {
   *   const { value, done } = await reader.read();
   *   if (done) break;
   *   
   *   fullText += value.content;
   *   textElement.textContent = fullText;
   * }
   * ```
   */
  async stream(options: ChatOptions): Promise<ReadableStream<ChatResponseChunk>> {
    try {
      const requestBody = this.buildRequestBody(options);
      
      // Set stream to true for streaming responses
      requestBody.stream = true;
      
      const response = await withRetry(
        () => this.makeRequest(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(requestBody)
        }),
        this.retryOptions
      );
      
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      
      if (!response.body) {
        throw new NetworkError('Response body is null');
      }
      
      return this.processStreamResponse(response.body);
    } catch (error) {
      throw this.handleFetchError(error);
    }
  }

  /**
   * Creates a JSON schema for structured responses.
   * 
   * @param schema - JSON schema object
   * @param options - Schema options for name and strictness
   * @returns A ResponseFormat object configured for the schema
   * 
   * @example
   * ```typescript
   * // Create a custom schema for vocabulary terms
   * const VOCABULARY_SCHEMA = OpenRouterService.createJsonSchema({
   *   type: "object",
   *   properties: {
   *     term: { type: "string" },
   *     definition: { type: "string" },
   *     examples: { type: "array", items: { type: "string" } }
   *   },
   *   required: ["term", "definition"]
   * }, { name: "vocabulary_term" });
   * 
   * // Use the custom schema
   * const response = await openRouter.chat({
   *   userMessage: "Define the term 'mitosis'",
   *   responseFormat: VOCABULARY_SCHEMA
   * });
   * ```
   */
  static createJsonSchema(schema: object, options?: { name?: string; strict?: boolean }): ResponseFormat {
    return createJsonSchema(schema, options);
  }
  
  /**
   * Provides access to predefined schemas for common response formats.
   * 
   * @returns An object containing predefined schemas
   * 
   * @example
   * ```typescript
   * // Using the FLASHCARD schema
   * const response = await openRouter.chat({
   *   userMessage: "Create a flashcard about mitochondria",
   *   responseFormat: OpenRouterService.SCHEMAS.FLASHCARD
   * });
   * 
   * // Using the MULTIPLE_CHOICE schema
   * const response = await openRouter.chat({
   *   userMessage: "Create a multiple choice question about the solar system",
   *   responseFormat: OpenRouterService.SCHEMAS.MULTIPLE_CHOICE
   * });
   * ```
   */
  static get SCHEMAS() {
    return SCHEMAS;
  }
  
  /**
   * Generate cache key from options
   */
  private createCacheKey(options: ChatOptions): string {
    // Create a stable representation of the options for caching
    const stableOptions = {
      messages: options.messages || normalizeMessages(
        undefined,
        options.userMessage,
        options.systemMessage || this.defaultSystemMessage
      ),
      model: options.model || this.defaultModel,
      responseFormat: options.responseFormat,
      parameters: options.parameters || 
        (options.parameterPreset ? getParameterPreset(options.parameterPreset) : this.defaultParameters)
    };
    
    return JSON.stringify(stableOptions);
  }
  
  /**
   * Build the request body for OpenRouter API
   */
  private buildRequestBody(options: ChatOptions): any {
    const messages = normalizeMessages(
      options.messages,
      options.userMessage,
      options.systemMessage || this.defaultSystemMessage
    );
    
    const model = options.model || this.defaultModel;
    
    let parameters: ModelParameters;
    if (options.parameterPreset) {
      parameters = { ...getParameterPreset(options.parameterPreset), ...options.parameters };
    } else {
      parameters = { ...this.defaultParameters, ...options.parameters };
    }
    
    // Validate parameters
    validateModelParameters(parameters);
    
    const requestBody: any = {
      model,
      messages,
      ...parameters
    };
    
    // Add response format if specified
    if (options.responseFormat) {
      requestBody.response_format = options.responseFormat;
    }
    
    // Add model alternatives if specified
    if (options.models && options.models.length > 0) {
      requestBody.models = options.models;
    }
    
    return requestBody;
  }
  
  /**
   * Generate headers for API requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : '10xCard-API',
      'X-Title': '10xCard'
    };
  }
  
  /**
   * Make a fetch request with timeout
   */
  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), this.timeout);
    
    try {
      return await fetch(url, {
        ...options,
        signal: abortController.signal
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request timed out after ${this.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  // Add a simple schema validator
  /**
   * Validates an object against a simple JSON schema
   * This is a lightweight implementation for basic schema validation
   * 
   * @param obj - The object to validate
   * @param schema - The JSON schema to validate against
   * @returns Validation result with success flag and error messages
   */
  private validateJsonSchema(obj: any, schema: any): { valid: boolean, errors: string[] } {
    const errors: string[] = [];
    
    // Helper to validate a value against a schema property
    const validateProperty = (value: any, propertySchema: any, path: string) => {
      // Check type
      if (propertySchema.type) {
        const jsType = typeof value;
        let schemaType = propertySchema.type;
        
        if (schemaType === 'integer') {
          if (typeof value !== 'number' || !Number.isInteger(value)) {
            errors.push(`${path} must be an integer`);
          }
        } else if (schemaType === 'number' && jsType !== 'number') {
          errors.push(`${path} must be a number`);
        } else if (schemaType === 'string' && jsType !== 'string') {
          errors.push(`${path} must be a string`);
        } else if (schemaType === 'boolean' && jsType !== 'boolean') {
          errors.push(`${path} must be a boolean`);
        } else if (schemaType === 'object' && (jsType !== 'object' || value === null || Array.isArray(value))) {
          errors.push(`${path} must be an object`);
        } else if (schemaType === 'array' && !Array.isArray(value)) {
          errors.push(`${path} must be an array`);
        }
      }
      
      // Check array items
      if (propertySchema.type === 'array' && Array.isArray(value) && propertySchema.items) {
        // Check minItems
        if (propertySchema.minItems !== undefined && value.length < propertySchema.minItems) {
          errors.push(`${path} must have at least ${propertySchema.minItems} items`);
        }
        
        // Check maxItems
        if (propertySchema.maxItems !== undefined && value.length > propertySchema.maxItems) {
          errors.push(`${path} must have at most ${propertySchema.maxItems} items`);
        }
        
        // Validate each item
        if (propertySchema.items) {
          value.forEach((item, index) => {
            validateProperty(item, propertySchema.items, `${path}[${index}]`);
          });
        }
      }
      
      // Check number constraints
      if (typeof value === 'number') {
        if (propertySchema.minimum !== undefined && value < propertySchema.minimum) {
          errors.push(`${path} must be at least ${propertySchema.minimum}`);
        }
        if (propertySchema.maximum !== undefined && value > propertySchema.maximum) {
          errors.push(`${path} must be at most ${propertySchema.maximum}`);
        }
      }
      
      // Check string constraints
      if (typeof value === 'string') {
        if (propertySchema.minLength !== undefined && value.length < propertySchema.minLength) {
          errors.push(`${path} must be at least ${propertySchema.minLength} characters long`);
        }
        if (propertySchema.maxLength !== undefined && value.length > propertySchema.maxLength) {
          errors.push(`${path} must be at most ${propertySchema.maxLength} characters long`);
        }
      }
      
      // Check nested object properties
      if (propertySchema.type === 'object' && propertySchema.properties) {
        validateObject(value, propertySchema, path);
      }
    };
    
    // Validate object against schema
    const validateObject = (obj: any, schema: any, basePath = '') => {
      // Check required properties
      if (schema.required) {
        for (const requiredProp of schema.required) {
          if (obj[requiredProp] === undefined) {
            errors.push(`${basePath ? basePath + '.' : ''}${requiredProp} is required`);
          }
        }
      }
      
      // Check properties
      if (schema.properties) {
        for (const [propName, propSchema] of Object.entries<any>(schema.properties)) {
          const propPath = basePath ? `${basePath}.${propName}` : propName;
          const value = obj[propName];
          
          if (value !== undefined) {
            validateProperty(value, propSchema, propPath);
          }
        }
      }
    };
    
    validateObject(obj, schema);
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Process the API response
   */
  private processResponse(rawResponse: any, responseFormat?: ResponseFormat): ChatResponse {
    if (!rawResponse.choices || !rawResponse.choices[0]) {
      throw new ValidationError('Invalid response format from OpenRouter API');
    }
    
    let content: string | object = rawResponse.choices[0].message.content;
    
    // Handle JSON responses
    if (responseFormat && responseFormat.type !== 'text') {
      try {
        // If it's a string, parse it to JSON
        if (typeof content === 'string') {
          // Strip markdown code block formatting if present
          const contentStr = content as string;
          const jsonContent = contentStr.replace(/^```(json)?\s*|\s*```$/g, '');
          content = safeJsonParse(jsonContent);
        }
        
        // Validate against schema if provided
        if (responseFormat.type === 'json_schema' && 
            responseFormat.json_schema && 
            responseFormat.json_schema.schema) {
          
          // Check if content is an object
          if (typeof content !== 'object' || content === null) {
            throw new SchemaValidationError('Response content is not a valid JSON object');
          }
          
          // Validate the content against the schema
          const schema = responseFormat.json_schema.schema;
          const strict = responseFormat.json_schema.strict ?? true;
          const validation = this.validateJsonSchema(content, schema);
          
          if (!validation.valid && strict) {
            const errorMessage = validation.errors.join('; ');
            throw new SchemaValidationError(`Schema validation failed: ${errorMessage}`);
          }
        }
      } catch (error) {
        if (error instanceof SchemaValidationError) {
          throw error;
        }
        throw new SchemaValidationError(`Failed to parse or validate JSON response: ${(error as Error).message}`);
      }
    }
    
    return {
      content,
      model: rawResponse.model,
      usage: rawResponse.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      },
      id: rawResponse.id,
      metadata: rawResponse.metadata || {}
    };
  }
  
  /**
   * Process a streaming response
   */
  private processStreamResponse(body: ReadableStream<Uint8Array>): ReadableStream<ChatResponseChunk> {
    const decoder = new TextDecoder();
    const reader = body.getReader();
    
    return new ReadableStream<ChatResponseChunk>({
      async start(controller) {
        try {
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // If there's any remaining content in the buffer, emit it
              if (buffer.trim()) {
                controller.enqueue({
                  content: buffer,
                  done: true
                });
              }
              break;
            }
            
            // Decode the chunk and add it to our buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process lines in the buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last (potentially incomplete) line in the buffer
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;
              
              if (trimmedLine === 'data: [DONE]') {
                controller.enqueue({
                  content: '',
                  done: true
                });
                continue;
              }
              
              if (trimmedLine.startsWith('data: ')) {
                try {
                  const jsonStr = trimmedLine.slice(6); // Remove 'data: ' prefix
                  const data = JSON.parse(jsonStr);
                  
                  // Extract content from the chunk
                  if (data.choices && data.choices[0] && data.choices[0].delta) {
                    const content = data.choices[0].delta.content || '';
                    
                    // Skip empty content
                    if (content) {
                      controller.enqueue({
                        content,
                        done: false
                      });
                    }
                  }
                } catch (error) {
                  console.error('Error parsing SSE data:', error);
                }
              }
            }
          }
          
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
      
      async cancel() {
        await reader.cancel();
      }
    });
  }
  
  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { error: { message: response.statusText } };
    }
    
    const errorMessage = errorData?.error?.message || 'Unknown error occurred';
    
    switch (response.status) {
      case 401:
        throw new AuthenticationError(`Authentication failed: ${errorMessage}`);
      case 400:
        throw new ValidationError(`Invalid request: ${errorMessage}`);
      case 404:
        throw new ModelError(`Model not found: ${errorMessage}`);
      case 429:
        throw new RateLimitError(`Rate limit exceeded: ${errorMessage}`);
      case 402:
        throw new QuotaExceededError(`Quota exceeded: ${errorMessage}`);
      case 403:
        throw new ContentFilterError(`Content filtered: ${errorMessage}`);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new InternalServiceError(`Server error: ${errorMessage}`);
      default:
        throw new NetworkError(`HTTP error ${response.status}: ${errorMessage}`);
    }
  }
  
  /**
   * Handle fetch errors
   */
  private handleFetchError(error: unknown): Error {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new TimeoutError('Request timed out');
      }
      
      if (
        error instanceof AuthenticationError ||
        error instanceof ValidationError ||
        error instanceof ModelError ||
        error instanceof RateLimitError ||
        error instanceof TimeoutError ||
        error instanceof ContentFilterError ||
        error instanceof InternalServiceError ||
        error instanceof SchemaValidationError ||
        error instanceof QuotaExceededError
      ) {
        return error;
      }
      
      return new NetworkError(`Network error: ${error.message}`, error);
    }
    
    return new NetworkError('Unknown network error occurred');
  }
} 