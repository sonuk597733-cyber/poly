import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const collectionItemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    issuer: { type: String, trim: true, default: "" },
    year: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" }
  },
  { _id: true }
);

const projectItemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    technologies: { type: [String], default: [] },
    tech: { type: [String], default: [] },
    githubUrl: { type: String, trim: true, default: "" },
    liveUrl: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "Web Development" },
    role: { type: String, trim: true, default: "Lead Developer" },
    stars: { type: Number, default: 4.8 },
    featured: { type: Boolean, default: false },
    image: { type: String, trim: true, default: "" },
    completionDate: { type: String, trim: true, default: "" }
  },
  { _id: true }
);

const experienceItemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    role: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    duration: { type: String, trim: true, default: "" },
    type: { type: String, trim: true, default: "Internship" }, // Internship | Full-time | Part-time | Freelance
    startDate: { type: String, trim: true, default: "" },
    endDate: { type: String, trim: true, default: "Present" },
    description: { type: String, trim: true, default: "" },
    skills: { type: [String], default: [] }
  },
  { _id: true }
);

const achievementItemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    issuer: { type: String, trim: true, default: "Subharti University" },
    year: { type: String, trim: true, default: "2025" },
    description: { type: String, trim: true, default: "" },
    badge: { type: String, trim: true, default: "top_student" }, // top_student, coding_star, project_expert, campus_leader, tech_explorer
    category: { type: String, trim: true, default: "Academic Excellence" },
    verified: { type: Boolean, default: true }
  },
  { _id: true }
);

const certificationItemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    issuer: { type: String, trim: true, default: "" },
    year: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    credentialId: { type: String, trim: true, default: "" },
    credentialUrl: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    verificationStatus: { type: String, default: "verified" }
  },
  { _id: true }
);

const documentItemSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    type: { type: String, trim: true, default: "ID Proof" }, // e.g., "ID Proof", "Marksheet", "Certificate", "Other"
    fileUrl: { type: String, trim: true, required: true },
    fileId: { type: String, trim: true, default: "" },
    fileName: { type: String, trim: true, default: "" },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, trim: true, default: "" },
    verificationStatus: {
      type: String,
      enum: ["verified", "pending_verification", "rejected"],
      default: "pending_verification"
    },
    uploadedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: String, default: null },
    rejectionReason: { type: String, default: "" }
  },
  { _id: true }
);

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    branch: {
      type: String,
      enum: ALLOWED_BRANCHES,
      default: "CSE"
    },
    academicYear: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year"],
      default: "2nd Year"
    },
    semester: {
      type: String,
      default: "Semester 5"
    },
    enrollmentNo: {
      type: String,
      trim: true,
      uppercase: true,
      default: ""
    },
    section: {
      type: String,
      trim: true,
      default: "A"
    },
    studentId: {
      type: String,
      trim: true,
      default: ""
    },
    admissionYear: {
      type: String,
      trim: true,
      default: "2024"
    },
    academicSession: {
      type: String,
      trim: true,
      default: "2024-2027"
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      trim: true,
      default: ""
    },
    city: {
      type: String,
      trim: true,
      default: ""
    },
    state: {
      type: String,
      trim: true,
      default: ""
    },
    pincode: {
      type: String,
      trim: true,
      default: ""
    },
    emergencyContact: {
      name: { type: String, trim: true, default: "" },
      relation: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" }
    },
    documents: {
      type: [documentItemSchema],
      default: []
    },
    verificationStatus: {
      type: String,
      enum: ["pending_verification", "verified", "rejected"],
      default: "verified",
      index: true
    },
    attendancePercentage: {
      type: Number,
      default: 85,
      min: 0,
      max: 100
    },
    sgpa: {
      type: Number,
      default: 8.9,
      min: 0,
      max: 10
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: [160, "Tagline cannot exceed 160 characters"],
      default: "Code Today, Lead Tomorrow 🚀"
    },
    headline: {
      type: String,
      trim: true,
      maxlength: [120, "Headline cannot exceed 120 characters"],
      default: "Aspiring Software Engineer & Web Developer"
    },
    location: {
      type: String,
      trim: true,
      maxlength: [120, "Location cannot exceed 120 characters"],
      default: "Dinara, Rohtas, Bihar"
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
      default:
        "Hello! I'm a passionate developer and tech enthusiast. Currently pursuing Diploma in Engineering from Subharti University. I love building web applications, learning new technologies and exploring opportunities in tech."
    },
    careerObjective: {
      type: String,
      trim: true,
      maxlength: [1000, "Career objective cannot exceed 1000 characters"],
      default: "Seeking a challenging full-stack engineering role to build impactful web and cloud products."
    },
    skills: {
      type: [String],
      default: [
        "React",
        "Next.js",
        "JavaScript",
        "TypeScript",
        "Node.js",
        "MongoDB",
        "Python",
        "C++",
        "DSA",
        "Tailwind CSS",
        "UI/UX Design",
        "Git & GitHub",
        "Web Development"
      ]
    },
    // Social & Professional Platforms
    linkedin: { type: String, trim: true, default: "https://linkedin.com/in/sonukumar" },
    github: { type: String, trim: true, default: "https://github.com/sonukumar" },
    portfolio: { type: String, trim: true, default: "https://sonuportfolio.dev" },
    socialLinks: {
      linkedin: { type: String, trim: true, default: "https://linkedin.com/in/sonukumar" },
      github: { type: String, trim: true, default: "https://github.com/sonukumar" },
      youtube: { type: String, trim: true, default: "https://youtube.com/@sonukumar" },
      portfolio: { type: String, trim: true, default: "https://sonuportfolio.dev" },
      twitter: { type: String, trim: true, default: "https://x.com/sonukumar" },
      instagram: { type: String, trim: true, default: "https://instagram.com/sonukumar" },
      discord: { type: String, trim: true, default: "https://discord.gg/sonukumar" },
      website: { type: String, trim: true, default: "https://sonukumar.tech" },
      leetcode: { type: String, trim: true, default: "https://leetcode.com/u/sonukumar" },
      hackerrank: { type: String, trim: true, default: "https://hackerrank.com/sonukumar" }
    },
    career: {
      objective: {
        type: String,
        trim: true,
        default: "Seeking a challenging full-stack engineering role to build impactful web and cloud products."
      },
      preferredRoles: {
        type: [String],
        default: ["Frontend Developer", "Full Stack Engineer", "React Developer", "Software Engineer"]
      },
      preferredIndustries: {
        type: [String],
        default: ["Information Technology", "FinTech", "EdTech", "SaaS Enterprises"]
      },
      resumeUrl: { type: String, trim: true, default: "" },
      readinessScore: { type: Number, default: 92 }
    },
    profileViews: {
      type: Number,
      default: 142
    },
    education: {
      type: [collectionItemSchema],
      default: [
        {
          title: "Diploma in Engineering (CSE)",
          issuer: "Subharti Polytechnic, Meerut",
          year: "2024 - 2027",
          description: "Focus on Computer Science & Engineering, Data Structures, Algorithms and Operating Systems."
        },
        {
          title: "Secondary School Examination (10th)",
          issuer: "High School Dinara, Rohtas",
          year: "2022 - 2024",
          description: "Graduated with Distinction in Mathematics and Science."
        }
      ]
    },
    projects: {
      type: [projectItemSchema],
      default: [
        {
          title: "Sonu Portfolio",
          description: "Modern portfolio website with 3D animations, interactive project showcases, and responsive design.",
          technologies: ["React", "Three.js", "Tailwind CSS", "Framer Motion"],
          githubUrl: "https://github.com/sonukumar/portfolio-3d",
          liveUrl: "https://sonuportfolio.dev",
          category: "Web Development",
          role: "Sole Creator",
          stars: 4.8,
          featured: true,
          image: "/banner.webp",
          completionDate: "2026"
        },
        {
          title: "CollegeOS ERP Portal",
          description: "Comprehensive university academic lifecycle management platform with role-based workflows.",
          technologies: ["React", "Node.js", "MongoDB", "Express", "Tailwind CSS"],
          githubUrl: "https://github.com/sonukumar/collegeos",
          liveUrl: "https://collegeos.subharti.org",
          category: "Full Stack",
          role: "Frontend Architect",
          stars: 5.0,
          featured: true,
          image: "/campus-banner.jpg",
          completionDate: "2026"
        }
      ]
    },
    experience: {
      type: [experienceItemSchema],
      default: [
        {
          title: "Frontend Development Intern",
          company: "Subharti Digital Innovation Lab",
          type: "Internship",
          startDate: "June 2026",
          endDate: "Present",
          description: "Architected component libraries, responsive UI dashboards, and student portal modules.",
          skills: ["React", "JavaScript", "REST APIs", "Git"]
        }
      ]
    },
    certifications: {
      type: [certificationItemSchema],
      default: [
        {
          title: "Meta Certified Frontend Developer",
          issuer: "Meta / Coursera",
          year: "2026",
          description: "Comprehensive certification covering React, JavaScript, Responsive Web Design and Version Control.",
          credentialId: "META-FE-994253",
          credentialUrl: "https://coursera.org/verify/meta-fe-994253",
          verificationStatus: "verified"
        },
        {
          title: "MongoDB Certified Node.js Developer",
          issuer: "MongoDB University",
          year: "2025",
          description: "Database modeling, indexing, aggregation pipelines, and secure connection management.",
          credentialId: "MDB-NODE-88219",
          credentialUrl: "https://learn.mongodb.com/verify/mdb-88219",
          verificationStatus: "verified"
        }
      ]
    },
    achievements: {
      type: [achievementItemSchema],
      default: [
        {
          title: "Top Student (2025)",
          issuer: "Subharti Polytechnic",
          year: "2025",
          description: "Ranked #1 in Academic Semester with 8.9 SGPA and 100% attendance.",
          badge: "top_student",
          category: "Academic Excellence",
          verified: true
        },
        {
          title: "Coding Star",
          issuer: "Annual Polytechnic Hackathon",
          year: "2026",
          description: "First place winner for algorithmic problem-solving and rapid prototyping.",
          badge: "coding_star",
          category: "Coding Champion",
          verified: true
        },
        {
          title: "Project Expert",
          issuer: "Department of CSE",
          year: "2026",
          description: "Awarded Best Major Project for CollegeOS Campus Management Portal.",
          badge: "project_expert",
          category: "Project Excellence",
          verified: true
        },
        {
          title: "Campus Leader",
          issuer: "Student Council",
          year: "2025 - 2026",
          description: "Elected Student Class Representative and Technical Society Coordinator.",
          badge: "campus_leader",
          category: "Leadership",
          verified: true
        },
        {
          title: "Tech Explorer",
          issuer: "Innovation Hub",
          year: "2026",
          description: "Completed 50+ DSA challenges and published 5 full-stack repositories.",
          badge: "tech_explorer",
          category: "Innovation",
          verified: true
        }
      ]
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
export default StudentProfile;
