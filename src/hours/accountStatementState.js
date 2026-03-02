/**
 * AccountStatementPanelState
 */
(function (global) {
  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function sanitizeLabelName(label, idStr) {
    if (!label) return "";
    let text = String(label);
    if (idStr) {
      const esc = escapeRegExp(idStr);
      text = text.replace(new RegExp(`\\s*\\(#\\s*${esc}\\s*\\)\\s*`, "g"), " ");
      text = text.replace(new RegExp(`\\s*#\\s*${esc}\\b`, "g"), " ");
    }
    return text.replace(/\s+/g, " ").trim();
  }

  function extractId(label) {
    if (!label) return "";
    if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
      const extracted = DomainHelpers.extractIdFromLabel(label);
      if (extracted) return extracted;
    }
    const str = String(label);
    const hashMatch = str.match(/#\s*([A-Za-z0-9_-]+)/);
    if (hashMatch) return hashMatch[1].trim();
    const idMatch = str.match(/ID\s*:\s*([^|)]+)/i);
    if (idMatch) return idMatch[1].trim();
    const plain = str.trim();
    if (/^\d+$/.test(plain)) return plain;
    return "";
  }

  const state = {
    containerId: "account-statement-panel",
    defaultPaymentMethods: ["Uala", "Mercado Pago", "Efectivo", "Santander"],
    employeeIdMap: new Map(),
    eventsController: null,
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null
  };

  state.getPaymentMethods = function () {
    if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.getOptions === "function") {
      const list = DropdownConfig.getOptions("MEDIO DE PAGO", state.defaultPaymentMethods);
      if (Array.isArray(list) && list.length) return list;
    }
    return state.defaultPaymentMethods.slice();
  };

  state.setEmployeeMap = function (employees) {
    const list = Array.isArray(employees) ? employees.slice() : [];
    state.employeeIdMap = new Map();
    const labels = list
      .map((emp) => {
        if (!emp || typeof emp !== "object") return "";
        const id = emp.id || emp.ID || emp.ID_EMPLEADO;
        const idStr = id != null ? String(id).trim() : "";
        if (!idStr) return "";
        let label = (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getEmployeeLabel === "function")
          ? DomainHelpers.getEmployeeLabel(emp)
          : (emp.nombre || emp.empleado || "");
        label = label != null ? String(label).trim() : "";
        const base = sanitizeLabelName(label, idStr);
        label = base ? `${base} (#${idStr})` : `#${idStr}`;
        state.employeeIdMap.set(label, idStr);
        return label;
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es"));
    return labels;
  };

  state.getEmployeeIdFromLabel = function (label) {
    if (!label) return "";
    const labelStr = String(label).trim();
    if (state.employeeIdMap && state.employeeIdMap.has(labelStr)) {
      return state.employeeIdMap.get(labelStr);
    }
    return extractId(labelStr);
  };

  global.AccountStatementPanelState = state;
})(typeof window !== "undefined" ? window : this);
