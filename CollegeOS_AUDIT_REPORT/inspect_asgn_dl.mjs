import fs from 'fs';

const c = fs.readFileSync('backend/src/controllers/assignmentController.js', 'utf8');
const idx = c.indexOf('downloadAssignmentSubmission');
console.log(c.slice(idx, idx + 800));
