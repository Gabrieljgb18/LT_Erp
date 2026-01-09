/**
 * InvoicePanelData
 * Capa de datos del panel de facturacion.
 */
(function (global) {
  const state = global.InvoicePanelState;
  if (!state) {
    console.error("InvoicePanelState no disponible");
    return;
  }

  function loadClients() {
    if (typeof ReferenceService === "undefined" || !ReferenceService.load) return;

    if (!ReferenceService || typeof ReferenceService.ensureLoaded !== "function") {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return;
    }
    const loadPromise = ReferenceService.ensureLoaded();
    loadPromise
      .then(() => {
        const refs = ReferenceService.get();
        const clientes = refs && refs.clientes ? refs.clientes : [];
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.populateClientLists(clientes);
        }
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando clientes (referencias)", err, { silent: true });
        } else {
          console.error("Error cargando clientes (referencias):", err);
        }
        InvoiceService.getReferenceData()
          .then((refs) => {
            const clientes = refs && refs.clientes ? refs.clientes : [];
            if (global.InvoicePanelRender) {
              global.InvoicePanelRender.populateClientLists(clientes);
            }
          })
          .catch((fallbackErr) => {
            if (Alerts && Alerts.notifyError) {
              Alerts.notifyError("Error cargando clientes", fallbackErr);
            } else if (Alerts && Alerts.showError) {
              Alerts.showError("Error cargando clientes", fallbackErr);
            } else {
              console.error("Error cargando clientes:", fallbackErr);
            }
          });
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando clientes", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error cargando clientes", err);
        } else {
          console.error("Error cargando clientes:", err);
        }
      });
  }

  function getClientLabelById(idCliente) {
    const idStr = idCliente != null ? String(idCliente).trim() : "";
    if (!idStr) return "";

    for (const entry of state.clientIdMap.entries()) {
      const label = entry[0];
      const idVal = entry[1];
      if (String(idVal) === idStr) {
        return label;
      }
    }

    const refs = ReferenceService && ReferenceService.get ? ReferenceService.get() : null;
    const clientes = refs && refs.clientes ? refs.clientes : [];
    const match = clientes.find((c) => c && typeof c === "object" && String(c.id || "").trim() === idStr);
    return match ? state.formatClientLabel(match) : "";
  }

  function cleanClientValue(raw) {
    if (!raw) return "";
    const idx = raw.indexOf("(");
    return idx > 0 ? raw.slice(0, idx).trim() : raw.trim();
  }

  function extractClientIdFromLabel(label) {
    if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
      return DomainHelpers.extractIdFromLabel(label);
    }
    const match = String(label || "").match(/ID\s*:\s*([^|)]+)/i);
    return match ? match[1].trim() : "";
  }

  function getClientIdFromLabel(label) {
    if (!label) return "";
    return state.clientIdMap.get(label) || extractClientIdFromLabel(label);
  }

  function getClientByLabel(label) {
    if (!label) return null;
    const refs = ReferenceService && ReferenceService.get ? ReferenceService.get() : null;
    const clientes = refs && refs.clientes ? refs.clientes : [];
    const match = clientes.find((c) => {
      const clientLabel = state.formatClientLabel(c);
      return clientLabel === label;
    });
    return match || null;
  }

  function parseIvaPctFromConfig(config) {
    if (!config) return 0.21;
    const raw = config["IVA_PORCENTAJE"] != null ? config["IVA_PORCENTAJE"] : config["IVA"];
    if (raw == null || raw === "") return 0.21;
    const cleaned = String(raw).replace("%", "").trim();
    const n = Number(cleaned);
    if (isNaN(n)) return 0.21;
    return n > 1 ? n / 100 : n;
  }

  function loadIvaConfig() {
    if (!ApiService || !ApiService.call) return;
    InvoiceService.getConfig()
      .then((cfg) => {
        state.ivaPct = parseIvaPctFromConfig(cfg);
        if (global.InvoicePanelHandlers) {
          global.InvoicePanelHandlers.recalculateTotals();
        }
      })
      .catch(() => {
        /* usar default */
      });
  }

  function handleCoverageSearch() {
    const period = document.getElementById("invoice-cov-period")?.value || "";
    if (!period) {
      Alerts && Alerts.showAlert("Elegí un período para controlar.", "warning");
      return;
    }
    if (!ApiService || !ApiService.call) return;
    state.coverageRows = [];
    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.setCoverageLoading(true);
    }
    InvoiceService.getInvoicingCoverage(period, {})
      .then((res) => {
        state.coverageRows = res && res.rows ? res.rows : [];
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.renderCoverageSummary(state.coverageRows);
          global.InvoicePanelRender.renderCoverageTable(state.coverageRows, period);
        }
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error en control de facturación", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error en control de facturación", err);
        } else {
          console.error("Error en control de facturación:", err);
        }
      })
      .finally(() => {
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.setCoverageLoading(false);
        }
      });
  }

  function handleSearch(filters) {
    if (!filters) return;
    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.toggleLoading(true);
    }

    state.selectedInvoiceIds.clear();
    InvoiceService.getInvoices(filters)
      .then((invoices) => {
        state.lastInvoices = invoices || [];
        state.invoicePage = 1;
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.renderSummary(state.lastInvoices);
          global.InvoicePanelRender.renderTable(state.lastInvoices);
        }
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error al cargar facturas", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error al cargar facturas", err);
        } else {
          console.error("Error al cargar facturas:", err);
        }
      })
      .finally(() => {
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.toggleLoading(false);
        }
      });
  }

  function fetchGeneratorHours() {
    if (!state.lastGeneratorFilters || !state.lastGeneratorFilters.cliente) {
      if (global.InvoicePanelRender) {
        global.InvoicePanelRender.renderGeneratorResults([]);
      }
      return;
    }

    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.toggleGeneratorLoading(true);
    }
    InvoiceService.getHoursByClient(
      state.lastGeneratorFilters.fechaDesde,
      state.lastGeneratorFilters.fechaHasta,
      state.lastGeneratorFilters.cliente,
      state.lastGeneratorFilters.idCliente
    )
      .then((res) => {
        state.generatorHours = res && res.rows ? res.rows : [];
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.renderGeneratorResults(state.generatorHours);
        }
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error al cargar asistencia del cliente", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error al cargar asistencia del cliente", err);
        } else {
          console.error("Error al cargar asistencia del cliente:", err);
        }
      })
      .finally(() => {
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.toggleGeneratorLoading(false);
        }
      });
  }

  function refreshGeneratorList() {
    if (state.lastGeneratorFilters) {
      fetchGeneratorHours();
    }
  }

  function monthRangeFromPeriod(period) {
    const p = String(period || "").trim();
    if (!/^\d{4}-\d{2}$/.test(p)) return { start: "", end: "" };
    const y = Number(p.slice(0, 4));
    const m = Number(p.slice(5, 7));
    const endDate = new Date(y, m, 0);
    const dd = String(endDate.getDate()).padStart(2, "0");
    return { start: `${p}-01`, end: `${p}-${dd}` };
  }

  global.InvoicePanelData = {
    loadClients: loadClients,
    getClientLabelById: getClientLabelById,
    cleanClientValue: cleanClientValue,
    extractClientIdFromLabel: extractClientIdFromLabel,
    getClientIdFromLabel: getClientIdFromLabel,
    getClientByLabel: getClientByLabel,
    loadIvaConfig: loadIvaConfig,
    handleCoverageSearch: handleCoverageSearch,
    handleSearch: handleSearch,
    fetchGeneratorHours: fetchGeneratorHours,
    refreshGeneratorList: refreshGeneratorList,
    monthRangeFromPeriod: monthRangeFromPeriod
  };
})(typeof window !== "undefined" ? window : this);
