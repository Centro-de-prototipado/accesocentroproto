const fs = require('fs');
const content = fs.readFileSync('backend/index.js', 'utf8');

const routeIndex = content.indexOf("app.post('/api/webhook/acceso'");
if (routeIndex !== -1) {
  console.log(content.substring(routeIndex, routeIndex + 1200));
} else {
  console.log('Not found');
}
