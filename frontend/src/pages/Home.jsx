import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarCheck, FileText, ClipboardList, Clock, UserCheck, Bell, Users, ArrowRight,
  BookOpen, FlaskConical, Wrench, School, Trophy, Sparkles, Cpu, Cog, Zap, Building2,
  Radio, GraduationCap, TrendingUp, ChevronDown, ArrowUp, Quote, X, ChevronLeft,
  ChevronRight, Award, CheckCircle2, Star, MapPin, Phone, Mail, ArrowUpRight,
  ShieldCheck, Compass, Check, Play, Search, Download, HelpCircle, Layers,
  Send, ExternalLink, Share2, Eye, SlidersHorizontal, Shield, Flame, Activity,
  Calendar, CheckCircle, Info, Sparkle, Globe,
  Calculator, FileCheck, Percent, DollarSign, Lightbulb, Navigation, Bookmark,
  Share, Code2, Terminal, Briefcase, Target, BadgeCheck, ThumbsUp, Smartphone,
  PhoneCall, Headphones, CheckSquare, Sliders, BookOpenCheck, Copy,
  User, RotateCw, Loader2, MessageSquare
} from "lucide-react";
import Navbar from "../components/Navbar";
import "./Home.css";

/* ==========================================================================
   HIGH-RESOLUTION CURATED CAMPUS PHOTOGRAPHY & ASSETS
   ========================================================================== */
const IMG = {
  hero: "/subharti-polytechnic-main-building.jpg",
  heroStudent: "/subharti-polytechnic-main-building.jpg",
  heroBuilding: "/subharti-polytechnic-main-building.jpg",
  about: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
  aboutCampus: "/subharti-polytechnic-main-building.jpg",
  lab: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  labCs: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
  labMech: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
  labElec: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
  labCivil: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  labEce: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  library: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80",
  workshop: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80",
  classroom: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
  events: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=800&q=80",
  hackathon: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
  studentsGrad: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
  campusLife: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80"
};

/* ==========================================================================
   CONFIGURABLE INSTITUTION DETAILS & MASTER DATA
   ========================================================================== */
