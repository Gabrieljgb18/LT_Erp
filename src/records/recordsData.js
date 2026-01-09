/**
 * RecordsData
 * Capa de datos para operaciones CRUD y formatos.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function getAvailableFormats() {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("getAvailableFormats");
  }

  function searchRecords(tipoFormato, query) {
    if (!ensureApi()) return Promise.resolve([]);
    if (typeof global.ApiService.callLatest === "function") {
      const key = "search-" + String(tipoFormato || "") + "|" + String(query || "");
      return global.ApiService.callLatest(
        key,
        "searchRecords",
        tipoFormato,
        query || ""
      );
    }
    return global.ApiService.call("searchRecords", tipoFormato, query || "");
  }

  function saveRecord(tipoFormato, record) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("saveFormRecord", tipoFormato, record);
  }

  function updateRecord(tipoFormato, id, record) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("updateRecord", tipoFormato, id, record);
  }

  function deleteRecord(tipoFormato, id) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("deleteRecord", tipoFormato, id);
  }

  function refreshReferenceData() {
    if (!global.ReferenceService) return Promise.resolve(null);
    const refreshFn = typeof global.ReferenceService.refresh === "function"
      ? global.ReferenceService.refresh
      : global.ReferenceService.load;
    if (typeof refreshFn !== "function") return Promise.resolve(null);
    return refreshFn()
      .then(function () {
        return global.ReferenceService.get ? global.ReferenceService.get() : null;
      })
      .catch(function (err) {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("No se pudieron actualizar referencias", err, { silent: true });
        } else {
          console.warn("No se pudieron actualizar referencias:", err);
        }
        return null;
      });
  }

  function refreshReferenceDataIfNeeded(tipoFormato) {
    if (!global.DomainMeta || typeof global.DomainMeta.getMeta !== "function") return Promise.resolve(null);
    const meta = global.DomainMeta.getMeta(tipoFormato);
    if (!meta || !meta.refreshReference) return Promise.resolve(null);
    return refreshReferenceData();
  }

  global.RecordsData = {
    getAvailableFormats: getAvailableFormats,
    searchRecords: searchRecords,
    saveRecord: saveRecord,
    updateRecord: updateRecord,
    deleteRecord: deleteRecord,
    refreshReferenceData: refreshReferenceData,
    refreshReferenceDataIfNeeded: refreshReferenceDataIfNeeded
  };
})(typeof window !== "undefined" ? window : this);
