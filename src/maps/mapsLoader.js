(function (global) {
  if (typeof document === "undefined") return;

  const listeners = [];
  let ready = false;
  let bound = !!global.__mapsLoaderReadyBound;

  function isReady() {
    return !!(global.google && global.google.maps && global.google.maps.places);
  }

  function notifyReady() {
    if (ready || !isReady()) return;
    ready = true;
    while (listeners.length) {
      const cb = listeners.shift();
      try {
        cb();
      } catch (e) {
        console.warn("MapsLoader callback error:", e);
      }
    }
  }

  if (!bound) {
    bound = true;
    global.__mapsLoaderReadyBound = true;
    document.addEventListener("maps:ready", notifyReady);
  }

  const MapsLoader = {
    onReady: function (cb) {
      if (typeof cb !== "function") return;
      if (isReady()) {
        ready = true;
        cb();
        return;
      }
      listeners.push(cb);
    },
    isAvailable: function () {
      return isReady();
    },
    hasKey: function () {
      return !!global.__MAPS_API_KEY__;
    }
  };

  global.MapsLoader = MapsLoader;
})(typeof window !== "undefined" ? window : this);
