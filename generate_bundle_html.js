// Helper local para generar bundle.js y bundle_js.html desde los módulos en /src.
if (typeof require === "undefined") {
  // No-op en entorno Apps Script.
} else {
  const fs = require("fs");
  const path = require("path");

  const root = __dirname;
  const sources = [
    path.join(root, "src", "formDefinitions.js"),
    path.join(root, "src", "apiService.js"),
    path.join(root, "src", "referenceService.js"),
    path.join(root, "src", "ui", "alerts.js"),
    path.join(root, "src", "ui", "state.js"),
    path.join(root, "src", "ui", "formRenderer.js"),
    path.join(root, "src", "main.js")
  ];

  const bundleContent = sources
    .map((p) => fs.readFileSync(p, "utf8"))
    .join("\n\n");

  const bundleHeader =
    "// Archivo generado. Editá los módulos en /src y corré `node generate_bundle_html.js`.\n";
  const htmlHeader =
    "<!-- Archivo generado desde /src/*. No editar. Ejecutá `node generate_bundle_html.js` para regenerar. -->\n";

  const bundleJsPath = path.join(root, "bundle.js");
  const bundleHtmlPath = path.join(root, "bundle_js.html");

  fs.writeFileSync(bundleJsPath, `${bundleHeader}${bundleContent}\n`, "utf8");
  fs.writeFileSync(
    bundleHtmlPath,
    `${htmlHeader}<script>\n${bundleContent}\n</script>\n`,
    "utf8"
  );

  console.log("bundle.js y bundle_js.html generados desde /src");
}
