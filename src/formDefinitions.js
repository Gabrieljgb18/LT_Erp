(function (global) {
  // Constantes y definiciones de campos para cada formato.
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  const FORM_DEFINITIONS = {
    CLIENTES: {
      title: "Registro de clientes",
      fields: [
        { id: "NOMBRE", label: "Nombre", type: "text", placeholder: "Nombre del cliente" },
        { id: "ESTADO", label: "Estado", type: "boolean", trueLabel: "Activo" },
        { id: "RAZON SOCIAL", label: "Razón social", type: "text" },
        { id: "CUIT", label: "CUIT", type: "text" },
        { id: "ENCARGADO", label: "Encargado", type: "text" },
        { id: "TELEFONO", label: "Teléfono", type: "phone" },
        { id: "DIRECCION", label: "Dirección", type: "text", full: true },
        { id: "CORREO ADMINISTRACION", label: "Correo administración", type: "email" },
        { id: "CORREO FACTURACION", label: "Correo facturación", type: "email" },
        { id: "FECHA CONTRATO", label: "Fecha contrato", type: "date" },
        { id: "VALOR HORA", label: "Valor de hora", type: "number", step: "0.01" },
        { id: "LUNES HS", label: "Horas lunes", type: "number", step: "0.5" },
        { id: "MARTES HS", label: "Horas martes", type: "number", step: "0.5" },
        { id: "MIERCOLES HS", label: "Horas miércoles", type: "number", step: "0.5" },
        { id: "JUEVES HS", label: "Horas jueves", type: "number", step: "0.5" },
        { id: "VIERNES HS", label: "Horas viernes", type: "number", step: "0.5" },
        { id: "SABADO HS", label: "Horas sábado", type: "number", step: "0.5" },
        { id: "DOMINGO HS", label: "Horas domingo", type: "number", step: "0.5" }
      ]
    },
    EMPLEADOS: {
      title: "Registro de empleados",
      fields: [
        { id: "ESTADO", label: "Estado", type: "boolean", trueLabel: "Activo" },
        { id: "EMPLEADO", label: "Empleado", type: "text", full: true },
        { id: "CUIL", label: "CUIL", type: "text" },
        { id: "DIRECCION", label: "Dirección", type: "text", full: true },
        { id: "TELEFONO", label: "Teléfono", type: "phone" },
        { id: "CONTACTO DE EMERGENCIA", label: "Contacto de emergencia", type: "phone", full: true },
        { id: "CBU - ALIAS", label: "CBU / Alias", type: "text", full: true },
        { id: "DNI", label: "DNI", type: "dni" },
        { id: "VALOR DE HORA", label: "Valor de hora", type: "number", step: "0.01" }
      ]
    },
    FACTURACION: {
      title: "Registro de facturación",
      fields: [
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "COMPROBANTE", label: "Comprobante", type: "text" },
        { id: "NUMERO", label: "Número", type: "text" },
        { id: "RAZÓN SOCIAL", label: "Razón social", type: "cliente", full: true },
        { id: "CUIT", label: "CUIT", type: "text" },
        { id: "IMPORTE", label: "Importe", type: "number", step: "0.01" },
        { id: "SUBTOTAL", label: "Subtotal", type: "number", step: "0.01" },
        { id: "TOTAL", label: "Total", type: "number", step: "0.01" }
      ]
    },
    PAGOS: {
      title: "Registro de pagos",
      fields: [
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "RAZÓN SOCIAL", label: "Razón social", type: "cliente", full: true },
        { id: "CUIT", label: "CUIT", type: "text" },
        { id: "DETALLE", label: "Detalle", type: "text", full: true },
        { id: "N° COMPROBANTE", label: "Nº comprobante", type: "text" },
        { id: "MEDIO DE PAGO", label: "Medio de pago", type: "text" },
        { id: "MONTO", label: "Monto", type: "number", step: "0.01" }
      ]
    },
    ASISTENCIA_PLAN: {
      title: "Plan de asistencia semanal",
      fields: [{ id: "CLIENTE", label: "Cliente", type: "cliente", full: true }]
    },
    ASISTENCIA: {
      title: "Registro de asistencia",
      fields: [{ id: "FECHA", label: "Fecha", type: "date" }]
    }
  };

  global.CACHE_TTL_MS = CACHE_TTL_MS;
  global.FORM_DEFINITIONS = FORM_DEFINITIONS;
})(typeof window !== "undefined" ? window : this);
