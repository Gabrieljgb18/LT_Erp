function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Formatos')
    .addItem('Formulario (sistema de gestión)', 'showFormDialog')
    .addSeparator()
    .addItem('Panel de formatos (maquetar hoja)', 'showSidebar')
    .addToUi();
}

/**
 * Abre el formulario principal como un diálogo modal.
 */
function showFormDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setWidth(600)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, 'Sistema de gestión');
}

/**
 * Panel lateral (en caso de que lo quieras usar para maquetar).
 * Si no usás esta opción, igual no rompe nada.
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Panel de formatos');
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Aplica el layout de un formato a la hoja activa.
 * Esta función está pensada para ser llamada desde algún UI de maquetado.
 */
function applyFormatToActiveSheet(tipoFormato) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  LayoutService.applyFormatToSheet(tipoFormato, sheet);
}

/**
 * Devuelve la lista de formatos disponibles al front-end.
 */
function getAvailableFormats() {
  return Formats.getAvailableFormats();
}

/**
 * Normaliza una celda para búsqueda:
 * - null / vacío  -> ""
 * - Date          -> "yyyy-MM-dd"
 * - resto         -> String(cell)
 */
function normalizeCellForSearch(cell) {
  if (cell === null || cell === "") return "";

  if (cell instanceof Date) {
    return Utilities.formatDate(
      cell,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  return String(cell);
}

/**
 * Busca registros en la hoja de base de datos de un formato.
 * Devuelve un array: [{ rowNumber, record }, ...]
 * Busca por TODAS las columnas (nombre, razón social, cuit, fecha, etc.)
 */
function searchRecords(tipoFormato, query) {
  const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  // Nada para buscar
  if (lastRow < 2 || lastCol === 0) {
    return [];
  }

  // Encabezados reales de la hoja (primera fila)
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // Datos desde la fila 2 hasta la última
  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const q = (query || "").toString().toLowerCase().trim();
  const results = [];

  data.forEach(function (row, index) {
    // Normalizamos cada celda a string (incluyendo fechas)
    const rowStrings = row.map(normalizeCellForSearch);

    // Armamos un string con TODA la fila para buscar por cualquier campo
    const rowText = rowStrings.join(" ").toLowerCase();

    // Si la query está vacía, devolvemos todo; si no, filtramos
    if (!q || rowText.indexOf(q) !== -1) {
      const record = {};
      headers.forEach(function (h, colIdx) {
        record[h] = rowStrings[colIdx]; // ya es string seguro
      });

      results.push({
        rowNumber: index + 2, // +2 porque data arranca en la fila 2
        record: record,
      });
    }
  });

  return results;
}


/**
 * Inserta un nuevo registro al final de la hoja de base de datos.
 * Respeta el mapeo actual de columnas usando los headers del formato.
 */
function saveFormRecord(tipoFormato, record) {
  const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);
  const template = Formats.getFormatTemplate(tipoFormato);
  if (!template) {
    throw new Error('Formato no encontrado: ' + tipoFormato);
  }

  const headers = template.headers || [];
  if (!headers.length) {
    throw new Error('El formato no tiene headers definidos: ' + tipoFormato);
  }

  // Armamos la fila en el orden de headers
  const row = headers.map(function (h) {
    return record[h] != null ? record[h] : '';
  });

  // Agregamos al final
  sheet.appendRow(row);

  // === LOG de valor de hora ===
  if (tipoFormato === 'CLIENTES') {
    const clienteNombre = record['NOMBRE'] || record['RAZON SOCIAL'] || '';
    const valorHora = record['VALOR DE HORA'];
    if (clienteNombre && valorHora !== undefined && valorHora !== '') {
      DatabaseService.appendHoraLogCliente(clienteNombre, valorHora);
    }
  }

  if (tipoFormato === 'EMPLEADOS') {
    const empleadoNombre = record['EMPLEADO'] || '';
    const valorHora = record['VALOR DE HORA'];
    if (empleadoNombre && valorHora !== undefined && valorHora !== '') {
      DatabaseService.appendHoraLogEmpleado(empleadoNombre, valorHora);
    }
  }
}

/**
 * Actualiza una fila concreta de la hoja de base de datos.
 * Respeta el mapeo actual de columnas usando los headers del formato.
 */
function updateRecord(tipoFormato, rowNumber, newRecord) {
  const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);
  const template = Formats.getFormatTemplate(tipoFormato);
  if (!template) {
    throw new Error('Formato no encontrado: ' + tipoFormato);
  }

  const headers = template.headers || [];
  if (!headers.length) {
    throw new Error('El formato no tiene headers definidos: ' + tipoFormato);
  }

  const lastCol = sheet.getLastColumn();
  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // Registro actual en la hoja
  const currentRowValues = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
  const currentRecord = {};
  headerRow.forEach(function (h, idx) {
    currentRecord[h] = currentRowValues[idx];
  });

  // Nueva fila en el orden de headers del formato
  const newRowValues = headers.map(function (h) {
    return newRecord[h] != null ? newRecord[h] : '';
  });

  // Sobrescribimos la fila
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([newRowValues]);

  // === LOG de cambios en valor de hora ===
  if (tipoFormato === 'CLIENTES') {
    const oldValor = currentRecord['VALOR DE HORA'];
    const newValor = newRecord['VALOR DE HORA'];
    const clienteNombre = newRecord['NOMBRE'] || newRecord['RAZON SOCIAL'] || '';
    if (clienteNombre && newValor !== undefined && newValor !== '' && newValor !== oldValor) {
      DatabaseService.appendHoraLogCliente(clienteNombre, newValor);
    }
  }

  if (tipoFormato === 'EMPLEADOS') {
    const oldValor = currentRecord['VALOR DE HORA'];
    const newValor = newRecord['VALOR DE HORA'];
    const empleadoNombre = newRecord['EMPLEADO'] || '';
    if (empleadoNombre && newValor !== undefined && newValor !== '' && newValor !== oldValor) {
      DatabaseService.appendHoraLogEmpleado(empleadoNombre, newValor);
    }
  }
}

