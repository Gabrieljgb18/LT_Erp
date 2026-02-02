/**
 * ClientAccountPanelState
 * Estado y helpers de cuenta corriente clientes.
 */
(function (global) {
  const state = {
    containerId: "client-account-panel",
    clientIdMap: new Map(),
    lastQuery: null,
    eventsController: null,
    defaultPaymentMethods: ["Uala", "Mercado Pago", "Efectivo", "Santander"],
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null,
    formatClientLabel: (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getClientLabel === "function")
      ? DomainHelpers.getClientLabel
      : function (cli) {
        return cli == null ? "" : String(cli);
      }
  };

  state.setClientMap = function (clients) {
    state.clientIdMap = new Map();
    const list = Array.isArray(clients) ? clients.slice() : [];
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

  state.getPaymentMethods = function () {
    if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.getOptions === "function") {
      const list = DropdownConfig.getOptions("MEDIO DE PAGO", state.defaultPaymentMethods);
      if (Array.isArray(list) && list.length) return list;
    }
    return state.defaultPaymentMethods.slice();
  };

  global.ClientAccountPanelState = state;
})(typeof window !== "undefined" ? window : this);
