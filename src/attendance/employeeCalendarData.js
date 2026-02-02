/**
 * EmployeeCalendarData
 * Capa de datos para calendario de empleados.
 */
(function (global) {
  const EMP_CACHE_TTL_MS = 5 * 60 * 1000;
  const employeeCache = { list: null, ts: 0, inFlight: null };

  function isCacheFresh() {
    return !!(employeeCache.list && (Date.now() - employeeCache.ts) < EMP_CACHE_TTL_MS);
  }

  function storeCache(list) {
    employeeCache.list = Array.isArray(list) ? list : [];
    employeeCache.ts = Date.now();
    return employeeCache.list;
  }

  function loadEmployeesFromReference() {
    if (!global.ReferenceService || typeof global.ReferenceService.ensureLoaded !== "function") {
      return Promise.resolve([]);
    }
    return global.ReferenceService.ensureLoaded()
      .then(() => {
        const ref = global.ReferenceService.get();
        return ref && ref.empleados ? ref.empleados : [];
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando empleados", err, { silent: true });
        } else {
          console.warn("Error cargando empleados:", err);
        }
        return [];
      });
  }

  function loadEmployees(options) {
    const force = options && options.force;
    if (!force && isCacheFresh()) {
      return Promise.resolve(employeeCache.list);
    }
    if (!force && employeeCache.inFlight) {
      return employeeCache.inFlight;
    }

    const request = (global.AttendanceService && typeof global.AttendanceService.getEmpleadosConId === "function")
      ? global.AttendanceService.getEmpleadosConId()
          .then((items) => storeCache(items || []))
          .catch((err) => {
            if (Alerts && Alerts.notifyError) {
              Alerts.notifyError("Error cargando empleados", err, { silent: true });
            } else {
              console.warn("Error cargando empleados:", err);
            }
            return loadEmployeesFromReference().then(storeCache);
          })
      : loadEmployeesFromReference().then(storeCache);

    if (!force) {
      employeeCache.inFlight = request;
    }

    return request.finally(function () {
      employeeCache.inFlight = null;
    });
  }

  function fetchSchedule(options) {
    if (!global.ApiService || typeof global.ApiService.call !== "function") {
      return Promise.resolve({});
    }
    const opts = options || {};
    const weekStartDate = opts.weekStartDate || "";
    const allEmployees = !!opts.allEmployees;
    const apiName = allEmployees ? "getWeeklyEmployeeOverview" : "getEmployeeWeeklySchedule";
    const payload = allEmployees
      ? { weekStartDate: weekStartDate }
      : {
          empleado: opts.empleado || "",
          idEmpleado: opts.idEmpleado || "",
          weekStartDate: weekStartDate
        };
    return global.ApiService.call(apiName, payload);
  }

  function generatePdf(payload) {
    if (!global.AttendanceService || typeof global.AttendanceService.generateEmployeeSchedulePdf !== "function") {
      return Promise.reject(new Error("AttendanceService no disponible"));
    }
    return global.AttendanceService.generateEmployeeSchedulePdf(payload);
  }

  function listClientMedia(clienteId) {
    if (!global.AttendanceService || typeof global.AttendanceService.listClientMedia !== "function") {
      return Promise.resolve({ fachada: [], llave: [] });
    }
    return global.AttendanceService.listClientMedia(clienteId);
  }

  function getClientMediaImage(fileId, size) {
    if (!global.AttendanceService || typeof global.AttendanceService.getClientMediaImage !== "function") {
      return Promise.reject(new Error("AttendanceService no disponible"));
    }
    return global.AttendanceService.getClientMediaImage(fileId, size);
  }

  global.EmployeeCalendarData = {
    loadEmployees: loadEmployees,
    prefetchEmployees: function () {
      return loadEmployees({ force: true }).catch(function () {
        return [];
      });
    },
    fetchSchedule: fetchSchedule,
    generatePdf: generatePdf,
    listClientMedia: listClientMedia,
    getClientMediaImage: getClientMediaImage
  };
})(typeof window !== "undefined" ? window : this);
