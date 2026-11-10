import fs from 'fs';

const c = fs.readFileSync('backend/src/controllers/assignmentController.js', 'utf8');
const createIdx = c.indexOf('export async function createAssignment');
console.log('createAssignment:\n', c.slice(createIdx, createIdx + 700));

const deleteIdx = c.indexOf('export async function deleteAssignment');
console.log('deleteAssignment:\n', c.slice(deleteIdx, deleteIdx + 700));
