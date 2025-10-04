import { AppDataSource } from "../data-source";
import { Employee } from "../entity/Employee";
import { Department } from "../entity/Department";

export class EmployeeService {
  private employeeRepository = AppDataSource.getRepository(Employee);
  private departmentRepository = AppDataSource.getRepository(Department);

  async createEmployee(data: {
    name: string;
    email: string;
    departmentId: number;
  }): Promise<Employee> {
    // Check if employee email is unique
    const existingEmployee = await this.employeeRepository.findOne({
      where: { email: data.email },
    });

    if (existingEmployee) {
      throw new Error("Employee with this email already exists");
    }

    // Verify department exists
    const department = await this.departmentRepository.findOne({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    // Create employee
    const employee = this.employeeRepository.create(data);
    return await this.employeeRepository.save(employee);
  }

  async getEmployeeWithLeaveHistory(id: number): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: ["leaveRequests", "department"],
      order: {
        leaveRequests: {
          startDate: "DESC",
        },
      },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    return employee;
  }
}
