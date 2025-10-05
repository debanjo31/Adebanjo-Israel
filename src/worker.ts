import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { LeaveRequestQueueService } from "./services/LeaveRequestQueueService";

AppDataSource.initialize()
  .then(async () => {
    console.log("✅ Worker: Database connected");

    const queueService = new LeaveRequestQueueService();

    await queueService.startConsumer();

    console.log("🎧 Worker: Now consuming messages from leave.requested queue");
    console.log("📊 Worker: Ready to process leave requests");
  })
  .catch((error) => {
    console.error("Worker: Initialization error:", error);
    process.exit(1);
  });