/**
 * Elimina una fila concreta de la hoja de base de datos.
 */
function deleteRecord(tipoFormato, rowNumber) {
  const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);
  sheet.deleteRow(rowNumber);
}

/**
 * Devuelve datos de referencia (clientes activos, empleados activos, etc.).
 */
function getReferenceData() {
  return DatabaseService.getReferenceData();
}

function getAsistenciaRowsFor_(tipoFormato, fechaStr, cliente) {
  const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return [];

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  const idxFecha   = headers.indexOf('FECHA');
  const idxCliente = headers.indexOf('CLIENTE');
  const idxEmp     = headers.indexOf('EMPLEADO');
  const idxAsist   = headers.indexOf('ASISTENCIA');
  const idxHoras   = headers.indexOf('HORAS');
  const idxObs     = headers.indexOf('OBSERVACIONES');

  if (idxFecha === -1 || idxCliente === -1 || idxEmp === -1) {
    return [];
  }

  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const targetDate = (fechaStr || "").toString().trim();

  const rows = [];

  data.forEach(function (row, i) {
    const fechaCell = normalizeCellForSearch(row[idxFecha]); // ya la tenés definida
    const clienteCell = row[idxCliente];

    if (fechaCell === targetDate && clienteCell === cliente) {
      rows.push({
        rowNumber: i + 2,
        empleado: row[idxEmp],
        asistencia: idxAsist > -1 ? row[idxAsist] : '',
        horas:      idxHoras > -1 ? row[idxHoras] : '',
        observaciones: idxObs > -1 ? row[idxObs] : ''
      });
    }
  });

  return rows;
}

/**
 * Devuelve un array con plan vs realidad para una fecha + cliente.
 * [
 *   {
 *     empleado,
 *     planificado: true/false,
 *     asistencia: true/false,
 *     horas: string/number,
 *     observaciones: string,
 *     realRowNumber: number | null
 *   },
 *   ...
 * ]
 */
/**
 * Plan vs realidad para un CLIENTE específico en una FECHA.
 *
 * Usa:
 *  - ASISTENCIA_PLAN_DB (plan semanal, por DIA SEMANA)
 *  - ASISTENCIA_DB (registro real, por FECHA)
 *
 * Devuelve:
 * [
 *   {
 *     empleado,
 *     planificado: true/false,
 *     asistencia: boolean,
 *     horas: string/number,
 *     observaciones: string,
 *     realRowNumber: number | null
 *   },
 *   ...
 * ]
 */
