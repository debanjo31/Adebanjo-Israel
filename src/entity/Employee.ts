import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Department } from "./Department";
import { LeaveRequest } from "./LeaveRequest";

// export enum EmployeeRole {
//   MANAGER = "MANAGER",
//   SUPERVISOR = "SUPERVISOR",
//   STAFF = "STAFF",
//   INTERN = "INTERN",
// }

@Entity("employees")
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 }) // Explicit type for name
  name: string;

  @Column({ type: "varchar", length: 255, unique: true }) // Explicit type for email
  email: string;

  @Column({ type: "int", name: "department_id" }) // Explicit type for departmentId
  departmentId: number;

  @Index("idx_departmentId") // Index for department filtering
  @ManyToOne(() => Department, (department) => department.employees, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "department_id" })
  department: Department;

  // @Column({ type: "enum", enum: EmployeeRole, default: EmployeeRole.STAFF })
  // role: EmployeeRole; // Uncomment if using roles (bonus point)

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.employee)
  leaveRequests: LeaveRequest[]; // Relation for leave history
}
