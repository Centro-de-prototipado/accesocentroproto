const fs = require('fs');
const content = fs.readFileSync('backend/index.js', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("/api/devices/:id/open") || lines[i].includes("/api/devices/:id/enroll") || lines[i].includes("app.delete('/api/users/:id'")) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
    for (let j = 0; j < 10; j++) {
      console.log(`  Line ${i + 1 + j + 1}: ${lines[i + j + 1]}`);
    }
  }
}
