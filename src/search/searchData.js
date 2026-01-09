/**
 * SearchData
 * Capa de datos para búsqueda con cache.
 */
(function (global) {
  const SEARCH_TTL_MS = 60 * 1000;

  function ensureApi() {
    return global.ApiService && typeof global.ApiService.callLatest === "function";
  }

  function getCacheMap() {
    if (!global.ApiService || !global.ApiService.dataCache) return null;
    if (!global.ApiService.dataCache.search) {
      global.ApiService.dataCache.search = new Map();
    }
    return global.ApiService.dataCache.search;
  }

  function getCachedResults(key) {
    const cache = getCacheMap();
    if (!cache) return null;
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > SEARCH_TTL_MS) {
      cache.delete(key);
      return null;
    }
    return entry.results || null;
  }

  function setCachedResults(key, results) {
    const cache = getCacheMap();
    if (!cache) return;
    cache.set(key, { ts: Date.now(), results: results || [] });
  }

  function searchRecords(tipoFormato, query) {
    if (!ensureApi()) return Promise.resolve([]);
    const key = String(tipoFormato || "") + "|" + String(query || "").toLowerCase().trim();
    const cached = getCachedResults(key);
    if (cached) return Promise.resolve(cached);
    return global.ApiService.callLatest("search-" + String(tipoFormato || ""), "searchRecords", tipoFormato, query || "")
      .then((results) => {
        if (results && results.ignored) return results;
        const list = results || [];
        setCachedResults(key, list);
        return list;
      });
  }

  global.SearchData = {
    searchRecords: searchRecords,
    getCachedResults: getCachedResults,
    setCachedResults: setCachedResults
  };
})(typeof window !== "undefined" ? window : this);
