import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Attendance from "../models/Attendance.js";
import ExamMark from "../models/ExamMark.js";
import Assignment from "../models/Assignment.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { getDepartmentQueryFilter, getSemesterQueryFilter } from "../utils/validators.js";

/**
 * Defines what profile fields each role may see in the student directory.
 * Students can see a safe public subset. Staff see more.
 */
function buildPublicProjection(callerRole) {
  // Every role can see these fields
  const baseSelect = "fullName email avatarUrl coverUrl bio status createdAt";

  if (callerRole === "student") {
    // Students may not see other students' phone numbers or private status details
    return baseSelect;
  }

  // Staff roles see phone as well
  return `${baseSelect} phone`;
}

function formatStudentCard(user, profile, callerRole) {
  const card = {
    id: user._id?.toString() || user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl || null,
    status: user.status,
    // Academic public info
    branch: profile?.branch || "N/A",
    academicYear: profile?.academicYear || "N/A",
    semester: profile?.semester || "N/A",
    enrollmentNo: profile?.enrollmentNo || null,
    skills: profile?.skills || [],
    bio: user.bio || profile?.bio || "",
    createdAt: user.createdAt
  };

  if (callerRole !== "student") {
    // Staff additionally see email, phone, cover
    card.email = user.email;
    card.coverUrl = user.coverUrl || null;
    card.phone = user.phone || "";
    card.attendancePercentage = profile?.attendancePercentage ?? null;
  }

  return card;
}

/**
 * @route   GET /api/students
 * @desc    Paginated, searchable, filterable All Students directory.
 *          All authenticated roles can access.
 *          Students see a limited safe public profile projection.
 *          Staff see fuller details per role permissions.
 * @access  Private (all roles)
 */
