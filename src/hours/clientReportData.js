/**
 * ClientReportPanelData
 * Capa de datos del reporte de clientes.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function ensureReference() {
    return global.ReferenceService && typeof global.ReferenceService.ensureLoaded === "function";
  }

  function loadClients() {
    if (!ensureReference()) {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return Promise.resolve([]);
    }
    return global.ReferenceService.ensureLoaded()
      .then(() => {
        const refs = global.ReferenceService.get();
        return refs && refs.clientes ? refs.clientes : [];
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando clientes", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error cargando clientes", err);
        } else {
          console.error("Error cargando clientes:", err);
        }
        return [];
      });
  }

  function fetchReport(filters) {
    if (!ensureApi()) return Promise.resolve({ rows: [], summary: {} });
    return global.ApiService.call("getHoursByClient", filters.start, filters.end, filters.client, filters.idCliente)
      .then((res) => {
        return {
          rows: res && res.rows ? res.rows : [],
          summary: res && res.summary ? res.summary : {}
        };
      });
  }

  function generatePdf(filters) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("generateClientHoursPdf", filters.start, filters.end, "", filters.idCliente);
  }

  global.ClientReportPanelData = {
    loadClients: loadClients,
    fetchReport: fetchReport,
    generatePdf: generatePdf
  };
})(typeof window !== "undefined" ? window : this);
