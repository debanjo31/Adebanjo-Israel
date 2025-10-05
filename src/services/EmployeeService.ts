import { EmployeeRepository } from "../repositories/EmployeeRepository";
import { DepartmentRepository } from "../repositories/DepartmentRepository";
import { CacheService } from "./CacheService";

export class EmployeeService {
  private employeeRepository: EmployeeRepository;
  private departmentRepository: DepartmentRepository;
  private cacheService: CacheService;

  constructor(
    employeeRepository?: EmployeeRepository,
    departmentRepository?: DepartmentRepository,
    cacheService?: CacheService
  ) {
    this.employeeRepository = employeeRepository || new EmployeeRepository();
    this.departmentRepository =
      departmentRepository || new DepartmentRepository();
    this.cacheService = cacheService || CacheService.getInstance();
  }

  async createEmployee(data: {
    name: string;
    email: string;
    departmentId: number;
  }): Promise<any> {
    // Check if employee email is unique
    const existingEmployee = await this.employeeRepository.findByEmail(
      data.email
    );

    if (existingEmployee) {
      throw new Error("Employee with this email already exists");
    }

    // Verify department exists
    const department = await this.departmentRepository.findById(
      data.departmentId
    );

    if (!department) {
      throw new Error("Department not found");
    }

    // Create employee using repository
    return await this.employeeRepository.create(data);
  }

  async getEmployeeWithLeaveHistory(id: number): Promise<any> {
    // Try to get from cache first
    const cacheKey = `employee:${id}`;
    const cachedEmployee = await this.cacheService.get<any>(cacheKey);

    if (cachedEmployee) {
      console.log(`Cache hit for employee ${id}`);
      return cachedEmployee;
    }

    console.log(`Cache miss for employee ${id}`);

    // Use repository method
    const employee = await this.employeeRepository.findWithLeaveHistory(id);

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Cache for 5 minutes (300 seconds)
    await this.cacheService.set(cacheKey, employee, 300);

    return employee;
  }
}
