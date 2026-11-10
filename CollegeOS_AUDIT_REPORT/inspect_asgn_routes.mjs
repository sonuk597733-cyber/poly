import fs from 'fs';

const c = fs.readFileSync('backend/src/routes/assignmentRoutes.js', 'utf8');
console.log('Assignment routes:\n', c);
