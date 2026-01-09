/**
 * ClientAccountPanelData
 * Capa de datos para cuenta corriente clientes.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function ensureReference() {
    return global.ReferenceService && typeof global.ReferenceService.ensureLoaded === "function";
  }

  function loadClients() {
    if (!ensureReference()) {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return Promise.resolve([]);
    }
    return global.ReferenceService.ensureLoaded()
      .then(() => {
        const refs = global.ReferenceService.get();
        return refs && refs.clientes ? refs.clientes : [];
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando clientes", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error cargando clientes", err);
        } else {
          console.error("Error cargando clientes:", err);
        }
        return [];
      });
  }

  function fetchAccountStatement(query) {
    if (!ensureApi()) return Promise.resolve({ movimientos: [], saldoInicial: 0 });
    return global.ApiService.call(
      "getClientAccountStatement",
      query.clientRaw,
      query.startDate,
      query.endDate,
      query.idCliente
    );
  }

  function fetchInvoicesCount(idCliente, startDate, endDate) {
    if (!ensureApi()) return Promise.resolve(0);
    return global.ApiService.call("getInvoices", { idCliente: idCliente, fechaDesde: startDate, fechaHasta: endDate })
      .then((invs) => (Array.isArray(invs) ? invs.length : 0))
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error contando facturas", err, { silent: true });
        } else {
          console.error("Error contando facturas:", err);
        }
        return 0;
      });
  }

  function generatePdf(query) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call(
      "generateClientAccountStatementPdf",
      query.clientRaw,
      query.startDate,
      query.endDate,
      query.idCliente
    );
  }

  function fetchPendingInvoices(idCliente) {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("getClientInvoicesForPayment", "", idCliente)
      .then((list) => (Array.isArray(list) ? list : []));
  }

  function recordPayment(payload) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("recordClientPayment", payload);
  }

  global.ClientAccountPanelData = {
    loadClients: loadClients,
    fetchAccountStatement: fetchAccountStatement,
    fetchInvoicesCount: fetchInvoicesCount,
    generatePdf: generatePdf,
    fetchPendingInvoices: fetchPendingInvoices,
    recordPayment: recordPayment
  };
})(typeof window !== "undefined" ? window : this);
