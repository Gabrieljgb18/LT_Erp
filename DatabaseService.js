const DB_SPREADSHEET_ID = '1qgza62aFhIF4SWn7_S-AJLpIx3P7tz3_08N1JMeDQiY';

const DB_SHEETS_BY_FORMAT = {
  CLIENTES: 'CLIENTES_DB',
  EMPLEADOS: 'EMPLEADOS_DB',
  FACTURACION: 'FACTURACION_DB',
  ASISTENCIA: 'ASISTENCIA_DB',
  ASISTENCIA_PLAN: 'ASISTENCIA_PLAN_DB',
  ADELANTOS: 'ADELANTOS_DB',
  PAGOS_EMP: 'PAGOS_EMP_DB',
  PAGOS_CLIENTES: 'PAGOS_CLIENTES_DB'
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

    const idxId = headers.indexOf('ID');
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
          id: idxId > -1 ? row[idxId] : '',
          nombre: nombre,
          razonSocial: razon,
          cuit: cuit
        });
      }
    });

    return result;
  }

  /**
   * Obtiene valor hora de un cliente desde CLIENTES
   * @param {string} clientName
   * @returns {number}
   */
  function getClientHourlyRate(clientName) {
    if (!clientName) return 0;
    let sheet = null;
    try {
      sheet = getDbSheetForFormat('CLIENTES'); // CLIENTES_DB
    } catch (e) {
      sheet = null;
    }
    if (!sheet) {
      const ss = getDbSpreadsheet();
      sheet = ss.getSheetByName('CLIENTES_DB') || ss.getSheetByName('CLIENTES');
    }
    if (!sheet) return 0;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol === 0) return 0;

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const idxNombre = headers.indexOf('NOMBRE');
    const idxRazon = headers.indexOf('RAZON SOCIAL');
    const idxValor = headers.indexOf('VALOR HORA');
    if (idxValor === -1 || (idxNombre === -1 && idxRazon === -1)) return 0;

    const target = normalizeClientName_(clientName);
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const name = idxNombre > -1 ? row[idxNombre] : '';
      const razon = idxRazon > -1 ? row[idxRazon] : '';
      const rowNorm = normalizeClientName_(name || razon);
      if (rowNorm && target && (rowNorm === target || rowNorm.indexOf(target) !== -1 || target.indexOf(rowNorm) !== -1)) {
        const v = Number(row[idxValor]);
        return isNaN(v) ? 0 : v;
      }
    }
    return 0;
  }

  /**
   * Obtiene valor hora histórico de un cliente para una fecha dada
   * Lee CLIENTES_VHORA_DB y busca el último valor anterior o igual a la fecha.
   * Si no hay registro histórico, usa el valor actual de CLIENTES.
   * @param {string} clientName
   * @param {Date} targetDate
   * @returns {number}
   */
  function getClientRateAtDate(clientName, targetDate) {
    if (!clientName) return 0;
    const ss = getDbSpreadsheet();
    const sheet = ss.getSheetByName('CLIENTES_VHORA_DB');
    const target = normalizeClientName_((clientName || '').toString());
    const tDate = parseDateFlexible_(targetDate);

    let bestRate = null;
    let bestTime = -Infinity;

    if (sheet) {
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow >= 2 && lastCol >= 3) {
        const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
        data.forEach(row => {
          const cli = normalizeClientName_(row[0]);
          const matchesClient = cli && target && (cli === target || cli.indexOf(target) !== -1 || target.indexOf(cli) !== -1);
          if (!matchesClient) return;
          const fecha = parseDateFlexible_(row[1]);
          if (!fecha || isNaN(fecha.getTime())) return;
          const ts = fecha.getTime();
          if (tDate && ts > tDate.getTime()) return; // solo valores anteriores o iguales
          const rate = Number(row[2]);
          if (isNaN(rate)) return;
          if (ts >= bestTime) {
            bestTime = ts;
            bestRate = rate;
          }
        });
      }
    }

    if (bestRate !== null) return bestRate;
    return getClientHourlyRate(clientName);
  }

  // ====== EMPLEADOS ACTIVOS (STRINGS) ======

  function getEmpleadosActivos() {
    return getActiveNames_('EMPLEADOS_DB', 'EMPLEADO', 'ESTADO');
  }

  // ====== CONFIG (clave/valor) ======

  function getConfigSheet_() {
    const ss = getDbSpreadsheet();
    let sheet = ss.getSheetByName('CONFIG_DB');
    if (!sheet) {
      sheet = ss.insertSheet('CONFIG_DB');
      sheet.appendRow(['KEY', 'VALUE']);
    }
    return sheet;
  }

  function upsertConfig(obj) {
    if (!obj || typeof obj !== 'object') return;
    const entries = Object.keys(obj);
    if (!entries.length) return;

    const sheet = getConfigSheet_();
    const lastRow = sheet.getLastRow();
    const dataRange = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 2).getValues() : [];

    const map = new Map();
    dataRange.forEach((row) => {
      map.set(String(row[0]), row[1]);
    });

    entries.forEach(key => {
      map.set(String(key), obj[key]);
    });

    const newValues = Array.from(map.entries()).map(([k, v]) => [k, v]);

    if (lastRow >= 2) {
      sheet.getRange(2, 1, lastRow - 1, 2).clearContent();
    }
    if (newValues.length) {
      sheet.getRange(2, 1, newValues.length, 2).setValues(newValues);
    }
  }

  function getConfig() {
    const sheet = getConfigSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return {};
    const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    const obj = {};
    data.forEach(function (row) {
      obj[String(row[0])] = row[1];
    });
    return obj;
  }

  function normalizeClientName_(name) {
    if (!name) return '';
    return String(name)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
      .toLowerCase()
      .replace(/\([^)]*\)/g, '') // Remove content in parentheses
      .replace(/\s+/g, ' ')
      .replace(/\./g, '')        // Remove dots
      .replace(/s\.?a\.?$/i, 'sa')
      .replace(/s\.?r\.?l\.?$/i, 'srl')
      .trim();
  }

  function normalizePersonName_(name) {
    if (!name) return '';
    return String(name)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseDateFlexible_(val) {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      // soportar dd/mm/yyyy o dd/mm/yyyy hh:mm
      const m = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (m) {
        const d = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const y = Number(m[3]);
        const dt = new Date(y, mo, d);
        if (!isNaN(dt.getTime())) return dt;
      }
    }
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // ====== LOOKUPS POR NOMBRE/RAZON ======

  function findClienteByNombreORazon(nombreORazon) {
    if (!nombreORazon) return null;

    const sheet = getDbSheetForFormat('CLIENTES');
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return null;

    const headers = data[0].map(h => String(h || '').trim().toUpperCase());
    const idxId = headers.indexOf('ID');
    const idxNombre = headers.indexOf('NOMBRE');
    const idxRazon = headers.indexOf('RAZON SOCIAL');
    if (idxId === -1 || (idxNombre === -1 && idxRazon === -1)) return null;

    const targetNorm = normalizeClientName_(nombreORazon);
    if (!targetNorm) return null;

    const rows = data.slice(1);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nombre = idxNombre > -1 ? row[idxNombre] : '';
      const razon = idxRazon > -1 ? row[idxRazon] : '';
      const normNombre = normalizeClientName_(nombre);
      const normRazon = normalizeClientName_(razon);
      if (normNombre === targetNorm || normRazon === targetNorm) {
        return {
          id: row[idxId],
          nombre: nombre,
          razonSocial: razon,
          rowNumber: i + 2
        };
      }
    }
    return null;
  }

  function findClienteById(id) {
    if (id == null || id === '') return null;
    const sheet = getDbSheetForFormat('CLIENTES');
    const rowNumber = findRowById(sheet, id);
    if (!rowNumber) return null;

    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim().toUpperCase());
    const row = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];

    const idxId = headers.indexOf('ID');
    const idxNombre = headers.indexOf('NOMBRE');
    const idxRazon = headers.indexOf('RAZON SOCIAL');
    const idxCuit = headers.indexOf('CUIT');

    return {
      id: idxId > -1 ? row[idxId] : row[0],
      nombre: idxNombre > -1 ? row[idxNombre] : '',
      razonSocial: idxRazon > -1 ? row[idxRazon] : '',
      cuit: idxCuit > -1 ? row[idxCuit] : '',
      rowNumber: rowNumber
    };
  }

  function findEmpleadoByNombre(nombre) {
    if (!nombre) return null;

    const sheet = getDbSheetForFormat('EMPLEADOS');
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return null;

    const headers = data[0].map(h => String(h || '').trim().toUpperCase());
    const idxId = headers.indexOf('ID');
    const idxNombre = headers.indexOf('EMPLEADO');
    if (idxId === -1 || idxNombre === -1) return null;

    const target = normalizePersonName_(nombre);
    const rows = data.slice(1);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nom = row[idxNombre];
      if (nom && normalizePersonName_(nom) === target) {
        return {
          id: row[idxId],
          nombre: nom,
          rowNumber: i + 2
        };
      }
    }
    return null;
  }

  function findEmpleadoById(id) {
    if (id == null || id === '') return null;
    const sheet = getDbSheetForFormat('EMPLEADOS');
    const rowNumber = findRowById(sheet, id);
    if (!rowNumber) return null;

    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim().toUpperCase());
    const row = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];

    const idxId = headers.indexOf('ID');
    const idxNombre = headers.indexOf('EMPLEADO');
    const idxEstado = headers.indexOf('ESTADO');

    return {
      id: idxId > -1 ? row[idxId] : row[0],
      nombre: idxNombre > -1 ? row[idxNombre] : '',
      estado: idxEstado > -1 ? row[idxEstado] : '',
      rowNumber: rowNumber
    };
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
    getClientHourlyRate: getClientHourlyRate,
    getClientRateAtDate: getClientRateAtDate,
    getClientesActivos: getClientesActivos,
    getEmpleadosActivos: getEmpleadosActivos,
    upsertConfig: upsertConfig,
    getConfig: getConfig,
    getDbSheetForFormat: getDbSheetForFormat,
    findClienteByNombreORazon: findClienteByNombreORazon,
    findClienteById: findClienteById,
    findEmpleadoByNombre: findEmpleadoByNombre,
    findEmpleadoById: findEmpleadoById,
    appendHoraLogCliente: appendHoraLogCliente,
    appendHoraLogEmpleado: appendHoraLogEmpleado,
    getNextId: getNextId,
    findRowById: findRowById,
    getDbSpreadsheet: getDbSpreadsheet
  };

})();
