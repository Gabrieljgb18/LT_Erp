/**
 * ClientMonthlySummaryPanelState
 */
(function (global) {
  const state = {
    containerId: "client-monthly-summary-panel",
    eventsController: null,
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null,
    formatClientLabel: (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getClientLabel === "function")
      ? DomainHelpers.getClientLabel
      : function (cli) {
          return cli == null ? "" : String(cli);
        }
  };

  state.buildFallbackClientLabel = function (nombre, idCliente) {
    const name = String(nombre || "").trim();
    const id = String(idCliente || "").trim();
    if (!name && !id) return "";
    if (!id) return name;
    return name ? `${name} (ID: ${id})` : `ID: ${id}`;
  };

  global.ClientMonthlySummaryPanelState = state;
})(typeof window !== "undefined" ? window : this);
