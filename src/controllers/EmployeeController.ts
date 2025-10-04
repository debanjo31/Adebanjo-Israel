import { Request, Response } from "express";
import { EmployeeService } from "../services/EmployeeService";
import { ResponseWrapper } from "../utils/ResponseWrapper";

export class EmployeeController {
  private employeeService: EmployeeService;

  constructor() {
    this.employeeService = new EmployeeService();
  }

  createEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, departmentId } = req.body;
      const employee = await this.employeeService.createEmployee({
        name,
        email,
        departmentId,
      });

      res
        .status(201)
        .json(
          ResponseWrapper.success(employee, "Employee created successfully")
        );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create employee";
      res.status(400).json(ResponseWrapper.error(message));
    }
  };

  getEmployeeWithLeaveHistory = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const employeeId = parseInt(req.params.id);
      const employee = await this.employeeService.getEmployeeWithLeaveHistory(
        employeeId
      );

      res.json(
        ResponseWrapper.success(employee, "Employee retrieved successfully")
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to retrieve employee";
      res.status(404).json(ResponseWrapper.error(message));
    }
  };
}
