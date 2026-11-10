import fs from 'fs';
import path from 'path';

function inspectFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  return {
    path: filePath,
    lines: content.split('\n').length,
    bytes: content.length,
    content
  };
}

// 1. Inspect Public Website in Home.jsx
const homeInfo = inspectFile('frontend/src/pages/Home.jsx');
const homeSections = [];
if (homeInfo) {
  const sectionMatches = [...homeInfo.content.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
  const forms = [...homeInfo.content.matchAll(/<form[^>]*>/g)];
  const modals = [...homeInfo.content.matchAll(/(Modal|modal|dialog)/gi)];
  const apis = [...homeInfo.content.matchAll(/authApi\.([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  const fetches = [...homeInfo.content.matchAll(/fetch\(['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
  console.log('--- HOME.JSX AUDIT ---');
  console.log('Sections IDs:', Array.from(new Set(sectionMatches)));
  console.log('Forms count:', forms.length);
  console.log('Direct authApi calls in Home:', Array.from(new Set(apis)));
  console.log('Direct fetch calls in Home:', Array.from(new Set(fetches)));
}

// 2. Inspect Student Pages
const studentPagesDir = 'frontend/src/pages/student';
const studentFiles = fs.readdirSync(studentPagesDir).filter(f => f.endsWith('.jsx'));
console.log('\n--- STUDENT PAGES (' + studentFiles.length + ') ---');
for (const file of studentFiles) {
  const info = inspectFile(path.join(studentPagesDir, file));
  const apis = [...info.content.matchAll(/authApi\.([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  console.log(`${file} (${info.lines} lines) -> APIs: [${Array.from(new Set(apis)).join(', ')}]`);
}

// 3. Inspect Teacher Pages
const teacherPagesDir = 'frontend/src/pages/teacher';
const teacherFiles = fs.readdirSync(teacherPagesDir).filter(f => f.endsWith('.jsx'));
console.log('\n--- TEACHER PAGES (' + teacherFiles.length + ') ---');
for (const file of teacherFiles) {
  const info = inspectFile(path.join(teacherPagesDir, file));
  const apis = [...info.content.matchAll(/authApi\.([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  console.log(`${file} (${info.lines} lines) -> APIs: [${Array.from(new Set(apis)).join(', ')}]`);
}

// 4. Inspect Coordinator Pages
const coordPagesDir = 'frontend/src/pages/coordinator';
const coordFiles = fs.readdirSync(coordPagesDir).filter(f => f.endsWith('.jsx'));
console.log('\n--- COORDINATOR PAGES (' + coordFiles.length + ') ---');
for (const file of coordFiles) {
  const info = inspectFile(path.join(coordPagesDir, file));
  const apis = [...info.content.matchAll(/authApi\.([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  console.log(`${file} (${info.lines} lines) -> APIs: [${Array.from(new Set(apis)).join(', ')}]`);
}

// 5. Inspect HOD Pages
const hodPagesDir = 'frontend/src/pages/hod';
const hodFiles = fs.readdirSync(hodPagesDir).filter(f => f.endsWith('.jsx'));
console.log('\n--- HOD PAGES (' + hodFiles.length + ') ---');
for (const file of hodFiles) {
  const info = inspectFile(path.join(hodPagesDir, file));
  const apis = [...info.content.matchAll(/authApi\.([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  console.log(`${file} (${info.lines} lines) -> APIs: [${Array.from(new Set(apis)).join(', ')}]`);
}

// 6. Inspect Principal Pages
const princPagesDir = 'frontend/src/pages/principal';
const princFiles = fs.readdirSync(princPagesDir).filter(f => f.endsWith('.jsx'));
console.log('\n--- PRINCIPAL PAGES (' + princFiles.length + ') ---');
for (const file of princFiles) {
  const info = inspectFile(path.join(princPagesDir, file));
  const apis = [...info.content.matchAll(/authApi\.([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  console.log(`${file} (${info.lines} lines) -> APIs: [${Array.from(new Set(apis)).join(', ')}]`);
}

// 7. Inspect Admin Pages
const adminPagesDir = 'frontend/src/pages/admin';
const adminFiles = fs.readdirSync(adminPagesDir).filter(f => f.endsWith('.jsx'));
console.log('\n--- ADMIN PAGES (' + adminFiles.length + ') ---');
for (const file of adminFiles) {
  const info = inspectFile(path.join(adminPagesDir, file));
  const apis = [...info.content.matchAll(/authApi\.([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  console.log(`${file} (${info.lines} lines) -> APIs: [${Array.from(new Set(apis)).join(', ')}]`);
}
