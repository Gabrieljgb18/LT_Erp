/**
 * AccountStatementPanelHandlers
 */
(function (global) {
  const state = global.AccountStatementPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function ensureDeps() {
    return state && global.AccountStatementPanelData && global.AccountStatementPanelRender;
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

    on(document.getElementById("acc-refresh"), "click", loadData);
    on(document.getElementById("acc-new-payment"), "click", openPaymentModal);
  }

  function loadData() {
    if (!ensureDeps()) return;
    const monthInput = document.getElementById("acc-month");
    const val = monthInput ? monthInput.value : "";
    if (!val) return;
    const parts = val.split("-");
    const y = parts[0];
    const m = parts[1];

    global.AccountStatementPanelRender.toggleLoading(true);
    global.AccountStatementPanelData.fetchStatement(y, m)
      .then((rows) => {
        global.AccountStatementPanelRender.renderTable(rows || []);
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error cuenta corriente", err);
        } else {
          console.error(err);
          Alerts && Alerts.showAlert("Error cuenta corriente", "danger");
        }
      })
      .finally(() => global.AccountStatementPanelRender.toggleLoading(false));
  }

  function openPaymentModal() {
    if (!ensureDeps()) return;
    const existing = document.getElementById("acc-payment-modal");
    if (existing) existing.remove();

    const modalEl = Dom.el("div", { className: "modal fade", id: "acc-payment-modal", tabIndex: "-1" },
      Dom.el("div", { className: "modal-dialog" },
        Dom.el("div", { className: "modal-content" }, [
          Dom.el("div", { className: "modal-header" }, [
            Dom.el("h5", { className: "modal-title", text: "Registrar pago a empleado" }),
            Dom.el("button", { type: "button", className: "btn-close", dataset: { bsDismiss: "modal" }, "aria-label": "Close" })
          ]),
          Dom.el("div", { className: "modal-body" }, [
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Empleado" }),
              Dom.el("input", { list: "acc-emp-list", id: "acc-pay-emp", className: "form-control", placeholder: "Empleado" }),
              Dom.el("datalist", { id: "acc-emp-list" })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Fecha" }),
              Dom.el("input", { type: "date", id: "acc-pay-fecha", className: "form-control", value: getToday() })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Concepto" }),
              Dom.el("input", { type: "text", id: "acc-pay-concepto", className: "form-control", value: "Pago mensual" })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Monto" }),
              Dom.el("input", { type: "number", step: "0.01", id: "acc-pay-monto", className: "form-control" })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Medio de pago" }),
              Dom.el("select", { id: "acc-pay-medio", className: "form-select" }, [
                Dom.el("option", { value: "", text: "Seleccionar..." })
              ])
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Observaciones" }),
              Dom.el("textarea", { id: "acc-pay-obs", className: "form-control", rows: "2" })
            ])
          ]),
          Dom.el("div", { className: "modal-footer" }, [
            Dom.el("button", { type: "button", className: "btn btn-secondary", dataset: { bsDismiss: "modal" }, text: "Cancelar" }),
            Dom.el("button", { type: "button", className: "btn btn-primary", id: "acc-pay-save", text: "Guardar" })
          ])
        ])
      )
    );

    document.body.appendChild(modalEl);

    const medioSelect = document.getElementById("acc-pay-medio");
    if (medioSelect) {
      state.getPaymentMethods().forEach((method) => {
        const opt = document.createElement("option");
        opt.value = method;
        opt.textContent = method;
        medioSelect.appendChild(opt);
      });
    }

    global.AccountStatementPanelData.loadEmployees().then((emps) => {
      const datalist = document.getElementById("acc-emp-list");
      if (!datalist) return;
      datalist.innerHTML = "";
      const labels = state.setEmployeeMap ? state.setEmployeeMap(emps || []) : [];
      labels.forEach((label) => {
        if (!label) return;
        const opt = document.createElement("option");
        opt.value = label;
        datalist.appendChild(opt);
      });
    });

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const saveBtn = document.getElementById("acc-pay-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        const emp = document.getElementById("acc-pay-emp")?.value || "";
        const idEmpleado = state.getEmployeeIdFromLabel ? state.getEmployeeIdFromLabel(emp) : "";
        const fecha = document.getElementById("acc-pay-fecha")?.value || "";
        const concepto = document.getElementById("acc-pay-concepto")?.value || "";
        const monto = document.getElementById("acc-pay-monto")?.value || "";
        const medioPago = document.getElementById("acc-pay-medio")?.value || "";
        const obs = document.getElementById("acc-pay-obs")?.value || "";

        if (!emp || !monto) {
          Alerts && Alerts.showAlert("Empleado y monto son requeridos", "warning");
          return;
        }
        if (!idEmpleado) {
          Alerts && Alerts.showAlert("Seleccioná un empleado válido de la lista.", "warning");
          return;
        }

        UiState && UiState.setGlobalLoading(true, "Guardando pago...");
        global.AccountStatementPanelData.recordPayment({
          empleado: emp,
          idEmpleado: idEmpleado,
          fecha: fecha,
          concepto: concepto,
          monto: monto,
          medioPago: medioPago,
          observaciones: obs
        })
          .then(() => {
            Alerts && Alerts.showAlert("Pago registrado", "success");
            modal.hide();
            modalEl.remove();
            loadData();
          })
          .catch((err) => {
            if (Alerts && typeof Alerts.showError === "function") {
              Alerts.showError("Error al guardar pago", err);
            } else {
              Alerts && Alerts.showAlert("Error al guardar pago", "danger");
            }
          })
          .finally(() => {
            UiState && UiState.setGlobalLoading(false);
          });
      });
    }

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());
  }

  function getToday() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  global.AccountStatementPanelHandlers = {
    attachEvents: attachEvents,
    loadData: loadData,
    openPaymentModal: openPaymentModal
  };
})(typeof window !== "undefined" ? window : this);
