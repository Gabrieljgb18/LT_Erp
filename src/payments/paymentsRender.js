/**
 * PaymentsPanelRender
 * Render del panel de pagos.
 */
(function (global) {
  const state = global.PaymentsPanelState;
  const Dom = global.DomHelpers;

  function renderSelect_(select, options, selected, settings) {
    if (!select) return;
    const ui = global.UIHelpers;
    if (ui && typeof ui.renderSelect === "function") {
      ui.renderSelect(select, options, selected, settings);
      return;
    }
    Dom.clear(select);
    const cfg = settings || {};
    if (cfg.includeEmpty) {
      select.appendChild(Dom.el("option", { value: "", text: cfg.emptyLabel || "Seleccionar..." }));
    }
    (options || []).forEach((opt) => {
      const node = Dom.el("option", { value: opt.value, text: opt.label });
      if (opt.dataset) {
        Object.keys(opt.dataset).forEach((key) => {
          if (opt.dataset[key] != null) node.dataset[key] = String(opt.dataset[key]);
        });
      }
      if (selected && String(opt.value) === String(selected)) node.selected = true;
      select.appendChild(node);
    });
  }

  function getPaymentMethods_() {
    if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.getOptions === "function") {
      const list = DropdownConfig.getOptions("MEDIO DE PAGO", state.defaultPaymentMethods);
      if (Array.isArray(list) && list.length) return list;
    }
    return state.defaultPaymentMethods.slice();
  }

  function renderPaymentMethodOptions_() {
    const select = document.getElementById("payments-method");
    if (!select) return;
    const current = select.value || "";
    const options = getPaymentMethods_().map((method) => ({
      value: method,
      label: method
    }));
    renderSelect_(select, options, current, { includeEmpty: true, emptyLabel: "Seleccionar..." });
  }

  function render() {
    const container = document.getElementById(state.containerId);
    if (!container) return;

    // safe static: layout fijo sin datos externos.
    container.innerHTML = `
      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-wallet2 me-2"></i>Pagos</h6>
            <div class="small text-muted">Registrá pagos a cuenta o aplicados a facturas.</div>
          </div>
          <button class="btn btn-outline-secondary btn-sm" id="payments-refresh">
            <i class="bi bi-arrow-repeat me-1"></i>Actualizar
          </button>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 align-items-end mb-3">
            <div class="col-md-5">
              <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
              <input list="payments-client-list" id="payments-client" class="form-control form-control-sm" placeholder="Seleccionar cliente...">
              <datalist id="payments-client-list"></datalist>
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Tipo de pago</label>
              <div class="btn-group w-100" role="group" id="payments-mode-group">
                <button type="button" class="btn btn-outline-primary btn-sm active" data-mode="account">
                  <i class="bi bi-cash-stack me-1"></i>A cuenta
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm" data-mode="invoice">
                  <i class="bi bi-receipt-cutoff me-1"></i>A factura
                </button>
              </div>
            </div>
            <div class="col-md-3">
              <label class="form-label small text-muted fw-bold mb-1">Fecha</label>
              <input type="date" id="payments-date" class="form-control form-control-sm">
            </div>
          </div>

          <div class="row g-2">
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Monto</label>
              <input type="number" id="payments-amount" class="form-control form-control-sm" step="0.01" min="0">
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Medio de pago</label>
              <select id="payments-method" class="form-select form-select-sm"></select>
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Comprobante</label>
              <input type="text" id="payments-receipt" class="form-control form-control-sm" placeholder="Nro. comprobante">
            </div>
          </div>

          <div class="row g-2 mt-2">
            <div class="col-md-8">
              <label class="form-label small text-muted fw-bold mb-1">Observaciones</label>
              <input type="text" id="payments-notes" class="form-control form-control-sm" placeholder="Detalle del pago...">
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Factura</label>
              <select id="payments-invoice" class="form-select form-select-sm" disabled>
                <option value="">Seleccionar factura...</option>
              </select>
            </div>
          </div>

          <div class="d-flex justify-content-end mt-3">
            <button class="btn btn-success btn-sm" id="payments-save">
              <i class="bi bi-check2-circle me-1"></i>Guardar pago
            </button>
          </div>

          <div class="row g-2 mt-4">
            <div class="col-lg-8">
              <div class="card border shadow-none h-100">
                <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                  <span class="text-muted small fw-bold text-uppercase">Facturas pendientes</span>
                  <span class="badge bg-white text-dark border" id="payments-invoice-count">0</span>
                </div>
                <div class="card-body p-0">
                  <div id="payments-invoice-summary" class="p-3 border-bottom">
                    <div class="text-muted small">Seleccioná una factura para ver el detalle.</div>
                  </div>
                  <div id="payments-invoice-loading" class="text-center py-4 d-none">
                  </div>
                  <div class="table-responsive lt-table-wrap" id="payments-invoice-table-wrapper">
                    <table class="table table-hover table-sm align-middle mb-0">
                      <thead class="table-light">
                        <tr>
                          <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                          <th class="py-2 text-muted font-weight-normal">Factura</th>
                          <th class="text-end py-2 text-muted font-weight-normal">Saldo</th>
                          <th class="text-center py-2 text-muted font-weight-normal">Acción</th>
                        </tr>
                      </thead>
                      <tbody id="payments-invoice-tbody"></tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="card border shadow-none h-100">
                <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                  <span class="text-muted small fw-bold text-uppercase">Pagos a cuenta</span>
                  <span class="badge bg-white text-dark border" id="payments-unapplied-count">0</span>
                </div>
                <div class="card-body p-0">
                  <div id="payments-unapplied-loading" class="text-center py-4 d-none">
                  </div>
                  <div class="table-responsive lt-table-wrap" id="payments-unapplied-table-wrapper">
                    <table class="table table-hover table-sm align-middle mb-0">
                      <thead class="table-light">
                        <tr>
                          <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                          <th class="py-2 text-muted font-weight-normal">Detalle</th>
                          <th class="text-end py-2 text-muted font-weight-normal">Disponible</th>
                          <th class="py-2 text-muted font-weight-normal">Medio</th>
                          <th class="py-2 text-muted font-weight-normal">Comprobante</th>
                          <th class="text-center py-2 text-muted font-weight-normal">Acción</th>
                        </tr>
                      </thead>
                      <tbody id="payments-unapplied-tbody"></tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    renderPaymentMethodOptions_();
    PaymentsPanelHandlers.setDefaultDate();
    PaymentsPanelData.loadClients();
    PaymentsPanelHandlers.attachEvents();
    PaymentsPanelHandlers.updateMode("account");
    renderInvoiceTable([]);
    renderUnappliedTable([]);
  }

  function renderInvoiceOptions(items) {
    const select = document.getElementById("payments-invoice");
    if (!select) return;
    const options = (items || []).map((inv) => {
      const fechaStr = inv.fecha ? Formatters.formatDateDisplay(inv.fecha) : "";
      const saldo = Formatters.formatCurrency(inv.saldo || 0);
      return {
        value: inv.id || "",
        label: `${fechaStr} - ${inv.numero || "S/N"} (${saldo})`,
        dataset: { numero: inv.numero || "" }
      };
    });
    renderSelect_(select, options, "", { includeEmpty: true, emptyLabel: "Seleccionar factura..." });
  }

  function renderInvoiceSummary(invoiceId) {
    const box = document.getElementById("payments-invoice-summary");
    if (!box) return;

    const invoice = state.pendingInvoices.find((inv) => String(inv.id || "") === String(invoiceId || ""));
    if (!invoice) {
      if (typeof EmptyState !== "undefined" && EmptyState && typeof EmptyState.renderInline === "function") {
        EmptyState.renderInline(box, "Seleccioná una factura para ver el detalle.");
      } else {
        Dom.clear(box);
        Dom.append(box, Dom.el("div", { className: "text-muted small", text: "Seleccioná una factura para ver el detalle." }));
      }
      return;
    }

    Dom.clear(box);
    Dom.append(box, [
      Dom.el("div", { className: "small text-muted", text: "Factura seleccionada" }),
      Dom.el("div", { className: "fw-semibold", text: invoice.numero || "S/N" }),
      Dom.el("div", { className: "small text-muted mt-1", text: invoice.concepto || "" }),
      Dom.el("div", { className: "d-flex gap-3 mt-2" }, [
        Dom.el("span", { text: `Fecha: ${Formatters.formatDateDisplay(invoice.fecha)}` }),
        Dom.el("span", null, [
          Dom.el("span", { text: "Saldo: " }),
          Dom.el("strong", { text: Formatters.formatCurrency(invoice.saldo || 0) })
        ])
      ])
    ]);
  }

  function renderEmptyRow_(tbody, colSpan, message) {
    if (!tbody) return;
    const td = Dom.el("td", {
      className: "text-center py-4",
      colSpan: String(colSpan || 1)
    });
    if (global.EmptyState && typeof global.EmptyState.renderInline === "function") {
      global.EmptyState.renderInline(td, message || "Sin datos para mostrar.");
    } else {
      Dom.append(td, Dom.el("div", { className: "text-muted small", text: message || "Sin datos para mostrar." }));
    }
    const tr = Dom.el("tr", null, td);
    tbody.appendChild(tr);
  }

  function renderInvoiceTable(items) {
    const tbody = document.getElementById("payments-invoice-tbody");
    if (!tbody) return;
    Dom.clear(tbody);

    if (!items || !items.length) {
      renderEmptyRow_(tbody, 4, "Sin facturas pendientes.");
      return;
    }

    items.forEach((inv) => {
      const tr = Dom.el("tr");
      tr.appendChild(Dom.el("td", { className: "ps-3", text: Formatters.formatDateDisplay(inv.fecha) }));

      const infoTd = Dom.el("td");
      Dom.append(infoTd, [
        Dom.el("div", { className: "fw-semibold", text: inv.numero || "S/N" }),
        Dom.el("div", { className: "text-muted small", text: inv.concepto || "" })
      ]);
      tr.appendChild(infoTd);

      tr.appendChild(Dom.el("td", {
        className: "text-end text-danger",
        text: Formatters.formatCurrency(inv.saldo || 0)
      }));

      const actionBtn = Dom.el("button", {
        className: "btn btn-outline-primary btn-sm",
        dataset: { invoiceId: inv.id || "" },
        text: "Seleccionar"
      });
      tr.appendChild(Dom.el("td", { className: "text-center" }, actionBtn));

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-invoice-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const invoiceId = btn.getAttribute("data-invoice-id");
        const select = document.getElementById("payments-invoice");
        if (select) {
          select.value = invoiceId || "";
          renderInvoiceSummary(invoiceId);
        }
      });
    });
  }

  function renderUnappliedTable(items) {
    const tbody = document.getElementById("payments-unapplied-tbody");
    if (!tbody) return;
    Dom.clear(tbody);

    if (!items || !items.length) {
      renderEmptyRow_(tbody, 6, "Sin pagos a cuenta disponibles.");
      return;
    }

    items.forEach((pay) => {
      const tr = Dom.el("tr");
      tr.appendChild(Dom.el("td", { className: "ps-3", text: Formatters.formatDateDisplay(pay.fecha) }));
      tr.appendChild(Dom.el("td", { text: pay.detalle || "" }));
      tr.appendChild(Dom.el("td", {
        className: "text-end text-success",
        text: Formatters.formatCurrency(pay.monto || 0)
      }));
      tr.appendChild(Dom.el("td", { text: pay.medioPago || "" }));
      tr.appendChild(Dom.el("td", { text: pay.numeroComprobante || "" }));

      const actionBtn = Dom.el("button", {
        className: "btn btn-outline-primary btn-sm",
        dataset: { payId: pay.id || "" },
        text: "Aplicar"
      });
      tr.appendChild(Dom.el("td", { className: "text-center" }, actionBtn));

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-pay-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const payId = btn.getAttribute("data-pay-id");
        PaymentsPanelHandlers.openApplyModal(payId);
      });
    });
  }

  function updateInvoiceCount(count) {
    const badge = document.getElementById("payments-invoice-count");
    if (badge) badge.textContent = String(count || 0);
  }

  function updateUnappliedCount(count) {
    const badge = document.getElementById("payments-unapplied-count");
    if (badge) badge.textContent = String(count || 0);
  }

  function toggleInvoiceLoading(show) {
    const loading = document.getElementById("payments-invoice-loading");
    const wrapper = document.getElementById("payments-invoice-table-wrapper");
    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Cargando facturas..." });
      }
    }
    if (wrapper) wrapper.classList.toggle("d-none", show);
  }

  function toggleUnappliedLoading(show) {
    const loading = document.getElementById("payments-unapplied-loading");
    const wrapper = document.getElementById("payments-unapplied-table-wrapper");
    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Cargando pagos..." });
      }
    }
    if (wrapper) wrapper.classList.toggle("d-none", show);
  }

  global.PaymentsPanelRender = {
    render,
    renderInvoiceOptions,
    renderInvoiceSummary,
    renderInvoiceTable,
    renderUnappliedTable,
    updateInvoiceCount,
    updateUnappliedCount,
    toggleInvoiceLoading,
    toggleUnappliedLoading
  };
})(typeof window !== "undefined" ? window : this);
