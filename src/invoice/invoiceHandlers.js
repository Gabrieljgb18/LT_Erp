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

    const dlBtn = document.getElementById("invoice-download-btn");
    on(dlBtn, "click", () => {
      const id = document.getElementById("invoice-id")?.value;
      if (id) downloadPdf(id, dlBtn);
    });

    /*
    const addClientBtn = document.getElementById("invoice-add-client-btn");
    on(addClientBtn, "click", () => {
      if (typeof RecordManager !== "undefined" && RecordManager && typeof RecordManager.openNewModal === "function") {
        RecordManager.openNewModal("CLIENTES");
        // Escuchar cierre de modal para refrescar ddl si fuera necesario
      } else {
        Alerts && Alerts.showAlert("Módulo de Clientes no disponible", "warning");
      }
    });
    */

    const dlLastBtn = document.getElementById("invoice-download-last-btn");
    on(dlLastBtn, "click", () => {
      if (state.lastSavedInvoiceId) downloadPdf(state.lastSavedInvoiceId, dlLastBtn);
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
        generateCoverageInvoice(idCliente, cliente, period, btn);
      });
    }
    const quickSaveBtn = document.getElementById("quick-save-btn");
    on(quickSaveBtn, "click", handleQuickSave);

    const quickDlBtn = document.getElementById("quick-download-btn");
    on(quickDlBtn, "click", () => {
      const id = quickDlBtn && quickDlBtn.dataset ? quickDlBtn.dataset.invoiceId : "";
      const useId = id || state.lastSavedInvoiceId;
      if (useId) downloadPdf(useId, quickDlBtn);
    });

    const quickCloseBtn = document.getElementById("quick-close-btn");
    on(quickCloseBtn, "click", closeQuickPopover);

    const quickPopover = document.getElementById("invoice-quick-popover");
    on(quickPopover, "click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest("[data-copy]") : null;
      if (!btn || btn.disabled) return;
      const value = btn.dataset ? (btn.dataset.copy || "") : "";
      if (!value) return;
      copyToClipboard(value).then((ok) => {
        if (ok) flashCopied(btn);
      });
    });
    on(document, "mousedown", (e) => {
      if (!state.quickPopoverOpen) return;
      if (quickPopover && quickPopover.contains(e.target)) return;
      if (state.quickPopoverAnchor && state.quickPopoverAnchor.contains && state.quickPopoverAnchor.contains(e.target)) return;
      closeQuickPopover();
    });
    on(document, "keydown", (e) => {
      if (!state.quickPopoverOpen) return;
      if (e.key === "Escape") closeQuickPopover();
    });
    on(window, "resize", () => {
      if (state.quickPopoverOpen) positionQuickPopover(state.quickPopoverAnchor);
    });
  }

  // Nuevo: Manejador para el guardado desde el modal rápido
  function handleQuickSave() {
    const idCliente = document.getElementById("quick-client-id").value;
    const numFactura = document.getElementById("quick-invoice-number").value;
    const dateStart = document.getElementById("quick-range-start").value;
    const dateEnd = document.getElementById("quick-range-end").value;
    const cliLabel = document.getElementById("quick-client-label").textContent;

    if (!numFactura) {
      Alerts && Alerts.showAlert("Ingresá el número de factura", "warning");
      return;
    }

    const saveBtn = document.getElementById("quick-save-btn");
    const dlBtn = document.getElementById("quick-download-btn");
    const statusMsg = document.getElementById("quick-status-msg");
    const ui = global.UIHelpers;

    if (ui && typeof ui.withSpinner === "function") ui.withSpinner(saveBtn, true, "Guardando...");

    InvoiceService.createInvoiceFromAttendance(
      { cliente: cliLabel, idCliente: idCliente },
      dateStart,
      dateEnd,
      {
        numero: numFactura,
        observaciones: `Período: ${dateStart} a ${dateEnd}`
      },
      idCliente
    ).then((res) => {
        let newId = "";
        if (res && (typeof res === "string" || typeof res === "number")) {
          newId = res;
        } else if (res && typeof res === "object") {
          newId = res.id || res.ID;
        }
        if (!newId) throw new Error("No se pudo obtener ID");

        state.lastSavedInvoiceId = String(newId);

        // Update UI: Success state
        if (statusMsg) statusMsg.classList.remove("d-none");
        if (saveBtn) {
          saveBtn.classList.add("d-none"); // Ocultamos guardar
        }
        if (dlBtn) {
          dlBtn.disabled = false; // Habilitamos descargar
          dlBtn.removeAttribute("disabled");
          dlBtn.removeAttribute("aria-disabled");
          dlBtn.classList.remove("disabled");
          dlBtn.style.pointerEvents = "auto";
          dlBtn.style.opacity = "1";
          if (dlBtn.dataset) dlBtn.dataset.invoiceId = String(newId);
          dlBtn.focus();
        }

        // Refresh background data
        if (global.InvoicePanelData) {
          try { global.InvoicePanelData.handleCoverageSearch(); } catch (e) { }
        }

      }).catch((err) => {
      console.error(err);
      Alerts && Alerts.showAlert("Error al guardar: " + err.message, "danger");
      if (ui && typeof ui.withSpinner === "function") ui.withSpinner(saveBtn, false);
    });
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
    const dlBtn = document.getElementById("invoice-download-btn");
    if (dlBtn) dlBtn.classList.toggle("d-none", !invoiceData || !invoiceData.ID);

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

        // No cerramos el modal. Actualizamos estado para permitir descarga.
        if (newId) {
          document.getElementById("invoice-id").value = newId;
          state.lastSavedInvoiceId = String(newId);

          const dlBtn = document.getElementById("invoice-download-btn");
          if (dlBtn) dlBtn.classList.remove("d-none");

          const title = document.getElementById("invoice-modal-title");
          if (title) title.textContent = "Editar Factura";

          if (global.InvoicePanelRender) {
            global.InvoicePanelRender.updateSelectionUi();
          }
        }

        state.invoicePage = 1;
        if (global.InvoicePanelData) {
          global.InvoicePanelData.refreshGeneratorList();
        }

        Alerts && Alerts.showAlert(isUpdate ? "Factura actualizada." : "Factura guardada.", "success");
        // showDownloadConfirm_ ya no es necesario porque el botón está visible en el modal
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
      .then((res) => {
        const newId = res && (res.id || (res.record && res.record.ID) || (typeof res === 'string' || typeof res === 'number' ? res : null));
        Alerts && Alerts.showAlert("Factura generada desde asistencia.", "success");
        const modalEl = document.getElementById("invoice-att-modal");
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }
        handleSearch();
        if (newId) showDownloadConfirm_(newId, false);
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
      .then((res) => {
        const newId = res && (res.id || (res.record && res.record.ID) || (typeof res === 'string' || typeof res === 'number' ? res : null));
        Alerts && Alerts.showAlert("Factura generada.", "success");
        handleSearch();
        if (newId) showDownloadConfirm_(newId, false);
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

  function openQuickPopover(anchorBtn) {
    const popover = document.getElementById("invoice-quick-popover");
    if (!popover) return;
    popover.classList.remove("d-none");
    popover.setAttribute("aria-hidden", "false");
    state.quickPopoverOpen = true;
    state.quickPopoverAnchor = anchorBtn || null;
    positionQuickPopover(anchorBtn);
  }

  function copyToClipboard(text) {
    if (!text) return Promise.resolve(false);
    if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy_(text));
    }
    return fallbackCopy_(text);
  }

  function fallbackCopy_(text) {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return Promise.resolve(!!ok);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  function flashCopied(el) {
    if (!el) return;
    el.classList.add("is-copied");
    if (el._copyTimer) clearTimeout(el._copyTimer);
    el._copyTimer = setTimeout(() => {
      el.classList.remove("is-copied");
    }, 900);
  }

  function closeQuickPopover() {
    const popover = document.getElementById("invoice-quick-popover");
    if (!popover) return;
    popover.classList.add("d-none");
    popover.setAttribute("aria-hidden", "true");
    popover.style.visibility = "";
    state.quickPopoverOpen = false;
    state.quickPopoverAnchor = null;
  }

  function positionQuickPopover(anchorBtn) {
    const popover = document.getElementById("invoice-quick-popover");
    if (!popover) return;

    const spacing = 8;
    const viewportW = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
    const anchorRect = anchorBtn && anchorBtn.getBoundingClientRect
      ? anchorBtn.getBoundingClientRect()
      : {
        top: viewportH / 2,
        bottom: viewportH / 2,
        left: viewportW / 2,
        width: 0,
        height: 0
      };

    popover.style.visibility = "hidden";
    popover.classList.remove("d-none");
    popover.classList.remove("lt-quick-popover--below");

    const popRect = popover.getBoundingClientRect();

    let top = anchorRect.top - popRect.height - spacing;
    if (top < 12) {
      top = anchorRect.bottom + spacing;
      popover.classList.add("lt-quick-popover--below");
    }

    let left = anchorRect.left + anchorRect.width / 2 - popRect.width / 2;
    const minLeft = 12;
    const maxLeft = Math.max(minLeft, viewportW - popRect.width - 12);
    left = Math.min(Math.max(left, minLeft), maxLeft);

    const arrowLeft = Math.min(
      Math.max(anchorRect.left + anchorRect.width / 2 - left, 16),
      popRect.width - 16
    );

    popover.style.setProperty("--lt-popover-arrow-left", `${Math.round(arrowLeft)}px`);
    const maxTop = Math.max(12, viewportH - popRect.height - 12);
    top = Math.min(Math.max(top, 12), maxTop);
    popover.style.top = `${Math.round(top)}px`;
    popover.style.left = `${Math.round(left)}px`;
    popover.style.visibility = "visible";
  }

  // Abre el popover compacto para facturación rápida
  function generateCoverageInvoice(idCliente, cliente, period, anchorBtn) {
    const p = String(period || "").trim();
    const range = global.InvoicePanelData ? global.InvoicePanelData.monthRangeFromPeriod(p) : { start: "", end: "" };

    document.getElementById("quick-client-id").value = idCliente || "";
    document.getElementById("quick-period").value = p;
    document.getElementById("quick-range-start").value = range.start || "";
    document.getElementById("quick-range-end").value = range.end || "";

    const razonSocial = anchorBtn && anchorBtn.dataset ? (anchorBtn.dataset.razonSocial || "") : "";
    const cuit = anchorBtn && anchorBtn.dataset ? (anchorBtn.dataset.cuit || "") : "";
    const importeRaw = anchorBtn && anchorBtn.dataset ? anchorBtn.dataset.importe : "";

    const labelEl = document.getElementById("quick-client-label");
    const razonLabel = razonSocial || cliente || "Cliente";
    if (labelEl) labelEl.textContent = razonLabel;

    const razonCopy = document.getElementById("quick-razon-copy");
    if (razonCopy) {
      razonCopy.dataset.copy = razonLabel || "";
      razonCopy.disabled = !razonLabel;
      razonCopy.classList.toggle("is-empty", !razonLabel);
    }

    const cuitEl = document.getElementById("quick-cuit");
    const cuitCopy = document.getElementById("quick-cuit-copy");
    if (cuitEl) cuitEl.textContent = cuit || "—";
    if (cuitCopy) {
      cuitCopy.dataset.copy = cuit || "";
      cuitCopy.disabled = !cuit;
      cuitCopy.classList.toggle("is-empty", !cuit);
    }

    const importeNum = importeRaw !== "" && importeRaw != null ? Number(importeRaw) : NaN;
    const hasImporte = !isNaN(importeNum);
    const importeLabel = hasImporte && typeof Formatters !== "undefined" && Formatters && typeof Formatters.formatCurrency === "function"
      ? Formatters.formatCurrency(importeNum)
      : (hasImporte ? String(importeNum) : "—");
    const importeEl = document.getElementById("quick-importe");
    const importeCopy = document.getElementById("quick-importe-copy");
    if (importeEl) importeEl.textContent = importeLabel || "—";
    if (importeCopy) {
      importeCopy.dataset.copy = hasImporte ? String(importeNum) : "";
      importeCopy.disabled = !hasImporte;
      importeCopy.classList.toggle("is-empty", !hasImporte);
    }

    const periodLabel = document.getElementById("quick-period-label");
    if (periodLabel) {
      periodLabel.textContent = `Período: ${range.start} - ${range.end}`;
      periodLabel.classList.add("d-none");
    }

    document.getElementById("quick-invoice-number").value = "";

    // Reset states
    const saveBtn = document.getElementById("quick-save-btn");
    const dlBtn = document.getElementById("quick-download-btn");
    const statusMsg = document.getElementById("quick-status-msg");

    if (saveBtn) {
      saveBtn.classList.remove("d-none");
      saveBtn.disabled = false;
      // Fix: Reset content explicitly instead of using withSpinner(false) which might wipe it if no originalContent exists
      saveBtn.innerHTML = "Guardar";
      delete saveBtn.dataset.originalContent;
    }
    if (dlBtn) {
      dlBtn.disabled = true;
      dlBtn.setAttribute("aria-disabled", "true");
      dlBtn.style.pointerEvents = "none";
      dlBtn.removeAttribute("data-invoice-id");
    }
    if (statusMsg) statusMsg.classList.add("d-none");

    openQuickPopover(anchorBtn);

    // Focus input
    setTimeout(() => {
      const input = document.getElementById("quick-invoice-number");
      if (input) input.focus();
      if (state.quickPopoverOpen) positionQuickPopover(state.quickPopoverAnchor);
    }, 50);
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

  function showDownloadConfirm_(id, isUpdate) {
    if (!id) return;
    state.lastSavedInvoiceId = String(id);
    if (global.InvoicePanelRender) global.InvoicePanelRender.updateSelectionUi();

    const isMsg = isUpdate ? "Factura actualizada correctamente" : "Factura guardada correctamente";
    const confirmMsg = `${isMsg}.\n\n¿Querés descargar el PDF ahora?`;

    const confirmDownload = (window.UiDialogs && typeof window.UiDialogs.confirm === "function")
      ? window.UiDialogs.confirm({
        title: isUpdate ? "Factura Actualizada" : "Factura Guardada",
        message: confirmMsg,
        confirmText: "Descargar PDF",
        cancelText: "Cerrar",
        confirmVariant: "success",
        icon: "bi-check-circle-fill",
        iconClass: "text-success"
      })
      : Promise.resolve(confirm(confirmMsg));

    confirmDownload.then((confirmed) => {
      if (confirmed) downloadPdf(String(id));
    });
  }

  function downloadPdf(id, sourceBtn) {
    if (!id) return;

    const ui = global.UIHelpers;
    let activeBtn = sourceBtn;
    const modalBtn = document.getElementById("invoice-download-btn");
    const lastBtn = document.getElementById("invoice-download-last-btn");

    // Fallback
    if (!activeBtn) {
      const isModalOpen = modalBtn && modalBtn.offsetParent !== null;
      if (isModalOpen) {
        activeBtn = modalBtn;
      } else if (lastBtn && !lastBtn.disabled) {
        activeBtn = lastBtn;
      }
    }

    if (activeBtn && ui && typeof ui.withSpinner === "function") {
      ui.withSpinner(activeBtn, true, "Generando...");
    } else {
      UiState && UiState.setGlobalLoading(true, "Generando PDF...");
    }

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
      .finally(() => {
        if (activeBtn && ui && typeof ui.withSpinner === "function") {
          // Restaurar etiqueta original con icono
          // withSpinner(btn, false) restaura el originalContent
          ui.withSpinner(activeBtn, false);
          // Aseguramos que el botón del modal siga visible
          if (activeBtn === modalBtn) activeBtn.classList.remove("d-none");
        } else {
          UiState && UiState.setGlobalLoading(false);
        }
      });
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
