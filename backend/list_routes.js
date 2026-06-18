const fs = require('fs');
const content = fs.readFileSync('backend/index.js', 'utf8');

const regex = /app\.(post|get|put|delete)\(['"]([^'"]+)['"]/g;
let match;
console.log('--- ROUTE LIST ---');
while ((match = regex.exec(content)) !== null) {
  console.log(`${match[1].toUpperCase()} ${match[2]}`);
}
