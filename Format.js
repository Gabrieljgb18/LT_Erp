var Formats = (function () {

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
        'NOMBRE ADMINISTRADOR',
        'DESCRIPCION',
        'ETIQUETAS',
        'TIPO SERVICIO',
        'TIENE ENCARGADO',
        'ENCARGADO',
        'TELEFONO',
        'DIRECCION',
        'CORREO ADMINISTRACION',
        'CORREO FACTURACION',
        'TIPO FACTURACION',
        'FECHA CONTRATO',
        'VALOR HORA',
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
        180, // NOMBRE ADMINISTRADOR
        240, // DESCRIPCION
        200, // ETIQUETAS
        140, // TIPO SERVICIO
        120, // TIENE ENCARGADO
        150, // ENCARGADO
        120, // TELEFONO
        200, // DIRECCION
        200, // CORREO ADMINISTRACION
        200, // CORREO FACTURACION
        140, // TIPO FACTURACION
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
        'DIRECCION',
        'TELEFONO',
        'CONTACTO DE EMERGENCIA',
        'CBU - ALIAS',
        'DNI',
        'VALOR DE HORA',
        'VIATICOS'
      ],
      columnWidths: [60, 100, 180, 120, 220, 120, 200, 160, 100, 120, 110],
      freezeRows: 1
    },


    FACTURACION: {
      id: 'FACTURACION',
      displayName: 'Facturación',
      headers: [
        'ID',
        'ID_CLIENTE',
        'FECHA',
        'PERIODO',
        'COMPROBANTE',
        'NUMERO',
        'RAZÓN SOCIAL',
        'CUIT',
        'CONCEPTO',
        'HORAS',
        'VALOR HORA',
        'IMPORTE',
        'SUBTOTAL',
        'TOTAL',
        'ESTADO',
        'OBSERVACIONES'
      ],
      columnWidths: [60, 60, 100, 80, 140, 120, 220, 120, 200, 80, 100, 100, 100, 100, 100, 250],
      freezeRows: 1
    },

    PAGOS_CLIENTES: {
      id: 'PAGOS_CLIENTES',
      displayName: 'Pagos de clientes',
      headers: [
        'ID',
        'ID_CLIENTE',
        'FECHA',
        'RAZÓN SOCIAL',
        'CUIT',
        'DETALLE',
        'N° COMPROBANTE',
        'MEDIO DE PAGO',
        'MONTO',
        'ID_FACTURA',
        'FACTURA_NUMERO'
      ],
      columnWidths: [60, 90, 100, 220, 120, 220, 140, 140, 100, 90, 140],
      freezeRows: 1
    },

    ASISTENCIA: {
      id: 'ASISTENCIA',
      displayName: 'Registro de asistencia',
      headers: [
        'ID',
        'ID_EMPLEADO',
        'EMPLEADO',
        'ID_CLIENTE',
        'CLIENTE',
        'FECHA',
        'ASISTENCIA',
        'HORAS',
        'OBSERVACIONES'
      ],
      columnWidths: [60, 100, 180, 100, 180, 100, 120, 80, 250],
      freezeRows: 1
    },


    ASISTENCIA_PLAN: {
      id: 'ASISTENCIA_PLAN',
      displayName: 'Plan de asistencia semanal',
      headers: [
        'ID',
        'ID_CLIENTE',
        'CLIENTE',
        'ID_EMPLEADO',
        'EMPLEADO',
        'DIA SEMANA',
        'HORA ENTRADA',
        'HORAS PLAN',
        'OBSERVACIONES',
        'VIGENTE DESDE',
        'VIGENTE HASTA'
      ],
      columnWidths: [60, 90, 180, 90, 180, 120, 100, 90, 220, 110, 110],
      freezeRows: 1
    },

    ADELANTOS: {
      id: 'ADELANTOS',
      displayName: 'Adelantos de sueldo',
      headers: [
        'ID',
        'ID_EMPLEADO',
        'FECHA',
        'EMPLEADO',
        'MONTO',
        'OBSERVACION'
      ],
      columnWidths: [60, 90, 100, 200, 120, 250],
      freezeRows: 1
    }

  };

  function getAvailableFormats() {
    return Object.keys(FORMAT_TEMPLATES)
      .filter(key => key !== 'FACTURACION')
      .map(key => {
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
