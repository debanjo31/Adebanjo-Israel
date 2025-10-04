const amqp = require("amqplib");
import { config } from "./index";

export interface QueueMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount?: number;
}

class RabbitMQService {
  private connection: any = null;
  private channel: any = null;
  private isConnected: boolean = false;

  private readonly connectionUrl: string;
  private readonly exchanges = {
    main: "workforce.direct",
    deadLetter: "workforce.dlx",
  };

  private readonly queues = {
    leaveRequested: "leave.requested",
    leaveRequestedDLQ: "leave.requested.dlq",
  };

  constructor() {
    this.connectionUrl = `amqp://${config.rabbitmq.username}:${config.rabbitmq.password}@${config.rabbitmq.host}:${config.rabbitmq.port}/${config.rabbitmq.vhost}`;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();

      // Setup error handlers
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

      // Setup exchanges and queues
      await this.setupInfrastructure();
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  private async setupInfrastructure(): Promise<void> {
    if (!this.channel) throw new Error("Channel not initialized");

    // Assert exchanges
    await this.channel.assertExchange(this.exchanges.main, "direct", {
      durable: true,
    });
    await this.channel.assertExchange(this.exchanges.deadLetter, "direct", {
      durable: true,
    });

    // Assert queues with dead letter configuration
    await this.channel.assertQueue(this.queues.leaveRequested, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": this.exchanges.deadLetter,
        "x-dead-letter-routing-key": "leave.requested.failed",
        "x-message-ttl": 300000, // 5 minutes
      },
    });

    await this.channel.assertQueue(this.queues.leaveRequestedDLQ, {
      durable: true,
    });

    // Bind queues to exchanges
    await this.channel.bindQueue(
      this.queues.leaveRequested,
      this.exchanges.main,
      "leave.requested"
    );

    await this.channel.bindQueue(
      this.queues.leaveRequestedDLQ,
      this.exchanges.deadLetter,
      "leave.requested.failed"
    );
  }

  async publishLeaveRequest(message: QueueMessage): Promise<void> {
    if (!this.channel) throw new Error("Channel not initialized");

    const messageBuffer = Buffer.from(JSON.stringify(message));

    await this.channel.publish(
      this.exchanges.main,
      "leave.requested",
      messageBuffer,
      {
        persistent: true,
        messageId: message.id,
        timestamp: Date.now(),
      }
    );

    console.log(`Published leave request message: ${message.id}`);
  }

  async consumeLeaveRequests(
    callback: (message: QueueMessage) => Promise<void>
  ): Promise<void> {
    if (!this.channel) throw new Error("Channel not initialized");

    await this.channel.consume(this.queues.leaveRequested, async (msg) => {
      if (!msg) return;

      try {
        const message: QueueMessage = JSON.parse(msg.content.toString());
        await callback(message);
        this.channel!.ack(msg);
      } catch (error) {
        console.error("Error processing leave request message:", error);
        this.channel!.nack(msg, false, false); // Send to DLQ
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

  getChannel(): any {
    return this.channel;
  }
}

export const rabbitMQService = new RabbitMQService();
