/**
 * ClientAccountPanelHandlers
 * Eventos de cuenta corriente de clientes.
 */
(function (global) {
  const state = global.ClientAccountPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function ensureDeps() {
    return state && global.ClientAccountPanelData && global.ClientAccountPanelRender;
  }

  function setDefaultDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startInput = document.getElementById("client-acc-start");
    const endInput = document.getElementById("client-acc-end");
    if (startInput) startInput.valueAsDate = firstDay;
    if (endInput) endInput.valueAsDate = lastDay;
  }

  function init() {
    if (!ensureDeps()) return;
    setDefaultDates();
    global.ClientAccountPanelData.loadClients().then((clients) => {
      global.ClientAccountPanelRender.renderClients(clients || []);
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

    on(document.getElementById("client-acc-search"), "click", handleSearch);
    on(document.getElementById("client-acc-pdf"), "click", handleExportPdf);
    on(document.getElementById("client-acc-pay"), "click", openPaymentModal);
  }

  function handleReferenceUpdate() {
    const view = document.getElementById("view-reportes-clientes");
    if (view && !view.classList.contains("d-none")) {
      global.ClientAccountPanelData.loadClients().then((clients) => {
        global.ClientAccountPanelRender.renderClients(clients || []);
      });
    }
  }

  function handleSearch() {
    if (!ensureDeps()) return;
    const clientRaw = document.getElementById("client-acc-input")?.value || "";
    const idCliente = state.getClientIdFromLabel(clientRaw);
    const startDate = document.getElementById("client-acc-start")?.value || "";
    const endDate = document.getElementById("client-acc-end")?.value || "";

    if (!clientRaw) {
      Alerts && Alerts.showAlert("Seleccioná un cliente", "warning");
      return;
    }
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    if (!startDate || !endDate) {
      Alerts && Alerts.showAlert("Seleccioná un rango de fechas", "warning");
      return;
    }

    state.lastQuery = { clientRaw, idCliente, startDate, endDate };
    global.ClientAccountPanelRender.toggleLoading(true);

    global.ClientAccountPanelData.fetchAccountStatement(state.lastQuery)
      .then((data) => {
        global.ClientAccountPanelRender.renderTable(data);
        global.ClientAccountPanelRender.setDebug({ query: state.lastQuery, response: data }, false);

        const rows = data && data.movimientos ? data.movimientos : [];
        const saldoInicial = data && typeof data.saldoInicial === "number" ? data.saldoInicial : 0;
        if (rows.length === 0 && saldoInicial === 0) {
          global.ClientAccountPanelData.fetchInvoicesCount(idCliente, startDate, endDate)
            .then((count) => {
              const extra = "Facturas encontradas para este cliente y rango: " + count;
              global.ClientAccountPanelRender.renderEmpty("No hay movimientos registrados en este período.", extra);
              if (count > 0) {
                global.ClientAccountPanelRender.setDebug({ query: state.lastQuery, response: data, invoicesFound: count }, true);
              }
            });
        }
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al cargar cuenta corriente", err);
        } else {
          console.error(err);
          Alerts && Alerts.showAlert("Error al cargar cuenta corriente", "danger");
        }
      })
      .finally(() => global.ClientAccountPanelRender.toggleLoading(false));
  }

  function handleExportPdf() {
    if (!ensureDeps()) return;
    const clientRaw = document.getElementById("client-acc-input")?.value || "";
    const idCliente = state.getClientIdFromLabel(clientRaw);
    const startDate = document.getElementById("client-acc-start")?.value || "";
    const endDate = document.getElementById("client-acc-end")?.value || "";

    if (!clientRaw) {
      Alerts && Alerts.showAlert("Seleccioná un cliente", "warning");
      return;
    }
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    if (!startDate || !endDate) {
      Alerts && Alerts.showAlert("Seleccioná un rango de fechas", "warning");
      return;
    }

    const btn = document.getElementById("client-acc-pdf");
    const ui = global.UIHelpers;
      if (btn && ui && typeof ui.withSpinner === "function") {
        ui.withSpinner(btn, true, "Descargando...");
      }

    UiState && UiState.setGlobalLoading(true, "Generando PDF...");
    global.ClientAccountPanelData.generatePdf({ clientRaw, idCliente, startDate, endDate })
      .then((res) => {
        if (!res || !res.base64) throw new Error("No se pudo generar PDF");
        const link = document.createElement("a");
        link.href = "data:application/pdf;base64," + res.base64;
        link.download = res.filename || "cuenta_corriente_cliente.pdf";
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

  function openPaymentModal() {
    if (!ensureDeps()) return;
    const clientRaw = document.getElementById("client-acc-input")?.value || "";
    const idCliente = state.getClientIdFromLabel(clientRaw);
    const clientLabel = clientRaw;
    if (!clientRaw) {
      Alerts && Alerts.showAlert("Seleccioná un cliente primero", "warning");
      return;
    }
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }

    const existing = document.getElementById("client-pay-modal");
    if (existing) existing.remove();

    const modalEl = Dom.el("div", { className: "modal fade", id: "client-pay-modal", tabIndex: "-1" },
      Dom.el("div", { className: "modal-dialog modal-dialog-centered" },
        Dom.el("div", { className: "modal-content" }, [
          Dom.el("div", { className: "modal-header" }, [
            Dom.el("h6", { className: "modal-title fw-bold", text: "Registrar Pago de Cliente" }),
            Dom.el("button", { type: "button", className: "btn-close", dataset: { bsDismiss: "modal" } })
          ]),
          Dom.el("div", { className: "modal-body" }, [
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted fw-bold", text: "Cliente" }),
              Dom.el("input", { type: "text", className: "form-control", value: clientRaw, disabled: true })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted fw-bold", text: "Fecha" }),
              Dom.el("input", { type: "date", id: "cp-fecha", className: "form-control", value: new Date().toISOString().slice(0, 10) })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted fw-bold", text: "Monto" }),
              Dom.el("input", { type: "number", id: "cp-monto", className: "form-control", step: "0.01" })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted fw-bold", text: "Medio de pago" }),
              Dom.el("select", { id: "cp-medio", className: "form-select" }, [
                Dom.el("option", { value: "", text: "Seleccionar..." })
              ])
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted fw-bold", text: "Factura (opcional)" }),
              Dom.el("select", { id: "cp-factura", className: "form-select" }, [
                Dom.el("option", { value: "", text: "-- Sin factura --" })
              ]),
              Dom.el("div", { className: "form-text", text: "Vinculá el pago a una factura para reflejarlo en la cuenta corriente." })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted fw-bold", text: "Observaciones" }),
              Dom.el("textarea", { id: "cp-obs", className: "form-control", rows: "2" })
            ])
          ]),
          Dom.el("div", { className: "modal-footer" }, [
            Dom.el("button", { type: "button", className: "btn btn-secondary btn-sm", dataset: { bsDismiss: "modal" }, text: "Cancelar" }),
            Dom.el("button", { type: "button", className: "btn btn-primary btn-sm", id: "cp-save", text: "Guardar" })
          ])
        ])
      )
    );

    document.body.appendChild(modalEl);

    const medioSelect = document.getElementById("cp-medio");
    if (medioSelect) {
      state.getPaymentMethods().forEach((method) => {
        const opt = document.createElement("option");
        opt.value = method;
        opt.textContent = method;
        medioSelect.appendChild(opt);
      });
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const facturaSelect = document.getElementById("cp-factura");
    const help = modalEl.querySelector(".form-text");
    global.ClientAccountPanelData.fetchPendingInvoices(idCliente)
      .then((items) => {
        if (!facturaSelect) return;
        if (help) {
          help.textContent = items.length
            ? (`Facturas pendientes encontradas: ${items.length}.`)
            : "No hay facturas pendientes para vincular. Podés registrar el pago sin factura.";
        }
        items.forEach((inv) => {
          const opt = document.createElement("option");
          opt.value = inv.id || "";
          const fechaStr = inv.fecha ? Formatters.formatDateDisplay(inv.fecha) : "";
          const pendiente = inv.saldo != null ? Number(inv.saldo) : null;
          const pendienteStr = (pendiente != null && !isNaN(pendiente) && pendiente > 0)
            ? `Pendiente ${Formatters.formatCurrency(pendiente)}`
            : "";
          const labelParts = [
            inv.comprobante || "Factura",
            inv.numero || "S/N",
            inv.periodo || "",
            fechaStr,
            pendienteStr
          ].filter(Boolean);
          opt.textContent = labelParts.join(" - ");
          opt.dataset.numero = inv.numero || "";
          facturaSelect.appendChild(opt);
        });
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error cargando facturas pendientes", err);
        } else {
          console.error("No se pudieron cargar facturas del cliente:", err);
        }
        if (help) {
          help.textContent = "Error cargando facturas pendientes.";
        }
      });

    const saveBtn = document.getElementById("cp-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        const fecha = document.getElementById("cp-fecha")?.value || "";
        const monto = document.getElementById("cp-monto")?.value || "";
        const obs = document.getElementById("cp-obs")?.value || "";
        const medioPago = document.getElementById("cp-medio")?.value || "";
        const facturaSelect = document.getElementById("cp-factura");
        const facturaId = facturaSelect ? facturaSelect.value : "";
        const facturaNumero = facturaSelect && facturaSelect.selectedOptions[0]
          ? (facturaSelect.selectedOptions[0].dataset.numero || "")
          : "";

        if (!monto) {
          Alerts && Alerts.showAlert("Ingresá un monto", "warning");
          return;
        }

        UiState && UiState.setGlobalLoading(true, "Guardando pago...");
        global.ClientAccountPanelData.recordPayment({
          fecha: fecha,
          cliente: clientLabel,
          idCliente: idCliente,
          monto: monto,
          detalle: obs,
          medioPago: medioPago,
          idFactura: facturaId || "",
          facturaNumero: facturaNumero
        })
          .then(() => {
            Alerts && Alerts.showAlert("Pago registrado", "success");
            modal.hide();
            modalEl.remove();
            handleSearch();
          })
          .catch((err) => {
            if (Alerts && typeof Alerts.showError === "function") {
              Alerts.showError("Error al guardar pago", err);
            } else {
              Alerts && Alerts.showAlert("Error al guardar pago", "danger");
            }
          })
          .finally(() => UiState && UiState.setGlobalLoading(false));
      });
    }

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());
  }

  global.ClientAccountPanelHandlers = {
    init: init,
    attachEvents: attachEvents,
    handleSearch: handleSearch,
    handleReferenceUpdate: handleReferenceUpdate
  };
})(typeof window !== "undefined" ? window : this);
