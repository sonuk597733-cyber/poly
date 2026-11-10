import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import bcrypt from "bcryptjs";
import { getUploadDestination } from "./src/utils/uploadPaths.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config({ path: path.resolve("backend/.env") });

const MONGO_URI = process.env.MONGODB_URI;

function makeMockPdf(title, subject, author) {
  return Buffer.from(
    `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 120 >>
stream
BT
/F1 18 Tf
50 720 Td
(CollegeOS Academic Resource - ${title}) Tj
0 -24 Td
(Subject: ${subject} | Author: ${author}) Tj
0 -20 Td
(Swami Vivekanand Subharti University - Subharti Polytechnic) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000201 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
370
%%EOF`
  );
}

function makeMockOfficeFile(magicHeader, title) {
  const header = Buffer.from(magicHeader, "utf-8");
  const payload = Buffer.from(`\x50\x4B\x03\x04\x14\x00\x06\x00[CollegeOS Authentic Document Payload: ${title} - Subharti Polytechnic 2026]`);
  return Buffer.concat([header, payload]);
}

function hashBuf(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function run() {
  console.log("==================================================================");
  console.log("SEEDING COLLEGEOS NOTES MODULE (TEACHER, COORDINATOR, HOD UPLOADS)");
  console.log("==================================================================");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB Atlas\n");

  const usersColl = mongoose.connection.collection("users");
  const notesColl = mongoose.connection.collection("notes");
  const downloadsColl = mongoose.connection.collection("notedownloads");

  // 1. Ensure Coordinator User
  let coordUser = await usersColl.findOne({ email: "coordinator.demo@subharti.org" });
  if (!coordUser) {
    const pwHash = await bcrypt.hash("Coordinator@123", 10);
    const insertRes = await usersColl.insertOne({
      fullName: "Prof. Rajesh Verma",
      email: "coordinator.demo@subharti.org",
      passwordHash: pwHash,
      role: "coordinator",
      branch: "CSE",
      department: "CSE",
      designation: "Academic Coordinator",
      status: "verified",
      isEmailVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    coordUser = await usersColl.findOne({ _id: insertRes.insertedId });
    console.log("✓ Created Coordinator user: Prof. Rajesh Verma (coordinator.demo@subharti.org)");
  } else {
    console.log("✓ Found Coordinator user: " + coordUser.fullName);
  }

  // 2. Fetch Teacher & HOD & Student
  const teacherUser = await usersColl.findOne({ email: "faculty.demo@subharti.org" });
  const hodUser = await usersColl.findOne({ email: "ksonu10605@gmail.com" });
  const studentUser = await usersColl.findOne({ email: "satyam7209452235@gmail.com" });

  console.log(`✓ Teacher: ${teacherUser?.fullName || "Faculty Demo"}`);
  console.log(`✓ HOD: ${hodUser?.fullName || "HOD Demo"}`);
  console.log(`✓ Student: ${studentUser?.fullName || "Satyam Kumar"}\n`);

  // Ensure upload destination
  const notesDir = getUploadDestination("notes");
  console.log("Notes upload directory:", notesDir);

  // Clear previous notes and downloads for clean state
  await notesColl.deleteMany({});
  await downloadsColl.deleteMany({});
  console.log("Cleaned existing notes & downloads collections.\n");

  const seedSpecs = [
    // --- Teacher Uploads ---
    {
      title: "Process Synchronization & Semaphore Implementation Handout",
      description: "In-depth guide covering critical section problem, Peterson's algorithm, mutex locks, and counting semaphores with C code examples.",
      subject: "Operating Systems",
      subjectCode: "CS-501",
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "3rd Year",
      unit: "Unit 2",
      chapter: "Process Synchronization",
      category: "Lecture Notes",
      uploader: teacherUser,
      isImportant: true,
      fileExt: "pdf",
      fileName: "Operating_Systems_Process_Synchronization_Unit2.pdf",
      mimeType: "application/pdf",
      makeBuffer: () => makeMockPdf("Process Synchronization", "Operating Systems", teacherUser.fullName),
      targetGroups: ["All Students", "Section A", "Section B"]
    },
    {
      title: "Routing Algorithms & Distance Vector Protocols Slides",
      description: "Visual slide deck for Interior Gateway Protocols, Dijkstra SPF, Bellman-Ford, and Border Gateway Protocol.",
      subject: "Computer Networks",
      subjectCode: "CS-502",
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "3rd Year",
      unit: "Unit 3",
      chapter: "Network Layer",
      category: "Lecture Notes",
      uploader: teacherUser,
      isImportant: false,
      fileExt: "pptx",
      fileName: "Computer_Networks_Routing_Protocols_Unit3.pptx",
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      makeBuffer: () => makeMockOfficeFile("PK0304-PPTX-", "Routing Protocols Deck"),
      targetGroups: ["All Students"]
    },
    {
      title: "Python Data Structures & OOP Lab Manual 2026",
      description: "Complete practical manual containing 12 prescribed laboratory experiments, flowcharts, input/output specifications, and viva questions.",
      subject: "Python Programming",
      subjectCode: "CS-503",
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "3rd Year",
      unit: "Lab Manual",
      chapter: "Practical Curriculum",
      category: "Lab Manual",
      uploader: teacherUser,
      isImportant: true,
      fileExt: "docx",
      fileName: "Python_Programming_Lab_Manual_2026.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      makeBuffer: () => makeMockOfficeFile("PK0304-DOCX-", "Python Lab Manual 2026"),
      targetGroups: ["All Students"]
    },
    {
      title: "Microprocessor 8086 Architecture & Register Organization",
      description: "Technical schematics and assembly language instruction reference for 16-bit 8086 processor, BIU, EU, and interrupt vectors.",
      subject: "Microprocessor Systems",
      subjectCode: "CS-504",
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "3rd Year",
      unit: "Unit 1",
      chapter: "Microprocessor Hardware",
      category: "Lecture Notes",
      uploader: teacherUser,
      isImportant: false,
      fileExt: "pdf",
      fileName: "Microprocessor_8086_Architecture_Unit1.pdf",
      mimeType: "application/pdf",
      makeBuffer: () => makeMockPdf("8086 Architecture", "Microprocessor Systems", teacherUser.fullName),
      targetGroups: ["All Students"]
    },
    {
      title: "Database Management Systems SQL Query Practice Pack",
      description: "Structured practical zip archive containing schema DDL scripts, sample company database inserts, and 50 complex SQL query solutions.",
      subject: "Database Management",
      subjectCode: "CS-505",
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "3rd Year",
      unit: "Unit 4",
      chapter: "Advanced SQL Queries",
      category: "Assignment Material",
      uploader: teacherUser,
      isImportant: false,
      fileExt: "zip",
      fileName: "DBMS_SQL_Practice_Pack.zip",
      mimeType: "application/zip",
      makeBuffer: () => makeMockOfficeFile("PK0304-ZIP-", "DBMS SQL Pack"),
      targetGroups: ["All Students"]
    },

    // --- Coordinator Uploads ---
    {
      title: "CSE Semester 5 Mid-Term Model Question Paper & Blueprint",
      description: "Official academic model examination paper prepared by the Examination Board with marking scheme and topic weightage distribution.",
      subject: "Operating Systems",
      subjectCode: "CS-501",
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "3rd Year",
      unit: "Exam Prep",
      chapter: "Examination Materials",
      category: "Model Question Paper",
      uploader: coordUser,
      isImportant: true,
      fileExt: "pdf",
      fileName: "CSE_Sem5_MidTerm_Model_Question_Paper.pdf",
      mimeType: "application/pdf",
      makeBuffer: () => makeMockPdf("Mid-Term Model Paper", "CSE Exam Cell", coordUser.fullName),
      targetGroups: ["All Students"]
    },
    {
      title: "Subharti Polytechnic Academic Calendar & Exam Guidelines V5",
      description: "Official institutional rules regarding minimum 75% attendance threshold, sessional marks calculation, and laboratory evaluation.",
      subject: "Academic Guidelines",
      subjectCode: "GEN-01",
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "3rd Year",
      unit: "Guidelines",
      chapter: "Institutional Policy",
      category: "Academic Guidelines",
      uploader: coordUser,
      isImportant: true,
      fileExt: "pdf",
      fileName: "Subharti_Polytechnic_Academic_Guidelines_V5.pdf",
      mimeType: "application/pdf",
      makeBuffer: () => makeMockPdf("Academic Guidelines", "Academic Cell", coordUser.fullName),
      targetGroups: ["All Students"]
    },
    {
      title: "Computer Networks Previous 5 Years Solved Board Papers",
      description: "Compilation of BTEUP semester examination questions from 2021 to 2025 with step-by-step explanatory answers.",
      subject: "Computer Networks",
      subjectCode: "CS-502",
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "3rd Year",
      unit: "Exam Prep",
      chapter: "Previous Year Papers",
      category: "Previous Year Papers",
      uploader: coordUser,
      isImportant: false,
      fileExt: "pdf",
      fileName: "Computer_Networks_Previous_Years_Solved_Papers.pdf",
      mimeType: "application/pdf",
      makeBuffer: () => makeMockPdf("Previous Year Papers", "Computer Networks", coordUser.fullName),
      targetGroups: ["All Students"]
    },

    // --- HOD Uploads ---
    {
      title: "Department Curriculum Syllabus & Laboratory Blueprint 2026",
      description: "Department of Computer Science & Engineering official AICTE-aligned polytechnic diploma curriculum syllabus and textbook references.",
      subject: "Curriculum & Guidelines",
      subjectCode: "CSE-SYLL",
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "3rd Year",
      unit: "Curriculum",
      chapter: "Official Syllabus",
      category: "Syllabus",
      uploader: hodUser,
      isImportant: true,
      fileExt: "pdf",
      fileName: "CSE_Department_Syllabus_Curriculum_2026.pdf",
      mimeType: "application/pdf",
      makeBuffer: () => makeMockPdf("Department Syllabus 2026", "CSE Department", hodUser.fullName),
      targetGroups: ["All Students"]
    },
    {
      title: "Operating Systems Comprehensive Department Question Bank",
      description: "Comprehensive 200-question analytical repository curated by faculty and verified by HOD for end-semester viva and written exams.",
      subject: "Operating Systems",
      subjectCode: "CS-501",
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "3rd Year",
      unit: "Question Bank",
      chapter: "End-Term Preparation",
      category: "Question Bank",
      uploader: hodUser,
      isImportant: true,
      fileExt: "pdf",
      fileName: "Operating_Systems_Comprehensive_Question_Bank.pdf",
      mimeType: "application/pdf",
      makeBuffer: () => makeMockPdf("Comprehensive Question Bank", "Operating Systems", hodUser.fullName),
      targetGroups: ["All Students"]
    }
  ];

  const createdNotes = [];

  for (const spec of seedSpecs) {
    const buffer = spec.makeBuffer();
    const storedFileName = `${path.basename(spec.fileName, "." + spec.fileExt)}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${spec.fileExt}`;
    const targetFilePath = path.join(notesDir, storedFileName);
    fs.writeFileSync(targetFilePath, buffer);

    const checksum = hashBuf(buffer);

    const noteDoc = {
      title: spec.title,
      description: spec.description,
      subject: spec.subject,
      subjectCode: spec.subjectCode,
      branch: spec.branch,
      semester: spec.semester,
      academicYear: spec.academicYear,
      unit: spec.unit,
      chapter: spec.chapter,
      category: spec.category,
      uploaderId: spec.uploader._id,
      uploaderName: spec.uploader.fullName,
      uploaderRole: spec.uploader.role,
      uploaderDesignation: spec.uploader.designation || (spec.uploader.role === "hod" ? "Head of Department" : spec.uploader.role === "coordinator" ? "Academic Coordinator" : "Associate Professor"),
      uploaderDepartment: spec.uploader.department || "CSE",
      file: {
        fileName: storedFileName,
        originalFileName: spec.fileName,
        storedFileName,
        filePath: `notes/${storedFileName}`,
        mimeType: spec.mimeType,
        fileSize: buffer.length,
        checksum,
        fileExtension: spec.fileExt
      },
      isImportant: spec.isImportant,
      publicationStatus: "published",
      targetGroups: spec.targetGroups,
      downloadCount: 0,
      viewCount: Math.floor(Math.random() * 25) + 5,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)),
      updatedAt: new Date()
    };

    const insertRes = await notesColl.insertOne(noteDoc);
    noteDoc._id = insertRes.insertedId;
    createdNotes.push(noteDoc);
    console.log(`✓ Seeded [${spec.uploader.role.toUpperCase()}] ${spec.title} (${spec.fileExt.toUpperCase()}, ${buffer.length} bytes)`);
  }

  // 3. Seed real downloads for Satyam Kumar
  if (studentUser && createdNotes.length >= 2) {
    const downloadedNotes = [createdNotes[0], createdNotes[2], createdNotes[5]];
    for (const n of downloadedNotes) {
      await downloadsColl.insertOne({
        noteId: n._id,
        noteTitle: n.title,
        studentId: studentUser._id,
        studentName: studentUser.fullName,
        studentEnrollment: "202427",
        studentBranch: "CSE",
        studentSemester: "Semester 5",
        fileSize: n.file.fileSize,
        ipAddress: "127.0.0.1",
        userAgent: "CollegeOS Headless Engine / Chrome CDP",
        downloadedAt: new Date(Date.now() - 3600 * 1000 * 2)
      });
      await notesColl.updateOne({ _id: n._id }, { $inc: { downloadCount: 1 } });
    }
    console.log(`\n✓ Seeded 3 download audit records for student ${studentUser.fullName}`);
  }

  console.log("\n==================================================================");
  console.log("SEEDING COMPLETED SUCCESSFULLY: 10 Verified Notes Created");
  console.log("==================================================================");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
