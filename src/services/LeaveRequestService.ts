import { AppDataSource } from "../data-source";
import { LeaveRequest, LeaveType, LeaveStatus } from "../entity/LeaveRequest";
import { Employee } from "../entity/Employee";
import { LeaveRequestQueueService } from "./LeaveRequestQueueService";

export class LeaveRequestService {
  private leaveRequestRepository = AppDataSource.getRepository(LeaveRequest);
  private employeeRepository = AppDataSource.getRepository(Employee);
  private leaveRequestQueueService = new LeaveRequestQueueService();

  async createLeaveRequest(data: {
    employeeId: number;
    startDate: Date;
    endDate: Date;
    leaveType: string;
    reason?: string;
  }): Promise<LeaveRequest> {
    // Check if employee exists
    const employee = await this.employeeRepository.findOne({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Calculate days count (excluding weekends)
    const daysDiff = this.calculateBusinessDays(data.startDate, data.endDate);

    // Create leave request
    const leaveRequest = new LeaveRequest();
    leaveRequest.employeeId = data.employeeId;
    leaveRequest.startDate = data.startDate;
    leaveRequest.endDate = data.endDate;
    leaveRequest.daysCount = daysDiff;
    leaveRequest.leaveType = data.leaveType as LeaveType;
    leaveRequest.status = LeaveStatus.PENDING;

    // Save the leave request first to get the ID
    const savedLeaveRequest = await this.leaveRequestRepository.save(
      leaveRequest
    );

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
