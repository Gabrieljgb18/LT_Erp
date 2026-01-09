(function (global) {
  const ReferenceData = (() => {
    function ensureLoaded() {
      if (!global.ReferenceService || typeof global.ReferenceService.ensureLoaded !== "function") {
        console.warn("ReferenceService.ensureLoaded no disponible");
        return Promise.reject(new Error("ReferenceService no disponible"));
      }
      return global.ReferenceService.ensureLoaded();
    }

    function get() {
      if (!global.ReferenceService || typeof global.ReferenceService.get !== "function") {
        return null;
      }
      return global.ReferenceService.get();
    }

    function subscribe(handler) {
      if (!global.ReferenceService || typeof global.ReferenceService.subscribe !== "function") {
        return null;
      }
      return global.ReferenceService.subscribe(handler);
    }

    function refresh() {
      if (!global.ReferenceService) return Promise.resolve(null);
      const refreshFn = typeof global.ReferenceService.refresh === "function"
        ? global.ReferenceService.refresh
        : global.ReferenceService.load;
      if (typeof refreshFn !== "function") return Promise.resolve(null);
      return refreshFn().then(() => get());
    }

    return {
      ensureLoaded,
      get,
      subscribe,
      refresh
    };
  })();

  global.ReferenceData = ReferenceData;
})(typeof window !== "undefined" ? window : this);