export async function getStudentsDirectory(req, res, next) {
  try {
    const callerRole = req.user.role;

    const {
      search = "",
      branch = "",
      semester = "",
      academicYear = "",
      status = "",
      page = "1",
      limit = "20"
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Step 1: Build user-level query
    const userQuery = { role: "student" };

    if (status && ["verified", "pending_verification", "active", "suspended"].includes(status)) {
      userQuery.status = status;
    }

    // Text search across fullName and email
    if (search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      userQuery.$or = [{ fullName: regex }, { email: regex }];
    }

    const projection = buildPublicProjection(callerRole);

    // Step 2: Handle search across users and profiles (fullName, email, enrollmentNo)
    let searchProfileUserIds = [];
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const enrollMatches = await StudentProfile.find({ enrollmentNo: searchRegex })
        .select("userId")
        .lean();
      searchProfileUserIds = enrollMatches.map((p) => p.userId);

      userQuery.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { _id: { $in: searchProfileUserIds } }
      ];
    }

    // Step 3: Handle academic scoping (branch, semester, academicYear)
    if (branch || semester || academicYear) {
      const profileQuery = {};
      if (branch) profileQuery.branch = getDepartmentQueryFilter(branch).queryFilter;
      if (semester) profileQuery.semester = getSemesterQueryFilter(semester).queryFilter;
      if (academicYear) profileQuery.academicYear = academicYear;

      const matchingProfiles = await StudentProfile.find(profileQuery).select("userId").lean();
      const filteredUserIds = matchingProfiles.map((p) => p.userId);

      if (filteredUserIds.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          page: pageNum,
          totalPages: 0,
          students: []
        });
      }

      // Intersect with user-level filters
      userQuery._id = { $in: filteredUserIds };
    }

    // Step 4: Count and paginate
    const total = await User.countDocuments(userQuery);
    const users = await User.find(userQuery)
      .select(projection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        students: []
      });
    }

    // Step 5: Batch-load profiles for the returned page
    const userIds = users.map((u) => u._id);
    const profiles = await StudentProfile.find({ userId: { $in: userIds } }).lean();
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    const students = users.map((u) => {
      const p = profileMap.get(u._id.toString());
      return formatStudentCard(u, p, callerRole);
    });

    return res.status(200).json({
      success: true,
      count: students.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      students
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/students/:id/public
 * @desc    Get student's public/authorized profile by ID.
 *          Students may view permitted fields of other students.
 *          Staff see fuller profile details.
 *          Private academic records (attendance, marks) only for authorized staff.
 * @access  Private (all roles)
 */
export async function getStudentPublicProfile(req, res, next) {
  try {
    const callerRole = req.user.role;
    const callerId = req.user._id.toString();
    const targetId = req.params.id;

    const projection = buildPublicProjection(callerRole);

    const student = await User.findOne({ _id: targetId, role: "student" })
      .select(projection)
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    const profile = await StudentProfile.findOne({ userId: student._id }).lean();

    const publicProfile = formatStudentCard(student, profile, callerRole);

    // Academic records — only for staff or self
    let academicData = null;

    const isSelf = callerId === student._id.toString();
    const isStaff = ["teacher", "hod", "coordinator", "principal", "admin"].includes(callerRole);

    if (isSelf || isStaff) {
      const [attendance, marks, assignments, leaves] = await Promise.all([
        isSelf || isStaff
          ? Attendance.find({ studentId: student._id })
              .sort({ date: -1 })
              .limit(30)
              .lean()
          : Promise.resolve([]),
        isSelf || isStaff
          ? ExamMark.find({ studentId: student._id })
              .sort({ createdAt: -1 })
              .limit(10)
              .lean()
          : Promise.resolve([]),
        isSelf || isStaff
          ? Assignment.find({
              branch: profile?.branch,
              semester: profile?.semester
            })
              .limit(5)
              .lean()
          : Promise.resolve([]),
        isSelf
          ? LeaveApplication.find({ applicantId: student._id })
              .sort({ createdAt: -1 })
              .limit(5)
              .lean()
          : Promise.resolve([])
      ]);

      // Strip private leave data from staff viewing other student (leave is personal)
      const totalLectures = attendance.length;
      const attended = attendance.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;
      const attendancePercentage =
        totalLectures > 0 ? Math.round((attended / totalLectures) * 100) : null;

      academicData = {
        attendancePercentage,
        totalLectures,
        attendedLectures: attended,
        recentAttendance: attendance.slice(0, 15).map((a) => ({
          subject: a.subject,
          date: a.date,
          status: a.status
        })),
        examMarks: marks.map((m) => ({
          subject: m.subject,
          examType: m.examType,
          marksObtained: m.marksObtained,
          maxMarks: m.maxMarks,
          grade: m.grade
        })),
        // Leaves only visible to the student themselves
        leaveApplications: isSelf
          ? leaves.map((l) => ({
              leaveType: l.leaveType,
              startDate: l.startDate,
              endDate: l.endDate,
              status: l.status,
              reason: l.reason
            }))
          : undefined
      };
    }

    return res.status(200).json({
      success: true,
      student: publicProfile,
      profile: {
        branch: profile?.branch || "N/A",
        academicYear: profile?.academicYear || "N/A",
        semester: profile?.semester || "N/A",
        enrollmentNo: profile?.enrollmentNo || null,
        skills: profile?.skills || [],
        bio: profile?.bio || ""
      },
      academicData
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/students/:id
 * @desc    Deactivate (soft-delete) a student account.
 *          ONLY Principal and authorized System Admin may call this.
 *          Preserves academic records, marks the account suspended.
 *          Logs the action for audit.
 * @access  Private (principal, admin ONLY)
 */
export async function deactivateStudent(req, res, next) {
  try {
    const callerRole = req.user.role;
    const callerId = req.user._id.toString();
    const callerName = req.user.fullName;

    // Double-enforce in controller — never trust frontend role
    if (!["principal", "admin"].includes(callerRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Only Principal or authorized System Administrator may deactivate student accounts."
      });
    }

    const targetId = req.params.id;

    // Validate target is actually a student
    const student = await User.findOne({ _id: targetId, role: "student" });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student account not found or target is not a student."
      });
    }

    // Prevent double-deactivation confusion
    if (student.status === "suspended") {
      return res.status(409).json({
        success: false,
        message: "This student account is already deactivated/suspended.",
        student: {
          id: student._id.toString(),
          fullName: student.fullName,
          email: student.email,
          status: student.status
        }
      });
    }

    // Soft-delete: mark suspended, do NOT delete academic records
    student.status = "suspended";
    await student.save({ validateBeforeSave: false });

    // Audit record in console (extend to AuditLog model if needed)
    console.log(
      `[AUDIT] Student deactivated | actor: ${callerName} (${callerRole}, ${callerId}) | target: ${student.fullName} (${student._id}) | timestamp: ${new Date().toISOString()}`
    );

    return res.status(200).json({
      success: true,
      message: `Student account for '${student.fullName}' has been deactivated successfully. Academic records are preserved.`,
      student: {
        id: student._id.toString(),
        fullName: student.fullName,
        email: student.email,
        status: student.status
      },
      audit: {
        action: "STUDENT_DEACTIVATED",
        actor: { id: callerId, role: callerRole, name: callerName },
        target: { id: student._id.toString(), name: student.fullName },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PATCH /api/students/:id/reactivate
 * @desc    Reactivate a previously suspended student account.
 *          ONLY Principal and authorized System Admin may call this.
 * @access  Private (principal, admin ONLY)
 */
export async function reactivateStudent(req, res, next) {
  try {
    const callerRole = req.user.role;
    const callerId = req.user._id.toString();
    const callerName = req.user.fullName;

    if (!["principal", "admin"].includes(callerRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Only Principal or authorized System Administrator may reactivate student accounts."
      });
    }

    const targetId = req.params.id;
    const student = await User.findOne({ _id: targetId, role: "student" });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student account not found or target is not a student."
      });
    }

    if (student.status !== "suspended") {
      return res.status(409).json({
        success: false,
        message: "Student account is not currently suspended.",
        student: { id: student._id.toString(), status: student.status }
      });
    }

    student.status = "verified";
    await student.save({ validateBeforeSave: false });

    console.log(
      `[AUDIT] Student reactivated | actor: ${callerName} (${callerRole}, ${callerId}) | target: ${student.fullName} (${student._id}) | timestamp: ${new Date().toISOString()}`
    );

    return res.status(200).json({
      success: true,
      message: `Student account for '${student.fullName}' has been reactivated.`,
      student: {
        id: student._id.toString(),
        fullName: student.fullName,
        email: student.email,
        status: student.status
      }
    });
  } catch (error) {
    next(error);
  }
}
