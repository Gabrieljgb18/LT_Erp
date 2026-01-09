/**
 * EmployeeCalendarData
 * Capa de datos para calendario de empleados.
 */
(function (global) {
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

  function loadEmployees() {
    if (global.AttendanceService && typeof global.AttendanceService.getEmpleadosConId === "function") {
      return global.AttendanceService.getEmpleadosConId()
        .then((items) => items || [])
        .catch((err) => {
          if (Alerts && Alerts.notifyError) {
            Alerts.notifyError("Error cargando empleados", err, { silent: true });
          } else {
            console.warn("Error cargando empleados:", err);
          }
          return loadEmployeesFromReference();
        });
    }
    return loadEmployeesFromReference();
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
    fetchSchedule: fetchSchedule,
    generatePdf: generatePdf,
    listClientMedia: listClientMedia,
    getClientMediaImage: getClientMediaImage
  };
})(typeof window !== "undefined" ? window : this);
