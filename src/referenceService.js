(function (global) {
  // Manejo de datos de referencia (clientes/empleados) con cache.
  const ReferenceService = (() => {
    const state = {
      data: { clientes: [], empleados: [] },
      loaded: false
    };
    const listeners = new Set();
    let inFlight = null;
    let notifyOnResolve = false;

    function load(force) {
      const shouldNotify = !!force;
      const now = Date.now();
      if (
        !force &&
        ApiService.dataCache.reference &&
        now - ApiService.dataCache.referenceTs < CACHE_TTL_MS
      ) {
        state.data = ApiService.dataCache.reference;
        state.loaded = true;
        if (shouldNotify) notify(state.data);
        return Promise.resolve(state.data);
      }

      if (shouldNotify) notifyOnResolve = true;
      if (inFlight) return inFlight;

      inFlight = ApiService.call("getReferenceData")
        .then(function (data) {
          if (data && data.ignored) return;
          state.data = data || { clientes: [], empleados: [] };
          ApiService.dataCache.reference = state.data;
          ApiService.dataCache.referenceTs = Date.now();
          if (notifyOnResolve) notify(state.data);
          return state.data;
        })
        .catch(function (err) {
          console.error("Error obteniendo referencia:", err);
          state.data = { clientes: [], empleados: [] };
          if (notifyOnResolve) notify(state.data);
          return state.data;
        })
        .finally(function () {
          state.loaded = true;
          inFlight = null;
          notifyOnResolve = false;
        });

      return inFlight;
    }

    function get() {
      return state.data;
    }

    function isLoaded() {
      return state.loaded;
    }

    function ensureLoaded() {
      if (state.loaded) {
        return Promise.resolve(state.data);
      }
      return load();
    }

    function refresh() {
      return load(true);
    }

    function subscribe(listener) {
      if (typeof listener !== "function") return function () { };
      listeners.add(listener);
      return function () {
        listeners.delete(listener);
      };
    }

    function notify(data) {
      listeners.forEach(function (cb) {
        try {
          cb(data);
        } catch (e) {
          console.warn("ReferenceService listener error:", e);
        }
      });
      if (typeof document !== "undefined" && typeof CustomEvent !== "undefined") {
        document.dispatchEvent(new CustomEvent("reference-data:updated", { detail: data }));
      }
    }

    return {
      load,
      ensureLoaded,
      refresh,
      subscribe,
      get,
      isLoaded
    };
  })();

  global.ReferenceService = ReferenceService;
})(typeof window !== "undefined" ? window : this);
