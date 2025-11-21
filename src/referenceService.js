(function (global) {
  // Manejo de datos de referencia (clientes/empleados) con cache.
  const ReferenceService = (() => {
    const state = {
      data: { clientes: [], empleados: [] },
      loaded: false
    };

    function load() {
      const now = Date.now();
      if (
        ApiService.dataCache.reference &&
        now - ApiService.dataCache.referenceTs < CACHE_TTL_MS
      ) {
        state.data = ApiService.dataCache.reference;
        state.loaded = true;
        return Promise.resolve(state.data);
      }

      return ApiService.call("getReferenceData")
        .then(function (data) {
          if (data && data.ignored) return;
          state.data = data || { clientes: [], empleados: [] };
          ApiService.dataCache.reference = state.data;
          ApiService.dataCache.referenceTs = Date.now();
        })
        .catch(function (err) {
          console.error("Error obteniendo referencia:", err);
          state.data = { clientes: [], empleados: [] };
        })
        .finally(function () {
          state.loaded = true;
        });
    }

    function get() {
      return state.data;
    }

    function isLoaded() {
      return state.loaded;
    }

    return {
      load,
      get,
      isLoaded
    };
  })();

  global.ReferenceService = ReferenceService;
})(typeof window !== "undefined" ? window : this);
