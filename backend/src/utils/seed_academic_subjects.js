import dotenv from "dotenv";
dotenv.config({ path: "backend/.env" });
if (!process.env.MONGODB_URI) dotenv.config({ path: ".env" });

import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Subject from "../models/Subject.js";
import TeacherProfile from "../models/TeacherProfile.js";

export async function seedAcademicSubjects() {
  await connectDB();
  console.log("[Subject Seed] Seeding official polytechnic subjects and faculty allocations...");

  const drSunita = await User.findOne({ email: "faculty.demo@subharti.org" });
  const profArvind = await User.findOne({ email: "arvind.mehta@subharti.edu.in" });

  const subjectsToSeed = [
    {
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2025-2026",
      subjectCode: "CS-501",
      subjectName: "Operating Systems",
      credits: 4,
      type: "Theory",
      hoursPerWeek: 4,
      assignedTeacherId: drSunita?._id || null,
      assignedTeacherName: drSunita?.fullName || "Dr. Sunita Deshpande",
      description: "Process synchronization, CPU scheduling, memory management, and file systems."
    },
    {
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2025-2026",
      subjectCode: "CS-502",
      subjectName: "Database Management Systems",
      credits: 4,
      type: "Theory",
      hoursPerWeek: 4,
      assignedTeacherId: drSunita?._id || null,
      assignedTeacherName: drSunita?.fullName || "Dr. Sunita Deshpande",
      description: "Relational database design, SQL querying, indexing, and normalization."
    },
    {
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2025-2026",
      subjectCode: "CS-503",
      subjectName: "Computer Networks",
      credits: 4,
      type: "Theory",
      hoursPerWeek: 4,
      assignedTeacherId: drSunita?._id || null,
      assignedTeacherName: drSunita?.fullName || "Dr. Sunita Deshpande",
      description: "OSI and TCP/IP stack, routing protocols, and socket programming."
    },
    {
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2025-2026",
      subjectCode: "CS-504",
      subjectName: "Web Technologies",
      credits: 4,
      type: "Practical",
      hoursPerWeek: 4,
      assignedTeacherId: drSunita?._id || null,
      assignedTeacherName: drSunita?.fullName || "Dr. Sunita Deshpande",
      description: "Full stack web development, React, Node.js, and REST APIs."
    },
    {
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2025-2026",
      subjectCode: "CS-505",
      subjectName: "Software Engineering",
      credits: 3,
      type: "Theory",
      hoursPerWeek: 3,
      assignedTeacherId: drSunita?._id || null,
      assignedTeacherName: drSunita?.fullName || "Dr. Sunita Deshpande",
      description: "Agile methodologies, sprint planning, software architecture, and testing."
    },
    {
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2025-2026",
      subjectCode: "CS-506",
      subjectName: "Cyber Security & Ethics",
      credits: 3,
      type: "Theory",
      hoursPerWeek: 3,
      assignedTeacherId: profArvind?._id || null,
      assignedTeacherName: profArvind?.fullName || "Prof. Arvind Mehta",
      description: "Information security principles, cryptography, network defense, and ethics."
    },
    {
      branch: "Civil",
      semester: "Semester 3",
      academicYear: "2025-2026",
      subjectCode: "CE-301",
      subjectName: "Structural Analysis & Design",
      credits: 4,
      type: "Theory",
      hoursPerWeek: 4,
      assignedTeacherId: null,
      assignedTeacherName: "Er. Ramesh Verma",
      description: "Stress analysis, bending moments, and structural load calculations."
    },
    {
      branch: "Mechanical",
      semester: "Semester 3",
      academicYear: "2025-2026",
      subjectCode: "ME-301",
      subjectName: "Thermodynamics & Heat Transfer",
      credits: 4,
      type: "Theory",
      hoursPerWeek: 4,
      assignedTeacherId: null,
      assignedTeacherName: "Er. R. K. Sharma",
      description: "Laws of thermodynamics, Carnot cycles, heat exchangers, and refrigeration."
    }
  ];

  for (const s of subjectsToSeed) {
    await Subject.findOneAndUpdate(
      { subjectCode: s.subjectCode, branch: s.branch, semester: s.semester },
      { $set: s },
      { upsert: true, new: true }
    );
  }

  // Update Dr. Sunita's TeacherProfile subjects array
  if (drSunita) {
    await TeacherProfile.findOneAndUpdate(
      { userId: drSunita._id },
      {
        $set: {
          department: "Computer Science & Engineering",
          subjects: [
            "Operating Systems",
            "Database Management Systems",
            "Computer Networks",
            "Web Technologies",
            "Software Engineering"
          ]
        }
      }
    );
  }

  console.log(`[Subject Seed] Successfully seeded ${subjectsToSeed.length} official polytechnic subjects with faculty allocations.`);
}

if (process.argv[1] && process.argv[1].includes("seed_academic_subjects")) {
  seedAcademicSubjects().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
