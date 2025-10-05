import { Channel, Connection } from "amqplib";
import { v4 as uuidv4 } from "uuid";

export enum QueueName {
  LEAVE_REQUEST = "leave.requested",
}

export interface QueueMessage<T = any> {
  id: string;
  timestamp: number;
  data: T;
}

export class RabbitMQService {
  private static instance: RabbitMQService;
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private uri: string;

  private constructor() {
    this.uri = process.env.RABBITMQ_URI;
  }

  /**
   * Get singleton instance of RabbitMQService
   */
  public static getInstance(): RabbitMQService {
    if (!RabbitMQService.instance) {
      RabbitMQService.instance = new RabbitMQService();
    }
    return RabbitMQService.instance;
  }

  /**
   * Connect to RabbitMQ server
   */
  public async connect(): Promise<void> {
    try {
      // Explicitly import amqplib to ensure it's loaded
      const amqp = require("amqplib");

      console.log("Attempting to connect to RabbitMQ...");
      this.connection = await amqp.connect(this.uri);
      console.log("Connected to RabbitMQ server");

      this.channel = await this.connection.createChannel();
      console.log("RabbitMQ channel created");

      // Handle connection closed
      this.connection.on("close", () => {
        console.log("RabbitMQ connection closed");
        setTimeout(() => this.reconnect(), 5000);
      });

      // Handle errors
      this.connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err);
        setTimeout(() => this.reconnect(), 5000);
      });

      console.log("Connected to RabbitMQ");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      // Attempt to reconnect after delay
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  /**
   * Reconnect to RabbitMQ server
   */
  private async reconnect(): Promise<void> {
    console.log("Attempting to reconnect to RabbitMQ...");
    if (this.channel) {
      try {
        await this.channel.close();
      } catch (error) {
        console.error("Error closing channel:", error);
      }
      this.channel = null;
    }

    if (this.connection) {
      try {
        await this.connection.close();
      } catch (error) {
        console.error("Error closing connection:", error);
      }
      this.connection = null;
    }

    await this.connect();
  }

  /**
   * Create a queue if it doesn't exist
   * @param queueName Name of the queue
   */
  public async assertQueue(queueName: string): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not established");
    }

    // Create dead letter exchange
    await this.channel.assertExchange("dlx", "direct", { durable: true });

    // Create dead letter queue
    await this.channel.assertQueue(`${queueName}.dlq`, {
      durable: true,
    });

    // Bind DLQ to DLX
    await this.channel.bindQueue(`${queueName}.dlq`, "dlx", queueName);

    // Create main queue with DLX configuration
    await this.channel.assertQueue(queueName, {
      durable: true, // Queue survives broker restart
      arguments: {
        "x-dead-letter-exchange": "dlx",
        "x-dead-letter-routing-key": queueName,
      },
    });
  }

  /**
   * Publish message to a queue
   * @param queueName Name of the queue
   * @param data Message data
   */
  public async publishMessage<T>(queueName: string, data: T): Promise<string> {
    if (!this.channel) {
      await this.connect();
    }

    if (!this.channel) {
      throw new Error("Failed to establish channel");
    }

    // Create queue if it doesn't exist
    await this.assertQueue(queueName);

    // Create message with unique ID
    const messageId = uuidv4();
    const message: QueueMessage<T> = {
      id: messageId,
      timestamp: Date.now(),
      data,
    };

    // Publish message to queue
    this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true, // Message survives broker restart
      messageId, // Unique message ID for tracking
    });

    return messageId;
  }

  /**
   * Consume messages from a queue
   * @param queueName Name of the queue
   * @param callback Function to process the message
   */
  public async consumeMessages<T>(
    queueName: string,
    callback: (message: QueueMessage<T>) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    if (!this.channel) {
      throw new Error("Failed to establish channel");
    }

    // Create queue if it doesn't exist
    await this.assertQueue(queueName);

    // Set prefetch to control concurrent processing
    this.channel.prefetch(1);

    // Start consuming messages
    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const messageContent = JSON.parse(
          msg.content.toString()
        ) as QueueMessage<T>;

        // Process the message
        await callback(messageContent);

        // Acknowledge successful processing
        this.channel?.ack(msg);
      } catch (error) {
        console.error(`Error processing message from ${queueName}:`, error);
        // Negative acknowledgment - requeue the message
        this.channel?.nack(msg, false, true);
      }
    });
  }

  /**
   * Close connection and channel
   */
  public async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}
