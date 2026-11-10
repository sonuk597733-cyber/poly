import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import dns from "node:dns";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("backend/.env") });
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const MONGO_URI = process.env.MONGODB_URI;

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB Atlas");

  const Lecture = mongoose.models.Lecture || mongoose.model("Lecture", new mongoose.Schema({}, { strict: false }));
  const LectureProgress = mongoose.models.LectureProgress || mongoose.model("LectureProgress", new mongoose.Schema({}, { strict: false }));
  const LectureDownload = mongoose.models.LectureDownload || mongoose.model("LectureDownload", new mongoose.Schema({}, { strict: false }));
  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const StudentProfile = mongoose.models.StudentProfile || mongoose.model("StudentProfile", new mongoose.Schema({}, { strict: false }));

  const teacher = await User.findOne({ email: "faculty.demo@subharti.org" });
  const student1 = await User.findOne({ email: "satyam7209452235@gmail.com" });
  const student2 = await User.findOne({ email: "sonukumar994253@gmail.com" });

  if (!teacher) {
    console.error("Teacher account not found!");
    await mongoose.disconnect();
    return;
  }

  // Ensure upload storage directories exist
  const videoDir = path.resolve("uploads/lectures/videos");
  const resDir = path.resolve("uploads/lectures/resources");
  const thumbDir = path.resolve("uploads/lectures/thumbnails");
  fs.mkdirSync(videoDir, { recursive: true });
  fs.mkdirSync(resDir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  // Write demo physical files
  const videoFileName = "demo_os_semaphores.mp4";
  const pdfFileName = "os_unit3_notes.pdf";
  const pptxFileName = "os_semaphores_slides.pptx";
  const docxFileName = "os_process_lab.docx";

  const mp4Content = Buffer.from("\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42\x00\x00\x00\x08free\x00\x00\x00\x10mdatCollegeOS_Production_Lecture_Video_Stream_2026", "binary");
  const pdfContent = Buffer.from("%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 64 >>\nstream\nBT /F1 12 Tf 72 712 Td (CollegeOS Process Synchronization & Semaphores Notes) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000174 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n289\n%%EOF", "utf8");
  const pptxContent = Buffer.from("PK\x03\x04\x14\x00\x00\x00\x08\x00CollegeOS_Process_Synchronization_Slides_PowerPoint_Binary_Data", "binary");
  const docxContent = Buffer.from("PK\x03\x04\x14\x00\x00\x00\x08\x00CollegeOS_Process_Synchronization_Lab_Manual_Word_Binary_Data", "binary");

  fs.writeFileSync(path.join(videoDir, videoFileName), mp4Content);
  fs.writeFileSync(path.join(resDir, pdfFileName), pdfContent);
  fs.writeFileSync(path.join(resDir, pptxFileName), pptxContent);
  fs.writeFileSync(path.join(resDir, docxFileName), docxContent);

  // Check if lecture already exists
  let lecture = await Lecture.findOne({ title: "Process Synchronization & Semaphore Implementation" });
  if (lecture) {
    await Lecture.deleteOne({ _id: lecture._id });
  }

  lecture = await Lecture.create({
    title: "Process Synchronization & Semaphore Implementation",
    description: "Detailed analysis of race conditions, critical section problem, Peterson's algorithm, and binary vs counting semaphores.",
    branch: "CSE",
    academicYear: "3rd Year",
    semester: "Semester 5",
    subject: "Operating Systems",
    subjectCode: "CS-501",
    topic: "Race Conditions & Semaphores",
    unitNumber: 3,
    lectureType: "Theory",
    videoSource: "upload",
    videoUrl: `/uploads/lectures/videos/${videoFileName}`,
    videoFile: {
      filename: videoFileName,
      originalname: "Process_Synchronization_Unit3.mp4",
      mimetype: "video/mp4",
      size: 25690112,
      path: path.join(videoDir, videoFileName)
    },
    durationMinutes: 48,
    durationSeconds: 2880,
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    resources: [
      {
        title: "Unit 3 Complete Study Notes",
        resourceType: "notes_pdf",
        fileUrl: `/uploads/lectures/resources/${pdfFileName}`,
        filename: pdfFileName,
        originalname: "Unit3_Process_Synchronization_Notes.pdf",
        filesize: 1485760,
        mimetype: "application/pdf",
        downloadCount: 4
      },
      {
        title: "Classroom Presentation Deck",
        resourceType: "slides_ppt",
        fileUrl: `/uploads/lectures/resources/${pptxFileName}`,
        filename: pptxFileName,
        originalname: "Semaphores_and_Monitors_Deck.pptx",
        filesize: 3840000,
        mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        downloadCount: 2
      },
      {
        title: "POSIX Semaphores Lab Manual",
        resourceType: "reference_doc",
        fileUrl: `/uploads/lectures/resources/${docxFileName}`,
        filename: docxFileName,
        originalname: "LabManual_POSIX_Semaphores.docx",
        filesize: 820000,
        mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        downloadCount: 1
      }
    ],
    uploadedBy: teacher._id,
    uploadedByName: teacher.fullName,
    uploadedByRole: teacher.role,
    uploadedByDesignation: teacher.designation || "Assistant Professor & Systems Lead",
    uploadedByDepartment: teacher.department || "CSE",
    uploadedByAvatar: teacher.avatarUrl || "",
    status: "published",
    tags: ["Operating Systems", "Process Synchronization", "Semaphores", "Concurrency"],
    viewsCount: 18,
    completionsCount: 8,
    downloadsCount: 7
  });

  console.log(`✓ Published demo lecture: ${lecture.title} (${lecture._id})`);

  // Seed student progress for Satyam Kumar (96% completed)
  if (student1) {
    await LectureProgress.findOneAndUpdate(
      { studentId: student1._id, lectureId: lecture._id },
      {
        branch: "CSE",
        semester: "Semester 5",
        subject: "Operating Systems",
        lastPlaybackPosition: 2780,
        highestPlaybackPosition: 2780,
        totalWatchDuration: 2820,
        lectureDuration: 2880,
        sessionsCount: 3,
        completionPercentage: 96,
        isCompleted: true,
        firstWatchedAt: new Date(Date.now() - 48 * 3600 * 1000),
        lastWatchedAt: new Date(Date.now() - 2 * 3600 * 1000),
        completedAt: new Date(Date.now() - 2 * 3600 * 1000)
      },
      { upsert: true }
    );

    await LectureDownload.create({
      lectureId: lecture._id,
      resourceId: null,
      resourceTitle: `${lecture.title} (MP4 Video)`,
      downloadType: "video",
      userId: student1._id,
      userName: student1.fullName,
      userRole: student1.role,
      userBranch: "CSE",
      userSemester: "Semester 5",
      ipAddress: "127.0.0.1",
      userAgent: "CollegeOS Client"
    });
  }

  // Seed progress for Sonu Kumar (52% in progress)
  if (student2) {
    await LectureProgress.findOneAndUpdate(
      { studentId: student2._id, lectureId: lecture._id },
      {
        branch: "CSE",
        semester: "Semester 5",
        subject: "Operating Systems",
        lastPlaybackPosition: 1500,
        highestPlaybackPosition: 1500,
        totalWatchDuration: 1500,
        lectureDuration: 2880,
        sessionsCount: 2,
        completionPercentage: 52,
        isCompleted: false,
        firstWatchedAt: new Date(Date.now() - 24 * 3600 * 1000),
        lastWatchedAt: new Date(Date.now() - 5 * 3600 * 1000)
      },
      { upsert: true }
    );
  }

  console.log("✓ Seeded realistic watch progress and downloads telemetry.");
  await mongoose.disconnect();
}

seed().catch(console.error);
