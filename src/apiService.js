(function (global) {
  // Wrappers para llamadas a google.script.run con control de concurrencia.
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
      const token = Date.now() + "-" + Math.random().toString(16).slice(2);
      latestTokens.set(key, token);
      return call(functionName, ...args)
        .then((res) => {
          if (latestTokens.get(key) !== token) {
            return { ignored: true };
          }
          return res;
        })
        .catch((err) => {
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

  global.ApiService = ApiService;
})(typeof window !== "undefined" ? window : this);
