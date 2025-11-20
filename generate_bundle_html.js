// Helper local para regenerar bundle_js.html desde bundle.js.
// En Apps Script no existe "require", así que si se evalúa en servidor simplemente se ignora.
if (typeof require === 'undefined') {
  // No-op en entorno Apps Script.
} else {
  const fs = require('fs');
  const path = require('path');
  const srcPath = path.join(__dirname, 'bundle.js');
  const outPath = path.join(__dirname, 'bundle_js.html');
  const src = fs.readFileSync(srcPath, 'utf8');
  const html = `<script>\n${src}\n</script>\n`;
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('bundle_js.html generado desde bundle.js');
}
