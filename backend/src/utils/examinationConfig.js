/**
 * CollegeOS Official Examination Rules & Calculation Engine
 * Swami Vivekanand Subharti University (SVSU) Diploma in Engineering Ordinance
 */

import SystemSetting from "../models/SystemSetting.js";

export const DEFAULT_EXAMINATION_RULES = {
  gradingScale: [
    { minPct: 90, maxPct: 100, grade: "A+", gradePoint: 10, description: "Outstanding" },
    { minPct: 80, maxPct: 89.99, grade: "A", gradePoint: 9, description: "Excellent" },
    { minPct: 70, maxPct: 79.99, grade: "B+", gradePoint: 8, description: "Very Good" },
    { minPct: 60, maxPct: 69.99, grade: "B", gradePoint: 7, description: "Good" },
    { minPct: 50, maxPct: 59.99, grade: "C", gradePoint: 6, description: "Above Average" },
    { minPct: 40, maxPct: 49.99, grade: "D", gradePoint: 5, description: "Pass" },
    { minPct: 0, maxPct: 39.99, grade: "F", gradePoint: 0, description: "Fail" }
  ],
  passingCriteria: {
    minOverallSubjectPct: 40,
    minExternalPct: 40,
    minSessionalPct: 40
  },
  gracePolicy: {
    enabled: true,
    maxGraceMarksPerSemester: 5,
    maxFailingSubjectsAllowed: 1
  },
  carryOverRules: {
    maxBacklogsForPromotion: 4,
    promotionStatusIfBacklogs: "PCP"
  },
  standingClassifications: [
    { minPct: 75, standing: "First Class with Distinction" },
    { minPct: 60, standing: "First Class" },
    { minPct: 50, standing: "Second Class" },
    { minPct: 40, standing: "Pass Class" },
    { minPct: 0, standing: "Needs Retake" }
  ],
  workflowPolicies: {
    requirePrincipalSanction: false,
    autoLockOnPublish: true
  },
  roundingPrecision: 2
};

const SETTING_KEY = "examination_rules_svsu";

/**
 * Fetch authoritative examination rules from SystemSetting or seed defaults
 */
export async function getExaminationRules() {
  try {
    let settingDoc = await SystemSetting.findOne({ key: SETTING_KEY }).lean();
    if (!settingDoc) {
      settingDoc = await SystemSetting.create({
        key: SETTING_KEY,
        value: DEFAULT_EXAMINATION_RULES,
        category: "Academic",
        description: "Official SVSU Diploma Examination Rules, Grading Scale, and Progression Ordinance"
      });
      return DEFAULT_EXAMINATION_RULES;
    }
    return settingDoc.value || DEFAULT_EXAMINATION_RULES;
  } catch (error) {
    console.warn("Failed to load dynamic examination rules, falling back to defaults:", error.message);
    return DEFAULT_EXAMINATION_RULES;
  }
}

/**
 * Calculate grade, grade point, and pass/fail for a subject evaluation
 */
export function calculateSubjectGrade(components = {}, rules = DEFAULT_EXAMINATION_RULES) {
  const extMax = Number(components.externalMax) || 0;
  const extObt = Math.max(0, Number(components.externalObtained) || 0);
  const sessMax = Number(components.sessionalMax) || 0;
  const sessObt = Math.max(0, Number(components.sessionalObtained) || 0);
  const pracMax = Number(components.practicalMax) || 0;
  const pracObt = Math.max(0, Number(components.practicalObtained) || 0);

  const totalMax = extMax + sessMax + pracMax > 0 ? extMax + sessMax + pracMax : Number(components.maxMarks) || 100;
  const totalObtained = extObt + sessObt + pracObt > 0 ? extObt + sessObt + pracObt : Number(components.marksObtained) || 0;

  const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const { minOverallSubjectPct = 40, minExternalPct = 40 } = rules.passingCriteria || {};

  // Check component-level threshold (e.g. must get >=40% in external theory if external exists)
  let isFailedComponent = false;
  if (extMax > 0) {
    const extPct = (extObt / extMax) * 100;
    if (extPct < minExternalPct) {
      isFailedComponent = true;
    }
  }

  const isFailedOverall = pct < minOverallSubjectPct;
  const isFailed = isFailedComponent || isFailedOverall;

  // Grade matching from grading scale
  const scale = rules.gradingScale || DEFAULT_EXAMINATION_RULES.gradingScale;
  let matched = scale.find((b) => pct >= b.minPct && pct <= b.maxPct);
  if (!matched) {
    matched = isFailed ? { grade: "F", gradePoint: 0 } : { grade: "D", gradePoint: 5 };
  }

  // If component failed, force grade F with 0 grade point
  const grade = isFailed ? "F" : matched.grade;
  const gradePoint = isFailed ? 0 : matched.gradePoint;

  return {
    totalMax,
    totalObtained,
    pct: Number(pct.toFixed(2)),
    grade,
    gradePoint,
    isPassed: !isFailed,
    isFailedComponent,
    isFailedOverall
  };
}

/**
 * Process complete student semester results, evaluating SGPA, CGPA, COP, and Grace Marks
 */
