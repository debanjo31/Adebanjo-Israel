import { connect, Connection, Channel, ConsumeMessage } from "amqplib";
import { config } from "./index";

export interface QueueMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount?: number;
}

class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnected: boolean = false;

  private readonly connectionUrl: string;

  constructor() {
    this.connectionUrl = `amqp://${config.rabbitmq.username}:${config.rabbitmq.password}@${config.rabbitmq.host}:${config.rabbitmq.port}/${config.rabbitmq.vhost}`;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();

      this.connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err);
        this.isConnected = false;
      });

      this.connection.on("close", () => {
        console.log("RabbitMQ connection closed");
        this.isConnected = false;
      });

      this.isConnected = true;
      console.log("RabbitMQ connected successfully");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  async publishMessage(
    exchange: string,
    routingKey: string,
    message: QueueMessage
  ): Promise<void> {
    if (!this.channel) throw new Error("Channel not initialized");

    const messageBuffer = Buffer.from(JSON.stringify(message));

    this.channel.publish(exchange, routingKey, messageBuffer, {
      persistent: true,
      messageId: message.id,
      timestamp: Date.now(),
    });

    console.log(
      `Published message: ${message.id} to ${exchange}/${routingKey}`
    );
  }

  async consumeMessages(
    queue: string,
    callback: (message: QueueMessage) => Promise<void>
  ): Promise<void> {
    if (!this.channel) throw new Error("Channel not initialized");

    await this.channel.consume(queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const message: QueueMessage = JSON.parse(msg.content.toString());
        await callback(message);
        this.channel!.ack(msg);
      } catch (error) {
        console.error("Error processing message:", error);
        this.channel!.nack(msg, false, false);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }

    this.isConnected = false;
  }

  isHealthy(): boolean {
    return (
      this.isConnected && this.connection !== null && this.channel !== null
    );
  }

  getChannel(): Channel | null {
    return this.channel;
  }
}

export const rabbitMQService = new RabbitMQService();