function getPlanVsAsistencia(fechaStr, cliente) {
  const fecha = (fechaStr || '').toString().trim();
  if (!fecha || !cliente) return [];
  
  

  const dayName = getDayNameFromDateString_(fecha); // LUNES, MARTES, etc.
  
  if (!dayName) return [];

  // === 1) PLAN SEMANAL PARA ESE CLIENTE Y ESE DÍA ===
  const planSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
  const lastRowPlan = planSheet.getLastRow();
  const lastColPlan = planSheet.getLastColumn();
  if (lastRowPlan < 2 || lastColPlan === 0) return [];

  const headersPlan = planSheet.getRange(1, 1, 1, lastColPlan).getValues()[0];

  const idxClientePlan   = headersPlan.indexOf('CLIENTE');
  const idxEmpleadoPlan  = headersPlan.indexOf('EMPLEADO');
  const idxDiaSemanaPlan = headersPlan.indexOf('DIA SEMANA');
  const idxHoraEntrada   = headersPlan.indexOf('HORA ENTRADA'); // si no existe, queda -1
  const idxHorasPlan     = headersPlan.indexOf('HORAS PLAN');
  const idxActivoPlan    = headersPlan.indexOf('ACTIVO');
  const idxObsPlan       = headersPlan.indexOf('OBSERVACIONES');

  if (idxClientePlan === -1 || idxEmpleadoPlan === -1 || idxDiaSemanaPlan === -1) {
    return [];
  }

  const dataPlan = planSheet.getRange(2, 1, lastRowPlan - 1, lastColPlan).getValues();
  const planRows = [];

  dataPlan.forEach(function (row) {
    const cli = row[idxClientePlan];
    const dia = (row[idxDiaSemanaPlan] || '').toString().trim().toUpperCase();

    if (!cli || !dia) return;
    if (cli !== cliente) return;
    if (dia !== dayName) return;

    // ACTIVO (si la columna no existe, asumimos activo = true)
    let activo = true;
    if (idxActivoPlan > -1) {
      const v = row[idxActivoPlan];
      activo =
        v === true ||
        v === 'TRUE' ||
        v === 'true' ||
        v === 1 ||
        v === '1' ||
        v === 'SI' ||
        v === 'Si';
    }
    if (!activo) return;

    const emp = row[idxEmpleadoPlan];
    if (!emp) return;

    planRows.push({
      empleado: emp,
      cliente: cli,
      horaPlan: idxHoraEntrada > -1 ? row[idxHoraEntrada] : '',
      horasPlan: idxHorasPlan > -1 ? row[idxHorasPlan] : '',
      observacionesPlan: idxObsPlan > -1 ? row[idxObsPlan] : ''
    });
  });

  // Si no hay plan, devolvemos array vacío (panel muestra el mensaje correspondiente)
  if (!planRows.length) return [];

  // === 2) ASISTENCIA REAL PARA ESA FECHA Y CLIENTE ===
  const asisSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
  const lastRowAsis = asisSheet.getLastRow();
  const lastColAsis = asisSheet.getLastColumn();

  let realMap = {}; // clave: empleado

  if (lastRowAsis >= 2 && lastColAsis > 0) {
    const headersAsis = asisSheet.getRange(1, 1, 1, lastColAsis).getValues()[0];

    const idxEmpAsis   = headersAsis.indexOf('EMPLEADO');
    const idxCliAsis   = headersAsis.indexOf('CLIENTE');
    const idxFechaAsis = headersAsis.indexOf('FECHA');
    const idxAsist     = headersAsis.indexOf('ASISTENCIA');
    const idxHorasReal = headersAsis.indexOf('HORAS');
    const idxObsReal   = headersAsis.indexOf('OBSERVACIONES');

    if (idxEmpAsis > -1 && idxCliAsis > -1 && idxFechaAsis > -1) {
      const dataAsis = asisSheet.getRange(2, 1, lastRowAsis - 1, lastColAsis).getValues();

      dataAsis.forEach(function (row, i) {
        const fechaRow = normalizeCellForSearch(row[idxFechaAsis]);
        if (fechaRow !== fecha) return;

        const cliRow = row[idxCliAsis];
        const empRow = row[idxEmpAsis];
        if (!cliRow || !empRow) return;
        if (cliRow !== cliente) return;

        let asistio = false;
        if (idxAsist > -1) {
          const v = row[idxAsist];
          asistio =
            v === true ||
            v === 'TRUE' ||
            v === 'true' ||
            v === 1 ||
            v === '1' ||
            v === 'Asistió';
        }

        realMap[empRow] = {
          rowNumber: i + 2,
          asistencia: asistio,
          horas: idxHorasReal > -1 ? row[idxHorasReal] : '',
          observaciones: idxObsReal > -1 ? row[idxObsReal] : ''
        };
      });
    }
  }

  // === 3) Combinamos plan + realidad por empleado ===
  const empleados = planRows
    .map(r => r.empleado)
    .filter((v, i, arr) => arr.indexOf(v) === i) // únicos
    .sort();

  return empleados.map(function (emp) {
    const p = planRows.find(x => x.empleado === emp);
    const r = realMap[emp];

    let asistio = false;
    if (r && r.asistencia) asistio = true;

    return {
      empleado: emp,
      planificado: !!p,
      asistencia: asistio,
      horas: r ? r.horas : (p ? p.horasPlan : ''),
      observaciones: r ? r.observaciones : (p ? p.observacionesPlan || '' : ''),
      realRowNumber: r ? r.rowNumber : null
    };
  });
}


/**
 * items: array de objetos:
 * [
 *   {
 *     empleado: string,
 *     asistencia: boolean,
 *     horas: string/number,
 *     observaciones: string,
 *     realRowNumber: number | null   // si existe, se actualiza; si no, se crea
 *   },
 *   ...
 * ]
 */
