import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum QueueStatus {
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  RETRY = "RETRY",
}

@Entity("queue_processing_log")
@Index(["messageId"])
@Index(["status"])
@Index(["createdAt"])
export class QueueProcessingLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "message_id", type: "varchar", length: 255, unique: true })
  messageId: string;

  @Column({ name: "queue_name", type: "varchar", length: 100 })
  queueName: string;

  @Column({ type: "json", nullable: true })
  payload?: any;

  @Column({
    type: "enum",
    enum: QueueStatus,
    default: QueueStatus.PROCESSING,
  })
  status: QueueStatus;

  @Column({ name: "retry_count", default: 0 })
  retryCount: number;

  @Column({ name: "max_retries", default: 3 })
  maxRetries: number;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage?: string;

  @Column({ name: "processed_at", type: "timestamp", nullable: true })
  processedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
