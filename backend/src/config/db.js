import dns from "node:dns";
import mongoose from "mongoose";

let isConnecting = false;

/**
 * Centralized MongoDB connection manager
 * Supports both MongoDB Atlas (SRV) and local MongoDB instances.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/collegeos";

  // Configure public DNS servers for Atlas SRV resolution on Windows
  if (uri.startsWith("mongodb+srv://")) {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // Ignore if setServers fails in restricted environments
    }
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return new Promise((resolve, reject) => {
      mongoose.connection.once("open", () => resolve(mongoose.connection));
      mongoose.connection.once("error", reject);
    });
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      isConnecting = true;
      console.log(`[MongoDB] Connecting to database (attempt ${attempt}/${maxAttempts})...`);

      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 25000,
        connectTimeoutMS: 25000,
        autoIndex: true
      });

      isConnecting = false;
      const { host, port, name } = conn.connection;
      console.log(`[MongoDB] Connected successfully to ${host}${port ? `:${port}` : ""}/${name}`);

      mongoose.connection.on("error", (err) => {
        console.error("[MongoDB] Connection error:", err.message);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("[MongoDB] Disconnected from database.");
      });

      return conn.connection;
    } catch (error) {
      isConnecting = false;
      console.error(`[MongoDB] Connection attempt ${attempt} failed:`, error.message);
      if (attempt === maxAttempts) {
        if (uri.includes("mongodb.net") && process.env.NODE_ENV !== "production") {
          console.warn(
            "[MongoDB Tip] If your Atlas connection times out, ensure your IP address is whitelisted in Atlas Network Access, or use local 'mongodb://127.0.0.1:27017/collegeos'."
          );
        }
        throw error;
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

/**
 * Returns structured DB health status
 */
export function getDBStatus() {
  const state = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  return {
    connected: state === 1,
    state: states[state] || "unknown",
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null
  };
}

/**
 * Clean disconnect for graceful shutdown and tests
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("[MongoDB] Closed database connection.");
  }
}
