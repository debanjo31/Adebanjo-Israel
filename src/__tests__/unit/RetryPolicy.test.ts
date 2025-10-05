import {
  ImmediateRetryPolicy,
  LinearBackoffRetryPolicy,
  ExponentialBackoffRetryPolicy,
  RetryPolicyFactory,
} from "../../utils/RetryPolicy";

describe("RetryPolicy", () => {
  describe("ImmediateRetryPolicy", () => {
    const policy = new ImmediateRetryPolicy();

    it("should retry if attempts < maxRetries", () => {
      expect(policy.shouldRetry(1, 3, new Error())).toBe(true);
      expect(policy.shouldRetry(2, 3, new Error())).toBe(true);
    });

    it("should not retry if attempts >= maxRetries", () => {
      expect(policy.shouldRetry(3, 3, new Error())).toBe(false);
      expect(policy.shouldRetry(4, 3, new Error())).toBe(false);
    });

    it("should return 0 delay for immediate retry", () => {
      expect(policy.calculateNextRetryDelay(1)).toBe(0);
    });
  });

  describe("LinearBackoffRetryPolicy", () => {
    const policy = new LinearBackoffRetryPolicy(1000);

    it("should calculate linear delay", () => {
      expect(policy.calculateNextRetryDelay(1)).toBe(1000);
      expect(policy.calculateNextRetryDelay(2)).toBe(2000);
      expect(policy.calculateNextRetryDelay(3)).toBe(3000);
    });
  });

  describe("ExponentialBackoffRetryPolicy", () => {
    const policy = new ExponentialBackoffRetryPolicy(1000, 60000);

    it("should calculate exponential delay with cap", () => {
      const delay1 = policy.calculateNextRetryDelay(1);
      const delay2 = policy.calculateNextRetryDelay(2);
      const delay3 = policy.calculateNextRetryDelay(10);

      expect(delay1).toBeGreaterThan(1500);
      expect(delay1).toBeLessThan(2500);
      expect(delay2).toBeGreaterThan(3000);
      expect(delay2).toBeLessThan(5000);
      expect(delay3).toBeLessThanOrEqual(66000); // Max delay with jitter ~10%
    });
  });

  describe("RetryPolicyFactory", () => {
    it("should create immediate retry policy", () => {
      const policy = RetryPolicyFactory.getRetryPolicy("immediate");
      expect(policy).toBeInstanceOf(ImmediateRetryPolicy);
    });

    it("should create linear backoff policy", () => {
      const policy = RetryPolicyFactory.getRetryPolicy("linear");
      expect(policy).toBeInstanceOf(LinearBackoffRetryPolicy);
    });

    it("should create exponential backoff policy", () => {
      const policy = RetryPolicyFactory.getRetryPolicy("exponential");
      expect(policy).toBeInstanceOf(ExponentialBackoffRetryPolicy);
    });

    it("should default to exponential backoff", () => {
      const policy = RetryPolicyFactory.getRetryPolicy("unknown");
      expect(policy).toBeInstanceOf(ExponentialBackoffRetryPolicy);
    });
  });
});
