import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve("backend/.env") });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const sessColl = mongoose.connection.collection("subjectattendancesessions");
  const recColl = mongoose.connection.collection("subjectattendancerecords");

  const dupSessionId = new mongoose.Types.ObjectId("6aea3c87b944a20ecb60c63b");
  const recs = await recColl.find({ sessionId: dupSessionId }).toArray();
  console.log("Records for duplicate session:", recs.length);

  // Remove duplicate test session and records
  await recColl.deleteMany({ sessionId: dupSessionId });
  await sessColl.deleteOne({ _id: dupSessionId });
  console.log("Deleted duplicate session 6aea3c87b944a20ecb60c63b");

  await mongoose.disconnect();
}
check();
