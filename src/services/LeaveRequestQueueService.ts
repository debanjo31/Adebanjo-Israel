import { LeaveRequest, LeaveStatus } from "../entity/LeaveRequest";
import { QueueProcessingLog, QueueStatus } from "../entity/QueueProcessingLog";
import { LeaveRequestRepository } from "../repositories/LeaveRequestRepository";
import { QueueProcessingLogRepository } from "../repositories/QueueProcessingLogRepository";
import {
  RabbitMQService,
  QueueName,
  QueueMessage,
} from "../services/RabbitMQService";
import { RetryPolicyFactory } from "../utils/RetryPolicy";
import { v4 as uuidv4 } from "uuid";

export interface LeaveRequestQueueData {
  leaveRequestId: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  daysCount: number;
  leaveType: string;
}

export class LeaveRequestQueueService {
  private leaveRequestRepository: LeaveRequestRepository;
  private queueLogRepository: QueueProcessingLogRepository;
  private rabbitMQService: RabbitMQService;
  private retryPolicy = RetryPolicyFactory.getRetryPolicy("exponential");

  constructor(
    leaveRequestRepository?: LeaveRequestRepository,
    queueLogRepository?: QueueProcessingLogRepository,
    rabbitMQService?: RabbitMQService
  ) {
    this.leaveRequestRepository =
      leaveRequestRepository || new LeaveRequestRepository();
    this.queueLogRepository =
      queueLogRepository || new QueueProcessingLogRepository();
    this.rabbitMQService = rabbitMQService || RabbitMQService.getInstance();
  }