function saveAsistenciaFromPlan(fechaStr, cliente, items) {
  if (!fechaStr || !cliente || !Array.isArray(items)) return;

  const fecha = fechaStr.toString().trim();

  items.forEach(function (it) {
    if (!it.empleado) return;

    const record = {
      'EMPLEADO': it.empleado,
      'CLIENTE': cliente,
      'FECHA': fecha,
      'ASISTENCIA': !!it.asistencia,
      'HORAS': it.horas != null ? it.horas : '',
      'OBSERVACIONES': it.observaciones != null ? it.observaciones : ''
    };

    if (it.realRowNumber) {
      updateRecord('ASISTENCIA', it.realRowNumber, record);
    } else {
      saveFormRecord('ASISTENCIA', record);
    }
  });
}

// Convierte "2025-12-11" o "11/12/2025" a LUNES, MARTES, etc.
function getDayNameFromDateString_(fechaStr) {
  if (!fechaStr) return '';

  var d;

  if (Object.prototype.toString.call(fechaStr) === '[object Date]') {
    d = fechaStr;
  } else {
    var s = String(fechaStr).trim();

    // Formato input date → "YYYY-MM-DD"
    if (s.indexOf('-') >= 0) {
      var p = s.split('-'); // [yyyy, mm, dd]
      d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }
    // Por si en algún lado seguís usando "DD/MM/YYYY"
    else if (s.indexOf('/') >= 0) {
      var p2 = s.split('/'); // [dd, mm, yyyy]
      d = new Date(Number(p2[2]), Number(p2[1]) - 1, Number(p2[0]));
    } else {
      d = new Date(s);
    }
  }

  if (isNaN(d)) {
    
    return '';
  }

  var dias = ['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'];
  return dias[d.getDay()];
}



/**
 * Devuelve el plan + asistencia real para un día dado.
 * Resultado: array de objetos:
 * [
 *   {
 *     cliente,
 *     empleado,
 *     horaPlan,
 *     horasPlan,
 *     asistencia,     // boolean
 *     horasReales,    // string/number
 *     observaciones,
 *     asistenciaRowNumber  // número de fila en ASISTENCIA_DB o null
 *   },
 *   ...
 * ]
 */



