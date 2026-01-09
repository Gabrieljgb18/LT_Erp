/**
 * AccountStatementPanelState
 */
(function (global) {
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
        if (!label) label = `#${idStr}`;
        if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
          if (!DomainHelpers.extractIdFromLabel(label)) {
            label = `${label} (#${idStr})`;
          }
        }
        state.employeeIdMap.set(label, idStr);
        return label;
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es"));
    return labels;
  };

  state.getEmployeeIdFromLabel = function (label) {
    if (!label) return "";
    if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
      const extracted = DomainHelpers.extractIdFromLabel(label);
      if (extracted) return extracted;
    }
    const plain = String(label).trim();
    if (/^\\d+$/.test(plain)) return plain;
    return "";
  };

  global.AccountStatementPanelState = state;
})(typeof window !== "undefined" ? window : this);
