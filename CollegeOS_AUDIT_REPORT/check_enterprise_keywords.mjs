import fs from 'fs';

const terms = ['hostel', 'transport', 'payroll', 'inventory', 'visitor', 'parent', 'whatsapp', 'alumni', 'scholarship', 'admitcard', 'admit_card', 'crm', 'sms'];
const routes = fs.readFileSync('CollegeOS_AUDIT_REPORT/discovered_routes.json', 'utf8').toLowerCase();
const models = fs.readFileSync('CollegeOS_AUDIT_REPORT/discovered_models.json', 'utf8').toLowerCase();
const authApi = fs.readFileSync('CollegeOS_AUDIT_REPORT/discovered_authApi.json', 'utf8').toLowerCase();

for (const t of terms) {
  const inRoutes = routes.includes(t);
  const inModels = models.includes(t);
  const inAuth = authApi.includes(t);
  console.log(`${t.padEnd(15)}: inRoutes=${inRoutes}, inModels=${inModels}, inAuthApi=${inAuth}`);
}
