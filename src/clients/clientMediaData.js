/**
 * ClientMediaData
 * Capa de datos para media de clientes.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function listClientMedia(clientId) {
    if (!ensureApi()) return Promise.resolve({ fachada: [], llave: [] });
    return global.ApiService.call("listClientMedia", clientId);
  }

  function uploadClientMedia(payload) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("uploadClientMedia", payload);
  }

  function deleteClientMediaFile(fileId) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("deleteClientMediaFile", fileId);
  }

  function getClientMediaImage(fileId, size) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("getClientMediaImage", fileId, size);
  }

  global.ClientMediaData = {
    listClientMedia: listClientMedia,
    uploadClientMedia: uploadClientMedia,
    deleteClientMediaFile: deleteClientMediaFile,
    getClientMediaImage: getClientMediaImage
  };
})(typeof window !== "undefined" ? window : this);
