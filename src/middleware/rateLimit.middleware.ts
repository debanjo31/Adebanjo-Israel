import rateLimit from "express-rate-limit";
import { config } from "../config";

export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit write operations
  message: {
    success: false,
    message: "Too many requests, please try again later.",
    timestamp: new Date().toISOString(),
  },
});