export function evaluateStudentSemester({
  student,
  marks = [],
  curriculum = [],
  priorSemesterResults = [],
  rules = DEFAULT_EXAMINATION_RULES,
  applyGrace = false
}) {
  let totalMax = 0;
  let totalObtained = 0;
  let totalCredits = 0;
  let totalCreditPoints = 0;
  const evaluatedSubjects = [];
  const failingSubjects = [];

  for (const markDoc of marks) {
    const code = markDoc.subjectCode || "";
    const subjectInfo = curriculum.find((c) => c.subjectCode === code || c.subjectName === markDoc.subject) || {};
    const credits = Number(subjectInfo.credits) || Number(markDoc.creditEarned) || 3;

    const evalResult = calculateSubjectGrade(
      {
        externalMax: markDoc.externalMax,
        externalObtained: markDoc.externalObtained,
        sessionalMax: markDoc.sessionalMax,
        sessionalObtained: markDoc.sessionalObtained,
        practicalMax: markDoc.practicalMax,
        practicalObtained: markDoc.practicalObtained,
        maxMarks: markDoc.maxMarks,
        marksObtained: markDoc.marksObtained
      },
      rules
    );

    const creditPoint = evalResult.isPassed ? Number((credits * evalResult.gradePoint).toFixed(2)) : 0;

    const subjectEval = {
      subjectCode: code,
      subjectName: markDoc.subject,
      credits,
      externalMax: markDoc.externalMax || 0,
      externalObtained: markDoc.externalObtained || 0,
      sessionalMax: markDoc.sessionalMax || 0,
      sessionalObtained: markDoc.sessionalObtained || 0,
      totalMax: evalResult.totalMax,
      totalObtained: evalResult.totalObtained,
      pct: evalResult.pct,
      grade: evalResult.grade,
      gradePoint: evalResult.gradePoint,
      creditPointEarned: creditPoint,
      isPassed: evalResult.isPassed,
      markDocId: markDoc._id || markDoc.id
    };

    totalMax += evalResult.totalMax;
    totalObtained += evalResult.totalObtained;
    totalCredits += credits;
    totalCreditPoints += creditPoint;

    if (!evalResult.isPassed) {
      failingSubjects.push(subjectEval);
    }
    evaluatedSubjects.push(subjectEval);
  }

  // Grace Marks Evaluation (Policy: Max 5 marks, max 1 subject)
  let graceAwarded = 0;
  let graceSubject = "";
  if (applyGrace && rules.gracePolicy?.enabled && failingSubjects.length === 1) {
    const failing = failingSubjects[0];
    const passingRequired = Math.ceil(failing.totalMax * (rules.passingCriteria.minOverallSubjectPct / 100));
    const deficit = passingRequired - failing.totalObtained;

    if (deficit > 0 && deficit <= (rules.gracePolicy.maxGraceMarksPerSemester || 5)) {
      graceAwarded = deficit;
      graceSubject = failing.subjectCode || failing.subjectName;

      // Update subject evaluation with Grace Pass
      failing.totalObtained += deficit;
      failing.grade = "PWG";
      failing.gradePoint = 5;
      failing.creditPointEarned = Number((failing.credits * 5).toFixed(2));
      failing.isPassed = true;

      // Adjust totals
      totalObtained += deficit;
      totalCreditPoints += failing.creditPointEarned;

      // Remove from failing list
      failingSubjects.length = 0;
    }
  }

  // Calculate SGPA: Sum(Credit * GradePoint) / Sum(Credits)
  const precision = rules.roundingPrecision || 2;
  const sgpa = totalCredits > 0 ? Number((totalCreditPoints / totalCredits).toFixed(precision)) : 0.0;
  const overallPercentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(precision)) : 0.0;

  // Calculate CGPA across all published semesters
  let cgpaTotalCredits = totalCredits;
  let cgpaTotalCreditPoints = totalCreditPoints;
  for (const prior of priorSemesterResults) {
    if (prior.totalCredits && prior.totalCreditPoints) {
      cgpaTotalCredits += Number(prior.totalCredits);
      cgpaTotalCreditPoints += Number(prior.totalCreditPoints);
    }
  }
  const cgpa = cgpaTotalCredits > 0 ? Number((cgpaTotalCreditPoints / cgpaTotalCredits).toFixed(precision)) : sgpa;

  // Determine Carry Over Papers (COP) and Promotion Status
  const carryOverPapers = failingSubjects.map((s) => ({
    subjectCode: s.subjectCode,
    subjectName: s.subjectName,
    marksObtained: s.totalObtained,
    maxMarks: s.totalMax
  }));

  const copCount = carryOverPapers.length;
  let resultStatus = "PASS";
  if (graceAwarded > 0) {
    resultStatus = "PWG";
  } else if (copCount > 0) {
    const maxPromotable = rules.carryOverRules?.maxBacklogsForPromotion || 4;
    resultStatus = copCount <= maxPromotable ? "PCP" : "FAIL";
  }

  // Determine Academic Standing
  const classifications = rules.standingClassifications || DEFAULT_EXAMINATION_RULES.standingClassifications;
  let standing = "Pass Class";
  if (resultStatus === "FAIL") {
    standing = "Needs Retake";
  } else {
    const matchedStanding = classifications.find((c) => overallPercentage >= c.minPct);
    if (matchedStanding) standing = matchedStanding.standing;
  }

  return {
    totalMax,
    totalObtained,
    totalCredits,
    totalCreditPoints: Number(totalCreditPoints.toFixed(precision)),
    sgpa,
    cgpa,
    overallPercentage,
    standing,
    resultStatus,
    carryOverPapers,
    copCount,
    graceMarksAwarded: graceAwarded,
    graceSubjectCode: graceSubject,
    isAllSubjectsCleared: copCount === 0,
    evaluatedSubjects
  };
}
