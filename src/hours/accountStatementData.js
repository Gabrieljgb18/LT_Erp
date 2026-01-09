/**
 * AccountStatementPanelData
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function ensureReference() {
    return global.ReferenceService && typeof global.ReferenceService.ensureLoaded === "function";
  }

  function fetchStatement(year, month) {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("getEmployeeAccountStatement", Number(year), Number(month));
  }

  function loadEmployees() {
    if (!ensureReference()) {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return Promise.resolve([]);
    }
    return global.ReferenceService.ensureLoaded()
      .then(() => {
        const refs = global.ReferenceService.get();
        return refs && refs.empleados ? refs.empleados : [];
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando empleados", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error cargando empleados", err);
        } else {
          console.error("Error cargando empleados:", err);
        }
        return [];
      });
  }

  function recordPayment(payload) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call(
      "recordEmployeePayment",
      payload.fecha,
      payload.empleado,
      payload.concepto,
      payload.monto,
      payload.medioPago,
      payload.observaciones
    );
  }

  global.AccountStatementPanelData = {
    fetchStatement: fetchStatement,
    loadEmployees: loadEmployees,
    recordPayment: recordPayment
  };
})(typeof window !== "undefined" ? window : this);
