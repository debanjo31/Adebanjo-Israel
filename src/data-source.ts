import "reflect-metadata";
import { DataSource } from "typeorm";
import { Employee } from "./entity/Employee";
import { Department } from "./entity/Department";
import { LeaveRequest } from "./entity/LeaveRequest";
import { QueueProcessingLog } from "./entity/QueueProcessingLog";
import { config } from "./config";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  synchronize: false, // Disabled - using existing perfect schema
  logging: config.app.nodeEnv === "development",
  entities: [Employee, Department, LeaveRequest, QueueProcessingLog],
  migrations: ["src/migration/*.ts"],
  subscribers: ["src/subscriber/*.ts"],
  extra: {
    // Connection pool settings for scalability
    connectionLimit: 10,
  },
});
