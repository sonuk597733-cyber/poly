import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Subject from "../models/Subject.js";
import ExamMark from "../models/ExamMark.js";

async function main() {
  await connectDB();

  // 1. Update faculty department to CSE
  await User.updateOne({ email: "faculty.demo@subharti.org" }, { department: "CSE" });
  const faculty = await User.findOne({ email: "faculty.demo@subharti.org" });

  // 2. Ensure Sonu kumar has StudentProfile in CSE Semester 5
  const sonuUser = await User.findOne({ email: "sonuk597733@gmail.com" });
  if (sonuUser) {
    let sonuProfile = await StudentProfile.findOne({ userId: sonuUser._id });
    if (!sonuProfile) {
      await StudentProfile.create({
        userId: sonuUser._id,
        fullName: "Sonu kumar",
        enrollmentNo: "2430617706203027",
        rollNo: "2430617706203027",
        branch: "CSE",
        semester: "Semester 5",
        academicYear: "3rd Year",
        fatherName: "BIJENDRA SINGH",
        motherName: "AASHA DEVI",
        institution: "SUBHARTI INSTITUTE OF TECHNOLOGY AND ENGINEERING"
      });
      console.log("Created Sonu kumar StudentProfile");
    } else {
      await StudentProfile.updateOne(
        { _id: sonuProfile._id },
        {
          fullName: "Sonu kumar",
          branch: "CSE",
          semester: "Semester 5",
          enrollmentNo: "2430617706203027"
        }
      );
      console.log("Updated Sonu kumar StudentProfile");
    }
  }

  // 3. Upsert OOPS with Java (PCS-504P) in CSE Semester 5
  let sub = await Subject.findOne({ subjectCode: "PCS-504P", branch: "CSE", semester: "Semester 5" });
  if (!sub) {
    sub = await Subject.create({
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2024-2025",
      subjectCode: "PCS-504P",
      subjectName: "OOPS with Java",
      credits: 4,
      type: "Practical",
      sessionalMax: 20,
      sessional1Max: 20,
      sessional2Max: 20,
      sessional3Max: 20,
      assignedTeacherId: faculty._id,
      assignedTeacherName: faculty.fullName
    });
    console.log("Created OOPS with Java (PCS-504P)");
  } else {
    await Subject.updateOne(
      { _id: sub._id },
      {
        subjectName: "OOPS with Java",
        sessionalMax: 20,
        sessional1Max: 20,
        sessional2Max: 20,
        sessional3Max: 20,
        assignedTeacherId: faculty._id,
        assignedTeacherName: faculty.fullName
      }
    );
    console.log("Updated OOPS with Java (PCS-504P) to baseline 20M");
  }

  // 4. Ensure some baseline marks for demonstration if needed, or leave existing
  const allCseSubs = await Subject.find({ branch: "CSE", semester: "Semester 5" })
    .select("subjectCode subjectName sessionalMax sessional1Max sessional2Max sessional3Max")
    .lean();
  console.log("Current CSE Sem 5 Subjects:", allCseSubs);

  const students = await StudentProfile.find({ branch: "CSE" }).select("fullName enrollmentNo branch semester").lean();
  console.log("Enrolled CSE Students:", students);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
