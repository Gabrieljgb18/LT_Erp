/**
 * MonthlySummaryPanelData
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function fetchSummary(year, month) {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("getMonthlySummary", Number(year), Number(month));
  }

  global.MonthlySummaryPanelData = {
    fetchSummary: fetchSummary
  };
})(typeof window !== "undefined" ? window : this);
