import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: ".env" });
}
import mongoose from "mongoose";

async function check() {
  const uri = process.env.MONGODB_URI.includes("cluster0.usxbleg.mongodb.net") 
    ? "mongodb://sonuk597733_db_user:QKjkp6dHUZQ3saLC@ac-lopa0al-shard-00-00.usxbleg.mongodb.net:27017,ac-lopa0al-shard-00-01.usxbleg.mongodb.net:27017,ac-lopa0al-shard-00-02.usxbleg.mongodb.net:27017/collegeos?ssl=true&authSource=admin&retryWrites=true&w=majority"
    : process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const students = await mongoose.connection.collection("users").find({ role: "student" }).toArray();
  console.log("Total students in DB:", students.length);
  for (const s of students) {
    const prof = await mongoose.connection.collection("studentprofiles").findOne({ userId: s._id });
    console.log(`Student: ${s.email} | id: ${s._id} | Name: ${s.name} | Branch: ${prof?.branch} | Sem: ${prof?.semester}`);
  }

  const lectures = await mongoose.connection.collection("lectures").find({}).toArray();
  console.log("\nTotal lectures in DB:", lectures.length);
  for (const l of lectures) {
    console.log(`Lecture: [${l._id}] ${l.title} | Branch: ${l.branch} | Sem: ${l.semester} | Subj: ${l.subject} | Status: ${l.status}`);
  }

  const progresses = await mongoose.connection.collection("lectureprogresses").find({}).toArray();
  console.log("\nTotal lecture progresses in DB:", progresses.length);
  for (const p of progresses) {
    console.log(`Progress: student: ${p.studentId} | lec: ${p.lectureId} | %: ${p.completionPercentage} | completed: ${p.isCompleted} | pos: ${p.lastPlaybackPosition}`);
  }

  await mongoose.disconnect();
}

check().catch(console.error);
