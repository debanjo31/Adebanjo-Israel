import { Router } from "express";
import { DepartmentController } from "./controllers/DepartmentController";
import { EmployeeController } from "./controllers/EmployeeController";
import { LeaveRequestController } from "./controllers/LeaveRequestController";
import { HealthController } from "./controllers/HealthController";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "./validation/middleware";
import {
  createDepartmentSchema,
  createEmployeeSchema,
  createLeaveRequestSchema,
  idParamSchema,
  paginationSchema,
} from "./validation/schemas";

export const createRoutes = (): Router => {
  const router = Router();

  // Controllers
  const departmentController = new DepartmentController();
  const employeeController = new EmployeeController();
  const leaveRequestController = new LeaveRequestController();
  const healthController = new HealthController();

  // Health check routes (no /api prefix)
  router.get("/health", healthController.checkHealth);
  router.get("/queue-health", healthController.checkQueueHealth);
  router.get("/db-health", healthController.checkDbHealth);
  router.get("/redis-health", healthController.checkRedisHealth);

  // Department routes
  router.post(
    "/departments",
    validateBody(createDepartmentSchema),
    departmentController.createDepartment
  );

  router.get(
    "/departments/:id/employees",
    validateParams(idParamSchema),
    validateQuery(paginationSchema),
    departmentController.getDepartmentEmployees
  );

  // Employee routes
  router.post(
    "/employees",
    validateBody(createEmployeeSchema),
    employeeController.createEmployee
  );

  router.get(
    "/employees/:id",
    validateParams(idParamSchema),
    employeeController.getEmployeeWithLeaveHistory
  );

  // Leave request routes
  router.post(
    "/leave-requests",
    validateBody(createLeaveRequestSchema),
    leaveRequestController.createLeaveRequest
  );

  return router;
};
