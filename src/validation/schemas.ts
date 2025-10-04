import * as Joi from "joi";

export const createDepartmentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
});

export const createEmployeeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().email().required(),
  departmentId: Joi.number().integer().positive().required(),
});

export const createLeaveRequestSchema = Joi.object({
  employeeId: Joi.number().integer().positive().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
  leaveType: Joi.string()
    .valid("SICK", "VACATION", "PERSONAL", "MATERNITY", "PATERNITY", "OTHER")
    .required(),
  reason: Joi.string().max(1000).optional(),
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
