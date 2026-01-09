(function (global) {
  function normalizeToken(val) {
    return String(val || "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function preferRazonSocial(field) {
    if (!field) return false;
    const idToken = normalizeToken(field.id);
    const labelToken = normalizeToken(field.label);
    return idToken.indexOf("RAZON") > -1 || labelToken.indexOf("RAZON") > -1;
  }

  function getClientOptions(field, referenceData) {
    const clients = (referenceData && referenceData.clientes) || [];
    const preferRazon = preferRazonSocial(field);
    return clients.map((cli) => {
      const label = (global.DomainHelpers && typeof global.DomainHelpers.getClientDisplayName === "function")
        ? global.DomainHelpers.getClientDisplayName(cli, { preferRazon: preferRazon })
        : (global.HtmlHelpers && typeof global.HtmlHelpers.getClientDisplayName === "function")
          ? global.HtmlHelpers.getClientDisplayName(cli, { preferRazon: preferRazon })
          : (cli.nombre || cli.razonSocial || "");
      return {
        value: label,
        label: label,
        dataset: {
          id: cli.id != null ? String(cli.id) : "",
          cuit: cli.cuit || ""
        }
      };
    });
  }

  function getEmployeeOptions(referenceData) {
    const employees = (referenceData && referenceData.empleados) || [];
    return employees.map((emp) => {
      const label = typeof emp === "string"
        ? emp
        : (emp.nombre || emp.empleado || emp.label || "");
      return {
        value: label,
        label: label,
        dataset: {
          id: emp && typeof emp === "object" && emp.id != null ? String(emp.id) : ""
        }
      };
    });
  }

  function getSelectOptions(field) {
    const defaults = field && Array.isArray(field.options) ? field.options : [];
    if (global.DropdownConfig && typeof global.DropdownConfig.getOptions === "function") {
      return global.DropdownConfig.getOptions(field.id, defaults);
    }
    return defaults;
  }

  function getDocTypeOptions(field) {
    const fallback = field && field.options ? field.options : ["DNI", "CUIL", "CUIT"];
    if (global.DropdownConfig && typeof global.DropdownConfig.getOptions === "function") {
      return global.DropdownConfig.getOptions(field.id, fallback);
    }
    return fallback;
  }

  global.FormRendererData = {
    getClientOptions: getClientOptions,
    getEmployeeOptions: getEmployeeOptions,
    getSelectOptions: getSelectOptions,
    getDocTypeOptions: getDocTypeOptions
  };
})(typeof window !== "undefined" ? window : this);
