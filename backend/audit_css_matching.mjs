import fs from "fs";

const jsxClasses = JSON.parse(fs.readFileSync("backend/scratch_subject_classes.json", "utf8"));
const cssContent = fs.readFileSync("frontend/src/pages/student/StudentSubjectAttendance.css", "utf8");

const missing = [];
const present = [];

for (const cls of jsxClasses) {
  // Regex to check if selector contains .cls followed by delimiter
  const re = new RegExp(`\\.${cls}(?=[\\s\\.:,#>\\[\\{]|$)`);
  if (re.test(cssContent)) {
    present.push(cls);
  } else {
    missing.push(cls);
  }
}

console.log(`Classes PRESENT in CSS: ${present.length} / ${jsxClasses.length}`);
console.log(`Classes MISSING from CSS: ${missing.length} / ${jsxClasses.length}`);
console.log("\nMISSING CLASSES:\n", missing);
