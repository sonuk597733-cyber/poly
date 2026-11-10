import fs from 'fs';

const c = fs.readFileSync('backend/src/controllers/authController.js', 'utf8');
const idx = c.indexOf('export async function register');
console.log(c.slice(idx, idx + 1000));
