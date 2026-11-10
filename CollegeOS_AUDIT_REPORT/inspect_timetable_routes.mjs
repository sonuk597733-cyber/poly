import fs from 'fs';

const t = fs.readFileSync('backend/src/routes/timetableRoutes.js', 'utf8');
console.log('Timetable routes:\n', t);
