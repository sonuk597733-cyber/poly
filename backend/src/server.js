
import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    // 1. Establish MongoDB connection
    await connectDB();

    // 2. Start Express listener
    const server = app.listen(PORT, () => {
      console.log("==================================================");
      console.log(`[CollegeOS] Server running on port ${PORT}`);
      console.log(`[CollegeOS] Healthcheck: http://localhost:${PORT}/api/health`);
      console.log(`[CollegeOS] Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("==================================================");
    });

    // 2B. Configure extended timeouts for large video & document uploads (up to 600MB)
    server.timeout = 0; // Disable socket inactivity timeout for large uploads
    server.keepAliveTimeout = 120000; // 2 minutes keep-alive
    server.headersTimeout = 125000;
    if (server.requestTimeout !== undefined) {
      server.requestTimeout = 0;
    }

    // 3. Graceful shutdown handler
    const handleShutdown = async (signal) => {
      console.log(`\n[CollegeOS] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log("[CollegeOS] HTTP server closed.");
        await disconnectDB();
        process.exit(0);
      });

      // Force close after 10s timeout
      setTimeout(() => {
        console.error("[CollegeOS] Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));
  } catch (error) {
    console.error("[CollegeOS Fatal] Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
