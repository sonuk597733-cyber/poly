/**
 * Subharti Polytechnic College Timetable Constants & Configurations
 * Matches the official reference timetable photograph from Subharti Polytechnic College, Meerut.
 */

export const MANDATORY_TIMETABLE_PERIODS = [
  {
    periodNumber: 1,
    label: "I",
    startTime: "08:00",
    endTime: "09:00",
    displayTime: "08:00 AM – 09:00 AM",
    duration: "1 hour",
    type: "Theory",
    isBreak: false
  },
  {
    periodNumber: 2,
    label: "II",
    startTime: "09:00",
    endTime: "10:00",
    displayTime: "09:00 AM – 10:00 AM",
    duration: "1 hour",
    type: "Theory",
    isBreak: false
  },
  {
    periodNumber: 3,
    label: "III",
    startTime: "10:00",
    endTime: "11:00",
    displayTime: "10:00 AM – 11:00 AM",
    duration: "1 hour",
    type: "Theory",
    isBreak: false
  },
  {
    periodNumber: 4,
    label: "IV",
    startTime: "11:00",
    endTime: "12:00",
    displayTime: "11:00 AM – 12:00 PM",
    duration: "1 hour",
    type: "Theory",
    isBreak: false
  },
  {
    periodNumber: 5,
    label: "V",
    startTime: "12:00",
    endTime: "13:00",
    displayTime: "12:00 PM – 01:00 PM",
    duration: "1 hour",
    type: "Theory",
    isBreak: false
  },
  {
    periodNumber: 6,
    label: "LUNCH",
    startTime: "13:00",
    endTime: "14:00",
    displayTime: "01:00 PM – 02:00 PM",
    duration: "1 hour",
    type: "Break",
    isBreak: true
  },
  {
    periodNumber: 7,
    label: "VI–VII",
    startTime: "14:00",
    endTime: "16:00",
    displayTime: "02:00 PM – 04:00 PM",
    duration: "2 hours",
    type: "Practical",
    isBreak: false
  }
];

export const SUBHARTI_FACULTY_LEGEND = [
  { abbr: "RS", name: "Er. REENA SINGH", designation: "HOD & Assoc. Professor (CSE)" },
  { abbr: "UM", name: "Er. UJJAWAL MISHRA", designation: "Assistant Professor (IoT & Embedded)" },
  { abbr: "SG", name: "Er. SUNNY GAUR", designation: "Assistant Professor (AI & ML)" },
  { abbr: "PK", name: "Er. PRAVEEN KUMAR", designation: "Assistant Professor (OOPS & Java)" },
  { abbr: "DK", name: "Er. DEEPAK KUMAR", designation: "Assistant Professor (Management & Tech)" },
  { abbr: "SD", name: "Er. SONI DUBEY", designation: "Assistant Professor (Yoga & Activities)" },
  { abbr: "RP", name: "Er. RAJESH PARIHAR", designation: "Assistant Professor & Sports Lead" },
  { abbr: "SS", name: "Mr. SACHIN SINGH", designation: "Lecturer (Mock Interviews & Research)" },
  { abbr: "SK", name: "Mr. SHIVAM KAUSHIK", designation: "Lecturer (Aptitude & Reasoning)" },
  { abbr: "RK", name: "Er. RAHUL KUMAR", designation: "Assistant Professor (Yoga In-Charge)" },
  { abbr: "CK", name: "Er. CHITRANJAN KUMAR", designation: "Assistant Professor (Cultural & Soft Skills)" },
  { abbr: "AS", name: "Er. AANCHAL SHARMA", designation: "Assistant Professor (Cultural In-Charge)" },
  { abbr: "M", name: "Miss M", designation: "Faculty (Indian Constitution)" },
  { abbr: "SCT", name: "Prof. (Dr.) S. C. TIWARI", designation: "Principal (Polytechnic College)" }
];

export const SUBHARTI_TIMETABLE_HEADER = {
  institution: "SUBHARTI POLYTECHNIC COLLEGE, MEERUT",
  department: "DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING",
  branch: "CSE",
  semester: "3RD / 5TH SEM",
  academicSession: "2026-27",
  roomNo: "ROOM NO.-302"
};

export const SUBHARTI_AUTHORITY_SIGNATURES = [
  {
    role: "HOD",
    title: "Er. REENA SINGH",
    subtitle: "(HOD, CSE)",
    designation: "Head of Department"
  },
  {
    role: "COORDINATOR",
    title: "Er. AMIT KUMAR",
    subtitle: "(ACADEMIC COORDINATOR)",
    designation: "Academic Coordinator"
  },
  {
    role: "PRINCIPAL",
    title: "PROF. (DR.) S. C. TIWARI",
    subtitle: "(PRINCIPAL)",
    designation: "Principal, Polytechnic College"
  }
];
