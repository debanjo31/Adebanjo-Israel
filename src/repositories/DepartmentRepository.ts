import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Department } from "../entity/Department";
import {
  BaseRepository,
  PaginatedResult,
  PaginationOptions,
} from "./BaseRepository";

export interface CreateDepartmentDTO {
  name: string;
  description?: string;
}

export interface UpdateDepartmentDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface IDepartmentRepository {
  findById(id: number): Promise<Department | null>;
  findByName(name: string): Promise<Department | null>;
  findAll(options: PaginationOptions): Promise<PaginatedResult<Department>>;
  create(data: CreateDepartmentDTO): Promise<Department>;
  update(id: number, data: UpdateDepartmentDTO): Promise<Department | null>;
  delete(id: number): Promise<boolean>;
  findActive(options: PaginationOptions): Promise<PaginatedResult<Department>>;
}

export class DepartmentRepository
  extends BaseRepository<Department>
  implements IDepartmentRepository
{
  private repository: Repository<Department>;

  constructor() {
    super();
    this.repository = AppDataSource.getRepository(Department);
  }

  protected getEntityName(): string {
    return "Department";
  }

  async findById(id: number): Promise<Department | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["employees"],
    });
  }

  async findByName(name: string): Promise<Department | null> {
    return await this.repository.findOne({
      where: { name },
    });
  }

  async findAll(
    options: PaginationOptions
  ): Promise<PaginatedResult<Department>> {
    const validatedOptions = this.validatePaginationOptions(options);
    const { page, limit } = validatedOptions;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: "DESC" },
      relations: ["employees"],
    });

    return this.createPaginatedResult(data, total, page, limit);
  }

  async findActive(
    options: PaginationOptions
  ): Promise<PaginatedResult<Department>> {
    const validatedOptions = this.validatePaginationOptions(options);
    const { page, limit } = validatedOptions;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: "DESC" },
      relations: ["employees"],
    });

    return this.createPaginatedResult(data, total, page, limit);
  }

  async create(data: CreateDepartmentDTO): Promise<Department> {
    const department = this.repository.create(data);
    return await this.repository.save(department);
  }

  async update(
    id: number,
    data: UpdateDepartmentDTO
  ): Promise<Department | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.update(id, {});
    return result.affected !== undefined && result.affected > 0;
  }
}
