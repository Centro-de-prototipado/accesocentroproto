const fs = require('fs');
const content = fs.readFileSync('backend/index.js', 'utf8');

const regexOpen = /app\.post\('\/api\/devices\/:id\/open'[\s\S]+?\}\);/g;
const regexEnroll = /app\.post\('\/api\/devices\/:id\/enroll'[\s\S]+?\}\);/g;

console.log('--- OPEN ROUTE ---');
console.log(content.match(regexOpen)?.[0]);

console.log('--- ENROLL ROUTE ---');
console.log(content.match(regexEnroll)?.[0]);
