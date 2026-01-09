/**
 * PaymentsPanelHandlers
 * Eventos y acciones del panel de pagos.
 */
(function (global) {
  const state = global.PaymentsPanelState;
  const Dom = global.DomHelpers;

  function setDefaultDate() {
    const dateInput = document.getElementById("payments-date");
    if (dateInput) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }
  }

  function handleReferenceUpdate() {
    const view = document.getElementById("view-pagos");
    if (view && !view.classList.contains("d-none")) {
      PaymentsPanelData.loadClients();
    }
  }

  function attachEvents() {
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler) => {
      if (!el) return;
      el.addEventListener(evt, handler, { signal });
    };

    const refreshBtn = document.getElementById("payments-refresh");
    if (refreshBtn) {
      on(refreshBtn, "click", () => {
        PaymentsPanelData.loadClients();
        PaymentsPanelData.refreshClientData();
      });
    }

    const clientInput = document.getElementById("payments-client");
    if (clientInput) {
      on(clientInput, "change", () => {
        PaymentsPanelData.refreshClientData();
        PaymentsPanelRender.renderInvoiceSummary("");
      });
    }

    const modeGroup = document.getElementById("payments-mode-group");
    if (modeGroup) {
      modeGroup.querySelectorAll("[data-mode]").forEach((btn) => {
        on(btn, "click", () => updateMode(btn.getAttribute("data-mode")));
      });
    }

    const invoiceSelect = document.getElementById("payments-invoice");
    if (invoiceSelect) {
      on(invoiceSelect, "change", () => {
        PaymentsPanelRender.renderInvoiceSummary(invoiceSelect.value || "");
      });
    }

    const saveBtn = document.getElementById("payments-save");
    if (saveBtn) {
      on(saveBtn, "click", savePayment);
    }
  }

  function updateMode(mode) {
    const normalized = mode === "invoice" ? "invoice" : "account";
    state.currentMode = normalized;

    const group = document.getElementById("payments-mode-group");
    if (group) {
      group.querySelectorAll("[data-mode]").forEach((btn) => {
        const isActive = btn.getAttribute("data-mode") === normalized;
        btn.classList.toggle("active", isActive);
      });
    }

    const invoiceSelect = document.getElementById("payments-invoice");
    if (invoiceSelect) {
      invoiceSelect.disabled = normalized !== "invoice";
      if (normalized !== "invoice") {
        invoiceSelect.value = "";
      }
    }
  }

  function openApplyModal(paymentId) {
    const payment = state.unappliedPayments.find((p) => String(p.id || "") === String(paymentId || ""));
    if (!payment) return;
    showApplyModal(payment);
  }

  function showApplyModal(payment) {
    if (!global.ModalHelpers) return;

    const body = Dom.el("div", { className: "payments-apply-body" }, [
      Dom.el("div", { className: "d-flex justify-content-between align-items-center mb-3" }, [
        Dom.el("div", {}, [
          Dom.el("div", { className: "small text-muted", text: "Pago disponible" }),
          Dom.el("div", { className: "fw-semibold", id: "payments-apply-amount" })
        ]),
        Dom.el("div", { className: "text-end" }, [
          Dom.el("div", { className: "small text-muted", text: "Disponible" }),
          Dom.el("strong", { id: "payments-apply-remaining" })
        ])
      ]),
      Dom.el("div", { className: "table-responsive" }, [
        Dom.el("table", { className: "table table-sm align-middle" }, [
          Dom.el("thead", { className: "table-light" }, [
            Dom.el("tr", {}, [
              Dom.el("th", { text: "Factura" }),
              Dom.el("th", { text: "Fecha" }),
              Dom.el("th", { className: "text-end", text: "Saldo" }),
              Dom.el("th", { className: "text-end", text: "Aplicar" })
            ])
          ]),
          Dom.el("tbody", { id: "payments-apply-tbody" })
        ])
      ]),
      Dom.el("div", { className: "text-end" }, [
        Dom.el("span", { className: "text-muted small", text: "Total aplicado:" }),
        Dom.el("strong", { id: "payments-apply-total", className: "ms-2" })
      ])
    ]);

    const footer = [
      Dom.el("button", {
        type: "button",
        className: "btn btn-secondary",
        "data-bs-dismiss": "modal",
        text: "Cancelar"
      }),
      Dom.el("button", {
        type: "button",
        className: "btn btn-primary",
        id: "payments-apply-confirm",
        text: "Aplicar pago"
      })
    ];

    const modalEl = global.ModalHelpers.create(
      "payments-apply-modal",
      "Aplicar pago a facturas",
      body,
      footer,
      { size: "lg" }
    );
    if (!modalEl) return;

    const amountEl = document.getElementById("payments-apply-amount");
    const remainingEl = document.getElementById("payments-apply-remaining");
    const totalEl = document.getElementById("payments-apply-total");
    if (amountEl) amountEl.textContent = Formatters.formatCurrency(payment.monto || 0);
    if (remainingEl) remainingEl.textContent = Formatters.formatCurrency(payment.monto || 0);
    if (totalEl) totalEl.textContent = Formatters.formatCurrency(0);

    const tbody = document.getElementById("payments-apply-tbody");
    Dom.clear(tbody);
    (state.pendingInvoices || []).forEach((inv) => {
      const saldo = Number(inv.saldo || 0);
      const tr = Dom.el("tr");
      const infoTd = Dom.el("td");
      Dom.append(infoTd, [
        Dom.el("div", { className: "fw-semibold", text: inv.numero || "S/N" }),
        Dom.el("div", { className: "text-muted small", text: inv.concepto || "" })
      ]);
      tr.appendChild(infoTd);
      tr.appendChild(Dom.el("td", { text: Formatters.formatDateDisplay(inv.fecha) }));
      tr.appendChild(Dom.el("td", { className: "text-end", text: Formatters.formatCurrency(saldo) }));
      const input = Dom.el("input", {
        type: "number",
        className: "form-control form-control-sm text-end",
        step: "0.01",
        min: "0",
        max: saldo,
        value: "0",
        dataset: { invoiceId: inv.id || "", invoiceMax: saldo }
      });
      tr.appendChild(Dom.el("td", { className: "text-end" }, input));
      tbody.appendChild(tr);
    });

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener("input", () => updateApplyTotals(modalEl, payment));

    const confirmBtn = document.getElementById("payments-apply-confirm");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => handleApplyConfirm(modalEl, payment, modal));
    }

    autoDistributeAllocations(modalEl, payment);
  }

  function autoDistributeAllocations(modalEl, payment) {
    const inputs = modalEl.querySelectorAll("input[data-invoice-id]");
    let remaining = Number(payment.monto || 0);
    inputs.forEach((input) => {
      if (remaining <= 0) {
        input.value = "0";
        return;
      }
      const max = Number(input.dataset.invoiceMax || 0);
      const value = Math.min(max, remaining);
      input.value = value.toFixed(2);
      remaining -= value;
    });
    updateApplyTotals(modalEl, payment);
  }

  function updateApplyTotals(modalEl, payment) {
    const inputs = modalEl.querySelectorAll("input[data-invoice-id]");
    let total = 0;
    inputs.forEach((input) => {
      const value = Number(input.value || 0);
      if (!isNaN(value)) total += value;
    });

    const totalEl = document.getElementById("payments-apply-total");
    if (totalEl) totalEl.textContent = Formatters.formatCurrency(total);

    const remainingEl = document.getElementById("payments-apply-remaining");
    if (remainingEl) {
      const remaining = Number(payment.monto || 0) - total;
      remainingEl.textContent = Formatters.formatCurrency(remaining);
    }
  }

  function collectAllocations(modalEl) {
    const inputs = modalEl.querySelectorAll("input[data-invoice-id]");
    const allocations = [];
    inputs.forEach((input) => {
      const amount = Number(input.value || 0);
      if (amount > 0) {
        allocations.push({
          invoiceId: input.dataset.invoiceId,
          amount: amount
        });
      }
    });
    return allocations;
  }

  function handleApplyConfirm(modalEl, payment, modal) {
    const allocations = collectAllocations(modalEl);
    if (!allocations.length) {
      Alerts && Alerts.showAlert("Ingresá un monto a aplicar.", "warning");
      return;
    }

    UiState.setGlobalLoading(true, "Aplicando pago...");
    PaymentsService.applyClientPayment(payment.id, allocations)
      .then((res) => {
        const applied = res && res.applied != null ? Formatters.formatCurrency(res.applied) : "";
        const remaining = res && res.remaining != null ? Formatters.formatCurrency(res.remaining) : "";
        if (applied || remaining) {
          Alerts && Alerts.showAlert(`Pago aplicado. Aplicado: ${applied} · Pendiente: ${remaining}`, "success");
        } else {
          Alerts && Alerts.showAlert("Pago aplicado correctamente.", "success");
        }
        modal.hide();
        PaymentsPanelData.refreshClientData();
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al aplicar pago", err);
        } else {
          Alerts && Alerts.showAlert("Error al aplicar pago", "danger");
        }
      })
      .finally(() => UiState.setGlobalLoading(false));
  }

  function savePayment() {
    const clientRaw = document.getElementById("payments-client")?.value || "";
    const idCliente = PaymentsPanelData.getClientIdFromLabel(clientRaw);
    const fecha = document.getElementById("payments-date")?.value || "";
    const monto = document.getElementById("payments-amount")?.value || "";
    const medioPago = document.getElementById("payments-method")?.value || "";
    const nroComprobante = document.getElementById("payments-receipt")?.value || "";
    const obs = document.getElementById("payments-notes")?.value || "";
    const facturaSelect = document.getElementById("payments-invoice");
    const facturaId = state.currentMode === "invoice" && facturaSelect ? facturaSelect.value : "";
    const facturaNumero = state.currentMode === "invoice" && facturaSelect && facturaSelect.selectedOptions[0]
      ? (facturaSelect.selectedOptions[0].dataset.numero || "")
      : "";

    if (!clientRaw) {
      Alerts && Alerts.showAlert("Seleccioná un cliente.", "warning");
      return;
    }
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    if (!monto) {
      Alerts && Alerts.showAlert("Ingresá un monto.", "warning");
      return;
    }
    if (state.currentMode === "invoice" && !facturaId) {
      Alerts && Alerts.showAlert("Seleccioná una factura para asociar el pago.", "warning");
      return;
    }

    UiState.setGlobalLoading(true, "Guardando pago...");
    PaymentsService.recordClientPayment({
      fecha: fecha,
      cliente: clientRaw,
      idCliente: idCliente,
      monto: monto,
      detalle: obs,
      numeroComprobante: nroComprobante,
      medioPago: medioPago,
      idFactura: facturaId || "",
      facturaNumero: facturaNumero || ""
    })
      .then(() => {
        Alerts && Alerts.showAlert("Pago registrado correctamente.", "success");
        clearForm(false);
        PaymentsPanelData.refreshClientData();
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al registrar pago", err);
        } else {
          Alerts && Alerts.showAlert("Error al registrar pago", "danger");
        }
      })
      .finally(() => UiState.setGlobalLoading(false));
  }

  function clearForm(resetClient = true) {
    if (resetClient) {
      const clientInput = document.getElementById("payments-client");
      if (clientInput) clientInput.value = "";
      state.pendingInvoices = [];
      state.unappliedPayments = [];
    }
    const amount = document.getElementById("payments-amount");
    if (amount) amount.value = "";
    const method = document.getElementById("payments-method");
    if (method) method.value = "";
    const receipt = document.getElementById("payments-receipt");
    if (receipt) receipt.value = "";
    const notes = document.getElementById("payments-notes");
    if (notes) notes.value = "";
    const invoiceSelect = document.getElementById("payments-invoice");
    if (invoiceSelect) invoiceSelect.value = "";
    PaymentsPanelRender.renderInvoiceSummary("");
    if (resetClient) {
      PaymentsPanelRender.renderInvoiceTable([]);
      PaymentsPanelRender.updateInvoiceCount(0);
      PaymentsPanelRender.renderUnappliedTable([]);
      PaymentsPanelRender.updateUnappliedCount(0);
    }
  }

  global.PaymentsPanelHandlers = {
    setDefaultDate,
    handleReferenceUpdate,
    attachEvents,
    updateMode,
    openApplyModal,
    savePayment,
    clearForm
  };
})(typeof window !== "undefined" ? window : this);
