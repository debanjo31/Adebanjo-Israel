import * as redis from "redis";
import { config } from "./index";

class RedisService {
  private client: redis.RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = redis.createClient({
      url: `redis://${
        config.redis.password ? `:${config.redis.password}@` : ""
      }${config.redis.host}:${config.redis.port}`,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });

    this.client.on("connect", () => {
      console.log("Redis client connected");
      this.isConnected = true;
    });

    this.client.on("error", (err) => {
      console.error("Redis client error:", err);
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    const result = await this.client.get(key);
    return typeof result === "string" ? result : null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  async setObject<T>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  getClient(): redis.RedisClientType {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

export const redisService = new RedisService();
