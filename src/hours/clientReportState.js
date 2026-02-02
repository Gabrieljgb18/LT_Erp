/**
 * ClientReportPanelState
 * Estado y helpers del reporte de clientes.
 */
(function (global) {
  const state = {
    containerId: "client-report-panel",
    lastRows: [],
    clientIdMap: new Map(),
    eventsController: null,
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null,
    formatClientLabel: (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getClientLabel === "function")
      ? DomainHelpers.getClientLabel
      : function (cli) {
        return cli == null ? "" : String(cli);
      }
  };

  state.setClientMap = function (clients) {
    const list = Array.isArray(clients) ? clients.slice() : [];
    state.clientIdMap = new Map();
    const labels = list
      .map((cli) => {
        if (!cli || typeof cli !== "object") return null;
        const id = cli.id != null ? String(cli.id).trim() : "";
        if (!id) return null;
        let label = state.formatClientLabel(cli);
        label = label != null ? String(label).trim() : "";
        if (!label) label = `ID: ${id}`;
        if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
          if (!DomainHelpers.extractIdFromLabel(label)) {
            label = `${label} (ID: ${id})`;
          }
        }
        state.clientIdMap.set(label, id);
        return { raw: cli, label: label };
      })
      .filter((item) => item && item.label)
      .sort((a, b) => a.label.localeCompare(b.label, "es"));

    return labels.map((item) => item.label);
  };

  state.getClientIdFromLabel = function (label) {
    if (!label) return "";

    // Primero buscar en el mapa (fuente de verdad)
    const labelStr = String(label).trim();
    if (state.clientIdMap.has(labelStr)) {
      return state.clientIdMap.get(labelStr);
    }

    // Fallback: intentar extraer del label
    if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
      const extracted = DomainHelpers.extractIdFromLabel(label);
      if (extracted) return extracted;
    }

    // Fallback: si es un número puro, usarlo
    const plain = String(label).trim();
    if (/^\\d+$/.test(plain)) return plain;

    return "";
  };

  global.ClientReportPanelState = state;
})(typeof window !== "undefined" ? window : this);
