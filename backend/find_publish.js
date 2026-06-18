const fs = require('fs');
const content = fs.readFileSync('backend/index.js', 'utf8');

const regex = /mqttClient\.publish\([^)]+\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Found: ${match[0]}`);
}
