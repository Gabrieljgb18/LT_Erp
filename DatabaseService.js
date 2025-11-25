const DB_SPREADSHEET_ID = '1qgza62aFhIF4SWn7_S-AJLpIx3P7tz3_08N1JMeDQiY';

const DB_SHEETS_BY_FORMAT = {
  CLIENTES: 'CLIENTES_DB',
  EMPLEADOS: 'EMPLEADOS_DB',
  FACTURACION: 'FACTURACION_DB',
  PAGOS: 'PAGOS_DB',
  ASISTENCIA: 'ASISTENCIA_DB',
  ASISTENCIA_PLAN: 'ASISTENCIA_PLAN_DB',
  ADELANTOS: 'ADELANTOS_DB'
};

var DatabaseService = (function () {
  let cachedSpreadsheet = null;

  function getDbSpreadsheet() {
    if (!cachedSpreadsheet) {
      cachedSpreadsheet = SpreadsheetApp.openById(DB_SPREADSHEET_ID);
    }
    return cachedSpreadsheet;
  }

  function getDbSheetForFormat(tipoFormato) {
    const ss = getDbSpreadsheet();
    const sheetName = DB_SHEETS_BY_FORMAT[tipoFormato];
    if (!sheetName) {
      throw new Error('No hay hoja de DB configurada para el formato: ' + tipoFormato);
    }

    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    return sheet;
  }

  // ====== ID MANAGEMENT ======

  /**
   * Gets the next available ID for a sheet
   * @param {Sheet} sheet - The sheet
   * @returns {number} Next available ID
   */
  function getNextId(sheet) {
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      return 1;
    }

    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

    let maxId = 0;
    ids.forEach(function (row) {
      const id = Number(row[0]);
      if (!isNaN(id) && id > maxId) {
        maxId = id;
      }
    });

    return maxId + 1;
  }

  /**
   * Finds row number by ID
   * @param {Sheet} sheet - The sheet
   * @param {number} id - The ID to find
   * @returns {number|null} Row number or null if not found
   */
  function findRowById(sheet, id) {
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) return null;

    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

    for (let i = 0; i < ids.length; i++) {
      if (Number(ids[i][0]) === Number(id)) {
        return i + 2; // +2 because: +1 for 0-index, +1 for header row
      }
    }

    return null;
  }

  // ====== LOG VALOR HORA ======

  function appendHoraLogCliente(clienteNombre, valorHora) {
    const ss = getDbSpreadsheet();
    let sheet = ss.getSheetByName("CLIENTES_VHORA_DB");

    if (!sheet) {
      sheet = ss.insertSheet("CLIENTES_VHORA_DB");
      sheet.appendRow(["CLIENTE", "FECHA", "VALOR HORA"]);
    }

    sheet.appendRow([
      clienteNombre,
      new Date(),
      valorHora
    ]);
  }

  function appendHoraLogEmpleado(empleadoNombre, valorHora) {
    const ss = getDbSpreadsheet();
    let sheet = ss.getSheetByName("EMPLEADOS_VHORA_DB");

    if (!sheet) {
      sheet = ss.insertSheet("EMPLEADOS_VHORA_DB");
      sheet.appendRow(["EMPLEADO", "FECHA", "VALOR HORA"]);
    }

    sheet.appendRow([
      empleadoNombre,
      new Date(),
      valorHora
    ]);
  }

  // ====== HELPER GENÉRICO (array de STRINGS) ======

  function getActiveNames_(sheetName, nameHeader, statusHeader) {
    const ss = getDbSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return []; // solo encabezados

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const nameIdx = headers.indexOf(nameHeader);
    const statusIdx = headers.indexOf(statusHeader);

    if (nameIdx === -1) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    const result = [];

    data.forEach(row => {
      const name = row[nameIdx];
      if (!name) return;

      let isActive = true;
      if (statusIdx > -1) {
        isActive = DataUtils ? DataUtils.isTruthy(row[statusIdx]) : !!row[statusIdx];
      }

      if (isActive) {
        result.push(name);
      }
    });

    return result;
  }

  // ====== CLIENTES ACTIVOS (OBJETOS) ======
  // Devuelve: [{ nombre, razonSocial, cuit }, ...]
  // Esto es lo que usa la UI (referenceData.clientes)

  function getClientesActivos() {
    const ss = getDbSpreadsheet();
    const sheet = ss.getSheetByName('CLIENTES_DB');
    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return []; // solo encabezados

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    const idxNombre = headers.indexOf('NOMBRE');
    const idxRazon = headers.indexOf('RAZON SOCIAL');
    const idxCuit = headers.indexOf('CUIT');
    const idxEstado = headers.indexOf('ESTADO');

    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    const result = [];

    data.forEach(row => {
      const nombre = idxNombre > -1 ? row[idxNombre] : '';
      const razon = idxRazon > -1 ? row[idxRazon] : '';
      const cuit = idxCuit > -1 ? row[idxCuit] : '';

      let isActive = true;
      if (idxEstado > -1) {
        isActive = DataUtils ? DataUtils.isTruthy(row[idxEstado]) : !!row[idxEstado];
      }

      if (isActive && (nombre || razon)) {
        result.push({
          nombre: nombre,
          razonSocial: razon,
          cuit: cuit
        });
      }
    });

    return result;
  }

  // ====== EMPLEADOS ACTIVOS (STRINGS) ======

  function getEmpleadosActivos() {
    return getActiveNames_('EMPLEADOS_DB', 'EMPLEADO', 'ESTADO');
  }

  // ====== REFERENCIAS PARA LA UI ======

  function getReferenceData() {
    return {
      clientes: getClientesActivos(),    // objetos {nombre, razonSocial, cuit}
      empleados: getEmpleadosActivos()   // array de strings
    };
  }

  return {
    getReferenceData: getReferenceData,
    getClientesActivos: getClientesActivos,
    getEmpleadosActivos: getEmpleadosActivos,
    getDbSheetForFormat: getDbSheetForFormat,
    appendHoraLogCliente: appendHoraLogCliente,
    appendHoraLogEmpleado: appendHoraLogEmpleado,
    getNextId: getNextId,
    findRowById: findRowById
  };

})();
