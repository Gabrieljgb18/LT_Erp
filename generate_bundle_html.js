// Helper local para generar bundle.js y bundle_js.html desde los módulos en /src.
if (typeof require === "undefined") {
  // No-op en entorno Apps Script.
} else {
  const fs = require("fs");
  const path = require("path");

  const root = __dirname;
  const sources = [
    path.join(root, "src", "utils", "htmlHelpers.js"),
    path.join(root, "src", "formDefinitions.js"),
    path.join(root, "src", "apiService.js"),
    path.join(root, "src", "referenceService.js"),
    path.join(root, "src", "domains", "meta.js"),
    path.join(root, "src", "ui", "alerts.js"),
    path.join(root, "src", "ui", "state.js"),
    path.join(root, "src", "ui", "formRenderer.js"),
    path.join(root, "src", "ui", "footer.js"),
    path.join(root, "src", "ui", "sidebar.js"),
    path.join(root, "src", "ui", "gridManager.js"),
    path.join(root, "src", "search", "searchManager.js"),
    path.join(root, "src", "attendance", "weeklyPlanPanel.js"),
    path.join(root, "src", "attendance", "dailyAttendanceUi.js"),
    path.join(root, "src", "attendance", "attendancePanels.js"),
    path.join(root, "src", "hours", "hoursDetailPanel.js"),
    path.join(root, "src", "hours", "clientMonthlySummaryPanel.js"),
    path.join(root, "src", "hours", "clientAccountPanel.js"),
    path.join(root, "src", "hours", "clientReportPanel.js"),
    path.join(root, "src", "hours", "monthlySummaryPanel.js"),
    path.join(root, "src", "hours", "accountStatementPanel.js"),
    path.join(root, "src", "config", "bulkValuesPanel.js"),
    path.join(root, "src", "forms", "formManager.js"),
    path.join(root, "src", "records", "recordManager.js"),
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
