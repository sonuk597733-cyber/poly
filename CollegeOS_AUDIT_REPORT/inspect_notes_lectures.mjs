import fs from 'fs';

const n = fs.readFileSync('backend/src/routes/noteRoutes.js', 'utf8');
console.log('Note routes:\n', n);

const l = fs.readFileSync('backend/src/routes/lectureRoutes.js', 'utf8');
console.log('Lecture routes:\n', l);
