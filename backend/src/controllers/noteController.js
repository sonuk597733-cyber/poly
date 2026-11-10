import fs from "node:fs";
import path from "node:path";
import Note, { NOTE_CATEGORIES } from "../models/Note.js";
import NoteDownload from "../models/NoteDownload.js";
import StudentProfile from "../models/StudentProfile.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { resolveUploadFile, getUploadDestination } from "../utils/uploadPaths.js";
import { calculateFileChecksum } from "../middleware/noteUploadMiddleware.js";
import { validateExternalUrl } from "../utils/urlSecurity.js";
import {
  getDepartmentQueryFilter,
  getSemesterQueryFilter,
  isSameSemester,
  isSameBranch,
  resolveDepartmentBranch
} from "../utils/validators.js";

const MIME_MAP = {
  ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".ppt": "application/vnd.ms-powerpoint",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".zip": "application/zip",
  ".rar": "application/x-rar-compressed",
  ".7z": "application/x-7z-compressed",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".txt": "text/plain"
};

/**
 * Helper: Resolve student branch and semester
 */
async function getStudentAcademicContext(user) {
  if (user.role !== "student") return null;
  const profile = await StudentProfile.findOne({ userId: user._id }).lean();
  return {
    branch: profile?.branch || user.branch || "CSE",
    semester: profile?.semester || user.semester || "Semester 5",
    academicYear: profile?.academicYear || "3rd Year",
    enrollmentNo: profile?.enrollmentNo || "202427"
  };
}

/**
 * @route   GET /api/notes
 * @desc    Fetch published or managed study notes with search, tabs, filters & pagination
 * @access  Private (All authenticated roles)
 */
