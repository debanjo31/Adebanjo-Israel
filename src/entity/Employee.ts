// src/entities/Employee.ts
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

  @Column()
  name: string;

  @Column({ unique: true }) // Unique email
  email: string;

  @Column({ name: "department_id" })
  departmentId: number;

  @Index("idx_departmentId") // Index for department filtering
  @ManyToOne(() => Department, (department) => department.employees, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "department_id" })
  department: Department;

  //   @Column({ type: "enum", enum: EmployeeRole, default: EmployeeRole.STAFF })
  //   role: EmployeeRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.employee)
  leaveRequests: LeaveRequest[]; // Relation for leave history
}
