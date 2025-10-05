import { AppDataSource } from "../data-source";
import { LeaveRequestService } from "../services/LeaveRequestService";
import { Employee } from "../entity/Employee";
import { LeaveType } from "../entity/LeaveRequest";

/**
 * This test script creates a test leave request and sends it to the queue
 */
async function createTestLeaveRequest() {
  console.log("Initializing database connection...");
  await AppDataSource.initialize();

  console.log("Finding a test employee...");
  const employeeRepository = AppDataSource.getRepository(Employee);
  let employee = await employeeRepository.findOne({ where: {} });

  if (!employee) {
    console.log("No employees found. Creating a test employee...");
    employee = new Employee();
    employee.name = "Test Employee";
    employee.email = "test.employee@example.com";
    employee.departmentId = 1; // Make sure this department exists

    employee = await employeeRepository.save(employee);
    console.log(`Created test employee with ID: ${employee.id}`);
  }

  console.log("Creating leave request service...");
  const leaveRequestService = new LeaveRequestService();

  // Test case 1: Short leave (≤ 2 days) - should be auto-approved
  console.log("Creating short leave request (2 days - should auto-approve)...");
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 1); // 2 days including today

  try {
    const shortLeaveRequest = await leaveRequestService.createLeaveRequest({
      employeeId: employee.id,
      startDate,
      endDate,
      leaveType: LeaveType.VACATION,
      reason: "Test short leave request",
    });

    console.log(`Created short leave request with ID: ${shortLeaveRequest.id}`);
  } catch (error) {
    console.error("Failed to create short leave request:", error);
  }

  // Test case 2: Long leave (> 2 days) - should be pending approval
  console.log("Creating long leave request (5 days - should be pending)...");
  const longStartDate = new Date();
  const longEndDate = new Date();
  longEndDate.setDate(longStartDate.getDate() + 4); // 5 days including today

  try {
    const longLeaveRequest = await leaveRequestService.createLeaveRequest({
      employeeId: employee.id,
      startDate: longStartDate,
      endDate: longEndDate,
      leaveType: LeaveType.VACATION,
      reason: "Test long leave request",
    });

    console.log(`Created long leave request with ID: ${longLeaveRequest.id}`);
  } catch (error) {
    console.error("Failed to create long leave request:", error);
  }

  console.log("Test completed! Check the database and logs for results.");

  // Keep the process alive for a short period to allow queue processing
  console.log("Waiting for queue processing (10 seconds)...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Close the database connection
  await AppDataSource.destroy();
  console.log("Database connection closed.");

  process.exit(0);
}

createTestLeaveRequest().catch((error) => {
  console.error("Test script failed:", error);
  process.exit(1);
});
