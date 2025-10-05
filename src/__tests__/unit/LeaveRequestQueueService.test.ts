import { LeaveRequestQueueService } from "../../services/LeaveRequestQueueService";
import { LeaveRequest, LeaveStatus } from "../../entity/LeaveRequest";

describe("LeaveRequestQueueService - Business Rules", () => {
  let service: LeaveRequestQueueService;

  beforeEach(() => {
    service = new LeaveRequestQueueService();
  });

  describe("applyLeaveRequestRules", () => {
    it("should auto-approve leaves <= 2 days", async () => {
      const leaveRequest = new LeaveRequest();
      leaveRequest.id = 1;
      leaveRequest.daysCount = 2;
      leaveRequest.status = LeaveStatus.PENDING;

      // Mock repository save
      const mockSave = jest.fn().mockResolvedValue(leaveRequest);
      (service as any).leaveRequestRepository = {
        save: mockSave,
      };

      await (service as any).applyLeaveRequestRules(leaveRequest);

      expect(leaveRequest.status).toBe(LeaveStatus.APPROVED);
      expect(mockSave).toHaveBeenCalledWith(leaveRequest);
    });

    it("should mark leaves > 2 days as PENDING", async () => {
      const leaveRequest = new LeaveRequest();
      leaveRequest.id = 1;
      leaveRequest.daysCount = 5;
      leaveRequest.status = LeaveStatus.PENDING;

      const mockSave = jest.fn().mockResolvedValue(leaveRequest);
      (service as any).leaveRequestRepository = {
        save: mockSave,
      };

      await (service as any).applyLeaveRequestRules(leaveRequest);

      expect(leaveRequest.status).toBe(LeaveStatus.PENDING);
    });

    it("should approve exactly 1 day leave", async () => {
      const leaveRequest = new LeaveRequest();
      leaveRequest.id = 1;
      leaveRequest.daysCount = 1;

      const mockSave = jest.fn().mockResolvedValue(leaveRequest);
      (service as any).leaveRequestRepository = {
        save: mockSave,
      };

      await (service as any).applyLeaveRequestRules(leaveRequest);

      expect(leaveRequest.status).toBe(LeaveStatus.APPROVED);
    });
  });
});
