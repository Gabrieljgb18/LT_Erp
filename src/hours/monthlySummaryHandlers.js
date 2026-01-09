/**
 * MonthlySummaryPanelHandlers
 */
(function (global) {
  const state = global.MonthlySummaryPanelState;

  function ensureDeps() {
    return state && global.MonthlySummaryPanelData && global.MonthlySummaryPanelRender;
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

    on(document.getElementById("ms-search"), "click", handleSearch);
    const tbody = document.getElementById("ms-tbody");
    on(tbody, "click", handleDetailClick);
  }

  function handleSearch() {
    if (!ensureDeps()) return;
    const monthInput = document.getElementById("ms-month");
    const val = monthInput ? monthInput.value : "";
    if (!val) {
      Alerts && Alerts.showAlert("Selecciona un mes", "warning");
      return;
    }
    const parts = val.split("-");
    const y = parts[0];
    const m = parts[1];

    global.MonthlySummaryPanelRender.toggleLoading(true);
    global.MonthlySummaryPanelData.fetchSummary(y, m)
      .then((rows) => {
        global.MonthlySummaryPanelRender.renderTable(rows || []);
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al calcular resumen", err);
        } else {
          console.error(err);
          Alerts && Alerts.showAlert("Error al calcular resumen", "danger");
        }
      })
      .finally(() => global.MonthlySummaryPanelRender.toggleLoading(false));
  }

  function handleDetailClick(event) {
    const btn = event.target.closest(".ms-view-detail");
    if (!btn) return;
    const emp = btn.getAttribute("data-emp") || "";
    if (!emp) return;

    const monthInput = document.getElementById("ms-month");
    const val = monthInput ? monthInput.value : "";
    const parts = val.split("-");
    const y = parts[0];
    const m = parts[1];
    const start = `${y}-${m}-01`;
    const end = new Date(Number(y), Number(m), 0);
    const endStr = `${y}-${m}-${String(end.getDate()).padStart(2, "0")}`;

    const eventChange = new CustomEvent("view-change", { detail: { view: "reportes" } });
    document.dispatchEvent(eventChange);

    setTimeout(() => {
      const empInput = document.getElementById("hours-filter-employee");
      const startInput = document.getElementById("hours-filter-start");
      const endInput = document.getElementById("hours-filter-end");
      if (empInput) empInput.value = emp;
      if (startInput) startInput.value = start;
      if (endInput) endInput.value = endStr;
      const btnSearch = document.getElementById("btn-search-hours");
      if (btnSearch) btnSearch.click();
    }, 200);
  }

  global.MonthlySummaryPanelHandlers = {
    attachEvents: attachEvents,
    handleSearch: handleSearch
  };
})(typeof window !== "undefined" ? window : this);
