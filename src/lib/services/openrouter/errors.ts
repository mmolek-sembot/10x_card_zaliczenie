export class OpenRouterError extends Error {
  constructor(message: string, public code: string, public cause?: Error) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export class AuthenticationError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'authentication_error', cause);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'validation_error', cause);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'network_error', cause);
    this.name = 'NetworkError';
  }
}

export class RateLimitError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'rate_limit_error', cause);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'timeout_error', cause);
    this.name = 'TimeoutError';
  }
}

export class ModelError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'model_error', cause);
    this.name = 'ModelError';
  }
}

export class ContentFilterError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'content_filter_error', cause);
    this.name = 'ContentFilterError';
  }
}

export class QuotaExceededError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'quota_exceeded_error', cause);
    this.name = 'QuotaExceededError';
  }
}

export class InternalServiceError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'internal_service_error', cause);
    this.name = 'InternalServiceError';
  }
}

export class SchemaValidationError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'schema_validation_error', cause);
    this.name = 'SchemaValidationError';
  }
} 