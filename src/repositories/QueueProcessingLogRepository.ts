import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueueProcessingLog, QueueStatus } from "../entity/QueueProcessingLog";
import { BaseRepository } from "./BaseRepository";

export class QueueProcessingLogRepository extends BaseRepository<QueueProcessingLog> {
  private repository: Repository<QueueProcessingLog>;

  constructor() {
    super();
    this.repository = AppDataSource.getRepository(QueueProcessingLog);
  }

  protected getEntityName(): string {
    return "QueueProcessingLog";
  }

  async findByMessageId(messageId: string): Promise<QueueProcessingLog | null> {
    return await this.repository.findOne({
      where: { messageId },
    });
  }

  async findFailedMessages(): Promise<QueueProcessingLog[]> {
    return await this.repository.find({
      where: { status: QueueStatus.FAILED },
      order: { createdAt: "DESC" },
    });
  }

  async create(data: Partial<QueueProcessingLog>): Promise<QueueProcessingLog> {
    const log = this.repository.create(data);
    return await this.repository.save(log);
  }

  async save(log: QueueProcessingLog): Promise<QueueProcessingLog> {
    return await this.repository.save(log);
  }

  async updateStatus(
    id: number,
    status: QueueStatus,
    errorMessage?: string
  ): Promise<void> {
    await this.repository.update(id, { status, errorMessage });
  }
}
