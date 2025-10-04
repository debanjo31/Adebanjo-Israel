import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  // Database Configuration
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "my-secret-pw",
    name: process.env.DB_NAME || "workforce_db",
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || "",
  },

  // RabbitMQ Configuration
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || "localhost",
    port: parseInt(process.env.RABBITMQ_PORT || "5672"),
    username: process.env.RABBITMQ_USERNAME || "workforce",
    password: process.env.RABBITMQ_PASSWORD || "workforce123",
    vhost: process.env.RABBITMQ_VHOST || "workforce_vhost",
  },

  // Application Configuration
  app: {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000"),
    apiVersion: process.env.API_VERSION || "v1",
  },

  // JWT Configuration
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      "your-super-secret-jwt-key-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  },

  // Pagination
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || "10"),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || "100"),
  },

  // Queue Configuration
  queue: {
    retryAttempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS || "3"),
    retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY || "5000"),
  },
};
