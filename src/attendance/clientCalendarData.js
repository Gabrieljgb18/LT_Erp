/**
 * ClientCalendarData
 * Capa de datos para calendario de clientes.
 */
(function (global) {
  function loadClients() {
    if (!global.ReferenceService || typeof global.ReferenceService.ensureLoaded !== "function") {
      return Promise.resolve([]);
    }
    return global.ReferenceService.ensureLoaded()
      .then(() => {
        const ref = global.ReferenceService.get();
        return ref && ref.clientes ? ref.clientes : [];
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando clientes", err, { silent: true });
        } else {
          console.warn("Error cargando clientes:", err);
        }
        return [];
      });
  }

  function fetchSchedule(options) {
    if (!global.AttendanceService || typeof global.AttendanceService.getWeeklyClientOverview !== "function") {
      return Promise.resolve({});
    }
    const opts = options || {};
    return global.AttendanceService.getWeeklyClientOverview({
      weekStartDate: opts.weekStartDate || "",
      clientId: opts.clientId || ""
    });
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

  global.ClientCalendarData = {
    loadClients: loadClients,
    fetchSchedule: fetchSchedule,
    listClientMedia: listClientMedia,
    getClientMediaImage: getClientMediaImage
  };
})(typeof window !== "undefined" ? window : this);
