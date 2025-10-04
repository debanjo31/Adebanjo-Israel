import { Request, Response } from "express";
import { DepartmentService } from "../services/DepartmentService";
import { ResponseWrapper } from "../utils/ResponseWrapper";

export class DepartmentController {
  private departmentService: DepartmentService;

  constructor() {
    this.departmentService = new DepartmentService();
  }

  createDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = req.body;
      const department = await this.departmentService.createDepartment(name);

      res
        .status(201)
        .json(
          ResponseWrapper.success(department, "Department created successfully")
        );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create department";
      res.status(400).json(ResponseWrapper.error(message));
    }
  };

  getDepartmentEmployees = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const departmentId = parseInt(req.params.id);
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const { employees, total } =
        await this.departmentService.getDepartmentEmployees(
          departmentId,
          page,
          limit
        );

      const totalPages = Math.ceil(total / limit);
      const paginationMeta = {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };

      res.json(
        ResponseWrapper.paginated(
          employees,
          paginationMeta,
          "Employees retrieved successfully"
        )
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to retrieve employees";
      res.status(404).json(ResponseWrapper.error(message));
    }
  };
}
