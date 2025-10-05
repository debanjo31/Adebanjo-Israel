import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { LeaveRequest, LeaveStatus } from "../entity/LeaveRequest";
import { BaseRepository } from "./BaseRepository";

export class LeaveRequestRepository extends BaseRepository<LeaveRequest> {
  private repository: Repository<LeaveRequest>;

  constructor() {
    super();
    this.repository = AppDataSource.getRepository(LeaveRequest);
  }

  protected getEntityName(): string {
    return "LeaveRequest";
  }

  async findById(id: number): Promise<LeaveRequest | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["employee"],
    });
  }

  async findByEmployeeId(employeeId: number): Promise<LeaveRequest[]> {
    return await this.repository.find({
      where: { employeeId },
      order: { createdAt: "DESC" },
    });
  }

  async findPendingRequests(): Promise<LeaveRequest[]> {
    return await this.repository.find({
      where: { status: LeaveStatus.PENDING },
      order: { createdAt: "ASC" },
    });
  }

  async create(data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const leaveRequest = this.repository.create(data);
    return await this.repository.save(leaveRequest);
  }

  async save(leaveRequest: LeaveRequest): Promise<LeaveRequest> {
    return await this.repository.save(leaveRequest);
  }

  async updateStatus(
    id: number,
    status: LeaveStatus
  ): Promise<LeaveRequest | null> {
    await this.repository.update(id, { status });
    return await this.findById(id);
  }
}
