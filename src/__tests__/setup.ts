import { AppDataSource } from "../data-source";

beforeAll(async () => {
  // Initialize test database
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  // Close database connection
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(), // Suppress error logs in tests
  warn: jest.fn(),
} as any;
