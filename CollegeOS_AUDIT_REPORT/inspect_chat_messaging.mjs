import fs from 'fs';
import path from 'path';

function findKeywordInDir(dir, keyword) {
  const results = [];
  function recurse(current) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.gemini'].includes(ent.name)) {
          recurse(full);
        }
      } else if (ent.isFile() && (ent.name.endsWith('.js') || ent.name.endsWith('.jsx'))) {
        const text = fs.readFileSync(full, 'utf8');
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          results.push(full);
        }
      }
    }
  }
  recurse(dir);
  return results;
}

console.log('Messaging in backend:', findKeywordInDir('backend/src', 'message').filter(f => !f.includes('error') && !f.includes('email')));
console.log('Chat in backend:', findKeywordInDir('backend/src', 'chat'));
console.log('Socket in backend:', findKeywordInDir('backend/src', 'socket'));
console.log('Chat in frontend:', findKeywordInDir('frontend/src', 'chat'));