function getDailyAttendancePlan(fechaStr) {
  const fecha = (fechaStr || '').toString().trim();
  if (!fecha) return [];

  

  const dayName = getDayNameFromDateString_(fecha);

 
  if (!dayName) return [];

  // === PLAN SEMANAL (ASISTENCIA_PLAN) ===
  const planSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
  const lastRowPlan = planSheet.getLastRow();
  const lastColPlan = planSheet.getLastColumn();

  if (lastRowPlan < 2 || lastColPlan === 0) {
    return [];
  }

  const headersPlan = planSheet.getRange(1, 1, 1, lastColPlan).getValues()[0];
  

  const idxClientePlan    = headersPlan.indexOf('CLIENTE');
  const idxEmpleadoPlan   = headersPlan.indexOf('EMPLEADO');
  const idxDiaSemanaPlan  = headersPlan.indexOf('DIA SEMANA');
  const idxHoraEntrada    = headersPlan.indexOf('HORA ENTRADA');
  const idxHorasPlan      = headersPlan.indexOf('HORAS PLAN');
  const idxActivo         = headersPlan.indexOf('ACTIVO');
  const idxObsPlan        = headersPlan.indexOf('OBSERVACIONES');



  if (idxClientePlan === -1 || idxEmpleadoPlan === -1 || idxDiaSemanaPlan === -1) {
    return [];
  }

  const dataPlan = planSheet
    .getRange(2, 1, lastRowPlan - 1, lastColPlan)
    .getValues();

  

  const planRows = [];

    dataPlan.forEach(function (row, i) {
      const diaRow = (row[idxDiaSemanaPlan] || '')
        .toString()
        .trim()
        .toUpperCase();          // 👈 normalizamos a MAYÚSCULAS

      if (!diaRow) return;
      if (diaRow !== dayName) return;  // dayName ya viene como 'LUNES', 'MARTES', etc.


    // ACTIVO (si no hay columna o está vacío, tomamos activo = true)
    let activo = true;
    if (idxActivo > -1) {
      const v = row[idxActivo];
      activo =
        v === true ||
        v === 'TRUE' ||
        v === 'true' ||
        v === 1 ||
        v === '1' ||
        v === 'SI' ||
        v === 'Si';
    }
    if (!activo) return;

    const cliente  = row[idxClientePlan];
    const empleado = row[idxEmpleadoPlan];
    if (!cliente || !empleado) return;

    planRows.push({
      cliente: cliente,
      empleado: empleado,
      horaPlan: idxHoraEntrada > -1 ? row[idxHoraEntrada] : '',
      horasPlan: idxHorasPlan > -1 ? row[idxHorasPlan] : '',
      observacionesPlan: idxObsPlan > -1 ? row[idxObsPlan] : ''
    });
  });

  

  if (!planRows.length) {
    return [];
  }

  // === ASISTENCIA REAL (ASISTENCIA_DB) ===
  const asisSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
  const lastRowAsis = asisSheet.getLastRow();
  const lastColAsis = asisSheet.getLastColumn();

  let realMap = {}; // clave: cliente + '||' + empleado

  if (lastRowAsis >= 2 && lastColAsis > 0) {
    const headersAsis = asisSheet.getRange(1, 1, 1, lastColAsis).getValues()[0];

    const idxEmpleadoAsis = headersAsis.indexOf('EMPLEADO');
    const idxClienteAsis  = headersAsis.indexOf('CLIENTE');
    const idxFechaAsis    = headersAsis.indexOf('FECHA');
    const idxAsist        = headersAsis.indexOf('ASISTENCIA');
    const idxHorasReal    = headersAsis.indexOf('HORAS');
    const idxObsReal      = headersAsis.indexOf('OBSERVACIONES');

    if (
      idxEmpleadoAsis > -1 &&
      idxClienteAsis > -1 &&
      idxFechaAsis > -1
    ) {
      const dataAsis = asisSheet
        .getRange(2, 1, lastRowAsis - 1, lastColAsis)
        .getValues();

      dataAsis.forEach(function (row, i) {
        const fechaRowNorm = normalizeCellForSearch(row[idxFechaAsis]);
        if (fechaRowNorm !== fecha) return;

        const clienteRow  = row[idxClienteAsis];
        const empleadoRow = row[idxEmpleadoAsis];
        if (!clienteRow || !empleadoRow) return;

        const key = clienteRow + '||' + empleadoRow;

        let asistio = false;
        if (idxAsist > -1) {
          const v = row[idxAsist];
          asistio =
            v === true ||
            v === 'TRUE' ||
            v === 'true' ||
            v === 1 ||
            v === '1' ||
            v === 'Asistió';
        }

        realMap[key] = {
          rowNumber: i + 2,
          asistencia: asistio,
          horasReales: idxHorasReal > -1 ? row[idxHorasReal] : '',
          observaciones: idxObsReal > -1 ? row[idxObsReal] : ''
        };
      });
    }
  }

    // === Combinamos plan + realidad ===
  const rawResult = planRows.map(function (p) {
    const key = p.cliente + '||' + p.empleado;
    const r = realMap[key];

    return {
      cliente: p.cliente,
      empleado: p.empleado,
      horaPlan: p.horaPlan,
      horasPlan: p.horasPlan,
      asistencia: r ? r.asistencia : false,
      horasReales: r ? r.horasReales : '',
      observaciones: r ? r.observaciones : (p.observacionesPlan || ''),
      asistenciaRowNumber: r ? r.rowNumber : null
    };
  });

  // 👉 Normalizamos TODO a tipos simples para el front (evita null/undefined raros)
  const result = rawResult.map(function (row) {
    return {
      cliente: row.cliente != null ? String(row.cliente) : '',
      empleado: row.empleado != null ? String(row.empleado) : '',
      // la hora de entrada la mandamos como string legible
      horaPlan: row.horaPlan != null
        ? String(row.horaPlan)
        : '',
      horasPlan: row.horasPlan != null && row.horasPlan !== ''
        ? Number(row.horasPlan)
        : 0,
      asistencia: !!row.asistencia,
      horasReales: row.horasReales != null && row.horasReales !== ''
        ? String(row.horasReales)
        : '',
      observaciones: row.observaciones != null
        ? String(row.observaciones)
        : '',
      asistenciaRowNumber: row.asistenciaRowNumber != null
        ? Number(row.asistenciaRowNumber)
        : null
    };
  });

  

  // Ordenamos por cliente, luego empleado
  result.sort(function (a, b) {
    if (a.cliente < b.cliente) return -1;
    if (a.cliente > b.cliente) return 1;
    if (a.empleado < b.empleado) return -1;
    if (a.empleado > b.empleado) return 1;
    return 0;
  });

  return result;
}


/**
 * Guarda la asistencia de un día completo, en base a la grilla.
 *
 * rows: array de objetos:
 *   {
 *     cliente,
 *     empleado,
 *     horaPlan,
 *     horasPlan,
 *     asistencia,          // boolean
 *     horasReales,
 *     observaciones,
 *     asistenciaRowNumber  // número de fila o null
 *   }
 */
function saveDailyAttendance(fechaStr, rows) {
  const fecha = (fechaStr || '').toString().trim();
  if (!fecha || !Array.isArray(rows)) return;

  rows.forEach(function (item) {
    if (!item || !item.cliente || !item.empleado) return;

    // Si no asistió y no hay horas ni observaciones, podrías decidir no grabar nada.
    // Por ahora, grabamos igual para tener el registro.
    const record = {
      'EMPLEADO': item.empleado,
      'CLIENTE': item.cliente,
      'FECHA': fecha,
      'ASISTENCIA': !!item.asistencia,
      'HORAS': item.horasReales != null && item.horasReales !== ''
        ? item.horasReales
        : (item.horasPlan || ''),
      'OBSERVACIONES': item.observaciones != null ? item.observaciones : ''
    };

    if (item.asistenciaRowNumber) {
      updateRecord('ASISTENCIA', item.asistenciaRowNumber, record);
    } else {
      saveFormRecord('ASISTENCIA', record);
    }
  });
}

