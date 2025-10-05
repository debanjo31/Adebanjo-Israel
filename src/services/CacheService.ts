import { createClient, RedisClientType } from "redis";
import { config } from "../config";

export class CacheService {
  private static instance: CacheService;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public async connect(): Promise<void> {
    try {
      this.client = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        password: config.redis.password || undefined,
      });

      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Redis client connected");
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      this.isConnected = false;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (!data) return null;
      if (typeof data !== 'string') return null;
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  public async set(
    key: string,
    value: any,
    ttlSeconds: number = 300
  ): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
    }
  }

  public async close(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}
