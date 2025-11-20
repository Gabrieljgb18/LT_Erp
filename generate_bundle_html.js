const fs = require('fs');
const path = require('path');
const srcPath = path.join(__dirname, 'bundle.js');
const outPath = path.join(__dirname, 'bundle_js.html');
const src = fs.readFileSync(srcPath, 'utf8');
const html = `<script>\n${src}\n</script>\n`;
fs.writeFileSync(outPath, html, 'utf8');
console.log('bundle_js.html generado desde bundle.js');