/**
 * Devuelve cuántas horas requiere un cliente en un día de la semana
 * y cuántas están planificadas actualmente.
 *
 * dayName debe ser: LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO
 *
 * Retorna:
 *   {
 *     required: number,    // horas requeridas según CLIENTES_DB
 *     planned: number,     // suma de HORAS PLAN activas en ASISTENCIA_PLAN_DB
 *     diff: number         // planned - required (positivo = te pasaste, negativo = falta)
 *   }
 */
function getClientDayCoverage(clienteLabel, dayName) {
  const result = {
    required: 0,
    planned: 0,
    diff: 0
  };

  if (!clienteLabel || !dayName) return result;

  // === 1) CLIENTES_DB: horas requeridas por día ===
  const clientesSheet = DatabaseService.getDbSheetForFormat('CLIENTES');
  const lastRowCli = clientesSheet.getLastRow();
  const lastColCli = clientesSheet.getLastColumn();
  if (lastRowCli >= 2 && lastColCli > 0) {
    const headersCli = clientesSheet.getRange(1, 1, 1, lastColCli).getValues()[0];

    const idxNombre   = headersCli.indexOf('NOMBRE');
    const idxRazon    = headersCli.indexOf('RAZON SOCIAL');
    const idxLunes    = headersCli.indexOf('LUNES HS');
    const idxMartes   = headersCli.indexOf('MARTES HS');
    const idxMiercoles= headersCli.indexOf('MIERCOLES HS');
    const idxJueves   = headersCli.indexOf('JUEVES HS');
    const idxViernes  = headersCli.indexOf('VIERNES HS');
    const idxSabado   = headersCli.indexOf('SABADO HS');
    const idxDomingo  = headersCli.indexOf('DOMINGO HS');

    // Elegimos el índice de columna según dayName
    let idxDay = -1;
    switch (dayName) {
      case 'LUNES': idxDay = idxLunes; break;
      case 'MARTES': idxDay = idxMartes; break;
      case 'MIERCOLES': idxDay = idxMiercoles; break;
      case 'JUEVES': idxDay = idxJueves; break;
      case 'VIERNES': idxDay = idxViernes; break;
      case 'SABADO': idxDay = idxSabado; break;
      case 'DOMINGO': idxDay = idxDomingo; break;
    }

    if (idxDay > -1) {
      const dataCli = clientesSheet
        .getRange(2, 1, lastRowCli - 1, lastColCli)
        .getValues();

      for (var i = 0; i < dataCli.length; i++) {
        const row = dataCli[i];
        const nombre = idxNombre > -1 ? row[idxNombre] : '';
        const razon  = idxRazon  > -1 ? row[idxRazon]  : '';

        // El combo de clientes en la UI usa razonSocial || nombre
        if (clienteLabel === razon || clienteLabel === nombre) {
          const raw = row[idxDay];
          const num = (raw === '' || raw == null) ? 0 : Number(raw);
          if (!isNaN(num)) {
            result.required = num;
          }
          break;
        }
      }
    }
  }

  // === 2) ASISTENCIA_PLAN_DB: horas planificadas activas ===
  const planSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
  const lastRowPlan = planSheet.getLastRow();
  const lastColPlan = planSheet.getLastColumn();
  if (lastRowPlan >= 2 && lastColPlan > 0) {
    const headersPlan = planSheet.getRange(1, 1, 1, lastColPlan).getValues()[0];

    const idxClientePlan   = headersPlan.indexOf('CLIENTE');
    const idxDiaSemanaPlan = headersPlan.indexOf('DIA SEMANA');
    const idxHorasPlan     = headersPlan.indexOf('HORAS PLAN');
    const idxActivo        = headersPlan.indexOf('ACTIVO');

    if (idxClientePlan > -1 && idxDiaSemanaPlan > -1 && idxHorasPlan > -1) {
      const dataPlan = planSheet
        .getRange(2, 1, lastRowPlan - 1, lastColPlan)
        .getValues();

      let totalPlan = 0;

      dataPlan.forEach(function (row) {
        const clienteRow = row[idxClientePlan];
        const diaRow = (row[idxDiaSemanaPlan] || '').toString().trim().toUpperCase();

        if (!clienteRow || diaRow !== dayName) return;
        if (clienteRow !== clienteLabel) return;

        let activo = true;
        if (idxActivo > -1) {
          const v = row[idxActivo];
          activo =
            v === true ||
            v === 'TRUE' ||
            v === 'true' ||
            v === 1 ||
            v === '1' ||
            v === 'SI' ||
            v === 'Si';
        }
        if (!activo) return;

        const rawHoras = row[idxHorasPlan];
        const numHoras = (rawHoras === '' || rawHoras == null) ? 0 : Number(rawHoras);
        if (!isNaN(numHoras)) {
          totalPlan += numHoras;
        }
      });

      result.planned = totalPlan;
    }
  }

  result.diff = result.planned - result.required;
  return result;
}

