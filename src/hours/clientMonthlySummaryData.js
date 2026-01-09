/**
 * ClientMonthlySummaryPanelData
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function ensureReference() {
    return global.ReferenceService && typeof global.ReferenceService.get === "function";
  }

  function fetchSummary(year, month) {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("getMonthlySummaryByClient", Number(year), Number(month));
  }

  function getClientLabelById(idCliente) {
    const idStr = String(idCliente || "").trim();
    if (!idStr || !ensureReference()) return "";
    const refs = global.ReferenceService.get();
    const clientes = refs && refs.clientes ? refs.clientes : [];
    const match = clientes.find((c) => c && typeof c === "object" && String(c.id || "").trim() === idStr);
    if (!match) return "";
    if (global.DomainHelpers && typeof global.DomainHelpers.getClientLabel === "function") {
      return global.DomainHelpers.getClientLabel(match);
    }
    return match.nombre || match.razonSocial || "";
  }

  global.ClientMonthlySummaryPanelData = {
    fetchSummary: fetchSummary,
    getClientLabelById: getClientLabelById
  };
})(typeof window !== "undefined" ? window : this);
