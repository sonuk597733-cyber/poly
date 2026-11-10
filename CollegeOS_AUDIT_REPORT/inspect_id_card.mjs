import fs from 'fs';

const c = fs.readFileSync('frontend/src/pages/student/StudentProfile.jsx', 'utf8');
const hasIdCard = /id[-_ ]?card|digital[-_ ]?id|badge|barcode|qr/i.test(c);
console.log('StudentProfile has ID card mentions:', hasIdCard);
const idMatches = [...c.matchAll(/(id[-_ ]?card|digital[-_ ]?id|badge|qr)/gi)].map(m => m[0]);
console.log('Matches in StudentProfile:', idMatches);

// Also check StudentPublicProfile.jsx
const p = fs.readFileSync('frontend/src/pages/StudentPublicProfile.jsx', 'utf8');
const pHasIdCard = /id[-_ ]?card|digital[-_ ]?id|badge|barcode|qr/i.test(p);
console.log('StudentPublicProfile has ID card mentions:', pHasIdCard);
