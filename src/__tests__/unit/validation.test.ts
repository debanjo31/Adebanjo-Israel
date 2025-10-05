import {
  createDepartmentSchema,
  createEmployeeSchema,
  createLeaveRequestSchema,
} from "../../validation/schemas";

describe("Validation Schemas", () => {
  describe("createDepartmentSchema", () => {
    it("should validate correct department data", () => {
      const { error } = createDepartmentSchema.validate({
        name: "Engineering",
      });
      expect(error).toBeUndefined();
    });

    it("should reject short names", () => {
      const { error } = createDepartmentSchema.validate({ name: "E" });
      expect(error).toBeDefined();
    });

    it("should reject missing name", () => {
      const { error } = createDepartmentSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe("createEmployeeSchema", () => {
    it("should validate correct employee data", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        departmentId: 1,
      };
      const { error } = createEmployeeSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it("should reject invalid email", () => {
      const data = {
        name: "John Doe",
        email: "invalid-email",
        departmentId: 1,
      };
      const { error } = createEmployeeSchema.validate(data);
      expect(error).toBeDefined();
    });

    it("should reject negative departmentId", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        departmentId: -1,
      };
      const { error } = createEmployeeSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe("createLeaveRequestSchema", () => {
    it("should validate correct leave request", () => {
      const data = {
        employeeId: 1,
        startDate: "2024-01-01",
        endDate: "2024-01-05",
        leaveType: "VACATION",
      };
      const { error } = createLeaveRequestSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it("should reject endDate before startDate", () => {
      const data = {
        employeeId: 1,
        startDate: "2024-01-05",
        endDate: "2024-01-01",
        leaveType: "VACATION",
      };
      const { error } = createLeaveRequestSchema.validate(data);
      expect(error).toBeDefined();
    });

    it("should reject invalid leave type", () => {
      const data = {
        employeeId: 1,
        startDate: "2024-01-01",
        endDate: "2024-01-05",
        leaveType: "INVALID",
      };
      const { error } = createLeaveRequestSchema.validate(data);
      expect(error).toBeDefined();
    });
  });
});
