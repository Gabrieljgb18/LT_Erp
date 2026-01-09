/**
 * HoursDetailPanelState
 * Estado y helpers del panel de detalle de horas.
 */
(function (global) {
  const state = {
    containerId: "hours-detail-panel",
    employeeIdMap: new Map(),
    eventsController: null,
    lastResults: [],
    lastSummary: null,
    lastFilters: null,
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null,
    formatEmployeeLabel: function (emp) {
      if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getEmployeeLabel === "function") {
        return DomainHelpers.getEmployeeLabel(emp);
      }
      if (!emp) return "";
      if (typeof emp === "string") return emp;
      return (emp.nombre || emp.displayName || emp.empleado || emp.label || "").toString().trim();
    }
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
        let label = state.formatEmployeeLabel(emp);
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

  global.HoursDetailPanelState = state;
})(typeof window !== "undefined" ? window : this);
