/**
 * HoursDetailPanelRender
 * Render del panel de detalle de horas.
 */
(function (global) {
  const state = global.HoursDetailPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function render() {
    if (!state) return;
    const container = document.getElementById(state.containerId);
    if (!container) return;

    // safe static: layout fijo sin datos externos.
    container.innerHTML = `
      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white py-2">
          <h6 class="mb-0 text-primary fw-bold">
            <i class="bi bi-clock-history me-2"></i>Seguimiento de Horas por Empleado
          </h6>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Empleado</label>
              <input list="hours-employee-list" id="hours-filter-employee" class="form-control form-control-sm" placeholder="Buscar empleado...">
              <datalist id="hours-employee-list"></datalist>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted fw-bold mb-1">Desde</label>
              <input type="date" id="hours-filter-start" class="form-control form-control-sm">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
              <input type="date" id="hours-filter-end" class="form-control form-control-sm">
            </div>
            <div class="col-md-4 d-flex gap-2">
              <button id="btn-search-hours" class="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1">
                <i class="bi bi-search"></i> Buscar
              </button>
              <button id="btn-export-pdf" class="btn btn-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1">
                <i class="bi bi-file-earmark-pdf-fill"></i> PDF
              </button>
            </div>
          </div>

          <div id="hours-loading" class="text-center py-3 d-none"></div>

          <div id="hours-summary" class="row g-2 mb-3 d-none">
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light">
                <div class="card-body py-2 px-2 text-center">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Horas</div>
                  <div class="fs-6 fw-bold text-dark" id="hours-summary-total">0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light">
                <div class="card-body py-2 px-2 text-center">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Valor hora</div>
                  <div class="fs-6 fw-bold text-dark" id="hours-summary-rate">$0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light">
                <div class="card-body py-2 px-2 text-center">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Adelantos</div>
                  <div class="fs-6 fw-bold text-danger" id="hours-summary-advances">$0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light">
                <div class="card-body py-2 px-2 text-center">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Viáticos</div>
                  <div class="fs-6 fw-bold text-dark" id="hours-summary-viaticos">$0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light">
                <div class="card-body py-2 px-2 text-center">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Presentismo</div>
                  <div class="fs-6 fw-bold text-dark" id="hours-summary-presentismo">$0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="lt-metric lt-metric--dark h-100 text-center">
                <div class="card-body py-2 px-2">
                  <div class="small lt-metric__k text-uppercase" style="font-size: 0.7rem;">Total a pagar</div>
                  <div class="fs-6 fw-bold" id="hours-summary-total-net">$0</div>
                  <div class="small lt-metric__k" style="font-size: 0.65rem;" id="hours-summary-total-gross"></div>
                </div>
              </div>
            </div>
          </div>

          <div id="hours-results-container" class="d-none">
            <div class="table-responsive border rounded">
              <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                <thead class="bg-light">
                  <tr>
                    <th class="ps-3 py-2 text-muted font-weight-normal">Cliente</th>
                    <th class="py-2 text-muted font-weight-normal">Fecha</th>
                    <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                    <th class="py-2 text-muted font-weight-normal">Observaciones</th>
                    <th class="text-end py-2 pe-3 text-muted font-weight-normal" style="width: 100px;">Acciones</th>
                  </tr>
                </thead>
                <tbody id="hours-table-body"></tbody>
              </table>
            </div>
          </div>

          <div id="hours-empty-state" class="text-center py-4 d-none"></div>
        </div>
      </div>
    `;

    const emptyState = document.getElementById("hours-empty-state");
    if (emptyState && typeof EmptyState !== "undefined" && EmptyState) {
      EmptyState.render(emptyState, {
        variant: "empty",
        title: "Sin registros",
        message: "Utilizá los filtros para buscar registros."
      });
    }
  }

  function renderEmployees(employees) {
    const datalist = document.getElementById("hours-employee-list");
    const input = document.getElementById("hours-filter-employee");
    if (!datalist || !input) return;

    const ui = global.UIHelpers;
    const renderList = (labels) => {
      if (ui && typeof ui.renderDatalist === "function") {
        ui.renderDatalist(datalist, labels || []);
        return;
      }
      Dom && Dom.clear ? Dom.clear(datalist) : (datalist.innerHTML = "");
      (labels || []).forEach((label) => {
        const option = document.createElement("option");
        option.value = label;
        datalist.appendChild(option);
      });
    };
    renderList([]);
    input.value = "";

    const labels = state.setEmployeeMap(employees || []);
    renderList(labels);
  }

  function setLoading(show) {
    const loadingEl = document.getElementById("hours-loading");
    if (!loadingEl) return;
    loadingEl.classList.toggle("d-none", !show);
    if (show && typeof EmptyState !== "undefined" && EmptyState) {
      EmptyState.render(loadingEl, { variant: "loading", message: "Cargando registros..." });
    }
  }

  function renderEmpty(message) {
    const container = document.getElementById("hours-results-container");
    const emptyState = document.getElementById("hours-empty-state");
    if (container) container.classList.add("d-none");
    if (emptyState) {
      emptyState.classList.remove("d-none");
      if (typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(emptyState, {
          variant: "empty",
          title: "Sin registros",
          message: message || "No hay datos para los filtros seleccionados."
        });
      }
    }
  }

  function renderTable(rows, summary) {
    const tbody = document.getElementById("hours-table-body");
    const container = document.getElementById("hours-results-container");
    const emptyState = document.getElementById("hours-empty-state");
    if (!tbody || !container) return;

    if (!rows || !rows.length) {
      const progressEl = document.getElementById("hours-render-progress");
      if (progressEl) progressEl.remove();
      renderEmpty("No hay datos para los filtros seleccionados.");
      updateSummary(summary || null);
      return;
    }

    const ui = global.UIHelpers;
    const progressId = "hours-render-progress";
    let progressEl = document.getElementById(progressId);
    if (!progressEl) {
      progressEl = Dom.el("div", { id: progressId, className: "small text-muted py-2" });
      container.insertBefore(progressEl, container.firstChild);
    }
    progressEl.textContent = "Renderizando...";
    progressEl.classList.remove("d-none");

    const renderRow = (row) => {
      const hours = parseFloat(row.horas) || 0;
      const isAbsent = row.asistencia === false;
      const tr = Dom.el("tr", null, [
        Dom.el("td", { text: row.cliente || "-" }),
        Dom.el("td", { text: row.fecha || "" }),
        Dom.el("td", { className: "text-center fw-bold", text: String(hours) }),
        Dom.el("td", { className: "text-muted small", text: row.observaciones || "-" })
      ]);

      const editBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-primary lt-btn-icon btn-edit-hour",
        dataset: { id: row.id },
        title: "Editar"
      }, Dom.el("i", { className: "bi bi-pencil-fill" }));
      const deleteBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-danger lt-btn-icon btn-delete-hour",
        dataset: { id: row.id },
        title: "Eliminar"
      }, Dom.el("i", { className: "bi bi-trash-fill" }));
      const actions = Dom.el("div", { className: "d-flex gap-2 justify-content-end" }, [editBtn, deleteBtn]);
      tr.appendChild(Dom.el("td", { className: "text-end" }, actions));

      if (isAbsent) {
        tr.classList.add("absence-row");
      }
      return tr;
    };

    const finish = () => {
      if (progressEl) progressEl.remove();
    };

    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, rows, renderRow, {
        chunkSize: 150,
        onProgress: (done, total) => {
          if (progressEl) {
            progressEl.textContent = `Renderizando ${done} de ${total} registros...`;
          }
        },
        onDone: finish
      });
    } else {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      rows.forEach((row) => {
        const tr = renderRow(row);
        if (tr) tbody.appendChild(tr);
      });
      finish();
    }

    updateSummary(summary || {});
    container.classList.remove("d-none");
    if (emptyState) emptyState.classList.add("d-none");
  }

  function updateSummary(summary) {
    const box = document.getElementById("hours-summary");
    if (!box) return;

    const totals = {
      totalHoras: 0,
      valorHora: 0,
      totalBruto: 0,
      adelantos: 0,
      totalNeto: 0,
      viaticos: 0,
      presentismo: 0,
      ...(summary || {})
    };

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText("hours-summary-total", Formatters.formatNumber(totals.totalHoras, 2));
    setText("hours-summary-rate", Formatters.formatCurrency(totals.valorHora));
    setText("hours-summary-advances", Formatters.formatCurrency(totals.adelantos));
    setText("hours-summary-total-net", Formatters.formatCurrency(totals.totalNeto));
    setText("hours-summary-total-gross", "Total: " + Formatters.formatCurrency(totals.totalBruto));
    setText("hours-summary-viaticos", Formatters.formatCurrency(totals.viaticos));
    setText("hours-summary-presentismo", Formatters.formatCurrency(totals.presentismo));

    box.classList.remove("d-none");
  }

  global.HoursDetailPanelRender = {
    render: render,
    renderEmployees: renderEmployees,
    setLoading: setLoading,
    renderTable: renderTable,
    renderEmpty: renderEmpty,
    updateSummary: updateSummary
  };
})(typeof window !== "undefined" ? window : this);
