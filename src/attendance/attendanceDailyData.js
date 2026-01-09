/**
 * AttendanceDailyData
 * Capa de datos para asistencia diaria.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.callLatest === "function";
  }

  function ensureReference() {
    return global.ReferenceService && typeof global.ReferenceService.ensureLoaded === "function";
  }

  function loadReference() {
    if (!ensureReference()) {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return Promise.resolve({ clientes: [], empleados: [] });
    }
    return global.ReferenceService.ensureLoaded()
      .then(() => {
        const refs = global.ReferenceService.get();
        return refs || { clientes: [], empleados: [] };
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando referencias", err, { silent: true });
        } else {
          console.warn("Error cargando referencias:", err);
        }
        return { clientes: [], empleados: [] };
      });
  }

  function loadDailyPlan(fecha) {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.callLatest("attendance-plan-" + fecha, "getDailyAttendancePlan", fecha)
      .then((rows) => {
        if (rows && rows.ignored) return rows;
        if (Array.isArray(rows)) return rows;
        return [];
      });
  }

  function searchRecords(tipoFormato, query) {
    if (!global.AttendanceService || typeof global.AttendanceService.searchRecords !== "function") {
      return Promise.resolve([]);
    }
    return global.AttendanceService.searchRecords(tipoFormato, query);
  }

  function saveDailyAttendance(fecha, payload) {
    if (!global.AttendanceService || typeof global.AttendanceService.saveDailyAttendance !== "function") {
      return Promise.reject(new Error("AttendanceService no disponible"));
    }
    return global.AttendanceService.saveDailyAttendance(fecha, payload);
  }

  global.AttendanceDailyData = {
    loadReference: loadReference,
    loadDailyPlan: loadDailyPlan,
    searchRecords: searchRecords,
    saveDailyAttendance: saveDailyAttendance
  };
})(typeof window !== "undefined" ? window : this);
