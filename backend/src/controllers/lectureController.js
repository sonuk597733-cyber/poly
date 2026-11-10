import path from "node:path";
import fs from "node:fs";
import mongoose from "mongoose";
import Lecture from "../models/Lecture.js";
import LectureProgress from "../models/LectureProgress.js";
import LectureDownload from "../models/LectureDownload.js";
import StudentProfile from "../models/StudentProfile.js";
import TeacherProfile from "../models/TeacherProfile.js";
import HODProfile from "../models/HODProfile.js";
import CoordinatorProfile from "../models/CoordinatorProfile.js";
import Notification from "../models/Notification.js";
import Subject from "../models/Subject.js";
import { resolveDepartmentBranch, getDepartmentQueryFilter } from "../utils/validators.js";
import { resolveUploadFile } from "../utils/uploadPaths.js";

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function detectResourceType(filename) {
  const ext = path.extname(filename || "").toLowerCase();
  if (ext === ".pdf") return "notes_pdf";
  if ([".ppt", ".pptx"].includes(ext)) return "slides_ppt";
  if ([".doc", ".docx", ".txt", ".rtf", ".odt"].includes(ext)) return "reference_doc";
  if ([".xls", ".xlsx", ".csv", ".ods"].includes(ext)) return "spreadsheet";
  if ([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".bmp"].includes(ext)) return "image_attachment";
  if ([".mp3", ".wav", ".aac", ".m4a", ".ogg", ".flac"].includes(ext)) return "audio_lecture";
  if ([".zip", ".rar", ".7z", ".tar", ".gz", ".py", ".java", ".c", ".cpp", ".cs", ".js", ".ts", ".html", ".css", ".json", ".sql", ".sh", ".xml", ".md"].includes(ext)) return "code_archive";
  return "other";
}

/**
 * @route   GET /api/lectures
 * @desc    Get lectures scoped by user role, branch, and semester
 * @access  Private
 */
