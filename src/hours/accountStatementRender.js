/**
 * AccountStatementPanelRender
 */
(function (global) {
  const state = global.AccountStatementPanelState;
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
            <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-journal-text me-2"></i>Cuenta Corriente Empleados</h6>
          </div>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label small text-muted fw-bold mb-1">Mes</label>
              <input type="month" id="acc-month" class="form-control form-control-sm">
            </div>
            <div class="col-md-4 d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1" id="acc-refresh" title="Actualizar">
                <i class="bi bi-arrow-repeat"></i>
              </button>
              <button class="btn btn-success btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="acc-new-payment">
                <i class="bi bi-cash-coin"></i> Registrar pago
              </button>
            </div>
          </div>

          <div id="acc-loading" class="text-center py-3 d-none"></div>
          <div id="acc-empty" class="text-center text-muted py-4 d-none"></div>
          <div class="table-responsive border rounded d-none" id="acc-table-wrapper">
            <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
              <thead class="bg-light">
                <tr>
                  <th class="ps-3 py-2 text-muted font-weight-normal">Empleado</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Debe (neto)</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Haber (pagos+adelantos)</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Saldo</th>
                </tr>
              </thead>
              <tbody id="acc-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const monthInput = document.getElementById("acc-month");
    if (monthInput) {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      monthInput.value = ym;
    }
  }

  function renderTable(rows) {
    const tbody = document.getElementById("acc-tbody");
    const wrapper = document.getElementById("acc-table-wrapper");
    const empty = document.getElementById("acc-empty");
    if (!tbody || !wrapper || !empty) return;

    if (!rows || !rows.length) {
      const progressEl = document.getElementById("acc-render-progress");
      if (progressEl) progressEl.remove();
      wrapper.classList.add("d-none");
      empty.classList.remove("d-none");
      if (typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(empty, {
          variant: "empty",
          title: "Sin movimientos",
          message: "Sin movimientos para el mes seleccionado."
        });
      }
      return;
    }

    const ui = global.UIHelpers;
    const progressId = "acc-render-progress";
    let progressEl = document.getElementById(progressId);
    const host = wrapper.parentElement || wrapper;
    if (!progressEl) {
      progressEl = Dom.el("div", { id: progressId, className: "small text-muted py-2" });
      host.insertBefore(progressEl, wrapper);
    }
    progressEl.textContent = "Renderizando...";
    progressEl.classList.remove("d-none");

    const renderRow = (r) => {
      const saldoClass = Number(r.saldo) >= 0 ? "text-success" : "text-danger";
      return Dom.el("tr", null, [
        Dom.el("td", { text: r.empleado || "" }),
        Dom.el("td", { className: "text-center", text: Formatters.formatCurrency(r.debe) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatCurrency(r.haber) }),
        Dom.el("td", { className: "text-center fw-bold " + saldoClass, text: Formatters.formatCurrency(r.saldo) })
      ]);
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
      rows.forEach((r) => {
        const tr = renderRow(r);
        if (tr) tbody.appendChild(tr);
      });
      finish();
    }

    wrapper.classList.remove("d-none");
    empty.classList.add("d-none");
  }

  function toggleLoading(show) {
    const loading = document.getElementById("acc-loading");
    const empty = document.getElementById("acc-empty");
    const wrapper = document.getElementById("acc-table-wrapper");
    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Cargando..." });
      }
    }
    if (wrapper && show) wrapper.classList.add("d-none");
    if (empty && show) empty.classList.add("d-none");
  }

  global.AccountStatementPanelRender = {
    render: render,
    renderTable: renderTable,
    toggleLoading: toggleLoading
  };
})(typeof window !== "undefined" ? window : this);
