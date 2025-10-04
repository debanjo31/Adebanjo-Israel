import { Request, Response } from "express";
import { LeaveRequestService } from "../services/LeaveRequestService";
import { ResponseWrapper } from "../utils/ResponseWrapper";

export class LeaveRequestController {
  private leaveRequestService: LeaveRequestService;

  constructor() {
    this.leaveRequestService = new LeaveRequestService();
  }

  createLeaveRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId, startDate, endDate, leaveType, reason } = req.body;

      const leaveRequest = await this.leaveRequestService.createLeaveRequest({
        employeeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        leaveType,
        reason,
      });

      res
        .status(201)
        .json(
          ResponseWrapper.success(
            leaveRequest,
            "Leave request created successfully"
          )
        );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create leave request";
      res.status(400).json(ResponseWrapper.error(message));
    }
  };
}