export async function getNotes(req, res, next) {
  try {
    const user = req.user;
    const {
      branch,
      semester,
      subject,
      unit,
      category,
      uploaderRole,
      isImportant,
      search,
      tab,
      sortBy = "newest",
      page = 1,
      limit = 20,
      myUploads = "false"
    } = req.query;

    const query = {};

    // 1. Role-based scoping
    if (user.role === "student") {
      const studentCtx = await getStudentAcademicContext(user);
      query.branch = getDepartmentQueryFilter(studentCtx.branch).queryFilter;
      query.semester = getSemesterQueryFilter(studentCtx.semester).queryFilter;
      query.publicationStatus = "published";
    } else if (user.role === "teacher") {
      if (myUploads === "true") {
        query.uploaderId = user._id;
      } else {
        if (branch && branch !== "all") query.branch = getDepartmentQueryFilter(branch).queryFilter;
        if (semester && semester !== "all") query.semester = getSemesterQueryFilter(semester).queryFilter;
      }
    } else if (user.role === "hod") {
      const dept = user.department || "CSE";
      query.branch = getDepartmentQueryFilter(dept).queryFilter;
      if (semester && semester !== "all") query.semester = getSemesterQueryFilter(semester).queryFilter;
    } else if (user.role === "coordinator") {
      const coordBranch = user.branch || user.department;
      if (coordBranch) query.branch = getDepartmentQueryFilter(coordBranch).queryFilter;
      if (semester && semester !== "all") query.semester = getSemesterQueryFilter(semester).queryFilter;
    } else {
      // principal / admin
      if (branch && branch !== "all") query.branch = getDepartmentQueryFilter(branch).queryFilter;
      if (semester && semester !== "all") query.semester = getSemesterQueryFilter(semester).queryFilter;
    }

    // 2. Query filters
    if (subject && subject !== "all") query.subject = subject;
    if (unit && unit !== "all") query.unit = unit;
    if (category && category !== "all") query.category = category;
    if (uploaderRole && uploaderRole !== "all") query.uploaderRole = uploaderRole;
    if (isImportant === "true") query.isImportant = true;

    // 3. Tab handling
    if (tab === "teacher") query.uploaderRole = "teacher";
    else if (tab === "coordinator") query.uploaderRole = "coordinator";
    else if (tab === "hod") query.uploaderRole = "hod";
    else if (tab === "important") query.isImportant = true;
    else if (tab === "downloaded" && user.role === "student") {
      const downloads = await NoteDownload.find({ studentId: user._id }).distinct("noteId");
      query._id = { $in: downloads };
    }

    // 4. Text Search
    if (search && search.trim()) {
      const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(term, "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { subject: regex },
        { unit: regex },
        { chapter: regex },
        { uploaderName: regex },
        { "file.originalFileName": regex },
        { "externalResources.title": regex }
      ];
    }

    // 5. Sorting
    let sortObj = { createdAt: -1 };
    if (sortBy === "oldest") sortObj = { createdAt: 1 };
    else if (sortBy === "alphabetical") sortObj = { title: 1 };
    else if (sortBy === "most_downloaded") sortObj = { downloadCount: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [totalNotes, notes] = await Promise.all([
      Note.countDocuments(query),
      Note.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate("uploaderId", "fullName email avatarUrl designation department")
        .lean()
    ]);

    // Check which notes student has already downloaded
    let downloadedSet = new Set();
    if (user.role === "student" && notes.length > 0) {
      const noteIds = notes.map((n) => n._id);
      const studentDownloads = await NoteDownload.find({
        studentId: user._id,
        noteId: { $in: noteIds }
      }).select("noteId");
      downloadedSet = new Set(studentDownloads.map((d) => d.noteId.toString()));
    }

    const formattedNotes = notes.map((n) => ({
      ...n,
      id: n._id.toString(),
      isDownloadedByMe: downloadedSet.has(n._id.toString())
    }));

    return res.status(200).json({
      success: true,
      count: formattedNotes.length,
      total: totalNotes,
      page: pageNum,
      totalPages: Math.ceil(totalNotes / limitNum) || 1,
      notes: formattedNotes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/notes/:id
 * @desc    Get detailed single note
 * @access  Private
 */
export async function getNoteById(req, res, next) {
  try {
    const { id } = req.params;
    const note = await Note.findById(id)
      .populate("uploaderId", "fullName email avatarUrl designation department")
      .lean();

    if (!note) {
      return res.status(404).json({ success: false, message: "Study material not found." });
    }

    // Student scope validation
    if (req.user.role === "student") {
      const studentCtx = await getStudentAcademicContext(req.user);
      const branchMatch = isSameBranch(note.branch, studentCtx.branch);
      const semMatch = isSameSemester(note.semester, studentCtx.semester);
      if (!branchMatch || !semMatch) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view study materials outside your academic branch and semester."
        });
      }
      if (note.publicationStatus !== "published") {
        return res.status(403).json({ success: false, message: "This material is not currently published." });
      }
    }

    return res.status(200).json({
      success: true,
      note: {
        ...note,
        id: note._id.toString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/notes
 * @desc    Upload & publish verified academic study notes / materials (File, URL, or Both)
 * @access  Private (Teacher, Coordinator, HOD, Principal, Admin)
 */
export async function createNote(req, res, next) {
  try {
    const user = req.user;
    const {
      title,
      description,
      subject,
      subjectCode,
      branch,
      semester,
      academicYear,
      unit,
      chapter,
      category,
      uploadMode: rawUploadMode,
      externalResources: rawExternalResources,
      externalUrl,
      externalTitle,
      externalDescription,
      isImportant,
      publicationStatus,
      targetGroups
    } = req.body;

    if (!title || !subject || !branch || !semester) {
      return res.status(400).json({
        success: false,
        message: "Title, subject, branch, and semester are required fields."
      });
    }

    // Role scope verification
    if (user.role === "hod") {
      const dept = user.department || "CSE";
      if (branch !== dept) {
        return res.status(403).json({
          success: false,
          message: `HODs can only publish materials within their authorized department (${dept}).`
        });
      }
    } else if (user.role === "coordinator") {
      const coordBranch = user.branch || user.department;
      if (coordBranch && branch !== coordBranch) {
        return res.status(403).json({
          success: false,
          message: `Coordinators can only publish materials within their authorized branch (${coordBranch}).`
        });
      }
    }

    // 1. Process File Attachments (req.files or req.file)
    const fileList = [];
    if (req.files?.files && Array.isArray(req.files.files)) {
      fileList.push(...req.files.files);
    }
    if (req.files?.file && Array.isArray(req.files.file)) {
      req.files.file.forEach((f) => {
        if (!fileList.some((item) => item.path === f.path)) {
          fileList.push(f);
        }
      });
    }
    if (req.file && !fileList.some((item) => item.path === req.file.path)) {
      fileList.push(req.file);
    }

    const processedFiles = fileList.map((f) => {
      const ext = path.extname(f.originalname).toLowerCase().replace(/^\./, "");
      const checksum = calculateFileChecksum(f.path);
      const mime = MIME_MAP[`.${ext}`] || f.mimetype || "application/octet-stream";
      return {
        fileName: f.filename,
        originalFileName: f.originalname,
        storedFileName: f.filename,
        filePath: `notes/${f.filename}`,
        mimeType: mime,
        fileSize: f.size,
        checksum,
        fileExtension: ext
      };
    });

    // 2. Process and Validate External Resource URLs
    let parsedResources = [];
    if (rawExternalResources) {
      if (typeof rawExternalResources === "string") {
        try {
          parsedResources = JSON.parse(rawExternalResources);
        } catch {
          parsedResources = [];
        }
      } else if (Array.isArray(rawExternalResources)) {
        parsedResources = rawExternalResources;
      }
    }

    if (externalUrl && typeof externalUrl === "string" && externalUrl.trim()) {
      parsedResources.push({
        title: externalTitle || title,
        url: externalUrl.trim(),
        description: externalDescription || ""
      });
    }

    const validatedExternalResources = [];
    for (const item of parsedResources) {
      if (!item || !item.url) continue;
      const val = validateExternalUrl(item.url);
      if (!val.valid) {
        return res.status(400).json({
          success: false,
          message: `Invalid external resource URL (${item.url}): ${val.reason}`
        });
      }
      validatedExternalResources.push({
        title: (item.title || title).trim(),
        url: val.url,
        provider: item.provider || val.provider,
        resourceType: item.resourceType || val.resourceType,
        embedUrl: val.embedUrl,
        description: (item.description || "").trim(),
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
      });
    }

    // Determine uploadMode
    let uploadMode = rawUploadMode || "file";
    if (processedFiles.length > 0 && validatedExternalResources.length > 0) {
      uploadMode = "both";
    } else if (validatedExternalResources.length > 0 && processedFiles.length === 0) {
      uploadMode = "url";
    } else {
      uploadMode = "file";
    }

    // Validation according to mode
    if (uploadMode === "file" && processedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please attach at least one authentic curriculum document file (.pdf, .pptx, .docx, .zip, etc.)."
      });
    }
    if (uploadMode === "url" && validatedExternalResources.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one valid external study resource URL (Google Drive, OneDrive, etc.)."
      });
    }
    if (uploadMode === "both" && (processedFiles.length === 0 || validatedExternalResources.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Combined mode requires both an attached file and a verified external resource URL."
      });
    }

    const primaryFile = processedFiles.length > 0 ? processedFiles[0] : null;

    const note = await Note.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      subject: subject.trim(),
      subjectCode: subjectCode ? subjectCode.trim() : "",
      branch,
      semester,
      academicYear: academicYear || "1st Year",
      unit: unit ? unit.trim() : "Unit 1",
      chapter: chapter ? chapter.trim() : "",
      category: category || "Lecture Notes",
      uploadMode,
      uploaderId: user._id,
      uploaderName: user.fullName,
      uploaderRole: user.role,
      uploaderDesignation: user.designation || (user.role === "hod" ? "Head of Department" : "Faculty Instructor"),
      uploaderDepartment: user.department || branch,
      file: primaryFile,
      files: processedFiles,
      externalResources: validatedExternalResources,
      isImportant: isImportant === "true" || isImportant === true,
      publicationStatus: publicationStatus || "published",
      targetGroups: targetGroups ? (Array.isArray(targetGroups) ? targetGroups : [targetGroups]) : ["All Students"]
    });

    // Notify enrolled students if published
    if (note.publicationStatus === "published") {
      try {
        const studentProfiles = await StudentProfile.find({
          branch: note.branch,
          semester: note.semester
        }).select("userId").lean();

        if (studentProfiles.length > 0) {
          const modeLabel = uploadMode === "both" ? "File & Cloud Reference" : uploadMode === "url" ? "Resource Link" : "Document";
          const notifications = studentProfiles.map((sp) => ({
            recipientId: sp.userId,
            recipientRole: "student",
            title: `New Notes: ${note.title}`,
            message: `${note.uploaderName} (${note.uploaderRole.toUpperCase()}) published new ${note.category} (${modeLabel}) for ${note.subject} (${note.unit}).`,
            type: note.isImportant ? "alert" : "info",
            link: "#/dashboard/notes"
          }));

          await Notification.insertMany(notifications, { ordered: false }).catch(() => {});
        }
      } catch (notifyErr) {
        console.warn("[Note Notification Dispatch Warning]", notifyErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Study notes published successfully.",
      note: {
        ...note.toObject(),
        id: note._id.toString()
      }
    });
  } catch (error) {
    next(error);
  }
}

function processUploadedFile(f) {
  const ext = path.extname(f.originalname).replace(".", "").toLowerCase() || "pdf";
  const mime = f.mimetype || MIME_MAP[`.${ext}`] || "application/octet-stream";
  const checksum = calculateFileChecksum(f.path);
  return {
    fileName: f.originalname,
    originalFileName: f.originalname,
    storedFileName: f.filename,
    filePath: `notes/${f.filename}`,
    mimeType: mime,
    fileSize: f.size,
    checksum,
    fileExtension: ext
  };
}

function cleanupUploadedFiles(filesObj) {
  if (!filesObj) return;
  const list = [];
  if (Array.isArray(filesObj)) {
    list.push(...filesObj);
  } else if (typeof filesObj === "object") {
    Object.values(filesObj).forEach((val) => {
      if (Array.isArray(val)) list.push(...val);
      else if (val && typeof val === "object" && val.path) list.push(val);
    });
  }
  list.forEach((f) => {
    if (f.path && fs.existsSync(f.path)) {
      try {
        fs.unlinkSync(f.path);
      } catch (err) {
        console.warn("[Upload Cleanup Warning]", err.message);
      }
    }
  });
}

/**
 * @route   PUT /api/notes/:id
 * @desc    Update note metadata, publication status, or resources
 * @access  Private (Uploader, HOD of department, Principal, Admin)
 */
export async function updateNote(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;
    const note = await Note.findById(id);

    if (!note) {
      cleanupUploadedFiles(req.files);
      return res.status(404).json({ success: false, message: "Study material not found." });
    }

    const isUploader = note.uploaderId.toString() === user._id.toString();
    const isHodOfDept = user.role === "hod" && (user.department === note.branch || user.branch === note.branch);
    const isPrivileged = ["principal", "admin"].includes(user.role);

    if (!isUploader && !isHodOfDept && !isPrivileged) {
      cleanupUploadedFiles(req.files);
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this study material."
      });
    }

    const {
      title,
      description,
      subject,
      subjectCode,
      unit,
      chapter,
      category,
      isImportant,
      publicationStatus,
      targetGroups,
      externalResources: rawExternalResources,
      uploadMode
    } = req.body;

    if (title) note.title = title.trim();
    if (description !== undefined) note.description = description.trim();
    if (subject) note.subject = subject.trim();
    if (subjectCode !== undefined) note.subjectCode = subjectCode.trim();
    if (unit) note.unit = unit.trim();
    if (chapter !== undefined) note.chapter = chapter.trim();
    if (category) note.category = category;
    if (isImportant !== undefined) note.isImportant = isImportant === "true" || isImportant === true;
    if (publicationStatus) note.publicationStatus = publicationStatus;
    if (targetGroups) note.targetGroups = Array.isArray(targetGroups) ? targetGroups : [targetGroups];

    if (rawExternalResources !== undefined) {
      let parsed = [];
      if (typeof rawExternalResources === "string") {
        try {
          parsed = JSON.parse(rawExternalResources);
        } catch {
          parsed = [];
        }
      } else if (Array.isArray(rawExternalResources)) {
        parsed = rawExternalResources;
      }

      const validList = [];
      for (const item of parsed) {
        if (!item?.url) continue;
        const val = validateExternalUrl(item.url);
        if (!val.valid) {
          cleanupUploadedFiles(req.files);
          return res.status(400).json({
            success: false,
            message: `Invalid external resource URL (${item.url}): ${val.reason}`
          });
        }
        validList.push({
          title: (item.title || note.title).trim(),
          url: val.url,
          provider: item.provider || val.provider,
          resourceType: item.resourceType || val.resourceType,
          embedUrl: val.embedUrl,
          description: (item.description || "").trim(),
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
        });
      }
      note.externalResources = validList;
    }

    // Attachment Management: replacements, removals, and additions
    const filesToUnlinkAfterSave = [];
    let currentFiles = Array.isArray(note.files) ? [...note.files] : (note.file ? [note.file] : []);

    // 1. Process Staged Replacements
    let replacementTargets = [];
    if (req.body.replacementTargetIds) {
      if (typeof req.body.replacementTargetIds === "string") {
        try {
          replacementTargets = JSON.parse(req.body.replacementTargetIds);
        } catch {
          replacementTargets = req.body.replacementTargetIds.split(",").map((s) => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(req.body.replacementTargetIds)) {
        replacementTargets = req.body.replacementTargetIds;
      }
    }
    replacementTargets = replacementTargets.map((tid) => String(tid));

    const replacementUploads = req.files?.replacementFiles || [];
    replacementUploads.forEach((f, idx) => {
      const targetId = replacementTargets[idx];
      if (targetId) {
        const targetIdx = currentFiles.findIndex((cf) => String(cf._id || cf.id) === targetId);
        if (targetIdx !== -1) {
          if (currentFiles[targetIdx].filePath) {
            filesToUnlinkAfterSave.push(currentFiles[targetIdx].filePath);
          }
          currentFiles[targetIdx] = processUploadedFile(f);
        }
      }
    });

    // 2. Process Staged Removals
    let removedIds = [];
    if (req.body.removedFileIds) {
      if (typeof req.body.removedFileIds === "string") {
        try {
          removedIds = JSON.parse(req.body.removedFileIds);
        } catch {
          removedIds = req.body.removedFileIds.split(",").map((s) => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(req.body.removedFileIds)) {
        removedIds = req.body.removedFileIds;
      }
    }
    removedIds = removedIds.map((rid) => String(rid));

    if (removedIds.length > 0) {
      currentFiles.forEach((cf) => {
        if (removedIds.includes(String(cf._id || cf.id))) {
          if (cf.filePath && !filesToUnlinkAfterSave.includes(cf.filePath)) {
            filesToUnlinkAfterSave.push(cf.filePath);
          }
        }
      });
      currentFiles = currentFiles.filter((cf) => !removedIds.includes(String(cf._id || cf.id)));
    }

    // 3. Process Newly Added Attachments
    const newUploads = [
      ...(req.files?.files || []),
      ...(req.files?.file ? (Array.isArray(req.files.file) ? req.files.file : [req.files.file]) : [])
    ];
    newUploads.forEach((f) => {
      currentFiles.push(processUploadedFile(f));
    });

    // 4. Update note.files and primary note.file
    note.files = currentFiles;
    note.file = currentFiles.length > 0 ? currentFiles[0] : null;

    // 5. Update mode
    const hasFiles = note.files.length > 0;
    const hasUrls = Array.isArray(note.externalResources) && note.externalResources.length > 0;
    if (uploadMode) {
      note.uploadMode = uploadMode;
    } else if (hasFiles && hasUrls) {
      note.uploadMode = "both";
    } else if (hasUrls) {
      note.uploadMode = "url";
    } else {
      note.uploadMode = "file";
    }

    note.markModified("files");
    note.markModified("externalResources");

    await note.save();

    // 6. DB Save succeeded: safely unlink removed / replaced files from disk
    filesToUnlinkAfterSave.forEach((relPath) => {
      try {
        const diskPath = resolveUploadFile(relPath, "notes");
        if (diskPath && fs.existsSync(diskPath)) {
          fs.unlinkSync(diskPath);
        }
      } catch (unlinkErr) {
        console.warn("[Note File Cleanup Warning]", unlinkErr.message);
      }
    });

    return res.status(200).json({
      success: true,
      message: "Study material updated successfully.",
      note: {
        ...note.toObject(),
        id: note._id.toString()
      }
    });
  } catch (error) {
    cleanupUploadedFiles(req.files);
    next(error);
  }
}

/**
 * @route   DELETE /api/notes/:id
 * @desc    Safely delete note and remove stored physical files from disk
 * @access  Private (Uploader, HOD, Principal, Admin)
 */
export async function deleteNote(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Study material not found." });
    }

    const isUploader = note.uploaderId.toString() === user._id.toString();
    const isHodOfDept = user.role === "hod" && (user.department === note.branch || user.branch === note.branch);
    const isPrivileged = ["principal", "admin"].includes(user.role);

    if (!isUploader && !isHodOfDept && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this study material."
      });
    }

    // Collect all physical files associated with this note
    const filesToUnlink = [];
    if (note.file?.filePath) filesToUnlink.push(note.file.filePath);
    if (Array.isArray(note.files)) {
      note.files.forEach((f) => {
        if (f.filePath && !filesToUnlink.includes(f.filePath)) {
          filesToUnlink.push(f.filePath);
        }
      });
    }

    // 1. Delete DB records first
    await Promise.all([
      Note.deleteOne({ _id: id }),
      NoteDownload.deleteMany({ noteId: id })
    ]);

    // 2. DB deletion succeeded; safely delete physical files from disk
    filesToUnlink.forEach((relPath) => {
      const diskPath = resolveUploadFile(relPath, "notes");
      if (diskPath && fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (unlinkErr) {
          console.warn("[Delete File Unlink Warning]", unlinkErr.message);
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: "Study material and associated records deleted permanently."
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/notes/:id/preview
 * @desc    Stream document inline for in-browser PDF or image preview
 * @access  Private
 */
export async function previewNote(req, res, next) {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Study material not found." });
    }

    // Student scope validation
    if (req.user.role === "student") {
      const studentCtx = await getStudentAcademicContext(req.user);
      const branchMatch = isSameBranch(note.branch, studentCtx.branch);
      const semMatch = isSameSemester(note.semester, studentCtx.semester);
      if (!branchMatch || !semMatch) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access materials for this branch and semester."
        });
      }
    }

    // Identify target file
    let targetFile = note.file;
    if (req.query.fileId && Array.isArray(note.files)) {
      const found = note.files.find((f) => f._id?.toString() === req.query.fileId);
      if (found) targetFile = found;
    }
    if (!targetFile && Array.isArray(note.files) && note.files.length > 0) {
      targetFile = note.files[0];
    }

    if (!targetFile || !targetFile.filePath) {
      return res.status(400).json({
        success: false,
        message: "This study material is an external resource and has no physical server file to preview."
      });
    }

    const filePath = resolveUploadFile(targetFile.filePath, "notes");
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Physical note file is missing or has been relocated from disk."
      });
    }

    // Increment view count
    await Note.updateOne({ _id: id }, { $inc: { viewCount: 1 } });

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_MAP[ext] || targetFile.mimeType || "application/octet-stream";
    const filename = targetFile.originalFileName || path.basename(filePath);

    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = fs.createReadStream(filePath);
    return stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/notes/:id/download
 * @desc    Download authentic unaltered original bytes with MIME & audit log
 * @access  Private
 */
