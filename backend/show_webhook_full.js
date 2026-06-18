const fs = require('fs');
const content = fs.readFileSync('backend/index.js', 'utf8');

const routeIndex = content.indexOf("app.post('/api/webhook/acceso'");
if (routeIndex !== -1) {
  // Let's find the closing brace or a safe chunk length.
  console.log(content.substring(routeIndex, routeIndex + 3000));
} else {
  console.log('Not found');
}
