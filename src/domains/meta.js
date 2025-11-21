(function (global) {
  // Metadata y helpers por formato (CLIENTES, EMPLEADOS, etc.)
  const DEFAULTS = {
    entity: "registro",
    label: function (record) {
      return "";
    },
    refreshReference: false
  };

  const META_BY_FORMAT = {
    CLIENTES: {
      entity: "cliente",
      label: function (record) {
        return record["NOMBRE"] || "";
      },
      refreshReference: true
    },
    EMPLEADOS: {
      entity: "empleado",
      label: function (record) {
        return record["EMPLEADO"] || "";
      },
      refreshReference: true
    },
    FACTURACION: {
      entity: "comprobante",
      label: function (record) {
        return (
          record["COMPROBANTE"] ||
          record["NÚMERO"] ||
          record["RAZÓN SOCIAL"] ||
          ""
        );
      }
    },
    PAGOS: {
      entity: "pago",
      label: function (record) {
        return record["RAZÓN SOCIAL"] || "";
      }
    },
    ASISTENCIA: {
      entity: "registro de asistencia",
      label: function (record) {
        return record["EMPLEADO"] || record["CLIENTE"] || "";
      }
    },
    ASISTENCIA_PLAN: {
      entity: "plan de asistencia",
      label: function (record) {
        return record["EMPLEADO"] || record["CLIENTE"] || "";
      }
    }
  };

  function getMeta(format) {
    return META_BY_FORMAT[format] || DEFAULTS;
  }

  global.DomainMeta = {
    getMeta
  };
})(typeof window !== "undefined" ? window : this);
