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
        'TIPO DOCUMENTO',
        'NUMERO DOCUMENTO',
        'NOMBRE ADMINISTRADOR',
        'DESCRIPCION',
        'ETIQUETAS',
        'TIPO SERVICIO',
        'TIENE ENCARGADO',
        'ENCARGADO',
        'TELEFONO',
        'DIRECCION',
        'CORREO ADMINISTRACION',
        'TELEFONO ADMINISTRACION',
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
        'DOMINGO HS',
        'MAPS PLACE ID',
        'MAPS LAT',
        'MAPS LNG'
      ],
      schema: {
        fields: {
          'ID': { type: 'number', readOnly: true },
          'NOMBRE': { type: 'string', required: true, maxLength: 120, collapseSpaces: true },
          'ESTADO': { type: 'boolean' },
          'RAZON SOCIAL': { type: 'string', maxLength: 200, collapseSpaces: true },
          'TIPO DOCUMENTO': { type: 'string', enum: ['DNI', 'CUIL', 'CUIT', ''] },
          'NUMERO DOCUMENTO': { type: 'string', maxLength: 30 },
          'NOMBRE ADMINISTRADOR': { type: 'string', maxLength: 120, collapseSpaces: true },
          'DESCRIPCION': { type: 'string', maxLength: 500 },
          'ETIQUETAS': { type: 'string', maxLength: 500 },
          'TIPO SERVICIO': { type: 'string', enum: ['Oficina', 'Edificio', 'Casa Particular', 'Empresa', 'Laboratorio', 'Hospital', ''] },
          'TIENE ENCARGADO': { type: 'boolean' },
          'ENCARGADO': { type: 'string', maxLength: 120, collapseSpaces: true },
          'TELEFONO': { type: 'string', maxLength: 40, format: 'phone' },
          'DIRECCION': { type: 'string', maxLength: 200, collapseSpaces: true },
          'CORREO ADMINISTRACION': { type: 'string', maxLength: 120, format: 'email' },
          'TELEFONO ADMINISTRACION': { type: 'string', maxLength: 40, format: 'phone' },
          'CORREO FACTURACION': { type: 'string', maxLength: 120, format: 'email' },
          'TIPO FACTURACION': { type: 'string', enum: ['Recibo X', 'Factura A', 'Factura B', ''] },
          'FECHA CONTRATO': { type: 'date' },
          'VALOR HORA': { type: 'number', min: 0 },
          'LUNES HS': { type: 'number', min: 0, max: 24 },
          'MARTES HS': { type: 'number', min: 0, max: 24 },
          'MIERCOLES HS': { type: 'number', min: 0, max: 24 },
          'JUEVES HS': { type: 'number', min: 0, max: 24 },
          'VIERNES HS': { type: 'number', min: 0, max: 24 },
          'SABADO HS': { type: 'number', min: 0, max: 24 },
          'DOMINGO HS': { type: 'number', min: 0, max: 24 },
          'MAPS PLACE ID': { type: 'string', maxLength: 200 },
          'MAPS LAT': { type: 'number', min: -90, max: 90 },
          'MAPS LNG': { type: 'number', min: -180, max: 180 }
        }
      },
      // Anchos aproximados, luego los ajustamos si hace falta
      columnWidths: [
        60,  // ID
        150, // NOMBRE
        100, // ESTADO
        200, // RAZON SOCIAL
        120, // TIPO DOCUMENTO
        160, // NUMERO DOCUMENTO
        180, // NOMBRE ADMINISTRADOR
        240, // DESCRIPCION
        200, // ETIQUETAS
        140, // TIPO SERVICIO
        120, // TIENE ENCARGADO
        150, // ENCARGADO
        120, // TELEFONO
        200, // DIRECCION
        200, // CORREO ADMINISTRACION
        150, // TELEFONO ADMINISTRACION
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
        90,  // DOMINGO HS
        220, // MAPS PLACE ID
        120, // MAPS LAT
        120  // MAPS LNG
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
        'TIPO DOCUMENTO',
        'NUMERO DOCUMENTO',
        'DIRECCION',
        'TELEFONO',
        'CONTACTO EMERGENCIA NOMBRE',
        'CONTACTO EMERGENCIA TELEFONO',
        'CONTACTO EMERGENCIA VINCULO',
        'DESCRIPCION VIVIENDA',
        'CBU - ALIAS',
        'VALOR DE HORA',
        'VIATICOS',
        'MAPS PLACE ID',
        'MAPS LAT',
        'MAPS LNG'
      ],
      schema: {
        fields: {
          'ID': { type: 'number', readOnly: true },
          'ESTADO': { type: 'boolean' },
          'EMPLEADO': { type: 'string', required: true, maxLength: 120, collapseSpaces: true },
          'TIPO DOCUMENTO': { type: 'string', enum: ['DNI', 'CUIL', 'CUIT', ''] },
          'NUMERO DOCUMENTO': { type: 'string', maxLength: 30 },
          'DIRECCION': { type: 'string', maxLength: 200, collapseSpaces: true },
          'TELEFONO': { type: 'string', maxLength: 40, format: 'phone' },
          'CONTACTO EMERGENCIA NOMBRE': { type: 'string', maxLength: 120, collapseSpaces: true },
          'CONTACTO EMERGENCIA TELEFONO': { type: 'string', maxLength: 40, format: 'phone' },
          'CONTACTO EMERGENCIA VINCULO': { type: 'string', maxLength: 80 },
          'DESCRIPCION VIVIENDA': { type: 'string', maxLength: 400 },
          'CBU - ALIAS': { type: 'string', maxLength: 40 },
          'VALOR DE HORA': { type: 'number', min: 0 },
          'VIATICOS': { type: 'number', min: 0 },
          'MAPS PLACE ID': { type: 'string', maxLength: 200 },
          'MAPS LAT': { type: 'number', min: -90, max: 90 },
          'MAPS LNG': { type: 'number', min: -180, max: 180 }
        }
      },
      columnWidths: [60, 100, 180, 120, 160, 220, 120, 200, 150, 160, 240, 160, 120, 110, 220, 120, 120],
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
      schema: {
        fields: {
          'ID': { type: 'number', readOnly: true },
          'ID_CLIENTE': { type: 'number', required: true },
          'FECHA': { type: 'date', required: true },
          'PERIODO': { type: 'string', maxLength: 20 },
          'COMPROBANTE': { type: 'string', maxLength: 40 },
          'NUMERO': { type: 'string', maxLength: 40 },
          'RAZÓN SOCIAL': { type: 'string', required: true, maxLength: 200, collapseSpaces: true },
          'CUIT': { type: 'string', maxLength: 20 },
          'CONCEPTO': { type: 'string', maxLength: 200 },
          'HORAS': { type: 'number', min: 0 },
          'VALOR HORA': { type: 'number', min: 0 },
          'IMPORTE': { type: 'number', min: 0 },
          'SUBTOTAL': { type: 'number', min: 0 },
          'TOTAL': { type: 'number', min: 0 },
          'ESTADO': { type: 'string', enum: ['Pendiente', 'Pagada', 'Anulada', ''] },
          'OBSERVACIONES': { type: 'string', maxLength: 500 }
        }
      },
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
      schema: {
        fields: {
          'ID': { type: 'number', readOnly: true },
          'ID_CLIENTE': { type: 'number', required: true },
          'FECHA': { type: 'date', required: true },
          'RAZÓN SOCIAL': { type: 'string', required: true, maxLength: 200, collapseSpaces: true },
          'CUIT': { type: 'string', maxLength: 20 },
          'DETALLE': { type: 'string', maxLength: 200 },
          'N° COMPROBANTE': { type: 'string', maxLength: 40 },
          'MEDIO DE PAGO': { type: 'string', maxLength: 60 },
          'MONTO': { type: 'number', min: 0, required: true },
          'ID_FACTURA': { type: 'number' },
          'FACTURA_NUMERO': { type: 'string', maxLength: 40 }
        }
      },
      columnWidths: [60, 90, 100, 220, 120, 220, 140, 140, 100, 90, 140],
      freezeRows: 1
    },

    GASTOS: {
      id: 'GASTOS',
      displayName: 'Gastos',
      headers: [
        'ID',
        'FECHA',
        'CATEGORIA',
        'DETALLE',
        'PROVEEDOR',
        'MEDIO DE PAGO',
        'MONTO',
        'COMPROBANTE',
        'OBSERVACIONES'
      ],
      schema: {
        fields: {
          'ID': { type: 'number', readOnly: true },
          'FECHA': { type: 'date', required: true },
          'CATEGORIA': { type: 'string', required: true, enum: ['Servicios', 'Insumos', 'Transporte', 'Impuestos', 'Administración', 'Mantenimiento', 'Otros', ''] },
          'DETALLE': { type: 'string', maxLength: 200 },
          'PROVEEDOR': { type: 'string', maxLength: 120 },
          'MEDIO DE PAGO': { type: 'string', maxLength: 60 },
          'MONTO': { type: 'number', min: 0, required: true },
          'COMPROBANTE': { type: 'string', maxLength: 40 },
          'OBSERVACIONES': { type: 'string', maxLength: 400 }
        }
      },
      columnWidths: [60, 100, 160, 260, 200, 140, 120, 140, 250],
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
      schema: {
        fields: {
          'ID': { type: 'number', readOnly: true },
          'ID_EMPLEADO': { type: 'number', required: true },
          'EMPLEADO': { type: 'string', required: true, maxLength: 120, collapseSpaces: true },
          'ID_CLIENTE': { type: 'number', required: true },
          'CLIENTE': { type: 'string', required: true, maxLength: 120, collapseSpaces: true },
          'FECHA': { type: 'date', required: true },
          'ASISTENCIA': { type: 'boolean' },
          'HORAS': { type: 'number', min: 0, max: 24 },
          'OBSERVACIONES': { type: 'string', maxLength: 400 }
        }
      },
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
      schema: {
        fields: {
          'ID': { type: 'number', readOnly: true },
          'ID_CLIENTE': { type: 'number', required: true },
          'CLIENTE': { type: 'string', maxLength: 120, collapseSpaces: true },
          'ID_EMPLEADO': { type: 'number' },
          'EMPLEADO': { type: 'string', maxLength: 120, collapseSpaces: true },
          'DIA SEMANA': { type: 'string', enum: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO', ''] },
          'HORA ENTRADA': { type: 'time' },
          'HORAS PLAN': { type: 'number', min: 0, max: 24 },
          'OBSERVACIONES': { type: 'string', maxLength: 400 },
          'VIGENTE DESDE': { type: 'date', required: true },
          'VIGENTE HASTA': { type: 'date' }
        }
      },
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
      schema: {
        fields: {
          'ID': { type: 'number', readOnly: true },
          'ID_EMPLEADO': { type: 'number', required: true },
          'FECHA': { type: 'date', required: true },
          'EMPLEADO': { type: 'string', required: true, maxLength: 120, collapseSpaces: true },
          'MONTO': { type: 'number', min: 0, required: true },
          'OBSERVACION': { type: 'string', maxLength: 400 }
        }
      },
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
