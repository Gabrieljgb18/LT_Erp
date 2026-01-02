(function (global) {
  // Constantes y definiciones de campos para cada formato.
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  const FORM_DEFINITIONS = {
    CLIENTES: {
      title: "Registro de clientes",
      fields: [
        { id: "SECTION_DATOS", label: "Datos del cliente", type: "section", icon: "bi-building" },
        { id: "NOMBRE", label: "Nombre", type: "text", placeholder: "Nombre del cliente" },
        { id: "ESTADO", label: "Estado", type: "boolean", trueLabel: "Activo", falseLabel: "Inactivo" },
        { id: "RAZON SOCIAL", label: "Razón social", type: "text" },
        { id: "TIPO DOCUMENTO", label: "Tipo de documento", type: "docType" },
        { id: "NUMERO DOCUMENTO", label: "Número de documento", type: "docNumber", docTypeField: "TIPO DOCUMENTO", placeholder: "00-00000000-0" },
        {
          id: "TIPO SERVICIO",
          label: "Tipo de servicio",
          type: "select",
          options: ["Oficina", "Edificio", "Casa Particular", "Empresa", "Laboratorio", "Hospital"]
        },
        { id: "DESCRIPCION", label: "Descripción", type: "textarea", rows: 3, placeholder: "Descripción del servicio", full: true },
        { id: "ETIQUETAS", label: "Etiquetas", type: "tags", full: true, placeholder: "Agregar etiqueta..." },
        { id: "DIRECCION", label: "Dirección", type: "text", full: true },
        { id: "SECTION_ADMIN", label: "Administración y facturación", type: "section", icon: "bi-clipboard-check" },
        { id: "NOMBRE ADMINISTRADOR", label: "Administrador", type: "text", placeholder: "Nombre del administrador" },
        { id: "CORREO ADMINISTRACION", label: "Correo administración", type: "email" },
        { id: "TELEFONO ADMINISTRACION", label: "Teléfono administración", type: "phone" },
        { id: "CORREO FACTURACION", label: "Correo facturación", type: "email" },
        {
          id: "TIPO FACTURACION",
          label: "Tipo de facturación",
          type: "select",
          options: ["Recibo X", "Factura A", "Factura B"]
        },
        { id: "FECHA CONTRATO", label: "Fecha contrato", type: "date" },
        { id: "VALOR HORA", label: "Valor de hora", type: "number", step: "0.01" },
        { id: "SECTION_ENCARGADO", label: "Encargado en el lugar", type: "section", icon: "bi-person-badge" },
        {
          id: "TIENE ENCARGADO",
          label: "Tiene encargado",
          type: "boolean",
          trueLabel: "Sí",
          falseLabel: "No",
          defaultChecked: false
        },
        { id: "ENCARGADO", label: "Nombre encargado", type: "text" },
        { id: "TELEFONO", label: "Teléfono encargado", type: "phone" },
        { id: "SECTION_DIAS", label: "Días de servicio", type: "section", icon: "bi-calendar-week" },
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
        { id: "SECTION_DATOS", label: "Datos del empleado", type: "section", icon: "bi-person-badge" },
        { id: "ESTADO", label: "Estado", type: "boolean", trueLabel: "Activo" },
        { id: "EMPLEADO", label: "Empleado", type: "text", full: true },
        { id: "SECTION_DOC", label: "Documentación", type: "section", icon: "bi-card-text" },
        { id: "TIPO DOCUMENTO", label: "Tipo de documento", type: "docType" },
        { id: "NUMERO DOCUMENTO", label: "Número de documento", type: "docNumber", docTypeField: "TIPO DOCUMENTO", placeholder: "00-00000000-0" },
        { id: "SECTION_CONTACTO", label: "Contacto", type: "section", icon: "bi-telephone" },
        { id: "DIRECCION", label: "Dirección", type: "text", full: true },
        { id: "TELEFONO", label: "Teléfono", type: "phone" },
        { id: "SECTION_EMERGENCIA", label: "Contacto de emergencia", type: "section", icon: "bi-life-preserver" },
        { id: "CONTACTO EMERGENCIA NOMBRE", label: "Nombre", type: "text", full: true },
        { id: "CONTACTO EMERGENCIA VINCULO", label: "Vínculo", type: "text" },
        { id: "CONTACTO EMERGENCIA TELEFONO", label: "Teléfono", type: "phone" },
        { id: "SECTION_VIVIENDA", label: "Vivienda", type: "section", icon: "bi-house" },
        { id: "DESCRIPCION VIVIENDA", label: "Descripción de vivienda", type: "textarea", rows: 3, full: true },
        { id: "SECTION_PAGO", label: "Pago y condiciones", type: "section", icon: "bi-cash-coin" },
        { id: "CBU - ALIAS", label: "CBU / Alias", type: "text", full: true },
        { id: "VALOR DE HORA", label: "Valor de hora", type: "number", step: "0.01" },
        { id: "VIATICOS", label: "Viáticos", type: "number", step: "0.01" }
      ]
    },
    FACTURACION: {
      title: "Registro de facturación",
      fields: [
        { id: "ID_CLIENTE", label: "ID Cliente", type: "text", hidden: true },
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "COMPROBANTE", label: "Comprobante", type: "text" },
        { id: "NUMERO", label: "Número", type: "text" },
        { id: "RAZÓN SOCIAL", label: "Razón social", type: "cliente", full: true },
        { id: "CUIT", label: "CUIT", type: "docNumber", docTypeValue: "CUIT", placeholder: "00-00000000-0" },
        { id: "IMPORTE", label: "Importe", type: "number", step: "0.01" },
        { id: "SUBTOTAL", label: "Subtotal", type: "number", step: "0.01" },
        { id: "TOTAL", label: "Total", type: "number", step: "0.01" }
      ]
    },
    PAGOS_CLIENTES: {
      title: "Pagos de clientes",
      fields: [
        { id: "ID_CLIENTE", label: "ID Cliente", type: "text", hidden: true },
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "RAZÓN SOCIAL", label: "Razón social", type: "cliente", full: true },
        { id: "CUIT", label: "CUIT", type: "docNumber", docTypeValue: "CUIT", placeholder: "00-00000000-0" },
        { id: "DETALLE", label: "Detalle", type: "text", full: true },
        { id: "N° COMPROBANTE", label: "Nº comprobante", type: "text" },
        {
          id: "MEDIO DE PAGO",
          label: "Medio de pago",
          type: "select",
          options: ["Uala", "Mercado Pago", "Efectivo", "Santander"]
        },
        { id: "MONTO", label: "Monto", type: "number", step: "0.01" },
        { id: "ID_FACTURA", label: "ID Factura", type: "text", hidden: true },
        { id: "FACTURA_NUMERO", label: "Factura número", type: "text" }
      ]
    },
    ASISTENCIA_PLAN: {
      title: "Plan de asistencia semanal",
      fields: [
        { id: "ID_CLIENTE", label: "ID Cliente", type: "text", hidden: true },
        { id: "ID_EMPLEADO", label: "ID Empleado", type: "text", hidden: true },
        { id: "CLIENTE", label: "Cliente", type: "cliente", full: true },
        { id: "EMPLEADO", label: "Empleado", type: "empleado", full: true },
        { id: "DIA SEMANA", label: "Día de la semana", type: "select", options: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] },
        { id: "HORA ENTRADA", label: "Hora de entrada", type: "time" },
        { id: "HORAS PLAN", label: "Horas planificadas", type: "number", step: "0.5" },
        { id: "VIGENTE DESDE", label: "Vigente desde", type: "date" },
        { id: "VIGENTE HASTA", label: "Vigente hasta", type: "date" },
        { id: "OBSERVACIONES", label: "Observaciones", type: "textarea", full: true }
      ]
    },
    ASISTENCIA: {
      title: "Registro de asistencia",
      fields: [
        { id: "ID_EMPLEADO", label: "ID Empleado", type: "text", hidden: true },
        { id: "ID_CLIENTE", label: "ID Cliente", type: "text", hidden: true },
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "EMPLEADO", label: "Empleado", type: "empleado", full: true },
        { id: "CLIENTE", label: "Cliente", type: "cliente", full: true },
        { id: "ASISTENCIA", label: "Asistencia", type: "boolean", trueLabel: "Presente" },
        { id: "HORAS", label: "Horas trabajadas", type: "number", step: "0.5" },
        { id: "OBSERVACIONES", label: "Observaciones", type: "textarea", full: true }
      ]
    },
    ADELANTOS: {
      title: "Registro de adelantos",
      fields: [
        { id: "ID_EMPLEADO", label: "ID Empleado", type: "text", hidden: true },
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "EMPLEADO", label: "Empleado", type: "empleado", full: true },
        { id: "MONTO", label: "Monto", type: "number", step: "0.01" },
        { id: "OBSERVACION", label: "Observación", type: "textarea", full: true }
      ]
    }
  };

  global.CACHE_TTL_MS = CACHE_TTL_MS;
  global.FORM_DEFINITIONS = FORM_DEFINITIONS;
})(typeof window !== "undefined" ? window : this);
