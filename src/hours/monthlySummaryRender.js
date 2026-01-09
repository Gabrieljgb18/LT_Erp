/**
 * MonthlySummaryPanelRender
 */
(function (global) {
  const state = global.MonthlySummaryPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function render() {
    if (!state) return;
    const container = document.getElementById(state.containerId);
    if (!container) return;

    // safe static: layout fijo sin datos externos.
    container.innerHTML = `
      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-calendar3 me-2"></i>Resumen Mensual</h6>
          </div>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label small text-muted fw-bold mb-1">Mes</label>
              <input type="month" id="ms-month" class="form-control form-control-sm">
            </div>
            <div class="col-md-2">
              <button class="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1" id="ms-search">
                <i class="bi bi-search"></i> Consultar
              </button>
            </div>
          </div>

          <div id="ms-loading" class="text-center py-3 d-none"></div>
          <div id="ms-empty" class="text-center text-muted py-4 d-none"></div>
          <div class="table-responsive border rounded d-none" id="ms-table-wrapper">
            <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
              <thead class="bg-light">
                <tr>
                  <th class="ps-3 py-2 text-muted font-weight-normal">Empleado</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Valor Hora</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Viáticos</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Presentismo</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Adelantos</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Total</th>
                  <th class="text-end py-2 pe-3 text-muted font-weight-normal">Acciones</th>
                </tr>
              </thead>
              <tbody id="ms-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const monthInput = document.getElementById("ms-month");
    if (monthInput) {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      monthInput.value = ym;
    }
  }

  function renderTable(rows) {
    const tbody = document.getElementById("ms-tbody");
    const wrapper = document.getElementById("ms-table-wrapper");
    const empty = document.getElementById("ms-empty");

    if (!tbody || !wrapper || !empty) return;

    if (!rows || !rows.length) {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      wrapper.classList.add("d-none");
      empty.classList.remove("d-none");
      if (typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(empty, { variant: "empty", title: "Sin datos", message: "Sin datos para el mes seleccionado." });
      }
      return;
    }

    const renderRow = (row) => {
      const tr = Dom.el("tr", null, [
        Dom.el("td", { text: row.empleado || "" }),
        Dom.el("td", { className: "text-center fw-bold", text: Formatters.formatNumber(row.horas, 2) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatCurrency(row.valorHora) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatCurrency(row.viaticos) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatCurrency(row.presentismo) }),
        Dom.el("td", { className: "text-center text-danger", text: Formatters.formatCurrency(row.adelantos) }),
        Dom.el("td", { className: "text-center fw-bold text-success", text: Formatters.formatCurrency(row.totalNeto) })
      ]);
      const detailBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-primary ms-view-detail",
        dataset: { emp: row.empleado || "" }
      }, [
        Dom.el("i", { className: "bi bi-eye" }),
        Dom.text(" Detalle")
      ]);
      tr.appendChild(Dom.el("td", { className: "text-end" }, detailBtn));
      return tr;
    };

    const ui = global.UIHelpers;
    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, rows, renderRow, { chunkSize: 150 });
    } else {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      rows.forEach((row) => {
        tbody.appendChild(renderRow(row));
      });
    }

    wrapper.classList.remove("d-none");
    empty.classList.add("d-none");
  }

  function toggleLoading(show) {
    const loading = document.getElementById("ms-loading");
    const empty = document.getElementById("ms-empty");
    const wrapper = document.getElementById("ms-table-wrapper");
    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Calculando..." });
      }
    }
    if (wrapper && show) wrapper.classList.add("d-none");
    if (empty && show) empty.classList.add("d-none");
  }

  global.MonthlySummaryPanelRender = {
    render: render,
    renderTable: renderTable,
    toggleLoading: toggleLoading
  };
})(typeof window !== "undefined" ? window : this);