function buildWeeklyTemplateFromClient(cliente) {
  const sheetClientes = DatabaseService.getDbSheetForFormat('CLIENTES');
  const dataCli = sheetClientes.getDataRange().getValues();
  if (dataCli.length < 2) {
    return [];
  }

  const header = dataCli[0];
  const rows = dataCli.slice(1);

  const idxNombre   = header.indexOf('NOMBRE');
  const idxRazon    = header.indexOf('RAZON SOCIAL');
  const idxLunes    = header.indexOf('LUNES HS');
  const idxMartes   = header.indexOf('MARTES HS');
  const idxMiercoles= header.indexOf('MIERCOLES HS');
  const idxJueves   = header.indexOf('JUEVES HS');
  const idxViernes  = header.indexOf('VIERNES HS');
  const idxSabado   = header.indexOf('SABADO HS');
  const idxDomingo  = header.indexOf('DOMINGO HS');

  if (
    idxNombre === -1 || idxRazon === -1 ||
    idxLunes  === -1 || idxMartes === -1 ||
    idxMiercoles === -1 || idxJueves === -1 ||
    idxViernes === -1 || idxSabado === -1 ||
    idxDomingo === -1
  ) {
    throw new Error('Faltan columnas de horas (LUNES HS, etc.) en CLIENTES_DB.');
  }

  // Buscamos la fila del cliente
  let rowCliente = null;
  rows.forEach(function (row) {
    const nombre = row[idxNombre];
    const razon  = row[idxRazon];
    if (nombre === cliente || razon === cliente) {
      rowCliente = row;
    }
  });

  if (!rowCliente) {
    // No lo encontramos: no podemos armar plantilla
    return [];
  }

  const dias = [
    { label: 'LUNES',     idx: idxLunes },
    { label: 'MARTES',    idx: idxMartes },
    { label: 'MIERCOLES', idx: idxMiercoles },
    { label: 'JUEVES',    idx: idxJueves },
    { label: 'VIERNES',   idx: idxViernes },
    { label: 'SABADO',    idx: idxSabado },
    { label: 'DOMINGO',   idx: idxDomingo }
  ];

  const result = [];

  dias.forEach(function (d) {
    const val = rowCliente[d.idx];
    const horas = Number(val) || 0;
    if (horas > 0) {
      result.push({
        cliente: cliente,
        empleado: '',
        diaSemana: d.label,
        horaEntrada: '',         // la definís vos al planificar
        horasPlan: horas,
        activo: true,
        observaciones: ''
      });
    }
  });

  return result;
}

function getClientWeeklyRequestedHours(clienteLabel) {
  if (!clienteLabel) return null;

  const sheet = DatabaseService.getDbSheetForFormat('CLIENTES');
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  const header = data[0];
  const rows   = data.slice(1);

  const idxNombre    = header.indexOf('NOMBRE');
  const idxRazon     = header.indexOf('RAZON SOCIAL');
  const idxLunes     = header.indexOf('LUNES HS');
  const idxMartes    = header.indexOf('MARTES HS');
  const idxMiercoles = header.indexOf('MIERCOLES HS');
  const idxJueves    = header.indexOf('JUEVES HS');
  const idxViernes   = header.indexOf('VIERNES HS');
  const idxSabado    = header.indexOf('SABADO HS');
  const idxDomingo   = header.indexOf('DOMINGO HS');

  if (
    idxNombre    === -1 || idxRazon === -1 ||
    idxLunes     === -1 || idxMartes === -1 ||
    idxMiercoles === -1 || idxJueves === -1 ||
    idxViernes   === -1 || idxSabado === -1 ||
    idxDomingo   === -1
  ) {
    return null; // faltan columnas, no rompemos el front
  }

  // buscamos la fila del cliente
  let rowCli = null;
  rows.forEach(function (row) {
    const nombre = row[idxNombre];
    const razon  = row[idxRazon];
    if (nombre === clienteLabel || razon === clienteLabel) {
      rowCli = row;
    }
  });

  if (!rowCli) return null;

  function num(val) {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }

  const result = {
    cliente: clienteLabel,
    lunes:     num(rowCli[idxLunes]),
    martes:    num(rowCli[idxMartes]),
    miercoles: num(rowCli[idxMiercoles]),
    jueves:    num(rowCli[idxJueves]),
    viernes:   num(rowCli[idxViernes]),
    sabado:    num(rowCli[idxSabado]),
    domingo:   num(rowCli[idxDomingo])
  };

  // lo serializamos “seguro” para mandar al front
  return JSON.parse(JSON.stringify(result));
}



