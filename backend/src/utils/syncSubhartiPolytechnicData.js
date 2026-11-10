import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import Subject from "../models/Subject.js";
import CampusRoom from "../models/CampusRoom.js";
import User from "../models/User.js";
import TeacherProfile from "../models/TeacherProfile.js";
import TimetableConfig from "../models/TimetableConfig.js";
import Timetable from "../models/Timetable.js";

async function syncSubhartiData() {
  await connectDB();
  console.log("================================================================================");
  console.log("   SUBHARTI POLYTECHNIC TIMETABLE DATA MIGRATION & SYNCHRONIZATION             ");
  console.log("================================================================================\n");

  const hashedPassword = await bcrypt.hash("Subharti@123", 10);

  // 1. Seed / Upsert Faculty Legend from Reference Timetable Photo
  const facultyRoster = [
    {
      fullName: "Er. Reena Singh",
      email: "reena.singh@subharti.edu.in",
      role: "hod",
      department: "CSE",
      designation: "HOD & Associate Professor (CSE)",
      abbr: "RS",
      phone: "9876543210"
    },
    {
      fullName: "Er. Amit Kumar",
      email: "amit.kumar@subharti.edu.in",
      role: "coordinator",
      department: "CSE",
      designation: "Academic Coordinator & Sr. Faculty",
      abbr: "AK",
      phone: "9876543211"
    },
    {
      fullName: "Prof. (Dr.) S. C. Tiwari",
      email: "principal.poly@subharti.edu.in",
      role: "principal",
      department: "CSE",
      designation: "Principal & Professor, Subharti Polytechnic",
      abbr: "SCT",
      phone: "9876543212"
    },
    {
      fullName: "Er. Praveen Kumar",
      email: "praveen.kumar@subharti.edu.in",
      role: "teacher",
      department: "CSE",
      designation: "Assistant Professor (Java & OOP)",
      abbr: "PK",
      phone: "9876543213"
    },
    {
      fullName: "Er. Deepak Kumar",
      email: "deepak.kumar@subharti.edu.in",
      role: "teacher",
      department: "CSE",
      designation: "Assistant Professor (Maintenance & Hardware)",
      abbr: "DK",
      phone: "9876543214"
    },
    {
      fullName: "Er. Sunny Gaur",
      email: "sunny.gaur@subharti.edu.in",
      role: "teacher",
      department: "CSE",
      designation: "Assistant Professor (AI & ML)",
      abbr: "SG",
      phone: "9876543215"
    },
    {
      fullName: "Er. Ujjawal Mishra",
      email: "ujjawal.mishra@subharti.edu.in",
      role: "teacher",
      department: "CSE",
      designation: "Assistant Professor (IoT & Embedded)",
      abbr: "UM",
      phone: "9876543216"
    },
    {
      fullName: "Er. Soni Dubey",
      email: "soni.dubey@subharti.edu.in",
      role: "teacher",
      department: "CSE",
      designation: "Assistant Professor (Yoga & Activities)",
      abbr: "SD",
      phone: "9876543217"
    },
    {
      fullName: "Er. Chitranjan Kumar",
      email: "chitranjan.kumar@subharti.edu.in",
      role: "teacher",
      department: "CSE",
      designation: "Assistant Professor (Cultural & Soft Skills)",
      abbr: "CK",
      phone: "9876543218"
    },
    {
      fullName: "Mr. Sachin Singh",
      email: "sachin.singh@subharti.edu.in",
      role: "teacher",
      department: "CSE",
      designation: "Lecturer (Mock Interviews & Research)",
      abbr: "SS",
      phone: "9876543219"
    },
    {
      fullName: "Mr. Shivam Kaushik",
      email: "shivam.kaushik@subharti.edu.in",
      role: "teacher",
      department: "CSE",
      designation: "Lecturer (Aptitude & Reasoning)",
      abbr: "SK",
      phone: "9876543220"
    },
    {
      fullName: "Er. Rajesh Parihar",
      email: "rajesh.parihar@subharti.edu.in",
      role: "teacher",
      department: "CSE",
      designation: "Sports Lead & Assistant Professor",
      abbr: "RP",
      phone: "9876543221"
    },
    {
      fullName: "Er. Aanchal Sharma",
      email: "aanchal.sharma@subharti.edu.in",
      role: "teacher",
      department: "CSE",
      designation: "Assistant Professor (Cultural In-Charge)",
      abbr: "AS",
      phone: "9876543222"
    },
    {
      fullName: "Er. Rahul Kumar",
      email: "rahul.kumar@subharti.edu.in",
      role: "teacher",
      department: "CSE",
      designation: "Assistant Professor (Yoga In-Charge)",
      abbr: "RK",
      phone: "9876543223"
    },
    {
      fullName: "Miss M",
      email: "miss.m@subharti.edu.in",
      role: "teacher",
      department: "CSE",
      designation: "Faculty (Indian Constitution)",
      abbr: "M",
      phone: "9876543224"
    }
  ];

  const facultyMap = new Map();

  for (const f of facultyRoster) {
    let user = await User.findOne({ email: f.email });
    if (!user) {
      user = await User.create({
        fullName: f.fullName,
        email: f.email,
        passwordHash: hashedPassword,
        role: f.role,
        department: f.department,
        isEmailVerified: true,
        status: "verified",
        phone: f.phone,
        headline: f.designation
      });
      console.log(`[Created Faculty] ${f.fullName} (${f.role}) - ${f.email}`);
    } else {
      user.fullName = f.fullName;
      user.role = f.role;
      user.department = f.department;
      user.isEmailVerified = true;
      user.status = "verified";
      user.headline = f.designation;
      await user.save();
      console.log(`[Updated Faculty] ${f.fullName} (${f.role})`);
    }

    await TeacherProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        department: f.department,
        designation: f.designation,
        employeeId: `EMP-${f.abbr}-${Math.floor(100 + Math.random() * 900)}`,
        approvalStatus: "approved"
      },
      { upsert: true, new: true }
    );

    facultyMap.set(f.abbr, { id: user._id, name: f.fullName, designation: f.designation });
    facultyMap.set(f.fullName.toLowerCase(), { id: user._id, name: f.fullName, designation: f.designation });
  }

  // 2. Seed / Upsert Campus Rooms from Reference Timetable Photo
  const roomList = [
    { roomNumber: "Room No. 302", type: "Classroom", building: "Polytechnic Academic Block", floor: "3rd Floor", capacity: 70 },
    { roomNumber: "Comp. Lab", type: "Computer Lab", building: "Polytechnic Academic Block", floor: "2nd Floor", capacity: 60 },
    { roomNumber: "Net Lab", type: "Computer Lab", building: "Polytechnic Academic Block", floor: "2nd Floor", capacity: 45 },
    { roomNumber: "Library", type: "Library", building: "Central Library Block", floor: "Ground Floor", capacity: 120 },
    { roomNumber: "Sports Ground", type: "Activity Center", building: "Campus Sports Complex", floor: "Ground", capacity: 200 },
    { roomNumber: "Yoga Hall", type: "Activity Center", building: "Wellness Block", floor: "1st Floor", capacity: 80 },
    { roomNumber: "Auditorium", type: "Auditorium", building: "Subharti Central Complex", floor: "Ground", capacity: 500 }
  ];

  for (const r of roomList) {
    await CampusRoom.findOneAndUpdate(
      { roomNumber: r.roomNumber },
      {
        roomNumber: r.roomNumber,
        type: r.type,
        building: r.building,
        floor: r.floor,
        capacity: r.capacity,
        isAvailable: true,
        branch: "CSE"
      },
      { upsert: true, new: true }
    );
    console.log(`[Synced Room] ${r.roomNumber} (${r.type})`);
  }

  // 3. Seed / Upsert Official Subharti Subjects from Reference Timetable Photo
  const subjectList = [
    {
      subjectCode: "PCS-501A",
      subjectName: "Management & Technology",
      shortName: "MT",
      type: "Theory",
      hoursPerWeek: 4,
      credits: 4,
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2026-2027",
      assignedTeacherName: "Er. Deepak Kumar",
      assignedTeacherId: facultyMap.get("DK")?.id
    },
    {
      subjectCode: "PCS-502A",
      subjectName: "Advanced Computer Networks",
      shortName: "ACN",
      type: "Theory",
      hoursPerWeek: 4,
      credits: 4,
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2026-2027",
      assignedTeacherName: "Er. Reena Singh",
      assignedTeacherId: facultyMap.get("RS")?.id
    },
    {
      subjectCode: "PCS-503A",
      subjectName: "Artificial Intelligence & Machine Learning",
      shortName: "AI&ML",
      type: "Theory",
      hoursPerWeek: 4,
      credits: 4,
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2026-2027",
      assignedTeacherName: "Er. Sunny Gaur",
      assignedTeacherId: facultyMap.get("SG")?.id
    },
    {
      subjectCode: "PCS-504P",
      subjectName: "OOPS with Java",
      shortName: "OOPS WITH JAVA",
      type: "Practical",
      hoursPerWeek: 6,
      credits: 4,
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2026-2027",
      assignedTeacherName: "Er. Praveen Kumar",
      assignedTeacherId: facultyMap.get("PK")?.id
    },
    {
      subjectCode: "PCS-505P",
      subjectName: "Internet of Things",
      shortName: "IOT",
      type: "Practical",
      hoursPerWeek: 5,
      credits: 4,
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2026-2027",
      assignedTeacherName: "Er. Ujjawal Mishra",
      assignedTeacherId: facultyMap.get("UM")?.id
    },
    {
      subjectCode: "PIC-005",
      subjectName: "Indian Constitution",
      shortName: "IC",
      type: "Theory",
      hoursPerWeek: 2,
      credits: 2,
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2026-2027",
      assignedTeacherName: "Miss M",
      assignedTeacherId: facultyMap.get("M")?.id
    },
    {
      subjectCode: "PSCA-005P",
      subjectName: "Student Centered Activities",
      shortName: "SCA",
      type: "Practical",
      hoursPerWeek: 5,
      credits: 2,
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "2026-2027",
      assignedTeacherName: "Er. Soni Dubey",
      assignedTeacherId: facultyMap.get("SD")?.id
    }
  ];

  for (const s of subjectList) {
    await Subject.findOneAndUpdate(
      { branch: s.branch, semester: s.semester, subjectCode: s.subjectCode },
      {
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        type: s.type,
        hoursPerWeek: s.hoursPerWeek,
        credits: s.credits,
        branch: s.branch,
        semester: s.semester,
        academicYear: s.academicYear,
        assignedTeacherName: s.assignedTeacherName,
        assignedTeacherId: s.assignedTeacherId,
        description: `Subharti Polytechnic CSE 5th Semester Curriculum - ${s.subjectName}`
      },
      { upsert: true, new: true }
    );
    console.log(`[Synced Subject] ${s.subjectCode}: ${s.subjectName} (${s.type})`);
  }

  // 4. Update TimetableConfig to EXACT MANDATORY DAILY TIMING STRUCTURE
  const mandatorySlots = [
    { slotNumber: 1, label: "I", startTime: "08:00", endTime: "09:00", isBreak: false },
    { slotNumber: 2, label: "II", startTime: "09:00", endTime: "10:00", isBreak: false },
    { slotNumber: 3, label: "III", startTime: "10:00", endTime: "11:00", isBreak: false },
    { slotNumber: 4, label: "IV", startTime: "11:00", endTime: "12:00", isBreak: false },
    { slotNumber: 5, label: "V", startTime: "12:00", endTime: "13:00", isBreak: false },
    { slotNumber: 6, label: "LUNCH", startTime: "13:00", endTime: "14:00", isBreak: true, breakType: "lunch" },
    { slotNumber: 7, label: "VI–VII", startTime: "14:00", endTime: "16:00", isBreak: false }
  ];

  const mandatoryBreaks = [
    { label: "Lunch Break", startTime: "13:00", endTime: "14:00", afterPeriod: 5, breakType: "lunch" }
  ];

  await TimetableConfig.findOneAndUpdate(
    { branch: "CSE", semester: "Semester 5", section: "A" },
    {
      academicSession: "2025-2026",
      branch: "CSE",
      semester: "Semester 5",
      section: "A",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      collegeStartTime: "08:00",
      collegeEndTime: "16:00",
      periodDuration: 60,
      dailyPeriods: 7,
      slots: mandatorySlots,
      breaks: mandatoryBreaks,
      specialExceptions: []
    },
    { upsert: true, new: true }
  );
  console.log("\n[Synced TimetableConfig] Mandatory 08:00 AM - 04:00 PM structure configured.");

  // 5. Construct & Upsert Master Timetable Exactly Matching the Subharti Reference Photograph
  const subhartiScheduleDays = [
    {
      dayOfWeek: "Monday",
      slots: [
        {
          periodNumber: 1,
          startTime: "08:00",
          endTime: "09:00",
          type: "Theory",
          subject: "OOPS with Java",
          subjectCode: "PCS-504P",
          teacherName: "Er. Praveen Kumar",
          teacherDesignation: "Assistant Professor",
          roomNo: "Room No. 302",
          lectureTitle: "OOPS WITH JAVA (Theory)",
          color: "#2563EB"
        },
        {
          periodNumber: 2,
          startTime: "09:00",
          endTime: "10:00",
          type: "Theory",
          subject: "Advanced Computer Networks",
          subjectCode: "PCS-502A",
          teacherName: "Er. Reena Singh",
          teacherDesignation: "HOD & Associate Professor (CSE)",
          roomNo: "Room No. 302",
          lectureTitle: "ACN (Theory)",
          color: "#FF6B0A"
        },
        {
          periodNumber: 3,
          startTime: "10:00",
          endTime: "11:00",
          type: "Practical",
          subject: "OOPS with Java Lab",
          subjectCode: "PCS-504P",
          teacherName: "Er. Praveen Kumar",
          teacherDesignation: "Assistant Professor",
          roomNo: "Comp. Lab",
          lectureTitle: "OOPS WITH JAVA LAB",
          color: "#2563EB"
        },
        {
          periodNumber: 4,
          startTime: "11:00",
          endTime: "12:00",
          type: "Practical",
          subject: "Student Centered Activities",
          subjectCode: "PSCA-005P",
          teacherName: "Mr. Sachin Singh, Er. Praveen Kumar",
          teacherDesignation: "Activity Leads",
          roomNo: "Room No. 302",
          lectureTitle: "SCA- RESEARCH/MOCK INTERVIEW",
          color: "#10B981"
        },
        {
          periodNumber: 5,
          startTime: "12:00",
          endTime: "13:00",
          type: "Theory",
          subject: "Library & Self Study",
          subjectCode: "LIB",
          teacherName: "Library In-Charge",
          teacherDesignation: "Librarian",
          roomNo: "Library",
          lectureTitle: "LIB",
          color: "#64748B"
        },
        {
          periodNumber: 6,
          startTime: "13:00",
          endTime: "14:00",
          type: "Break",
          isBreak: true,
          subject: "LUNCH",
          color: "#F59E0B"
        },
        {
          periodNumber: 7,
          startTime: "14:00",
          endTime: "16:00",
          type: "Practical",
          subject: "Management & Technology Lab",
          subjectCode: "PCS-501A",
          teacherName: "Er. Deepak Kumar",
          teacherDesignation: "Assistant Professor",
          roomNo: "Comp. Lab",
          lectureTitle: "MT LAB (2-Hour Practical)",
          isConsecutive: true,
          color: "#7C3AED"
        }
      ]
    },
    {
      dayOfWeek: "Tuesday",
      slots: [
        {
          periodNumber: 1,
          startTime: "08:00",
          endTime: "09:00",
          type: "Theory",
          subject: "Management & Technology",
          subjectCode: "PCS-501A",
          teacherName: "Er. Deepak Kumar",
          teacherDesignation: "Assistant Professor",
          roomNo: "Room No. 302",
          lectureTitle: "MT (Theory)",
          color: "#7C3AED"
        },
        {
          periodNumber: 2,
          startTime: "09:00",
          endTime: "10:00",
          type: "Theory",
          subject: "Internet of Things",
          subjectCode: "PCS-505P",
          teacherName: "Er. Ujjawal Mishra",
          teacherDesignation: "Assistant Professor",
          roomNo: "Room No. 302",
          lectureTitle: "IOT (Theory)",
          color: "#06B6D4"
        },
        {
          periodNumber: 3,
          startTime: "10:00",
          endTime: "11:00",
          type: "Practical",
          subject: "OOPS with Java Lab",
          subjectCode: "PCS-504P",
          teacherName: "Er. Praveen Kumar",
          teacherDesignation: "Assistant Professor",
          roomNo: "Comp. Lab",
          lectureTitle: "OOPS WITH JAVA LAB",
          color: "#2563EB"
        },
        {
          periodNumber: 4,
          startTime: "11:00",
          endTime: "12:00",
          type: "Practical",
          subject: "Student Centered Activities",
          subjectCode: "PSCA-005P",
          teacherName: "Er. Rajesh Parihar, Er. Deepak Kumar",
          teacherDesignation: "Sports Leads",
          roomNo: "Sports Ground",
          lectureTitle: "SCA- SPORTS",
          color: "#10B981"
        },
        {
          periodNumber: 5,
          startTime: "12:00",
          endTime: "13:00",
          type: "Practical",
          subject: "Student Centered Activities",
          subjectCode: "PSCA-005P",
          teacherName: "Er. Rajesh Parihar, Er. Deepak Kumar",
          teacherDesignation: "Sports Leads",
          roomNo: "Sports Ground",
          lectureTitle: "SCA- SPORTS",
          color: "#10B981"
        },
        {
          periodNumber: 6,
          startTime: "13:00",
          endTime: "14:00",
          type: "Break",
          isBreak: true,
          subject: "LUNCH",
          color: "#F59E0B"
        },
        {
          periodNumber: 7,
          startTime: "14:00",
          endTime: "16:00",
          type: "Practical",
          subject: "Internet of Things Lab",
          subjectCode: "PCS-505P",
          teacherName: "Er. Ujjawal Mishra",
          teacherDesignation: "Assistant Professor",
          roomNo: "Comp. Lab",
          lectureTitle: "IOT LAB (2-Hour Practical)",
          isConsecutive: true,
          color: "#06B6D4"
        }
      ]
    },
    {
      dayOfWeek: "Wednesday",
      slots: [
        {
          periodNumber: 1,
          startTime: "08:00",
          endTime: "09:00",
          type: "Practical",
          subject: "Student Centered Activities",
          subjectCode: "PSCA-005P",
          teacherName: "Mr. Shivam Kaushik, Er. Praveen Kumar",
          teacherDesignation: "Aptitude Leads",
          roomNo: "Room No. 302",
          lectureTitle: "SCA- APTITUDE/MOCK INTERVIEW",
          color: "#10B981"
        },
        {
          periodNumber: 2,
          startTime: "09:00",
          endTime: "10:00",
          type: "Practical",
          subject: "Management & Technology Lab",
          subjectCode: "PCS-501A",
          teacherName: "Er. Deepak Kumar",
          teacherDesignation: "Assistant Professor",
          roomNo: "Comp. Lab",
          lectureTitle: "MT LAB",
          color: "#7C3AED"
        },
        {
          periodNumber: 3,
          startTime: "10:00",
          endTime: "11:00",
          type: "Theory",
          subject: "Artificial Intelligence & Machine Learning",
          subjectCode: "PCS-503A",
          teacherName: "Er. Sunny Gaur",
          teacherDesignation: "Assistant Professor",
          roomNo: "Room No. 302",
          lectureTitle: "AI&ML (Theory)",
          color: "#8B5CF6"
        },
        {
          periodNumber: 4,
          startTime: "11:00",
          endTime: "12:00",
          type: "Theory",
          subject: "Advanced Computer Networks",
          subjectCode: "PCS-502A",
          teacherName: "Er. Reena Singh",
          teacherDesignation: "HOD & Associate Professor (CSE)",
          roomNo: "Room No. 302",
          lectureTitle: "ACN (Theory)",
          color: "#FF6B0A"
        },
        {
          periodNumber: 5,
          startTime: "12:00",
          endTime: "13:00",
          type: "Practical",
          subject: "OOPS with Java Lab",
          subjectCode: "PCS-504P",
          teacherName: "Er. Praveen Kumar",
          teacherDesignation: "Assistant Professor",
          roomNo: "Comp. Lab",
          lectureTitle: "OOPS WITH JAVA LAB",
          color: "#2563EB"
        },
        {
          periodNumber: 6,
          startTime: "13:00",
          endTime: "14:00",
          type: "Break",
          isBreak: true,
          subject: "LUNCH",
          color: "#F59E0B"
        },
        {
          periodNumber: 7,
          startTime: "14:00",
          endTime: "16:00",
          type: "Practical",
          subject: "Internet of Things Lab",
          subjectCode: "PCS-505P",
          teacherName: "Er. Ujjawal Mishra",
          teacherDesignation: "Assistant Professor",
          roomNo: "Comp. Lab",
          lectureTitle: "IOT LAB (2-Hour Practical)",
          isConsecutive: true,
          color: "#06B6D4"
        }
      ]
    },
    {
      dayOfWeek: "Thursday",
      slots: [
        {
          periodNumber: 1,
          startTime: "08:00",
          endTime: "09:00",
          type: "Practical",
          subject: "Student Centered Activities",
          subjectCode: "PSCA-005P",
          teacherName: "Er. Rahul Kumar, Er. Soni Dubey, Er. Reena Singh",
          teacherDesignation: "Yoga Leads",
          roomNo: "Yoga Hall",
          lectureTitle: "SCA- YOGA",
          color: "#10B981"
        },
        {
          periodNumber: 2,
          startTime: "09:00",
          endTime: "10:00",
          type: "Practical",
          subject: "Student Centered Activities",
          subjectCode: "PSCA-005P",
          teacherName: "Er. Rahul Kumar, Er. Soni Dubey, Er. Reena Singh",
          teacherDesignation: "Yoga Leads",
          roomNo: "Yoga Hall",
          lectureTitle: "SCA- YOGA",
          color: "#10B981"
        },
        {
          periodNumber: 3,
          startTime: "10:00",
          endTime: "11:00",
          type: "Theory",
          subject: "Artificial Intelligence & Machine Learning",
          subjectCode: "PCS-503A",
          teacherName: "Er. Sunny Gaur",
          teacherDesignation: "Assistant Professor",
          roomNo: "Room No. 302",
          lectureTitle: "AI&ML (Theory)",
          color: "#8B5CF6"
        },
        {
          periodNumber: 4,
          startTime: "11:00",
          endTime: "12:00",
          type: "Theory",
          subject: "Advanced Computer Networks",
          subjectCode: "PCS-502A",
          teacherName: "Er. Reena Singh",
          teacherDesignation: "HOD & Associate Professor (CSE)",
          roomNo: "Room No. 302",
          lectureTitle: "ACN (Theory)",
          color: "#FF6B0A"
        },
        {
          periodNumber: 5,
          startTime: "12:00",
          endTime: "13:00",
          type: "Practical",
          subject: "Management & Technology Lab",
          subjectCode: "PCS-501A",
          teacherName: "Er. Deepak Kumar",
          teacherDesignation: "Assistant Professor",
          roomNo: "Comp. Lab",
          lectureTitle: "MT LAB",
          color: "#7C3AED"
        },
        {
          periodNumber: 6,
          startTime: "13:00",
          endTime: "14:00",
          type: "Break",
          isBreak: true,
          subject: "LUNCH",
          color: "#F59E0B"
        },
        {
          periodNumber: 7,
          startTime: "14:00",
          endTime: "16:00",
          type: "Practical",
          subject: "Advanced Computer Networks Lab",
          subjectCode: "PCS-502A",
          teacherName: "Er. Reena Singh",
          teacherDesignation: "HOD & Associate Professor (CSE)",
          roomNo: "Comp. Lab",
          lectureTitle: "ACN LAB (2-Hour Practical)",
          isConsecutive: true,
          color: "#FF6B0A"
        }
      ]
    },
    {
      dayOfWeek: "Friday",
      slots: [
        {
          periodNumber: 1,
          startTime: "08:00",
          endTime: "09:00",
          type: "Theory",
          subject: "Management & Technology",
          subjectCode: "PCS-501A",
          teacherName: "Er. Deepak Kumar",
          teacherDesignation: "Assistant Professor",
          roomNo: "Room No. 302",
          lectureTitle: "MT (Theory)",
          color: "#7C3AED"
        },
        {
          periodNumber: 2,
          startTime: "09:00",
          endTime: "10:00",
          type: "Theory",
          subject: "Artificial Intelligence & Machine Learning",
          subjectCode: "PCS-503A",
          teacherName: "Er. Sunny Gaur",
          teacherDesignation: "Assistant Professor",
          roomNo: "Room No. 302",
          lectureTitle: "AI&ML (Theory)",
          color: "#8B5CF6"
        },
        {
          periodNumber: 3,
          startTime: "10:00",
          endTime: "11:00",
          type: "Theory",
          subject: "Indian Constitution",
          subjectCode: "PIC-005",
          teacherName: "Miss M",
          teacherDesignation: "Faculty",
          roomNo: "Room No. 302",
          lectureTitle: "IC (Theory)",
          color: "#D97706"
        },
        {
          periodNumber: 4,
          startTime: "11:00",
          endTime: "12:00",
          type: "Practical",
          subject: "Student Centered Activities",
          subjectCode: "PSCA-005P",
          teacherName: "Mr. Chitranjan Kumar, Er. Sunny Gaur, Er. Soni Dubey",
          teacherDesignation: "Cultural Leads",
          roomNo: "Auditorium",
          lectureTitle: "SCA- CULTURAL ACTIVITY",
          color: "#10B981"
        },
        {
          periodNumber: 5,
          startTime: "12:00",
          endTime: "13:00",
          type: "Practical",
          subject: "Student Centered Activities",
          subjectCode: "PSCA-005P",
          teacherName: "Er. Reena Singh, Er. Aanchal Sharma, Er. Ujjawal Mishra",
          teacherDesignation: "Cultural Leads",
          roomNo: "Auditorium",
          lectureTitle: "SCA- CULTURAL ACTIVITY",
          color: "#10B981"
        },
        {
          periodNumber: 6,
          startTime: "13:00",
          endTime: "14:00",
          type: "Break",
          isBreak: true,
          subject: "LUNCH",
          color: "#F59E0B"
        },
        {
          periodNumber: 7,
          startTime: "14:00",
          endTime: "16:00",
          type: "Practical",
          subject: "Advanced Computer Networks & Java Lab",
          subjectCode: "PCS-502A / PCS-504P",
          teacherName: "Er. Reena Singh & Er. Praveen Kumar",
          teacherDesignation: "Faculty Leads",
          roomNo: "Comp. Lab",
          lectureTitle: "ACN LAB & OOPS WITH JAVA LAB",
          isConsecutive: true,
          color: "#FF6B0A"
        }
      ]
    },
    {
      dayOfWeek: "Saturday",
      slots: [
        {
          periodNumber: 1,
          startTime: "08:00",
          endTime: "09:00",
          type: "Theory",
          subject: "Management & Technology",
          subjectCode: "PCS-501A",
          teacherName: "Er. Deepak Kumar",
          teacherDesignation: "Assistant Professor",
          roomNo: "Room No. 302",
          lectureTitle: "MT (Theory)",
          color: "#7C3AED"
        },
        {
          periodNumber: 2,
          startTime: "09:00",
          endTime: "10:00",
          type: "Theory",
          subject: "Artificial Intelligence & Machine Learning",
          subjectCode: "PCS-503A",
          teacherName: "Er. Sunny Gaur",
          teacherDesignation: "Assistant Professor",
          roomNo: "Room No. 302",
          lectureTitle: "AI&ML (Theory)",
          color: "#8B5CF6"
        },
        {
          periodNumber: 3,
          startTime: "10:00",
          endTime: "11:00",
          type: "Theory",
          subject: "Indian Constitution",
          subjectCode: "PIC-005",
          teacherName: "Miss M",
          teacherDesignation: "Faculty",
          roomNo: "Room No. 302",
          lectureTitle: "IC (Theory)",
          color: "#D97706"
        },
        {
          periodNumber: 4,
          startTime: "11:00",
          endTime: "12:00",
          type: "Practical",
          subject: "Advanced Computer Networks Lab",
          subjectCode: "PCS-502A",
          teacherName: "Er. Reena Singh",
          teacherDesignation: "HOD & Associate Professor (CSE)",
          roomNo: "Comp. Lab",
          lectureTitle: "ACN LAB",
          color: "#FF6B0A"
        },
        {
          periodNumber: 5,
          startTime: "12:00",
          endTime: "13:00",
          type: "Theory",
          subject: "Network Systems Special Lecture",
          subjectCode: "PCS-502A",
          teacherName: "Er. Reena Singh",
          teacherDesignation: "HOD & Associate Professor (CSE)",
          roomNo: "Room No. 302",
          lectureTitle: "ACN SPECIAL LECTURE",
          color: "#FF6B0A"
        },
        {
          periodNumber: 6,
          startTime: "13:00",
          endTime: "14:00",
          type: "Break",
          isBreak: true,
          subject: "LUNCH",
          color: "#F59E0B"
        },
        {
          periodNumber: 7,
          startTime: "14:00",
          endTime: "16:00",
          type: "Practical",
          subject: "Network Systems Laboratory",
          subjectCode: "NET-LAB",
          teacherName: "Er. Reena Singh & Networking Team",
          teacherDesignation: "Laboratory Leads",
          roomNo: "Net Lab",
          lectureTitle: "NET LAB (2-Hour Practical)",
          isConsecutive: true,
          color: "#10B981"
        }
      ]
    }
  ];

  // Populate teacher and subject references for each slot
  for (const day of subhartiScheduleDays) {
    for (const slot of day.slots) {
      if (slot.isBreak) continue;
      const sub = subjectList.find(s => s.subjectCode === slot.subjectCode || slot.subject.includes(s.shortName));
      if (sub) {
        slot.subjectId = sub._id;
      }
      const fac = facultyRoster.find(f => slot.teacherName.includes(f.fullName) || slot.teacherName.includes(f.abbr));
      if (fac) {
        const mapped = facultyMap.get(fac.abbr);
        if (mapped) {
          slot.teacherId = mapped.id;
        }
      }
    }
  }

  // Upsert Master Timetable
  const masterTimetable = await Timetable.findOneAndUpdate(
    { branch: "CSE", semester: "Semester 5", section: "A", isMaster: true },
    {
      academicSession: "2025-2026",
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      section: "A",
      timetableType: "structured",
      creationMode: "manual",
      title: "Subharti Polytechnic College, Meerut - Official CSE 3rd Year / 5th Sem Master Timetable",
      collegeName: "Subharti Polytechnic College, Meerut",
      effectiveDate: new Date("2026-08-01"),
      status: "published",
      version: 22,
      scheduleDays: subhartiScheduleDays,
      approvalHistory: [
        {
          user: "Er. Amit Kumar",
          role: "coordinator",
          action: "created",
          timestamp: new Date(),
          remarks: "Initialized from Subharti Polytechnic reference timetable scan."
        },
        {
          user: "Er. Reena Singh",
          role: "hod",
          action: "approved",
          timestamp: new Date(),
          remarks: "Approved by Head of Department (CSE)."
        },
        {
          user: "Prof. (Dr.) S. C. Tiwari",
          role: "principal",
          action: "published",
          timestamp: new Date(),
          remarks: "Official publication of Semester 5 schedule."
        }
      ]
    },
    { upsert: true, new: true }
  );

  console.log(`\n[SUCCESS] Master Timetable synced! ID: ${masterTimetable._id}, Version: ${masterTimetable.version}`);
  console.log("Days:", masterTimetable.scheduleDays.map(d => `${d.dayOfWeek} (${d.slots.length} slots)`));

  await disconnectDB();
  console.log("\n[MIGRATION COMPLETED SUCCESSFULLY]");
  process.exit(0);
}

syncSubhartiData().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
