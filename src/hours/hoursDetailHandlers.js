/**
 * HoursDetailPanelHandlers
 * Eventos del panel de detalle de horas.
 */
(function (global) {
  const state = global.HoursDetailPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function ensureDeps() {
    return state && global.HoursDetailPanelRender && global.HoursDetailPanelData;
  }

  function setDefaultDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startInput = document.getElementById("hours-filter-start");
    const endInput = document.getElementById("hours-filter-end");
    if (startInput) startInput.valueAsDate = firstDay;
    if (endInput) endInput.valueAsDate = lastDay;
  }

  function init() {
    if (!ensureDeps()) return;
    setDefaultDates();
    global.HoursDetailPanelData.loadEmployees().then((employees) => {
      global.HoursDetailPanelRender.renderEmployees(employees || []);
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

    on(document.getElementById("btn-search-hours"), "click", handleSearch);
    on(document.getElementById("btn-export-pdf"), "click", handleExportPdf);

    const tbody = document.getElementById("hours-table-body");
    on(tbody, "click", handleTableClick);
  }

  function handleSearch() {
    if (!ensureDeps()) return;
    const start = document.getElementById("hours-filter-start")?.value || "";
    const end = document.getElementById("hours-filter-end")?.value || "";
    const employeeRaw = document.getElementById("hours-filter-employee")?.value || "";
    const idEmpleado = state.getEmployeeIdFromLabel(employeeRaw);

    if (!employeeRaw) {
      Alerts && Alerts.showAlert("Por favor seleccione un empleado", "warning");
      return;
    }
    if (!idEmpleado) {
      Alerts && Alerts.showAlert("Seleccioná un empleado válido de la lista", "warning");
      return;
    }

    state.lastFilters = { start, end, employeeRaw, idEmpleado };

    global.HoursDetailPanelRender.setLoading(true);
    const summaryBox = document.getElementById("hours-summary");
    if (summaryBox) summaryBox.classList.add("d-none");

    global.HoursDetailPanelData.fetchHoursByEmployee(start, end, employeeRaw, idEmpleado)
      .then((result) => {
        const rows = result && result.rows ? result.rows : [];
        const summary = result && result.summary ? result.summary : null;
        state.lastResults = rows;
        state.lastSummary = summary;
        global.HoursDetailPanelRender.renderTable(rows || [], summary);
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al cargar horas", err);
        } else {
          console.error(err);
          Alerts && Alerts.showAlert("Error al cargar horas", "danger");
        }
      })
      .finally(() => {
        global.HoursDetailPanelRender.setLoading(false);
      });
  }

  function handleExportPdf() {
    if (!ensureDeps()) return;
    const start = document.getElementById("hours-filter-start")?.value || "";
    const end = document.getElementById("hours-filter-end")?.value || "";
    const employee = document.getElementById("hours-filter-employee")?.value || "";
    const idEmpleado = state.getEmployeeIdFromLabel(employee);

    if (!employee) {
      Alerts && Alerts.showAlert("Selecciona un empleado para exportar", "warning");
      return;
    }
    if (!idEmpleado) {
      Alerts && Alerts.showAlert("Seleccioná un empleado válido de la lista", "warning");
      return;
    }

    const btn = document.getElementById("btn-export-pdf");
    const ui = global.UIHelpers;
      if (btn && ui && typeof ui.withSpinner === "function") {
        ui.withSpinner(btn, true, "Descargando...");
      }

    UiState && UiState.setGlobalLoading(true, "Generando PDF...");
    global.HoursDetailPanelData.generatePdf(start, end, employee, idEmpleado)
      .then((res) => {
        if (!res || !res.base64) throw new Error("No se pudo generar PDF");
        const link = document.createElement("a");
        link.href = "data:application/pdf;base64," + res.base64;
        link.download = res.filename || "reporte.pdf";
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

  function handleTableClick(event) {
    const editBtn = event.target.closest(".btn-edit-hour");
    if (editBtn) {
      const id = editBtn.dataset.id;
      const record = state.lastResults.find((r) => String(r.id) === String(id));
      if (record) openInlineEditModal(record);
      return;
    }
    const deleteBtn = event.target.closest(".btn-delete-hour");
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (id) deleteRecord(id);
    }
  }

  function deleteRecord(id) {
    const confirmPromise =
      typeof window !== "undefined" &&
      window.UiDialogs &&
      typeof window.UiDialogs.confirm === "function"
        ? window.UiDialogs.confirm({
            title: "Eliminar registro de horas",
            message: "¿Está seguro de eliminar este registro de horas?",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            confirmVariant: "danger",
            icon: "bi-trash3-fill",
            iconClass: "text-danger"
          })
        : Promise.resolve(confirm("¿Está seguro de eliminar este registro de horas?"));

    confirmPromise.then(function (confirmed) {
      if (!confirmed) return;

      UiState && UiState.setGlobalLoading(true, "Eliminando...");
      global.HoursDetailPanelData.deleteRecord(id)
        .then(() => {
          Alerts && Alerts.showAlert("Registro eliminado correctamente", "success");
          if (state.lastFilters) {
            handleSearch();
          }
        })
        .catch((err) => {
          if (Alerts && typeof Alerts.showError === "function") {
            Alerts.showError("Error al eliminar", err);
          } else {
            Alerts && Alerts.showAlert("Error al eliminar", "danger");
          }
        })
        .finally(() => {
          UiState && UiState.setGlobalLoading(false);
        });
    });
  }

  function openInlineEditModal(record) {
    const existing = document.getElementById("hours-edit-modal");
    if (existing) existing.remove();

    const modalEl = Dom.el("div", { className: "modal fade", id: "hours-edit-modal", tabIndex: "-1" },
      Dom.el("div", { className: "modal-dialog modal-dialog-centered" },
        Dom.el("div", { className: "modal-content" }, [
          Dom.el("div", { className: "modal-header" }, [
            Dom.el("h5", { className: "modal-title", text: "Editar asistencia" }),
            Dom.el("button", { type: "button", className: "btn-close", dataset: { bsDismiss: "modal" }, "aria-label": "Close" })
          ]),
          Dom.el("div", { className: "modal-body" }, [
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Empleado" }),
              Dom.el("input", { type: "text", className: "form-control", value: record.empleado || "", disabled: true })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Cliente" }),
              Dom.el("input", { type: "text", className: "form-control", value: record.cliente || "", disabled: true })
            ]),
            Dom.el("div", { className: "row g-3" }, [
              Dom.el("div", { className: "col-md-6" }, [
                Dom.el("label", { className: "form-label small text-muted", text: "Fecha" }),
                Dom.el("input", { type: "date", id: "hours-edit-fecha", className: "form-control", value: record.fecha || "" })
              ]),
              Dom.el("div", { className: "col-md-6" }, [
                Dom.el("label", { className: "form-label small text-muted", text: "Horas" }),
                Dom.el("input", { type: "number", step: "0.25", id: "hours-edit-horas", className: "form-control", value: record.horas || "" })
              ])
            ]),
            Dom.el("div", { className: "form-check form-switch mt-3" }, [
              Dom.el("input", { className: "form-check-input", type: "checkbox", id: "hours-edit-asistencia" }),
              Dom.el("label", { className: "form-check-label", text: "Asistencia", for: "hours-edit-asistencia" })
            ]),
            Dom.el("div", { className: "mt-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Observaciones" }),
              Dom.el("textarea", { id: "hours-edit-observaciones", className: "form-control", rows: "2" }, record.observaciones || "")
            ])
          ]),
          Dom.el("div", { className: "modal-footer" }, [
            Dom.el("button", { type: "button", className: "btn btn-secondary", dataset: { bsDismiss: "modal" }, text: "Cancelar" }),
            Dom.el("button", { type: "button", className: "btn btn-primary", id: "hours-edit-save", text: "Guardar" })
          ])
        ])
      )
    );

    document.body.appendChild(modalEl);

    const asistenciaInput = document.getElementById("hours-edit-asistencia");
    if (asistenciaInput) {
      asistenciaInput.checked = record.asistencia !== false;
    }

    const horasInput = document.getElementById("hours-edit-horas");
    if (horasInput && record.asistencia === false && record.horasPlan) {
      horasInput.value = record.horasPlan;
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const saveBtn = document.getElementById("hours-edit-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        const fecha = document.getElementById("hours-edit-fecha")?.value || "";
        const horas = document.getElementById("hours-edit-horas")?.value || "";
        const observaciones = document.getElementById("hours-edit-observaciones")?.value || "";
        const asistencia = document.getElementById("hours-edit-asistencia")?.checked ?? true;
        const horasToSave = asistencia ? horas : (horas || record.horasPlan || "");

        if (!fecha) {
          Alerts && Alerts.showAlert("Seleccione fecha.", "warning");
          return;
        }

        UiState && UiState.setGlobalLoading(true, "Guardando...");
        const payload = {
          EMPLEADO: record.empleado,
          CLIENTE: record.cliente,
          FECHA: fecha,
          ASISTENCIA: asistencia,
          HORAS: horasToSave,
          OBSERVACIONES: observaciones
        };

        global.HoursDetailPanelData.updateRecord(record.id, payload)
          .then(() => {
            Alerts && Alerts.showAlert("Registro actualizado.", "success");
            modal.hide();
            modalEl.remove();
            handleSearch();
          })
          .catch((err) => {
            if (Alerts && typeof Alerts.showError === "function") {
              Alerts.showError("Error al guardar", err);
            } else {
              Alerts && Alerts.showAlert("Error al guardar", "danger");
            }
          })
          .finally(() => {
            UiState && UiState.setGlobalLoading(false);
          });
      });
    }

    modalEl.addEventListener("hidden.bs.modal", () => {
      modalEl.remove();
    });
  }

  global.HoursDetailPanelHandlers = {
    init: init,
    attachEvents: attachEvents,
    handleSearch: handleSearch
  };
})(typeof window !== "undefined" ? window : this);
