/**
 * ClientTagsData
 * Capa de datos para etiquetas de clientes.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function getClientTags() {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("getClientTags");
  }

  function upsertClientTags(tags) {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("upsertClientTags", tags);
  }

  global.ClientTagsData = {
    getClientTags: getClientTags,
    upsertClientTags: upsertClientTags
  };
})(typeof window !== "undefined" ? window : this);
