import fs from 'fs';
import path from 'path';

// Helper to check route definitions in backend routes files
function scanBackendRoutes() {
  const routesDir = 'backend/src/routes';
  const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  const routeMap = [];

  for (const f of files) {
    const content = fs.readFileSync(path.join(routesDir, f), 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/router\.(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/i);
      if (match) {
        // Look ahead for authorize middleware
        const lookahead = lines.slice(i, i + 6).join(' ');
        const authMatch = lookahead.match(/authorize\(([^)]+)\)/);
        const roles = authMatch ? authMatch[1].replace(/["'\s]/g, '') : 'all/authenticated';
        routeMap.push({
          file: f,
          method: match[1].toUpperCase(),
          path: match[2],
          roles
        });
      }
    }
  }
  return routeMap;
}

// Helper to scan all models and schema fields
function scanBackendModels() {
  const modelsDir = 'backend/src/models';
  const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
  const modelMap = {};

  for (const f of files) {
    const content = fs.readFileSync(path.join(modelsDir, f), 'utf8');
    const modelName = f.replace('.js', '');
    const fields = [];
    const fieldMatches = [...content.matchAll(/([a-zA-Z0-9_]+)\s*:\s*\{/g)];
    for (const m of fieldMatches) {
      if (!['type', 'default', 'enum', 'required', 'ref', 'index', 'trim'].includes(m[1])) {
        fields.push(m[1]);
      }
    }
    modelMap[modelName] = {
      file: f,
      fields: Array.from(new Set(fields))
    };
  }
  return modelMap;
}

// Helper to scan authApi methods
function scanAuthApi() {
  const content = fs.readFileSync('frontend/src/services/authApi.js', 'utf8');
  const methods = [];
  const matches = [...content.matchAll(/async\s+([a-zA-Z0-9_]+)\s*\(/g)];
  for (const m of matches) {
    methods.push(m[1]);
  }
  return Array.from(new Set(methods));
}

const routes = scanBackendRoutes();
const models = scanBackendModels();
const authApiMethods = scanAuthApi();

console.log('Total Backend Routes found:', routes.length);
console.log('Total Backend Models found:', Object.keys(models).length);
console.log('Total authApi methods found:', authApiMethods.length);

fs.writeFileSync('CollegeOS_AUDIT_REPORT/discovered_routes.json', JSON.stringify(routes, null, 2));
fs.writeFileSync('CollegeOS_AUDIT_REPORT/discovered_models.json', JSON.stringify(models, null, 2));
fs.writeFileSync('CollegeOS_AUDIT_REPORT/discovered_authApi.json', JSON.stringify(authApiMethods, null, 2));
console.log('Saved discovered backend metadata to CollegeOS_AUDIT_REPORT/');
