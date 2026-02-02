/**
 * InvoicePanelHandlers
 * Eventos y acciones del panel de facturacion.
 */
(function (global) {
  const state = global.InvoicePanelState;
  if (!state) {
    console.error("InvoicePanelState no disponible");
    return;
  }

  function attachEvents() {
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler, opts) => {
      if (!el) return;
      el.addEventListener(evt, handler, Object.assign({ signal: signal }, opts || {}));
    };

    const newBtn = document.getElementById("invoice-new-btn");
    on(newBtn, "click", () => openModal());

    const genSearchBtn = document.getElementById("invoice-gen-search");
    on(genSearchBtn, "click", searchClientHours);
    const genOpenModalBtn = document.getElementById("invoice-gen-open-modal");
    on(genOpenModalBtn, "click", openModalFromGenerator);

    const searchBtn = document.getElementById("invoice-search-btn");
    on(searchBtn, "click", handleSearch);

    const saveBtn = document.getElementById("invoice-save-btn");
    on(saveBtn, "click", handleSave);

    const dlLastBtn = document.getElementById("invoice-download-last-btn");
    on(dlLastBtn, "click", () => {
      if (state.lastSavedInvoiceId) downloadPdf(state.lastSavedInvoiceId);
    });
    const dlSelectedBtn = document.getElementById("invoice-download-selected");
    on(dlSelectedBtn, "click", downloadSelectedPdfs);
    const selectAll = document.getElementById("invoice-select-all");
    on(selectAll, "change", (e) => toggleSelectAll(e.target.checked));

    const horasInput = document.getElementById("invoice-horas");
    const valorHoraInput = document.getElementById("invoice-valor-hora");
    on(horasInput, "input", recalculateTotals);
    on(valorHoraInput, "input", recalculateTotals);

    const razonSocialInput = document.getElementById("invoice-razon-social");
    if (razonSocialInput) {
      on(razonSocialInput, "change", autocompleteCUIT);
    }

    const cuitInput = document.getElementById("invoice-cuit");
    if (cuitInput) {
      cuitInput.inputMode = "numeric";
      if (typeof InputUtils !== "undefined" && InputUtils && typeof InputUtils.formatDocNumber === "function") {
        const applyMask = () => {
          cuitInput.value = InputUtils.formatDocNumber(cuitInput.value, "CUIT");
        };
        if (!cuitInput.dataset.maskDoc) {
          cuitInput.dataset.maskDoc = "1";
          on(cuitInput, "input", applyMask);
          on(cuitInput, "blur", applyMask);
        }
        applyMask();
      }
      if (typeof InputUtils !== "undefined" && InputUtils && typeof InputUtils.docPlaceholder === "function") {
        const ph = InputUtils.docPlaceholder("CUIT");
        if (ph) cuitInput.placeholder = ph;
      }
    }

    const covSearchBtn = document.getElementById("invoice-cov-search");
    on(covSearchBtn, "click", () => {
      if (global.InvoicePanelData) {
        global.InvoicePanelData.handleCoverageSearch();
      }
    });
    const covPeriod = document.getElementById("invoice-cov-period");
    on(covPeriod, "change", () => {
      if (state.coverageRows && state.coverageRows.length && global.InvoicePanelData) {
        global.InvoicePanelData.handleCoverageSearch();
      }
    });
    const covTbody = document.getElementById("invoice-cov-tbody");
    if (covTbody) {
      on(covTbody, "click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".invoice-cov-generate") : null;
        if (!btn) return;
        const idCliente = btn.dataset ? btn.dataset.idCliente || "" : "";
        const cliente = btn.dataset ? btn.dataset.cliente || "" : "";
        const period = btn.dataset ? btn.dataset.period || "" : "";
        generateCoverageInvoice(idCliente, cliente, period);
      });
    }
  }

  function getFilters() {
    const clientRaw = document.getElementById("invoice-filter-client")?.value || "";
    const idCliente = global.InvoicePanelData ? global.InvoicePanelData.getClientIdFromLabel(clientRaw) : "";
    return {
      cliente: clientRaw,
      idCliente: idCliente,
      periodo: document.getElementById("invoice-filter-period")?.value || "",
      estado: document.getElementById("invoice-filter-status")?.value || "",
      fechaDesde: document.getElementById("invoice-filter-from")?.value || "",
      fechaHasta: document.getElementById("invoice-filter-to")?.value || ""
    };
  }

  function handleSearch() {
    const filters = getFilters();
    if (filters.cliente && !filters.idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    if (global.InvoicePanelData) {
      global.InvoicePanelData.handleSearch(filters);
    }
  }

  function openModal(invoiceData) {
    const modal = new bootstrap.Modal(document.getElementById("invoice-modal"));
    const title = document.getElementById("invoice-modal-title");
    const form = document.getElementById("invoice-form");

    if (title) title.textContent = invoiceData ? "Editar Factura" : "Nueva Factura";
    if (form) form.reset();

    if (invoiceData) {
      document.getElementById("invoice-id").value = invoiceData.ID || "";
      const idCliente = invoiceData["ID_CLIENTE"] || "";
      const clienteLabel = global.InvoicePanelData ? global.InvoicePanelData.getClientLabelById(idCliente) : "";
      document.getElementById("invoice-id-cliente").value = idCliente;
      document.getElementById("invoice-fecha").value = invoiceData["FECHA"] || "";
      document.getElementById("invoice-periodo").value = invoiceData["PERIODO"] || "";
      const compSelect = document.getElementById("invoice-comprobante");
      if (compSelect && global.InvoicePanelRender) {
        global.InvoicePanelRender.ensureSelectOption(compSelect, invoiceData["COMPROBANTE"]);
        compSelect.value = invoiceData["COMPROBANTE"] || "Factura B";
      }
      document.getElementById("invoice-numero").value = invoiceData["NUMERO"] || "";
      document.getElementById("invoice-razon-social").value = clienteLabel || invoiceData["RAZÓN SOCIAL"] || "";
      document.getElementById("invoice-cuit").value = invoiceData["CUIT"] || "";
      document.getElementById("invoice-concepto").value = invoiceData["CONCEPTO"] || "";
      document.getElementById("invoice-horas").value = invoiceData["HORAS"] || "";
      document.getElementById("invoice-valor-hora").value = invoiceData["VALOR HORA"] || "";
      document.getElementById("invoice-importe").value = invoiceData["IMPORTE"] || "";
      document.getElementById("invoice-subtotal").value = invoiceData["SUBTOTAL"] || "";
      document.getElementById("invoice-total").value = invoiceData["TOTAL"] || "";
      const estadoSelect = document.getElementById("invoice-estado");
      if (estadoSelect && global.InvoicePanelRender) {
        global.InvoicePanelRender.ensureSelectOption(estadoSelect, invoiceData["ESTADO"]);
        estadoSelect.value = invoiceData["ESTADO"] || "Pendiente";
      }
      document.getElementById("invoice-observaciones").value = invoiceData["OBSERVACIONES"] || "";
    } else {
      const today = new Date().toISOString().split("T")[0];
      document.getElementById("invoice-fecha").value = today;
      const estadoSelect = document.getElementById("invoice-estado");
      if (estadoSelect) estadoSelect.value = "Pendiente";
    }

    autocompleteCUIT();
    if (!invoiceData || !invoiceData.ID) {
      recalculateTotals();
    }
    modal.show();
  }

  function recalculateTotals() {
    const horasInput = document.getElementById("invoice-horas");
    const valorHoraInput = document.getElementById("invoice-valor-hora");
    const importeInput = document.getElementById("invoice-importe");
    const subtotalInput = document.getElementById("invoice-subtotal");
    const totalInput = document.getElementById("invoice-total");
    if (!horasInput || !valorHoraInput) return;

    const horas = Number(horasInput.value) || 0;
    const valorHora = Number(valorHoraInput.value) || 0;
    const subtotal = horas * valorHora;
    const subtotalFixed = (isNaN(subtotal) ? 0 : subtotal).toFixed(2);
    const totalFixed = (subtotal * (1 + state.ivaPct)).toFixed(2);

    if (importeInput) importeInput.value = subtotalFixed;
    if (subtotalInput) subtotalInput.value = subtotalFixed;
    if (totalInput) totalInput.value = totalFixed;
  }

  function handleSave() {
    const form = document.getElementById("invoice-form");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const id = document.getElementById("invoice-id").value;
    const idCliente = document.getElementById("invoice-id-cliente").value;
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    const razonRaw = document.getElementById("invoice-razon-social").value;
    const razonSocial = global.InvoicePanelData ? global.InvoicePanelData.cleanClientValue(razonRaw) || razonRaw : razonRaw;

    const data = {
      ID_CLIENTE: idCliente || "",
      FECHA: document.getElementById("invoice-fecha").value,
      PERIODO: document.getElementById("invoice-periodo").value,
      COMPROBANTE: document.getElementById("invoice-comprobante").value,
      NUMERO: document.getElementById("invoice-numero").value,
      "RAZÓN SOCIAL": razonSocial,
      CUIT: document.getElementById("invoice-cuit").value,
      CONCEPTO: document.getElementById("invoice-concepto").value,
      HORAS: document.getElementById("invoice-horas").value,
      "VALOR HORA": document.getElementById("invoice-valor-hora").value,
      IMPORTE: document.getElementById("invoice-importe").value,
      SUBTOTAL: document.getElementById("invoice-subtotal").value,
      TOTAL: document.getElementById("invoice-total").value,
      ESTADO: document.getElementById("invoice-estado").value,
      OBSERVACIONES: document.getElementById("invoice-observaciones").value
    };

    const saveBtn = document.getElementById("invoice-save-btn");
    const ui = global.UIHelpers;
    if (saveBtn) {
      if (ui && typeof ui.withSpinner === "function") {
        ui.withSpinner(saveBtn, true, "Guardando...");
      } else {
        saveBtn.disabled = true;
      }
    }

    const request = id
      ? InvoiceService.updateInvoice(id, data)
      : InvoiceService.createInvoice(data);

    request
      .then((res) => {
        const newId = res && (res.id || res);
        const isUpdate = !!id;

        bootstrap.Modal.getInstance(document.getElementById("invoice-modal")).hide();
        state.invoicePage = 1;

        if (global.InvoicePanelData) {
          global.InvoicePanelData.refreshGeneratorList();
        }

        if (newId) {
          state.lastSavedInvoiceId = String(newId);
          if (global.InvoicePanelRender) {
            global.InvoicePanelRender.updateSelectionUi();
          }
        }

        // Si es creación, ofrecer descarga
        if (!isUpdate && newId) {
          const confirmMsg = `Factura guardada correctamente.\n\n¿Querés descargar el PDF ahora?`;
          const confirmDownload = (window.UiDialogs && typeof window.UiDialogs.confirm === "function")
            ? window.UiDialogs.confirm({
              title: "Factura Guardada",
              message: confirmMsg,
              confirmText: "Descargar",
              cancelText: "Cerrar",
              confirmVariant: "success",
              icon: "bi-check-circle-fill",
              iconClass: "text-success"
            })
            : Promise.resolve(confirm(confirmMsg));

          confirmDownload.then((confirmed) => {
            if (confirmed) {
              downloadPdf(String(newId));
            }
          });
        } else {
          Alerts && Alerts.showAlert("Factura actualizada exitosamente", "success");
        }
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al guardar factura", err);
        } else {
          console.error("Error al guardar factura:", err);
          Alerts && Alerts.showAlert("Error al guardar factura", "danger");
        }
      })
      .finally(() => {
        if (saveBtn && ui && typeof ui.withSpinner === "function") {
          ui.withSpinner(saveBtn, false);
        } else if (saveBtn) {
          saveBtn.disabled = false;
        }
      });
  }

  function autocompleteCUIT() {
    const razonSocialInput = document.getElementById("invoice-razon-social");
    const cuitInput = document.getElementById("invoice-cuit");
    const idClienteInput = document.getElementById("invoice-id-cliente");

    if (!razonSocialInput || !cuitInput) return;

    const selectedClient = razonSocialInput.value;
    const cliente = global.InvoicePanelData && typeof global.InvoicePanelData.getClientByLabel === "function"
      ? global.InvoicePanelData.getClientByLabel(selectedClient)
      : null;

    if (cliente) {
      const docType = (cliente.docType || cliente["TIPO DOCUMENTO"] || "").toString().trim().toUpperCase();
      const docNumber = cliente.docNumber || cliente["NUMERO DOCUMENTO"] || cliente.cuit || "";
      const shouldFill = docType === "CUIT" || docType === "CUIL" || !!cliente.cuit;
      if (shouldFill && docNumber) {
        if (typeof InputUtils !== "undefined" && InputUtils && typeof InputUtils.formatDocNumber === "function") {
          cuitInput.value = InputUtils.formatDocNumber(docNumber, docType || "CUIT");
        } else {
          cuitInput.value = docNumber;
        }
      } else {
        cuitInput.value = "";
      }
      if (cliente.id && idClienteInput) {
        idClienteInput.value = cliente.id;
      }
    }
  }

  function searchClientHours() {
    const clientInput = document.getElementById("invoice-gen-client");
    const clienteRaw = clientInput ? clientInput.value.trim() : "";
    if (!clienteRaw) {
      Alerts && Alerts.showAlert("Elegí un cliente para buscar.", "warning");
      return;
    }
    const idCliente = global.InvoicePanelData ? global.InvoicePanelData.getClientIdFromLabel(clienteRaw) : "";
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    const desde = document.getElementById("invoice-gen-desde")?.value || "";
    const hasta = document.getElementById("invoice-gen-hasta")?.value || "";

    state.lastGeneratorFilters = {
      cliente: clienteRaw,
      clienteLabel: clienteRaw,
      idCliente: idCliente,
      fechaDesde: desde,
      fechaHasta: hasta
    };
    if (global.InvoicePanelData) {
      global.InvoicePanelData.fetchGeneratorHours();
    }
  }

  function openModalFromGenerator() {
    const clientInput = document.getElementById("invoice-gen-client");
    const cliente = clientInput ? clientInput.value.trim() : "";
    if (!cliente) {
      Alerts && Alerts.showAlert("Elegí un cliente para facturar.", "warning");
      return;
    }
    const idCliente = global.InvoicePanelData ? global.InvoicePanelData.getClientIdFromLabel(cliente) : "";
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    const desde = document.getElementById("invoice-gen-desde")?.value || "";
    const hasta = document.getElementById("invoice-gen-hasta")?.value || "";

    const preset = buildPresetFromHours(cliente, desde, hasta);
    openModal(preset);
  }

  function buildPresetFromHours(clienteRaw, desde, hasta) {
    const cliente = global.InvoicePanelData ? global.InvoicePanelData.cleanClientValue(clienteRaw) : clienteRaw;
    const preset = {
      "RAZÓN SOCIAL": cliente || clienteRaw,
      FECHA: new Date().toISOString().slice(0, 10),
      OBSERVACIONES: (desde || hasta) ? `Período: ${desde || "s/d"} a ${hasta || "s/h"}` : ""
    };

    if (state.generatorHours && state.generatorHours.length > 0) {
      const totalHoras = state.generatorHours.reduce((acc, r) => acc + (Number(r.horas) || 0), 0);
      preset.HORAS = totalHoras || "";
      preset.CONCEPTO = `Servicios ${cliente} (${desde || ""} a ${hasta || ""})`;
      const idCli = global.InvoicePanelData ? global.InvoicePanelData.getClientIdFromLabel(clienteRaw) : "";
      if (idCli) {
        preset.ID_CLIENTE = idCli;
      }
    }
    if (desde) {
      preset.PERIODO = desde.slice(0, 7);
    }
    return preset;
  }

  function prefillFromHours(fecha, empleado, horas) {
    const clienteRaw = document.getElementById("invoice-gen-client")?.value || "";
    const cliente = global.InvoicePanelData ? global.InvoicePanelData.cleanClientValue(clienteRaw) : clienteRaw;
    const desde = document.getElementById("invoice-gen-desde")?.value || "";
    const hasta = document.getElementById("invoice-gen-hasta")?.value || "";
    const preset = buildPresetFromHours(clienteRaw || cliente, desde, hasta);
    preset.FECHA = fecha || preset.FECHA;
    preset.CONCEPTO = `Servicios ${cliente} - ${empleado || ""} ${fecha || ""}`;
    if (horas) preset.HORAS = horas;
    openModal(preset);
  }

  function openFromAttendanceModal() {
    const modalEl = document.getElementById("invoice-att-modal");
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);

    const hoy = new Date();
    const first = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
    const last = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
    const desde = document.getElementById("invoice-att-desde");
    const hasta = document.getElementById("invoice-att-hasta");
    if (desde && !desde.value) desde.value = first;
    if (hasta && !hasta.value) hasta.value = last;

    modal.show();

    const saveBtn = document.getElementById("invoice-att-save");
    if (saveBtn && !saveBtn._bound) {
      saveBtn._bound = true;
      saveBtn.addEventListener("click", handleFromAttendanceSave);
    }
  }

  function handleFromAttendanceSave() {
    const clienteInput = document.getElementById("invoice-att-cliente");
    const desdeInput = document.getElementById("invoice-att-desde");
    const hastaInput = document.getElementById("invoice-att-hasta");
    const compInput = document.getElementById("invoice-att-comp");
    const numInput = document.getElementById("invoice-att-numero");
    const obsInput = document.getElementById("invoice-att-obs");

    const clienteRaw = clienteInput ? clienteInput.value.trim() : "";
    const idCliente = global.InvoicePanelData ? global.InvoicePanelData.getClientIdFromLabel(clienteRaw) : "";
    if (!clienteRaw) {
      Alerts && Alerts.showAlert("Elegí un cliente", "warning");
      return;
    }
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }

    const fechaDesde = desdeInput && desdeInput.value ? desdeInput.value : "";
    const fechaHasta = hastaInput && hastaInput.value ? hastaInput.value : "";

    UiState && UiState.setGlobalLoading(true, "Generando factura desde asistencia...");
    InvoiceService.createInvoiceFromAttendance(clienteRaw, fechaDesde, fechaHasta, {
      comprobante: compInput ? compInput.value : "",
      numero: numInput ? numInput.value : "",
      observaciones: obsInput ? obsInput.value : ""
    }, idCliente)
      .then(() => {
        Alerts && Alerts.showAlert("Factura generada desde asistencia.", "success");
        const modalEl = document.getElementById("invoice-att-modal");
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }
        handleSearch();
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al generar factura", err);
        } else {
          Alerts && Alerts.showAlert("Error al generar factura", "danger");
        }
      })
      .finally(() => {
        UiState && UiState.setGlobalLoading(false);
      });
  }

  function generateFromGenerator() {
    const clientInput = document.getElementById("invoice-gen-client");
    const desdeInput = document.getElementById("invoice-gen-desde");
    const hastaInput = document.getElementById("invoice-gen-hasta");

    const clienteRaw = clientInput ? clientInput.value.trim() : "";
    const idCliente = global.InvoicePanelData ? global.InvoicePanelData.getClientIdFromLabel(clienteRaw) : "";
    const fechaDesde = desdeInput && desdeInput.value ? desdeInput.value : "";
    const fechaHasta = hastaInput && hastaInput.value ? hastaInput.value : "";

    if (!clienteRaw) {
      Alerts && Alerts.showAlert("Elegí un cliente antes de generar.", "warning");
      return;
    }
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    if (!fechaDesde || !fechaHasta) {
      Alerts && Alerts.showAlert("Indicá fechas Desde y Hasta para generar la factura.", "warning");
      return;
    }

    UiState && UiState.setGlobalLoading(true, "Generando factura con filtros...");
    InvoiceService.createInvoiceFromAttendance(clienteRaw, fechaDesde, fechaHasta, {}, idCliente)
      .then(() => {
        Alerts && Alerts.showAlert("Factura generada.", "success");
        handleSearch();
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al generar factura", err);
        } else {
          Alerts && Alerts.showAlert("Error al generar factura", "danger");
        }
      })
      .finally(() => UiState && UiState.setGlobalLoading(false));
  }

  function editInvoice(id) {
    InvoiceService.getInvoiceById(id)
      .then((invoice) => {
        if (invoice) {
          openModal(invoice);
        }
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al cargar factura", err);
        } else {
          console.error("Error al cargar factura:", err);
          Alerts && Alerts.showAlert("Error al cargar factura", "danger");
        }
      });
  }

  function deleteInvoice(id, skipRefreshMain) {
    const confirmPromise =
      typeof window !== "undefined" &&
        window.UiDialogs &&
        typeof window.UiDialogs.confirm === "function"
        ? window.UiDialogs.confirm({
          title: "Anular factura",
          message: "¿Estás seguro de que querés anular esta factura?",
          confirmText: "Anular",
          cancelText: "Cancelar",
          confirmVariant: "danger",
          icon: "bi-x-octagon-fill",
          iconClass: "text-danger"
        })
        : Promise.resolve(confirm("¿Estás seguro de que querés anular esta factura?"));

    confirmPromise.then(function (confirmed) {
      if (!confirmed) return;

      InvoiceService.deleteInvoice(id)
        .then(() => {
          Alerts && Alerts.showAlert("Factura anulada exitosamente", "success");
          if (!skipRefreshMain) {
            handleSearch();
          }
          if (global.InvoicePanelData) {
            global.InvoicePanelData.refreshGeneratorList();
          }
        })
        .catch((err) => {
          if (Alerts && typeof Alerts.showError === "function") {
            Alerts.showError("Error al anular factura", err);
          } else {
            console.error("Error al anular factura:", err);
            Alerts && Alerts.showAlert("Error al anular factura", "danger");
          }
        });
    });
  }

  function generateCoverageInvoice(idCliente, cliente, period) {
    const p = String(period || "").trim();
    const range = global.InvoicePanelData ? global.InvoicePanelData.monthRangeFromPeriod(p) : { start: "", end: "" };
    if (!range.start || !range.end) {
      Alerts && Alerts.showAlert("Período inválido para generar.", "warning");
      return;
    }
    const cli = String(cliente || "").trim();
    const id = String(idCliente || "").trim();

    const Dom = global.DomHelpers;

    (window.UiDialogs && typeof window.UiDialogs.prompt === "function")
      ? window.UiDialogs.prompt({
        title: "Número de Factura",
        message: `Ingresá el número para la factura de ${cli}:`,
        placeholder: "0000-00000000",
        onAction: async (numFactura) => {
          if (!numFactura) throw new Error("Debes ingresar un número de factura.");

          UiState && UiState.setGlobalLoading(true, "Generando factura y preparando PDF...");
          try {
            const res = await InvoiceService.createInvoiceFromAttendance(
              cli || { cliente: cli, idCliente: id },
              range.start,
              range.end,
              {
                numero: numFactura,
                observaciones: `Período: ${range.start} a ${range.end}`
              },
              id || ""
            );

            const newId = res && (res.id || (res.record && res.record.ID));
            if (!newId) throw new Error("No se pudo obtener el ID de la factura.");

            state.lastSavedInvoiceId = String(newId);
            if (global.InvoicePanelData) {
              global.InvoicePanelData.handleCoverageSearch();
            }

            return {
              success: true,
              render: (container) => {
                container.appendChild(Dom.el("div", { className: "text-center py-2" }, [
                  Dom.el("div", { className: "text-success mb-2" }, [
                    Dom.el("i", { className: "bi bi-check-circle-fill fs-2" })
                  ]),
                  Dom.el("div", { className: "fw-bold mb-3", text: "¡Factura generada!" }),
                  Dom.el("button", {
                    className: "btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2",
                    onClick: () => downloadPdf(String(newId))
                  }, [
                    Dom.el("i", { className: "bi bi-file-earmark-pdf-fill" }),
                    Dom.text("Descargar PDF")
                  ])
                ]));
              }
            };
          } catch (err) {
            if (Alerts && typeof Alerts.showError === "function") {
              Alerts.showError("Error generando factura", err);
            } else {
              console.error("Error generando factura (cobertura):", err);
              Alerts && Alerts.showAlert("Error generando factura", "danger");
            }
            throw err; // Re-throw to indicate failure to the dialog
          } finally {
            UiState && UiState.setGlobalLoading(false);
          }
        }
      })
      : Promise.resolve(null);
  }

  function editAttendance(id) {
    const row = state.generatorHours.find((r) => String(r.id) === String(id));
    if (!row) {
      Alerts && Alerts.showAlert("Registro no encontrado.", "warning");
      return;
    }
    const newHoras = prompt("Horas trabajadas", row.horas || "");
    if (newHoras === null) return;
    const newObs = prompt("Observaciones", row.observaciones || "");
    const payload = {
      HORAS: Number(newHoras) || 0,
      OBSERVACIONES: newObs || "",
      ASISTENCIA: true,
      CLIENTE: row.cliente || "",
      ID_CLIENTE: row.idCliente || "",
      EMPLEADO: row.empleado || "",
      FECHA: row.fecha
    };
    UiState && UiState.setGlobalLoading(true, "Guardando asistencia...");
    AttendanceService.updateAttendanceRecord(id, payload)
      .then(() => {
        Alerts && Alerts.showAlert("Registro actualizado.", "success");
        if (global.InvoicePanelData) {
          global.InvoicePanelData.refreshGeneratorList();
        }
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al actualizar", err);
        } else {
          console.error(err);
          Alerts && Alerts.showAlert("Error al actualizar", "danger");
        }
      })
      .finally(() => UiState && UiState.setGlobalLoading(false));
  }

  function deleteAttendance(id) {
    const confirmPromise =
      typeof window !== "undefined" &&
        window.UiDialogs &&
        typeof window.UiDialogs.confirm === "function"
        ? window.UiDialogs.confirm({
          title: "Eliminar asistencia",
          message: "¿Eliminar este registro de asistencia?",
          confirmText: "Eliminar",
          cancelText: "Cancelar",
          confirmVariant: "danger",
          icon: "bi-trash3-fill",
          iconClass: "text-danger"
        })
        : Promise.resolve(confirm("¿Eliminar este registro de asistencia?"));

    confirmPromise.then(function (confirmed) {
      if (!confirmed) return;

      UiState && UiState.setGlobalLoading(true, "Eliminando asistencia...");
      AttendanceService.deleteAttendanceRecord(id)
        .then(() => {
          Alerts && Alerts.showAlert("Registro eliminado.", "success");
          if (global.InvoicePanelData) {
            global.InvoicePanelData.refreshGeneratorList();
          }
        })
        .catch((err) => {
          if (Alerts && typeof Alerts.showError === "function") {
            Alerts.showError("Error al eliminar", err);
          } else {
            console.error(err);
            Alerts && Alerts.showAlert("Error al eliminar", "danger");
          }
        })
        .finally(() => UiState && UiState.setGlobalLoading(false));
    });
  }

  function downloadPdf(id) {
    if (!id) return;
    UiState && UiState.setGlobalLoading(true, "Generando PDF...");
    InvoiceService.generateInvoicePdf(id)
      .then((res) => {
        if (!res || !res.base64) {
          Alerts && Alerts.showAlert("No se pudo generar el PDF.", "warning");
          return;
        }
        const link = document.createElement("a");
        link.href = "data:application/pdf;base64," + res.base64;
        link.download = res.filename || "factura.pdf";
        link.click();
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al generar PDF", err);
        } else {
          console.error("Error al generar PDF:", err);
          Alerts && Alerts.showAlert("Error al generar PDF", "danger");
        }
      })
      .finally(() => UiState && UiState.setGlobalLoading(false));
  }

  function setInvoicePage(page) {
    state.invoicePage = Math.max(1, page);
    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.renderTable(state.lastInvoices);
    }
  }

  function setGeneratorPage(page) {
    state.generatorPage = Math.max(1, page);
    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.renderGeneratorResults(state.generatorHours);
    }
  }

  function toggleInvoiceSelection(id, checked) {
    const key = String(id);
    if (checked) {
      state.selectedInvoiceIds.add(key);
    } else {
      state.selectedInvoiceIds.delete(key);
    }
    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.updateSelectionUi();
    }
  }

  function toggleSelectAll(checked) {
    const checkboxes = document.querySelectorAll(".invoice-select");
    checkboxes.forEach((cb) => {
      cb.checked = checked;
      const id = cb.getAttribute("data-id");
      if (checked) {
        state.selectedInvoiceIds.add(String(id));
      } else {
        state.selectedInvoiceIds.delete(String(id));
      }
    });
    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.updateSelectionUi();
    }
  }

  function downloadSelectedPdfs() {
    if (state.selectedInvoiceIds.size === 0) return;
    const ids = Array.from(state.selectedInvoiceIds);
    const btn = document.getElementById("invoice-download-selected");
    const ui = global.UIHelpers;
    if (btn && ui && typeof ui.withSpinner === "function") {
      ui.withSpinner(btn, true, "Descargando...");
    }
    const task = (async () => {
      for (const id of ids) {
        try {
          const res = await InvoiceService.generateInvoicePdf(id);
          if (!res || !res.base64) continue;
          const link = document.createElement("a");
          link.href = "data:application/pdf;base64," + res.base64;
          link.download = res.filename || `factura_${id}.pdf`;
          link.click();
        } catch (err) {
          console.error("PDF error", err);
        }
      }
    })();
    task.finally(() => {
      if (btn && ui && typeof ui.withSpinner === "function") {
        ui.withSpinner(btn, false);
      }
      if (global.InvoicePanelRender && typeof global.InvoicePanelRender.updateSelectionUi === "function") {
        global.InvoicePanelRender.updateSelectionUi();
      }
    });
  }

  global.InvoicePanelHandlers = {
    attachEvents: attachEvents,
    getFilters: getFilters,
    handleSearch: handleSearch,
    openModal: openModal,
    recalculateTotals: recalculateTotals,
    handleSave: handleSave,
    autocompleteCUIT: autocompleteCUIT,
    searchClientHours: searchClientHours,
    openModalFromGenerator: openModalFromGenerator,
    buildPresetFromHours: buildPresetFromHours,
    prefillFromHours: prefillFromHours,
    openFromAttendanceModal: openFromAttendanceModal,
    handleFromAttendanceSave: handleFromAttendanceSave,
    generateFromGenerator: generateFromGenerator,
    editInvoice: editInvoice,
    deleteInvoice: deleteInvoice,
    generateCoverageInvoice: generateCoverageInvoice,
    editAttendance: editAttendance,
    deleteAttendance: deleteAttendance,
    downloadPdf: downloadPdf,
    setInvoicePage: setInvoicePage,
    setGeneratorPage: setGeneratorPage,
    toggleInvoiceSelection: toggleInvoiceSelection,
    toggleSelectAll: toggleSelectAll,
    downloadSelectedPdfs: downloadSelectedPdfs
  };
})(typeof window !== "undefined" ? window : this);
