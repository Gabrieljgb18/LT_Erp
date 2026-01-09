const DB_SPREADSHEET_ID = '1qgza62aFhIF4SWn7_S-AJLpIx3P7tz3_08N1JMeDQiY';

const DB_SHEETS_BY_FORMAT = {
  CLIENTES: 'CLIENTES_DB',
  EMPLEADOS: 'EMPLEADOS_DB',
  FACTURACION: 'FACTURACION_DB',
  ASISTENCIA: 'ASISTENCIA_DB',
  ASISTENCIA_PLAN: 'ASISTENCIA_PLAN_DB',
  ADELANTOS: 'ADELANTOS_DB',
  PAGOS_EMP: 'PAGOS_EMP_DB',
  PAGOS_CLIENTES: 'PAGOS_CLIENTES_DB',
  GASTOS: 'GASTOS_DB'
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
  // Devuelve: [{ nombre, razonSocial, docType, docNumber, cuit }, ...]
  // Esto es lo que usa la UI (referenceData.clientes)

  function normalizeDocType_(value) {
    const raw = String(value || '').trim().toUpperCase();
    if (raw === 'DNI') return 'DNI';
    if (raw === 'CUIL') return 'CUIL';
    if (raw === 'CUIT') return 'CUIT';
    return '';
  }

  function normalizeDocNumber_(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function extractClientDoc_(row, idxDocType, idxDocNumber, idxCuit) {
    let docType = normalizeDocType_(idxDocType > -1 ? row[idxDocType] : '');
    let docNumber = normalizeDocNumber_(idxDocNumber > -1 ? row[idxDocNumber] : '');
    const legacyCuit = normalizeDocNumber_(idxCuit > -1 ? row[idxCuit] : '');

    if (!docNumber && legacyCuit && !docType) {
      docNumber = legacyCuit;
      docType = 'CUIT';
    }

    const cuit = (docType === 'CUIT' || docType === 'CUIL')
      ? (docNumber || legacyCuit)
      : legacyCuit;

    return { docType: docType, docNumber: docNumber, cuit: cuit };
  }

  function getClientesActivos() {
    const ss = getDbSpreadsheet();
    const sheet = ss.getSheetByName('CLIENTES_DB');
    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return []; // solo encabezados

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
      .map(h => String(h || '').trim().toUpperCase());

    const idxId = headers.indexOf('ID');
    const idxNombre = headers.indexOf('NOMBRE');
    let idxRazon = headers.indexOf('RAZON SOCIAL');
    if (idxRazon === -1) idxRazon = headers.indexOf('RAZÓN SOCIAL');
    const idxDocType = headers.indexOf('TIPO DOCUMENTO');
    const idxDocNumber = headers.indexOf('NUMERO DOCUMENTO');
    const idxCuit = headers.indexOf('CUIT');
    const idxEstado = headers.indexOf('ESTADO');
    const idxDireccion = headers.indexOf('DIRECCION');
    const idxTags = headers.indexOf('ETIQUETAS');
    const idxTipoServicio = headers.indexOf('TIPO SERVICIO');
    const idxHoraEntrada = headers.indexOf('HORA ENTRADA');
    const idxPlaceId = headers.indexOf('MAPS PLACE ID');
    const idxLat = headers.indexOf('MAPS LAT');
    const idxLng = headers.indexOf('MAPS LNG');

    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    const result = [];

    data.forEach(row => {
      const nombre = idxNombre > -1 ? row[idxNombre] : '';
      const razon = idxRazon > -1 ? row[idxRazon] : '';
      const docData = extractClientDoc_(row, idxDocType, idxDocNumber, idxCuit);

      let isActive = true;
      if (idxEstado > -1) {
        isActive = DataUtils ? DataUtils.isTruthy(row[idxEstado]) : !!row[idxEstado];
      }

      if (isActive && (nombre || razon)) {
        const latRaw = idxLat > -1 ? row[idxLat] : '';
        const lngRaw = idxLng > -1 ? row[idxLng] : '';
        const lat = latRaw !== '' && latRaw != null ? Number(latRaw) : null;
        const lng = lngRaw !== '' && lngRaw != null ? Number(lngRaw) : null;
        result.push({
          id: idxId > -1 ? row[idxId] : '',
          nombre: nombre,
          razonSocial: razon,
          docType: docData.docType,
          docNumber: docData.docNumber,
          cuit: docData.cuit,
          direccion: idxDireccion > -1 ? row[idxDireccion] : '',
          tags: idxTags > -1 ? row[idxTags] : '',
          tipoServicio: idxTipoServicio > -1 ? row[idxTipoServicio] : '',
          horaEntrada: idxHoraEntrada > -1 ? row[idxHoraEntrada] : '',
          placeId: idxPlaceId > -1 ? row[idxPlaceId] : '',
          lat: isNaN(lat) ? null : lat,
          lng: isNaN(lng) ? null : lng
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

  // ====== EMPLEADOS ACTIVOS (OBJETOS) ======

  function getEmpleadosActivos() {
    const ss = getDbSpreadsheet();
    const sheet = ss.getSheetByName('EMPLEADOS_DB');
    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return [];

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
      .map(h => String(h || '').trim().toUpperCase());

    const idxId = headers.indexOf('ID');
    const idxNombre = headers.indexOf('EMPLEADO');
    const idxEstado = headers.indexOf('ESTADO');
    const idxDireccion = headers.indexOf('DIRECCION');
    const idxPlaceId = headers.indexOf('MAPS PLACE ID');
    const idxLat = headers.indexOf('MAPS LAT');
    const idxLng = headers.indexOf('MAPS LNG');
    if (idxNombre === -1) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    const result = [];

    data.forEach(row => {
      const nombre = idxNombre > -1 ? row[idxNombre] : '';
      if (!nombre) return;

      let isActive = true;
      if (idxEstado > -1) {
        isActive = DataUtils ? DataUtils.isTruthy(row[idxEstado]) : !!row[idxEstado];
      }

      if (isActive) {
        const latRaw = idxLat > -1 ? row[idxLat] : '';
        const lngRaw = idxLng > -1 ? row[idxLng] : '';
        const lat = latRaw !== '' && latRaw != null ? Number(latRaw) : null;
        const lng = lngRaw !== '' && lngRaw != null ? Number(lngRaw) : null;
        result.push({
          id: idxId > -1 ? row[idxId] : '',
          nombre: nombre,
          direccion: idxDireccion > -1 ? row[idxDireccion] : '',
          placeId: idxPlaceId > -1 ? row[idxPlaceId] : '',
          lat: isNaN(lat) ? null : lat,
          lng: isNaN(lng) ? null : lng
        });
      }
    });

    return result;
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

  // ====== TAGS CLIENTES ======

  const DEFAULT_CLIENT_TAGS = [
    'Retirar Residuos',
    'Se baldea',
    'Entrega de correo'
  ];

  function normalizeTagsInput_(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input;

    const raw = String(input).trim();
    if (!raw) return [];

    if (raw[0] === '[') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // fallback to split
      }
    }

    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  function uniqueTags_(tags) {
    const out = [];
    const seen = new Set();
    (tags || []).forEach(t => {
      const clean = String(t || '').trim().replace(/\s+/g, ' ');
      if (!clean) return;
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(clean);
    });
    return out;
  }

  function getClientTags() {
    const config = getConfig();
    const raw = config['CLIENTE_TAGS'];
    let tags = uniqueTags_(normalizeTagsInput_(raw));
    if (!tags.length) {
      tags = DEFAULT_CLIENT_TAGS.slice();
      upsertConfig({ CLIENTE_TAGS: JSON.stringify(tags) });
    }
    return tags;
  }

  function upsertClientTags(tagsInput) {
    const existing = getClientTags();
    const incoming = uniqueTags_(normalizeTagsInput_(tagsInput));
    const merged = uniqueTags_(existing.concat(incoming));
    upsertConfig({ CLIENTE_TAGS: JSON.stringify(merged) });
    return merged;
  }

  // ====== DROPDOWN OPTIONS ======

  function normalizeDropdownOptionsInput_(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input;

    const raw = String(input).trim();
    if (!raw) return [];

    if (raw[0] === '[') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // fallback to split
      }
    }

    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  function uniqueDropdownOptions_(options) {
    const out = [];
    const seen = new Set();
    (options || []).forEach(opt => {
      const clean = String(opt || '').trim().replace(/\s+/g, ' ');
      if (!clean) return;
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(clean);
    });
    return out;
  }

  function normalizeDropdownOptionsMap_(map) {
    const out = {};
    if (!map || typeof map !== 'object') return out;
    Object.keys(map).forEach(key => {
      const normalized = uniqueDropdownOptions_(normalizeDropdownOptionsInput_(map[key]));
      out[String(key)] = normalized;
    });
    return out;
  }

  function getDropdownOptions() {
    const config = getConfig();
    const raw = config['DROPDOWN_OPTIONS'];
    if (!raw) return {};
    let parsed = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        return {};
      }
    }
    return normalizeDropdownOptionsMap_(parsed);
  }

  function saveDropdownOptions(optionsMap) {
    const normalized = normalizeDropdownOptionsMap_(optionsMap);
    upsertConfig({ DROPDOWN_OPTIONS: JSON.stringify(normalized) });
    return normalized;
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
      // soportar yyyy-mm-dd (input date)
      const m2 = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m2) {
        const y = Number(m2[1]);
        const mo = Number(m2[2]) - 1;
        const d = Number(m2[3]);
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
    let idxRazon = headers.indexOf('RAZON SOCIAL');
    if (idxRazon === -1) idxRazon = headers.indexOf('RAZÓN SOCIAL');
    const idxDocType = headers.indexOf('TIPO DOCUMENTO');
    const idxDocNumber = headers.indexOf('NUMERO DOCUMENTO');
    const idxCuit = headers.indexOf('CUIT');
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
        const docData = extractClientDoc_(row, idxDocType, idxDocNumber, idxCuit);
        return {
          id: row[idxId],
          nombre: nombre,
          razonSocial: razon,
          docType: docData.docType,
          docNumber: docData.docNumber,
          cuit: docData.cuit,
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
    let idxRazon = headers.indexOf('RAZON SOCIAL');
    if (idxRazon === -1) idxRazon = headers.indexOf('RAZÓN SOCIAL');
    const idxDocType = headers.indexOf('TIPO DOCUMENTO');
    const idxDocNumber = headers.indexOf('NUMERO DOCUMENTO');
    const idxCuit = headers.indexOf('CUIT');

    const docData = extractClientDoc_(row, idxDocType, idxDocNumber, idxCuit);

    return {
      id: idxId > -1 ? row[idxId] : row[0],
      nombre: idxNombre > -1 ? row[idxNombre] : '',
      razonSocial: idxRazon > -1 ? row[idxRazon] : '',
      docType: docData.docType,
      docNumber: docData.docNumber,
      cuit: docData.cuit,
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

  /**
   * Repara filas antiguas de ADELANTOS que quedaron corridas de columna
   * por tener headers con ID_EMPLEADO en la DB y plantillas viejas en el CRUD.
   *
   * Patrón detectado (legacy):
   * - ID_EMPLEADO contiene una Date
   * - FECHA contiene el nombre del empleado
   * - EMPLEADO contiene el monto
   * - MONTO está vacío
   *
   * @returns {{ scanned: number, fixed: number }}
   */
  function repairAdelantosLegacyRows() {
    const sheet = getDbSheetForFormat('ADELANTOS');
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol === 0) return { scanned: 0, fixed: 0 };

    const headersRaw = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const headers = headersRaw.map(h => String(h || '').trim().toUpperCase());
    const idxIdEmp = headers.indexOf('ID_EMPLEADO');
    const idxFecha = headers.indexOf('FECHA');
    const idxEmpleado = headers.indexOf('EMPLEADO');
    const idxMonto = headers.indexOf('MONTO');
    if (idxIdEmp === -1 || idxFecha === -1 || idxEmpleado === -1 || idxMonto === -1) {
      return { scanned: lastRow - 1, fixed: 0 };
    }

    // Normalizar formato de columna de ID_EMPLEADO para evitar que se guarde como Date (serial)
    try {
      sheet.getRange(2, idxIdEmp + 1, lastRow - 1, 1).setNumberFormat('0');
    } catch (e) {
      // ignore
    }

    const range = sheet.getRange(2, 1, lastRow - 1, lastCol);
    const data = range.getValues();

    let fixed = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const legacyIdEmpVal = row[idxIdEmp];
      const legacyFechaVal = row[idxFecha];
      const legacyEmpleadoVal = row[idxEmpleado];
      const legacyMontoVal = row[idxMonto];

      let changed = false;

      // Caso legacy (corrimiento): ID_EMPLEADO contiene Date, FECHA contiene nombre, EMPLEADO contiene monto y MONTO vacío.
      const idEmpIsDate = (legacyIdEmpVal instanceof Date) && !isNaN(legacyIdEmpVal.getTime());
      const fechaIsDate = (legacyFechaVal instanceof Date) && !isNaN(legacyFechaVal.getTime());
      const fechaStr = String(legacyFechaVal || '').trim();

      const fechaLooksDateString = /^\d{4}-\d{2}-\d{2}/.test(fechaStr) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fechaStr);
      const empleadoIsNumber =
        (typeof legacyEmpleadoVal === 'number' && !isNaN(legacyEmpleadoVal)) ||
        (/^\s*-?\d+([.,]\d+)?\s*$/.test(String(legacyEmpleadoVal || '')));
      const montoEmpty = legacyMontoVal === '' || legacyMontoVal == null;

      if (idEmpIsDate && !fechaIsDate && fechaStr && !fechaLooksDateString && empleadoIsNumber && montoEmpty) {
        // Re-mapear a columnas correctas
        row[idxFecha] = legacyIdEmpVal;          // FECHA = Date
        row[idxEmpleado] = fechaStr;             // EMPLEADO = nombre
        row[idxMonto] = legacyEmpleadoVal;       // MONTO = número
        changed = true;
      }

      // Normalizar ID_EMPLEADO (sin inferir por nombre)
      const currIdEmp = row[idxIdEmp];
      if (typeof currIdEmp === 'string' && currIdEmp.trim() !== '') {
        const asNum = Number(currIdEmp);
        if (!isNaN(asNum)) {
          row[idxIdEmp] = asNum;
          changed = true;
        }
      }

      if (changed) {
        data[i] = row;
        fixed++;
      }
    }

    if (fixed > 0) {
      range.setValues(data);
    }

    return { scanned: data.length, fixed: fixed };
  }

  // ====== REFERENCIAS PARA LA UI ======

  function getReferenceData() {
    return {
      clientes: getClientesActivos(),    // objetos {id, nombre, razonSocial, docType, docNumber, cuit}
      empleados: getEmpleadosActivos()   // objetos {id, nombre}
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
    repairAdelantosLegacyRows: repairAdelantosLegacyRows,
    appendHoraLogCliente: appendHoraLogCliente,
    appendHoraLogEmpleado: appendHoraLogEmpleado,
    getClientTags: getClientTags,
    upsertClientTags: upsertClientTags,
    getDropdownOptions: getDropdownOptions,
    saveDropdownOptions: saveDropdownOptions,
    getNextId: getNextId,
    findRowById: findRowById,
    getDbSpreadsheet: getDbSpreadsheet
  };

})();
