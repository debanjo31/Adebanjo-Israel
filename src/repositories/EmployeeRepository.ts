import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Employee } from "../entity/Employee";
import {
  BaseRepository,
  PaginatedResult,
  PaginationOptions,
} from "./BaseRepository";

export interface CreateEmployeeDTO {
  name: string;
  email: string;
  departmentId: number;
  employeeCode?: string;
  hireDate?: Date;
}

export interface UpdateEmployeeDTO {
  name?: string;
  email?: string;
  departmentId?: number;
  employeeCode?: string;
  hireDate?: Date;
  isActive?: boolean;
}

export interface IEmployeeRepository {
  findById(id: number): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findByDepartmentPaginated(
    departmentId: number,
    options: PaginationOptions
  ): Promise<PaginatedResult<Employee>>;
  findAll(options: PaginationOptions): Promise<PaginatedResult<Employee>>;
  create(data: CreateEmployeeDTO): Promise<Employee>;
  update(id: number, data: UpdateEmployeeDTO): Promise<Employee | null>;
  delete(id: number): Promise<boolean>;
  findWithLeaveHistory(id: number): Promise<Employee | null>;
}

export class EmployeeRepository
  extends BaseRepository<Employee>
  implements IEmployeeRepository
{
  private repository: Repository<Employee>;

  constructor() {
    super();
    this.repository = AppDataSource.getRepository(Employee);
  }

  protected getEntityName(): string {
    return "Employee";
  }

  async findById(id: number): Promise<Employee | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["department"],
    });
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return await this.repository.findOne({
      where: { email },
      relations: ["department"],
    });
  }

  async findByDepartmentPaginated(
    departmentId: number,
    options: PaginationOptions
  ): Promise<PaginatedResult<Employee>> {
    const validatedOptions = this.validatePaginationOptions(options);
    const { page, limit } = validatedOptions;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      where: {
        departmentId,
      },
      skip,
      take: limit,
      order: { createdAt: "DESC" },
      relations: ["department"],
    });

    return this.createPaginatedResult(data, total, page, limit);
  }

  async findAll(
    options: PaginationOptions
  ): Promise<PaginatedResult<Employee>> {
    const validatedOptions = this.validatePaginationOptions(options);
    const { page, limit } = validatedOptions;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: "DESC" },
      relations: ["department"],
    });

    return this.createPaginatedResult(data, total, page, limit);
  }

  async findWithLeaveHistory(id: number): Promise<Employee | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["department", "leaveRequests"],
      order: {
        leaveRequests: {
          createdAt: "DESC",
        },
      },
    });
  }

  async create(data: CreateEmployeeDTO): Promise<Employee> {
    const employee = this.repository.create(data);
    return await this.repository.save(employee);
  }

  async update(id: number, data: UpdateEmployeeDTO): Promise<Employee | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.update(id, {});
    return result.affected !== undefined && result.affected > 0;
  }
}
