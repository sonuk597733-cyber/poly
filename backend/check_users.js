import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
import { connectDB, disconnectDB } from "./src/config/db.js";
import User from "./src/models/User.js";
import CampusRoom from "./src/models/CampusRoom.js";
import Subject from "./src/models/Subject.js";

async function main() {
  await connectDB();
  const users = await User.find({}, "fullName email role status").lean();
  console.log("=== ATLAS USERS ===");
  users.forEach(u => console.log(u.role, "|", u.email, "|", u.fullName));

  // Check if coordinator exists in Atlas
  let coord = await User.findOne({ email: "coordinator.demo@subharti.org" });
  if (!coord) {
    const hash = await User.hashPassword("Coord@123");
    coord = await User.create({
      fullName: "Er. Meenakshi Sundaram",
      email: "coordinator.demo@subharti.org",
      passwordHash: hash,
      role: "coordinator",
      status: "verified",
      isEmailVerified: true,
      department: "CSE"
    });
    console.log("Seeded coordinator.demo@subharti.org in Atlas!");
  } else {
    const hash = await User.hashPassword("Coord@123");
    coord.passwordHash = hash;
    coord.status = "verified";
    coord.isEmailVerified = true;
    await coord.save();
    console.log("Updated password for coordinator.demo@subharti.org in Atlas!");
  }

  // Check HOD
  let hod = await User.findOne({ email: "hod.demo@subharti.org" });
  if (!hod) {
    const hash = await User.hashPassword("Hod@123");
    hod = await User.create({
      fullName: "Prof. Arvind Kulkarni",
      email: "hod.demo@subharti.org",
      passwordHash: hash,
      role: "hod",
      status: "verified",
      isEmailVerified: true,
      department: "CSE"
    });
    console.log("Seeded hod.demo@subharti.org in Atlas!");
  } else {
    const hash = await User.hashPassword("Hod@123");
    hod.passwordHash = hash;
    hod.status = "verified";
    hod.isEmailVerified = true;
    await hod.save();
    console.log("Updated password for hod.demo@subharti.org in Atlas!");
  }

  // Check Teacher
  let teacher = await User.findOne({ email: "faculty.demo@subharti.org" });
  if (!teacher) {
    const hash = await User.hashPassword("Faculty@123");
    teacher = await User.create({
      fullName: "Dr. Sunita Deshpande",
      email: "faculty.demo@subharti.org",
      passwordHash: hash,
      role: "teacher",
      status: "verified",
      isEmailVerified: true,
      department: "CSE"
    });
    console.log("Seeded faculty.demo@subharti.org in Atlas!");
  } else {
    const hash = await User.hashPassword("Faculty@123");
    teacher.passwordHash = hash;
    teacher.status = "verified";
    teacher.isEmailVerified = true;
    await teacher.save();
    console.log("Updated password for faculty.demo@subharti.org in Atlas!");
  }

  // Seed sample rooms if none exist
  const roomCount = await CampusRoom.countDocuments();
  console.log("Campus rooms count:", roomCount);
  if (roomCount === 0) {
    await CampusRoom.create([
      { roomNumber: "LT-101", building: "Academic Block A", floor: "1st Floor", type: "Classroom", capacity: 70, isAvailable: true },
      { roomNumber: "LT-102", building: "Academic Block A", floor: "1st Floor", type: "Classroom", capacity: 70, isAvailable: true },
      { roomNumber: "Lab-1 (Software)", building: "Computing Centre", floor: "2nd Floor", type: "Computer Lab", capacity: 45, isAvailable: true },
      { roomNumber: "Lab-2 (Networks)", building: "Computing Centre", floor: "2nd Floor", type: "Computer Lab", capacity: 40, isAvailable: true },
      { roomNumber: "Lab-3 (Hardware)", building: "Electronics Block", floor: "Ground Floor", type: "Electronics Lab", capacity: 35, isAvailable: true },
      { roomNumber: "CAD/CAM Studio", building: "Mechanical Block", floor: "1st Floor", type: "Engineering Workshop", capacity: 40, isAvailable: true },
      { roomNumber: "Auditorium", building: "Main Administrative Complex", floor: "Ground Floor", type: "Seminar Hall", capacity: 300, isAvailable: true }
    ]);
    console.log("Seeded 7 campus classrooms & laboratories!");
  }

  // Seed curriculum subjects for CSE Semester 5 if none exist
  const cse5Subjects = await Subject.find({ branch: "CSE", semester: "Semester 5" });
  console.log("CSE Sem 5 subjects count:", cse5Subjects.length);
  if (cse5Subjects.length === 0) {
    await Subject.create([
      {
        branch: "CSE",
        semester: "Semester 5",
        subjectCode: "CS-501",
        subjectName: "Operating Systems",
        type: "Theory",
        hoursPerWeek: 4,
        credits: 4,
        preferredRoomType: "Classroom",
        assignedTeacherId: teacher._id,
        assignedTeacherName: teacher.fullName,
        status: "active"
      },
      {
        branch: "CSE",
        semester: "Semester 5",
        subjectCode: "CS-502",
        subjectName: "Computer Networks & Security",
        type: "Theory",
        hoursPerWeek: 4,
        credits: 4,
        preferredRoomType: "Classroom",
        assignedTeacherId: teacher._id,
        assignedTeacherName: teacher.fullName,
        status: "active"
      },
      {
        branch: "CSE",
        semester: "Semester 5",
        subjectCode: "CS-503",
        subjectName: "Database Management Systems",
        type: "Theory",
        hoursPerWeek: 4,
        credits: 4,
        preferredRoomType: "Classroom",
        assignedTeacherId: teacher._id,
        assignedTeacherName: teacher.fullName,
        status: "active"
      },
      {
        branch: "CSE",
        semester: "Semester 5",
        subjectCode: "CS-504P",
        subjectName: "Operating Systems Lab",
        type: "Practical",
        hoursPerWeek: 4,
        credits: 2,
        requiredConsecutivePeriods: 2,
        preferredRoomType: "Computer Lab",
        assignedTeacherId: teacher._id,
        assignedTeacherName: teacher.fullName,
        status: "active"
      },
      {
        branch: "CSE",
        semester: "Semester 5",
        subjectCode: "CS-505P",
        subjectName: "Network Programming Lab",
        type: "Practical",
        hoursPerWeek: 4,
        credits: 2,
        requiredConsecutivePeriods: 2,
        preferredRoomType: "Computer Lab",
        assignedTeacherId: teacher._id,
        assignedTeacherName: teacher.fullName,
        status: "active"
      },
      {
        branch: "CSE",
        semester: "Semester 5",
        subjectCode: "AS-501",
        subjectName: "Industrial Management & Entrepreneurship",
        type: "Theory",
        hoursPerWeek: 3,
        credits: 3,
        preferredRoomType: "Classroom",
        assignedTeacherId: hod._id,
        assignedTeacherName: hod.fullName,
        status: "active"
      }
    ]);
    console.log("Seeded 6 comprehensive CSE Semester 5 subjects!");
  }

  await disconnectDB();
  console.log("Done successfully!");
}

main().catch(console.error);
