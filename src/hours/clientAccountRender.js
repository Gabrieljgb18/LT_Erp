/**
 * ClientAccountPanelRender
 * Render de cuenta corriente de clientes.
 */
(function (global) {
  const state = global.ClientAccountPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function render() {
    if (!state) return;
    let container = document.getElementById(state.containerId);
    if (!container) {
      const parent = document.getElementById("view-reportes-clientes");
      if (parent) {
        container = document.createElement("div");
        container.id = state.containerId;
        container.className = "mt-4";
        parent.appendChild(container);
      } else {
        return;
      }
    }

    // safe static: layout fijo sin datos externos.
    container.innerHTML = `
      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-wallet2 me-2"></i>Cuenta Corriente Clientes</h6>
          </div>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
              <input list="client-acc-list" id="client-acc-input" class="form-control form-control-sm" placeholder="Buscar cliente...">
              <datalist id="client-acc-list"></datalist>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted fw-bold mb-1">Desde</label>
              <input type="date" id="client-acc-start" class="form-control form-control-sm">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
              <input type="date" id="client-acc-end" class="form-control form-control-sm">
            </div>
            <div class="col-md-5 d-flex gap-2">
              <button class="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-acc-search">
                <i class="bi bi-search"></i> Consultar
              </button>
              <button class="btn btn-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-acc-pdf" title="Descargar PDF">
                <i class="bi bi-file-earmark-pdf-fill"></i> PDF
              </button>
              <button class="btn btn-success btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-acc-pay">
                <i class="bi bi-cash-coin"></i> Registrar Pago
              </button>
            </div>
          </div>

          <div id="client-acc-loading" class="text-center py-3 d-none"></div>

          <div id="client-acc-empty" class="text-center text-muted py-4 d-none"></div>

          <div id="client-acc-summary" class="row g-2 mb-2 d-none"></div>

          <div class="table-responsive lt-table-wrap d-none" id="client-acc-table-wrapper">
            <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
              <thead class="table-light">
                <tr>
                  <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                  <th class="py-2 text-muted font-weight-normal">Concepto</th>
                  <th class="text-end py-2 text-muted font-weight-normal">Debe (Factura)</th>
                  <th class="text-end py-2 text-muted font-weight-normal">Haber (Pago)</th>
                  <th class="text-end py-2 pe-3 text-muted font-weight-normal">Saldo</th>
                </tr>
              </thead>
              <tbody id="client-acc-tbody"></tbody>
            </table>
          </div>

          <details class="mt-2 d-none" id="client-acc-debug">
            <summary class="small text-muted">Diagnóstico</summary>
            <pre class="small mb-0 mt-2 p-2 bg-light border rounded" id="client-acc-debug-pre" style="white-space: pre-wrap;"></pre>
          </details>
        </div>
      </div>
    `;

    const empty = document.getElementById("client-acc-empty");
    if (empty && typeof EmptyState !== "undefined" && EmptyState) {
      EmptyState.render(empty, {
        variant: "empty",
        title: "Cuenta corriente",
        message: "Seleccioná un cliente para ver su cuenta corriente."
      });
    }
  }

  function renderClients(clients) {
    const datalist = document.getElementById("client-acc-list");
    const input = document.getElementById("client-acc-input");
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

  function renderEmpty(message, extra) {
    const empty = document.getElementById("client-acc-empty");
    if (!empty) return;
    empty.classList.remove("d-none");
    if (typeof EmptyState !== "undefined" && EmptyState) {
      EmptyState.render(empty, {
        variant: "empty",
        title: "Sin movimientos",
        message: message || "No hay movimientos registrados en este período."
      });
    } else {
      Dom && Dom.clear ? Dom.clear(empty) : (empty.innerHTML = "");
      empty.appendChild(Dom.el("div", { className: "text-muted small", text: message || "No hay movimientos registrados en este período." }));
    }
    if (extra) {
      empty.appendChild(Dom.el("div", { className: "small text-muted mt-1", text: extra }));
    }
  }

  function renderTable(data) {
    const tbody = document.getElementById("client-acc-tbody");
    const wrapper = document.getElementById("client-acc-table-wrapper");
    const summaryEl = document.getElementById("client-acc-summary");
    if (!tbody || !wrapper) return;

    const rows = data && data.movimientos ? data.movimientos : [];
    const saldoInicial = data && typeof data.saldoInicial === "number" ? data.saldoInicial : 0;

    if (rows.length === 0 && saldoInicial === 0) {
      const progressEl = document.getElementById("client-acc-render-progress");
      if (progressEl) progressEl.remove();
      wrapper.classList.add("d-none");
      if (summaryEl) summaryEl.classList.add("d-none");
      renderEmpty("No hay movimientos registrados en este período.");
      return;
    }

    const totalDebe = rows.reduce((acc, r) => acc + (Number(r.debe) || 0), 0);
    const totalHaber = rows.reduce((acc, r) => acc + (Number(r.haber) || 0), 0);

    let saldoFinal = saldoInicial;
    if (rows.length > 0) {
      const lastRowSaldo = rows[rows.length - 1].saldo;
      saldoFinal = (lastRowSaldo !== undefined && lastRowSaldo !== null) ? Number(lastRowSaldo) : saldoInicial;
    }

    if (summaryEl) {
      const saldoClass = saldoFinal > 0 ? "text-danger" : (saldoFinal < 0 ? "text-success" : "text-muted");
      Dom && Dom.clear ? Dom.clear(summaryEl) : (summaryEl.innerHTML = "");
      const cards = [
        { label: "Saldo anterior", value: Formatters.formatCurrency(saldoInicial), className: "" },
        { label: "Facturado", value: Formatters.formatCurrency(totalDebe), className: "text-danger" },
        { label: "Cobrado", value: Formatters.formatCurrency(totalHaber), className: "text-success" },
        { label: "Saldo final", value: Formatters.formatCurrency(saldoFinal), className: saldoClass }
      ];
      cards.forEach((card) => {
        const col = Dom.el("div", { className: "col-md-3" }, [
          Dom.el("div", { className: "card border-0 bg-light" }, [
            Dom.el("div", { className: "card-body py-2" }, [
              Dom.el("div", { className: "text-muted small fw-bold", text: card.label }),
              Dom.el("div", { className: "fw-bold " + card.className, text: card.value })
            ])
          ])
        ]);
        summaryEl.appendChild(col);
      });
      summaryEl.classList.remove("d-none");
    }

    const initialRow = Dom.el("tr", { className: "table-secondary fw-bold" }, [
      Dom.el("td", { className: "ps-3", colspan: "2", text: "Saldo Anterior" }),
      Dom.el("td", { className: "text-end", text: "-" }),
      Dom.el("td", { className: "text-end", text: "-" }),
      Dom.el("td", {
        className: "text-end pe-3 " + (saldoInicial > 0 ? "text-danger" : (saldoInicial < 0 ? "text-success" : "text-muted")),
        text: Formatters.formatCurrency(saldoInicial)
      })
    ]);
    const ui = global.UIHelpers;
    const progressId = "client-acc-render-progress";
    let progressEl = document.getElementById(progressId);
    const host = wrapper.parentElement || wrapper;
    if (!progressEl) {
      progressEl = Dom.el("div", { id: progressId, className: "small text-muted py-2" });
      host.insertBefore(progressEl, wrapper);
    }
    progressEl.textContent = "Renderizando...";
    progressEl.classList.remove("d-none");

    const renderRow = (r) => {
      const saldoClass = r.saldo > 0 ? "text-danger" : (r.saldo < 0 ? "text-success" : "text-muted");
      const dateStr = Formatters.formatDateDisplay(r.fecha);
      return Dom.el("tr", null, [
        Dom.el("td", { className: "ps-3", text: dateStr }),
        Dom.el("td", { text: r.concepto || "" }),
        Dom.el("td", { className: "text-end text-danger", text: r.debe > 0 ? Formatters.formatCurrency(r.debe) : "-" }),
        Dom.el("td", { className: "text-end text-success", text: r.haber > 0 ? Formatters.formatCurrency(r.haber) : "-" }),
        Dom.el("td", { className: "text-end fw-bold pe-3 " + saldoClass, text: Formatters.formatCurrency(r.saldo) })
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
            progressEl.textContent = `Renderizando ${done} de ${total} movimientos...`;
          }
        },
        onDone: finish
      }).then(() => {
        tbody.insertBefore(initialRow, tbody.firstChild);
      });
    } else {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      tbody.appendChild(initialRow);
      rows.forEach((r) => {
        const tr = renderRow(r);
        if (tr) tbody.appendChild(tr);
      });
      finish();
    }

    wrapper.classList.remove("d-none");
    const empty = document.getElementById("client-acc-empty");
    if (empty) empty.classList.add("d-none");
  }

  function toggleLoading(show) {
    const loading = document.getElementById("client-acc-loading");
    const empty = document.getElementById("client-acc-empty");
    const wrapper = document.getElementById("client-acc-table-wrapper");

    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Cargando movimientos..." });
      }
    }
    if (show) {
      if (empty) empty.classList.add("d-none");
      if (wrapper) wrapper.classList.add("d-none");
    }
  }

  function setDebug(payload, show) {
    const details = document.getElementById("client-acc-debug");
    const pre = document.getElementById("client-acc-debug-pre");
    if (!details || !pre) return;

    if (!show) {
      details.classList.add("d-none");
      details.open = false;
      return;
    }

    let text = "";
    try {
      text = JSON.stringify(payload, null, 2);
    } catch (e) {
      text = String(payload);
    }

    if (text.length > 12000) {
      text = text.slice(0, 12000) + "\n... (truncado)";
    }

    pre.textContent = text;
    details.classList.remove("d-none");
    details.open = true;
  }

  global.ClientAccountPanelRender = {
    render: render,
    renderClients: renderClients,
    renderTable: renderTable,
    renderEmpty: renderEmpty,
    toggleLoading: toggleLoading,
    setDebug: setDebug
  };
})(typeof window !== "undefined" ? window : this);
