/**
 * HoursDetailPanelData
 * Capa de datos del panel de detalle de horas.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function ensureReference() {
    return global.ReferenceService && typeof global.ReferenceService.ensureLoaded === "function";
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

  function normalizeHoursResponse(results) {
    const parsed = (typeof results === "string")
      ? (function () {
          try {
            return JSON.parse(results);
          } catch (e) {
            console.warn("No se pudo parsear resultados", e);
            return {};
          }
        })()
      : (results || {});

    const rows = parsed && parsed.rows ? parsed.rows : (Array.isArray(parsed) ? parsed : []);
    const summary = parsed && parsed.summary ? parsed.summary : null;
    return { rows: rows || [], summary: summary };
  }

  function fetchHoursByEmployee(start, end, employeeLabel, idEmpleado) {
    if (!ensureApi()) return Promise.resolve({ rows: [], summary: null });
    return global.ApiService.call("getHoursByEmployee", start, end, employeeLabel, idEmpleado)
      .then(normalizeHoursResponse);
  }

  function generatePdf(start, end, employeeLabel, idEmpleado) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("generateHoursPdf", start, end, employeeLabel, idEmpleado);
  }

  function deleteRecord(id) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("deleteRecord", ["ASISTENCIA", id]);
  }

  function updateRecord(id, payload) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("updateRecord", "ASISTENCIA", id, payload);
  }

  global.HoursDetailPanelData = {
    loadEmployees: loadEmployees,
    fetchHoursByEmployee: fetchHoursByEmployee,
    generatePdf: generatePdf,
    deleteRecord: deleteRecord,
    updateRecord: updateRecord,
    normalizeHoursResponse: normalizeHoursResponse
  };
})(typeof window !== "undefined" ? window : this);
