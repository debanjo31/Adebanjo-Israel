import request from "supertest";
import express from "express";
import { createRoutes } from "../../routes";

let app: express.Application;

beforeAll(async () => {
  // setup.ts already initializes AppDataSource
  app = express();
  app.use(express.json());
  app.use("/api", createRoutes());
});

// No afterAll - setup.ts handles cleanup

describe("API Integration Tests", () => {
  let departmentId: number;
  let employeeId: number;
  const timestamp = Date.now();

  it("should create a department", async () => {
    const response = await request(app)
      .post("/api/departments")
      .send({ name: `Engineering-${timestamp}` });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("id");
    departmentId = response.body.data.id;
  });

  it("should reject duplicate department names", async () => {
    const dupName = `HR-Dept-${timestamp}`;
    await request(app).post("/api/departments").send({ name: dupName });

    const response = await request(app)
      .post("/api/departments")
      .send({ name: dupName })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it("should create an employee", async () => {
    const response = await request(app)
      .post("/api/employees")
      .send({
        name: "John Doe",
        email: `john-${timestamp}@test.com`,
        departmentId,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    employeeId = response.body.data.id;
  });

  it("should reject duplicate employee emails", async () => {
    const dupEmail = `jane-${timestamp}@test.com`;
    await request(app).post("/api/employees").send({
      name: "Jane",
      email: dupEmail,
      departmentId,
    });

    const response = await request(app)
      .post("/api/employees")
      .send({
        name: "Jane Smith",
        email: dupEmail,
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
