/**
 * AttendanceDailyData
 * Capa de datos para asistencia diaria.
 */
(function (global) {
  const PLAN_CACHE_TTL_MS = 5 * 60 * 1000;
  const planCache = new Map();

  function getCachedPlan(fecha) {
    if (!fecha) return null;
    const entry = planCache.get(fecha);
    if (!entry) return null;
    if ((Date.now() - entry.ts) > PLAN_CACHE_TTL_MS) {
      planCache.delete(fecha);
      return null;
    }
    return entry.payload || null;
  }

  function normalizePlanPayload_(payload) {
    if (Array.isArray(payload)) {
      return { rows: payload, noImportSuggested: false };
    }
    if (!payload || typeof payload !== "object") {
      return { rows: [], noImportSuggested: false };
    }
    return {
      rows: Array.isArray(payload.rows) ? payload.rows : [],
      noImportSuggested: payload.noImportSuggested === true
    };
  }

  function storeCachedPlan(fecha, payload) {
    const normalized = normalizePlanPayload_(payload);
    if (!fecha) return normalized;
    planCache.set(fecha, { ts: Date.now(), payload: normalized });
    return normalized;
  }

  function invalidateDailyPlan(fecha) {
    if (!fecha) {
      planCache.clear();
      return;
    }
    planCache.delete(fecha);
  }

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
    const cached = getCachedPlan(fecha);
    if (cached) return Promise.resolve(cached);
    if (!ensureApi()) return Promise.resolve({ rows: [], noImportSuggested: false });
    return global.ApiService.callLatest("attendance-plan-" + fecha, "getDailyAttendancePlan", fecha)
      .then((payload) => {
        if (payload && payload.ignored) return payload;
        return storeCachedPlan(fecha, payload);
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
    invalidateDailyPlan: invalidateDailyPlan,
    searchRecords: searchRecords,
    saveDailyAttendance: saveDailyAttendance,
    prefetch: function (fecha) {
      const targetDate = fecha || (global.AttendanceDailyState && typeof global.AttendanceDailyState.getTodayIso === "function"
        ? global.AttendanceDailyState.getTodayIso()
        : "");
      return loadReference()
        .then(function () {
          return loadDailyPlan(targetDate);
        })
        .catch(function () {
          return null;
        });
    }
  };
})(typeof window !== "undefined" ? window : this);
