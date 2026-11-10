import fs from 'fs';
import path from 'path';

const routesDir = 'backend/src/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

console.log('=== ROUTE PROTECTION AUDIT ===');
for (const file of files) {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const lines = content.split('\n');
  const hasRouterUseProtect = content.includes('router.use(protect)');
  console.log(`\nFile: ${file} (Global protect: ${hasRouterUseProtect})`);

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const match = l.match(/router\.(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/i);
    if (match) {
      const endpoint = `${match[1].toUpperCase()} ${match[2]}`;
      const block = lines.slice(i, i + 5).join(' ');
      const hasProtect = hasRouterUseProtect || block.includes('protect');
      const hasAuthorize = block.match(/authorize\(([^)]+)\)/);
      const authStr = hasAuthorize ? hasAuthorize[1].replace(/["'\s]/g, '') : (hasProtect ? 'authenticated (any role)' : 'PUBLIC (NO AUTH)');
      if (!hasProtect) {
        console.log(`  [PUBLIC] ${endpoint} -> ${authStr}`);
      }
    }
  }
}
