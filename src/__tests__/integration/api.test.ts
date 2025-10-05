import request from "supertest";
import * as express from "express";
import { AppDataSource } from "../../data-source";
import { createRoutes } from "../../routes";

let app: express.Application;

beforeAll(async () => {
  await AppDataSource.initialize();
  app = express();
  app.use(express.json());
  app.use("/api", createRoutes());
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("API Integration Tests", () => {
  let departmentId: number;
  let employeeId: number;

  it("should create a department", async () => {
    const response = await request(app)
      .post("/api/departments")
      .send({ name: "Engineering" })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("id");
    departmentId = response.body.data.id;
  });

  it("should reject duplicate department names", async () => {
    await request(app).post("/api/departments").send({ name: "HR Dept" });

    const response = await request(app)
      .post("/api/departments")
      .send({ name: "HR Dept" })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it("should create an employee", async () => {
    const response = await request(app)
      .post("/api/employees")
      .send({
        name: "John Doe",
        email: "john@test.com",
        departmentId,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    employeeId = response.body.data.id;
  });

  it("should reject duplicate employee emails", async () => {
    await request(app).post("/api/employees").send({
      name: "Jane",
      email: "jane@test.com",
      departmentId,
    });

    const response = await request(app)
      .post("/api/employees")
      .send({
        name: "Jane Smith",
        email: "jane@test.com",
        departmentId,
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it("should get employees with pagination", async () => {
    const response = await request(app)
      .get(`/api/departments/${departmentId}/employees?page=1&limit=10`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.pagination).toBeDefined();
  });

  it("should get employee with leave history", async () => {
    const response = await request(app)
      .get(`/api/employees/${employeeId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("leaveRequests");
  });

  it("should create a leave request", async () => {
    const response = await request(app)
      .post("/api/leave-requests")
      .send({
        employeeId,
        startDate: "2024-06-01",
        endDate: "2024-06-02",
        leaveType: "VACATION",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("PENDING");
  });

  it("should return 404 for non-existent employee", async () => {
    await request(app).get("/api/employees/99999").expect(404);
  });
});
