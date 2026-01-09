/**
 * ClientMonthlySummaryPanelHandlers
 */
(function (global) {
  const state = global.ClientMonthlySummaryPanelState;

  function ensureDeps() {
    return state && global.ClientMonthlySummaryPanelData && global.ClientMonthlySummaryPanelRender;
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

    on(document.getElementById("cms-search"), "click", handleSearch);
    const tbody = document.getElementById("cms-tbody");
    on(tbody, "click", handleDetailClick);
  }

  function handleSearch() {
    if (!ensureDeps()) return;
    const monthInput = document.getElementById("cms-month");
    const val = monthInput ? monthInput.value : "";
    if (!val) {
      Alerts && Alerts.showAlert("Selecciona un mes", "warning");
      return;
    }
    const parts = val.split("-");
    const y = parts[0];
    const m = parts[1];

    global.ClientMonthlySummaryPanelRender.toggleLoading(true);
    global.ClientMonthlySummaryPanelData.fetchSummary(y, m)
      .then((rows) => {
        global.ClientMonthlySummaryPanelRender.renderTable(rows || []);
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al calcular resumen", err);
        } else {
          console.error(err);
          Alerts && Alerts.showAlert("Error al calcular resumen", "danger");
        }
      })
      .finally(() => global.ClientMonthlySummaryPanelRender.toggleLoading(false));
  }

  function handleDetailClick(event) {
    const btn = event.target.closest(".cms-view-detail");
    if (!btn) return;
    const idCliente = btn.getAttribute("data-id-cliente") || "";
    const fallbackLabel = btn.getAttribute("data-cliente-label") || "";
    const cliente = global.ClientMonthlySummaryPanelData.getClientLabelById(idCliente) || fallbackLabel;
    if (!cliente) return;

    const monthInput = document.getElementById("cms-month");
    const val = monthInput ? monthInput.value : "";
    const parts = val.split("-");
    const y = parts[0];
    const m = parts[1];
    const start = `${y}-${m}-01`;
    const endDate = new Date(Number(y), Number(m), 0);
    const endStr = `${y}-${m}-${String(endDate.getDate()).padStart(2, "0")}`;

    const evt = new CustomEvent("view-change", { detail: { view: "reportes-clientes" } });
    document.dispatchEvent(evt);

    setTimeout(() => {
      const cliInput = document.getElementById("client-report-client");
      const startInput = document.getElementById("client-report-start");
      const endInput = document.getElementById("client-report-end");
      if (cliInput) cliInput.value = cliente;
      if (startInput) startInput.value = start;
      if (endInput) endInput.value = endStr;
      const btnSearch = document.getElementById("client-report-search");
      if (btnSearch) btnSearch.click();
    }, 200);
  }

  global.ClientMonthlySummaryPanelHandlers = {
    attachEvents: attachEvents,
    handleSearch: handleSearch
  };
})(typeof window !== "undefined" ? window : this);
