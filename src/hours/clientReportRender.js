/**
 * ClientReportPanelRender
 * Render del reporte de clientes.
 */
(function (global) {
  const state = global.ClientReportPanelState;
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
            <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-graph-up me-2"></i>Reporte de Clientes</h6>
          </div>
          <span class="badge text-bg-light border">Vista dedicada</span>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
              <input list="client-report-client-list" id="client-report-client" class="form-control form-control-sm" placeholder="Buscar cliente...">
              <datalist id="client-report-client-list"></datalist>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted fw-bold mb-1">Desde</label>
              <input type="date" id="client-report-start" class="form-control form-control-sm">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
              <input type="date" id="client-report-end" class="form-control form-control-sm">
            </div>
            <div class="col-md-4 d-flex gap-2">
              <button class="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-report-search">
                <i class="bi bi-search"></i> Buscar
              </button>
              <button class="btn btn-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-report-pdf" title="Descargar PDF">
                <i class="bi bi-file-earmark-pdf-fill"></i> PDF
              </button>
            </div>
          </div>

          <div id="client-report-loading" class="text-center py-3 d-none"></div>

          <div id="client-report-summary" class="row g-2 mb-3 d-none">
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light text-center">
                <div class="card-body py-2 px-1">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Horas</div>
                  <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-hours">0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light text-center">
                <div class="card-body py-2 px-1">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Empleados</div>
                  <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-emps">0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light text-center">
                <div class="card-body py-2 px-1">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Días</div>
                  <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-days">0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card h-100 shadow-none border bg-light text-center">
                <div class="card-body py-2 px-1">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Valor Hora</div>
                  <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-rate">$0</div>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-3">
              <div class="lt-metric lt-metric--dark h-100 text-center">
                <div class="card-body py-2 px-1">
                  <div class="small lt-metric__k text-uppercase" style="font-size: 0.7rem;">Total a Facturar</div>
                  <div class="fs-5 fw-bold mb-0" id="client-summary-total">$0</div>
                </div>
              </div>
            </div>
          </div>

          <div id="client-report-aggregate" class="card shadow-none border mb-3 d-none">
            <div class="card-header bg-light py-1 px-3">
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted small fw-bold text-uppercase" style="font-size: 0.75rem;">Resumen por Empleado</span>
                <span class="badge bg-white text-dark border" id="client-agg-count"></span>
              </div>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive lt-table-wrap">
                <table class="table table-sm mb-0 align-middle table-striped" style="font-size: 0.85rem;">
                  <thead class="table-light text-muted">
                    <tr>
                      <th class="ps-3 border-0 font-weight-normal">Empleado</th>
                      <th class="text-center border-0 font-weight-normal">Horas</th>
                      <th class="text-center border-0 font-weight-normal">Días</th>
                      <th class="text-center border-0 font-weight-normal">Registros</th>
                    </tr>
                  </thead>
                  <tbody id="client-report-agg-body"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="client-report-results" class="d-none">
            <div class="table-responsive lt-table-wrap">
              <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                <thead class="table-light">
                  <tr>
                    <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                    <th class="py-2 text-muted font-weight-normal">Empleado</th>
                    <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                    <th class="text-center py-2 text-muted font-weight-normal">Asist.</th>
                    <th class="py-2 text-muted font-weight-normal">Observaciones</th>
                  </tr>
                </thead>
                <tbody id="client-report-tbody"></tbody>
              </table>
            </div>
          </div>

          <div id="client-report-empty" class="text-center text-muted py-4 d-none"></div>
        </div>
      </div>
    `;

    const empty = document.getElementById("client-report-empty");
    if (empty && typeof EmptyState !== "undefined" && EmptyState) {
      EmptyState.render(empty, {
        variant: "empty",
        title: "Sin registros",
        message: "Utilizá los filtros para buscar registros."
      });
    }
  }

  function renderClients(clients) {
    const datalist = document.getElementById("client-report-client-list");
    const input = document.getElementById("client-report-client");
    if (!datalist || !input) return;

    const ui = global.UIHelpers;
    const renderList = (labels) => {
      if (ui && typeof ui.renderDatalist === "function") {
        ui.renderDatalist(datalist, labels || []);
        return;
      }
      Dom && Dom.clear ? Dom.clear(datalist) : (datalist.innerHTML = "");
      (labels || []).forEach((label) => {
        const opt = document.createElement("option");
        opt.value = label;
        datalist.appendChild(opt);
      });
    };
    renderList([]);
    input.value = "";

    const labels = state.setClientMap(clients || []);
    renderList(labels);
  }

  function renderSummary(rows, summary) {
    const box = document.getElementById("client-report-summary");
    if (!box) return;

    if (!rows || rows.length === 0) {
      box.classList.add("d-none");
      return;
    }

    const totals = {
      totalHoras: 0,
      empleados: 0,
      dias: 0,
      valorHora: 0,
      totalFacturacion: 0,
      ...(summary || {})
    };

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText("client-summary-hours", Formatters.formatNumber(totals.totalHoras, 2));
    setText("client-summary-emps", Formatters.formatNumber(totals.empleados, 0));
    setText("client-summary-days", Formatters.formatNumber(totals.dias, 0));
    setText("client-summary-rate", Formatters.formatCurrency(totals.valorHora));
    setText("client-summary-total", Formatters.formatCurrency(totals.totalFacturacion));

    box.classList.remove("d-none");
  }

  function renderAggregate(rows) {
    const wrapper = document.getElementById("client-report-aggregate");
    const tbody = document.getElementById("client-report-agg-body");
    const countBadge = document.getElementById("client-agg-count");
    if (!wrapper || !tbody) return;

    Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");

    if (!rows || rows.length === 0) {
      wrapper.classList.add("d-none");
      if (countBadge) countBadge.textContent = "";
      return;
    }

    const aggMap = new Map();
    rows.forEach((r) => {
      const key = r.empleado || "Sin empleado";
      const entry = aggMap.get(key) || { horas: 0, dias: new Set(), registros: 0 };
      const h = Number(r.horas);
      entry.horas += isNaN(h) ? 0 : h;
      if (r.fecha) entry.dias.add(r.fecha);
      entry.registros += 1;
      aggMap.set(key, entry);
    });

    const list = Array.from(aggMap.entries())
      .map(([empleado, info]) => ({
        empleado: empleado,
        horas: info.horas,
        dias: info.dias.size,
        registros: info.registros
      }))
      .sort((a, b) => b.horas - a.horas);

    list.forEach((item) => {
      const tr = Dom.el("tr", null, [
        Dom.el("td", { text: item.empleado || "" }),
        Dom.el("td", { className: "text-center fw-bold", text: Formatters.formatNumber(item.horas, 2) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatNumber(item.dias, 0) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatNumber(item.registros, 0) })
      ]);
      tbody.appendChild(tr);
    });

    if (countBadge) countBadge.textContent = list.length + " empleados";
    wrapper.classList.remove("d-none");
  }

  function renderTable(rows) {
    const tbody = document.getElementById("client-report-tbody");
    const results = document.getElementById("client-report-results");
    const empty = document.getElementById("client-report-empty");
    if (!tbody || !results || !empty) return;

    if (!rows || rows.length === 0) {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      results.classList.add("d-none");
      empty.classList.remove("d-none");
      if (typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(empty, {
          variant: "empty",
          title: "Sin registros",
          message: "No hay datos para los filtros seleccionados."
        });
      }
      return;
    }

    const buildBadge_ = (label, className) => {
      const ui = global.UIHelpers;
      if (ui && typeof ui.badge === "function") {
        return ui.badge(label, { className: className });
      }
      return Dom.el("span", { className: className, text: label });
    };

    const renderRow = (r) => {
      const tr = Dom.el("tr");
      if (r.asistencia === false) {
        tr.classList.add("table-warning");
      }
      const badge = buildBadge_(
        r.asistencia === false ? "No" : "Sí",
        r.asistencia === false
          ? "badge bg-danger-subtle text-danger"
          : "badge bg-success-subtle text-success"
      );
      tr.appendChild(Dom.el("td", { text: r.fecha || "" }));
      tr.appendChild(Dom.el("td", { text: r.empleado || "" }));
      tr.appendChild(Dom.el("td", { className: "text-center fw-bold", text: Formatters.formatNumber(r.horas, 2) }));
      tr.appendChild(Dom.el("td", { className: "text-center" }, badge));
      tr.appendChild(Dom.el("td", { className: "text-muted small", text: r.observaciones || "-" }));
      return tr;
    };

    const ui = global.UIHelpers;
    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, rows, renderRow, { chunkSize: 150 });
    } else {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      rows.forEach((r) => {
        tbody.appendChild(renderRow(r));
      });
    }

    results.classList.remove("d-none");
    empty.classList.add("d-none");
  }

  function toggleLoading(show) {
    const loading = document.getElementById("client-report-loading");
    const results = document.getElementById("client-report-results");
    const empty = document.getElementById("client-report-empty");

    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Procesando..." });
      }
    }
    if (show) {
      if (results) results.classList.add("d-none");
      if (empty) empty.classList.add("d-none");
    }
  }

  global.ClientReportPanelRender = {
    render: render,
    renderClients: renderClients,
    renderSummary: renderSummary,
    renderAggregate: renderAggregate,
    renderTable: renderTable,
    toggleLoading: toggleLoading
  };
})(typeof window !== "undefined" ? window : this);
