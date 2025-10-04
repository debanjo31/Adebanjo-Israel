import { AppDataSource } from "../data-source";
import { Department } from "../entity/Department";
import { Employee } from "../entity/Employee";

export class DepartmentService {
  private departmentRepository = AppDataSource.getRepository(Department);
  private employeeRepository = AppDataSource.getRepository(Employee);

  async createDepartment(name: string): Promise<Department> {
    const existingDepartment = await this.departmentRepository.findOne({
      where: { name },
    });
    if (existingDepartment) {
      throw new Error("Department with this name already exists");
    }

    const department = this.departmentRepository.create({ name });
    return await this.departmentRepository.save(department);
  }

  async getDepartmentEmployees(
    departmentId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ employees: Employee[]; total: number }> {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });
    if (!department) {
      throw new Error("Department not found");
    }

    const [employees, total] = await this.employeeRepository.findAndCount({
      where: { department: { id: departmentId } },
      skip: (page - 1) * limit,
      take: limit,
      order: { id: "ASC" },
    });

    return { employees, total };
  }
}
