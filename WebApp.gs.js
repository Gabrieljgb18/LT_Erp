// WebApp entry point
function doGet(e) {
  // Endpoint de lectura JSON de Sheets (api=db, key en query).
  if (e && e.parameter && e.parameter.api === 'db') {
    return handleDbApi_(e);
  }
  // Endpoint de diagnóstico/lectura de cuenta corriente (api=cc, key en query).
  if (e && e.parameter && e.parameter.api === 'cc') {
    return handleClientAccountApi_(e);
  }

  return HtmlService.createTemplateFromFile('FrontedErp')
    .evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  if (e && e.parameter && e.parameter.api === 'db') {
    return handleDbApi_(e);
  }
  if (e && e.parameter && e.parameter.api === 'cc') {
    return handleClientAccountApi_(e);
  }
  return doGet(e);
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

// ==== API JSON de solo lectura (Sheets) ====

function handleDbApi_(e) {
  const isAuthorized = authorizeApi_(e);
  if (!isAuthorized) {
    return jsonResponse_({ error: 'unauthorized' });
  }

  const params = e && e.parameter ? e.parameter : {};
  const format = (params.format || '').toString().trim().toUpperCase();

  try {
    if (format) {
      const payload = getFormatData_(format);
      return jsonResponse_(payload);
    }

    const all = {};
    Formats.getAvailableFormats().forEach(function (f) {
      all[f.id] = getFormatData_(f.id);
    });
    return jsonResponse_({ formats: all });
  } catch (err) {
    return jsonResponse_({ error: err && err.message ? err.message : String(err) });
  }
}

function authorizeApi_(e) {
  const key = (e && e.parameter && (e.parameter.apiKey || e.parameter.key)) || '';
  const expected = PropertiesService.getScriptProperties().getProperty('LT_ERP_API_KEY');
  return expected && key && key === expected;
}

function jsonResponse_(obj) {
  const out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function getFormatData_(formatId) {
  const tpl = Formats.getFormatTemplate(formatId);
  if (!tpl) {
    throw new Error('Formato no encontrado: ' + formatId);
  }

  const sheet = DatabaseService.getDbSheetForFormat(formatId);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    return { format: formatId, headers: tpl.headers || [], rows: [] };
  }

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const dataRowCount = Math.max(0, lastRow - 1);
  const rowsValues = dataRowCount > 0 ? sheet.getRange(2, 1, dataRowCount, lastCol).getValues() : [];

  const rows = rowsValues.map(function (row) {
    const obj = {};
    headers.forEach(function (h, idx) {
      obj[h] = row[idx];
    });
    return obj;
  });

  return { format: formatId, headers: headers, rows: rows };
}

// ==== API JSON (Cuenta Corriente Clientes) ====

function handleClientAccountApi_(e) {
  const isAuthorized = authorizeApi_(e);
  if (!isAuthorized) {
    return jsonResponse_({ error: 'unauthorized' });
  }

  const params = e && e.parameter ? e.parameter : {};
  const client = (params.client || params.cliente || '').toString().trim();
  const idCliente = (params.idCliente || params.id || '').toString().trim();
  const start = (params.from || params.start || params.fechaDesde || params.desde || '').toString().trim();
  const end = (params.to || params.end || params.fechaHasta || params.hasta || '').toString().trim();

  try {
    const res = AccountController.getClientAccountStatement(client, start, end, idCliente);
    return jsonResponse_({
      client: client,
      idCliente: idCliente,
      start: start,
      end: end,
      saldoInicial: res && typeof res.saldoInicial === 'number' ? res.saldoInicial : 0,
      movimientos: res && res.movimientos ? res.movimientos : []
    });
  } catch (err) {
    return jsonResponse_({ error: err && err.message ? err.message : String(err) });
  }
}