export async function getLectures(req, res, next) {
  try {
    const user = req.user;
    const {
      branch,
      semester,
      subject,
      lectureType,
      topic,
      search,
      status,
      myLectures,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    // 1. Enforce strict role-based scoping
    if (user.role === "student") {
      const studentProf = await StudentProfile.findOne({ userId: user._id }).lean();
      if (!studentProf) {
        return res.status(403).json({
          success: false,
          message: "Student profile not found. Please contact administration."
        });
      }
      // Students see verified published lectures for their department/branch
      const normBranch = resolveDepartmentBranch(studentProf.branch || user.branch || "CSE");
      query.branch = getDepartmentQueryFilter(normBranch).queryFilter;

      // Filter by semester: if student requested a specific semester or 'all', honor it;
      // otherwise default to their current enrolled semester
      if (semester && semester !== "all") {
        query.semester = semester;
      } else if (!semester) {
        query.semester = studentProf.semester;
      }
      query.status = "published";
    } else if (user.role === "teacher") {
      if (myLectures === "true") {
        query.uploadedBy = user._id;
      } else {
        if (branch) query.branch = branch;
        if (semester) query.semester = semester;
        // Teachers see published and their own drafts
        query.$or = [{ status: "published" }, { uploadedBy: user._id }];
      }
    } else if (user.role === "hod") {
      const hodProf = await HODProfile.findOne({ userId: user._id }).lean();
      const hodDept = resolveDepartmentBranch(hodProf?.department || user.department || "CSE");
      query.branch = hodDept;
      if (semester) query.semester = semester;
      if (status) query.status = status;
    } else if (user.role === "coordinator") {
      const coordProf = await CoordinatorProfile.findOne({ userId: user._id }).lean();
      const coordDept = coordProf?.department || user.department;
      if (coordDept) query.branch = coordDept;
      if (branch) query.branch = branch;
      if (semester) query.semester = semester;
      if (status) query.status = status;
    } else {
      // Principal & Admin
      if (branch) query.branch = branch;
      if (semester) query.semester = semester;
      if (status) query.status = status;
    }

    // 2. Query filters
    if (subject && subject.trim()) {
      query.subject = subject.trim();
    }
    if (lectureType && lectureType.trim()) {
      query.lectureType = lectureType.trim();
    }
    if (topic && topic.trim()) {
      query.topic = { $regex: new RegExp(topic.trim(), "i") };
    }

    // 3. Search query
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const searchClause = [
        { title: searchRegex },
        { topic: searchRegex },
        { subject: searchRegex },
        { uploadedByName: searchRegex },
        { description: searchRegex }
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchClause }];
        delete query.$or;
      } else {
        query.$or = searchClause;
      }
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10));
    const pageLimit = Math.min(100, parseInt(limit, 10));

    const [lectures, total] = await Promise.all([
      Lecture.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Lecture.countDocuments(query)
    ]);

    // 4. If student, attach their individual progress to each lecture
    let lecturesWithProgress = lectures;
    if (user.role === "student" && lectures.length > 0) {
      const lectureIds = lectures.map((l) => l._id);
      const progresses = await LectureProgress.find({
        studentId: user._id,
        lectureId: { $in: lectureIds }
      }).lean();

      const progressMap = new Map();
      progresses.forEach((p) => {
        progressMap.set(p.lectureId.toString(), {
          lastPlaybackPosition: p.lastPlaybackPosition || 0,
          highestPlaybackPosition: p.highestPlaybackPosition || 0,
          totalWatchDuration: p.totalWatchDuration || 0,
          completionPercentage: p.completionPercentage || 0,
          isCompleted: Boolean(p.isCompleted),
          lastWatchedAt: p.lastWatchedAt
        });
      });

      lecturesWithProgress = lectures.map((lec) => ({
        ...lec,
        id: lec._id.toString(),
        progress: progressMap.get(lec._id.toString()) || {
          lastPlaybackPosition: 0,
          highestPlaybackPosition: 0,
          totalWatchDuration: 0,
          completionPercentage: 0,
          isCompleted: false,
          lastWatchedAt: null
        }
      }));
    } else {
      lecturesWithProgress = lectures.map((l) => ({
        ...l,
        id: l._id.toString()
      }));
    }

    return res.status(200).json({
      success: true,
      count: lecturesWithProgress.length,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / pageLimit) || 1,
      lectures: lecturesWithProgress
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/lectures/:id
 * @desc    Get detailed lecture by ID, increment view count, return student progress
 * @access  Private
 */
export async function getLectureById(req, res, next) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lecture ID."
      });
    }

    const lecture = await Lecture.findById(id).lean();
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found."
      });
    }

    // Strict access check for students
    if (user.role === "student") {
      const studentProf = await StudentProfile.findOne({ userId: user._id }).lean();
      const studentBranch = resolveDepartmentBranch(studentProf?.branch || user.branch);
      const lectureBranch = resolveDepartmentBranch(lecture.branch);
      if (!studentProf || studentBranch !== lectureBranch) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This lecture is restricted to ${lecture.branch} students.`
        });
      }
    }

    // Atomically increment views count
    await Lecture.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } });
    lecture.viewsCount = (lecture.viewsCount || 0) + 1;

    // Attach student progress if student
    let progress = null;
    if (user.role === "student") {
      progress = await LectureProgress.findOne({
        studentId: user._id,
        lectureId: lecture._id
      }).lean();

      if (!progress) {
        progress = {
          lastPlaybackPosition: 0,
          highestPlaybackPosition: 0,
          totalWatchDuration: 0,
          completionPercentage: 0,
          isCompleted: false,
          lastWatchedAt: null
        };
      }
    }

    return res.status(200).json({
      success: true,
      lecture: {
        ...lecture,
        id: lecture._id.toString(),
        progress
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/lectures/upload/documents
 * @desc    Upload multiple document attachments (PDF, DOCX, PPTX, XLSX, images, code, etc.)
 * @access  Private (Teacher, Coordinator, HOD, Principal, Admin)
 */
export async function uploadLectureDocuments(req, res, next) {
  try {
    const uploadedFiles = [
      ...(req.files?.resourceFiles || []),
      ...(req.files?.documents || []),
      ...(req.files?.attachments || []),
      ...(req.files?.files || [])
    ];

    if (req.file) {
      uploadedFiles.push(req.file);
    }

    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No document files were received in the upload request."
      });
    }

    // Enforce 30 attachments limit on backend
    if (uploadedFiles.length > 30) {
      uploadedFiles.forEach((f) => {
        try { fs.unlinkSync(f.path); } catch {}
      });
      return res.status(400).json({
        success: false,
        message: "Cannot upload more than 30 document attachments per lecture."
      });
    }

    // Enforce 50 MB per document limit on backend
    const MAX_DOC_SIZE = 50 * 1024 * 1024;
    const oversizedFile = uploadedFiles.find((f) => f.size > MAX_DOC_SIZE);
    if (oversizedFile) {
      uploadedFiles.forEach((f) => {
        try { fs.unlinkSync(f.path); } catch {}
      });
      return res.status(400).json({
        success: false,
        message: `Document "${oversizedFile.originalname}" exceeds the 50 MB limit.`
      });
    }

    let customTitles = [];
    if (req.body.resourceTitles) {
      try {
        customTitles = typeof req.body.resourceTitles === "string"
          ? JSON.parse(req.body.resourceTitles)
          : req.body.resourceTitles;
      } catch {
        customTitles = [req.body.resourceTitles];
      }
    }

    const documents = uploadedFiles.map((file, index) => {
      const rawTitle = customTitles[index] || path.parse(file.originalname).name;
      const cleanTitle = (rawTitle || "Attachment").trim().slice(0, 120);
      return {
        title: cleanTitle,
        resourceType: detectResourceType(file.originalname),
        fileUrl: `/uploads/lectures/resources/${file.filename}`,
        filename: file.filename,
        originalname: file.originalname,
        filesize: file.size,
        mimetype: file.mimetype,
        downloadCount: 0
      };
    });

    return res.status(200).json({
      success: true,
      message: `${documents.length} document attachment(s) uploaded successfully.`,
      documents
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/lectures
 * @desc    Upload & publish a new lecture with video, thumbnail, and resources
 * @access  Private (Teacher, Coordinator, HOD, Principal, Admin)
 */
export async function createLecture(req, res, next) {
  try {
    const user = req.user;
    const {
      title,
      description,
      branch,
      academicYear,
      semester,
      subject,
      subjectCode,
      topic,
      unitNumber,
      lectureType = "Theory",
      videoSource = "youtube",
      videoUrl = "",
      durationMinutes = 45,
      tags = []
    } = req.body;

    // 1. Required field validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Lecture title is required." });
    }
    if (!branch) {
      return res.status(400).json({ success: false, message: "Branch is required." });
    }
    if (!semester) {
      return res.status(400).json({ success: false, message: "Semester is required." });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: "Subject is required." });
    }
    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: "Topic / Chapter is required." });
    }

    const normalizedBranch = resolveDepartmentBranch(branch);

    // 2. Fetch authenticated uploader profile to guarantee non-spoofed identity & designation
    let designation = "Faculty";
    let department = normalizedBranch;

    if (user.role === "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Students are not authorized to upload or publish lectures."
      });
    }

    if (user.role === "teacher") {
      const teacherProf = await TeacherProfile.findOne({ userId: user._id }).lean();
      if (!teacherProf) {
        return res.status(403).json({
          success: false,
          message: "Teacher profile not found. Please contact administration."
        });
      }
      const teacherBranch = resolveDepartmentBranch(teacherProf.department || user.department);
      designation = teacherProf.designation || "Assistant Professor / Lecturer";
      department = teacherProf.department || normalizedBranch;

      // Academic Scope: Faculty upload within their department scope, OR to another department ONLY if officially allocated
      if (teacherBranch !== normalizedBranch) {
        const hasCrossAllocation = await Subject.exists({
          assignedTeacherId: user._id,
          branch: normalizedBranch,
          semester
        });
        if (!hasCrossAllocation) {
          return res.status(403).json({
            success: false,
            message: `Scope violation: You belong to ${teacherProf.department}. You cannot upload lectures to ${branch} without official subject allocation.`
          });
        }
      }

      // Subject Allocation: Check if this subject is allocated to another teacher
      const allocatedSubject = await Subject.findOne({
        branch: normalizedBranch,
        semester,
        $or: [
          { subjectCode: (subjectCode || "").trim().toUpperCase() },
          { subjectName: new RegExp(`^${subject.trim()}$`, "i") }
        ]
      }).lean();

      if (allocatedSubject && allocatedSubject.assignedTeacherId) {
        if (allocatedSubject.assignedTeacherId.toString() !== user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: `Subject allocation violation: "${allocatedSubject.subjectName}" is allocated to faculty ${allocatedSubject.assignedTeacherName || "another instructor"}.`
          });
        }
      }
    } else if (user.role === "hod") {
      const hodProf = await HODProfile.findOne({ userId: user._id }).lean();
      const hodBranch = resolveDepartmentBranch(hodProf?.department || user.department);
      department = hodProf?.department || user.department || normalizedBranch;
      designation = "Head of Department (HOD)";

      // HOD must remain within authorized department scope
      if (hodBranch !== normalizedBranch) {
        return res.status(403).json({
          success: false,
          message: `HOD scope violation: HOD of ${department} is not authorized to publish lectures for ${branch}.`
        });
      }
    } else if (user.role === "coordinator") {
      const coordProf = await CoordinatorProfile.findOne({ userId: user._id }).lean();
      const coordBranch = resolveDepartmentBranch(coordProf?.department || user.department);
      department = coordProf?.department || user.department || normalizedBranch;
      designation = "Academic Coordinator";

      // Coordinator must remain within assigned branch
      if (coordBranch && coordBranch !== normalizedBranch) {
        return res.status(403).json({
          success: false,
          message: `Coordinator scope violation: You are assigned to ${coordProf?.department || coordBranch}. You cannot upload lectures to ${branch}.`
        });
      }
    } else if (user.role === "principal") {
      designation = "Principal";
      department = normalizedBranch;
    } else if (user.role === "admin") {
      designation = "System Administrator";
      department = normalizedBranch;
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role for lecture operations."
      });
    }

    // 3. Process video source & files
    let finalVideoUrl = (videoUrl || "").trim();
    let videoFileMeta = { filename: "", originalname: "", mimetype: "", size: 0, path: "" };

    const uploadedVideo = req.files?.videoFile?.[0];
    if (uploadedVideo) {
      finalVideoUrl = `/uploads/lectures/videos/${uploadedVideo.filename}`;
      videoFileMeta = {
        filename: uploadedVideo.filename,
        originalname: uploadedVideo.originalname,
        mimetype: uploadedVideo.mimetype,
        size: uploadedVideo.size,
        path: uploadedVideo.path
      };
    } else if (req.body.completedVideoFile) {
      try {
        const parsedMeta = typeof req.body.completedVideoFile === "string"
          ? JSON.parse(req.body.completedVideoFile)
          : req.body.completedVideoFile;
        if (parsedMeta && parsedMeta.filename) {
          finalVideoUrl = parsedMeta.url || `/uploads/lectures/videos/${parsedMeta.filename}`;
          videoFileMeta = {
            filename: parsedMeta.filename,
            originalname: parsedMeta.originalname || parsedMeta.filename,
            mimetype: parsedMeta.mimetype || "video/mp4",
            size: Number(parsedMeta.size) || 0,
            path: parsedMeta.path || resolveUploadFile(parsedMeta.filename, "lectures/videos") || ""
          };
        }
      } catch (err) {
        console.warn("Could not parse completedVideoFile meta:", err.message);
      }
    } else if (videoSource === "youtube" && !finalVideoUrl) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid YouTube URL."
      });
    } else if (videoSource === "external" && !finalVideoUrl) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid external stream URL."
      });
    } else if ((videoSource === "upload" || videoSource === "none" || videoSource === "documents" || !videoSource) && !finalVideoUrl) {
      const hasAnyResources =
        (req.files?.resourceFiles?.length || 0) > 0 ||
        (req.files?.documents?.length || 0) > 0 ||
        (req.files?.attachments?.length || 0) > 0 ||
        (req.files?.files?.length || 0) > 0 ||
        Boolean(req.body.uploadedDocuments) ||
        Boolean(req.body.externalResources);

      if (!hasAnyResources) {
        return res.status(400).json({
          success: false,
          message: "Please attach a video file, provide a stream URL, or attach study documents."
        });
      }
    }

    // 4. Process thumbnail
    let finalThumbnailUrl = "";
    let thumbnailFileMeta = { filename: "", mimetype: "", path: "" };

    const uploadedThumb = req.files?.thumbnailFile?.[0];
    if (uploadedThumb) {
      finalThumbnailUrl = `/uploads/lectures/thumbnails/${uploadedThumb.filename}`;
      thumbnailFileMeta = {
        filename: uploadedThumb.filename,
        mimetype: uploadedThumb.mimetype,
        path: uploadedThumb.path
      };
    } else {
      const ytId = getYouTubeId(finalVideoUrl);
      if (ytId) {
        finalThumbnailUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    }

    // 5. Process resource attachments
    const resources = [];
    const uploadedResources = [
      ...(req.files?.resourceFiles || []),
      ...(req.files?.documents || []),
      ...(req.files?.attachments || []),
      ...(req.files?.files || [])
    ];

    // Support pre-uploaded documents passed in body
    if (req.body.uploadedDocuments) {
      try {
        const preUploaded = typeof req.body.uploadedDocuments === "string"
          ? JSON.parse(req.body.uploadedDocuments)
          : req.body.uploadedDocuments;
        if (Array.isArray(preUploaded)) {
          preUploaded.forEach((doc) => {
            if (doc.fileUrl && (doc.title || doc.originalname)) {
              resources.push({
                title: (doc.title || doc.originalname || "Attachment").trim().slice(0, 120),
                resourceType: doc.resourceType || detectResourceType(doc.originalname || doc.filename),
                fileUrl: doc.fileUrl,
                filename: doc.filename || "",
                originalname: doc.originalname || doc.filename || "Attachment",
                filesize: Number(doc.filesize || doc.size) || 0,
                mimetype: doc.mimetype || "application/octet-stream",
                downloadCount: 0
              });
            }
          });
        }
      } catch (err) {
        console.warn("Could not parse uploadedDocuments body field:", err.message);
      }
    }

    // Map any custom titles passed as JSON or array
    let customTitles = [];
    if (req.body.resourceTitles) {
      try {
        customTitles = typeof req.body.resourceTitles === "string"
          ? JSON.parse(req.body.resourceTitles)
          : req.body.resourceTitles;
      } catch {
        customTitles = [req.body.resourceTitles];
      }
    }

    uploadedResources.forEach((file, index) => {
      const resourceTitle = customTitles[index] || path.parse(file.originalname).name;
      resources.push({
        title: (resourceTitle || "Attachment").trim().slice(0, 120),
        resourceType: detectResourceType(file.originalname),
        fileUrl: `/uploads/lectures/resources/${file.filename}`,
        filename: file.filename,
        originalname: file.originalname,
        filesize: file.size,
        mimetype: file.mimetype,
        downloadCount: 0
      });
    });

    // Support external resources passed in body
    if (req.body.externalResources) {
      try {
        const parsed = typeof req.body.externalResources === "string"
          ? JSON.parse(req.body.externalResources)
          : req.body.externalResources;
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item.title && item.fileUrl) {
              resources.push({
                title: item.title,
                resourceType: item.resourceType || "other",
                fileUrl: item.fileUrl,
                filename: "",
                originalname: item.title,
                filesize: item.filesize || 0,
                mimetype: item.mimetype || "application/octet-stream",
                downloadCount: 0
              });
            }
          });
        }
      } catch {
        // Ignore JSON parse errors for optional external resources
      }
    }

    // 6. Calculate durations
    const durMins = Math.max(1, Number(durationMinutes) || 45);
    const durSecs = durMins * 60;

    // 7. Parse tags
    let tagsList = [];
    if (tags) {
      if (Array.isArray(tags)) {
        tagsList = tags.map((t) => String(t).trim()).filter(Boolean);
      } else if (typeof tags === "string") {
        tagsList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    // Determine finalized video source enum value
    const finalVideoSource = uploadedVideo
      ? "upload"
      : (req.body.completedVideoFile || finalVideoUrl)
      ? (videoSource === "upload" ? "upload" : videoSource || "upload")
      : (resources.length > 0 ? "documents" : "none");

    // 8. Create lecture document
    const lecture = await Lecture.create({
      title: title.trim(),
      description: (description || "").trim(),
      branch: normalizedBranch,
      academicYear: academicYear || "3rd Year",
      semester,
      subject: subject.trim(),
      subjectCode: (subjectCode || "").trim().toUpperCase(),
      topic: topic.trim(),
      unitNumber: Number(unitNumber) || 1,
      lectureType,
      videoSource: finalVideoSource,
      videoUrl: finalVideoUrl,
      videoFile: videoFileMeta,
      durationMinutes: durMins,
      durationSeconds: durSecs,
      thumbnailUrl: finalThumbnailUrl,
      thumbnailFile: thumbnailFileMeta,
      resources,
      uploadedBy: user._id,
      uploadedByName: user.fullName,
      uploadedByRole: user.role,
      uploadedByDesignation: designation,
      uploadedByDepartment: department,
      uploadedByAvatar: user.avatarUrl || "",
      status: "published",
      tags: tagsList
    });

    // 9. Dispatch notifications to enrolled students of the same branch and semester
    try {
      const enrolledStudents = await StudentProfile.find({
        branch: getDepartmentQueryFilter(normalizedBranch).queryFilter,
        semester
      })
        .select("userId")
        .lean();

      if (enrolledStudents.length > 0) {
        const notifications = enrolledStudents.map((st) => ({
          recipientId: st.userId,
          recipientRole: "student",
          title: `New Lecture: ${lecture.title}`,
          message: `${user.fullName} uploaded a ${lectureType} lecture for ${lecture.subject}: "${lecture.topic}".`,
          type: "info",
          link: "/student/lectures",
          isRead: false
        }));
        await Notification.insertMany(notifications, { ordered: false });
      }
    } catch (notifErr) {
      console.warn("Notification dispatch failed (non-blocking):", notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Lecture and digital resources published successfully!",
      lecture: {
        ...lecture.toObject(),
        id: lecture._id.toString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PUT /api/lectures/:id
 * @desc    Update existing lecture metadata and status
 * @access  Private (Teacher uploader, HOD, Coordinator, Admin)
 */
export async function updateLecture(req, res, next) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lecture ID." });
    }

    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found." });
    }

    // Role-based permission check
    const isUploader = lecture.uploadedBy.toString() === user._id.toString();
    const isAdmin = ["admin", "principal"].includes(user.role);

    let isAuthorizedHOD = false;
    if (user.role === "hod") {
      const hodProf = await HODProfile.findOne({ userId: user._id }).lean();
      const hodBranch = resolveDepartmentBranch(hodProf?.department || user.department);
      if (hodBranch === resolveDepartmentBranch(lecture.branch)) {
        isAuthorizedHOD = true;
      }
    }

    let isAuthorizedCoordinator = false;
    if (user.role === "coordinator") {
      const coordProf = await CoordinatorProfile.findOne({ userId: user._id }).lean();
      const coordBranch = resolveDepartmentBranch(coordProf?.department || user.department);
      if (!coordBranch || coordBranch === resolveDepartmentBranch(lecture.branch)) {
        isAuthorizedCoordinator = true;
      }
    }

    if (!isUploader && !isAdmin && !isAuthorizedHOD && !isAuthorizedCoordinator) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You do not have authorization to modify this lecture."
      });
    }

    const {
      title,
      description,
      subject,
      subjectCode,
      topic,
      unitNumber,
      lectureType,
      videoSource,
      videoUrl,
      durationMinutes,
      status,
      tags,
      removeResourceIds,
      removeVideo,
      removeThumbnail,
      completedVideoFile
    } = req.body;

    if (title) lecture.title = title.trim();
    if (description !== undefined) lecture.description = description.trim();
    if (subject) lecture.subject = subject.trim();
    if (subjectCode !== undefined) lecture.subjectCode = subjectCode.trim().toUpperCase();
    if (topic) lecture.topic = topic.trim();
    if (unitNumber !== undefined) lecture.unitNumber = Number(unitNumber);
    if (lectureType) lecture.lectureType = lectureType;
    if (durationMinutes) {
      lecture.durationMinutes = Number(durationMinutes);
      lecture.durationSeconds = Number(durationMinutes) * 60;
    }
    if (status) lecture.status = status;
    if (tags) {
      lecture.tags = Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    // --- VIDEO HANDLING IN EDIT MODE ---
    let oldVideoToClean = null;

    // Check if new video uploaded directly or via completed chunk upload
    const uploadedVideo = req.files?.videoFile?.[0];
    if (uploadedVideo) {
      oldVideoToClean = lecture.videoFile?.filename
        ? resolveUploadFile(lecture.videoFile.filename, "lectures/videos")
        : null;

      lecture.videoSource = "upload";
      lecture.videoUrl = `/uploads/lectures/videos/${uploadedVideo.filename}`;
      lecture.videoFile = {
        filename: uploadedVideo.filename,
        originalname: uploadedVideo.originalname,
        mimetype: uploadedVideo.mimetype,
        size: uploadedVideo.size,
        path: uploadedVideo.path
      };
    } else if (completedVideoFile) {
      try {
        const meta = typeof completedVideoFile === "string" ? JSON.parse(completedVideoFile) : completedVideoFile;
        if (meta?.filename) {
          oldVideoToClean = lecture.videoFile?.filename
            ? resolveUploadFile(lecture.videoFile.filename, "lectures/videos")
            : null;

          lecture.videoSource = "upload";
          lecture.videoUrl = meta.url || `/uploads/lectures/videos/${meta.filename}`;
          lecture.videoFile = {
            filename: meta.filename,
            originalname: meta.originalname || meta.filename,
            mimetype: meta.mimetype || "video/mp4",
            size: Number(meta.size) || 0,
            path: meta.path || resolveUploadFile(meta.filename, "lectures/videos") || ""
          };
        }
      } catch (err) {
        console.warn("Could not parse completedVideoFile in edit mode:", err.message);
      }
    } else if (videoUrl !== undefined && (videoSource === "youtube" || videoSource === "external")) {
      const cleanUrl = videoUrl.trim();
      lecture.videoSource = videoSource;
      lecture.videoUrl = cleanUrl;
      const ytId = getYouTubeId(cleanUrl);
      if (ytId && !lecture.thumbnailUrl) {
        lecture.thumbnailUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    } else if (removeVideo === "true" || removeVideo === true) {
      oldVideoToClean = lecture.videoFile?.filename
        ? resolveUploadFile(lecture.videoFile.filename, "lectures/videos")
        : null;
      lecture.videoUrl = "";
      lecture.videoFile = { filename: "", originalname: "", mimetype: "", size: 0, path: "" };
      lecture.videoSource = "external";
    }

    // --- THUMBNAIL HANDLING IN EDIT MODE ---
    const uploadedThumb = req.files?.thumbnailFile?.[0];
    if (uploadedThumb) {
      if (lecture.thumbnailFile?.filename) {
        const oldThumb = resolveUploadFile(lecture.thumbnailFile.filename, "lectures/thumbnails");
        if (oldThumb && fs.existsSync(oldThumb)) {
          try { fs.unlinkSync(oldThumb); } catch {}
        }
      }
      lecture.thumbnailUrl = `/uploads/lectures/thumbnails/${uploadedThumb.filename}`;
      lecture.thumbnailFile = {
        filename: uploadedThumb.filename,
        mimetype: uploadedThumb.mimetype,
        path: uploadedThumb.path
      };
    } else if (removeThumbnail === "true" || removeThumbnail === true) {
      if (lecture.thumbnailFile?.filename) {
        const oldThumb = resolveUploadFile(lecture.thumbnailFile.filename, "lectures/thumbnails");
        if (oldThumb && fs.existsSync(oldThumb)) {
          try { fs.unlinkSync(oldThumb); } catch {}
        }
      }
      lecture.thumbnailUrl = "";
      lecture.thumbnailFile = { filename: "", mimetype: "", path: "" };
    }

    // --- REMOVE SPECIFIC DOCUMENTS / RESOURCES ---
    let toRemoveIds = [];
    if (removeResourceIds) {
      try {
        toRemoveIds = typeof removeResourceIds === "string" ? JSON.parse(removeResourceIds) : removeResourceIds;
        if (!Array.isArray(toRemoveIds)) toRemoveIds = [toRemoveIds];
      } catch {
        toRemoveIds = [removeResourceIds];
      }
    }

    if (toRemoveIds.length > 0) {
      const idStrings = toRemoveIds.map((rid) => String(rid));
      const remainingResources = [];
      for (const resItem of lecture.resources) {
        if (idStrings.includes(resItem._id.toString())) {
          // Delete physical file from disk
          if (resItem.filename) {
            const diskFile = resolveUploadFile(resItem.filename, "lectures/resources");
            if (diskFile && fs.existsSync(diskFile)) {
              try { fs.unlinkSync(diskFile); } catch (e) {
                console.warn("Could not delete removed lecture resource file:", diskFile, e.message);
              }
            }
          }
        } else {
          remainingResources.push(resItem);
        }
      }
      lecture.resources = remainingResources;
    }

    // --- ADD NEW DOCUMENTS / ATTACHMENTS (PRESERVING EXISTING) ---
    const newUploadedFiles = [
      ...(req.files?.resourceFiles || []),
      ...(req.files?.documents || []),
      ...(req.files?.attachments || []),
      ...(req.files?.files || [])
    ];

    let customTitles = [];
    if (req.body.resourceTitles) {
      try {
        customTitles = typeof req.body.resourceTitles === "string"
          ? JSON.parse(req.body.resourceTitles)
          : req.body.resourceTitles;
      } catch {
        customTitles = [req.body.resourceTitles];
      }
    }

    newUploadedFiles.forEach((file, index) => {
      const rawTitle = customTitles[index] || path.parse(file.originalname).name;
      const resourceTitle = (rawTitle || "Attachment").trim().slice(0, 120);
      lecture.resources.push({
        title: resourceTitle,
        resourceType: detectResourceType(file.originalname),
        fileUrl: `/uploads/lectures/resources/${file.filename}`,
        filename: file.filename,
        originalname: file.originalname,
        filesize: file.size,
        mimetype: file.mimetype,
        downloadCount: 0
      });
    });

    // Support pre-uploaded documents passed in body in edit mode
    if (req.body.uploadedDocuments) {
      try {
        const preUploaded = typeof req.body.uploadedDocuments === "string"
          ? JSON.parse(req.body.uploadedDocuments)
          : req.body.uploadedDocuments;
        if (Array.isArray(preUploaded)) {
          preUploaded.forEach((doc) => {
            if (doc.fileUrl && (doc.title || doc.originalname)) {
              lecture.resources.push({
                title: (doc.title || doc.originalname || "Attachment").trim().slice(0, 120),
                resourceType: doc.resourceType || detectResourceType(doc.originalname || doc.filename),
                fileUrl: doc.fileUrl,
                filename: doc.filename || "",
                originalname: doc.originalname || doc.filename || "Attachment",
                filesize: Number(doc.filesize || doc.size) || 0,
                mimetype: doc.mimetype || "application/octet-stream",
                downloadCount: 0
              });
            }
          });
        }
      } catch (err) {
        console.warn("Could not parse uploadedDocuments in edit mode:", err.message);
      }
    }

    // Ensure videoSource consistency if video was removed or added
    if (!lecture.videoUrl) {
      if (lecture.resources.length > 0) {
        lecture.videoSource = "documents";
      } else {
        lecture.videoSource = "none";
      }
    } else if (lecture.videoSource === "none" || lecture.videoSource === "documents") {
      lecture.videoSource = "upload";
    }

    await lecture.save();

    // After successful save, safely clean up old video file if replaced
    if (oldVideoToClean && fs.existsSync(oldVideoToClean)) {
      try {
        fs.unlinkSync(oldVideoToClean);
      } catch (err) {
        console.warn("Could not unlink old replaced video file:", oldVideoToClean, err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lecture updated successfully.",
      lecture: {
        ...lecture.toObject(),
        id: lecture._id.toString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/lectures/:id
 * @desc    Delete a lecture, remove physical files, and clear student progress
 * @access  Private (Teacher uploader, HOD, Admin)
 */
export async function deleteLecture(req, res, next) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lecture ID." });
    }

    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found." });
    }

    const isUploader = lecture.uploadedBy.toString() === user._id.toString();
    const isAdmin = ["admin", "principal"].includes(user.role);

    let isAuthorizedHOD = false;
    if (user.role === "hod") {
      const hodProf = await HODProfile.findOne({ userId: user._id }).lean();
      const hodBranch = resolveDepartmentBranch(hodProf?.department || user.department);
      if (hodBranch === resolveDepartmentBranch(lecture.branch)) {
        isAuthorizedHOD = true;
      }
    }

    let isAuthorizedCoordinator = false;
    if (user.role === "coordinator") {
      const coordProf = await CoordinatorProfile.findOne({ userId: user._id }).lean();
      const coordBranch = resolveDepartmentBranch(coordProf?.department || user.department);
      if (!coordBranch || coordBranch === resolveDepartmentBranch(lecture.branch)) {
        isAuthorizedCoordinator = true;
      }
    }

    if (!isUploader && !isAdmin && !isAuthorizedHOD && !isAuthorizedCoordinator) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You do not have authorization to delete this lecture."
      });
    }

    // Cleanup physical files from disk if stored locally
    const filesToClean = [
      lecture.videoFile?.path,
      lecture.videoFile?.filename ? resolveUploadFile(lecture.videoFile.filename, "lectures/videos") : null,
      lecture.thumbnailFile?.path,
      lecture.thumbnailFile?.filename ? resolveUploadFile(lecture.thumbnailFile.filename, "lectures/thumbnails") : null,
      ...(lecture.resources || []).map((r) =>
        r.filename ? resolveUploadFile(r.filename, "lectures/resources") : null
      )
    ].filter(Boolean);

    filesToClean.forEach((filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // Non-blocking file deletion
      }
    });

    await Promise.all([
      Lecture.findByIdAndDelete(id),
      LectureProgress.deleteMany({ lectureId: id }),
      LectureDownload.deleteMany({ lectureId: id })
    ]);

    return res.status(200).json({
      success: true,
      message: "Lecture and associated files permanently deleted."
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/lectures/:id/progress
 * @desc    Save video playback progress, calculate completion %, mark completed at >= 90%
 * @access  Private (Student)
 */
export async function saveWatchProgress(req, res, next) {
  try {
    const user = req.user;
    const { id } = req.params;
    const {
      lastPlaybackPosition = 0,
      duration = 0,
      watchSessionSeconds = 5
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lecture ID." });
    }

    const lecture = await Lecture.findById(id).lean();
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found." });
    }

    const effectiveDuration = Math.max(
      1,
      Number(duration) || lecture.durationSeconds || lecture.durationMinutes * 60 || 2700
    );
    const currentPosition = Math.max(0, Number(lastPlaybackPosition) || 0);

    let progress = await LectureProgress.findOne({
      studentId: user._id,
      lectureId: lecture._id
    });

    const isFirstView = !progress;

    if (!progress) {
      progress = new LectureProgress({
        studentId: user._id,
        lectureId: lecture._id,
        branch: lecture.branch,
        semester: lecture.semester,
        subject: lecture.subject,
        firstWatchedAt: new Date(),
        lectureDuration: effectiveDuration,
        sessionsCount: 1
      });
    } else {
      const lastPingTime = progress.lastWatchedAt ? new Date(progress.lastWatchedAt).getTime() : 0;
      if (Date.now() - lastPingTime > 15 * 60 * 1000 || req.body.isNewSession) {
        progress.sessionsCount = (progress.sessionsCount || 1) + 1;
      }
    }

    // Deduplicate watch session duration (up to 30 seconds per ping to prevent artificial inflated watch times)
    const incrementalWatch = Math.min(30, Math.max(0, Number(watchSessionSeconds) || 5));
    progress.totalWatchDuration = (progress.totalWatchDuration || 0) + incrementalWatch;
    progress.lastPlaybackPosition = currentPosition;
    progress.highestPlaybackPosition = Math.max(progress.highestPlaybackPosition || 0, currentPosition);
    progress.lectureDuration = effectiveDuration;
    progress.lastWatchedAt = new Date();

    // Calculate percentage based on highest playback position achieved
    const rawPct = Math.round((progress.highestPlaybackPosition / effectiveDuration) * 100);
    const pct = Math.min(100, Math.max(progress.completionPercentage || 0, rawPct));
    progress.completionPercentage = pct;

    // Check completion threshold (>= 90%)
    let justCompleted = false;
    if (pct >= 90 && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
      justCompleted = true;
    }

    await progress.save();

    // Increment completionsCount on Lecture if newly completed
    if (justCompleted) {
      await Lecture.findByIdAndUpdate(lecture._id, { $inc: { completionsCount: 1 } });
    }

    return res.status(200).json({
      success: true,
      progress: {
        lastPlaybackPosition: progress.lastPlaybackPosition,
        highestPlaybackPosition: progress.highestPlaybackPosition,
        totalWatchDuration: progress.totalWatchDuration,
        completionPercentage: progress.completionPercentage,
        isCompleted: progress.isCompleted,
        lastWatchedAt: progress.lastWatchedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/lectures/student/history
 * @desc    Get student's personalized lecture library (Continue Watching, Completed, Downloaded, Statistics)
 * @access  Private (Student)
 */
export async function getStudentWatchHistory(req, res, next) {
  try {
    const user = req.user;

    const studentProf = await StudentProfile.findOne({ userId: user._id }).lean();
    if (!studentProf) {
      return res.status(403).json({
        success: false,
        message: "Student profile not found."
      });
    }

    const [allProgresses, downloads] = await Promise.all([
      LectureProgress.find({ studentId: user._id })
        .populate("lectureId")
        .sort({ lastWatchedAt: -1 })
        .lean(),
      LectureDownload.find({ userId: user._id })
        .populate("lectureId")
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const continueWatching = [];
    const completed = [];
    let totalWatchSeconds = 0;

    allProgresses.forEach((p) => {
      if (!p.lectureId) return; // Mismatched or deleted lecture
      totalWatchSeconds += p.totalWatchDuration || 0;

      const item = {
        ...p.lectureId,
        id: p.lectureId._id.toString(),
        progress: {
          lastPlaybackPosition: p.lastPlaybackPosition,
          highestPlaybackPosition: p.highestPlaybackPosition,
          totalWatchDuration: p.totalWatchDuration,
          completionPercentage: p.completionPercentage,
          isCompleted: p.isCompleted,
          lastWatchedAt: p.lastWatchedAt
        }
      };

      if (p.isCompleted) {
        completed.push(item);
      } else if (p.completionPercentage > 0) {
        continueWatching.push(item);
      }
    });

    // Deduplicate downloaded lectures
    const downloadedMap = new Map();
    downloads.forEach((d) => {
      if (!d.lectureId) return;
      const idStr = d.lectureId._id.toString();
      if (!downloadedMap.has(idStr)) {
        downloadedMap.set(idStr, {
          ...d.lectureId,
          id: idStr,
          downloadedAt: d.createdAt,
          resourceTitle: d.resourceTitle,
          downloadType: d.downloadType
        });
      }
    });

    const downloaded = Array.from(downloadedMap.values());

    // Fetch all published lectures for the student's branch & semester to compute exact syllabus progress
    const normBranch = resolveDepartmentBranch(studentProf.branch || user.branch || "CSE");
    const branchFilter = getDepartmentQueryFilter(normBranch).queryFilter;
    const publishedLectures = await Lecture.find({
      branch: branchFilter,
      semester: studentProf.semester,
      status: "published"
    }).lean();

    const progressByLecId = new Map();
    allProgresses.forEach((p) => {
      if (p.lectureId) {
        progressByLecId.set(p.lectureId._id ? p.lectureId._id.toString() : p.lectureId.toString(), p);
      }
    });

    const subjectMap = new Map();
    let totalSyllabusProgressSum = 0;
    let completedSyllabusLectures = 0;

    publishedLectures.forEach((lec) => {
      const sName = lec.subject || "General";
      if (!subjectMap.has(sName)) {
        subjectMap.set(sName, {
          subject: sName,
          totalLectures: 0,
          completedLectures: 0,
          inProgressLectures: 0,
          totalDurationMinutes: 0,
          progressSum: 0,
          topics: new Set()
        });
      }
      const sObj = subjectMap.get(sName);
      sObj.totalLectures += 1;
      sObj.totalDurationMinutes += lec.durationMinutes || 0;
      if (lec.topic) sObj.topics.add(lec.topic);

      const prog = progressByLecId.get(lec._id.toString());
      const pct = prog?.completionPercentage || 0;
      const isDone = Boolean(prog?.isCompleted || pct >= 90);

      sObj.progressSum += pct;
      totalSyllabusProgressSum += pct;

      if (isDone) {
        sObj.completedLectures += 1;
        completedSyllabusLectures += 1;
      } else if (pct > 0) {
        sObj.inProgressLectures += 1;
      }
    });

    const subjectsBreakdown = Array.from(subjectMap.values()).map((s) => {
      let completionPct = 0;
      if (s.totalLectures > 0) {
        if (s.completedLectures === s.totalLectures) {
          completionPct = 100;
        } else if (s.completedLectures > 0) {
          completionPct = Math.round((s.completedLectures / s.totalLectures) * 100);
        } else if (s.progressSum > 0) {
          completionPct = Math.min(89, Math.round(s.progressSum / s.totalLectures));
        }
      }
      return {
        subject: s.subject,
        totalLectures: s.totalLectures,
        completedLectures: s.completedLectures,
        inProgressLectures: s.inProgressLectures,
        totalDurationMinutes: s.totalDurationMinutes,
        uniqueTopicsCount: s.topics.size,
        completionPercentage: completionPct
      };
    });

    const totalPubCount = publishedLectures.length;
    let overallCompletionPercentage = 0;
    if (totalPubCount > 0) {
      if (completedSyllabusLectures === totalPubCount) {
        overallCompletionPercentage = 100;
      } else if (completedSyllabusLectures > 0) {
        overallCompletionPercentage = Math.round((completedSyllabusLectures / totalPubCount) * 100);
      } else if (totalSyllabusProgressSum > 0) {
        overallCompletionPercentage = Math.min(89, Math.round(totalSyllabusProgressSum / totalPubCount));
      }
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalWatchedLectures: allProgresses.length,
        completedLecturesCount: completed.length,
        inProgressCount: continueWatching.length,
        totalDownloadsCount: downloads.length,
        totalWatchTimeMinutes: Math.round(totalWatchSeconds / 60),
        totalSyllabusLectures: totalPubCount,
        completedSyllabusLectures,
        overallCompletionPercentage
      },
      syllabusSummary: {
        overallCompletionPercentage,
        totalSyllabusLectures: totalPubCount,
        completedSyllabusLectures,
        subjectsBreakdown
      },
      continueWatching,
      completed,
      downloaded
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/lectures/:id/download/:resourceId?
 * @desc    Securely download video or resource attachment, check student scope, log audit
 * @access  Private
 */
export async function downloadLectureResource(req, res, next) {
  try {
    const user = req.user;
    const { id, resourceId } = req.params;
    const { type = "resource" } = req.query; // 'video' or 'resource'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lecture ID." });
    }

    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found." });
    }

    // Access authorization check: Students must be in matching branch
    if (user.role === "student") {
      const studentProf = await StudentProfile.findOne({ userId: user._id }).lean();
      const studentBranch = resolveDepartmentBranch(studentProf?.branch || user.branch);
      const lectureBranch = resolveDepartmentBranch(lecture.branch);
      if (!studentProf || studentBranch !== lectureBranch) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: You can only download lectures for ${lecture.branch} students.`
        });
      }
    }

    let filePath = "";
    let downloadFilename = "";
    let resourceTitle = "";

    if (type === "video" || !resourceId) {
      // Check if lecture is a downloadable video file
      if (lecture.videoSource === "youtube" || (!lecture.videoFile?.filename && (!lecture.videoUrl || !lecture.videoUrl.startsWith("/uploads/")))) {
        return res.status(400).json({
          success: false,
          message: "This lecture is hosted on an external streaming service (e.g. YouTube) and cannot be downloaded as an MP4 file."
        });
      }

      const rawVideoName = lecture.videoFile?.filename || path.basename(lecture.videoUrl);
      filePath = resolveUploadFile(rawVideoName, "lectures/videos");

      let cleanName = (lecture.videoFile?.originalname || `${lecture.title}.mp4`)
        .replace(/[/\\?%*:|"<>]/g, "_")
        .trim();
      if (!cleanName.toLowerCase().endsWith(".mp4")) {
        cleanName += ".mp4";
      }
      downloadFilename = cleanName;
      resourceTitle = `${lecture.title} (MP4 Video)`;
    } else {
      // Downloading a specific resource attachment
      const resItem = lecture.resources.id(resourceId);
      if (!resItem) {
        return res.status(404).json({ success: false, message: "Resource attachment not found." });
      }

      resourceTitle = resItem.title;
      resItem.downloadCount = (resItem.downloadCount || 0) + 1;

      if (resItem.fileUrl && !resItem.fileUrl.startsWith("/uploads/") && !resItem.filename) {
        // External resource link redirect
        await LectureDownload.create({
          lectureId: lecture._id,
          resourceId: resItem._id,
          resourceTitle: resItem.title,
          downloadType: "resource",
          userId: user._id,
          userName: user.fullName,
          userRole: user.role,
          userBranch: user.branch || "",
          userSemester: user.semester || "",
          ipAddress: req.ip || "",
          userAgent: req.headers["user-agent"] || ""
        });
        await Lecture.findByIdAndUpdate(lecture._id, { $inc: { downloadsCount: 1 } });
        return res.redirect(resItem.fileUrl);
      }

      const rawResFilename = resItem.filename || path.basename(resItem.fileUrl);
      filePath = resolveUploadFile(rawResFilename, "lectures/resources");

      let safeResName = (resItem.originalname || rawResFilename).replace(/["\r\n\\/]/g, "").trim();
      downloadFilename = safeResName || "document";
    }

    // Verify physical file existence on disk
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "The requested file could not be found on the storage server."
      });
    }

    // Explicitly set accurate IANA MIME types to guarantee binary fidelity
    const ext = path.extname(downloadFilename).toLowerCase();
    const mimeTypes = {
      ".pdf": "application/pdf",
      ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".ppt": "application/vnd.ms-powerpoint",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".doc": "application/msword",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls": "application/vnd.ms-excel",
      ".zip": "application/zip",
      ".mp4": "video/mp4",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".txt": "text/plain"
    };

    if (mimeTypes[ext]) {
      res.setHeader("Content-Type", mimeTypes[ext]);
    }
    res.setHeader("Content-Disposition", `attachment; filename="${downloadFilename}"`);

    // Log the download event in MongoDB audit collection
    await LectureDownload.create({
      lectureId: lecture._id,
      resourceId: resourceId || null,
      resourceTitle,
      downloadType: type === "video" ? "video" : "resource",
      userId: user._id,
      userName: user.fullName,
      userRole: user.role,
      userBranch: user.branch || "",
      userSemester: user.semester || "",
      ipAddress: req.ip || "",
      userAgent: req.headers["user-agent"] || ""
    });

    // Increment lecture download metric
    lecture.downloadsCount = (lecture.downloadsCount || 0) + 1;
    await lecture.save();

    res.download(filePath, downloadFilename);
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/lectures/analytics/overview
 * @desc    Get staff analytics (total lectures, views, completions, downloads, student progress)
 * @access  Private (Teacher, HOD, Coordinator, Principal, Admin)
 */
export async function getLectureAnalytics(req, res, next) {
  try {
    const user = req.user;
    const { branch, semester, subject } = req.query;

    let targetBranch = branch;
    if (user.role === "hod") {
      const hodProf = await HODProfile.findOne({ userId: user._id }).lean();
      targetBranch = hodProf?.department || user.department || "CSE";
    }

    const filter = {};
    if (targetBranch) filter.branch = targetBranch;
    if (semester) filter.semester = semester;
    if (subject) filter.subject = subject;

    if (user.role === "teacher" && !targetBranch) {
      filter.uploadedBy = user._id;
    }

    const [lectures, totalDownloadsCount] = await Promise.all([
      Lecture.find(filter).sort({ viewsCount: -1 }).lean(),
      LectureDownload.countDocuments(
        targetBranch ? { userBranch: targetBranch } : {}
      )
    ]);

    const totalLectures = lectures.length;
    let totalViews = 0;
    let totalCompletions = 0;
    let totalResourcesCount = 0;

    lectures.forEach((l) => {
      totalViews += l.viewsCount || 0;
      totalCompletions += l.completionsCount || 0;
      totalResourcesCount += (l.resources || []).length;
    });

    // Top 5 most engaged lectures
    const topLectures = lectures.slice(0, 5).map((l) => ({
      id: l._id.toString(),
      title: l.title,
      subject: l.subject,
      topic: l.topic,
      viewsCount: l.viewsCount || 0,
      completionsCount: l.completionsCount || 0,
      downloadsCount: l.downloadsCount || 0,
      completionRate: l.viewsCount > 0 ? Math.round((l.completionsCount / l.viewsCount) * 100) : 0
    }));

    // Student Progress breakdown for this branch & semester
    let studentProgressList = [];
    if (targetBranch) {
      const studentFilter = { branch: targetBranch };
      if (semester) studentFilter.semester = semester;

      const students = await StudentProfile.find(studentFilter)
        .populate("userId", "fullName email avatarUrl")
        .lean();

      if (students.length > 0) {
        const studentUserIds = students.map((s) => s.userId?._id).filter(Boolean);
        const progressRecords = await LectureProgress.find({
          studentId: { $in: studentUserIds },
          branch: targetBranch
        }).lean();

        const progressByUser = new Map();
        progressRecords.forEach((pr) => {
          const uid = pr.studentId.toString();
          if (!progressByUser.has(uid)) {
            progressByUser.set(uid, {
              startedCount: 0,
              completedCount: 0,
              totalMinutes: 0
            });
          }
          const rec = progressByUser.get(uid);
          rec.startedCount += 1;
          if (pr.isCompleted) rec.completedCount += 1;
          rec.totalMinutes += Math.round((pr.totalWatchDuration || 0) / 60);
        });

        studentProgressList = students.map((st) => {
          const uid = st.userId?._id ? st.userId._id.toString() : "";
          const rec = progressByUser.get(uid) || { startedCount: 0, completedCount: 0, totalMinutes: 0 };
          return {
            studentId: uid,
            name: st.userId?.fullName || "Student",
            email: st.userId?.email || "",
            avatarUrl: st.userId?.avatarUrl || "",
            enrollmentNo: st.enrollmentNo || "N/A",
            branch: st.branch,
            semester: st.semester,
            startedLectures: rec.startedCount,
            completedLectures: rec.completedCount,
            totalWatchMinutes: rec.totalMinutes,
            overallCompletionRate: totalLectures > 0 ? Math.round((rec.completedCount / totalLectures) * 100) : 0
          };
        });
      }
    }

    return res.status(200).json({
      success: true,
      analytics: {
        totalLectures,
        totalViews,
        totalCompletions,
        totalDownloads: totalDownloadsCount,
        totalResources: totalResourcesCount,
        averageCompletionRate: totalViews > 0 ? Math.round((totalCompletions / totalViews) * 100) : 0,
        topLectures,
        studentProgressList
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/lectures/:id/analytics
 * @desc    Get detailed student-by-student watch analytics for a single lecture
 * @access  Private (Teacher, HOD, Coordinator, Principal, Admin)
 */
export async function getSingleLectureAnalytics(req, res, next) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lecture ID." });
    }

    const lecture = await Lecture.findById(id).lean();
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found." });
    }

    // Role-based scope authorization
    if (user.role === "teacher") {
      const isUploader = lecture.uploadedBy?.toString() === user._id.toString();
      if (!isUploader) {
        const teacherProf = await TeacherProfile.findOne({ userId: user._id }).lean();
        const hasAlloc = (teacherProf?.allocatedSubjects || []).some(
          (s) =>
            s.subject?.toLowerCase().trim() === lecture.subject?.toLowerCase().trim() &&
            resolveDepartmentBranch(s.branch) === resolveDepartmentBranch(lecture.branch)
        );
        if (!hasAlloc) {
          return res.status(403).json({
            success: false,
            message: "Forbidden: You can only view analytics for your assigned lectures."
          });
        }
      }
    } else if (user.role === "hod") {
      const hodProf = await HODProfile.findOne({ userId: user._id }).lean();
      const hodDept = resolveDepartmentBranch(hodProf?.department || user.department || "CSE");
      const lecDept = resolveDepartmentBranch(lecture.branch);
      if (hodDept !== lecDept) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: HOD can only view analytics for lectures in the ${hodDept} department.`
        });
      }
    } else if (user.role === "coordinator") {
      const coordProf = await CoordinatorProfile.findOne({ userId: user._id }).lean();
      const coordBranch = resolveDepartmentBranch(coordProf?.branch || user.branch);
      const lecBranch = resolveDepartmentBranch(lecture.branch);
      if (coordBranch !== lecBranch) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Coordinator can only view analytics within ${coordBranch}.`
        });
      }
    } else if (user.role === "student") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Students cannot access faculty watch analytics."
      });
    }

    // 1. Fetch eligible enrolled students for this branch & semester
    const branchFilter = getDepartmentQueryFilter(lecture.branch).queryFilter;
    const eligibleStudents = await StudentProfile.find({
      branch: branchFilter,
      semester: lecture.semester
    })
      .populate("userId", "fullName email avatarUrl enrollmentNo")
      .lean();

    // 2. Fetch all LectureProgress records for this specific lecture
    const progressRecords = await LectureProgress.find({ lectureId: lecture._id }).lean();
    const progressMap = new Map();
    progressRecords.forEach((p) => {
      progressMap.set(p.studentId.toString(), p);
    });

    // 3. Fetch all LectureDownload records for this specific lecture
    const downloadRecords = await LectureDownload.find({ lectureId: lecture._id }).lean();
    const downloadMap = new Map();
    let totalVideoDownloads = 0;
    let totalResourceDownloads = 0;

    downloadRecords.forEach((d) => {
      const uid = d.userId.toString();
      if (!downloadMap.has(uid)) {
        downloadMap.set(uid, { video: 0, resource: 0, total: 0 });
      }
      const item = downloadMap.get(uid);
      if (d.downloadType === "video") {
        item.video += 1;
        totalVideoDownloads += 1;
      } else {
        item.resource += 1;
        totalResourceDownloads += 1;
      }
      item.total += 1;
    });

    // 4. Aggregate student watch metrics
    let uniqueViewers = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let notStartedCount = 0;
    let totalSessions = 0;
    let totalWatchDurationSeconds = 0;
    let sumCompletionPct = 0;

    const studentList = eligibleStudents.map((st) => {
      const uid = st.userId?._id?.toString() || "";
      const prog = progressMap.get(uid);
      const dl = downloadMap.get(uid) || { video: 0, resource: 0, total: 0 };

      const pct = prog?.completionPercentage || 0;
      const watchSecs = prog?.totalWatchDuration || 0;
      const isComp = prog?.isCompleted || pct >= 90;
      const hasStarted = Boolean(prog && (pct > 0 || watchSecs > 0));
      const sessions = prog?.sessionsCount || (hasStarted ? 1 : 0);

      let status = "not_started";
      if (isComp) {
        status = "completed";
        completedCount += 1;
        uniqueViewers += 1;
      } else if (hasStarted) {
        status = "in_progress";
        inProgressCount += 1;
        uniqueViewers += 1;
      } else {
        notStartedCount += 1;
      }

      totalSessions += sessions;
      totalWatchDurationSeconds += watchSecs;
      sumCompletionPct += pct;

      return {
        studentId: uid,
        name: st.userId?.fullName || "Student",
        email: st.userId?.email || "",
        avatarUrl: st.userId?.avatarUrl || "",
        enrollmentNo: st.enrollmentNo || st.userId?.enrollmentNo || "N/A",
        branch: st.branch || lecture.branch,
        semester: st.semester || lecture.semester,
        status, // "not_started" | "in_progress" | "completed"
        completionPercentage: pct,
        totalWatchDurationSeconds: watchSecs,
        lastPlaybackPositionSeconds: prog?.lastPlaybackPosition || 0,
        sessionsCount: sessions,
        firstWatchedAt: prog?.firstWatchedAt || null,
        lastWatchedAt: prog?.lastWatchedAt || null,
        completedAt: prog?.completedAt || null,
        videoDownloadsCount: dl.video,
        resourceDownloadsCount: dl.resource
      };
    });

    const eligibleStudentsCount = eligibleStudents.length;
    const avgCompletion = eligibleStudentsCount > 0 ? Math.round(sumCompletionPct / eligibleStudentsCount) : 0;

    return res.status(200).json({
      success: true,
      lecture: {
        id: lecture._id.toString(),
        title: lecture.title,
        subject: lecture.subject,
        subjectCode: lecture.subjectCode,
        topic: lecture.topic,
        branch: lecture.branch,
        semester: lecture.semester,
        lectureType: lecture.lectureType,
        durationMinutes: lecture.durationMinutes,
        durationSeconds: lecture.durationSeconds,
        videoSource: lecture.videoSource,
        videoUrl: lecture.videoUrl,
        videoFile: lecture.videoFile,
        createdAt: lecture.createdAt
      },
      overview: {
        eligibleStudentsCount,
        uniqueViewers,
        notStartedCount,
        inProgressCount,
        completedCount,
        totalSessions,
        totalWatchDurationSeconds,
        averageCompletionPercentage: avgCompletion,
        totalVideoDownloads,
        totalResourceDownloads
      },
      students: studentList
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/lectures/:id/stream
 * @desc    Stream video chunks with HTTP 206 Partial Content, Range headers, and strict enrollment verification
 * @access  Private
 */
export async function streamLectureVideo(req, res, next) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lecture ID." });
    }

    const lecture = await Lecture.findById(id).lean();
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found." });
    }

    // Role-based security check: Students must be in matching branch
    if (user.role === "student") {
      const studentProf = await StudentProfile.findOne({ userId: user._id }).lean();
      const studentBranch = resolveDepartmentBranch(studentProf?.branch || user.branch);
      const lectureBranch = resolveDepartmentBranch(lecture.branch);
      if (!studentProf || studentBranch !== lectureBranch) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Restricted to enrolled students of ${lecture.branch}.`
        });
      }
    }

    // If external or YouTube, redirect
    if (lecture.videoSource === "youtube" || !lecture.videoFile?.filename) {
      if (lecture.videoUrl && !lecture.videoUrl.startsWith("/uploads/")) {
        return res.redirect(lecture.videoUrl);
      }
    }

    // Resolve physical file
    let filePath = "";
    if (lecture.videoFile?.filename) {
      filePath = resolveUploadFile(lecture.videoFile.filename, "lectures/videos");
    } else if (lecture.videoUrl?.startsWith("/uploads/")) {
      filePath = resolveUploadFile(lecture.videoUrl, "lectures/videos");
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Video file not found on storage server."
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === ".webm" ? "video/webm" : ext === ".mkv" ? "video/x-matroska" : "video/mp4";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes"
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
}

