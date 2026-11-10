import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const usersCol = mongoose.connection.collection("users");
  const teacherCol = mongoose.connection.collection("teacherprofiles");
  const timetableCol = mongoose.connection.collection("timetables");
  const leaveCol = mongoose.connection.collection("leaveapplications");

  // 1. Find teacher user
  const teacher = await usersCol.findOne({ email: "faculty.demo@subharti.org" });
  if (teacher) {
    await usersCol.updateOne(
      { _id: teacher._id },
      { $set: { status: "active", isEmailVerified: true } }
    );
    await teacherCol.updateOne(
      { userId: teacher._id },
      {
        $set: {
          userId: teacher._id,
          department: "Computer Science & Engineering",
          employeeId: "EMP-CSE-108",
          designation: "Associate Professor / Systems Lead",
          responsibilities: "OS Laboratory Lead, Curriculum Advisory Committee",
          approvalStatus: "approved",
          subjects: ["Operating Systems", "Cloud Computing", "Database Management Systems"],
          bio: "Associate Professor in CSE. Lead instructor for Operating Systems and Distributed Cloud Networks."
        }
      },
      { upsert: true }
    );
    console.log("Synced Dr. Sunita Deshpande profile");
  }

  // 2. Add 3 more faculty members to CSE so the HOD command center has a realistic, rich roster
  const facultyData = [
    {
      fullName: "Prof. Arvind Mehta",
      email: "arvind.mehta@subharti.edu.in",
      designation: "Professor & Academic Dean",
      employeeId: "EMP-CSE-101",
      department: "CSE",
      subjects: ["Computer Networks", "Cyber Security", "Network Architecture"],
      responsibilities: "Academic Audit Chairman, Senior Faculty Advisor",
      status: "active",
      phone: "+91 98112 34567",
      bio: "Distinguished academician with over 18 years experience in Network Security and Cloud Architectures."
    },
    {
      fullName: "Dr. Neha Kulkarni",
      email: "neha.kulkarni@subharti.edu.in",
      designation: "Assistant Professor",
      employeeId: "EMP-CSE-112",
      department: "Computer Science & Engineering",
      subjects: ["Data Structures & Algorithms", "Theory of Computation"],
      responsibilities: "Competitive Coding Club Lead, NAAC Criteria 3 In-charge",
      status: "active",
      phone: "+91 97123 45678",
      bio: "Ph.D. in Graph Algorithms. Passionate educator focusing on DSA and competitive programming."
    },
    {
      fullName: "Er. Vikram Rathore",
      email: "vikram.rathore@subharti.edu.in",
      designation: "Lecturer & Lab Instructor",
      employeeId: "EMP-CSE-119",
      department: "CSE",
      subjects: ["Web Technologies Lab", "Python Programming"],
      responsibilities: "Software Lab 2 In-charge, Linux Systems Administrator",
      status: "active",
      phone: "+91 96123 78901",
      bio: "Full-stack developer and open source enthusiast mentoring diploma students in modern web stacks."
    }
  ];

  for (const fac of facultyData) {
    let u = await usersCol.findOne({ email: fac.email });
    if (!u) {
      const inserted = await usersCol.insertOne({
        fullName: fac.fullName,
        email: fac.email,
        passwordHash: "$2a$10$wZkLrqgYVvVd3b.PzS9e2OuZ9j1k5Z5s4R3o2u1Y0x9w8v7u6t5s4",
        role: "teacher",
        status: fac.status,
        isEmailVerified: true,
        phone: fac.phone,
        bio: fac.bio,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      u = { _id: inserted.insertedId };
      console.log(`Created user: ${fac.fullName}`);
    }

    await teacherCol.updateOne(
      { userId: u._id },
      {
        $set: {
          userId: u._id,
          department: fac.department,
          employeeId: fac.employeeId,
          designation: fac.designation,
          responsibilities: fac.responsibilities,
          approvalStatus: "approved",
          subjects: fac.subjects,
          bio: fac.bio,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`Synced profile for: ${fac.fullName}`);
  }

  // 3. Ensure Master Timetable has slots assigned to these faculty members in CSE
  const sunita = await usersCol.findOne({ email: "faculty.demo@subharti.org" });
  const arvind = await usersCol.findOne({ email: "arvind.mehta@subharti.edu.in" });
  const neha = await usersCol.findOne({ email: "neha.kulkarni@subharti.edu.in" });
  const vikram = await usersCol.findOne({ email: "vikram.rathore@subharti.edu.in" });

  const existingTT = await timetableCol.find({ branch: "CSE" }).toArray();
  if (existingTT.length === 0) {
    await timetableCol.insertOne({
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      dayOfWeek: "Monday",
      slots: [
        {
          startTime: "09:00 AM",
          endTime: "10:00 AM",
          subject: "Operating Systems",
          teacherId: sunita._id,
          teacherName: sunita.fullName,
          roomNo: "Hall 201",
          type: "Lecture"
        },
        {
          startTime: "10:15 AM",
          endTime: "11:15 AM",
          subject: "Computer Networks",
          teacherId: arvind._id,
          teacherName: arvind.fullName,
          roomNo: "Hall 201",
          type: "Lecture"
        },
        {
          startTime: "11:30 AM",
          endTime: "01:30 PM",
          subject: "Operating Systems Lab",
          teacherId: sunita._id,
          teacherName: sunita.fullName,
          roomNo: "Systems Lab 1",
          type: "Lab"
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await timetableCol.insertOne({
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      dayOfWeek: "Wednesday",
      slots: [
        {
          startTime: "09:00 AM",
          endTime: "10:00 AM",
          subject: "Data Structures & Algorithms",
          teacherId: neha._id,
          teacherName: neha.fullName,
          roomNo: "Hall 202",
          type: "Lecture"
        },
        {
          startTime: "10:15 AM",
          endTime: "12:15 PM",
          subject: "Web Technologies Lab",
          teacherId: vikram._id,
          teacherName: vikram.fullName,
          roomNo: "Lab 2",
          type: "Lab"
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log("Seeded master timetable for CSE");
  } else {
    console.log(`CSE timetables exist: ${existingTT.length} docs`);
  }

  // 4. Sample leave application for Sunita
  if (sunita) {
    const sunitaLeave = await leaveCol.findOne({ applicantId: sunita._id });
    if (!sunitaLeave) {
      await leaveCol.insertOne({
        applicantId: sunita._id,
        applicantRole: "teacher",
        applicantName: sunita.fullName,
        department: "CSE",
        leaveType: "Academic / Duty",
        startDate: new Date("2026-11-10"),
        endDate: new Date("2026-11-12"),
        reason: "Attending National Conference on Distributed Cloud Networks at IIT Delhi.",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("Created duty leave application for Dr. Sunita Deshpande");
    }
  }

  console.log("Sync complete!");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
