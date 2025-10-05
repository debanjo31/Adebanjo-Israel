import { LeaveRequest, LeaveType, LeaveStatus } from "../entity/LeaveRequest";
import { LeaveRequestRepository } from "../repositories/LeaveRequestRepository";
import { EmployeeRepository } from "../repositories/EmployeeRepository";
import { LeaveRequestQueueService } from "./LeaveRequestQueueService";

export class LeaveRequestService {
  private leaveRequestRepository: LeaveRequestRepository;
  private employeeRepository: EmployeeRepository;
  private leaveRequestQueueService: LeaveRequestQueueService;

  constructor(
    leaveRequestRepository?: LeaveRequestRepository,
    employeeRepository?: EmployeeRepository,
    leaveRequestQueueService?: LeaveRequestQueueService
  ) {
    this.leaveRequestRepository =
      leaveRequestRepository || new LeaveRequestRepository();
    this.employeeRepository = employeeRepository || new EmployeeRepository();
    this.leaveRequestQueueService =
      leaveRequestQueueService || new LeaveRequestQueueService();
  }

  async createLeaveRequest(data: {
    employeeId: number;
    startDate: Date;
    endDate: Date;
    leaveType: string;
    reason?: string;
  }): Promise<any> {
    // Check if employee exists using repository
    const employee = await this.employeeRepository.findById(data.employeeId);

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Calculate days count (excluding weekends)
    const daysDiff = this.calculateBusinessDays(data.startDate, data.endDate);

    // Create leave request using repository
    const savedLeaveRequest = await this.leaveRequestRepository.create({
      employeeId: data.employeeId,
      startDate: data.startDate,
      endDate: data.endDate,
      daysCount: daysDiff,
      leaveType: data.leaveType as LeaveType,
      status: LeaveStatus.PENDING,
    });

    // Then publish to the queue for processing
    await this.leaveRequestQueueService.publishLeaveRequest(savedLeaveRequest);

    return savedLeaveRequest;
  }

  private calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const curDate = new Date(startDate.getTime());

    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }

    return count;
  }
}
