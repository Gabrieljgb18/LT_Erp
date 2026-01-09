/**
 * Utilities to audit/cleanup duplicate attendance rows for a given date.
 * Dedupe key: FECHA + ID_CLIENTE + ID_EMPLEADO.
 */

function cleanupAttendanceDuplicatesForDate(dateStr, options) {
  var opts = options || {};
  var keepMode = (opts.keep || 'first').toString().toLowerCase();
  if (keepMode !== 'last') keepMode = 'first';
  var dryRun = opts.dryRun !== false;

  var sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) {
    return {
      date: String(dateStr || ''),
      dryRun: dryRun,
      keep: keepMode,
      totalRows: 0,
      matchedRows: 0,
      duplicateRows: 0,
      deletedRows: 0,
      duplicates: []
    };
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var idxId = headers.indexOf('ID');
  var idxFecha = headers.indexOf('FECHA');
  var idxIdCliente = headers.indexOf('ID_CLIENTE');
  var idxIdEmpleado = headers.indexOf('ID_EMPLEADO');

  if (idxFecha === -1 || idxIdCliente === -1 || idxIdEmpleado === -1) {
    throw new Error('Faltan columnas requeridas (FECHA, ID_CLIENTE, ID_EMPLEADO) en ASISTENCIA.');
  }

  var targetKeys = buildDateKeyVariants_(dateStr);
  if (!targetKeys.length) {
    throw new Error('Fecha invalida para limpieza de asistencia.');
  }

  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var seen = new Map();
  var duplicates = [];
  var rowsToDelete = [];
  var matchedRows = 0;

  data.forEach(function (row, i) {
    var rowNumber = i + 2;
    var rowDateKey = normalizeRowDateKey_(row[idxFecha]);
    if (!rowDateKey || targetKeys.indexOf(rowDateKey) === -1) return;

    matchedRows += 1;

    var idCliente = String(row[idxIdCliente] || '').trim();
    var idEmpleado = String(row[idxIdEmpleado] || '').trim();
    if (!idCliente || !idEmpleado) return;

    var rowId = idxId > -1 ? row[idxId] : row[0];
    var key = idCliente + '||' + idEmpleado;

    if (!seen.has(key)) {
      seen.set(key, { rowNumber: rowNumber, id: rowId, dateKey: rowDateKey });
      return;
    }

    var existing = seen.get(key);
    if (keepMode === 'last') {
      rowsToDelete.push(existing.rowNumber);
      duplicates.push({
        rowNumber: existing.rowNumber,
        keepRowNumber: rowNumber,
        id: existing.id,
        idCliente: idCliente,
        idEmpleado: idEmpleado,
        dateKey: existing.dateKey
      });
      seen.set(key, { rowNumber: rowNumber, id: rowId, dateKey: rowDateKey });
    } else {
      rowsToDelete.push(rowNumber);
      duplicates.push({
        rowNumber: rowNumber,
        keepRowNumber: existing.rowNumber,
        id: rowId,
        idCliente: idCliente,
        idEmpleado: idEmpleado,
        dateKey: rowDateKey
      });
    }
  });

  if (!dryRun && rowsToDelete.length) {
    rowsToDelete.sort(function (a, b) { return b - a; });
    rowsToDelete.forEach(function (rowNum) {
      sheet.deleteRow(rowNum);
    });
  }

  var summary = {
    date: String(dateStr || ''),
    dryRun: dryRun,
    keep: keepMode,
    totalRows: data.length,
    matchedRows: matchedRows,
    duplicateRows: duplicates.length,
    deletedRows: dryRun ? 0 : rowsToDelete.length,
    duplicates: duplicates
  };

  Logger.log(JSON.stringify(summary));
  return summary;
}

function auditAttendanceDuplicates_2026_01_06() {
  return cleanupAttendanceDuplicatesForDate('2026-01-06', { dryRun: true, keep: 'first' });
}

function cleanupAttendanceDuplicates_2026_01_06() {
  return cleanupAttendanceDuplicatesForDate('2026-01-06', { dryRun: false, keep: 'first' });
}

function buildDateKeyVariants_(dateStr) {
  var raw = String(dateStr || '').trim();
  if (!raw) return [];

  var variants = {};
  var add = function (val) {
    if (!val) return;
    variants[val] = true;
  };

  add(raw);

  var match;
  if ((match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    var y = Number(match[1]);
    var m = Number(match[2]);
    var d = Number(match[3]);
    add(formatIsoDate_(y, m, d));
    add(formatDmySlash_(d, m, y));
    add(formatDmyDash_(d, m, y));
  } else if ((match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
    var d1 = Number(match[1]);
    var m1 = Number(match[2]);
    var y1 = Number(match[3]);
    add(formatIsoDate_(y1, m1, d1));
    add(formatDmySlash_(d1, m1, y1));
    add(formatDmyDash_(d1, m1, y1));
  } else if ((match = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/))) {
    var d2 = Number(match[1]);
    var m2 = Number(match[2]);
    var y2 = Number(match[3]);
    add(formatIsoDate_(y2, m2, d2));
    add(formatDmySlash_(d2, m2, y2));
    add(formatDmyDash_(d2, m2, y2));
  } else {
    var parsed = new Date(raw);
    if (!isNaN(parsed)) {
      add(Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd'));
    }
  }

  return Object.keys(variants);
}

function normalizeRowDateKey_(value) {
  if (typeof DataUtils !== 'undefined' && DataUtils && typeof DataUtils.normalizeCellForSearch === 'function') {
    return DataUtils.normalizeCellForSearch(value, 'FECHA');
  }
  if (value instanceof Date && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value || '').trim();
}

function formatIsoDate_(y, m, d) {
  var mm = String(m).padStart(2, '0');
  var dd = String(d).padStart(2, '0');
  return String(y) + '-' + mm + '-' + dd;
}

function formatDmySlash_(d, m, y) {
  var dd = String(d).padStart(2, '0');
  var mm = String(m).padStart(2, '0');
  return dd + '/' + mm + '/' + String(y);
}

function formatDmyDash_(d, m, y) {
  var dd = String(d).padStart(2, '0');
  var mm = String(m).padStart(2, '0');
  return dd + '-' + mm + '-' + String(y);
}
