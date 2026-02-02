/**
 * ClientCalendarData
 * Capa de datos para calendario de clientes.
 */
(function (global) {
  const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000;
  const clientCache = { list: null, ts: 0, inFlight: null };

  function isCacheFresh() {
    return !!(clientCache.list && (Date.now() - clientCache.ts) < CLIENT_CACHE_TTL_MS);
  }

  function storeCache(list) {
    clientCache.list = Array.isArray(list) ? list : [];
    clientCache.ts = Date.now();
    return clientCache.list;
  }

  function loadClients() {
    if (isCacheFresh()) {
      return Promise.resolve(clientCache.list);
    }
    if (clientCache.inFlight) {
      return clientCache.inFlight;
    }
    if (!global.ReferenceService || typeof global.ReferenceService.ensureLoaded !== "function") {
      return Promise.resolve(storeCache([]));
    }
    const request = global.ReferenceService.ensureLoaded()
      .then(() => {
        const ref = global.ReferenceService.get();
        return storeCache(ref && ref.clientes ? ref.clientes : []);
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando clientes", err, { silent: true });
        } else {
          console.warn("Error cargando clientes:", err);
        }
        return storeCache([]);
      });
    clientCache.inFlight = request;
    return request.finally(function () {
      clientCache.inFlight = null;
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
    prefetchClients: function () {
      return loadClients().catch(function () {
        return [];
      });
    },
    fetchSchedule: fetchSchedule,
    listClientMedia: listClientMedia,
    getClientMediaImage: getClientMediaImage
  };
})(typeof window !== "undefined" ? window : this);
