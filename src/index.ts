import * as express from "express";
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "./data-source";
import { createRoutes } from "./routes";

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

    // start express server
    app.listen(3000);

    console.log(
      "Express server has started on port 3000. Open http://localhost:3000 to see results"
    );
  })
  .catch((error) => console.log(error));
