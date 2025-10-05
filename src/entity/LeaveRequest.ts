import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Employee } from "./Employee";

export enum LeaveType {
  SICK = "SICK",
  VACATION = "VACATION",
  PERSONAL = "PERSONAL",
  MATERNITY = "MATERNITY",
  PATERNITY = "PATERNITY",
  OTHER = "OTHER",
}

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

@Entity("leave_requests")
@Index(["employeeId", "status"])
@Index(["employeeId", "startDate", "endDate"])
@Index(["status", "createdAt"])
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "employee_id", type: "int" })
  employeeId: number;

  @Column({ name: "start_date", type: "date" })
  startDate: Date;

  @Column({ name: "end_date", type: "date" })
  endDate: Date;

  @Column({ name: "days_count", type: "int" })
  daysCount: number;

  @Column({
    name: "leave_type",
    type: "enum",
    enum: LeaveType,
    default: LeaveType.VACATION,
  })
  leaveType: LeaveType;

  @Column({
    type: "enum",
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  status: LeaveStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Employee, (employee) => employee.leaveRequests)
  @JoinColumn({ name: "employee_id" })
  employee: Employee;

  //   @ManyToOne(() => Employee, { nullable: true })
  //   @JoinColumn({ name: "approved_by" })
  //   approver?: Employee;
}
