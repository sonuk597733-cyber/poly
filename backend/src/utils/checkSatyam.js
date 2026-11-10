import mongoose from "mongoose";
import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { connectDB, disconnectDB } from "../config/db.js";
import User from "../models/User.js";

async function checkSatyam() {
  await connectDB();
  const satyam = await User.findOne({ email: "satyam7209452235@gmail.com" });
  console.log("Satyam:", {
    id: satyam._id,
    name: satyam.name || satyam.fullName,
    branch: satyam.branch,
    semester: satyam.semester,
    role: satyam.role
  });
  await disconnectDB();
  setTimeout(() => process.exit(0), 200);
}

checkSatyam();
