import "reflect-metadata";
import express, { Request, Response, NextFunction } from "express";
import { AppDataSource } from "./data-source";
import { createRoutes } from "./routes";
import { LeaveRequestQueueService } from "./services/LeaveRequestQueueService";
import { CacheService } from "./services/CacheService";
import { globalRateLimiter } from "./middleware/rateLimit.middleware";

AppDataSource.initialize()
  .then(async () => {
    // create express app
    const app = express();
    app.use(express.json());

    // Apply rate limiting
    app.use("/api", globalRateLimiter);

    // Add error handling middleware
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        timestamp: new Date().toISOString(),
      });
    });

    // Register API routes (includes health checks)
    app.use("/api", createRoutes());

    // Initialize Redis cache
    try {
      const cacheService = CacheService.getInstance();
      await cacheService.connect();
      console.log("Redis cache connected successfully");
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      console.log("API will continue without caching functionality");
    }

    // start express server
    app.listen(3000);

    console.log(
      "Express server has started on port 3000. Open http://localhost:3000 to see results"
    );
  })
  .catch((error) => console.log(error));
