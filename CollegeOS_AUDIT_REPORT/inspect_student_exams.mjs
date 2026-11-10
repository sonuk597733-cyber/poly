import fs from 'fs';

const c = fs.readFileSync('frontend/src/pages/student/StudentExams.jsx', 'utf8');
const tabs = [...c.matchAll(/activeTab === ["']([^"']+)["']/g)].map(m => m[1]);
console.log('StudentExams activeTabs:', Array.from(new Set(tabs)));

const subheadings = [...c.matchAll(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/g)].map(m => m[1]);
console.log('StudentExams Headings:', subheadings.slice(0, 15));

const apis = [...c.matchAll(/authApi\.([a-zA-Z0-9_]+)/g)].map(m => m[1]);
console.log('StudentExams APIs called:', Array.from(new Set(apis)));
