import fs from 'fs';

const a = fs.readFileSync('backend/src/routes/attendanceRoutes.js', 'utf8');
console.log('Attendance routes:\n', a);
