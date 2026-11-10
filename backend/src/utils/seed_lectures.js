import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { connectDB, disconnectDB } from "../config/db.js";
import User from "../models/User.js";
import TeacherProfile from "../models/TeacherProfile.js";
import Lecture from "../models/Lecture.js";

const sampleLectures = [
  {
    title: "Operating Systems — CPU Scheduling Algorithms (FCFS, SJF, Round Robin)",
    description: "Detailed theoretical formulation and comparative analysis of preemptive and non-preemptive CPU scheduling mechanisms with Gantt chart examples.",
    branch: "CSE",
    semester: "Semester 5",
    academicYear: "3rd Year",
    subject: "Operating Systems",
    subjectCode: "CS-501",
    topic: "Process Management & Scheduling",
    unitNumber: 2,
    lectureType: "Theory",
    videoSource: "youtube",
    videoUrl: "https://www.youtube.com/watch?v=ewabbIdmFOU",
    thumbnailUrl: "https://img.youtube.com/vi/ewabbIdmFOU/hqdefault.jpg",
    durationMinutes: 48,
    durationSeconds: 2880,
    viewsCount: 42,
    completionsCount: 19,
    downloadsCount: 14,
    tags: ["Operating Systems", "CPU Scheduling", "Gantt Chart", "Polytechnic"],
    resources: [
      {
        title: "Lecture 04 — CPU Scheduling Complete Notes",
        resourceType: "notes_pdf",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        originalname: "CS501_Lec04_Scheduling.pdf",
        filesize: 1420500,
        mimetype: "application/pdf",
        downloadCount: 22
      },
      {
        title: "CPU Scheduling Algorithms Slide Deck",
        resourceType: "slides_ppt",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        originalname: "CS501_Scheduling_Slides.pptx",
        filesize: 3500200,
        mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        downloadCount: 16
      }
    ]
  },
  {
    title: "Virtual Memory Architecture — Page Fault Handling & Replacement",
    description: "Deep dive into Demand Paging, Page Fault Service Routines, and page replacement strategies including LRU, FIFO, and Belady's Anomaly.",
    branch: "CSE",
    semester: "Semester 5",
    academicYear: "3rd Year",
    subject: "Operating Systems",
    subjectCode: "CS-501",
    topic: "Virtual Memory & Paging",
    unitNumber: 4,
    lectureType: "Practical / Lab Demo",
    videoSource: "youtube",
    videoUrl: "https://www.youtube.com/watch?v=2i24iXl2BVo",
    thumbnailUrl: "https://img.youtube.com/vi/2i24iXl2BVo/hqdefault.jpg",
    durationMinutes: 52,
    durationSeconds: 3120,
    viewsCount: 38,
    completionsCount: 15,
    downloadsCount: 11,
    tags: ["Virtual Memory", "Paging", "LRU", "Page Fault"],
    resources: [
      {
        title: "Virtual Memory & Page Replacement Handout",
        resourceType: "notes_pdf",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        originalname: "CS501_Unit4_VirtualMemory.pdf",
        filesize: 2100400,
        mimetype: "application/pdf",
        downloadCount: 18
      },
      {
        title: "C Simulation Code — LRU Page Replacement",
        resourceType: "code_archive",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        originalname: "lru_simulation.c",
        filesize: 12400,
        mimetype: "text/x-c",
        downloadCount: 9
      }
    ]
  },
  {
    title: "Computer Networks — TCP/IP Protocol Suite & 3-Way Handshake",
    description: "Comprehensive dissection of the TCP connection establishment protocol, SYN/ACK packet headers, window scaling, and flow control mechanisms.",
    branch: "CSE",
    semester: "Semester 5",
    academicYear: "3rd Year",
    subject: "Computer Networks",
    subjectCode: "CS-502",
    topic: "Transport Layer Protocols",
    unitNumber: 3,
    lectureType: "Theory",
    videoSource: "youtube",
    videoUrl: "https://www.youtube.com/watch?v=F27PLhn3W04",
    thumbnailUrl: "https://img.youtube.com/vi/F27PLhn3W04/hqdefault.jpg",
    durationMinutes: 44,
    durationSeconds: 2640,
    viewsCount: 56,
    completionsCount: 28,
    downloadsCount: 25,
    tags: ["Networks", "TCP", "Handshake", "Transport Layer"],
    resources: [
      {
        title: "TCP Handshake Wireshark Trace Analysis",
        resourceType: "reference_doc",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        originalname: "Wireshark_TCP_Analysis.pdf",
        filesize: 3800000,
        mimetype: "application/pdf",
        downloadCount: 31
      }
    ]
  },
  {
    title: "Database Management Systems — SQL Joins & Query Optimization Lab",
    description: "Hands-on terminal demo executing Inner, Left Outer, Right Outer, and Full Joins with EXPLAIN query plan analysis in PostgreSQL.",
    branch: "CSE",
    semester: "Semester 5",
    academicYear: "3rd Year",
    subject: "Database Management Systems",
    subjectCode: "CS-503",
    topic: "Relational Queries & Optimization",
    unitNumber: 3,
    lectureType: "Practical / Lab Demo",
    videoSource: "youtube",
    videoUrl: "https://www.youtube.com/watch?v=9yeOJ0ZMUYw",
    thumbnailUrl: "https://img.youtube.com/vi/9yeOJ0ZMUYw/hqdefault.jpg",
    durationMinutes: 56,
    durationSeconds: 3360,
    viewsCount: 64,
    completionsCount: 34,
    downloadsCount: 29,
    tags: ["DBMS", "SQL", "Postgres", "Query Optimization"],
    resources: [
      {
        title: "SQL Joins Lab Manual & Exercise Queries",
        resourceType: "notes_pdf",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        originalname: "CS503_Lab03_SQL_Joins.pdf",
        filesize: 1750000,
        mimetype: "application/pdf",
        downloadCount: 40
      },
      {
        title: "Lab Schema & Sample Data Seed Script",
        resourceType: "code_archive",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        originalname: "schema_seed.sql",
        filesize: 45000,
        mimetype: "text/plain",
        downloadCount: 33
      }
    ]
  },
  {
    title: "Web Technologies — React State Management & Component Lifecycle",
    description: "Mastering React hooks (useState, useEffect, useMemo, useCallback) with real enterprise component lifecycle benchmarks.",
    branch: "CSE",
    semester: "Semester 5",
    academicYear: "3rd Year",
    subject: "Web Technologies",
    subjectCode: "CS-504",
    topic: "Frontend Frameworks & React Hooks",
    unitNumber: 2,
    lectureType: "Tutorial",
    videoSource: "youtube",
    videoUrl: "https://www.youtube.com/watch?v=O6P86uwfdR0",
    thumbnailUrl: "https://img.youtube.com/vi/O6P86uwfdR0/hqdefault.jpg",
    durationMinutes: 62,
    durationSeconds: 3720,
    viewsCount: 71,
    completionsCount: 40,
    downloadsCount: 35,
    tags: ["React", "JavaScript", "Frontend", "Hooks"],
    resources: [
      {
        title: "React Lifecycle Cheat Sheet & Diagrams",
        resourceType: "slides_ppt",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        originalname: "React_CheatSheet.pdf",
        filesize: 2900000,
        mimetype: "application/pdf",
        downloadCount: 50
      }
    ]
  },
  {
    title: "Software Engineering — Agile Sprint Planning & Jira Workflows",
    description: "Guest lecture on industrial software development practices, story pointing, sprint burn-down charts, and continuous delivery.",
    branch: "CSE",
    semester: "Semester 5",
    academicYear: "3rd Year",
    subject: "Software Engineering",
    subjectCode: "CS-505",
    topic: "Agile Methodologies & DevOps",
    unitNumber: 1,
    lectureType: "Guest Lecture",
    videoSource: "youtube",
    videoUrl: "https://www.youtube.com/watch?v=84u9uX_K9u4",
    thumbnailUrl: "https://img.youtube.com/vi/84u9uX_K9u4/hqdefault.jpg",
    durationMinutes: 50,
    durationSeconds: 3000,
    viewsCount: 29,
    completionsCount: 12,
    downloadsCount: 8,
    tags: ["Agile", "Scrum", "DevOps", "Software Engineering"],
    resources: [
      {
        title: "Agile Scrum Master Template Document",
        resourceType: "reference_doc",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        originalname: "Agile_Scrum_Template.docx",
        filesize: 850000,
        mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        downloadCount: 15
      }
    ]
  }
];

async function seed() {
  await connectDB();
  console.log("Seeding realistic digital lectures...");

  const teacher = await User.findOne({ role: "teacher" });
  if (!teacher) {
    console.error("No teacher found to assign lectures to.");
    await disconnectDB();
    process.exit(1);
  }

  const teacherProf = await TeacherProfile.findOne({ userId: teacher._id });
  const designation = teacherProf?.designation || "Associate Professor & Systems Lead";
  const department = teacherProf?.department || "Computer Science & Engineering";

  for (const item of sampleLectures) {
    const exists = await Lecture.findOne({ title: item.title, branch: item.branch });
    if (!exists) {
      await Lecture.create({
        ...item,
        uploadedBy: teacher._id,
        uploadedByName: teacher.fullName,
        uploadedByRole: "teacher",
        uploadedByDesignation: designation,
        uploadedByDepartment: department,
        uploadedByAvatar: teacher.avatarUrl || "",
        status: "published"
      });
      console.log("Created lecture:", item.title);
    } else {
      console.log("Already exists:", item.title);
    }
  }

  console.log("Lecture seeding completed successfully!");
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