export async function downloadNote(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Study material not found." });
    }

    // Student scope validation
    let studentCtx = null;
    if (user.role === "student") {
      studentCtx = await getStudentAcademicContext(user);
      const branchMatch = isSameBranch(note.branch, studentCtx.branch);
      const semMatch = isSameSemester(note.semester, studentCtx.semester);
      if (!branchMatch || !semMatch) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to download notes outside your enrolled academic scope."
        });
      }
    }

    // Identify target file
    let targetFile = note.file;
    if (req.query.fileId && Array.isArray(note.files)) {
      const found = note.files.find((f) => f._id?.toString() === req.query.fileId);
      if (found) targetFile = found;
    }
    if (!targetFile && Array.isArray(note.files) && note.files.length > 0) {
      targetFile = note.files[0];
    }

    if (!targetFile || !targetFile.filePath) {
      return res.status(400).json({
        success: false,
        message: "This study material is an external resource and has no downloadable server file attached."
      });
    }

    const filePath = resolveUploadFile(targetFile.filePath, "notes");
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "The requested document file could not be located on the server storage."
      });
    }

    // Increment note download count
    await Note.updateOne({ _id: id }, { $inc: { downloadCount: 1 } });

    // Record download audit log
    if (user.role === "student") {
      await NoteDownload.create({
        noteId: note._id,
        noteTitle: note.title,
        studentId: user._id,
        studentName: user.fullName,
        studentEnrollment: studentCtx?.enrollmentNo || "",
        studentBranch: studentCtx?.branch || "",
        studentSemester: studentCtx?.semester || "",
        fileSize: targetFile.fileSize || 0,
        ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
        userAgent: req.headers["user-agent"] || ""
      }).catch((logErr) => console.warn("[Note Download Audit Log Warning]", logErr.message));
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_MAP[ext] || targetFile.mimeType || "application/octet-stream";
    const downloadFilename = targetFile.originalFileName || `${note.title.replace(/[^a-zA-Z0-9_-]/g, "_")}${ext}`;

    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadFilename)}"`);
    res.setHeader("Content-Length", fs.statSync(filePath).size);
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = fs.createReadStream(filePath);
    return stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/notes/student/statistics
 * @desc    Real backend-driven summary counts for Student Dashboard
 * @access  Private (Student)
 */
