// Servicios frontend (API + referencia)
const ApiService = (() => {
  const latestTokens = new Map();
  const dataCache = {
    reference: null,
    referenceTs: 0,
    search: new Map() // key: format|query -> {ts, results}
  };

  function call(functionName, ...args) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)[functionName](...args);
    });
  }

  function callLatest(key, functionName, ...args) {
    const token = Date.now() + '-' + Math.random().toString(16).slice(2);
    latestTokens.set(key, token);
    return call(functionName, ...args).then((res) => {
      if (latestTokens.get(key) !== token) {
        return { ignored: true };
      }
      return res;
    }).catch((err) => {
      if (latestTokens.get(key) !== token) {
        return { ignored: true };
      }
      throw err;
    });
  }

  return {
    call,
    callLatest,
    dataCache
  };
})();

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

    return ApiService.call('getReferenceData')
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
