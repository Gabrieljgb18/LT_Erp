/**
 * MapsService
 * Encapsula llamadas del modulo de mapa.
 */
(function (global) {
  const MapsService = (() => {
    function toStr(value) {
      return value == null ? "" : String(value);
    }

    function toObj(value) {
      return value && typeof value === "object" ? value : {};
    }

    function getWeeklyClientOverview(weekStartDate) {
      return ApiService.call("getWeeklyClientOverview", { weekStartDate: toStr(weekStartDate) });
    }

    function getClientById(id) {
      if (ApiService.callLatest) {
        return ApiService.callLatest("client-detail-" + toStr(id), "getRecordById", "CLIENTES", toStr(id));
      }
      return ApiService.call("getRecordById", "CLIENTES", toStr(id));
    }

    return {
      getWeeklyClientOverview,
      getClientById
    };
  })();

  global.MapsService = MapsService;
})(typeof window !== "undefined" ? window : this);