export async function getStudentStatistics(req, res, next) {
  try {
    const studentCtx = await getStudentAcademicContext(req.user);
    if (!studentCtx) {
      return res.status(400).json({ success: false, message: "User is not a student." });
    }

    const query = {
      branch: getDepartmentQueryFilter(studentCtx.branch).queryFilter,
      semester: getSemesterQueryFilter(studentCtx.semester).queryFilter,
      publicationStatus: "published"
    };

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalNotes, distinctSubjects, recentNotes, importantNotes, myDownloads] = await Promise.all([
      Note.countDocuments(query),
      Note.distinct("subject", query),
      Note.countDocuments({ ...query, createdAt: { $gte: sevenDaysAgo } }),
      Note.countDocuments({ ...query, isImportant: true }),
      NoteDownload.find({ studentId: req.user._id }).distinct("noteId")
    ]);

    // Subject breakdown
    const subjectBreakdown = await Note.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$subject",
          subjectCode: { $first: "$subjectCode" },
          count: { $sum: 1 },
          latestUpload: { $max: "$createdAt" },
          units: { $addToSet: "$unit" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const subjects = subjectBreakdown.map((s) => ({
      name: s._id,
      code: s.subjectCode || "SUB",
      notesCount: s.count,
      unitsCount: s.units ? s.units.filter(Boolean).length : 1,
      latestUploadDate: s.latestUpload
    }));

    return res.status(200).json({
      success: true,
      statistics: {
        totalNotes,
        totalSubjects: distinctSubjects.length,
        recentUploads: recentNotes,
        importantMaterials: importantNotes,
        downloadedMaterials: myDownloads.length,
        studentBranch: studentCtx.branch,
        studentSemester: studentCtx.semester,
        studentYear: studentCtx.academicYear,
        subjects
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/notes/student/downloaded
 * @desc    List of all notes downloaded by the current student
 * @access  Private (Student)
 */
export async function getStudentDownloaded(req, res, next) {
  try {
    const downloads = await NoteDownload.find({ studentId: req.user._id })
      .sort({ downloadedAt: -1 })
      .populate({
        path: "noteId",
        populate: { path: "uploaderId", select: "fullName email avatarUrl" }
      })
      .lean();

    const downloadedNotes = downloads
      .filter((d) => d.noteId)
      .map((d) => ({
        ...d.noteId,
        id: d.noteId._id.toString(),
        downloadedAt: d.downloadedAt
      }));

    return res.status(200).json({
      success: true,
      count: downloadedNotes.length,
      downloadedNotes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/notes/:id/analytics
 * @desc    Detailed student download analytics for a specific note
 * @access  Private (Teacher, Coordinator, HOD, Principal, Admin)
 */
export async function getSingleNoteAnalytics(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role === "student") {
      return res.status(403).json({
        success: false,
        message: "Only faculty and administrative staff can view download analytics."
      });
    }

    const note = await Note.findById(id).lean();
    if (!note) {
      return res.status(404).json({ success: false, message: "Study material not found." });
    }

    // Role scope verification
    if (user.role === "teacher" && note.uploaderId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view download analytics for materials you published."
      });
    }
    if (user.role === "hod" && (user.department || user.branch) !== note.branch) {
      return res.status(403).json({
        success: false,
        message: "You cannot access download analytics for materials outside your department."
      });
    }

    // Retrieve eligible students enrolled in this branch & sem
    const eligibleStudents = await StudentProfile.find({
      branch: note.branch,
      semester: note.semester
    }).populate("userId", "fullName email avatarUrl").lean();

    const downloads = await NoteDownload.find({ noteId: note._id })
      .sort({ downloadedAt: -1 })
      .lean();

    // Map downloads by studentId
    const downloadMap = new Map();
    downloads.forEach((d) => {
      const sId = d.studentId.toString();
      if (!downloadMap.has(sId)) {
        downloadMap.set(sId, []);
      }
      downloadMap.get(sId).push(d);
    });

    const studentList = eligibleStudents.map((st) => {
      const sId = st.userId?._id ? st.userId._id.toString() : "";
      const history = downloadMap.get(sId) || [];
      const hasDownloaded = history.length > 0;
      return {
        studentId: sId,
        name: st.userId?.fullName || "Student",
        email: st.userId?.email || "",
        avatarUrl: st.userId?.avatarUrl || null,
        enrollmentNo: st.enrollmentNo || "202427",
        hasDownloaded,
        downloadCount: history.length,
        firstDownloadedAt: hasDownloaded ? history[history.length - 1].downloadedAt : null,
        lastDownloadedAt: hasDownloaded ? history[0].downloadedAt : null
      };
    });

    return res.status(200).json({
      success: true,
      analytics: {
        note: {
          id: note._id.toString(),
          title: note.title,
          subject: note.subject,
          branch: note.branch,
          semester: note.semester,
          category: note.category,
          unit: note.unit,
          fileSize: note.file?.fileSize || 0,
          checksum: note.file?.checksum || "",
          publishedAt: note.createdAt
        },
        overview: {
          eligibleStudentsCount: eligibleStudents.length,
          uniqueDownloadersCount: downloadMap.size,
          totalDownloadsCount: downloads.length,
          downloadRatePercentage: eligibleStudents.length > 0 ? Math.round((downloadMap.size / eligibleStudents.length) * 100) : 0
        },
        students: studentList
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/notes/analytics/overview
 * @desc    Comprehensive department / faculty notes analytics
 * @access  Private (Teacher, Coordinator, HOD, Principal, Admin)
 */
export async function getNotesAnalyticsOverview(req, res, next) {
  try {
    const user = req.user;
    if (user.role === "student") {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    const query = {};
    if (user.role === "teacher") {
      query.uploaderId = user._id;
    } else if (user.role === "hod") {
      query.branch = user.department || "CSE";
    } else if (user.role === "coordinator") {
      if (user.branch) query.branch = user.branch;
    }

    const [totalUploaded, totalDownloads, topNotes, subjectBreakdown] = await Promise.all([
      Note.countDocuments(query),
      Note.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$downloadCount" } } }
      ]),
      Note.find(query).sort({ downloadCount: -1 }).limit(5).select("title subject downloadCount category file.fileSize").lean(),
      Note.aggregate([
        { $match: query },
        { $group: { _id: "$subject", count: { $sum: 1 }, totalDownloads: { $sum: "$downloadCount" } } },
        { $sort: { totalDownloads: -1 } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      overview: {
        totalUploaded,
        totalDownloads: totalDownloads[0]?.total || 0,
        topNotes: topNotes.map((n) => ({ ...n, id: n._id.toString() })),
        subjectBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
}
