// Helper local para generar bundle.js y bundle_js.html desde los módulos en /src.
if (typeof require === "undefined") {
  // No-op en entorno Apps Script.
} else {
  const fs = require("fs");
  const path = require("path");

  const root = __dirname;
  const sources = [
    path.join(root, "src", "utils", "htmlHelpers.js"),
    path.join(root, "src", "utils", "domHelpers.js"),
    path.join(root, "src", "utils", "domainHelpers.js"),
    path.join(root, "src", "utils", "formatters.js"),
    path.join(root, "src", "utils", "inputUtils.js"),
    path.join(root, "src", "formDefinitions.js"),
    path.join(root, "src", "apiService.js"),
    path.join(root, "src", "services", "invoiceService.js"),
    path.join(root, "src", "services", "paymentsService.js"),
    path.join(root, "src", "services", "attendanceService.js"),
    path.join(root, "src", "services", "mapsService.js"),
    path.join(root, "src", "referenceService.js"),
    path.join(root, "src", "records", "referenceData.js"),
    path.join(root, "src", "domains", "meta.js"),
    path.join(root, "src", "ui", "alerts.js"),
    path.join(root, "src", "ui", "dialogs.js"),
    path.join(root, "src", "ui", "modalHelpers.js"),
    path.join(root, "src", "ui", "state.js"),
    path.join(root, "src", "ui", "emptyState.js"),
    path.join(root, "src", "ui", "uiHelpers.js"),
    path.join(root, "src", "config", "dropdownConfigData.js"),
    path.join(root, "src", "config", "dropdownConfigPanel.js"),
    path.join(root, "src", "ui", "formRendererState.js"),
    path.join(root, "src", "ui", "formRendererData.js"),
    path.join(root, "src", "ui", "formRendererHandlers.js"),
    path.join(root, "src", "ui", "formRendererRender.js"),
    path.join(root, "src", "ui", "formRenderer.js"),
    path.join(root, "src", "maps", "mapsLoader.js"),
    path.join(root, "src", "maps", "mapsAutocomplete.js"),
    path.join(root, "src", "maps", "mapsState.js"),
    path.join(root, "src", "maps", "mapsData.js"),
    path.join(root, "src", "maps", "mapsRender.js"),
    path.join(root, "src", "maps", "mapsHandlers.js"),
    path.join(root, "src", "maps", "mapsPanel.js"),
    path.join(root, "src", "ui", "footer.js"),
    path.join(root, "src", "ui", "sidebar.js"),
    path.join(root, "src", "ui", "gridManager.js"),
    path.join(root, "src", "clients", "clientMediaData.js"),
    path.join(root, "src", "clients", "clientTagsData.js"),
    path.join(root, "src", "clients", "clientMediaPanel.js"),
    path.join(root, "src", "clients", "clientTagsField.js"),
    path.join(root, "src", "search", "searchData.js"),
    path.join(root, "src", "search", "searchManager.js"),
    path.join(root, "src", "attendance", "weeklyPlanTemplates.js"),
    path.join(root, "src", "attendance", "weeklyPlanState.js"),
    path.join(root, "src", "attendance", "weeklyPlanData.js"),
    path.join(root, "src", "attendance", "weeklyPlanRender.js"),
    path.join(root, "src", "attendance", "weeklyPlanActions.js"),
    path.join(root, "src", "attendance", "weeklyPlanHandlers.js"),
    path.join(root, "src", "attendance", "weeklyPlanPanel.js"),
    path.join(root, "src", "attendance", "attendanceTemplates.js"),
    path.join(root, "src", "attendance", "attendanceDailyState.js"),
    path.join(root, "src", "attendance", "attendanceDailyData.js"),
    path.join(root, "src", "attendance", "attendanceDailyRender.js"),
    path.join(root, "src", "attendance", "attendanceDailyHandlers.js"),
    path.join(root, "src", "attendance", "dailyAttendanceUi.js"),
    path.join(root, "src", "attendance", "attendancePanelsState.js"),
    path.join(root, "src", "attendance", "attendancePanelsData.js"),
    path.join(root, "src", "attendance", "attendancePanelsRender.js"),
    path.join(root, "src", "attendance", "attendancePanelsHandlers.js"),
    path.join(root, "src", "attendance", "attendancePanels.js"),
    path.join(root, "src", "attendance", "employeeCalendarData.js"),
    path.join(root, "src", "attendance", "employeeCalendarPanel.js"),
    path.join(root, "src", "attendance", "clientCalendarData.js"),
    path.join(root, "src", "attendance", "clientCalendarPanel.js"),
    path.join(root, "src", "analysis", "analysisState.js"),
    path.join(root, "src", "analysis", "analysisRender.js"),
    path.join(root, "src", "analysis", "analysisData.js"),
    path.join(root, "src", "analysis", "analysisHandlers.js"),
    path.join(root, "src", "analysis", "analysisPanel.js"),
    path.join(root, "src", "payments", "paymentsState.js"),
    path.join(root, "src", "payments", "paymentsData.js"),
    path.join(root, "src", "payments", "paymentsRender.js"),
    path.join(root, "src", "payments", "paymentsHandlers.js"),
    path.join(root, "src", "payments", "paymentsPanel.js"),
    path.join(root, "src", "invoice", "invoiceTemplates.js"),
    path.join(root, "src", "invoice", "invoiceState.js"),
    path.join(root, "src", "invoice", "invoiceRender.js"),
    path.join(root, "src", "invoice", "invoiceData.js"),
    path.join(root, "src", "invoice", "invoiceHandlers.js"),
    path.join(root, "src", "invoice", "invoicePanel.js"),
    path.join(root, "src", "hours", "hoursDetailState.js"),
    path.join(root, "src", "hours", "hoursDetailData.js"),
    path.join(root, "src", "hours", "hoursDetailRender.js"),
    path.join(root, "src", "hours", "hoursDetailHandlers.js"),
    path.join(root, "src", "hours", "hoursDetailPanel.js"),
    path.join(root, "src", "hours", "clientMonthlySummaryState.js"),
    path.join(root, "src", "hours", "clientMonthlySummaryData.js"),
    path.join(root, "src", "hours", "clientMonthlySummaryRender.js"),
    path.join(root, "src", "hours", "clientMonthlySummaryHandlers.js"),
    path.join(root, "src", "hours", "clientMonthlySummaryPanel.js"),
    path.join(root, "src", "hours", "clientAccountState.js"),
    path.join(root, "src", "hours", "clientAccountData.js"),
    path.join(root, "src", "hours", "clientAccountRender.js"),
    path.join(root, "src", "hours", "clientAccountHandlers.js"),
    path.join(root, "src", "hours", "clientAccountPanel.js"),
    path.join(root, "src", "hours", "clientReportState.js"),
    path.join(root, "src", "hours", "clientReportData.js"),
    path.join(root, "src", "hours", "clientReportRender.js"),
    path.join(root, "src", "hours", "clientReportHandlers.js"),
    path.join(root, "src", "hours", "clientReportPanel.js"),
    path.join(root, "src", "hours", "monthlySummaryState.js"),
    path.join(root, "src", "hours", "monthlySummaryData.js"),
    path.join(root, "src", "hours", "monthlySummaryRender.js"),
    path.join(root, "src", "hours", "monthlySummaryHandlers.js"),
    path.join(root, "src", "hours", "monthlySummaryPanel.js"),
    path.join(root, "src", "hours", "accountStatementState.js"),
    path.join(root, "src", "hours", "accountStatementData.js"),
    path.join(root, "src", "hours", "accountStatementRender.js"),
    path.join(root, "src", "hours", "accountStatementHandlers.js"),
    path.join(root, "src", "hours", "accountStatementPanel.js"),
    path.join(root, "src", "config", "bulkValuesData.js"),
    path.join(root, "src", "config", "bulkValuesPanel.js"),
    path.join(root, "src", "forms", "formManager.js"),
    path.join(root, "src", "records", "recordsData.js"),
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
