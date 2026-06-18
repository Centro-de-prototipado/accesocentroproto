const fs = require('fs');
const content = fs.readFileSync('backend/index.js', 'utf8');
const lines = content.split('\n');

for (let i = 599; i < 640; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
