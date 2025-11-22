const Formats = (function () {

  const FORMAT_TEMPLATES = {
    CLIENTES: {
      id: 'CLIENTES',
      displayName: 'Clientes',
      headers: [
        'ID',
        'NOMBRE',
        'ESTADO',
        'RAZON SOCIAL',
        'CUIT',
        'ENCARGADO',
        'TELEFONO',
        'DIRECCION',
        'CORREO ADMINISTRACION',
        'CORREO FACTURACION',
        'FECHA CONTRATO',
        'VALOR DE HORA',
        'LUNES HS',
        'MARTES HS',
        'MIERCOLES HS',
        'JUEVES HS',
        'VIERNES HS',
        'SABADO HS',
        'DOMINGO HS'
      ],
      // Anchos aproximados, luego los ajustamos si hace falta
      columnWidths: [
        60,  // ID
        150, // NOMBRE
        100, // ESTADO
        200, // RAZON SOCIAL
        120, // CUIT
        150, // ENCARGADO
        120, // TELEFONO
        200, // DIRECCION
        200, // CORREO ADMINISTRACION
        200, // CORREO FACTURACION
        120, // FECHA CONTRATO
        120, // VALOR DE HORA
        90,  // LUNES HS
        90,  // MARTES HS
        90,  // MIERCOLES HS
        90,  // JUEVES HS
        90,  // VIERNES HS
        90,  // SABADO HS
        90   // DOMINGO HS
      ],
      freezeRows: 1
    },


    EMPLEADOS: {
      id: 'EMPLEADOS',
      displayName: 'Empleados',
      headers: [
        'ID',
        'ESTADO',
        'EMPLEADO',
        'CUIL',
        'DIRECCCION',
        'TELEFONO',
        'CONTACTO DE EMERGENCIA',
        'CBU - ALIAS',
        'DNI',
        'VALOR DE HORA'
      ],
      columnWidths: [60, 100, 180, 120, 220, 120, 200, 160, 100, 120],
      freezeRows: 1
    },


    FACTURACION: {
      id: 'FACTURACION',
      displayName: 'Facturación',
      headers: [
        'ID',
        'FECHA',
        'COMPROBANTE',
        'NÚMERO',
        'RAZÓN SOCIAL',
        'CUIT',
        'IMPORTE',
        'SUBTOTAL',
        'TOTAL'
      ],
      columnWidths: [60, 100, 140, 120, 220, 120, 100, 100, 100],
      freezeRows: 1
    },

    PAGOS: {
      id: 'PAGOS',
      displayName: 'Pagos',
      headers: [
        'ID',
        'FECHA',
        'RAZÓN SOCIAL',
        'CUIT',
        'DETALLE',
        'Nº COMPROBANTE',
        'MEDIO DE PAGO',
        'MONTO'
      ],
      columnWidths: [60, 100, 220, 120, 220, 140, 140, 100],
      freezeRows: 1
    },

    ASISTENCIA: {
      id: 'ASISTENCIA',
      displayName: 'Registro de asistencia',
      headers: [
        'ID',
        'EMPLEADO',
        'CLIENTE',
        'FECHA',
        'ASISTENCIA',
        'HORAS',
        'OBSERVACIONES'
      ],
      columnWidths: [60, 180, 180, 100, 120, 80, 250],
      freezeRows: 1
    },

    ASISTENCIA_PLAN: {
      id: 'ASISTENCIA_PLAN',
      displayName: 'Plan de asistencia semanal',
      headers: [
        'ID',
        'CLIENTE',
        'EMPLEADO',
        'DIA SEMANA',
        'HORA ENTRADA',
        'HORAS PLAN',
        'ACTIVO',
        'OBSERVACIONES'
      ],
      columnWidths: [60, 180, 180, 120, 100, 90, 80, 220],
      freezeRows: 1
    },


  };

  function getAvailableFormats() {
    return Object.keys(FORMAT_TEMPLATES).map(key => {
      const tpl = FORMAT_TEMPLATES[key];
      return {
        id: tpl.id,
        name: tpl.displayName
      };
    });
  }

  function getFormatTemplate(tipoFormato) {
    return FORMAT_TEMPLATES[tipoFormato] || null;
  }

  // Exponemos solo lo necesario
  return {
    getAvailableFormats: getAvailableFormats,
    getFormatTemplate: getFormatTemplate
  };

})();
