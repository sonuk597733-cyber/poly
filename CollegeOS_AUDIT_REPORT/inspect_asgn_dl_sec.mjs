import fs from 'fs';

const c = fs.readFileSync('backend/src/controllers/assignmentController.js', 'utf8');
const dlIdx = c.indexOf('export async function downloadSubmissionFile');
console.log('downloadSubmissionFile:\n', c.slice(dlIdx, dlIdx + 800));