  /**
   * Publish leave request to queue
   */
  public async publishLeaveRequest(
    leaveRequest: LeaveRequest
  ): Promise<string> {
    // Prepare data for queue
    const data: LeaveRequestQueueData = {
      leaveRequestId: leaveRequest.id,
      employeeId: leaveRequest.employeeId,
      startDate: leaveRequest.startDate.toISOString().split("T")[0],
      endDate: leaveRequest.endDate.toISOString().split("T")[0],
      daysCount: leaveRequest.daysCount,
      leaveType: leaveRequest.leaveType,
    };

    try {
      // Publish to queue
      const messageId = await this.rabbitMQService.publishMessage(
        QueueName.LEAVE_REQUEST,
        data
      );

      // Log the queue message
      await this.logQueueMessage(messageId, QueueName.LEAVE_REQUEST, data);

      return messageId;
    } catch (error) {
      console.error("Failed to publish message to queue:", error);

      // Create a log entry for the failed message
      const messageId = uuidv4();
      await this.queueLogRepository.create({
        messageId,
        queueName: QueueName.LEAVE_REQUEST,
        payload: data,
        status: QueueStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      return messageId;
    }
  }

  /**
   * Log queue message for tracking
   */
  private async logQueueMessage(
    messageId: string,
    queueName: string,
    payload: any
  ): Promise<QueueProcessingLog> {
    return await this.queueLogRepository.create({
      messageId,
      queueName,
      payload,
      status: QueueStatus.PROCESSING,
    });
  }

  /**
   * Start consumer for processing leave requests
   */
  public async startConsumer(): Promise<void> {
    console.log("Starting leave request queue consumer...");

    try {
      // Connect to RabbitMQ
      await this.rabbitMQService.connect();

      // Set up consumer
      await this.rabbitMQService.consumeMessages<LeaveRequestQueueData>(
        QueueName.LEAVE_REQUEST,
        async (message) => {
          try {
            await this.processLeaveRequest(message);
          } catch (error) {
            console.error(`Error processing message ${message.id}:`, error);
          }
        }
      );

      console.log(`Consumer started for ${QueueName.LEAVE_REQUEST} queue`);
    } catch (error) {
      console.error("Failed to start leave request consumer:", error);

      // Retry after delay
      setTimeout(() => this.startConsumer(), 10000);
    }
  }

  /**
   * Process a leave request message
   */
  private async processLeaveRequest(
    message: QueueMessage<LeaveRequestQueueData>
  ): Promise<void> {
    console.log(`Processing leave request message ${message.id}`);

    // Check if this message has been processed before (idempotency)
    const existingLog = await this.queueLogRepository.findByMessageId(
      message.id
    );

    if (existingLog && existingLog.status === QueueStatus.COMPLETED) {
      console.log(`Message ${message.id} already processed. Skipping.`);
      return;
    }

    try {
      // Find or create log entry
      const logEntry =
        existingLog ||
        (await this.logQueueMessage(
          message.id,
          QueueName.LEAVE_REQUEST,
          message.data
        ));

      // Find the leave request using repository
      const leaveRequest = await this.leaveRequestRepository.findById(
        message.data.leaveRequestId
      );

      if (!leaveRequest) {
        throw new Error(
          `Leave request #${message.data.leaveRequestId} not found`
        );
      }

      // Apply business rules to determine status
      await this.applyLeaveRequestRules(leaveRequest);

      // Update log as completed
      logEntry.status = QueueStatus.COMPLETED;
      logEntry.processedAt = new Date();
      await this.queueLogRepository.save(logEntry);

      console.log(`Successfully processed leave request #${leaveRequest.id}`);
    } catch (error) {
      console.error(
        `Error processing leave request message ${message.id}:`,
        error
      );

      // Handle retry logic
      await this.handleProcessingError(
        message,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Apply business rules to determine leave request status
   */
  private async applyLeaveRequestRules(
    leaveRequest: LeaveRequest
  ): Promise<void> {
    try {
      // Business Rule: Auto-approve short leaves (≤ 2 days)
      if (leaveRequest.daysCount <= 2) {
        leaveRequest.status = LeaveStatus.APPROVED;
        console.log(
          `Auto-approved leave request #${leaveRequest.id} (${leaveRequest.daysCount} days)`
        );
      } else {
        // Longer leaves require approval
        leaveRequest.status = LeaveStatus.PENDING;
        console.log(
          `Marked leave request #${leaveRequest.id} as pending approval (${leaveRequest.daysCount} days)`
        );
      }

      // Save the updated leave request using repository
      await this.leaveRequestRepository.save(leaveRequest);
    } catch (error) {
      console.error(
        `Error applying rules to leave request #${leaveRequest.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Handle processing errors and retry logic
   */
  private async handleProcessingError(
    message: QueueMessage<LeaveRequestQueueData>,
    error: Error
  ): Promise<void> {
    // Find the log entry using repository
    const logEntry = await this.queueLogRepository.findByMessageId(message.id);

    if (!logEntry) {
      console.error(`Log entry for message ${message.id} not found`);
      return;
    }

    // Update error info
    logEntry.errorMessage = error.message;
    logEntry.retryCount += 1;

    // Determine if we should retry
    if (
      this.retryPolicy.shouldRetry(
        logEntry.retryCount,
        logEntry.maxRetries,
        error
      )
    ) {
      logEntry.status = QueueStatus.RETRY;
      await this.queueLogRepository.save(logEntry);

      // Calculate retry delay
      const retryDelay = this.retryPolicy.calculateNextRetryDelay(
        logEntry.retryCount
      );
      console.log(
        `Will retry message ${message.id} in ${retryDelay}ms (attempt ${logEntry.retryCount})`
      );

      // Schedule retry after delay
      setTimeout(async () => {
        await this.rabbitMQService.publishMessage(
          QueueName.LEAVE_REQUEST,
          message.data
        );
      }, retryDelay);
    } else {
      // Max retries exceeded
      console.error(
        `Max retries (${logEntry.maxRetries}) exceeded for message ${message.id}`
      );
      logEntry.status = QueueStatus.FAILED;
      await this.queueLogRepository.save(logEntry);
    }
  }
}
