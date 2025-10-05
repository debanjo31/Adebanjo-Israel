export interface RetryPolicy {
  shouldRetry(attempt: number, maxRetries: number, error: Error): boolean;
  calculateNextRetryDelay(attempt: number): number;
}

/**
 * Immediate retry policy - retry immediately
 */
export class ImmediateRetryPolicy implements RetryPolicy {
  shouldRetry(attempt: number, maxRetries: number, error: Error): boolean {
    return attempt < maxRetries;
  }

  calculateNextRetryDelay(attempt: number): number {
    return 0; // Retry immediately
  }
}

/**
 * Linear backoff retry policy - retry with linear delay increase
 */
export class LinearBackoffRetryPolicy implements RetryPolicy {
  private baseDelay: number;

  constructor(baseDelay: number = 1000) {
    this.baseDelay = baseDelay;
  }

  shouldRetry(attempt: number, maxRetries: number, error: Error): boolean {
    return attempt < maxRetries;
  }

  calculateNextRetryDelay(attempt: number): number {
    return this.baseDelay * attempt; // Linear increase
  }
}

/**
 * Exponential backoff retry policy - retry with exponential delay increase
 */
export class ExponentialBackoffRetryPolicy implements RetryPolicy {
  private baseDelay: number;
  private maxDelay: number;

  constructor(baseDelay: number = 1000, maxDelay: number = 60000) {
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  shouldRetry(attempt: number, maxRetries: number, error: Error): boolean {
    return attempt < maxRetries;
  }

  calculateNextRetryDelay(attempt: number): number {
    // Calculate exponential delay with jitter (randomness)
    const exponentialDelay = Math.min(
      this.maxDelay,
      this.baseDelay * Math.pow(2, attempt)
    );

    // Add some jitter (±10%) to prevent thundering herd problem
    const jitter = 0.1;
    const jitterMultiplier = 1 - jitter + Math.random() * jitter * 2;

    return exponentialDelay * jitterMultiplier;
  }
}

/**
 * Retry policy factory
 */
export class RetryPolicyFactory {
  static getRetryPolicy(policyType: string): RetryPolicy {
    switch (policyType.toLowerCase()) {
      case "immediate":
        return new ImmediateRetryPolicy();
      case "linear":
        return new LinearBackoffRetryPolicy();
      case "exponential":
      default:
        return new ExponentialBackoffRetryPolicy();
    }
  }
}
