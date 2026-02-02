/**
 * ClientReportPanelHandlers
 * Eventos del reporte de clientes.
 */
(function (global) {
  const state = global.ClientReportPanelState;

  function ensureDeps() {
    return state && global.ClientReportPanelData && global.ClientReportPanelRender;
  }

  function setDefaultDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startInput = document.getElementById("client-report-start");
    const endInput = document.getElementById("client-report-end");
    if (startInput) startInput.valueAsDate = firstDay;
    if (endInput) endInput.valueAsDate = lastDay;
  }

  function init() {
    if (!ensureDeps()) return;
    setDefaultDates();
    global.ClientReportPanelData.loadClients().then((clients) => {
      global.ClientReportPanelRender.renderClients(clients || []);
    });
  }

  function attachEvents() {
    if (!ensureDeps()) return;
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler) => {
      if (!el) return;
      el.addEventListener(evt, handler, { signal });
    };

    on(document.getElementById("client-report-search"), "click", handleSearch);
    on(document.getElementById("client-report-pdf"), "click", handleExportPdf);
    on(document.getElementById("client-report-csv"), "click", handleExportCsv);
  }

  function getFilters() {
    const start = document.getElementById("client-report-start");
    const end = document.getElementById("client-report-end");
    const client = document.getElementById("client-report-client");

    return {
      start: start ? start.value : "",
      end: end ? end.value : "",
      client: client ? client.value : ""
    };
  }

  function handleSearch() {
    if (!ensureDeps()) return;
    const filters = getFilters();
    console.log("[ClientReport] handleSearch - filters:", filters);

    if (!filters.client) {
      Alerts && Alerts.showAlert("Seleccioná un cliente para consultar", "warning");
      return;
    }

    const idCliente = state.getClientIdFromLabel(filters.client);
    console.log("[ClientReport] handleSearch - idCliente extracted:", idCliente);
    console.log("[ClientReport] handleSearch - clientIdMap:", Array.from(state.clientIdMap.entries()));

    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }

    global.ClientReportPanelRender.toggleLoading(true);

    const requestParams = {
      start: filters.start,
      end: filters.end,
      client: filters.client,
      idCliente: idCliente
    };
    console.log("[ClientReport] handleSearch - calling fetchReport with:", requestParams);

    global.ClientReportPanelData.fetchReport(requestParams)
      .then((res) => {
        console.log("[ClientReport] handleSearch - response:", res);
        const rows = res && res.rows ? res.rows : [];
        const summary = res && res.summary ? res.summary : {};
        state.lastRows = rows;
        global.ClientReportPanelRender.renderSummary(rows, summary);
        global.ClientReportPanelRender.renderTable(rows);
        global.ClientReportPanelRender.renderAggregate(rows);
      })
      .catch((err) => {
        console.error("[ClientReport] handleSearch - error:", err);
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("No se pudo cargar el reporte", err);
        } else {
          console.error("Error en reporte de clientes:", err);
          Alerts && Alerts.showAlert("No se pudo cargar el reporte", "danger");
        }
      })
      .finally(() => global.ClientReportPanelRender.toggleLoading(false));
  }

  function handleExportPdf() {
    if (!ensureDeps()) return;
    const filters = getFilters();
    console.log("[ClientReport] handleExportPdf - filters obtenidos:", filters);

    if (!filters.client) {
      Alerts && Alerts.showAlert("Seleccioná un cliente para exportar", "warning");
      return;
    }
    if (!state.lastRows || state.lastRows.length === 0) {
      Alerts && Alerts.showAlert("Generá primero el reporte para descargarlo.", "info");
      return;
    }

    const idCliente = state.getClientIdFromLabel(filters.client);
    console.log("[ClientReport] handleExportPdf - idCliente extraído:", idCliente);
    console.log("[ClientReport] handleExportPdf - clientIdMap:", Array.from(state.clientIdMap.entries()));

    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }

    const btn = document.getElementById("client-report-pdf");
    const ui = global.UIHelpers;
    if (btn && ui && typeof ui.withSpinner === "function") {
      ui.withSpinner(btn, true, "Descargando...");
    }

    // Extraer nombre limpio del cliente quitando metadatos (ID: XX, CUIT, etc)
    const cleanClientName = filters.client.replace(/\s*\([^)]*\)\s*$/g, '').trim();
    console.log("[ClientReport] handleExportPdf - nombre limpio extraído:", cleanClientName);

    const pdfParams = {
      start: filters.start,
      end: filters.end,
      client: cleanClientName,  // Usar el nombre limpio sin metadatos
      idCliente: idCliente
    };
    console.log("[ClientReport] handleExportPdf - llamando generatePdf con:", pdfParams);

    UiState && UiState.setGlobalLoading(true, "Generando PDF...");
    global.ClientReportPanelData.generatePdf(pdfParams)
      .then((res) => {
        if (!res || !res.base64) throw new Error("No se pudo generar PDF");
        const link = document.createElement("a");
        link.href = "data:application/pdf;base64," + res.base64;
        link.download = res.filename || "reporte_cliente.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error generando PDF", err);
        } else {
          Alerts && Alerts.showAlert("Error generando PDF", "danger");
        }
      })
      .finally(() => {
        UiState && UiState.setGlobalLoading(false);
        if (btn && ui && typeof ui.withSpinner === "function") {
          ui.withSpinner(btn, false);
        }
      });
  }

  function handleExportCsv() {
    if (!state.lastRows || state.lastRows.length === 0) {
      Alerts && Alerts.showAlert("Nada para exportar. Buscá primero.", "info");
      return;
    }

    const headers = ["Fecha", "Cliente", "Empleado", "Horas", "Asistencia", "Observaciones"];
    const rows = state.lastRows.map((r) => [
      r.fecha || "",
      '"' + String(r.cliente || "").replace(/"/g, '""') + '"',
      '"' + String(r.empleado || "").replace(/"/g, '""') + '"',
      Number(r.horas || 0),
      r.asistencia === false ? "No" : "Si",
      '"' + String(r.observaciones || "").replace(/"/g, '""') + '"'
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte_cliente_" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  global.ClientReportPanelHandlers = {
    init: init,
    attachEvents: attachEvents,
    handleSearch: handleSearch
  };
})(typeof window !== "undefined" ? window : this);