function getWeeklyPlanForClient(cliente) {
  if (!cliente) return [];

  const sheetPlan = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
  const dataPlan = sheetPlan.getDataRange().getValues();
  if (dataPlan.length < 2) {
    // solo encabezado o vacío: NO armamos plantilla, devolvemos []
    return [];
  }

  const headerPlan = dataPlan[0];
  const rowsPlan   = dataPlan.slice(1);

  const idxCliente     = headerPlan.indexOf('CLIENTE');
  const idxEmpleado    = headerPlan.indexOf('EMPLEADO');
  const idxDiaSemana   = headerPlan.indexOf('DIA SEMANA');
  const idxHoraEntrada = headerPlan.indexOf('HORA ENTRADA');
  const idxHorasPlan   = headerPlan.indexOf('HORAS PLAN');
  const idxActivo      = headerPlan.indexOf('ACTIVO');
  const idxObs         = headerPlan.indexOf('OBSERVACIONES');

  if (
    idxCliente     === -1 ||
    idxEmpleado    === -1 ||
    idxDiaSemana   === -1 ||
    idxHoraEntrada === -1 ||
    idxHorasPlan   === -1 ||
    idxActivo      === -1 ||
    idxObs         === -1
  ) {
    throw new Error('Faltan columnas en ASISTENCIA_PLAN_DB. Revisar encabezados.');
  }

  const targetNorm = String(cliente || '').trim().toLowerCase();
  const result = [];

  rowsPlan.forEach(function (row) {
    const cli     = row[idxCliente];
    const cliNorm = String(cli || '').trim().toLowerCase();
    if (cliNorm !== targetNorm) return;

    result.push({
      cliente: String(cli || ''),
      empleado: row[idxEmpleado] || '',
      diaSemana: row[idxDiaSemana] || '',
      horaEntrada: row[idxHoraEntrada] || '',
      horasPlan: row[idxHorasPlan] || '',
      activo:
        row[idxActivo] === true ||
        row[idxActivo] === 'TRUE' ||
        row[idxActivo] === 1 ||
        row[idxActivo] === '1',
      observaciones: row[idxObs] || ''
    });
  });

  // 👉 Convertimos a tipos 100% serializables para el front
  const safeResult = JSON.parse(JSON.stringify(result));
  Logger.log('getWeeklyPlanForClient (safe): ' + JSON.stringify(safeResult));
  return safeResult;
}



function saveWeeklyPlanForClient(cliente, items) {
  if (!cliente) throw new Error("Falta el cliente para guardar el plan.");

  items = items || [];

  const sheet = DatabaseService.getDbSheetForFormat("ASISTENCIA_PLAN");
  if (!sheet) {
    throw new Error("No se encontró la hoja para ASISTENCIA_PLAN.");
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  const idxCliente     = headers.indexOf("CLIENTE");
  const idxEmpleado    = headers.indexOf("EMPLEADO");
  const idxDiaSemana   = headers.indexOf("DIA SEMANA");
  const idxHoraEntrada = headers.indexOf("HORA ENTRADA");
  const idxHorasPlan   = headers.indexOf("HORAS PLAN");
  const idxActivo      = headers.indexOf("ACTIVO");
  const idxObs         = headers.indexOf("OBSERVACIONES");

  if (idxCliente === -1) {
    throw new Error('No existe la columna "CLIENTE" en ASISTENCIA_PLAN.');
  }

  // Leemos todos los datos actuales
  let existing = [];
  if (lastRow > 1) {
    existing = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  }

  // Dejamos todas las filas que NO son de este cliente
  const kept = existing.filter(function (row) {
    return String(row[idxCliente] || "") !== String(cliente);
  });

  // Armamos las filas nuevas para este cliente
  const newRows = (items || []).map(function (it) {
    const row = new Array(headers.length).fill("");

    row[idxCliente] = cliente;

    if (idxEmpleado    > -1) row[idxEmpleado]    = it.empleado      || "";
    if (idxDiaSemana   > -1) row[idxDiaSemana]   = it.diaSemana     || "";
    if (idxHoraEntrada > -1) row[idxHoraEntrada] = it.horaEntrada   || "";
    if (idxHorasPlan   > -1 && it.horasPlan !== "") {
      row[idxHorasPlan] = Number(it.horasPlan);
    }
    if (idxActivo      > -1) row[idxActivo]      = it.activo ? true : false;
    if (idxObs         > -1) row[idxObs]         = it.observaciones || "";

    return row;
  });

  const all = kept.concat(newRows);

  // Limpiamos cuerpo actual
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }

  if (all.length) {
    sheet.getRange(2, 1, all.length, lastCol).setValues(all);
  }
}

