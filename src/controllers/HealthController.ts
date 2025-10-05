import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { RabbitMQService } from "../services/RabbitMQService";
import { CacheService } from "../services/CacheService";

export class HealthController {
  async checkHealth(req: Request, res: Response) {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  async checkQueueHealth(req: Request, res: Response) {
    try {
      const rabbitMQ = RabbitMQService.getInstance();
      const isConnected = (rabbitMQ as any).connection !== null;

      res.json({
        status: isConnected ? "healthy" : "unhealthy",
        service: "rabbitmq",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(503).json({
        status: "unhealthy",
        service: "rabbitmq",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async checkDbHealth(req: Request, res: Response) {
    try {
      const isConnected = AppDataSource.isInitialized;

      if (isConnected) {
        // Test query
        await AppDataSource.query("SELECT 1");
      }

      res.json({
        status: isConnected ? "healthy" : "unhealthy",
        service: "mysql",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(503).json({
        status: "unhealthy",
        service: "mysql",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async checkRedisHealth(req: Request, res: Response) {
    try {
      const cacheService = CacheService.getInstance();
      const testKey = "health:check";
      await cacheService.set(testKey, { test: true }, 10);
      const result = await cacheService.get(testKey);

      res.json({
        status: result ? "healthy" : "unhealthy",
        service: "redis",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(503).json({
        status: "unhealthy",
        service: "redis",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
