import * as express from "express";
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "./data-source";
import { createRoutes } from "./routes";
import { LeaveRequestQueueService } from "./services/LeaveRequestQueueService";

AppDataSource.initialize()
  .then(async () => {
    // create express app
    const app = express();
    app.use(express.json());

    // Add error handling middleware
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        timestamp: new Date().toISOString(),
      });
    });

    // Register API routes
    app.use("/api", createRoutes());

    // Health check endpoint
    app.get("/health", (_, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Initialize RabbitMQ consumer with graceful fallback
    try {
      const leaveRequestQueueService = new LeaveRequestQueueService();

      // Start consumer but don't wait for it (non-blocking)
      leaveRequestQueueService
        .startConsumer()
        .then(() => {
          console.log("RabbitMQ consumer started successfully");
        })
        .catch((err) => {
          console.error("RabbitMQ consumer encountered an error:", err);
          console.log(
            "API will continue to work, but messages will be queued locally"
          );
        });

      console.log(
        "Application will continue startup regardless of RabbitMQ status"
      );
    } catch (error) {
      console.error("Failed to initialize RabbitMQ service:", error);
      console.log(
        "API will continue to work, but without message queue functionality"
      );
    }

    // start express server
    app.listen(3000);

    console.log(
      "Express server has started on port 3000. Open http://localhost:3000 to see results"
    );
  })
  .catch((error) => console.log(error));
