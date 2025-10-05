import { DepartmentRepository } from "../repositories/DepartmentRepository";
import { EmployeeRepository } from "../repositories/EmployeeRepository";

export class DepartmentService {
  private departmentRepository: DepartmentRepository;
  private employeeRepository: EmployeeRepository;

  constructor(
    departmentRepository?: DepartmentRepository,
    employeeRepository?: EmployeeRepository
  ) {
    this.departmentRepository =
      departmentRepository || new DepartmentRepository();
    this.employeeRepository = employeeRepository || new EmployeeRepository();
  }

  async createDepartment(name: string): Promise<any> {
    const existingDepartment = await this.departmentRepository.findByName(name);
    if (existingDepartment) {
      throw new Error("Department with this name already exists");
    }

    return await this.departmentRepository.create({ name });
  }

  async getDepartmentEmployees(
    departmentId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ employees: any[]; total: number }> {
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      throw new Error("Department not found");
    }

    const result = await this.employeeRepository.findByDepartmentPaginated(
      departmentId,
      { page, limit }
    );

    return { employees: result.data, total: result.total };
  }
}