export const COLLEGE = {
  name: "Subharti Polytechnic",
  university: "Swami Vivekanand Subharti University",
  shortName: "Subharti",
  tagline: "Building Skills. Shaping Engineers. Empowering Futures.",
  subTagline: "Where Engineering Excellence Meets Practical Industry Immersion",
  affiliation: "Constituent Polytechnic of Swami Vivekanand Subharti University, Meerut (Approved by AICTE)",
  estd: "Estd. 2008",
  location: "Subhartipuram, NH-58, Delhi-Haridwar Bypass Road, Meerut, UP 250005",
  photo: "/subharti-polytechnic-main-building.jpg",
  crest: "/svsu-logo-whiten.webp",
  heroSlides: [
    {
      img: "/subharti-polytechnic-main-building.jpg",
      eyebrow: "AICTE APPROVED & SVSU CONSTITUENT POLYTECHNIC",
      title: "Subharti Polytechnic College",
      sub: "Hands-on engineering laboratories, certified workshop facilities, and direct industry recruitment across 5 core technical branches.",
      tag: "AICTE Approved • SVSU Constituent"
    },
    {
      img: "/subharti-polytechnic-main-building.jpg",
      eyebrow: "INDUSTRY-ALIGNED CURRICULUMS",
      title: "Engineered for Practical Excellence",
      sub: "From modern computer science laboratories to advanced robotic CNC bays, master the tools demanded by global tech employers.",
      tag: "100% Practical Immersion"
    },
    {
      img: IMG.labCs,
      eyebrow: "CAREER LAUNCHPAD 2026",
      title: "95%+ Placement Drive Success",
      sub: "Over 120+ multinational corporations recruit directly from our campus each academic year with packages up to ₹ 7.8 LPA.",
      tag: "120+ Corporate Recruiters"
    }
  ],
  gallery: [
    { id: "g1", cat: "campus", src: "/subharti-polytechnic-main-building.jpg", title: "Subharti Polytechnic College Main Academic Building", spec: "Administrative & 5 Engineering Departments" },
    { id: "g2", cat: "labs", src: IMG.labCs, title: "Artificial Intelligence & Cloud Computing Lab", spec: "60 High-End Workstations" },
    { id: "g3", cat: "campus", src: "/subharti-polytechnic-main-building.jpg", title: "Subharti Knowledge City Campus Facade", spec: "Main Building & Portico Entrance" },
    { id: "g4", cat: "labs", src: IMG.labMech, title: "Robotics & Automation Testing Bay", spec: "Industrial 6-Axis Arms" },
    { id: "g5", cat: "campus", src: IMG.library, title: "Central University Digital Library", spec: "50,000+ E-Journals & Books" },
    { id: "g6", cat: "life", src: IMG.hackathon, title: "Annual State Hackathon & Tech Expo", spec: "Student Innovation Arena" },
    { id: "g7", cat: "labs", src: IMG.labElec, title: "High-Voltage Power & EV Systems Bay", spec: "Solar & Smart Grid Grid" },
    { id: "g8", cat: "sports", src: IMG.sports, title: "Olympic-Standard Athletics Arena", spec: "Cricket, Turf & Courts" },
    { id: "g9", cat: "life", src: IMG.studentsGrad, title: "Convocation & Degree Award Ceremony", spec: "Graduating Batch 2026" }
  ],
  students: [
    { id: 1, photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80", name: "Aarav Sharma", company: "Tata Consultancy Services", role: "Software Engineer", pkg: "₹ 7.2 LPA", branch: "CSE", logoText: "TCS", date: "Placed 2025" },
    { id: 2, photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80", name: "Priya Patel", company: "Larsen & Toubro", role: "Design Trainee", pkg: "₹ 6.8 LPA", branch: "Civil", logoText: "L&T", date: "Placed 2025" },
    { id: 3, photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", name: "Rohan Verma", company: "Infosys Technologies", role: "Systems Associate", pkg: "₹ 6.5 LPA", branch: "CSE", logoText: "INFY", date: "Placed 2025" },
    { id: 4, photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80", name: "Ananya Iyer", company: "Schneider Electric", role: "Automation Engineer", pkg: "₹ 7.0 LPA", branch: "Electrical", logoText: "SE", date: "Placed 2025" },
    { id: 5, photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80", name: "Kunal Deshmukh", company: "Mahindra & Mahindra", role: "Production Trainee", pkg: "₹ 6.2 LPA", branch: "Mechanical", logoText: "M&M", date: "Placed 2025" },
    { id: 6, photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", name: "Sneha Kulkarni", company: "Wipro Digital", role: "Cloud Support Analyst", pkg: "₹ 6.0 LPA", branch: "CSE", logoText: "WIPRO", date: "Placed 2025" },
    { id: 7, photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80", name: "Vikram Malhotra", company: "Adani Power", role: "Junior Electrical Engineer", pkg: "₹ 6.5 LPA", branch: "Electrical", logoText: "ADANI", date: "Placed 2025" },
    { id: 8, photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80", name: "Tanvi Saxena", company: "Siemens India", role: "PLC Programmer", pkg: "₹ 7.5 LPA", branch: "ECE", logoText: "SIEMENS", date: "Placed 2025" },
    { id: 9, photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80", name: "Aditya Nair", company: "Tech Mahindra", role: "Network Specialist", pkg: "₹ 5.8 LPA", branch: "ECE", logoText: "TECHM", date: "Placed 2025" },
    { id: 10, photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80", name: "Meera Joshi", company: "Bosch Global", role: "IoT Firmware Trainee", pkg: "₹ 7.8 LPA", branch: "ECE", logoText: "BOSCH", date: "Placed 2025" },
    { id: 11, photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80", name: "Devansh Roy", company: "Tata Motors", role: "Quality Assurance", pkg: "₹ 6.4 LPA", branch: "Mechanical", logoText: "TATAMOTORS", date: "Placed 2025" },
    { id: 12, photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", name: "Ishita Bose", company: "Cognizant", role: "Programmer Analyst", pkg: "₹ 6.2 LPA", branch: "CSE", logoText: "CTS", date: "Placed 2025" }
  ]
};

export const CONTACT = {
  address: "Subharti Knowledge City, NH-58, Delhi-Haridwar Bypass Road, Meerut, Uttar Pradesh 250005",
  phone: "+91 (0121) 2439043 / +91 96390 10541",
  admissionsHelpline: "+91 96390 10542",
  email: "polytechnic@subharti.org",
  admissionsEmail: "admissions.polytechnic@subharti.org",
  hours: "Monday – Saturday: 9:00 AM – 5:00 PM",
  portalStatus: "CollegeOS Cloud Services Operational (99.98% Uptime)"
};

/* ==========================================================================
   PROGRAMS SHOWCASE (INLINE WITH REFERENCE IMAGE 'ANTIXOR UNIVERSITY')
   ========================================================================== */
export const PROGRAM_CATEGORIES = [
  { id: "all", label: "All Programs", icon: Layers },
  { id: "cse", label: "Computer Science & IT", icon: Cpu },
  { id: "mech", label: "Mechanical & Robotics", icon: Cog },
  { id: "elec", label: "Electrical & Smart Grid", icon: Zap },
  { id: "civil", label: "Civil & Infrastructure", icon: Building2 },
  { id: "ece", label: "Electronics & IoT", icon: Radio }
];

export const PROGRAM_LEVELS = [
  { id: "all", label: "All Streams" },
  { id: "diploma", label: "Diploma in Engineering (3 Years)" },
  { id: "lateral", label: "Direct 2nd Year Lateral Entry" },
  { id: "cert", label: "Industrial Skilling & Certifications" }
];

export const DEPTS = [
  {
    code: "CSE-01",
    short: "Computer Science",
    icon: Cpu,
    name: "Computer Science & Engineering",
    category: "cse",
    level: "diploma",
    tag: "AI, Full-Stack & Cloud Computing",
    duration: "3-Year Diploma",
    lateralDuration: "2-Year Lateral Entry",
    seats: "60 Seats",
    rating: 4.9,
    photo: IMG.labCs,
    labs: ["Cloud Systems & DevOps Lab", "Python, DSA & AI Arena", "Cybersecurity & Network Bay", "Full-Stack Web Studio"],
    coreSubjects: ["Data Structures & Algorithms", "Database Management (MongoDB/SQL)", "Operating Systems & Linux", "Object-Oriented Programming (Java/C++)", "Computer Networks & Security"],
    desc: "Comprehensive engineering curriculum covering modern software development, distributed algorithms, web platforms, cloud virtualization, and practical artificial intelligence.",
    prospects: ["Full-Stack Developer", "Cloud Support Engineer", "Junior DevOps Specialist", "Software QA Engineer"],
    avgSalary: "₹ 6.4 LPA",
    highestSalary: "₹ 7.8 LPA",
    recruiters: ["TCS", "Infosys", "Wipro", "Cognizant", "HCL Tech"]
  },
  {
    code: "ME-02",
    short: "Mechanical",
    icon: Cog,
    name: "Mechanical Engineering",
    category: "mech",
    level: "diploma",
    tag: "Robotics, Automation & CAD/CAM",
    duration: "3-Year Diploma",
    lateralDuration: "2-Year Lateral Entry",
    seats: "60 Seats",
    rating: 4.8,
    photo: IMG.labMech,
    labs: ["Industrial CNC Machining Center", "Robotics & Pneumatics Bay", "Thermal Engineering & IC Engines", "Automotive Testing Rig"],
    coreSubjects: ["Engineering Thermodynamics", "Fluid Mechanics & Hydraulics", "Manufacturing Processes", "Theory of Machines", "CAD/CAM & 3D Prototyping"],
    desc: "Rigorous mechanical engineering education emphasizing automated production lines, computer-aided design, industrial robotics, thermodynamics, and precision tooling.",
    prospects: ["CAD/CAM Designer", "Robotics Technician", "Production Supervisor", "Quality Assurance Engineer"],
    avgSalary: "₹ 6.2 LPA",
    highestSalary: "₹ 7.2 LPA",
    recruiters: ["Tata Motors", "Mahindra & Mahindra", "Cummins India", "Bharat Forge", "L&T"]
  },
  {
    code: "EE-03",
    short: "Electrical",
    icon: Zap,
    name: "Electrical Engineering",
    category: "elec",
    level: "diploma",
    tag: "Smart Grid, Solar & EV Systems",
    duration: "3-Year Diploma",
    lateralDuration: "2-Year Lateral Entry",
    seats: "60 Seats",
    rating: 4.8,
    photo: IMG.labElec,
    labs: ["High-Voltage Testing Bay", "Electrical Machines & Drives", "Renewable Solar Micro-Grid", "EV Powertrain Diagnostic Bay"],
    coreSubjects: ["Electrical Circuit Analysis", "Power Generation & Distribution", "Electrical Machines (AC/DC)", "Control Systems & PLC", "Electric Vehicle Architecture"],
    desc: "Modern electrical engineering training in power distribution, industrial motor controllers, smart renewable grids, and cutting-edge electric vehicle powertrain diagnostics.",
    prospects: ["Substation Engineer", "PLC Automation Programmer", "EV Powertrain Specialist", "Solar Systems Integrator"],
    avgSalary: "₹ 6.5 LPA",
    highestSalary: "₹ 7.5 LPA",
    recruiters: ["Schneider Electric", "Siemens", "ABB India", "Adani Power", "Havells"]
  },
  {
    code: "CE-04",
    short: "Civil",
    icon: Building2,
    name: "Civil Engineering",
    category: "civil",
    level: "diploma",
    tag: "Smart Structures, BIM & Surveying",
    duration: "3-Year Diploma",
    lateralDuration: "2-Year Lateral Entry",
    seats: "60 Seats",
    rating: 4.7,
    photo: IMG.labCivil,
    labs: ["Total Station & Geospatial Survey", "Geotechnical & Soil Testing", "Concrete Technology & Structures", "Highway & Transportation Lab"],
    coreSubjects: ["Structural Mechanics", "Building Construction & Planning", "Surveying & Geomatics", "Concrete Technology", "Environmental Engineering"],
    desc: "Infrastructure engineering education incorporating computer-aided structural design, modern surveying instrumentation, soil mechanics, and sustainable urban engineering.",
    prospects: ["Site Construction Engineer", "Structural CAD Drafter", "Geotechnical Surveyor", "Quality Control Inspector"],
    avgSalary: "₹ 6.1 LPA",
    highestSalary: "₹ 6.8 LPA",
    recruiters: ["Larsen & Toubro", "Tata Projects", "Shapoorji Pallonji", "Jindal Steel", "GMR Group"]
  },
  {
    code: "ECE-05",
    short: "Electronics (ECE)",
    icon: Radio,
    name: "Electronics & Communication",
    category: "ece",
    level: "diploma",
    tag: "Embedded IoT, VLSI & 5G Wireless",
    duration: "3-Year Diploma",
    lateralDuration: "2-Year Lateral Entry",
    seats: "60 Seats",
    rating: 4.8,
    photo: IMG.labEce,
    labs: ["VLSI Design & Simulation Center", "Embedded Microcontrollers & ARM", "IoT Sensor Mesh Networking", "RF & Wireless 5G Testbench"],
    coreSubjects: ["Electronic Devices & Circuits", "Digital Electronics & Logic", "Microprocessors & Microcontrollers", "Wireless Communication", "Internet of Things (IoT)"],
    desc: "Advanced electronics curriculum emphasizing embedded system programming, microchip layout, industrial IoT sensors, digital signal processing, and telecommunication networks.",
    prospects: ["IoT Firmware Developer", "Embedded Hardware Trainee", "Telecom Network Specialist", "PCB Design Engineer"],
    avgSalary: "₹ 6.3 LPA",
    highestSalary: "₹ 7.8 LPA",
    recruiters: ["Bosch", "Samsung", "Dixon Technologies", "Bharat Electronics", "Tech Mahindra"]
  }
];

/* ==========================================================================
   INSTITUTIONAL METRICS & IMPACT COUNTERS
   ========================================================================== */
export const IMPACT_METRICS = [
  { val: 15, suffix: "+", label: "Years of Excellence", sub: "Founded in 2008 with a tradition of engineering discipline", icon: ShieldCheck },
  { val: 5, suffix: "+", label: "Core Diploma Programs", sub: "Approved by AICTE and affiliated to SVSU Meerut", icon: BookOpen },
  { val: 1200, suffix: "+", label: "Enrolled Students", sub: "Aspiring engineers studying across 5 technical departments", icon: Users },
  { val: 96, suffix: "%", label: "Placement Success Rate", sub: "Consistent campus placements across Fortune 500 partners", icon: Trophy }
];

/* ==========================================================================
   CAMPUS INFRASTRUCTURE
   ========================================================================== */
export const FACILITIES = [
  {
    title: "Advanced Engineering Laboratories",
    key: "lab",
    icon: FlaskConical,
    spec: "50+ Industry Testbenches",
    tag: "High Precision",
    desc: "State-of-the-art testing bays equipped with digital oscilloscopes, CNC machining simulators, PLC testbenches, and automated instrumentation."
  },
  {
    title: "Central Digital Library",
    key: "library",
    icon: BookOpen,
    spec: "50,000+ Volumes & IEEE Access",
    tag: "Research Hub",
    desc: "Tranquil reading corridors with automated RFID checkout, computer research pods, international engineering journals, and multimedia archives."
  },
  {
    title: "Engineering Workshops",
    key: "workshop",
    icon: Wrench,
    spec: "Industrial Foundry & Machine Bay",
    tag: "Hands-on Mastery",
    desc: "Full-scale foundry, welding shop, carpentry bay, smithy, sheet metal section, and high-precision lathe machinery for real physical prototyping."
  },
  {
    title: "Smart Multimedia Classrooms",
    key: "classroom",
    icon: School,
    spec: "Interactive 4K Digital Panels",
    tag: "Digitally Enabled",
    desc: "Acoustically treated lecture halls equipped with ultra-bright HD projection, interactive smart screens, and high-speed Wi-Fi 6 coverage."
  },
  {
    title: "Sports & Athletics Complex",
    key: "sports",
    icon: Trophy,
    spec: "Indoor Stadium & Floodlit Turf",
    tag: "Holistic Life",
    desc: "Cricket stadium, Olympic-size track, basketball courts, badminton bays, table tennis halls, and modern student fitness gymnasium."
  },
  {
    title: "Student Innovation Incubator",
    key: "events",
    icon: Sparkles,
    spec: "24/7 Co-Working & Maker Space",
    tag: "Startup Hub",
    desc: "Dedicated incubator offering 3D printers, drone test bays, robotics equipment, and mentorship for student-led patent and hackathon entries."
  }
];

/* ==========================================================================
   UPCOMING EVENTS & NOTICES
   ========================================================================== */
export const UPCOMING_EVENTS = [
  {
    id: "ev-1",
    day: "22",
    month: "NOV",
    year: "2026",
    title: "Annual Mega Campus Career Fair 2026",
    category: "Placements",
    time: "09:30 AM – 04:30 PM",
    venue: "Subharti University Central Auditorium",
    desc: "Over 45+ premier manufacturing, IT, and infrastructure corporations conduct spot interviews and offer letters.",
    seatsLeft: 120,
    regOpen: true
  },
  {
    id: "ev-2",
    day: "28",
    month: "NOV",
    year: "2026",
    title: "TechnoVision 2026 — State Technical Symposium",
    category: "Hackathon",
    time: "10:00 AM – 06:00 PM",
    venue: "Engineering Innovation Block",
    desc: "Flagship code-jam, robo-wars, paper presentations, and hardware prototyping contest with ₹2,00,000 in prizes.",
    seatsLeft: 45,
    regOpen: true
  },
  {
    id: "ev-3",
    day: "05",
    month: "DEC",
    year: "2026",
    title: "International Alumni & Industry Leadership Summit",
    category: "Conference",
    time: "11:00 AM – 03:00 PM",
    venue: "Seminar Hall 2 & Live Virtual Stream",
    desc: "Distinguished alumni leaders from top MNCs share insights on emerging industry automation and career navigation.",
    seatsLeft: 60,
    regOpen: true
  }
];

export const NOTICES = [
  { id: 1, cat: "Exams", date: "12 Nov 2026", title: "Odd-Semester University Examination Schedule Published", text: "The comprehensive date sheet for 1st, 3rd, and 5th-semester theory and practical exams is now accessible for download.", priority: "Urgent" },
  { id: 2, cat: "Admissions", date: "20 Nov 2026", title: "Direct Second-Year Lateral Entry Registration Window", text: "Online registrations for lateral entry diploma admissions for the 2026-27 session will commence on the official portal.", priority: "Important" },
  { id: 3, cat: "Events", date: "02 Dec 2026", title: "Annual State Technical Symposium 'TechnoVision 2026'", text: "Registrations are open for project exhibitions, code jams, robo-wars, and technical paper presentations with ₹2L prizes.", priority: "Featured" },
  { id: 4, cat: "Academic", date: "05 Dec 2026", title: "Mid-Term Project Milestone & Synopsis Submission", text: "All final-year diploma candidates must upload their phase-1 prototype synopsis and mentor approvals by the specified date.", priority: "Academic" },
  { id: 5, cat: "Circulars", date: "15 Dec 2026", title: "Industrial Training & Summer Internship Viva-Voce Guidelines", text: "External jury schedules and evaluation rubrics for summer internship viva-voce have been released for all departments.", priority: "Regular" }
];

export const NOTICE_CATS = ["All", "Exams", "Admissions", "Events", "Academic", "Circulars"];

/* ==========================================================================
   VERIFIED TESTIMONIALS (STUDENTS & FACULTY)
   ========================================================================== */
export const REVIEWS = [
  {
    id: "rev-1",
    author: "Rishabh Singhania",
    role: "Computer Science Diploma Student",
    batch: "Class of 2025",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    verified: true,
    quote: "Subharti Polytechnic gave me the exact hands-on technical foundation and software discipline needed to start my career at TCS. The CollegeOS portal made tracking daily attendance, submissions, and exam schedules completely seamless."
  },
  {
    id: "rev-2",
    author: "Pooja Reddy",
    role: "Electrical Engineering Graduate",
    batch: "Placed at Schneider Electric",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    verified: true,
    quote: "The high-voltage testing bay and renewable solar grid workshops were crucial during my recruitment interviews. The faculty mentors guide each student individually, ensuring everyone masters the real testbenches."
  },
  {
    id: "rev-3",
    author: "Dr. Sunita Deshpande",
    role: "Head of Department, Mechanical",
    batch: "Senior Faculty Mentor",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    verified: true,
    quote: "Our curriculum emphasizes physical engineering skills: CNC programming, robotic automation, and CAD modeling. CollegeOS has modernized our academic governance, giving parents and students transparent visibility into daily growth."
  },
  {
    id: "rev-4",
    author: "Vikram Malhotra",
    role: "Civil Engineering Alumnus",
    batch: "Site Engineer at L&T",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    verified: true,
    quote: "Working with Total Station equipment and modern soil mechanics labs prepared me for real construction mega-projects right out of college. Subharti's campus environment builds technical confidence from day one."
  }
];

/* ==========================================================================
   ADMISSION STEPS (FOUR SIMPLE PHASES)
   ========================================================================== */
export const STEPS = [
  {
    num: "01",
    icon: ClipboardList,
    title: "Digital Application & Branch Priority",
    text: "Complete your online admission form with 10th or 12th marks and submit your preferred engineering branches in order of priority.",
    tip: "Keep scanned copies of your 10th mark sheet, ID proof, and passport photo ready for quick upload."
  },
  {
    num: "02",
    icon: FileText,
    title: "Document Verification & Merit Ranking",
    text: "Our admissions committee verifies submitted academic certificates within 48 hours and publishes state counseling ranks.",
    tip: "You can monitor your application verification status live on the CollegeOS portal."
  },
  {
    num: "03",
    icon: UserCheck,
    title: "Counseling & Branch Seat Allotment",
    text: "Participate in personalized counseling with senior faculty mentors to confirm your branch allotment based on merit standing.",
    tip: "Receive instant SMS and email confirmation the moment your department seat is secured."
  },
  {
    num: "04",
    icon: GraduationCap,
    title: "Enrollment & Campus Welcome Orientation",
    text: "Submit your semester fee securely online, generate your official digital student ID card, and attend our welcome orientation.",
    tip: "Laboratory safety kit, academic syllabus booklet, and CollegeOS portal credentials are provided on day one."
  }
];

/* ==========================================================================
   FREQUENTLY ASKED QUESTIONS
   ========================================================================== */
export const FAQS = [
  {
    q: "Is Subharti Polytechnic approved by AICTE and affiliated to SVSU?",
    a: "Yes. Subharti Polytechnic is an officially recognized constituent polytechnic institute of Swami Vivekanand Subharti University, Meerut, established under UGC guidelines and approved by the All India Council for Technical Education (AICTE), New Delhi."
  },
  {
    q: "What is the eligibility criteria for the 3-Year Diploma in Engineering?",
    a: "Candidates must have passed 10th Standard (High School) examination from a recognized central or state education board (CBSE, ICSE, UP Board, etc.) with Mathematics and Science as compulsory subjects, securing a minimum of 35% aggregate marks."
  },
  {
    q: "Who is eligible for Direct Second-Year Lateral Entry?",
    a: "Candidates who have completed 12th Standard with Physics, Chemistry, and Mathematics (PCM), or candidates holding a 2-Year ITI Certificate in a relevant technical trade from NCVT/SCVT, are eligible for direct admission into the 2nd Year (3rd Semester)."
  },
  {
    q: "How does the CollegeOS digital campus platform support students?",
    a: "CollegeOS provides a unified mobile and desktop experience where students view real-time biometric attendance percentages, download semester hall tickets, inspect examination grades, submit digital assignments, and receive official notices instantly."
  },
  {
    q: "What training and placement facilities are provided to diploma candidates?",
    a: "Our centralized Training & Placement (T&P) Cell conducts aptitude training, resume workshops, mock technical interviews, and industrial internship drives. Leading firms such as TCS, L&T, Infosys, Schneider Electric, and Tata Motors visit annually."
  },
  {
    q: "Are hostel accommodations and transportation available on campus?",
    a: "Yes. Subharti Knowledge City features secure residential hostels with 24/7 power backup, Wi-Fi connectivity, mess facilities, and medical hospital care. University bus fleets connect Meerut, Delhi, Ghaziabad, Modinagar, and surrounding NCR locations."
  }
];

/* ==========================================================================
   HELPER UTILITIES & HOOKS
   ========================================================================== */
const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function useCountUp(end, run, dur = 1800) {
  const isReduced = reduced();
  const [v, setV] = useState(end);
  useEffect(() => {
    if (!run || isReduced) return;
    let raf, t0;
    const step = (t) => {
      t0 = t0 ?? t;
      const p = Math.min((t - t0) / dur, 1);
      setV(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, run, dur, isReduced]);
  return isReduced ? end : v;
}

function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? Math.min(window.scrollY / h, 1) : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return p;
}

function useFill(ref) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const progress = (window.innerHeight * 0.65 - r.top) / r.height;
      setP(Math.max(0, Math.min(1, progress)));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [ref]);
  return p;
}

function useInView(threshold = 0.25) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || !("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { threshold });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen];
}

const Img = ({ src, alt = "", className = "" }) => {
  const [imgSrc, setImgSrc] = useState(src || "/campus-banner.jpg");
  return (
    <img
      className={className}
      src={imgSrc}
      alt={alt}
      loading="eager"
      onError={() => {
        if (imgSrc !== "/campus-banner.jpg") setImgSrc("/campus-banner.jpg");
      }}
    />
  );
};

const SectionHeading = ({ badge, title, subtitle, center = false }) => (
  <div className={`sec-header-modern ${center ? "center" : ""}`}>
    <div className="badge-modern-pill">
      <Sparkles size={13} className="badge-sparkle-icon" />
      <span>{badge}</span>
    </div>
    <h2 className="modern-section-title">{title}</h2>
    {subtitle && <p className="modern-section-subtitle">{subtitle}</p>}
  </div>
);

/* ==========================================================================
   MASTER HOMEPAGE COMPONENT
   ========================================================================== */

/* ==========================================================================
   CAMPUS 360° HOTSPOTS & VIRTUAL TOUR MASTER DATA
   ========================================================================== */
export const CAMPUS_HOTSPOTS = [
  {
    id: "polytechnic-main",
    name: "Subharti Polytechnic College Main Academic Building",
    category: "Academic",
    badge: "Main Engineering Block",
    x: 28,
    y: 34,
    image: "/subharti-polytechnic-main-building.jpg",
    description: "5-story state-of-the-art academic block housing multimedia lecture halls, administrative offices, seminar auditorium, and engineering workshops.",
    specs: ["24 Smart Classrooms", "Wi-Fi 6 Campus Mesh", "Central Faculty Suites", "1200 Seat Auditorium"],
    inCharge: "Office of the Principal",
    hours: "08:30 AM - 05:30 PM (Mon-Sat)"
  },
  {
    id: "cnc-machine-bay",
    name: "Central CNC Machining & Automation Bay",
    category: "Workshop",
    badge: "Industry 4.0 Lab",
    x: 45,
    y: 52,
    image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80",
    description: "Heavy industrial training center equipped with 4-axis CNC milling centers, CNC lathe trainers, plasma cutting, and robotic welding cells.",
    specs: ["Haas CNC Vertical Mill", "Siemens Sinumerik Trainers", "MIG/TIG Welding Bay", "Precision Metrology Lab"],
    inCharge: "Er. Amitav Ganguly (Workshop Supt.)",
    hours: "09:00 AM - 05:00 PM (Mon-Sat)"
  },
  {
    id: "cloud-computing-hub",
    name: "TCS-iON Cloud Computing & AI Hub",
    category: "Academic",
    badge: "High Performance Lab",
    x: 62,
    y: 28,
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    description: "Enterprise software development sandbox with 120 Intel Xeon workstations, dedicated 1 Gbps leased line, AWS Local Zone edge rack, and GPU compute clusters.",
    specs: ["120 Dell Xeon Workstations", "NVIDIA RTX 4080 GPU Pods", "1 Gbps Leased Fiber Line", "Cisco Networking Rack"],
    inCharge: "Dr. Neha Saxena (HOD Computer Science)",
    hours: "08:00 AM - 08:00 PM (All Days)"
  },
  {
    id: "electrical-smart-grid",
    name: "Schneider Electric Smart Grid & Drives Lab",
    category: "Lab",
    badge: "Green Energy Center",
    x: 74,
    y: 44,
    image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80",
    description: "Specialized electrical engineering laboratory built in collaboration with Schneider Electric featuring SCADA PLC automation, AC/DC drives, and rooftop 100 kW solar telemetry.",
    specs: ["Schneider PLC & SCADA Racks", "100 kW Solar Array Telemetry", "High Voltage Testing Cage", "Motor Generator Test Beds"],
    inCharge: "Prof. S.K. Verma (Chief Electrical Mentor)",
    hours: "09:00 AM - 05:00 PM (Mon-Sat)"
  },
  {
    id: "civil-testing-center",
    name: "Civil Geotechnical & Structural Testing Lab",
    category: "Lab",
    badge: "NABL Calibrated",
    x: 35,
    y: 68,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
    description: "Fully certified testing facility for concrete cube compression, soil shear mechanics, digital total station theodolites, and environmental water testing.",
    specs: ["2000 kN Digital UTM Machine", "Leica Total Station Kits", "Direct Shear Soil Apparatus", "Aggregate Abrasion Testing"],
    inCharge: "Dr. Rajesh Chauhan (Structural Consultant)",
    hours: "09:00 AM - 04:30 PM (Mon-Sat)"
  },
  {
    id: "iot-embedded-sandbox",
    name: "IoT & Embedded Systems Prototyping Bay",
    category: "Lab",
    badge: "Hardware Incubator",
    x: 82,
    y: 65,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    description: "Modern electronics workstation featuring mixed-signal oscilloscopes, SMD rework stations, Raspberry Pi 5 clusters, LoRa gateways, and 3D prototyping printers.",
    specs: ["Keysight 4-Ch Digital Scopes", "Creality 3D Rapid Printers", "SMD Hot-Air Rework Stations", "LoRaWAN Gateway Tower"],
    inCharge: "Er. Meenakshi Sundaram (IoT Lead)",
    hours: "08:30 AM - 06:00 PM (Mon-Sat)"
  },
  {
    id: "central-library-complex",
    name: "Swami Vivekanand Central Library",
    category: "Amenities",
    badge: "50,000+ Volumes",
    x: 52,
    y: 78,
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
    description: "3-tier air-conditioned knowledge hub housing 52,000 engineering volumes, IEEE & ScienceDirect digital subscriptions, RFID automated checkout, and 24/7 quiet study bays.",
    specs: ["52,000+ Print Volumes", "DELNET & IEEE Access", "RFID Self-Issue Kiosk", "600-Capacity Reading Hall"],
    inCharge: "Dr. S.P. Singhal (Chief Librarian)",
    hours: "08:00 AM - 10:00 PM (Daily)"
  },
  {
    id: "sports-hostel-enclave",
    name: "Olympic Sports Complex & Residential Enclave",
    category: "Amenities",
    badge: "Campus Life",
    x: 18,
    y: 72,
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    description: "Expansive athletics facility with international-size football pitch, indoor badminton arena, Olympic gymnasium, multi-cuisine food courts, and AC student hostels.",
    specs: ["Synthetic Badminton Courts", "Standard Cricket Oval", "Gymnasium & Health Club", "Separate AC Boys & Girls Hostels"],
    inCharge: "Coach Vikram Rathore (Sports Director)",
    hours: "06:00 AM - 09:30 PM (Daily)"
  }
];

/* ==========================================================================
   FEE CALCULATOR MASTER RATES & SCHOLARSHIPS
   ========================================================================== */
export const FEE_STRUCTURE = {
  regular: {
    cse: { tuition: 32000, lab: 6500, exam: 3500, dev: 4000, seats: 60, title: "Computer Science & Engineering" },
    me: { tuition: 29000, lab: 7000, exam: 3500, dev: 4000, seats: 60, title: "Mechanical Engineering" },
    ee: { tuition: 28000, lab: 6500, exam: 3500, dev: 4000, seats: 60, title: "Electrical Engineering" },
    ce: { tuition: 27000, lab: 6000, exam: 3500, dev: 4000, seats: 60, title: "Civil Engineering" },
    ece: { tuition: 29000, lab: 6500, exam: 3500, dev: 4000, seats: 30, title: "Electronics & Communication" }
  },
  lateral: {
    cse: { tuition: 34000, lab: 7000, exam: 3500, dev: 4000, seats: 12, title: "Computer Science & Engineering (Lateral)" },
    me: { tuition: 30000, lab: 7500, exam: 3500, dev: 4000, seats: 12, title: "Mechanical Engineering (Lateral)" },
    ee: { tuition: 29000, lab: 7000, exam: 3500, dev: 4000, seats: 12, title: "Electrical Engineering (Lateral)" },
    ce: { tuition: 28000, lab: 6500, exam: 3500, dev: 4000, seats: 12, title: "Civil Engineering (Lateral)" },
    ece: { tuition: 30000, lab: 7000, exam: 3500, dev: 4000, seats: 6, title: "Electronics & Communication (Lateral)" }
  },
  fixedAnnual: {
    cautionDeposit: 5000,
    uniformAndKit: 4500,
    lmsAndErp: 2500
  },
  hostelRates: {
    none: { title: "Day Scholar (No Hostel)", fee: 0 },
    nonAc: { title: "Standard 3-Bed Room + Veg Mess", fee: 42000 },
    acDouble: { title: "Deluxe Twin-Sharing AC + Mess", fee: 65000 }
  }
};

/* ==========================================================================
   COMPREHENSIVE 6-SEMESTER CURRICULUM ROADMAP
   ========================================================================== */
export const CURRICULUM_DATA = {
  cse: {
    name: "Computer Science & Engineering",
    code: "CSE-DIP",
    semesters: [
      {
        sem: 1,
        title: "Foundation of Computing & Applied Sciences",
        credits: 22,
        theoryHours: 16,
        labHours: 12,
        certBadge: "Python Core Certification",
        subjects: [
          { code: "CS-101", title: "Applied Mathematics-I", credits: 4, type: "Theory", topics: "Matrices, Differential Calculus, Algebra" },
          { code: "CS-102", title: "Applied Physics-I", credits: 4, type: "Theory + Lab", topics: "Optics, Wave Mechanics, Laser Principles" },
          { code: "CS-103", title: "Communication Skills in English", credits: 3, type: "Theory + Lab", topics: "Technical Drafting, Phonetics, Oral Delivery" },
          { code: "CS-104", title: "Problem Solving through C Programming", credits: 5, type: "Theory + Lab", topics: "Pointers, Structs, Dynamic Memory, Algorithmic Logic" },
          { code: "CS-105", title: "Computer Engineering Workshop & Tools", credits: 4, type: "Lab Only", topics: "Hardware Assembly, BIOS, OS Installation, CLI Linux" },
          { code: "CS-106", title: "Engineering Graphics (CAD-I)", credits: 2, type: "Lab", topics: "Orthographic Projections, Isometric Drafting" }
        ]
      },
      {
        sem: 2,
        title: "Data Structures & Modern Web Architecture",
        credits: 24,
        theoryHours: 15,
        labHours: 15,
        certBadge: "HTML5/CSS3/JavaScript Associate",
        subjects: [
          { code: "CS-201", title: "Applied Mathematics-II", credits: 4, type: "Theory", topics: "Integral Calculus, Differential Equations, Probability" },
          { code: "CS-202", title: "Data Structures using C/C++", credits: 5, type: "Theory + Lab", topics: "Stacks, Queues, Binary Trees, AVL Trees, Graphs, Sorting" },
          { code: "CS-203", title: "Digital Electronics & Logic Design", credits: 4, type: "Theory + Lab", topics: "Logic Gates, K-Maps, Flip-Flops, Multiplexers, Counters" },
          { code: "CS-204", title: "Frontend Web Development (HTML/CSS/JS)", credits: 5, type: "Theory + Lab", topics: "DOM API, Modern CSS Flex/Grid, ES6+, Responsive Design" },
          { code: "CS-205", title: "Environmental Studies & Disaster Mgmt", credits: 3, type: "Theory", topics: "Ecology, E-Waste Management, Green Computing" },
          { code: "CS-206", title: "General Proficiency & Soft Skills", credits: 3, type: "Practical", topics: "Group Discussions, Mock Interviews, Aptitude" }
        ]
      },
      {
        sem: 3,
        title: "Object-Oriented Architecture & Database Systems",
        credits: 25,
        theoryHours: 16,
        labHours: 14,
        certBadge: "Oracle Database SQL Specialist",
        subjects: [
          { code: "CS-301", title: "Object Oriented Programming via Java", credits: 5, type: "Theory + Lab", topics: "OOP Paradigms, Multithreading, Generics, JDBC, Streams" },
          { code: "CS-302", title: "Relational Database Management Systems", credits: 5, type: "Theory + Lab", topics: "ER Modeling, Normalization (3NF/BCNF), SQL, Indexing" },
          { code: "CS-303", title: "Computer Organization & Architecture", credits: 4, type: "Theory", topics: "RISC/CISC, Pipelining, Cache Memory, Instruction Sets" },
          { code: "CS-304", title: "Data Communication & Computer Networks", credits: 5, type: "Theory + Lab", topics: "OSI & TCP/IP Stack, Subnetting, Routing Protocols, Wireshark" },
          { code: "CS-305", title: "Python for Data Processing & Scripting", credits: 4, type: "Theory + Lab", topics: "NumPy, Pandas, Matplotlib, Automation Scripts, Scraping" },
          { code: "CS-306", title: "Summer Industrial Training Review", credits: 2, type: "Seminar", topics: "Field Experience Presentation & Viva" }
        ]
      },
      {
        sem: 4,
        title: "Operating Systems, Linux Kernel & Full-Stack",
        credits: 24,
        theoryHours: 14,
        labHours: 16,
        certBadge: "Red Hat Certified System Administrator",
        subjects: [
          { code: "CS-401", title: "Operating System Principles & Linux Kernel", credits: 5, type: "Theory + Lab", topics: "Process Scheduling, Semaphores, Memory Paging, Bash Scripting" },
          { code: "CS-402", title: "Full-Stack Development (React & Node.js)", credits: 5, type: "Theory + Lab", topics: "REST APIs, Express, MongoDB, State Management, JWT Auth" },
          { code: "CS-403", title: "Software Engineering & Agile Scrum", credits: 4, type: "Theory", topics: "SDLC, Jira Workflows, UML Class Diagrams, Unit Testing" },
          { code: "CS-404", title: "Information & Network Security", credits: 4, type: "Theory + Lab", topics: "Cryptography, SSL/TLS, Firewalls, Vulnerability Scanning" },
          { code: "CS-405", title: "Microprocessors & Microcontrollers (8051/ARM)", credits: 4, type: "Theory + Lab", topics: "Assembly Code, Interfacing Sensors, Timers, Interrupts" },
          { code: "CS-406", title: "Minor Capstone Project-I", credits: 2, type: "Project", topics: "Software Prototype Formulation & Code Review" }
        ]
      },
      {
        sem: 5,
        title: "Cloud Infrastructure, DevOps & Mobile Apps",
        credits: 24,
        theoryHours: 15,
        labHours: 15,
        certBadge: "AWS Certified Cloud Practitioner",
        subjects: [
          { code: "CS-501", title: "Cloud Computing & AWS Architecture", credits: 5, type: "Theory + Lab", topics: "EC2, S3, Lambda, VPC, CloudFormation, Scalability" },
          { code: "CS-502", title: "DevOps Engineering & CI/CD Pipelines", credits: 4, type: "Theory + Lab", topics: "Git, Docker Containers, Kubernetes, Jenkins, GitHub Actions" },
          { code: "CS-503", title: "Android App Development with Kotlin", credits: 5, type: "Theory + Lab", topics: "Activities, Fragments, Room Database, Jetpack Compose, APIs" },
          { code: "CS-504", title: "Artificial Intelligence & Machine Learning", credits: 4, type: "Theory + Lab", topics: "Supervised Learning, Scikit-Learn, Neural Nets, Computer Vision" },
          { code: "CS-505", title: "Industrial Management & Entrepreneurship", credits: 3, type: "Theory", topics: "Balance Sheets, Costing, Intellectual Property (IPR), Startups" },
          { code: "CS-506", title: "Major Capstone Project Synopsis", credits: 3, type: "Project", topics: "Problem Statement, IEEE Paper Survey & Architecture Design" }
        ]
      },
      {
        sem: 6,
        title: "Industrial Internship & Major Project Deployment",
        credits: 22,
        theoryHours: 6,
        labHours: 24,
        certBadge: "Professional Engineering Diploma",
        subjects: [
          { code: "CS-601", title: "Industry Co-Op Internship / Apprenticeship", credits: 10, type: "Industry Immersion", topics: "Full-Time 16-Week On-Site Placement at Recruiter Enterprise" },
          { code: "CS-602", title: "Major Capstone Engineering Project & Defense", credits: 8, type: "Major Project", topics: "Production Deployment, Testing, Patent Filing, External Viva" },
          { code: "CS-603", title: "Emerging Tech Elective (Blockchain / IoT)", credits: 4, type: "Theory + Lab", topics: "Smart Contracts, Web3 / LoRa Sensor Mesh Networks" }
        ]
      }
    ]
  },
  me: {
    name: "Mechanical Engineering (Automobile & Production)",
    code: "ME-DIP",
    semesters: [
      {
        sem: 1,
        title: "Applied Sciences & Workshop Engineering",
        credits: 22,
        theoryHours: 16,
        labHours: 12,
        certBadge: "AutoCAD 2D Drafting Certified",
        subjects: [
          { code: "ME-101", title: "Applied Mathematics-I", credits: 4, type: "Theory", topics: "Trigonometry, Vector Algebra, Coordinate Geometry" },
          { code: "ME-102", title: "Applied Physics & Mechanics", credits: 4, type: "Theory + Lab", topics: "Force Systems, Friction, Centroids, Newton's Laws" },
          { code: "ME-103", title: "Engineering Chemistry & Metallurgy", credits: 4, type: "Theory + Lab", topics: "Ferrous/Non-Ferrous Alloys, Phase Diagrams, Corrosion" },
          { code: "ME-104", title: "Engineering Graphics & Descriptive Geometry", credits: 4, type: "Lab", topics: "Projections of Solids, Sectional Views, Isometric" },
          { code: "ME-105", title: "Foundational Workshop Practice", credits: 4, type: "Lab", topics: "Carpentry, Fitting, Sheet Metal, Blacksmithing" },
          { code: "ME-106", title: "Communication Skills & Professional Ethics", credits: 2, type: "Theory", topics: "Technical Reporting, Team Dynamics" }
        ]
      },
      {
        sem: 2,
        title: "Material Science & Manufacturing Technology-I",
        credits: 24,
        theoryHours: 15,
        labHours: 15,
        certBadge: "SolidWorks Mechanical Design Associate",
        subjects: [
          { code: "ME-201", title: "Applied Mathematics-II", credits: 4, type: "Theory", topics: "Calculus of Variations, Numerical Methods" },
          { code: "ME-202", title: "Material Science & Heat Treatment", credits: 4, type: "Theory + Lab", topics: "Iron-Carbon Diagram, Annealing, Quenching, Hardness Testing" },
          { code: "ME-203", title: "Manufacturing Processes-I (Machining)", credits: 5, type: "Theory + Lab", topics: "Lathe Operations, Shaper, Planer, Milling Cutters, Grinding" },
          { code: "ME-204", title: "Strength of Materials (Solid Mechanics)", credits: 5, type: "Theory + Lab", topics: "Stress-Strain, Bending Moments, Torsion of Shafts, Columns" },
          { code: "ME-205", title: "Electrical & Electronics Technology", credits: 4, type: "Theory + Lab", topics: "Transformers, DC Motors, AC Alternators, Sensors" },
          { code: "ME-206", title: "Computer Aided Drafting (AutoCAD 3D)", credits: 2, type: "Lab", topics: "3D Solid Modeling, Boolean Operations, Dimensioning" }
        ]
      },
      {
        sem: 3,
        title: "Thermodynamics & Fluid Dynamics",
        credits: 24,
        theoryHours: 16,
        labHours: 14,
        certBadge: "Ansys FEA Simulation Fundamentals",
        subjects: [
          { code: "ME-301", title: "Thermal Engineering & Thermodynamics", credits: 5, type: "Theory + Lab", topics: "First & Second Laws, Carnot Cycle, Steam Boilers, Entropy" },
          { code: "ME-302", title: "Fluid Mechanics & Hydraulic Machinery", credits: 5, type: "Theory + Lab", topics: "Bernoulli Theorem, Pelton Wheel, Francis Turbine, Pumps" },
          { code: "ME-303", title: "Manufacturing Technology-II (Welding & Casting)", credits: 4, type: "Theory + Lab", topics: "Sand Casting, Die Casting, TIG/MIG Arc Welding, Defects" },
          { code: "ME-304", title: "Machine Drawing & GD&T Standards", credits: 4, type: "Lab", topics: "Assembly Drawings, Tolerancing, Piston & Valve Assemblies" },
          { code: "ME-305", title: "Metrology & Mechanical Instrumentation", credits: 4, type: "Theory + Lab", topics: "Verniers, Micrometers, CMM Coordinate Machines, Roughness" },
          { code: "ME-306", title: "Industrial Safety & Factory Regulations", credits: 2, type: "Theory", topics: "OSHA Safety, Fire Prevention, Hazmat Protocols" }
        ]
      },
      {
        sem: 4,
        title: "Automobile Systems & Theory of Machines",
        credits: 24,
        theoryHours: 15,
        labHours: 15,
        certBadge: "Bosch Automotive Diagnostics Specialist",
        subjects: [
          { code: "ME-401", title: "Internal Combustion Engines & Hybrid Drives", credits: 5, type: "Theory + Lab", topics: "4-Stroke/2-Stroke Otto & Diesel, MPFI, Turbochargers, CRDI" },
          { code: "ME-402", title: "Theory of Machines & Mechanisms", credits: 5, type: "Theory + Lab", topics: "Kinematic Links, Cams, Gear Trains, Flywheels, Governors" },
          { code: "ME-403", title: "Automobile Chassis, Transmission & Suspension", credits: 4, type: "Theory + Lab", topics: "Clutch, Synchromesh Gearbox, Differential, ABS Braking" },
          { code: "ME-404", title: "Refrigeration & Air Conditioning (HVAC)", credits: 4, type: "Theory + Lab", topics: "Vapor Compression Cycle, Psychrometry, Refrigerants" },
          { code: "ME-405", title: "Hydraulics & Pneumatics Automation", credits: 4, type: "Theory + Lab", topics: "Pneumatic Valves, Cylinders, Directional Controls, FRL Units" },
          { code: "ME-406", title: "Minor Fabrication Project", credits: 2, type: "Project", topics: "Fabrication of Functional Mechanical Prototype" }
        ]
      },
      {
        sem: 5,
        title: "CNC Machining, Industrial Robotics & CAD/CAM",
        credits: 24,
        theoryHours: 14,
        labHours: 16,
        certBadge: "Siemens Sinumerik CNC Programmer",
        subjects: [
          { code: "ME-501", title: "CNC Machines & Automated G-Code Programming", credits: 5, type: "Theory + Lab", topics: "G-Codes, M-Codes, Canned Cycles, Tool Offsets, CAD/CAM Export" },
          { code: "ME-502", title: "Electric Vehicle (EV) Powertrains & Battery Systems", credits: 5, type: "Theory + Lab", topics: "BLDC Motors, Lithium-Ion Battery Packs, BMS, Regenerative Braking" },
          { code: "ME-503", title: "Design of Machine Elements", credits: 4, type: "Theory", topics: "Shafts, Keys, Couplings, Riveted Joints, Coil Springs" },
          { code: "ME-504", title: "Industrial Engineering & Total Quality Mgmt (TQM)", credits: 4, type: "Theory", topics: "Six Sigma, 5S, Kaizen, Lean Manufacturing, Time & Motion Study" },
          { code: "ME-505", title: "Finite Element Analysis (FEA via SolidWorks)", credits: 3, type: "Lab", topics: "Stress Analysis, Thermal Distribution, Meshing Optimization" },
          { code: "ME-506", title: "Major Project Formulation & Design", credits: 3, type: "Project", topics: "Vehicle / Mechanism CAD Formulation" }
        ]
      },
      {
        sem: 6,
        title: "Industrial Co-Op & Automobile Plant Apprenticeship",
        credits: 22,
        theoryHours: 6,
        labHours: 24,
        certBadge: "Automotive Manufacturing Engineer Diploma",
        subjects: [
          { code: "ME-601", title: "Full-Term Industrial Apprenticeship", credits: 10, type: "Industry Immersion", topics: "16-Week On-Site Placement at Maruti / Hero / Tata Motors" },
          { code: "ME-602", title: "Major Fabrication Project & Working Demonstration", credits: 8, type: "Major Project", topics: "Go-Kart / Robotic Mechanism Fabrication & External Review" },
          { code: "ME-603", title: "Renewable Energy Technologies (Solar & Wind)", credits: 4, type: "Theory + Lab", topics: "Photovoltaic Inverters, Wind Turbine Aerodynamics" }
        ]
      }
    ]
  },
  ee: {
    name: "Electrical Engineering (Smart Grid & EV)",
    code: "EE-DIP",
    semesters: [
      {
        sem: 1,
        title: "Basic Electrical Sciences & Circuit Theory",
        credits: 22,
        theoryHours: 16,
        labHours: 12,
        certBadge: "MATLAB Circuit Simulation Associate",
        subjects: [
          { code: "EE-101", title: "Applied Mathematics-I", credits: 4, type: "Theory", topics: "Matrices, Differential Calculus, Complex Numbers" },
          { code: "EE-102", title: "Applied Physics & Magnetism", credits: 4, type: "Theory + Lab", topics: "Electromagnetic Induction, Magnetic Circuits" },
          { code: "EE-103", title: "Basic Electrical Engineering", credits: 5, type: "Theory + Lab", topics: "Ohm's Law, KCL/KVL, AC/DC Fundamentals" },
          { code: "EE-104", title: "Engineering Graphics (AutoCAD Electrical)", credits: 3, type: "Lab", topics: "Electrical Schematics, Single Line Diagrams" },
          { code: "EE-105", title: "Electrical Wiring Workshop Practice", credits: 4, type: "Lab", topics: "Domestic Wiring, Earthing, Conduit Systems" },
          { code: "EE-106", title: "Professional Communication", credits: 2, type: "Theory", topics: "Technical Documentation, Presentation" }
        ]
      },
      {
        sem: 2,
        title: "Electrical Machines & Analog Electronics",
        credits: 24,
        theoryHours: 15,
        labHours: 15,
        certBadge: "LabVIEW Instrumentation Associate",
        subjects: [
          { code: "EE-201", title: "Applied Mathematics-II", credits: 4, type: "Theory", topics: "Fourier Series, Laplace Transforms" },
          { code: "EE-202", title: "DC Machines & Transformers", credits: 5, type: "Theory + Lab", topics: "DC Generators/Motors, Single/Three-Phase Transformers" },
          { code: "EE-203", title: "Analog & Power Electronics", credits: 5, type: "Theory + Lab", topics: "Diodes, BJTs, MOSFETs, SCRs, Rectifiers" },
          { code: "EE-204", title: "Electrical Measurements & Instrumentation", credits: 4, type: "Theory + Lab", topics: "Bridges, Oscilloscopes, CT/PT Sensors" },
          { code: "EE-205", title: "Environmental Studies & Renewable Energy", credits: 3, type: "Theory", topics: "Solar PV, Wind Systems, Energy Conservation" },
          { code: "EE-206", title: "Electronic Workshop Practice", credits: 3, type: "Lab", topics: "Soldering, PCB Layout, Multimeter Calibration" }
        ]
      },
      {
        sem: 3,
        title: "AC Machines, Transmission & Smart Sensors",
        credits: 24,
        theoryHours: 16,
        labHours: 14,
        certBadge: "Industrial Sensor & IoT Certified",
        subjects: [
          { code: "EE-301", title: "AC Induction & Synchronous Machines", credits: 5, type: "Theory + Lab", topics: "3-Phase Induction Motors, Alternators, Synchronous Motors" },
          { code: "EE-302", title: "Transmission & Distribution Systems", credits: 5, type: "Theory", topics: "Overhead Lines, Insulators, Corona, Substations" },
          { code: "EE-303", title: "Digital Electronics & Logic Design", credits: 4, type: "Theory + Lab", topics: "Logic Gates, Multiplexers, Counters, Registers" },
          { code: "EE-304", title: "Power System Analysis & Faults", credits: 4, type: "Theory", topics: "Symmetrical Faults, Symmetrical Components" },
          { code: "EE-305", title: "Electrical CAD & Simulation Lab", credits: 4, type: "Lab", topics: "PSIM, MATLAB Simulink, Circuit Testing" },
          { code: "EE-306", title: "Industrial Plant Internship Viva", credits: 2, type: "Seminar", topics: "Substation Site Report & Evaluation" }
        ]
      },
      {
        sem: 4,
        title: "Switchgear Protection & Industrial PLC/SCADA",
        credits: 24,
        theoryHours: 15,
        labHours: 15,
        certBadge: "Schneider PLC Automation Specialist",
        subjects: [
          { code: "EE-401", title: "Switchgear & Power Protection", credits: 5, type: "Theory + Lab", topics: "Circuit Breakers, Relays, Arc Extinction, Earthing" },
          { code: "EE-402", title: "Industrial Automation & PLC-SCADA", credits: 5, type: "Theory + Lab", topics: "Ladder Logic, Siemens/Schneider PLCs, HMI Panels" },
          { code: "EE-403", title: "Microcontrollers & Embedded Interfacing", credits: 4, type: "Theory + Lab", topics: "8051, Arduino, ADC/DAC, Motor Speed Control" },
          { code: "EE-404", title: "Utilization of Electrical Energy & Traction", credits: 4, type: "Theory", topics: "Electric Heating, Welding, Metro Railway Traction" },
          { code: "EE-405", title: "Power Electronics Drives", credits: 4, type: "Theory + Lab", topics: "VFD Drives, Inverters, Choppers, Cycloconverters" },
          { code: "EE-406", title: "Minor Design Project", credits: 2, type: "Project", topics: "Automatic Substation or Motor Controller" }
        ]
      },
      {
        sem: 5,
        title: "Smart Grids, EV Powertrains & Solar Telemetry",
        credits: 24,
        theoryHours: 14,
        labHours: 16,
        certBadge: "Certified Smart Grid & EV Specialist",
        subjects: [
          { code: "EE-501", title: "Electric Vehicle (EV) Systems & BMS", credits: 5, type: "Theory + Lab", topics: "Lithium Battery Chemistry, BMS Telemetry, BLDC Motors" },
          { code: "EE-502", title: "Smart Grid Technologies & IoT Metering", credits: 5, type: "Theory + Lab", topics: "AMI Smart Meters, SCADA Telemetry, Microgrids" },
          { code: "EE-503", title: "Solar Photovoltaic & Wind Energy Systems", credits: 4, type: "Theory + Lab", topics: "Grid-Tied Inverters, MPPT Trackers, Net Metering" },
          { code: "EE-504", title: "Energy Audit, Management & Conservation", credits: 4, type: "Theory", topics: "BEE Norms, Power Factor Correction, Tariff Structures" },
          { code: "EE-505", title: "Power Quality & Harmonics Lab", credits: 3, type: "Lab", topics: "Active Filters, THD Measurement, Surge Suppressors" },
          { code: "EE-506", title: "Major Project Synopsis & Formulation", credits: 3, type: "Project", topics: "Renewable / EV Engineering Blueprint" }
        ]
      },
      {
        sem: 6,
        title: "Substation Apprenticeship & Major Project Defense",
        credits: 22,
        theoryHours: 6,
        labHours: 24,
        certBadge: "Professional Electrical Engineer Diploma",
        subjects: [
          { code: "EE-601", title: "Substation & Industrial Apprenticeship", credits: 10, type: "Industry Immersion", topics: "16-Week On-Site Placement at BHEL / Schneider / Adani Power" },
          { code: "EE-602", title: "Major Capstone Engineering Project Defense", credits: 8, type: "Major Project", topics: "Working Hardware Prototype, External Jury Viva" },
          { code: "EE-603", title: "Substation Safety & UP Electricity Code", credits: 4, type: "Theory", topics: "Central Electricity Authority (CEA) Regulations" }
        ]
      }
    ]
  },
  ce: {
    name: "Civil Engineering (Structures & Infrastructure)",
    code: "CE-DIP",
    semesters: [
      {
        sem: 1,
        title: "Engineering Mechanics & Plane Surveying",
        credits: 22,
        theoryHours: 16,
        labHours: 12,
        certBadge: "AutoCAD Civil 2D Certification",
        subjects: [
          { code: "CE-101", title: "Applied Mathematics-I", credits: 4, type: "Theory", topics: "Trigonometry, Vector Algebra, Co-ordinate Geometry" },
          { code: "CE-102", title: "Applied Physics & Materials", credits: 4, type: "Theory + Lab", topics: "Elasticity, Hydrostatics, Thermal Expansion" },
          { code: "CE-103", title: "Applied Mechanics & Statics", credits: 5, type: "Theory + Lab", topics: "Forces, Moments, Trusses, Centroids, Friction" },
          { code: "CE-104", title: "Engineering Graphics & Building Drawing", credits: 4, type: "Lab", topics: "Orthographic Projections, Building Elevation Plans" },
          { code: "CE-105", title: "Surveying-I (Chain & Compass)", credits: 4, type: "Theory + Lab", topics: "Ranging, Prismatic Compass, Plane Table Surveying" },
          { code: "CE-106", title: "Professional Communication", credits: 2, type: "Theory", topics: "Site Reporting, Technical Specifications" }
        ]
      },
      {
        sem: 2,
        title: "Building Construction, Materials & Surveying-II",
        credits: 24,
        theoryHours: 15,
        labHours: 15,
        certBadge: "Total Station Geodetic Surveyor",
        subjects: [
          { code: "CE-201", title: "Applied Mathematics-II", credits: 4, type: "Theory", topics: "Calculus, Differential Equations, Statistics" },
          { code: "CE-202", title: "Building Materials & Construction Tech", credits: 5, type: "Theory + Lab", topics: "Bricks, Cement, Mortar, Masonry, Foundations" },
          { code: "CE-203", title: "Surveying-II (Theodolite & Levelling)", credits: 5, type: "Theory + Lab", topics: "Transit Theodolite, Contour Maps, Digital Level" },
          { code: "CE-204", title: "Strength of Materials (Structures-I)", credits: 4, type: "Theory + Lab", topics: "Stresses, Strains, Shear Force & Bending Moments" },
          { code: "CE-205", title: "Environmental Studies & Green Buildings", credits: 3, type: "Theory", topics: "Rainwater Harvesting, Solid Waste, IGBC Standards" },
          { code: "CE-206", title: "Civil Engineering Workshop Practice", credits: 3, type: "Lab", topics: "Masonry Construction, Bar Bending, Formwork" }
        ]
      },
      {
        sem: 3,
        title: "Hydraulics, Advanced Surveying & Concrete Tech",
        credits: 24,
        theoryHours: 16,
        labHours: 14,
        certBadge: "NABL Concrete Testing Technician",
        subjects: [
          { code: "CE-301", title: "Hydraulics & Fluid Mechanics", credits: 5, type: "Theory + Lab", topics: "Hydrodynamics, Bernoulli Equation, Open Channels, Pumps" },
          { code: "CE-302", title: "Concrete Technology & Mix Design", credits: 5, type: "Theory + Lab", topics: "IS 10262 Mix Design, Slump Test, Compressive Strength" },
          { code: "CE-303", title: "Advanced Geomatics (Total Station & GPS)", credits: 4, type: "Theory + Lab", topics: "Digital Total Stations, GIS Mapping, DGPS" },
          { code: "CE-304", title: "Structural Mechanics (Structures-II)", credits: 4, type: "Theory", topics: "Deflection of Beams, Columns, Struts, Fixed Beams" },
          { code: "CE-305", title: "Computer Aided Building Planning", credits: 4, type: "Lab", topics: "Revit Architecture, 3D Building Floor Plans" },
          { code: "CE-306", title: "Survey Camp Review", credits: 2, type: "Seminar", topics: "Field Contour Mapping Camp Report" }
        ]
      },
      {
        sem: 4,
        title: "Soil Mechanics, Geotech & Water Supply Engg",
        credits: 24,
        theoryHours: 15,
        labHours: 15,
        certBadge: "STAAD.Pro Structural Modeling Specialist",
        subjects: [
          { code: "CE-401", title: "Geotechnical & Soil Mechanics", credits: 5, type: "Theory + Lab", topics: "Atterberg Limits, Soil Permeability, Shear Box, CBR" },
          { code: "CE-402", title: "Water Supply & Sanitary Engineering", credits: 5, type: "Theory + Lab", topics: "Water Quality Testing, Sewerage Systems, STP Plants" },
          { code: "CE-403", title: "Design of Reinforced Concrete (RCC-I)", credits: 4, type: "Theory", topics: "Working Stress & Limit State, Singly/Doubly Beams" },
          { code: "CE-404", title: "Transportation & Highway Engineering", credits: 4, type: "Theory + Lab", topics: "Highway Geometry, Bitumen Testing, Pavement Design" },
          { code: "CE-405", title: "STAAD.Pro Structural Modeling Lab", credits: 4, type: "Lab", topics: "Multi-Story Frame Analysis, Load Combinations" },
          { code: "CE-406", title: "Minor Structural Project", credits: 2, type: "Project", topics: "Culvert or Building Frame Drafting" }
        ]
      },
      {
        sem: 5,
        title: "RCC-II, Steel Structures & Quantity Estimation",
        credits: 24,
        theoryHours: 14,
        labHours: 16,
        certBadge: "BIM Infrastructure Modeling Associate",
        subjects: [
          { code: "CE-501", title: "Design of Reinforced Concrete (RCC-II)", credits: 5, type: "Theory + Lab", topics: "Columns, Footings, Retaining Walls, Water Tanks" },
          { code: "CE-502", title: "Design of Steel Structures", credits: 5, type: "Theory + Lab", topics: "Bolted/Welded Connections, Tension/Compression Members" },
          { code: "CE-503", title: "Estimating, Costing & Valuation", credits: 4, type: "Theory", topics: "Rate Analysis, Bill of Quantities (BOQ), CPWD Norms" },
          { code: "CE-504", title: "Irrigation & Water Resource Engineering", credits: 4, type: "Theory", topics: "Canal Alignment, Weirs, Barrages, River Training" },
          { code: "CE-505", title: "BIM & 3D Civil Infrastructure Modeling", credits: 3, type: "Lab", topics: "Autodesk Civil 3D, Clash Detection" },
          { code: "CE-506", title: "Major Capstone Project Formulation", credits: 3, type: "Project", topics: "Infrastructure Design Blueprint" }
        ]
      },
      {
        sem: 6,
        title: "Site Apprenticeship & Highway Project Defense",
        credits: 22,
        theoryHours: 6,
        labHours: 24,
        certBadge: "Certified Civil Infrastructure Engineer Diploma",
        subjects: [
          { code: "CE-601", title: "Mega-Site Construction Apprenticeship", credits: 10, type: "Industry Immersion", topics: "16-Week On-Site Placement at L&T / Tata Projects / GMR" },
          { code: "CE-602", title: "Major Infrastructure Project Defense", credits: 8, type: "Major Project", topics: "Structural Model & Calculation Dossier External Viva" },
          { code: "CE-603", title: "Construction Management & RERA Law", credits: 4, type: "Theory", topics: "CPM/PERT Schedules, Quality Contracts, Site Safety" }
        ]
      }
    ]
  },
  ece: {
    name: "Electronics & Communication (IoT & 5G)",
    code: "ECE-DIP",
    semesters: [
      {
        sem: 1,
        title: "Electronic Components & Circuit Fundamentals",
        credits: 22,
        theoryHours: 16,
        labHours: 12,
        certBadge: "Proteus Circuit Simulation Specialist",
        subjects: [
          { code: "EC-101", title: "Applied Mathematics-I", credits: 4, type: "Theory", topics: "Matrices, Differential Calculus, Complex Numbers" },
          { code: "EC-102", title: "Applied Physics-I", credits: 4, type: "Theory + Lab", topics: "Semiconductors, Wave Mechanics, Laser Optics" },
          { code: "EC-103", title: "Electronic Components & Devices", credits: 5, type: "Theory + Lab", topics: "PN Diodes, Zener, BJTs, JFETs, Characteristics" },
          { code: "EC-104", title: "C Programming for Electronics", credits: 4, type: "Theory + Lab", topics: "Bitwise Operators, Embedded C Basics, Pointers" },
          { code: "EC-105", title: "Electronic Drafting & PCB Workshop", credits: 3, type: "Lab", topics: "Eagle/KiCAD Schematic, Chemical Etching, SMD Soldering" },
          { code: "EC-106", title: "Professional Communication", credits: 2, type: "Theory", topics: "Technical Reporting, Team Collaboration" }
        ]
      },
      {
        sem: 2,
        title: "Digital Logic Design & Circuit Theory",
        credits: 24,
        theoryHours: 15,
        labHours: 15,
        certBadge: "Altium Designer PCB Associate",
        subjects: [
          { code: "EC-201", title: "Applied Mathematics-II", credits: 4, type: "Theory", topics: "Laplace Transforms, Fourier Series, Probability" },
          { code: "EC-202", title: "Digital Electronics & Logic Gates", credits: 5, type: "Theory + Lab", topics: "K-Maps, Combinational Circuits, Flip-Flops, Registers" },
          { code: "EC-203", title: "Electronic Circuits & Amplifiers", credits: 5, type: "Theory + Lab", topics: "CE/CB Amplifiers, Feedback, Op-Amps, Oscillators" },
          { code: "EC-204", title: "Network Analysis & Filters", credits: 4, type: "Theory + Lab", topics: "Thevenin, Norton, Superposition, RLC Resonances" },
          { code: "EC-205", title: "Environmental Studies & E-Waste", credits: 3, type: "Theory", topics: "RoHS Compliance, E-Waste Recycling, Green Tech" },
          { code: "EC-206", title: "Electronic Instrumentation Lab", credits: 3, type: "Lab", topics: "DSO Digital Scopes, Function Generators, Spectrum Analyzers" }
        ]
      },
      {
        sem: 3,
        title: "Microprocessors, Analog & Digital Communication",
        credits: 24,
        theoryHours: 16,
        labHours: 14,
        certBadge: "Embedded ARM Microcontroller Associate",
        subjects: [
          { code: "EC-301", title: "Microprocessor 8085/8086 Architecture", credits: 5, type: "Theory + Lab", topics: "Pin Architecture, Instruction Sets, Interfacing 8255/8259" },
          { code: "EC-302", title: "Analog Communication Systems", credits: 5, type: "Theory + Lab", topics: "AM, FM, PM Modulation, Superheterodyne Receivers" },
          { code: "EC-303", title: "Digital Communication & Coding", credits: 4, type: "Theory + Lab", topics: "PCM, DPCM, ASK, FSK, PSK, QAM, Shannon Limit" },
          { code: "EC-304", title: "Linear Integrated Circuits (Op-Amp 741)", credits: 4, type: "Theory + Lab", topics: "Comparators, Schmitt Triggers, Active Filters, 555 Timers" },
          { code: "EC-305", title: "Python for Hardware Interfacing", credits: 4, type: "Lab", topics: "PySerial, GPIO Control, Sensor Telemetry" },
          { code: "EC-306", title: "Summer Industrial Training Review", credits: 2, type: "Seminar", topics: "Telecom / Hardware Plant Report" }
        ]
      },
      {
        sem: 4,
        title: "ARM Microcontrollers, Industrial IoT Sensors & VLSI",
        credits: 24,
        theoryHours: 15,
        labHours: 15,
        certBadge: "ARM Cortex Embedded Developer",
        subjects: [
          { code: "EC-401", title: "Microcontrollers & ARM Cortex-M4", credits: 5, type: "Theory + Lab", topics: "STM32 Architecture, Timers, PWM, I2C, SPI, UART" },
          { code: "EC-402", title: "Internet of Things (IoT) Architecture", credits: 5, type: "Theory + Lab", topics: "ESP32, MQTT, CoAP, Node-RED, Cloud Telemetry" },
          { code: "EC-403", title: "VLSI Design & VHDL Programming", credits: 4, type: "Theory + Lab", topics: "CMOS Logic, VHDL/Verilog, FPGA Xilinx Spartan Flow" },
          { code: "EC-404", title: "Electromagnetic Fields & Antennas", credits: 4, type: "Theory", topics: "Maxwell Equations, Dipole Antennas, Radiation Patterns" },
          { code: "EC-405", title: "PCB Multi-Layer Layout Lab", credits: 4, type: "Lab", topics: "Altium Designer 4-Layer PCB, Gerber Generation" },
          { code: "EC-406", title: "Minor Embedded Prototype", credits: 2, type: "Project", topics: "Smart Sensor Gateway Prototype" }
        ]
      },
      {
        sem: 5,
        title: "Wireless 5G Networks, Microwave & Robotics",
        credits: 24,
        theoryHours: 14,
        labHours: 16,
        certBadge: "Certified 5G Wireless & RF Specialist",
        subjects: [
          { code: "EC-501", title: "5G Cellular & Wireless Networks", credits: 5, type: "Theory + Lab", topics: "MIMO, Beamforming, Massive IoT, Network Slicing" },
          { code: "EC-502", title: "Microwave & Radar Engineering", credits: 5, type: "Theory + Lab", topics: "Klystrons, Magnetrons, Waveguides, Doppler Radar" },
          { code: "EC-503", title: "Optical Fiber Communication", credits: 4, type: "Theory + Lab", topics: "Total Internal Reflection, Attenuation, WDM Systems" },
          { code: "EC-504", title: "Industrial Robotics & Computer Vision", credits: 4, type: "Theory + Lab", topics: "OpenCV, Raspberry Pi 5, Edge AI, Servo Kinematics" },
          { code: "EC-505", title: "Wireless Sensor Network Lab (LoRa)", credits: 3, type: "Lab", topics: "LoRaWAN 868MHz Gateways, Mesh Topologies" },
          { code: "EC-506", title: "Major Capstone Project Formulation", credits: 3, type: "Project", topics: "IoT / 5G Hardware Formulation" }
        ]
      },
      {
        sem: 6,
        title: "Electronics Enterprise Co-Op & Major Project",
        credits: 22,
        theoryHours: 6,
        labHours: 24,
        certBadge: "Professional Electronics Engineer Diploma",
        subjects: [
          { code: "EC-601", title: "Semiconductor / Telecom Apprenticeship", credits: 10, type: "Industry Immersion", topics: "16-Week On-Site Placement at Bosch / Dixon / Samsung" },
          { code: "EC-602", title: "Major Capstone Hardware Project Defense", credits: 8, type: "Major Project", topics: "Hardware Prototype Testing, Patent Filing, External Viva" },
          { code: "EC-603", title: "Telecom Regulatory Authority Standards", credits: 4, type: "Theory", topics: "TRAI Norms, FCC Radiation Limits, EMC Testing" }
        ]
      }
    ]
  }
};

/* ==========================================================================
   DISTINGUISHED FACULTY & RESEARCH MENTORS
   ========================================================================== */
export const FACULTY_MEMBERS = [
  {
    name: "Dr. K.P. Raghavan",
    role: "Dean & Professor of Mechanical Engineering",
    dept: "Mechanical & Automobile",
    qualification: "Ph.D. IIT Roorkee, M.Tech Production, B.Tech Mech",
    experience: "24 Years (Academic & Industrial)",
    papers: "38 International Journals, 6 Indian Patents",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    specialization: "CAD/CAM, Finite Element Analysis, Automated Robotic Machining",
    email: "dean.polytechnic@subharti.org",
    rating: 4.95
  },
  {
    name: "Dr. Sunita Deshpande",
    role: "HOD & Associate Professor (Computer Science)",
    dept: "Computer Science & IT",
    qualification: "Ph.D. NIT Kurukshetra, M.Tech CSE, GATE Scholar",
    experience: "16 Years in Cloud Architecture & Algorithms",
    papers: "24 IEEE Papers, 3 Smart City Patents",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    specialization: "Distributed Cloud Systems, AI/ML Heuristics, Distributed Ledgers",
    email: "hod.cse@subharti.org",
    rating: 4.98
  },
  {
    name: "Prof. Harishankar Dixit",
    role: "HOD & Senior Lecturer (Electrical Engineering)",
    dept: "Electrical & Smart Grid",
    qualification: "M.Tech IIT Delhi (Power Systems), Ex-BHEL Consultant",
    experience: "19 Years (10 yrs Industry + 9 yrs Academia)",
    papers: "16 National Technical Journals, 2 Industrial Consultancies",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    specialization: "Smart Grid Telemetry, Industrial PLC-SCADA, Solar Inverters",
    email: "hod.electrical@subharti.org",
    rating: 4.91
  },
  {
    name: "Er. Amitav Ganguly",
    role: "Chief Workshop Superintendent & Master Toolmaker",
    dept: "Mechanical Engineering",
    qualification: "B.Tech Mech, Diploma Tool & Die (NTTF Bangalore)",
    experience: "22 Years (14 yrs Maruti Suzuki Tool Room)",
    papers: "Trainer of 400+ CNC Programmers for NCR Industries",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    specialization: "Precision CNC Turning, EDM Wire-Cut, GD&T, CMM Inspection",
    email: "workshop.supt@subharti.org",
    rating: 4.97
  },
  {
    name: "Dr. Rajesh Chauhan",
    role: "HOD & Structural Consultant (Civil Engineering)",
    dept: "Civil & Infrastructure",
    qualification: "Ph.D. Civil (Structures), M.Tech Structural Engg",
    experience: "18 Years (Approved Structural Designer for UP Govt)",
    papers: "19 Research Publications in ASCE & Springer",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    specialization: "Earthquake Resistant Structures, Geo-Synthetics, STAAD.Pro",
    email: "hod.civil@subharti.org",
    rating: 4.89
  },
  {
    name: "Er. Meenakshi Sundaram",
    role: "Assistant Professor & Robotics Lab Lead",
    dept: "Electronics & IoT",
    qualification: "M.Tech Embedded Systems (Anna University)",
    experience: "11 Years in Hardware Prototyping & Drone Tech",
    papers: "8 International Conference Papers, 2 IoT Hackathon Titles",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    specialization: "LoRaWAN Mesh Networks, ARM Cortex-M4, Autonomous Drones",
    email: "meenakshi.iot@subharti.org",
    rating: 4.94
  }
];

/* ==========================================================================
   AWARD-WINNING STUDENT INNOVATION CAPSTONE PROJECTS
   ========================================================================== */
export const STUDENT_PROJECTS = [
  {
    id: "agri-drone",
    title: "AgriSense: Autonomous Multispectral Crop Health Drone",
    dept: "Computer Science & Electronics",
    award: "1st Prize — Smart India Hackathon 2025",
    badge: "Patent Filed",
    guide: "Dr. Sunita Deshpande & Er. Meenakshi Sundaram",
    team: ["Sonu Kumar (Lead)", "Pooja Sharma", "Deepak Verma", "Rishi Raj"],
    image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80",
    techStack: ["PX4 Autopilot", "Python", "OpenCV", "TensorFlow Lite", "LoRa 868MHz"],
    description: "An autonomous hexacopter equipped with dual NDVI multispectral sensors to detect early fungal infestation in sugarcane crops across western UP.",
    metrics: { range: "8.5 km", flightTime: "34 mins", accuracy: "94.2% Pest Detection" },
    status: "Prototyped & Field Tested"
  },
  {
    id: "formula-ev-kart",
    title: "Subharti Bolt-EV: Student Formula Electric Racer",
    dept: "Mechanical & Electrical",
    award: "Best Acceleration Trophy — Formula Student India",
    badge: "SAE Collegiate Award",
    guide: "Dr. K.P. Raghavan & Prof. H.S. Dixit",
    team: ["Arjun Mathur (Capt.)", "Manish Rawat", "Sneha Kumari", "Vikram Singh"],
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
    techStack: ["10 kW BLDC Motor", "72V 60Ah LiFePO4", "BMS Telemetry", "Custom Tubular Spaceframe"],
    description: "A single-seat electric racing kart engineered from scratch by diploma students featuring custom planetary reduction, regenerative braking, and 0-60 km/h in 3.8s.",
    metrics: { topSpeed: "82 km/h", acceleration: "0-60 in 3.8s", curbWeight: "142 kg" },
    status: "Track Certified"
  },
  {
    id: "plc-industrial-sorter",
    title: "SmartSort 4.0: High-Speed Vision & PLC Conveyor Sorter",
    dept: "Mechanical & Robotics",
    award: "Best Industry Project — Schneider Electric Hackathon",
    badge: "Industry Deployed",
    guide: "Er. Amitav Ganguly",
    team: ["Rohan Gupta", "Tanya Joshi", "Mohd. Zeeshan"],
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    techStack: ["Siemens S7-1200 PLC", "Pneumatic Ejectors", "OpenCV OCR", "SCADA Web Dashboard"],
    description: "Automated conveyor mechanism that identifies QR codes and surface defects on manufactured automotive bolts at 120 parts per minute with pneumatic sorting.",
    metrics: { throughput: "120 parts/min", accuracy: "99.1%", uptime: "99.8%" },
    status: "Commercial Trial"
  },
  {
    id: "eco-concrete-beam",
    title: "EcoStruct: Carbon-Negative Bamboo Reinforced Concrete",
    dept: "Civil Engineering",
    award: "Green Innovation Award — Indian Concrete Institute",
    badge: "Eco Champion",
    guide: "Dr. Rajesh Chauhan",
    team: ["Anand Jha", "Bhavna Patel", "Naveen Yadav"],
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    techStack: ["Treated Dendrocalamus Bamboo", "Fly-Ash Geo-Polymer", "UTM Compressive Testing"],
    description: "Low-cost, high-tensile structural beams replacing 70% of steel rebars with chemically seasoned bamboo splints for rural sustainable infrastructure.",
    metrics: { costReduction: "48%", tensileYield: "320 MPa", carbonSaved: "62%" },
    status: "NABL Certified"
  }
];

/* ==========================================================================
   STUDENT SOCIETIES, CLUBS & CAMPUS SOCIETIES
   ========================================================================== */
export const STUDENT_CLUBS = [
  {
    id: "codecrafters",
    name: "CodeCrafters Society",
    dept: "Computer Science",
    lead: "Aayush Sharma (Final Yr CSE)",
    members: 240,
    motto: "Turn Logic into Impact",
    meetingTime: "Every Wednesday & Saturday, 4:30 PM",
    highlights: ["Weekly Algorithmic Contests", "Full-Stack Bootcamp", "Hackathon Mentorship"],
    upcomingEvent: "Subharti CodeSprint 2026 (₹50k Prize Pool)"
  },
  {
    id: "robotech",
    name: "RoboTech & Automation Wing",
    dept: "Mechanical & Electronics",
    lead: "Sameer Alam (Final Yr ME)",
    members: 180,
    motto: "Designing the Autonomous Future",
    meetingTime: "Tuesdays & Fridays, 4:00 PM",
    highlights: ["BattleBots Combat Arena", "Drone Flight Sandbox", "Autonomous Line Followers"],
    upcomingEvent: "NCR RoboWars Grand Prix (Nov 2026)"
  },
  {
    id: "sae-collegiate",
    name: "SAE Collegiate Automotive Club",
    dept: "Mechanical & Automobile",
    lead: "Vikramaditya Rao (Final Yr ME)",
    members: 150,
    motto: "Speed, Precision & Engineering Passion",
    meetingTime: "Every Monday, 4:30 PM",
    highlights: ["EV Powertrain Tuning", "Go-Kart Chassis Building", "Maruti Plant Visits"],
    upcomingEvent: "National E-Kart Championship 2026"
  },
  {
    id: "green-energy",
    name: "Vidyut Renewable & Green Guild",
    dept: "Electrical & Environmental",
    lead: "Priyanka Mishra (Final Yr EE)",
    members: 120,
    motto: "Clean Megawatts for Clean Tomorrow",
    meetingTime: "Thursdays, 3:30 PM",
    highlights: ["Rooftop Solar Auditing", "Micro-Hydro Models", "Energy Conservation Drives"],
    upcomingEvent: "Net-Zero Campus Green Expo 2026"
  }
];


/* ==========================================================================
   CAMPUS 360° HOTSPOTS & VIRTUAL TOUR MASTER DATA
   ========================================================================== */
export default function Home({ onNavigate }) {
  // Navigation & Viewport State
  const [ready, setReady] = useState(false);
  const [cat, setCat] = useState("All");
  const [noticeSearch, setNoticeSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState(0);
  const [programCat, setProgramCat] = useState("all");
  const [programLevel, setProgramLevel] = useState("all");
  const [galCategory, setGalCategory] = useState("all");

  // Modals & Interactive States
  const [lb, setLb] = useState(-1);
  const [tourOpen, setTourOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareDept1, setCompareDept1] = useState(0);
  const [compareDept2, setCompareDept2] = useState(1);
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  // Enquiry Form Fields (Modal)
  const [enquiryData, setEnquiryData] = useState({
    name: "",
    email: "",
    phone: "",
    branch: "Computer Science & Engineering",
    score: "",
    query: ""
  });

  // Dedicated Institutional On-Page Contact & Enquiry Form
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    branch: "Computer Science & Engineering",
    message: "",
    isHuman: false
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [captchaVerifying, setCaptchaVerifying] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);

  // Sliders & Carousel State
  const [heroSlide, setHeroSlide] = useState(0);
  const [placementSlide, setPlacementSlide] = useState(0);
  const [revSlide, setRevSlide] = useState(0);
  const [faqOpen, setFaqOpen] = useState(0);
  const [pauseReviews, setPauseReviews] = useState(false);
  const [pauseHero, setPauseHero] = useState(false);

  // Refs & Metrics
  const rootRef = useRef(null);
  const tlRef = useRef(null);
  const [statsRef, statsSeen] = useInView(0.2);
  const progress = useScrollProgress();
  const fill = useFill(tlRef);
  const currentYear = new Date().getFullYear();

  // Screen Width Responsive Check
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // --- Enhanced Interactive States ---
  const [activeHotspot, setActiveHotspot] = useState(CAMPUS_HOTSPOTS[0]);
  const [hotspotFilter, setHotspotFilter] = useState("All");
  const [hotspot360Modal, setHotspot360Modal] = useState(false);

  // Fee Calculator State
  const [calcBranch, setCalcBranch] = useState("cse");
  const [calcTrack, setCalcTrack] = useState("regular");
  const [calcScore, setCalcScore] = useState(82);
  const [calcGirlWaiver, setCalcGirlWaiver] = useState(false);
  const [calcDefenseWaiver, setCalcDefenseWaiver] = useState(false);
  const [calcHostel, setCalcHostel] = useState("none");

  // Curriculum State
  const [curriculumBranch, setCurriculumBranch] = useState("cse");
  const [curriculumSem, setCurriculumSem] = useState(1);
  const [curriculumModal, setCurriculumModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Student Projects & Innovation State
  const [projectFilter, setProjectFilter] = useState("All");
  const [activeProject, setActiveProject] = useState(null);
  const [projectModal, setProjectModal] = useState(false);

  // Faculty State
  const [facultyModal, setFacultyModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Eligibility Checker State
  const [eligQual, setEligQual] = useState("10th");
  const [eligPercent, setEligPercent] = useState(68);
  const [eligMathMarks, setEligMathMarks] = useState(65);
  const [eligDomicile, setEligDomicile] = useState("UP");
  const [eligResult, setEligResult] = useState(null);

  // Dynamic Fee Computation
  const calculatedFee = useMemo(() => {
    const branchRates = FEE_STRUCTURE[calcTrack][calcBranch];
    const baseTuition = branchRates.tuition;
    const baseLab = branchRates.lab;
    const examFee = branchRates.exam;
    const devFee = branchRates.dev;

    let scholarshipPct = 0;
    let scholarshipLabel = "Affiliated Fee Structure";
    if (calcScore >= 90) {
      scholarshipPct = 100;
      scholarshipLabel = "President's 100% Tuition Gold Waiver";
    } else if (calcScore >= 80) {
      scholarshipPct = 50;
      scholarshipLabel = "Merit Excellence 50% Tuition Waiver";
    } else if (calcScore >= 70) {
      scholarshipPct = 25;
      scholarshipLabel = "Academic Merit 25% Tuition Waiver";
    }

    const tuitionDiscount = Math.round((baseTuition * scholarshipPct) / 100);
    const netTuition = baseTuition - tuitionDiscount;

    let specialWaiver = 0;
    if (calcGirlWaiver) specialWaiver += 5000;
    if (calcDefenseWaiver) specialWaiver += 8000;

    const hostelFee = FEE_STRUCTURE.hostelRates[calcHostel].fee;
    const grossAnnual = (baseTuition + baseLab + examFee + devFee) * 2 + hostelFee;
    const totalWaivers = (tuitionDiscount * 2) + specialWaiver;
    const netAnnual = Math.max(0, grossAnnual - totalWaivers);
    const perSemesterPayable = Math.round(netAnnual / 2);

    return {
      baseTuition,
      baseLab,
      examFee,
      devFee,
      scholarshipPct,
      scholarshipLabel,
      tuitionDiscount,
      netTuition,
      specialWaiver,
      hostelFee,
      grossAnnual,
      totalWaivers,
      netAnnual,
      perSemesterPayable
    };
  }, [calcBranch, calcTrack, calcScore, calcGirlWaiver, calcDefenseWaiver, calcHostel]);

  // Eligibility Evaluation Handler
  const handleCheckEligibility = () => {
    let eligible = false;
    let stream = "";
    let reason = "";

    if (eligQual === "10th") {
      if (eligPercent >= 35 && eligMathMarks >= 35) {
        eligible = true;
        stream = "3-Year Regular Diploma in Engineering (All Branches)";
        reason = "Meets AICTE & BTE UP standard requirement of passing Class 10th with Science & Mathematics.";
      } else {
        eligible = false;
        reason = "Minimum 35% marks required in Class 10th with Science and Mathematics.";
      }
    } else if (eligQual === "12th") {
      if (eligPercent >= 40) {
        eligible = true;
        stream = "Direct 2nd Year Lateral Entry (Semester 3 Admission)";
        reason = "Eligible for lateral entry under 12th PCM quota, saving 1 full academic year.";
      } else {
        eligible = false;
        reason = "Minimum 40% aggregate marks required in 12th PCM.";
      }
    } else if (eligQual === "iti") {
      if (eligPercent >= 50) {
        eligible = true;
        stream = "Direct 2nd Year Lateral Entry (Engineering Trade Specific)";
        reason = "Eligible for lateral entry based on approved 2-Year ITI Trade Certificate.";
      } else {
        eligible = false;
        reason = "Minimum 50% aggregate marks required in 2-Year ITI trade.";
      }
    }

    setEligResult({ eligible, stream, reason });
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ready splash timeout
  useEffect(() => {
    const t = setTimeout(() => setReady(true), reduced() ? 0 : 400);
    return () => clearTimeout(t);
  }, []);

  // Brand-Grade Scroll-Reveal IntersectionObserver
  useEffect(() => {
    if (typeof window === "undefined") return;

    const revealAll = () => {
      document.querySelectorAll(".poly-reveal, .poly-reveal-stagger, .poly-reveal-scale").forEach((el) => {
        el.classList.add("is-revealed");
      });
    };

    if (!("IntersectionObserver" in window) || reduced()) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "60px 0px 60px 0px", threshold: 0.01 }
    );

    const elements = document.querySelectorAll(".poly-reveal, .poly-reveal-stagger, .poly-reveal-scale");
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("is-revealed");
      } else {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [ready]);

  // Auto Slideshow: Hero
  useEffect(() => {
    if (pauseHero || reduced()) return;
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % COLLEGE.heroSlides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [pauseHero]);

  // Auto Slideshow: Placements
  useEffect(() => {
    if (reduced()) return;
    const interval = setInterval(() => {
      setPlacementSlide((prev) => (prev + 1) % COLLEGE.students.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Auto Slideshow: Reviews
  useEffect(() => {
    if (pauseReviews || reduced()) return;
    const interval = setInterval(() => {
      setRevSlide((prev) => (prev + 1) % REVIEWS.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [pauseReviews]);

  // Lightbox Keyboard controls
  const stepLightbox = (dir) => {
    const total = COLLEGE.gallery.length;
    setLb((prev) => (prev + dir + total) % total);
  };

  useEffect(() => {
    if (lb < 0) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLb(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
      if (e.key === "ArrowLeft") stepLightbox(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lb]);

  // Smooth Section Scroller with Precision Header Offset
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 84;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  // Filtered Programs
  const filteredDepts = useMemo(() => {
    return DEPTS.filter((d) => {
      const matchCat = programCat === "all" || d.category === programCat;
      const matchLevel = programLevel === "all" || d.level === programLevel;
      return matchCat && matchLevel;
    });
  }, [programCat, programLevel]);

  // Filtered Gallery
  const filteredGallery = useMemo(() => {
    if (galCategory === "all") return COLLEGE.gallery;
    return COLLEGE.gallery.filter((g) => g.cat === galCategory);
  }, [galCategory]);

  // Filtered Notices
  const filteredNotices = useMemo(() => {
    return NOTICES.filter((n) => {
      const matchCat = cat === "All" || n.cat === cat;
      const matchSearch = !noticeSearch || n.title.toLowerCase().includes(noticeSearch.toLowerCase()) || n.text.toLowerCase().includes(noticeSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [cat, noticeSearch]);

  // Handle Enquiry Submit (Modal)
  const handleEnquirySubmit = (e) => {
    e.preventDefault();
    setEnquirySuccess(true);
    setTimeout(() => {
      setEnquirySuccess(false);
      setEnquiryOpen(false);
      setEnquiryData({ name: "", email: "", phone: "", branch: "Computer Science & Engineering", score: "", query: "" });
    }, 2400);
  };

  // Handle Institutional Contact & Admission Enquiry Submit
  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.phone.trim()) {
      alert("Please fill in your Name, Email Address, and Phone Number.");
      return;
    }
    if (!contactForm.isHuman) {
      setCaptchaError(true);
      setTimeout(() => setCaptchaError(false), 3500);
      return;
    }
    setContactSubmitting(true);
    setTimeout(() => {
      setContactSubmitting(false);
      setContactSuccess(true);
      setTimeout(() => {
        setContactSuccess(false);
        setContactForm({
          name: "",
          email: "",
          phone: "",
          branch: "Computer Science & Engineering",
          message: "",
          isHuman: false
        });
      }, 4500);
    }, 1100);
  };

  const handleCaptchaClick = () => {
    if (contactForm.isHuman || captchaVerifying) return;
    setCaptchaVerifying(true);
    setCaptchaError(false);
    setTimeout(() => {
      setCaptchaVerifying(false);
      setContactForm((prev) => ({ ...prev, isHuman: true }));
    }, 650);
  };

  const handleCopyAddress = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(CONTACT.address);
    }
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2400);
  };

  return (
    <div className="home-master-container" ref={rootRef}>
      {/* Reading Progress Indicator */}
      <div className="scroll-progress-line" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />

      {/* Floating Back to Top Pill */}
      <button
        type="button"
        className={`floating-top-btn ${progress > 0.08 ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        <ArrowUp size={18} />
      </button>

      {/* Top Sticky Modern Navigation Bar */}
      <Navbar onNavigate={onNavigate} />

      {/* ====================================================================
          1. CINEMATIC HERO SECTION (Authentic Engineering University Composition)
          ==================================================================== */}
      <header id="home" className="hero-cinematic-section" onMouseEnter={() => setPauseHero(true)} onMouseLeave={() => setPauseHero(false)}>
        {/* Dynamic Ambient Glowing Orbs */}
        <div className="hero-ambient-orb-1" aria-hidden="true" />
        <div className="hero-ambient-orb-2" aria-hidden="true" />

        {/* Background Panoramic Campus Imagery with Ambient Vignette Overlay */}
        <div className="hero-background-carousel">
          <div className="hero-slide-layer active">
            <Img src="/subharti-polytechnic-main-building.jpg" alt="Subharti Polytechnic College Main Academic Building" className="hero-backdrop-img" />
            <div className="hero-backdrop-gradient" />
          </div>
        </div>

        <div className="home-content-wrapper">
          <div className="hero-editorial-grid">
            {/* Left Narrative Column */}
            <div className="hero-copy-column">
              <div className="hero-eyebrow-pill">
                <span className="live-radar-dot" />
                <span className="eyebrow-motto">• LEARN • GROW • BUILD YOUR FUTURE</span>
              </div>

              <h1 className="hero-massive-headline">
                Your Dream Education Starts
                <br />
                <span className="headline-hero-accent">Here</span>
              </h1>

              <p className="hero-editorial-sub">
                Subharti Polytechnic provides world-class technical education, modern laboratory environments, and a supportive academic community to help you achieve your goals.
              </p>

              {/* Action Buttons */}
              <div className="hero-cta-buttons-row">
                <button
                  type="button"
                  className="btn-primary-emerald"
                  onClick={() => scrollTo("departments")}
                >
                  <span>Explore Programs</span>
                  <ArrowRight size={17} />
                </button>

                <button
                  type="button"
                  className="btn-secondary-outline"
                  onClick={() => setTourOpen(true)}
                >
                  <Play size={15} className="fill-emerald" />
                  <span>Watch Campus Tour</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="hero-accreditations-strip">
                <div className="accred-item">
                  <ShieldCheck size={20} className="accred-icon text-emerald" />
                  <div>
                    <strong>AICTE &amp; BTE UP Approved</strong>
                    <small>Govt. of UP Code: 2026</small>
                  </div>
                </div>
                <div className="accred-sep" />
                <div className="accred-item">
                  <Award size={20} className="accred-icon text-amber" />
                  <div>
                    <strong>96% Placement Success</strong>
                    <small>₹8.4 LPA Highest Package</small>
                  </div>
                </div>
                <div className="accred-sep" />
                <div className="accred-item">
                  <Wrench size={20} className="accred-icon text-emerald" />
                  <div>
                    <strong>100% Practical Labs</strong>
                    <small>Heavy CNC &amp; Automation Bays</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Engineering Visual Showcase & Floating Badges */}
            <div className="hero-visual-column">
              <div className="hero-showcase-frame">
                {/* Main Card: Authentic College Building Showcase */}
                <div className="hero-main-showcase-card">
                  <Img
                    src="/subharti-polytechnic-main-building.jpg"
                    alt="Subharti Polytechnic College Main Academic Building"
                    className="hero-engineering-photo"
                  />
                  <div className="showcase-glass-footer">
                    <div className="showcase-emblem-row">
                      <img
                        src="/svsu-logo-whiten.webp"
                        alt="SVSU Emblem"
                        className="showcase-crest-mini"
                      />
                      <div>
                        <strong className="showcase-card-title">Subharti Polytechnic College</strong>
                        <span className="showcase-card-sub">Main Academic Campus • SVSU Meerut</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badge 1: More Than Just Education (Reference Match) */}
                <div className="hero-floating-badge badge-top-ranked card-float">
                  <div className="badge-crest-thumb">
                    <Sparkles size={18} className="text-emerald" />
                  </div>
                  <div>
                    <strong>More Than Just Education</strong>
                    <small>AICTE Approved • SVSU Constituent</small>
                  </div>
                </div>

                {/* Floating Badge 2: Premier Polytechnic */}
                <div className="hero-floating-badge badge-collegeos card-float">
                  <div className="badge-crest-thumb pulse">
                    <Trophy size={18} className="text-amber" />
                  </div>
                  <div>
                    <strong>Top Ranked in NCR</strong>
                    <small>#1 Premier Polytechnic</small>
                  </div>
                </div>

                {/* Floating Badge 3: Corporate Recruiters */}
                <div className="hero-floating-badge badge-recruiters card-float">
                  <div className="badge-crest-thumb">
                    <Building2 size={18} className="text-emerald" />
                  </div>
                  <div>
                    <strong>120+ Top Recruiters</strong>
                    <small>Maruti, TCS, L&amp;T, Schneider</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================================
              HERO METRIC COUNTER STRIP (Generous Breathing Space)
              ==================================================================== */}
          <div className="hero-intersect-stats-card poly-reveal" ref={statsRef}>
            <div className="intersect-stats-grid">
              <div className="intersect-stat-item">
                <div className="stat-icon-circle green">
                  <Trophy size={22} className="text-emerald" />
                </div>
                <div className="stat-meta-stack">
                  <span className="stat-value">Top Ranked</span>
                  <strong className="stat-main-label">University Polytechnic</strong>
                  <small className="stat-sub-label">#1 in Western UP &amp; Delhi-NCR</small>
                </div>
              </div>

              <div className="intersect-stat-item">
                <div className="stat-icon-circle blue">
                  <BookOpen size={22} className="text-royal" />
                </div>
                <div className="stat-meta-stack">
                  <span className="stat-value">{useCountUp(50, statsSeen)}+</span>
                  <strong className="stat-main-label">Academic Programs &amp; Labs</strong>
                  <small className="stat-sub-label">AICTE Approved Engineering Courses</small>
                </div>
              </div>

              <div className="intersect-stat-item">
                <div className="stat-icon-circle purple">
                  <Users size={22} className="text-purple" />
                </div>
                <div className="stat-meta-stack">
                  <span className="stat-value">{useCountUp(10000, statsSeen)}+</span>
                  <strong className="stat-main-label">Active Students &amp; Alumni</strong>
                  <small className="stat-sub-label">Global Technical Network</small>
                </div>
              </div>

              <div className="intersect-stat-item">
                <div className="stat-icon-circle amber">
                  <TrendingUp size={22} className="text-amber" />
                </div>
                <div className="stat-meta-stack">
                  <span className="stat-value">{useCountUp(95, statsSeen)}%</span>
                  <strong className="stat-main-label">Graduate Employment Rate</strong>
                  <small className="stat-sub-label">Over 120+ Corporate Recruiters</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. INSTITUTIONAL INTRODUCTION ("A Place to Learn, Grow and Belong")
          ==================================================================== */}
      <section id="about" className="institutional-about-section">
        <div className="home-content-wrapper">
          <div className="about-split-showcase">
            {/* Left Campus Visual Showcase */}
            <div className="about-visual-column poly-reveal">
              <div className="about-large-photo-box">
                <Img src={IMG.aboutCampus} alt="Subharti Polytechnic College Main Academic Building" className="about-primary-img" />
                <div className="about-photo-gradient-overlay" />
                <div className="about-floating-experience-pill card-float">
                  <span className="exp-big-number">15+</span>
                  <div className="exp-text-stack">
                    <strong>Years of Leadership</strong>
                    <small>Educating Engineers Since 2008</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Column: Deep Blue / Emerald Signature Container */}
            <div className="about-narrative-container poly-reveal">
              <div className="about-narrative-inner">
                <div className="badge-modern-pill on-dark">
                  <ShieldCheck size={13} className="text-cyan" />
                  <span>ABOUT SUBHARTI POLYTECHNIC</span>
                </div>

                <h2 className="about-editorial-heading">
                  A Place to Learn,
                  <br />
                  Grow and Belong
                </h2>

                <p className="about-narrative-lead">
                  At Subharti Polytechnic, we believe engineering education is more than just completing a degree —
                  it is a journey of self-discovery, workshop discipline, and technological purpose.
                  Our diverse community, expert faculty mentors, and modern facilities create the perfect launchpad for your career.
                </p>

                {/* 3 Value Pillars */}
                <div className="about-pillars-stack poly-reveal-stagger">
                  <div className="about-pillar-row">
                    <div className="pillar-icon-box">
                      <School size={20} />
                    </div>
                    <div>
                      <strong className="pillar-title">Modern Campus &amp; High-Tech Labs</strong>
                      <p className="pillar-desc">50+ specialized engineering laboratories and industrial CNC bays equipped for hands-on learning.</p>
                    </div>
                  </div>

                  <div className="about-pillar-row">
                    <div className="pillar-icon-box">
                      <Users size={20} />
                    </div>
                    <div>
                      <strong className="pillar-title">Expert Faculty &amp; Industry Mentors</strong>
                      <p className="pillar-desc">Experienced academicians and practicing engineers who mentor every candidate toward technical mastery.</p>
                    </div>
                  </div>

                  <div className="about-pillar-row">
                    <div className="pillar-icon-box">
                      <Globe size={20} />
                    </div>
                    <div>
                      <strong className="pillar-title">Global Placement Opportunities</strong>
                      <p className="pillar-desc">Continuous career counseling, corporate internships, and annual recruitment drives by leading MNCs.</p>
                    </div>
                  </div>
                </div>

                <div className="about-actions-row">
                  <button
                    type="button"
                    className="btn-white-solid"
                    onClick={() => scrollTo("departments")}
                  >
                    <span>Explore Diploma Programs</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-glass-on-dark"
                    onClick={() => setEnquiryOpen(true)}
                  >
                    <span>Contact Admissions Desk</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. ACADEMIC PROGRAMS SHOWCASE ("Explore Our Academic Programs")
          ==================================================================== */}
      <section id="departments" className="academic-programs-section">
        <div className="home-content-wrapper">
          <SectionHeading
            badge="OUR ACADEMIC PROGRAMS"
            title="Explore Our Engineering Departments"
            subtitle="Industry-tailored diploma curriculums designed to provide hands-on workshop immersion, laboratory testing, and core engineering mastery."
            center
          />

          {/* Category Filter Pills (Reference Image Exact Matching) */}
          <div className="programs-category-tabs-bar" role="tablist" aria-label="Department category filter">
            {PROGRAM_CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={programCat === c.id}
                  className={`prog-cat-btn ${programCat === c.id ? "active" : ""}`}
                  onClick={() => setProgramCat(c.id)}
                >
                  <Icon size={16} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Asymmetric Spotlight Program Banner */}
          <div className="featured-department-spotlight-card poly-reveal">
            <div className="spotlight-photo-col">
              <Img
                src={DEPTS[selectedDept].photo}
                alt={DEPTS[selectedDept].name}
                className="spotlight-branch-img"
              />
              <div className="spotlight-tag-badge">
                <Sparkles size={14} className="text-amber" />
                <span>Hands-on Learning: Real-World Industry Skills</span>
              </div>
            </div>

            <div className="spotlight-info-col">
              <div className="spotlight-header-meta">
                <span className="spotlight-branch-code">{DEPTS[selectedDept].code}</span>
                <span className="spotlight-seats-chip">{DEPTS[selectedDept].seats} Available</span>
                <div className="spotlight-rating-pill">
                  <Star size={13} className="fill-amber text-amber" />
                  <span>{DEPTS[selectedDept].rating.toFixed(1)} / 5.0</span>
                </div>
              </div>

              <h3 className="spotlight-department-title">{DEPTS[selectedDept].name}</h3>
              <p className="spotlight-tagline">{DEPTS[selectedDept].tag}</p>
              <p className="spotlight-description">{DEPTS[selectedDept].desc}</p>

              {/* Lab Highlights */}
              <div className="spotlight-labs-cloud">
                <strong className="labs-cloud-heading">Key Laboratory bays:</strong>
                <div className="labs-chips-wrap">
                  {DEPTS[selectedDept].labs.map((lab, i) => (
                    <span key={i} className="lab-chip-pill">
                      <CheckCircle2 size={12} className="text-royal" />
                      <span>{lab}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Salary & Recruiters */}
              <div className="spotlight-career-strip">
                <div className="career-metric">
                  <span className="career-lbl">Average Placement</span>
                  <strong className="career-val">{DEPTS[selectedDept].avgSalary}</strong>
                </div>
                <div className="career-sep" />
                <div className="career-metric">
                  <span className="career-lbl">Top Recruiters</span>
                  <strong className="career-val">{DEPTS[selectedDept].recruiters.slice(0, 3).join(", ")}</strong>
                </div>
              </div>

              <div className="spotlight-actions-row">
                <button
                  type="button"
                  className="btn-primary-royal"
                  onClick={() => scrollTo("admission")}
                >
                  <span>Apply for This Branch</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  className="btn-outline-royal"
                  onClick={() => {
                    setCompareDept1(selectedDept);
                    setCompareDept2((selectedDept + 1) % DEPTS.length);
                    setCompareOpen(true);
                  }}
                >
                  <SlidersHorizontal size={15} />
                  <span>Compare Branches</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid of All 5 Diploma Programs */}
          <div className="programs-cards-grid poly-reveal-stagger">
            {filteredDepts.map((d, index) => {
              const Icon = d.icon;
              const isSelected = selectedDept === index;
              return (
                <article
                  key={d.code}
                  className={`modern-program-card ${isSelected ? "selected-active" : ""}`}
                  onClick={() => setSelectedDept(index)}
                >
                  <div className="prog-card-top-thumb">
                    <Img src={d.photo} alt={d.name} className="prog-thumb-img" />
                    <span className="prog-card-duration-badge">{d.duration}</span>
                  </div>

                  <div className="prog-card-body">
                    <div className="prog-card-header">
                      <div className="prog-icon-pill">
                        <Icon size={18} />
                      </div>
                      <span className="prog-branch-code">{d.code}</span>
                    </div>

                    <h4 className="prog-card-title">{d.name}</h4>
                    <p className="prog-card-tag">{d.tag}</p>
                    <p className="prog-card-excerpt">{d.desc.slice(0, 110)}...</p>

                    <div className="prog-card-footer">
                      <button
                        type="button"
                        className="prog-explore-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDept(index);
                          window.scrollTo({ top: document.getElementById("departments").offsetTop + 200, behavior: "smooth" });
                        }}
                      >
                        <span>View Department Details</span>
                        <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          CURRICULUM & CERTIFICATION ROADMAP
          ==================================================================== */}
      <section id="curriculum" className="curriculum-roadmap-section poly-reveal">
        <div className="home-content-wrapper">
          <SectionHeading
            badge="6-SEMESTER DIPLOMA SYLLABUS"
            title="Industry-Aligned Engineering Curriculum"
            subtitle="Explore our comprehensive course breakdown semester-by-semester across core theory, practical hands-on laboratories, and embedded industrial certifications."
            center
          />

          <div className="curriculum-controls-bar">
            {/* Branch Selector Tabs */}
            <div className="curriculum-branch-tabs" role="tablist" aria-label="Branch curriculum tabs">
              {[
                { id: "cse", label: "Computer Science (CSE)", icon: Cpu },
                { id: "me", label: "Mechanical (ME)", icon: Cog },
                { id: "ee", label: "Electrical (EE)", icon: Zap },
                { id: "ce", label: "Civil (CE)", icon: Building2 },
                { id: "ece", label: "Electronics (ECE)", icon: Radio }
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="tab"
                    aria-selected={curriculumBranch === b.id}
                    className={`curriculum-branch-btn ${curriculumBranch === b.id ? "active" : ""}`}
                    onClick={() => {
                      setCurriculumBranch(b.id);
                      setCurriculumSem(1);
                    }}
                  >
                    <Icon size={16} />
                    <span>{b.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Semester Number Switcher */}
            <div className="curriculum-sem-pills">
              {[1, 2, 3, 4, 5, 6].map((semNum) => (
                <button
                  key={semNum}
                  type="button"
                  className={`sem-pill-btn ${curriculumSem === semNum ? "active" : ""}`}
                  onClick={() => setCurriculumSem(semNum)}
                >
                  Semester 0{semNum}
                </button>
              ))}
            </div>
          </div>

          {/* Active Semester Overview Card */}
          {(() => {
            const branchData = CURRICULUM_DATA[curriculumBranch] || CURRICULUM_DATA.cse;
            const currentSemester = branchData.semesters.find((s) => s.sem === curriculumSem) || branchData.semesters[0];

            return (
              <>
                <div className="semester-overview-card poly-reveal">
                  <div>
                    <span className="sem-number-badge">Semester {currentSemester.sem} • {branchData.name}</span>
                    <h3 className="sem-title-heading">{currentSemester.title}</h3>
                  </div>

                  <div className="sem-overview-stats">
                    <div className="sem-stat-badge">
                      <GraduationCap size={16} className="text-cyan" />
                      <span><strong>{currentSemester.credits}</strong> Total Credits</span>
                    </div>
                    <div className="sem-stat-badge">
                      <Clock size={16} className="text-amber" />
                      <span><strong>{currentSemester.theoryHours}h</strong> Theory / <strong>{currentSemester.labHours}h</strong> Lab</span>
                    </div>
                    <div className="sem-cert-highlight">
                      <Sparkles size={16} className="text-amber" />
                      <span>{currentSemester.certBadge}</span>
                    </div>
                  </div>
                </div>

                {/* Grid of Subject Modules */}
                <div className="curriculum-subjects-grid poly-reveal-stagger">
                  {currentSemester.subjects.map((subj) => (
                    <article key={subj.code} className="subject-course-card">
                      <div className="subject-code-row">
                        <span className="sub-code-tag">{subj.code}</span>
                        <span className="sub-credits-pill">{subj.credits} Credits</span>
                        <span className="sub-type-badge">{subj.type}</span>
                      </div>
                      <h4 className="subject-course-title">{subj.title}</h4>
                      <p className="subject-topics-text">{subj.topics}</p>
                      <div className="subject-card-footer">
                        <button
                          type="button"
                          className="btn-view-syllabus"
                          onClick={() => {
                            setSelectedSubject(subj);
                            setCurriculumModal(true);
                          }}
                        >
                          <span>View Syllabus Specs</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            );
          })()}

          {/* Curriculum Download Banner */}
          <div className="curriculum-download-banner poly-reveal">
            <div className="download-banner-info">
              <FileCheck size={32} className="text-royal flex-shrink-0" />
              <div>
                <h4>Download Complete AICTE Engineering Syllabus PDF</h4>
                <p>Includes grading rubrics, continuous evaluation scheme, laboratory journals, and recommended reference textbooks.</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary-royal"
              onClick={() => alert(`Downloading AICTE curriculum booklet for ${curriculumBranch.toUpperCase()} Engineering...`)}
            >
              <Download size={16} />
              <span>Download Syllabus (PDF)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. OUR IMPACT IN NUMBERS (Cinematic Dark Section - Reference Match)
          ==================================================================== */}
      <section className="impact-numbers-section">
        <div className="impact-backdrop-mesh" />
        <div className="home-content-wrapper">
          <div className="impact-content-layout">
            <div className="impact-intro-header">
              <span className="badge-modern-pill on-dark">
                <Activity size={13} className="text-cyan" />
                <span>INSTITUTIONAL BENCHMARKS</span>
              </span>
              <h2 className="impact-main-heading">Our Impact in Numbers</h2>
              <p className="impact-sub-heading">Years of technical excellence, thousands of careers launched, one dedicated polytechnic.</p>
            </div>

            <div className="impact-meters-grid">
              {IMPACT_METRICS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="impact-meter-card">
                    <div className="meter-icon-wrap">
                      <Icon size={24} className="text-cyan" />
                    </div>
                    <div className="meter-val-row">
                      <span className="meter-count">{useCountUp(item.val, statsSeen)}</span>
                      <span className="meter-suffix">{item.suffix}</span>
                    </div>
                    <strong className="meter-label">{item.label}</strong>
                    <p className="meter-sub">{item.sub}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. CAMPUS INFRASTRUCTURE & FACILITIES
          ==================================================================== */}
      <section id="facilities" className="infrastructure-facilities-section">
        <div className="home-content-wrapper">
          <SectionHeading
            badge="CAMPUS INFRASTRUCTURE"
            title="Spaces Engineered for Innovation"
            subtitle="Our modern campus provides state-of-the-art laboratories, industrial workshops, and collaborative athletic facilities that foster rigorous learning."
            center
          />

          <div className="facilities-bento-grid poly-reveal-stagger">
            {FACILITIES.map((fac, idx) => {
              const Icon = fac.icon;
              return (
                <div key={idx} className={`facility-bento-tile tile-${idx + 1}`}>
                  <div className="facility-photo-wrap">
                    <Img src={IMG[fac.key]} alt={fac.title} className="facility-bg-img" />
                    <div className="facility-photo-gradient" />
                    <span className="facility-spec-pill">{fac.spec}</span>
                  </div>

                  <div className="facility-caption-box">
                    <div className="facility-icon-pill">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="facility-title">{fac.title}</h4>
                      <p className="facility-desc">{fac.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          INTERACTIVE CAMPUS 360° MAP & VIRTUAL HOTSPOTS
          ==================================================================== */}
      <section id="campus-tour-360" className="campus-interactive-map-section poly-reveal">
        <div className="home-content-wrapper">
          <SectionHeading
            badge="VIRTUAL CAMPUS EXPLORER"
            title="360° Interactive Campus & Laboratory Tour"
            subtitle="Click on any glowing beacon across our campus blueprint to explore our industrial machine shops, high-performance computing centers, and athletics grounds in full 360° view."
            center
          />

          {/* Category Filter Pills */}
          <div className="hotspot-filter-pills" role="tablist" aria-label="Campus hotspots category filter">
            {["All", "Academic", "Lab", "Workshop", "Amenities"].map((f) => (
              <button
                key={f}
                type="button"
                className={`hotspot-cat-btn ${hotspotFilter === f ? "active" : ""}`}
                onClick={() => setHotspotFilter(f)}
              >
                {f === "All" ? "All Campus Zones" : `${f} Facilities`}
              </button>
            ))}
          </div>

          <div className="interactive-campus-stage">
            {/* Campus Blueprint Map Frame with Beacon Pins */}
            <div className="campus-blueprint-map-frame">
              <Img
                src="/subharti-polytechnic-main-building.jpg"
                alt="Subharti Polytechnic Campus Aerial Blueprint"
                className="campus-aerial-bg"
              />
              <div className="map-grid-overlay" />

              {/* Hotspot Beacons */}
              {CAMPUS_HOTSPOTS.filter(
                (h) => hotspotFilter === "All" || h.category === hotspotFilter
              ).map((h) => {
                const isActive = activeHotspot.id === h.id;
                return (
                  <div
                    key={h.id}
                    className={`map-beacon-pin ${isActive ? "active" : ""}`}
                    style={{ left: `${h.x}%`, top: `${h.y}%` }}
                    onClick={() => setActiveHotspot(h)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${h.name}`}
                  >
                    <div className="beacon-radar-ring" />
                    <div className="beacon-core-dot" />
                    <span className="beacon-label-tooltip">{h.name}</span>
                  </div>
                );
              })}
            </div>

            {/* Selected Hotspot Details Card */}
            <div className="hotspot-details-panel">
              <div className="hotspot-photo-frame">
                <Img
                  src={activeHotspot.image}
                  alt={activeHotspot.name}
                  className="hotspot-hero-img"
                />
                <span className="hotspot-badge-tag">{activeHotspot.badge}</span>
                <span className="hotspot-category-tag">{activeHotspot.category}</span>
              </div>

              <div className="hotspot-content-body">
                <h3 className="hotspot-card-title">{activeHotspot.name}</h3>
                <p className="hotspot-card-description">{activeHotspot.description}</p>

                <div className="hotspot-specs-list">
                  {activeHotspot.specs.map((spec, i) => (
                    <div key={i} className="spec-check-item">
                      <CheckCircle2 size={14} className="text-royal flex-shrink-0" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>

                <div className="hotspot-meta-footer">
                  <div className="meta-pair">
                    <User size={14} className="text-royal flex-shrink-0" />
                    <span>In-Charge: <strong>{activeHotspot.inCharge}</strong></span>
                  </div>
                  <div className="meta-pair">
                    <Clock size={14} className="text-amber flex-shrink-0" />
                    <span>Lab Timings: <strong>{activeHotspot.hours}</strong></span>
                  </div>
                </div>

                <div className="hotspot-action-buttons">
                  <button
                    type="button"
                    className="btn-primary-royal"
                    style={{ flex: 1 }}
                    onClick={() => setHotspot360Modal(true)}
                  >
                    <Compass size={16} />
                    <span>Launch 360° Panorama</span>
                  </button>
                  <button
                    type="button"
                    className="btn-outline-royal"
                    onClick={() => setEnquiryOpen(true)}
                  >
                    <span>Book Visit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. INTERACTIVE CAMPUS PHOTO GALLERY & FULLSCREEN LIGHTBOX
          ==================================================================== */}
      <section className="campus-gallery-section">
        <div className="home-content-wrapper">
          <SectionHeading
            badge="VISUAL CAMPUS TOUR"
            title="Life at Subharti Up Close"
            subtitle="Take a visual tour through our daily laboratory experiments, workshops, student cultural fests, and athletic championships. Click any photo to enlarge."
            center
          />

          {/* Gallery Category Filter */}
          <div className="gallery-filter-pills-bar">
            {[
              { id: "all", label: "All Photos" },
              { id: "labs", label: "High-Tech Labs" },
              { id: "campus", label: "Campus Architecture" },
              { id: "life", label: "Student Life & Fests" },
              { id: "sports", label: "Sports & Athletics" }
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                className={`gal-cat-btn ${galCategory === g.id ? "active" : ""}`}
                onClick={() => setGalCategory(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Asymmetric Image Grid */}
          <div className="gallery-masonry-grid">
            {filteredGallery.map((photo, i) => (
              <div
                key={photo.id}
                className="gallery-tile-item"
                onClick={() => setLb(i)}
                role="button"
                tabIndex={0}
                aria-label={`View ${photo.title} in full screen`}
              >
                <Img src={photo.src} alt={photo.title} className="gallery-tile-img" />
                <div className="gallery-tile-overlay">
                  <div className="gal-zoom-icon-box">
                    <Compass size={22} />
                  </div>
                  <strong className="gal-photo-title">{photo.title}</strong>
                  <span className="gal-photo-spec">{photo.spec}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fullscreen HD Lightbox Modal */}
        {lb >= 0 && (
          <div className="lightbox-fullscreen-backdrop" onClick={() => setLb(-1)} role="dialog" aria-modal="true">
            <button type="button" className="lightbox-close-btn" onClick={() => setLb(-1)} aria-label="Close Lightbox">
              <X size={26} />
            </button>

            <button
              type="button"
              className="lightbox-nav-btn prev"
              onClick={(e) => {
                e.stopPropagation();
                stepLightbox(-1);
              }}
              aria-label="Previous Photo"
            >
              <ChevronLeft size={28} />
            </button>

            <div className="lightbox-image-stage" onClick={(e) => e.stopPropagation()}>
              <Img src={COLLEGE.gallery[lb]?.src} alt={COLLEGE.gallery[lb]?.title} className="lightbox-active-img" />
              <div className="lightbox-caption-strip">
                <div>
                  <strong>{COLLEGE.gallery[lb]?.title}</strong>
                  <p>{COLLEGE.gallery[lb]?.spec} • Subharti Polytechnic Meerut</p>
                </div>
                <span className="lightbox-counter-badge">
                  {lb + 1} / {COLLEGE.gallery.length}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="lightbox-nav-btn next"
              onClick={(e) => {
                e.stopPropagation();
                stepLightbox(1);
              }}
              aria-label="Next Photo"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        )}
      </section>

      {/* ====================================================================
          STUDENT INNOVATION CAPSTONES & PATENTS
          ==================================================================== */}
      <section id="projects" className="student-innovation-projects-section poly-reveal">
        <div className="home-content-wrapper">
          <SectionHeading
            badge="STUDENT INNOVATION HUB"
            title="Award-Winning Capstone Engineering Projects"
            subtitle="Under the guidance of faculty mentors and industry advisors, our diploma students design real working prototypes, patent-filed technologies, and hackathon championship solutions."
            center
          />

          <div className="projects-cards-grid poly-reveal-stagger">
            {STUDENT_PROJECTS.map((proj) => (
              <article key={proj.id} className="project-innovation-card">
                <div className="project-image-box">
                  <Img src={proj.image} alt={proj.title} className="proj-photo" />
                  <span className="proj-award-badge">
                    <Trophy size={13} className="text-amber" />
                    <span>{proj.award}</span>
                  </span>
                  <span className="proj-status-chip">{proj.status}</span>
                </div>

                <div className="project-card-content">
                  <span className="proj-dept-label">{proj.dept}</span>
                  <h3 className="proj-title">{proj.title}</h3>
                  <p className="proj-desc">{proj.description}</p>

                  <div className="proj-metrics-row">
                    {Object.entries(proj.metrics).map(([k, v]) => (
                      <div key={k} className="proj-metric-cell">
                        <span className="metric-k">{k.replace(/([A-Z])/g, " $1")}</span>
                        <strong className="metric-v">{v}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="proj-tech-chips">
                    {proj.techStack.map((tech, i) => (
                      <span key={i} className="tech-chip-tag">{tech}</span>
                    ))}
                  </div>

                  <div className="proj-team-footer">
                    <span className="team-text">
                      Team: <strong>{proj.team.slice(0, 2).join(", ")} +{proj.team.length - 2}</strong>
                    </span>
                    <button
                      type="button"
                      className="btn-proj-view"
                      onClick={() => {
                        setActiveProject(proj);
                        setProjectModal(true);
                      }}
                    >
                      <span>Explore Project Specs</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. PLACEMENTS & CAREER SHOWCASE ("Hall of Fame")
          ==================================================================== */}
      <section id="placements" className="placements-hall-of-fame-section poly-reveal">
        <div className="home-content-wrapper">
          <SectionHeading
            badge="CAREER ACHIEVEMENTS"
            title="Our Students, Their Global Success"
            subtitle="Our active Training and Placement Cell partners with leading industrial organizations and technology firms to prepare skilled diploma engineers."
            center
          />

          <div className="placements-spotlight-card">
            <div className="ps-left-metrics-panel">
              <div className="badge-modern-pill">
                <Trophy size={13} className="text-amber" />
                <span>ANNUAL RECRUITMENT BENCHMARKS</span>
              </div>
              <h3 className="ps-panel-title">Industry Recruiter Network</h3>
              <p className="ps-panel-lead">
                Every year, our final-year diploma candidates secure prestigious positions across top Indian and international engineering leaders.
              </p>

              <div className="ps-key-numbers-row">
                <div className="ps-num-box">
                  <strong>₹ 7.8 LPA</strong>
                  <small>Highest Package Offered</small>
                </div>
                <div className="ps-num-box">
                  <strong>120+</strong>
                  <small>Corporate Recruiters</small>
                </div>
                <div className="ps-num-box">
                  <strong>96%</strong>
                  <small>Placement Drive Ratio</small>
                </div>
              </div>

              {/* Student Quick Switcher Thumbnails */}
              <div className="ps-candidate-tray-selector">
                <span className="tray-label">Featured Candidates:</span>
                <div className="tray-thumbs-row">
                  {COLLEGE.students.slice(0, 6).map((st, idx) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`tray-thumb-btn ${idx === placementSlide ? "active" : ""}`}
                      onClick={() => setPlacementSlide(idx)}
                      title={`View ${st.name} (${st.company})`}
                    >
                      <Img src={st.photo} alt={st.name} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="ps-carousel-controls">
                <button
                  type="button"
                  className="ctl-round-btn"
                  onClick={() => setPlacementSlide((p) => (p - 1 + COLLEGE.students.length) % COLLEGE.students.length)}
                  aria-label="Previous Candidate"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="ctl-text-badge">
                  Candidate <b>{placementSlide + 1}</b> of <b>{COLLEGE.students.length}</b>
                </span>
                <button
                  type="button"
                  className="ctl-round-btn"
                  onClick={() => setPlacementSlide((p) => (p + 1) % COLLEGE.students.length)}
                  aria-label="Next Candidate"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Right Candidate Profile Frame */}
            <div className="ps-right-profile-stage">
              <div className="candidate-showcase-box">
                <div className="candidate-photo-frame">
                  <Img
                    src={COLLEGE.students[placementSlide].photo}
                    alt={COLLEGE.students[placementSlide].name}
                    className="candidate-full-photo"
                  />
                  <div className="candidate-company-stamp">
                    <span>{COLLEGE.students[placementSlide].company}</span>
                  </div>
                </div>

                <div className="candidate-meta-details">
                  <div className="candidate-pkg-badge">
                    <Sparkles size={13} className="text-amber" />
                    <span>{COLLEGE.students[placementSlide].pkg} Annual Package</span>
                  </div>
                  <h4 className="candidate-name">{COLLEGE.students[placementSlide].name}</h4>
                  <p className="candidate-role">
                    {COLLEGE.students[placementSlide].role} • {COLLEGE.students[placementSlide].branch} Engineering
                  </p>
                  <div className="candidate-verified-chip">
                    <CheckCircle2 size={13} className="text-royal" />
                    <span>Verified Subharti Polytechnic Placement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          DISTINGUISHED FACULTY & RESEARCH MENTORS
          ==================================================================== */}
      <section id="faculty" className="distinguished-faculty-section poly-reveal">
        <div className="home-content-wrapper">
          <SectionHeading
            badge="ACADEMIC LEADERSHIP"
            title="Distinguished Faculty & Research Mentors"
            subtitle="Learn directly from doctorate professors, senior toolmakers, and industry consultants with decades of practical engineering expertise."
            center
          />

          <div className="faculty-cards-grid poly-reveal-stagger">
            {FACULTY_MEMBERS.map((fac, idx) => (
              <article key={idx} className="faculty-profile-card">
                <div className="faculty-header-stage">
                  <Img src={fac.image} alt={fac.name} className="fac-portrait" />
                  <div className="fac-rating-pill">
                    <Star size={12} className="fill-amber text-amber" />
                    <span>{fac.rating.toFixed(2)}</span>
                  </div>
                </div>

                <div className="fac-content-body">
                  <span className="fac-dept-tag">{fac.dept}</span>
                  <h4 className="fac-name">{fac.name}</h4>
                  <span className="fac-role">{fac.role}</span>
                  <p className="fac-qual"><strong>Edu:</strong> {fac.qualification}</p>
                  <p className="fac-exp"><strong>Experience:</strong> {fac.experience}</p>
                  <p className="fac-papers"><strong>Research:</strong> {fac.papers}</p>

                  <div className="fac-actions-row">
                    <button
                      type="button"
                      className="btn-fac-consult"
                      onClick={() => {
                        setSelectedFaculty(fac);
                        setFacultyModal(true);
                      }}
                    >
                      <UserCheck size={14} />
                      <span>Book 1-on-1 Mentorship</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          STUDENT SOCIETIES, CLUBS & TECHNOVISION TECH FEST
          ==================================================================== */}
      <section id="clubs" className="student-societies-clubs-section poly-reveal">
        <div className="home-content-wrapper">
          {/* TechnoVision Tech Fest Flagship Banner */}
          <div className="tech-fest-hero-banner poly-reveal">
            <div>
              <span className="fest-edition-pill">ANNUAL STATE TECHNICAL SYMPOSIUM</span>
              <h3 className="fest-title">TechnoVision 2026</h3>
              <p className="fest-desc">
                Western Uttar Pradesh's largest student technology fest featuring Autonomous RoboWars, 24-Hour Code-Jam, Drone Racing, Model CAD Expo, and ₹ 2,00,000 in cash prizes.
              </p>
              <div className="fest-countdown-row">
                <div className="time-block">
                  <span className="time-val">18</span>
                  <span className="time-lbl">Days</span>
                </div>
                <div className="time-block">
                  <span className="time-val">09</span>
                  <span className="time-lbl">Hours</span>
                </div>
                <div className="time-block">
                  <span className="time-val">42</span>
                  <span className="time-lbl">Mins</span>
                </div>
                <div className="time-block">
                  <span className="time-val">15</span>
                  <span className="time-lbl">Secs</span>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                className="btn-white-solid"
                onClick={() => alert("Redirecting to TechnoVision 2026 Registration Portal...")}
              >
                <Sparkles size={16} className="text-amber" />
                <span>Register for Events & RoboWars</span>
              </button>
            </div>
          </div>

          <SectionHeading
            badge="CAMPUS CLUBS & CO-CURRICULAR"
            title="Thriving Student Societies & Technical Wings"
            subtitle="Engage in peer-led hackathons, automotive kart testing, drone engineering, and clean green energy audits outside the classroom."
            center
          />

          <div className="student-clubs-grid poly-reveal-stagger">
            {STUDENT_CLUBS.map((club) => (
              <article key={club.id} className="club-society-card">
                <div className="club-card-header">
                  <span className="club-dept-pill">{club.dept}</span>
                  <span className="club-members-count">
                    <Users size={13} /> {club.members}+
                  </span>
                </div>
                <h4 className="club-name">{club.name}</h4>
                <p className="club-motto">"{club.motto}"</p>

                <div className="club-highlights-list">
                  {club.highlights.map((h, i) => (
                    <div key={i} className="club-highlight-item">
                      <CheckCircle2 size={12} className="text-royal flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <div className="club-meeting-info">
                  <Clock size={12} />
                  <span>{club.meetingTime}</span>
                </div>

                <div className="club-card-footer">
                  <span className="lead-tag">Lead: <strong>{club.lead}</strong></span>
                  <button
                    type="button"
                    className="btn-join-club"
                    onClick={() => alert(`Registration request for ${club.name} received!`)}
                  >
                    <span>Join Club</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. VERIFIED TESTIMONIALS ("Real Stories. Lasting Impact." - Reference Match)
          ==================================================================== */}
      <section className="testimonials-community-section" onMouseEnter={() => setPauseReviews(true)} onMouseLeave={() => setPauseReviews(false)}>
        <div className="home-content-wrapper">
          <SectionHeading
            badge="COMMUNITY PERSPECTIVES"
            title="Real Stories. Lasting Impact."
            subtitle="Hear directly from our students, alumni, and faculty mentors about their daily academic experience at Subharti Polytechnic."
            center
          />

          <div className="testimonials-carousel-card">
            <div className="review-quote-watermark">
              <Quote size={80} />
            </div>

            <div className="review-stars-row">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className="fill-amber text-amber" />
              ))}
            </div>

            <blockquote className="review-quote-text">
              "{REVIEWS[revSlide].quote}"
            </blockquote>

            <div className="review-author-meta-row">
              <div className="author-avatar-circle">
                <Img src={REVIEWS[revSlide].avatar} alt={REVIEWS[revSlide].author} />
              </div>
              <div className="author-details-stack">
                <div className="author-name-row">
                  <strong className="author-name">{REVIEWS[revSlide].author}</strong>
                  {REVIEWS[revSlide].verified && (
                    <span className="author-verified-tag" title="Verified Campus Review">
                      <CheckCircle2 size={13} className="text-royal" /> Verified
                    </span>
                  )}
                </div>
                <span className="author-role-batch">{REVIEWS[revSlide].role} • {REVIEWS[revSlide].batch}</span>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="review-dots-bar" role="tablist" aria-label="Review selector">
              {REVIEWS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === revSlide}
                  className={`review-dot-btn ${i === revSlide ? "active" : ""}`}
                  onClick={() => setRevSlide(i)}
                  aria-label={`View review from ${REVIEWS[i].author}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          9. UPCOMING EVENTS & LIVE NOTICES ("Don't Miss Out" - Reference Match)
          ==================================================================== */}
      <section id="notices" className="events-notices-split-section poly-reveal">
        <div className="home-content-wrapper">
          <div className="events-notices-split-grid">
            {/* Left: Upcoming Events */}
            <div className="events-column">
              <div className="column-top-header">
                <div>
                  <div className="badge-modern-pill">
                    <Calendar size={13} className="text-royal" />
                    <span>UPCOMING EVENTS</span>
                  </div>
                  <h3 className="column-section-title">Don't Miss Out</h3>
                </div>
                <button
                  type="button"
                  className="link-with-arrow"
                  onClick={() => scrollTo("admission")}
                >
                  <span>View All Events</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="events-cards-list">
                {UPCOMING_EVENTS.map((ev) => (
                  <div key={ev.id} className="modern-event-card">
                    <div className="event-date-block">
                      <span className="date-day">{ev.day}</span>
                      <span className="date-month">{ev.month}</span>
                    </div>

                    <div className="event-info-stack">
                      <div className="event-meta-top">
                        <span className="event-category-chip">{ev.category}</span>
                        <span className="event-time-badge">
                          <Clock size={12} /> {ev.time}
                        </span>
                      </div>
                      <h4 className="event-title">{ev.title}</h4>
                      <p className="event-venue">
                        <MapPin size={13} className="text-royal" />
                        <span>{ev.venue}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Official Notice Bulletin with Search & Category Filter */}
            <div className="notices-column">
              <div className="column-top-header">
                <div>
                  <div className="badge-modern-pill">
                    <Bell size={13} className="text-amber" />
                    <span>OFFICIAL NOTICES</span>
                  </div>
                  <h3 className="column-section-title">Latest Announcements</h3>
                </div>
              </div>

              {/* Notice Search & Filter */}
              <div className="notice-search-strip">
                <div className="notice-input-wrap">
                  <Search size={15} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search circulars, exams..."
                    value={noticeSearch}
                    onChange={(e) => setNoticeSearch(e.target.value)}
                    className="notice-search-field"
                  />
                  {noticeSearch && (
                    <button type="button" className="clear-search-btn" onClick={() => setNoticeSearch("")}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="notice-category-scroll">
                  {NOTICE_CATS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`notice-filter-btn ${cat === c ? "active" : ""}`}
                      onClick={() => setCat(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notices List */}
              <div className="notices-items-scrollable">
                {filteredNotices.length > 0 ? (
                  filteredNotices.map((n) => (
                    <article key={n.id} className="modern-notice-card">
                      <div className="notice-card-header">
                        <span className="notice-cat-tag">{n.cat}</span>
                        <span className="notice-priority-badge">{n.priority}</span>
                        <small className="notice-date-text">
                          <Clock size={11} /> {n.date}
                        </small>
                      </div>
                      <h4 className="notice-headline">{n.title}</h4>
                      <p className="notice-body-text">{n.text}</p>
                      <div className="notice-foot-action">
                        <a href="#circular" onClick={(e) => e.preventDefault()} className="notice-download-btn">
                          <Download size={13} />
                          <span>Download Circular (PDF)</span>
                        </a>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="no-notices-found">
                    <Info size={24} className="text-royal" />
                    <p>No circulars matching your search query.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          INTERACTIVE FEE CALCULATOR & MERIT SCHOLARSHIPS
          ==================================================================== */}
      <section id="fee-calculator" className="fee-scholarship-calculator-section poly-reveal">
        <div className="home-content-wrapper">
          <SectionHeading
            badge="TRANSPARENT TUITION ESTIMATOR"
            title="Interactive Fee & Scholarship Calculator"
            subtitle="Calculate your exact net tuition fee including academic merit waivers, girl student scholarships, wards of defense benefits, and optional hostel accommodations."
            center
          />

          <div className="fee-calculator-card-stage">
            {/* Left Configuration Column */}
            <div className="calculator-controls-panel">
              <h3 className="calc-subheading">Configure Your Enrollment Details</h3>

              {/* Admission Track Toggle */}
              <div className="calc-form-group">
                <label className="calc-label">Admission Category:</label>
                <div className="track-radio-group">
                  <button
                    type="button"
                    className={`track-toggle-btn ${calcTrack === "regular" ? "active" : ""}`}
                    onClick={() => setCalcTrack("regular")}
                  >
                    <strong>3-Year Regular Diploma</strong>
                    <span>After 10th Standard (Sem 1 Admission)</span>
                  </button>
                  <button
                    type="button"
                    className={`track-toggle-btn ${calcTrack === "lateral" ? "active" : ""}`}
                    onClick={() => setCalcTrack("lateral")}
                  >
                    <strong>Direct 2nd Year Lateral Entry</strong>
                    <span>After 12th PCM / 2-Yr ITI (Sem 3 Admission)</span>
                  </button>
                </div>
              </div>

              {/* Engineering Branch Selector */}
              <div className="calc-form-group">
                <label className="calc-label">Choose Engineering Branch:</label>
                <div className="calc-branch-pills">
                  {[
                    { id: "cse", code: "CSE", name: "Computer Science" },
                    { id: "me", code: "ME", name: "Mechanical" },
                    { id: "ee", code: "EE", name: "Electrical" },
                    { id: "ce", code: "CE", name: "Civil" },
                    { id: "ece", code: "ECE", name: "Electronics" }
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`calc-branch-btn ${calcBranch === b.id ? "active" : ""}`}
                      onClick={() => setCalcBranch(b.id)}
                    >
                      <span className="branch-key-code">{b.code}</span>
                      <span className="branch-key-name">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Academic Percentage Slider */}
              <div className="calc-form-group">
                <div className="slider-header-row">
                  <label className="calc-label" style={{ marginBottom: 0 }}>
                    10th / 12th / ITI Aggregate Marks:
                  </label>
                  <span className="score-live-val">{calcScore}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={calcScore}
                  onChange={(e) => setCalcScore(Number(e.target.value))}
                  className="calc-range-slider"
                />
                <div className="slider-tiers-row">
                  <span className={calcScore < 70 ? "active-tier" : ""}>Affiliated Standard</span>
                  <span className={calcScore >= 70 && calcScore < 80 ? "active-tier" : ""}>25% Waiver (70%+)</span>
                  <span className={calcScore >= 80 && calcScore < 90 ? "active-tier" : ""}>50% Waiver (80%+)</span>
                  <span className={calcScore >= 90 ? "active-tier gold" : ""}>100% Tuition Gold (90%+)</span>
                </div>
              </div>

              {/* Special Welfare Concessions */}
              <div className="calc-form-group">
                <label className="calc-label">Special Institutional Concessions:</label>
                <div className="concessions-checkboxes-stack">
                  <label className="concession-check-row">
                    <input
                      type="checkbox"
                      checked={calcGirlWaiver}
                      onChange={(e) => setCalcGirlWaiver(e.target.checked)}
                    />
                    <span>Beti Bachao Beti Padhao — Girl Student Concession (₹5,000/Yr)</span>
                  </label>
                  <label className="concession-check-row">
                    <input
                      type="checkbox"
                      checked={calcDefenseWaiver}
                      onChange={(e) => setCalcDefenseWaiver(e.target.checked)}
                    />
                    <span>Veer Parivar — Wards of Armed Forces / Ex-Servicemen (₹8,000/Yr)</span>
                  </label>
                </div>
              </div>

              {/* Optional Hostel Accommodation */}
              <div className="calc-form-group">
                <label className="calc-label">Residential Accommodation Option:</label>
                <div className="hostel-options-stack">
                  {Object.entries(FEE_STRUCTURE.hostelRates).map(([k, v]) => (
                    <div
                      key={k}
                      className={`hostel-radio-card ${calcHostel === k ? "selected" : ""}`}
                      onClick={() => setCalcHostel(k)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="hostel-opt-content">
                        <strong>{v.title}</strong>
                        <span>{v.fee === 0 ? "₹ 0 (Day Scholar)" : `₹ ${v.fee.toLocaleString("en-IN")}/Year`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Computed Fee Receipt Card */}
            <div className="computed-fee-receipt-card">
              <span className="receipt-badge">ESTIMATED ANNUAL STATEMENT</span>
              <h4 className="receipt-branch-name">{FEE_STRUCTURE[calcTrack][calcBranch].title}</h4>
              <span className="receipt-track-name">
                {calcTrack === "regular" ? "3-Year Regular Diploma (6 Semesters)" : "2-Year Lateral Entry (4 Semesters)"}
              </span>

              <div className="receipt-line-items">
                <div className="receipt-line">
                  <span>Semester Base Tuition (×2):</span>
                  <strong>₹ {(calculatedFee.baseTuition * 2).toLocaleString("en-IN")}</strong>
                </div>
                <div className="receipt-line">
                  <span>Laboratory & Workshop Facility Fee:</span>
                  <strong>₹ {(calculatedFee.baseLab * 2).toLocaleString("en-IN")}</strong>
                </div>
                <div className="receipt-line">
                  <span>University Examination & Development:</span>
                  <strong>₹ {((calculatedFee.examFee + calculatedFee.devFee) * 2).toLocaleString("en-IN")}</strong>
                </div>
                {calculatedFee.hostelFee > 0 && (
                  <div className="receipt-line">
                    <span>Hostel & Food Mess (Annual):</span>
                    <strong>₹ {calculatedFee.hostelFee.toLocaleString("en-IN")}</strong>
                  </div>
                )}
              </div>

              {/* Scholarship Callout */}
              {calculatedFee.totalWaivers > 0 && (
                <div className="scholarship-callout-row">
                  <div className="scholarship-tag-name">
                    <Sparkles size={16} className="text-amber flex-shrink-0" />
                    <span>{calculatedFee.scholarshipLabel}</span>
                  </div>
                  <strong className="scholarship-discount-amt">
                    - ₹ {calculatedFee.totalWaivers.toLocaleString("en-IN")}
                  </strong>
                </div>
              )}

              <div className="receipt-total-block">
                <div className="total-net-row">
                  <span>Net Annual Payable:</span>
                  <strong className="net-annual-amt">
                    ₹ {calculatedFee.netAnnual.toLocaleString("en-IN")}
                  </strong>
                </div>
                <div className="semester-install-row">
                  <span>Payable in 2 Installments:</span>
                  <strong className="per-sem-amt">
                    ₹ {calculatedFee.perSemesterPayable.toLocaleString("en-IN")} / Semester
                  </strong>
                </div>
              </div>

              <div className="receipt-actions">
                <button
                  type="button"
                  className="btn-primary-royal"
                  onClick={() => {
                    alert(`Scholarship certificate generated! Code: SUBHARTI-MERIT-${calcScore}`);
                    scrollTo("admission");
                  }}
                >
                  <Award size={16} />
                  <span>Lock Scholarship & Apply Now</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary-glass"
                  onClick={() => alert("Downloading official institutional fee schedule...")}
                >
                  <Download size={14} />
                  <span>Download Fee Breakdown (PDF)</span>
                </button>
              </div>

              <p className="fee-disclaimer-note">
                * Note: Fee includes university examination registration and library privileges. Caution deposit (₹5,000) is one-time refundable upon program completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          ADMISSION ELIGIBILITY & LATERAL ENTRY EVALUATOR
          ==================================================================== */}
      <section id="eligibility" className="eligibility-wizard-section poly-reveal">
        <div className="home-content-wrapper">
          <SectionHeading
            badge="INSTANT QUALIFICATION CHECK"
            title="Admission Eligibility & Lateral Entry Evaluator"
            subtitle="Enter your qualifying examination marks to instantly confirm whether you meet the AICTE, BTE UP, and SVSU eligibility criteria for regular diploma or direct second-year lateral entry."
            center
          />

          <div className="eligibility-wizard-box">
            <div className="wizard-inputs-grid">
              <div className="wizard-field-item">
                <label className="wizard-field-label">Qualifying Examination:</label>
                <select
                  value={eligQual}
                  onChange={(e) => setEligQual(e.target.value)}
                  className="wizard-select-control"
                >
                  <option value="10th">Class 10th (High School)</option>
                  <option value="12th">Class 12th PCM (Intermediate)</option>
                  <option value="iti">2-Year ITI Trade Certificate</option>
                </select>
              </div>

              <div className="wizard-field-item">
                <label className="wizard-field-label">Aggregate Percentage (%):</label>
                <input
                  type="number"
                  min="30"
                  max="100"
                  value={eligPercent}
                  onChange={(e) => setEligPercent(Number(e.target.value))}
                  className="wizard-input-control"
                  placeholder="e.g. 68"
                />
              </div>

              <div className="wizard-field-item">
                <label className="wizard-field-label">Maths & Science Marks (%):</label>
                <input
                  type="number"
                  min="30"
                  max="100"
                  value={eligMathMarks}
                  onChange={(e) => setEligMathMarks(Number(e.target.value))}
                  className="wizard-input-control"
                  placeholder="e.g. 65"
                />
              </div>

              <div className="wizard-field-item">
                <label className="wizard-field-label">Candidate Domicile:</label>
                <select
                  value={eligDomicile}
                  onChange={(e) => setEligDomicile(e.target.value)}
                  className="wizard-select-control"
                >
                  <option value="UP">Uttar Pradesh (UP Resident)</option>
                  <option value="NCR">Delhi / NCR</option>
                  <option value="Other">Other States (All-India Quota)</option>
                </select>
              </div>
            </div>

            <div className="wizard-check-action-bar">
              <button
                type="button"
                className="btn-primary-royal"
                onClick={handleCheckEligibility}
              >
                <CheckCircle2 size={18} />
                <span>Evaluate My Admission Eligibility</span>
              </button>
            </div>

            {/* Live Result State */}
            {eligResult && (
              <div className={`eligibility-result-card ${eligResult.eligible ? "status-eligible" : "status-ineligible"}`}>
                <div className="result-headline-row">
                  {eligResult.eligible ? (
                    <CheckCircle2 size={28} className="text-emerald flex-shrink-0" />
                  ) : (
                    <Info size={28} className="text-amber flex-shrink-0" />
                  )}
                  <div>
                    <h4>{eligResult.eligible ? "Eligible for Engineering Admission!" : "Requires Further Counseling"}</h4>
                    <span className="eligible-stream-title">{eligResult.stream}</span>
                  </div>
                </div>

                <p className="eligible-reason-desc">{eligResult.reason}</p>

                {eligResult.eligible && (
                  <div className="documents-checklist-stage">
                    <h5>Required Verification Documents:</h5>
                    <div className="docs-checklist-grid">
                      <div className="doc-item">
                        <Check size={14} className="text-emerald" />
                        <span>Original 10th / 12th / ITI Marksheet & Certificate</span>
                      </div>
                      <div className="doc-item">
                        <Check size={14} className="text-emerald" />
                        <span>Transfer Certificate (TC) & Migration Certificate</span>
                      </div>
                      <div className="doc-item">
                        <Check size={14} className="text-emerald" />
                        <span>Aadhaar Card or Govt. ID Proof (Self-Attested)</span>
                      </div>
                      <div className="doc-item">
                        <Check size={14} className="text-emerald" />
                        <span>5 Passport-Size Photographs with White Background</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="result-proceed-actions">
                  <button
                    type="button"
                    className="btn-primary-royal"
                    onClick={() => scrollTo("admission")}
                  >
                    <span>Proceed with Digital Application</span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-glass"
                    onClick={() => setEnquiryOpen(true)}
                  >
                    <span>Request Counseling Call</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================================
          10. ADMISSION PROCESS ("Four Simple Steps to Enroll")
          ==================================================================== */}
      <section id="admission" className="admission-process-section poly-reveal">
        <div className="home-content-wrapper">
          <SectionHeading
            badge="ADMISSIONS 2026-27"
            title="Four Simple Steps to Enroll"
            subtitle="From your initial digital application to attending your first laboratory session, our transparent admission process is simple, quick, and supported by counseling mentors."
            center
          />

          <div className="admission-timeline-container" ref={tlRef} style={{ "--f": fill }}>
            <div className="timeline-center-rail">
              <div className="timeline-rail-fill" />
            </div>

            <div className="timeline-steps-stack">
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                const isActive = fill > (idx + 0.2) / STEPS.length;
                return (
                  <div key={s.num} className={`timeline-step-row ${isActive ? "step-activated" : ""} ${idx % 2 === 0 ? "left-aligned" : "right-aligned"}`}>
                    <div className="step-card-box">
                      <div className="step-num-badge">
                        <span>Phase {s.num}</span>
                      </div>
                      <h4 className="step-card-title">{s.title}</h4>
                      <p className="step-card-desc">{s.text}</p>
                      <div className="step-tip-callout">
                        <CheckCircle size={14} className="text-royal flex-shrink-0" />
                        <small><strong>Applicant Tip:</strong> {s.tip}</small>
                      </div>
                    </div>

                    <div className="step-rail-node">
                      <div className="rail-node-circle">
                        <Icon size={18} />
                      </div>
                    </div>

                    <div className="step-spacer" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action Bar under Admission */}
          <div className="admission-lead-bar">
            <div className="lead-text-box">
              <strong>Need personal guidance selecting the right engineering branch?</strong>
              <p>Our faculty admissions counselors are available Monday to Saturday to assist candidates and parents.</p>
            </div>
            <div className="lead-actions-box">
              <button
                type="button"
                className="btn-primary-royal"
                onClick={() => setEnquiryOpen(true)}
              >
                <span>Submit Admission Enquiry</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          11. FREQUENTLY ASKED QUESTIONS (Accordion)
          ==================================================================== */}
      <section className="faq-accordion-section">
        <div className="home-content-wrapper">
          <SectionHeading
            badge="GOT QUESTIONS?"
            title="Frequently Asked Questions"
            subtitle="Clear answers to common questions about eligibility, lateral entry, curriculum, CollegeOS digital portal, and campus amenities."
            center
          />

          <div className="faq-accordion-container">
            {FAQS.map((f, i) => (
              <div key={i} className={`faq-collapsible-item ${faqOpen === i ? "is-expanded" : ""}`}>
                <button
                  type="button"
                  className="faq-question-trigger"
                  onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}
                  aria-expanded={faqOpen === i}
                >
                  <span className="faq-q-text">{f.q}</span>
                  <div className="faq-icon-pill">
                    <ChevronDown size={18} className="faq-chevron-icon" />
                  </div>
                </button>

                <div className="faq-answer-drawer">
                  <div className="faq-answer-inner">
                    <p>{f.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="faq-contact-card">
            <div className="faq-contact-text">
              <strong>Have further inquiries regarding admissions or eligibility?</strong>
              <p>Call our direct admissions desk at {CONTACT.admissionsHelpline} or email {CONTACT.admissionsEmail}</p>
            </div>
            <a href={`tel:${CONTACT.admissionsHelpline.replace(/\s+/g, "")}`} className="btn-primary-royal">
              <Phone size={15} />
              <span>Call Admissions Desk</span>
            </a>
          </div>
        </div>
      </section>

      {/* ====================================================================
          12. HIGH-IMPACT ADMISSION ENQUIRY CTA BANNER (Reference Match)
          ==================================================================== */}
      <section className="ready-journey-cta-section poly-reveal">
        <div className="cta-backdrop-image" />
        <div className="cta-blue-gradient-overlay" />
        <div className="home-content-wrapper">
          <div className="cta-inner-content-box">
            <div className="badge-modern-pill on-dark">
              <Sparkles size={13} className="text-amber" />
              <span>ADMISSIONS OPEN FOR 2026-27 SESSION</span>
            </div>

            <h2 className="cta-massive-title">
              Ready to Start Your Journey
              <br />
              at Subharti Polytechnic?
            </h2>

            <p className="cta-supporting-text">
              Get in touch with our admissions counseling team today and take the first decisive step towards a high-impact engineering career.
            </p>

            <div className="cta-action-buttons-strip">
              <button
                type="button"
                className="btn-white-massive"
                onClick={() => (onNavigate ? onNavigate("register") : (window.location.hash = "#/register"))}
              >
                <span>Apply for Admission Now</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="btn-glass-massive"
                onClick={() => setEnquiryOpen(true)}
              >
                <span>Request Prospectus &amp; Syllabus</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          13. CONTACT & ADMISSIONS DESK (MATCHING REFERENCE IMAGE - 4X ENHANCED)
          ==================================================================== */}
      <section id="contact" className="contact-reference-section">
        {/* Institutional Contact Header Banner (Building Image Backdrop + Breadcrumb) */}
        <div className="contact-banner-header">
          <div className="contact-banner-bg" aria-hidden="true">
            <img src="/subharti-polytechnic-main-building.jpg" alt="Subharti Polytechnic Campus" />
            <div className="contact-banner-gradient-overlay" />
          </div>
          <div className="home-content-wrapper contact-banner-content">
            <div className="contact-breadcrumb-nav">
              <a href="#home" onClick={(e) => { e.preventDefault(); scrollTo("home"); }}>Home</a>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">Contact Us &amp; Admissions Desk</span>
            </div>
          </div>
        </div>

        <div className="home-content-wrapper contact-main-body-wrapper">
          {/* 2-Column Split: Left Helplines & Institutional Details | Right: Floating Enquiry Form */}
          <div className="contact-split-editorial-grid poly-reveal">
            
            {/* Left Column: Institutional Helplines & Address */}
            <div className="contact-helpline-column">
              <div className="contact-intro-badge">
                <span className="sparkle-pulse-dot" />
                <span>WE'D LOVE TO HEAR FROM YOU</span>
              </div>
              <h2 className="contact-institution-title">
                SUBHARTI POLYTECHNIC COLLEGE
              </h2>
              <p className="contact-university-affil">
                SWAMI VIVEKANAND SUBHARTI UNIVERSITY • MEERUT
              </p>

              {/* 4 Contact Helpline Boxes Grid (Matching Reference 2x2 Layout) */}
              <div className="helpline-boxes-grid">
                {/* Box 1: Delhi & NCR */}
                <div className="helpline-box-card">
                  <div className="helpline-box-header">
                    <div className="helpline-icon-wrap blue">
                      <PhoneCall size={16} />
                    </div>
                    <span className="helpline-box-label">Delhi &amp; NCR Helpline</span>
                  </div>
                  <div className="helpline-numbers-list">
                    <a href="tel:+919639010542" className="helpline-num-link">
                      <strong>+91 96390 10542</strong>
                    </a>
                    <a href="tel:+919639010541" className="helpline-num-link">
                      <strong>+91 96390 10541</strong>
                    </a>
                  </div>
                </div>

                {/* Box 2: Other Region / National */}
                <div className="helpline-box-card">
                  <div className="helpline-box-header">
                    <div className="helpline-icon-wrap emerald">
                      <Globe size={16} />
                    </div>
                    <span className="helpline-box-label">National / Other Region</span>
                  </div>
                  <div className="helpline-numbers-list">
                    <a href="tel:01212439043" className="helpline-num-link">
                      <strong>0121 - 2439043</strong>
                    </a>
                    <a href="tel:01212439052" className="helpline-num-link">
                      <strong>0121 - 2439052</strong>
                    </a>
                  </div>
                </div>

                {/* Box 3: Polytechnic Admissions Desk */}
                <div className="helpline-box-card">
                  <div className="helpline-box-header">
                    <div className="helpline-icon-wrap purple">
                      <School size={16} />
                    </div>
                    <span className="helpline-box-label">Polytechnic Admissions</span>
                  </div>
                  <div className="helpline-numbers-list">
                    <a href={`tel:${CONTACT.admissionsHelpline.replace(/\s+/g, "")}`} className="helpline-num-link">
                      <strong>{CONTACT.admissionsHelpline}</strong>
                    </a>
                    <span className="helpline-tollfree-text">Toll-Free: 1800-889-1111</span>
                  </div>
                </div>

                {/* Box 4: Official Email Desks */}
                <div className="helpline-box-card">
                  <div className="helpline-box-header">
                    <div className="helpline-icon-wrap amber">
                      <Mail size={16} />
                    </div>
                    <span className="helpline-box-label">Official Email Desks</span>
                  </div>
                  <div className="helpline-emails-list">
                    <a href={`mailto:${CONTACT.admissionsEmail}`} className="helpline-num-link">
                      <strong>{CONTACT.admissionsEmail}</strong>
                    </a>
                    <a href={`mailto:${CONTACT.email}`} className="helpline-num-link">
                      <strong>{CONTACT.email}</strong>
                    </a>
                  </div>
                </div>
              </div>

              {/* Address Card */}
              <div className="contact-address-card">
                <div className="address-card-header">
                  <div className="address-icon-wrap">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="address-card-title">Campus Address</h4>
                    <p className="address-text">
                      {CONTACT.address}
                    </p>
                  </div>
                </div>
                <div className="address-meta-row">
                  <span className="address-landmark-tag">
                    Landmark: Opp. Subharti Hospital &amp; Medical College (Gate No. 1)
                  </span>
                  <button
                    type="button"
                    className="copy-address-pill-btn"
                    onClick={handleCopyAddress}
                    title="Copy full campus address to clipboard"
                  >
                    {copiedAddress ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                    <span>{copiedAddress ? "Copied!" : "Copy Address"}</span>
                  </button>
                </div>
              </div>

              {/* Transit & Commute Connectivity Matrix */}
              <div className="contact-transit-container">
                <div className="transit-header-row">
                  <Navigation size={14} className="text-royal" />
                  <span className="transit-header-label">RAPID TRANSIT &amp; HIGHWAY CONNECTIVITY</span>
                </div>
                <div className="transit-chips-grid">
                  <div className="transit-chip-box">
                    <strong>Delhi-Meerut Expressway</strong>
                    <small>45 Mins from Delhi NCR</small>
                  </div>
                  <div className="transit-chip-box">
                    <strong>Namo Bharat RRTS Rail</strong>
                    <small>10 Mins from Meerut South</small>
                  </div>
                  <div className="transit-chip-box">
                    <strong>Meerut City Railway Station</strong>
                    <small>8.5 km (Direct Auto/Cab)</small>
                  </div>
                  <div className="transit-chip-box">
                    <strong>University Bus Fleets</strong>
                    <small>Delhi, Ghaziabad, Modinagar</small>
                  </div>
                </div>
              </div>

              {/* Live Admissions Desk Status Pill */}
              <div className="contact-live-status-bar">
                <span className="live-status-pulse-dot" />
                <span>
                  <strong>Admissions Desk Open Today:</strong> Mon–Sat 8:30 AM – 5:30 PM • Walk-in counseling active at Gate No. 1
                </span>
              </div>
            </div>

            {/* Right Column: Floating Institutional Enquiry Form (Matching Reference Image) */}
            <div className="contact-enquiry-form-card">
              <div className="enquiry-card-glow-halo" aria-hidden="true" />
              <div className="enquiry-form-header">
                <span className="enquiry-form-tag">GENERAL ENQUIRY OR FEEDBACK</span>
                <h3 className="enquiry-form-title">Enquiry form</h3>
                <p className="enquiry-form-desc">
                  Have questions about engineering diploma admissions, syllabus, or campus hostel? Fill in your details below.
                </p>
              </div>

              {contactSuccess ? (
                <div className="enquiry-success-animated-box">
                  <div className="enquiry-success-icon-ring">
                    <CheckCircle2 size={36} />
                  </div>
                  <h4>Enquiry Received!</h4>
                  <p>
                    Thank you, <strong>{contactForm.name || "Student"}</strong>. Our senior polytechnic admissions counselor will call you within 2 hours with all prospectus details.
                  </p>
                  <span className="enquiry-success-id">
                    Ref ID: #SUBHARTI-{(Date.now() % 100000).toString().padStart(6, "0")}
                  </span>
                </div>
              ) : (
                <form className="enquiry-interactive-form" onSubmit={handleContactSubmit}>
                  {/* Name Input */}
                  <div className="form-input-group">
                    <label htmlFor="contact-name">
                      Name <span className="req-star">*</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <User size={16} className="input-field-icon" />
                      <input
                        id="contact-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="form-input-group">
                    <label htmlFor="contact-email">
                      Email <span className="req-star">*</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <Mail size={16} className="input-field-icon" />
                      <input
                        id="contact-email"
                        type="email"
                        placeholder="e.g. yourname@gmail.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div className="form-input-group">
                    <label htmlFor="contact-phone">
                      Phone Number <span className="req-star">*</span>
                    </label>
                    <div className="input-with-icon-wrap">
                      <Phone size={16} className="input-field-icon" />
                      <input
                        id="contact-phone"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Branch / Program Selector */}
                  <div className="form-input-group">
                    <label htmlFor="contact-branch">
                      Branch / Program Interested
                    </label>
                    <div className="input-with-icon-wrap">
                      <School size={16} className="input-field-icon" />
                      <select
                        id="contact-branch"
                        value={contactForm.branch}
                        onChange={(e) => setContactForm({ ...contactForm, branch: e.target.value })}
                      >
                        <option value="Computer Science & Engineering">Computer Science &amp; Engineering (CSE)</option>
                        <option value="Mechanical Engineering">Mechanical Engineering (CAD/CAM &amp; Robotics)</option>
                        <option value="Electrical Engineering">Electrical &amp; Smart Grid Engineering</option>
                        <option value="Civil Engineering">Civil &amp; Green Infrastructure Engineering</option>
                        <option value="Electronics & Communication">Electronics &amp; Communication / IoT</option>
                        <option value="Direct 2nd Year Lateral Entry">Direct 2nd Year Lateral Entry (12th/ITI)</option>
                      </select>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="form-input-group">
                    <label htmlFor="contact-message">
                      Message / Query
                    </label>
                    <div className="input-with-icon-wrap textarea-wrap">
                      <MessageSquare size={16} className="input-field-icon textarea-icon" />
                      <textarea
                        id="contact-message"
                        rows={3}
                        placeholder="Tell us what you'd like to ask about admissions, eligibility, syllabus or hostel..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Interactive reCAPTCHA Box (Matching Reference Visual) */}
                  <div
                    className={`interactive-recaptcha-box ${contactForm.isHuman ? "is-verified" : ""} ${captchaError ? "has-error" : ""}`}
                    onClick={handleCaptchaClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCaptchaClick(); }}
                  >
                    <div className="recaptcha-left-side">
                      <div className="recaptcha-checkbox">
                        {contactForm.isHuman ? (
                          <Check size={16} className="recaptcha-check-icon animate-check-pop" />
                        ) : captchaVerifying ? (
                          <Loader2 size={16} className="recaptcha-spinner animate-spin" />
                        ) : null}
                      </div>
                      <span className="recaptcha-text">
                        {contactForm.isHuman ? "Verified Human" : "I'm not a robot"}
                      </span>
                    </div>
                    <div className="recaptcha-brand-side">
                      <div className="recaptcha-logo-icon">
                        <RotateCw size={18} />
                      </div>
                      <span className="recaptcha-brand-label">reCAPTCHA</span>
                      <small className="recaptcha-privacy-terms">Privacy - Terms</small>
                    </div>
                  </div>
                  {captchaError && (
                    <span className="recaptcha-error-text">
                      Please check "I'm not a robot" before submitting.
                    </span>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="enquiry-submit-btn"
                    disabled={contactSubmitting}
                  >
                    {contactSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Submitting Your Enquiry...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Enquiry</span>
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Full-Width Interactive Google Map Container (Underneath 2-Column Split) */}
          <div className="contact-fullwidth-map-section poly-reveal">
            <div className="map-fullwidth-card">
              <div className="map-frame-wrapper fullwidth-map-frame">
                {/* Visual Campus Road Grid & Highway Dash Overlay */}
                <div className="map-vector-underlay" aria-hidden="true">
                  <div className="map-road-highway">
                    <span className="road-tag">NH-58 DELHI – HARIDWAR EXPRESS BYPASS</span>
                  </div>
                  <div className="map-road-inner">
                    <span className="road-tag">SUBHARTI MAIN GATE 1</span>
                  </div>
                  <div className="map-pin-pulse-center">
                    <div className="pin-pulse-ring pin-pulse-ring-1" />
                    <div className="pin-pulse-ring pin-pulse-ring-2" />
                    <div className="pin-pulse-ring pin-pulse-ring-3" />
                    <div className="pin-marker-body">
                      <School size={18} />
                    </div>
                    <span className="pin-label">Subharti Polytechnic Campus • Gate 1</span>
                  </div>
                </div>

                <iframe
                  title="Swami Vivekanand Subharti University Campus Location Map"
                  src="https://maps.google.com/maps?q=Swami+Vivekanand+Subharti+University,+NH-58,+Delhi-Haridwar+Bypass+Road,+Meerut,+Uttar+Pradesh+250005&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="campus-google-map-iframe"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />

                {/* Floating Map Overlay Badge */}
                <div className="map-floating-overlay-card">
                  <div className="map-overlay-badge-row">
                    <img src={COLLEGE.crest} alt="SVSU Seal" className="map-overlay-crest" />
                    <div>
                      <strong>Subharti Knowledge City</strong>
                      <small>Gate No. 1 • NH-58, Meerut Bypass</small>
                    </div>
                  </div>
                  <div className="map-overlay-status">
                    <span className="live-pulse-dot green" />
                    <span>In-Person Admissions Desk Active (Mon–Sat)</span>
                  </div>
                </div>
              </div>

              {/* Map Footer Action Bar */}
              <div className="map-card-action-bar">
                <div className="map-coord-info">
                  <Navigation size={15} className="text-royal" />
                  <span>GPS: 28.9723° N, 77.6369° E • NH-58, Delhi-Haridwar Bypass, Meerut - 250005</span>
                </div>
                <div className="map-action-btns">
                  <button
                    type="button"
                    className="map-btn-secondary"
                    onClick={handleCopyAddress}
                    title="Copy full university campus address"
                  >
                    {copiedAddress ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                    <span>{copiedAddress ? "Address Copied!" : "Copy Address"}</span>
                  </button>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=Swami+Vivekanand+Subharti+University+Meerut"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-btn-primary"
                  >
                    <span>Get Directions</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          14. PREMIUM UNIVERSITY FOOTER
          ==================================================================== */}
      <footer className="master-university-footer">
        <div className="home-content-wrapper">
          <div className="footer-columns-grid">
            {/* Brand Column */}
            <div className="footer-col footer-brand-column">
              <div className="footer-brand-logo-row">
                <img src={COLLEGE.crest} alt={COLLEGE.university} className="footer-crest-img" />
                <div className="footer-brand-title-wrap">
                  <strong className="footer-college-name">Subharti Polytechnic</strong>
                  <small className="footer-univ-name">Swami Vivekanand Subharti University</small>
                </div>
              </div>

              <p className="footer-about-text">
                Subharti Polytechnic is an AICTE-approved constituent institution of Swami Vivekanand Subharti University, Meerut,
                dedicated to imparting rigorous engineering skill development, workshop discipline, and practical technology education.
              </p>

              <div className="footer-accreditations-badges">
                <span className="footer-badge-chip">
                  <ShieldCheck size={13} /> AICTE Approved
                </span>
                <span className="footer-badge-chip">
                  <Award size={13} /> SVSU Constituent
                </span>
                <span className="footer-badge-chip">
                  <GraduationCap size={13} /> Powered by CollegeOS
                </span>
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="footer-col">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-links-list">
                {[
                  ["Home", "home"],
                  ["Institutional Profile", "about"],
                  ["Academic Programs", "departments"],
                  ["Campus Facilities", "facilities"],
                  ["Placement Hall of Fame", "placements"],
                  ["Notice Board", "notices"],
                  ["Admission Process", "admission"]
                ].map(([label, id]) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollTo(id);
                      }}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Engineering Programs Column */}
            <div className="footer-col">
              <h4 className="footer-heading">Engineering Branches</h4>
              <ul className="footer-links-list">
                {DEPTS.map((d) => (
                  <li key={d.code}>
                    <a
                      href="#departments"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollTo("departments");
                      }}
                    >
                      {d.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Helpline Column */}
            <div className="footer-col footer-contact-column">
              <h4 className="footer-heading">Admissions &amp; Campus</h4>
              <p className="footer-contact-row">
                <MapPin size={16} className="contact-icon text-royal" />
                <span>{CONTACT.address}</span>
              </p>
              <p className="footer-contact-row">
                <Phone size={16} className="contact-icon text-royal" />
                <span>{CONTACT.phone}</span>
              </p>
              <p className="footer-contact-row">
                <Mail size={16} className="contact-icon text-royal" />
                <span>{CONTACT.email}</span>
              </p>
              <p className="footer-contact-row">
                <Clock size={16} className="contact-icon text-royal" />
                <span>{CONTACT.hours}</span>
              </p>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="footer-bottom-copyright-strip">
            <div className="copyright-text">
              © {currentYear} Subharti Polytechnic, Swami Vivekanand Subharti University. All rights reserved. Platform powered by CollegeOS.
            </div>
            <div className="footer-bottom-links">
              <span>Academic Regulations</span>
              <span>Anti-Ragging Policy</span>
              <span>Privacy Policy</span>
              <button
                type="button"
                className="footer-top-btn"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Back to Top ↑
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ====================================================================
          MODAL 1: VIRTUAL CAMPUS TOUR MODAL
          ==================================================================== */}
      {tourOpen && (
        <div className="modern-modal-backdrop" onClick={() => setTourOpen(false)}>
          <div className="modal-content-card video-tour-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <div className="modal-title-with-pill">
                <span className="badge-modern-pill">CAMPUS TOUR</span>
                <h3 className="modal-headline">Swami Vivekanand Subharti University Campus</h3>
              </div>
              <button type="button" className="modal-close-icon-btn" onClick={() => setTourOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="video-tour-stage">
              <Img src={IMG.hero} alt="Subharti Polytechnic College Campus" className="video-backdrop-frame" />
              <div className="video-overlay-play-center">
                <div className="tour-play-ring">
                  <Play size={32} className="fill-current text-white ml-1" />
                </div>
                <strong className="tour-play-title">Subharti Polytechnic College Campus Walkthrough</strong>
                <p className="tour-play-sub">Main academic blocks, CNC bays, engineering labs, and athletic arenas (3 Min HD Video)</p>
              </div>
            </div>

            <div className="modal-footer-strip">
              <button type="button" className="btn-secondary-glass" onClick={() => setTourOpen(false)}>
                Close Preview
              </button>
              <button
                type="button"
                className="btn-primary-royal"
                onClick={() => {
                  setTourOpen(false);
                  scrollTo("admission");
                }}
              >
                <span>Apply for Admission</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: ADMISSION ENQUIRY LEAD CAPTURE MODAL
          ==================================================================== */}
      {enquiryOpen && (
        <div className="modern-modal-backdrop" onClick={() => setEnquiryOpen(false)}>
          <div className="modal-content-card enquiry-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <div className="modal-title-with-pill">
                <span className="badge-modern-pill">ADMISSIONS 2026-27</span>
                <h3 className="modal-headline">Admission &amp; Counseling Enquiry</h3>
              </div>
              <button type="button" className="modal-close-icon-btn" onClick={() => setEnquiryOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {enquirySuccess ? (
              <div className="enquiry-success-state">
                <div className="success-icon-ring">
                  <CheckCircle2 size={44} className="text-emerald" />
                </div>
                <h3 className="success-title">Enquiry Submitted Successfully!</h3>
                <p className="success-desc">
                  Thank you, <strong>{enquiryData.name || "Candidate"}</strong>. Our admissions counselor will contact you at <strong>{enquiryData.phone || "your number"}</strong> within 24 working hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="enquiry-form-body">
                <p className="form-intro-note">
                  Fill in your details below to receive the official syllabus prospectus and schedule a personalized branch counseling session.
                </p>

                <div className="form-fields-grid">
                  <div className="form-field-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sonu Kumar"
                      value={enquiryData.name}
                      onChange={(e) => setEnquiryData({ ...enquiryData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={enquiryData.phone}
                      onChange={(e) => setEnquiryData({ ...enquiryData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. student@gmail.com"
                      value={enquiryData.email}
                      onChange={(e) => setEnquiryData({ ...enquiryData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Preferred Engineering Branch *</label>
                    <select
                      value={enquiryData.branch}
                      onChange={(e) => setEnquiryData({ ...enquiryData, branch: e.target.value })}
                    >
                      <option value="Computer Science & Engineering">Computer Science &amp; Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Electronics & Communication">Electronics &amp; Communication</option>
                    </select>
                  </div>

                  <div className="form-field-group full-width">
                    <label>10th / 12th Percentage or Grade (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 78% or Grade A"
                      value={enquiryData.score}
                      onChange={(e) => setEnquiryData({ ...enquiryData, score: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group full-width">
                    <label>Any Specific Questions?</label>
                    <textarea
                      rows="3"
                      placeholder="Ask about hostel, fee installments, scholarships, or lateral entry..."
                      value={enquiryData.query}
                      onChange={(e) => setEnquiryData({ ...enquiryData, query: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer-strip">
                  <button type="button" className="btn-secondary-glass" onClick={() => setEnquiryOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-royal">
                    <Send size={15} />
                    <span>Submit Enquiry</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: BRANCH COMPARISON MODAL
          ==================================================================== */}
      {compareOpen && (
        <div className="modern-modal-backdrop" onClick={() => setCompareOpen(false)}>
          <div className="modal-content-card compare-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <div className="modal-title-with-pill">
                <span className="badge-modern-pill">BRANCH COMPARISON</span>
                <h3 className="modal-headline">Compare Engineering Branches</h3>
              </div>
              <button type="button" className="modal-close-icon-btn" onClick={() => setCompareOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="compare-grid-stage">
              {/* Branch 1 Selection */}
              <div className="compare-branch-column">
                <label className="compare-select-label">Branch A:</label>
                <select
                  value={compareDept1}
                  onChange={(e) => setCompareDept1(Number(e.target.value))}
                  className="compare-dropdown"
                >
                  {DEPTS.map((d, i) => (
                    <option key={d.code} value={i}>{d.name}</option>
                  ))}
                </select>

                <div className="compare-card-details">
                  <div className="compare-spec-row">
                    <span className="spec-k">Duration:</span>
                    <strong className="spec-v">{DEPTS[compareDept1].duration}</strong>
                  </div>
                  <div className="compare-spec-row">
                    <span className="spec-k">Seats:</span>
                    <strong className="spec-v">{DEPTS[compareDept1].seats}</strong>
                  </div>
                  <div className="compare-spec-row">
                    <span className="spec-k">Avg Salary:</span>
                    <strong className="spec-v text-royal">{DEPTS[compareDept1].avgSalary}</strong>
                  </div>
                  <div className="compare-spec-row">
                    <span className="spec-k">Key Labs:</span>
                    <div className="spec-v-chips">
                      {DEPTS[compareDept1].labs.map((l, i) => (
                        <span key={i} className="tiny-chip">{l}</span>
                      ))}
                    </div>
                  </div>
                  <div className="compare-spec-row">
                    <span className="spec-k">Career Roles:</span>
                    <span className="spec-v">{DEPTS[compareDept1].prospects.join(", ")}</span>
                  </div>
                </div>
              </div>

              {/* Branch 2 Selection */}
              <div className="compare-branch-column">
                <label className="compare-select-label">Branch B:</label>
                <select
                  value={compareDept2}
                  onChange={(e) => setCompareDept2(Number(e.target.value))}
                  className="compare-dropdown"
                >
                  {DEPTS.map((d, i) => (
                    <option key={d.code} value={i}>{d.name}</option>
                  ))}
                </select>

                <div className="compare-card-details">
                  <div className="compare-spec-row">
                    <span className="spec-k">Duration:</span>
                    <strong className="spec-v">{DEPTS[compareDept2].duration}</strong>
                  </div>
                  <div className="compare-spec-row">
                    <span className="spec-k">Seats:</span>
                    <strong className="spec-v">{DEPTS[compareDept2].seats}</strong>
                  </div>
                  <div className="compare-spec-row">
                    <span className="spec-k">Avg Salary:</span>
                    <strong className="spec-v text-royal">{DEPTS[compareDept2].avgSalary}</strong>
                  </div>
                  <div className="compare-spec-row">
                    <span className="spec-k">Key Labs:</span>
                    <div className="spec-v-chips">
                      {DEPTS[compareDept2].labs.map((l, i) => (
                        <span key={i} className="tiny-chip">{l}</span>
                      ))}
                    </div>
                  </div>
                  <div className="compare-spec-row">
                    <span className="spec-k">Career Roles:</span>
                    <span className="spec-v">{DEPTS[compareDept2].prospects.join(", ")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-strip">
              <button type="button" className="btn-secondary-glass" onClick={() => setCompareOpen(false)}>
                Close Comparison
              </button>
              <button
                type="button"
                className="btn-primary-royal"
                onClick={() => {
                  setCompareOpen(false);
                  scrollTo("admission");
                }}
              >
                <span>Proceed to Admission</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MOBILE NATIVE APP BOTTOM NAVIGATION DOCK (Touch Experience)
          ==================================================================== */}
      <nav className="mobile-native-app-dock" aria-label="Mobile Bottom App Navigation">
        <button
          type="button"
          className="mobile-dock-btn"
          onClick={() => scrollTo("home")}
        >
          <School size={20} />
          <span>Home</span>
        </button>
        <button
          type="button"
          className="mobile-dock-btn"
          onClick={() => scrollTo("departments")}
        >
          <BookOpen size={20} />
          <span>Programs</span>
        </button>
        <button
          type="button"
          className="mobile-dock-btn"
          onClick={() => scrollTo("fee-calculator")}
        >
          <Calculator size={20} />
          <span>Fees</span>
        </button>
        <button
          type="button"
          className="mobile-dock-btn"
          onClick={() => scrollTo("campus-tour-360")}
        >
          <Compass size={20} />
          <span>360 Tour</span>
        </button>
        <button
          type="button"
          className="mobile-dock-btn primary-dock-cta"
          onClick={() => setEnquiryOpen(true)}
        >
          <ArrowRight size={20} />
          <span>Apply</span>
        </button>
      </nav>

      {/* ====================================================================
          MODAL 5: 360° PANORAMA CAMPUS VIEWER MODAL
          ==================================================================== */}
      {hotspot360Modal && (
        <div className="modern-modal-backdrop" onClick={() => setHotspot360Modal(false)}>
          <div
            className="modal-content-card modal-large-360"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header-bar">
              <div className="modal-header-title-box">
                <span className="modal-super-badge">360° INTERACTIVE PANORAMA</span>
                <h3 className="modal-card-title">{activeHotspot.name}</h3>
              </div>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setHotspot360Modal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="panorama-viewer-frame">
              <img
                src={activeHotspot.image}
                alt={activeHotspot.name}
                className="panorama-full-image"
              />
              <div className="panorama-compass-hud">
                <Compass size={22} className="compass-icon" />
                <span>N 28°59'48" | E 77°42'12" (High Definition 4K Sandbox)</span>
              </div>
              <div className="panorama-control-overlay">
                <span className="panorama-hint-tag">Drag or swipe to rotate 360° virtual field</span>
              </div>
            </div>

            <div className="modal-footer-strip">
              <div className="panorama-facility-info">
                <strong>Equipment Highlights:</strong> {activeHotspot.specs.join(" • ")}
              </div>
              <button
                type="button"
                className="btn-primary-royal"
                onClick={() => {
                  setHotspot360Modal(false);
                  setEnquiryOpen(true);
                }}
              >
                <span>Book On-Campus Lab Tour</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 6: CURRICULUM SYLLABUS DETAILS MODAL
          ==================================================================== */}
      {curriculumModal && selectedSubject && (
        <div className="modern-modal-backdrop" onClick={() => setCurriculumModal(false)}>
          <div
            className="modal-content-card modal-syllabus-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header-bar">
              <div className="modal-header-title-box">
                <span className="modal-super-badge">{selectedSubject.code} • SYLLABUS SPECIFICATION</span>
                <h3 className="modal-card-title">{selectedSubject.title}</h3>
              </div>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setCurriculumModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="syllabus-modal-body">
              <div className="syllabus-meta-pills-row">
                <span className="spec-pill"><strong>{selectedSubject.credits}</strong> Academic Credits</span>
                <span className="spec-pill">Mode: <strong>{selectedSubject.type}</strong></span>
                <span className="spec-pill">Exam: <strong>100 Marks (70 Ext + 30 Sessional)</strong></span>
              </div>

              <div className="syllabus-modules-box">
                <h4>Core Teaching Modules & Lab Exercises:</h4>
                <p className="syllabus-modules-text">{selectedSubject.topics}</p>
                <ul className="syllabus-learning-outcomes">
                  <li>Formulate mathematical & algorithmic proofs adhering to industrial safety standards.</li>
                  <li>Perform hands-on laboratory calibration using certified digital instrumentation.</li>
                  <li>Draft industry-standard technical reports and design blueprints.</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer-strip">
              <button
                type="button"
                className="btn-secondary-glass"
                onClick={() => setCurriculumModal(false)}
              >
                Close Specification
              </button>
              <button
                type="button"
                className="btn-primary-royal"
                onClick={() => alert(`Downloading complete PDF syllabus for ${selectedSubject.title}...`)}
              >
                <Download size={14} />
                <span>Download Module PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 7: STUDENT PROJECT DEMO MODAL
          ==================================================================== */}
      {projectModal && activeProject && (
        <div className="modern-modal-backdrop" onClick={() => setProjectModal(false)}>
          <div
            className="modal-content-card modal-project-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header-bar">
              <div className="modal-header-title-box">
                <span className="modal-super-badge">{activeProject.badge} • {activeProject.dept}</span>
                <h3 className="modal-card-title">{activeProject.title}</h3>
              </div>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setProjectModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="project-modal-body">
              <div className="proj-modal-img-wrap">
                <img src={activeProject.image} alt={activeProject.title} className="proj-modal-img" />
                <span className="proj-modal-award-tag">{activeProject.award}</span>
              </div>

              <p className="proj-modal-desc">{activeProject.description}</p>

              <div className="proj-modal-specs-grid">
                <div className="proj-spec-cell">
                  <span>Faculty Mentor:</span>
                  <strong>{activeProject.guide}</strong>
                </div>
                <div className="proj-spec-cell">
                  <span>Student Engineers:</span>
                  <strong>{activeProject.team.join(", ")}</strong>
                </div>
                <div className="proj-spec-cell">
                  <span>Project Status:</span>
                  <strong>{activeProject.status}</strong>
                </div>
              </div>

              <div className="proj-modal-tech-stack">
                <h5>Engineering Stack:</h5>
                <div className="tech-chips-flow">
                  {activeProject.techStack.map((tech, i) => (
                    <span key={i} className="tech-chip-tag">{tech}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer-strip">
              <button
                type="button"
                className="btn-secondary-glass"
                onClick={() => setProjectModal(false)}
              >
                Close Project
              </button>
              <button
                type="button"
                className="btn-primary-royal"
                onClick={() => alert("Connecting with project team coordinators...")}
              >
                <Send size={14} />
                <span>Contact Project Team</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 8: FACULTY MENTORSHIP CONSULTATION MODAL
          ==================================================================== */}
      {facultyModal && selectedFaculty && (
        <div className="modern-modal-backdrop" onClick={() => setFacultyModal(false)}>
          <div
            className="modal-content-card modal-faculty-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header-bar">
              <div className="modal-header-title-box">
                <span className="modal-super-badge">ACADEMIC & CAREER MENTORSHIP</span>
                <h3 className="modal-card-title">Schedule Session with {selectedFaculty.name}</h3>
              </div>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setFacultyModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="faculty-modal-body">
              <div className="faculty-summary-card">
                <img src={selectedFaculty.image} alt={selectedFaculty.name} className="fac-mini-img" />
                <div>
                  <h4>{selectedFaculty.name}</h4>
                  <span className="fac-mini-role">{selectedFaculty.role} ({selectedFaculty.dept})</span>
                  <span className="fac-mini-qual">{selectedFaculty.qualification}</span>
                </div>
              </div>

              <form
                className="faculty-consult-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert(`Mentorship consultation request sent to ${selectedFaculty.name}!`);
                  setFacultyModal(false);
                }}
              >
                <div className="form-fields-grid">
                  <div className="field-block">
                    <label className="field-label">Student Name</label>
                    <input type="text" required placeholder="Sonu Kumar" className="lead-input-control" />
                  </div>
                  <div className="field-block">
                    <label className="field-label">Email or Phone</label>
                    <input type="text" required placeholder="+91 9876543210" className="lead-input-control" />
                  </div>
                  <div className="field-block">
                    <label className="field-label">Interested Branch / Subject</label>
                    <input type="text" defaultValue={selectedFaculty.dept} className="lead-input-control" />
                  </div>
                  <div className="field-block">
                    <label className="field-label">Preferred Time Slot</label>
                    <select className="lead-input-control">
                      <option>Morning (10:00 AM - 11:30 AM)</option>
                      <option>Afternoon (02:00 PM - 03:30 PM)</option>
                      <option>Evening (04:30 PM - 05:30 PM)</option>
                    </select>
                  </div>
                </div>

                <div className="field-block mt-3">
                  <label className="field-label">Specific Query or Guidance Required</label>
                  <textarea
                    rows={3}
                    placeholder="Ask regarding syllabus, lab facilities, placements, or lateral entry requirements..."
                    className="lead-input-control"
                  />
                </div>

                <div className="modal-footer-strip mt-4">
                  <button
                    type="button"
                    className="btn-secondary-glass"
                    onClick={() => setFacultyModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-royal">
                    <Send size={15} />
                    <span>Confirm Consultation Request</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
