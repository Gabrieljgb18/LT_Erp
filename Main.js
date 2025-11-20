/**
 * Backend reorganizado en capas (Helpers, Controladores) para MVC simple.
 * Las funciones globales al final exponen la API que consume la Web App.
 */

// ===================== Helpers / Utils =====================

const Util = (function () {
  function normalizeCellForSearch(cell) {
    if (cell === null || cell === '') return '';

    if (cell instanceof Date) {
      return Utilities.formatDate(
        cell,
        Session.getScriptTimeZone(),
        'yyyy-MM-dd'
      );
    }

    return String(cell);
  }

  function isTruthy(value) {
    return (
      value === true ||
      value === 'TRUE' ||
      value === 'true' ||
      value === 1 ||
      value === '1' ||
      value === 'Activo' ||
      value === 'SI' ||
      value === 'Si' ||
      value === 'Asistió'
    );
  }

  // Convierte "2025-12-11" o "11/12/2025" a LUNES, MARTES, etc.
  function getDayNameFromDateString(fechaStr) {
    if (!fechaStr) return '';

    let d;

    if (Object.prototype.toString.call(fechaStr) === '[object Date]') {
      d = fechaStr;
    } else {
      const s = String(fechaStr).trim();

      if (s.indexOf('-') >= 0) {
        const p = s.split('-'); // [yyyy, mm, dd]
        d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
      } else if (s.indexOf('/') >= 0) {
        const p2 = s.split('/'); // [dd, mm, yyyy]
        d = new Date(Number(p2[2]), Number(p2[1]) - 1, Number(p2[0]));
      } else {
        d = new Date(s);
      }
    }

    if (isNaN(d)) return '';

    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    return dias[d.getDay()];
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  return {
    normalizeCellForSearch: normalizeCellForSearch,
    isTruthy: isTruthy,
    getDayNameFromDateString: getDayNameFromDateString,
    todayIso: todayIso
  };
})();

// ===================== Controlador de Registros (CRUD genérico) =====================

const RecordController = (function () {

  function getAvailableFormats() {
    return Formats.getAvailableFormats();
  }

  function searchRecords(tipoFormato, query) {
    const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow < 2 || lastCol === 0) return [];

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    const q = (query || '').toString().toLowerCase().trim();
    const results = [];

    data.forEach(function (row, index) {
      const rowStrings = row.map(Util.normalizeCellForSearch);
      const rowText = rowStrings.join(' ').toLowerCase();

      if (!q || rowText.indexOf(q) !== -1) {
        const record = {};
        headers.forEach(function (h, colIdx) {
          record[h] = rowStrings[colIdx];
        });

        results.push({
          rowNumber: index + 2,
          record: record
        });
      }
    });

    return results;
  }

  function buildRowValues(headers, record) {
    return headers.map(function (h) {
      return record[h] != null ? record[h] : '';
    });
  }

  function saveRecord(tipoFormato, record) {
    const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);
    const template = Formats.getFormatTemplate(tipoFormato);
    if (!template) {
      throw new Error('Formato no encontrado: ' + tipoFormato);
    }

    const headers = template.headers || [];
    if (!headers.length) {
      throw new Error('El formato no tiene headers definidos: ' + tipoFormato);
    }

    const row = buildRowValues(headers, record);
    sheet.appendRow(row);

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

    const currentRowValues = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
    const currentRecord = {};
    headerRow.forEach(function (h, idx) {
      currentRecord[h] = currentRowValues[idx];
    });

    const newRowValues = buildRowValues(headers, newRecord);
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([newRowValues]);

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

  function deleteRecord(tipoFormato, rowNumber) {
    const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);
    sheet.deleteRow(rowNumber);
  }

  function getReferenceData() {
    return DatabaseService.getReferenceData();
  }

  return {
    getAvailableFormats: getAvailableFormats,
    searchRecords: searchRecords,
    saveRecord: saveRecord,
    updateRecord: updateRecord,
    deleteRecord: deleteRecord,
    getReferenceData: getReferenceData
  };
})();

// ===================== Controlador de Asistencias / Planificación =====================

const AttendanceController = (function () {

  function getPlanVsAsistencia(fechaStr, cliente) {
    const fecha = (fechaStr || '').toString().trim();
    if (!fecha || !cliente) return [];

    const dayName = Util.getDayNameFromDateString(fecha);
    if (!dayName) return [];

    const planSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
    const lastRowPlan = planSheet.getLastRow();
    const lastColPlan = planSheet.getLastColumn();
    if (lastRowPlan < 2 || lastColPlan === 0) return [];

    const headersPlan = planSheet.getRange(1, 1, 1, lastColPlan).getValues()[0];

    const idxClientePlan = headersPlan.indexOf('CLIENTE');
    const idxEmpleadoPlan = headersPlan.indexOf('EMPLEADO');
    const idxDiaSemanaPlan = headersPlan.indexOf('DIA SEMANA');
    const idxHoraEntrada = headersPlan.indexOf('HORA ENTRADA');
    const idxHorasPlan = headersPlan.indexOf('HORAS PLAN');
    const idxActivoPlan = headersPlan.indexOf('ACTIVO');
    const idxObsPlan = headersPlan.indexOf('OBSERVACIONES');

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

      let activo = true;
      if (idxActivoPlan > -1) {
        activo = Util.isTruthy(row[idxActivoPlan]);
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

    if (!planRows.length) return [];

    const asisSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
    const lastRowAsis = asisSheet.getLastRow();
    const lastColAsis = asisSheet.getLastColumn();

    let realMap = {};

    if (lastRowAsis >= 2 && lastColAsis > 0) {
      const headersAsis = asisSheet.getRange(1, 1, 1, lastColAsis).getValues()[0];

      const idxEmpAsis = headersAsis.indexOf('EMPLEADO');
      const idxCliAsis = headersAsis.indexOf('CLIENTE');
      const idxFechaAsis = headersAsis.indexOf('FECHA');
      const idxAsist = headersAsis.indexOf('ASISTENCIA');
      const idxHorasReal = headersAsis.indexOf('HORAS');
      const idxObsReal = headersAsis.indexOf('OBSERVACIONES');

      if (idxEmpAsis > -1 && idxCliAsis > -1 && idxFechaAsis > -1) {
        const dataAsis = asisSheet.getRange(2, 1, lastRowAsis - 1, lastColAsis).getValues();

        dataAsis.forEach(function (row, i) {
          const fechaRow = Util.normalizeCellForSearch(row[idxFechaAsis]);
          if (fechaRow !== fecha) return;

          const cliRow = row[idxCliAsis];
          const empRow = row[idxEmpAsis];
          if (!cliRow || !empRow) return;
          if (cliRow !== cliente) return;

          const asistio = idxAsist > -1 ? Util.isTruthy(row[idxAsist]) : false;

          realMap[empRow] = {
            rowNumber: i + 2,
            asistencia: asistio,
            horas: idxHorasReal > -1 ? row[idxHorasReal] : '',
            observaciones: idxObsReal > -1 ? row[idxObsReal] : ''
          };
        });
      }
    }

    const empleados = planRows
      .map(function (r) { return r.empleado; })
      .filter(function (v, i, arr) { return arr.indexOf(v) === i; })
      .sort();

    return empleados.map(function (emp) {
      const p = planRows.find(function (x) { return x.empleado === emp; });
      const r = realMap[emp];

      const asistio = r ? !!r.asistencia : false;

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
        RecordController.updateRecord('ASISTENCIA', it.realRowNumber, record);
      } else {
        RecordController.saveRecord('ASISTENCIA', record);
      }
    });
  }

  function getDailyAttendancePlan(fechaStr) {
    const fecha = (fechaStr || '').toString().trim();
    if (!fecha) return [];

    const dayName = Util.getDayNameFromDateString(fecha);
    if (!dayName) return [];

    const planSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
    const lastRowPlan = planSheet.getLastRow();
    const lastColPlan = planSheet.getLastColumn();

    if (lastRowPlan < 2 || lastColPlan === 0) {
      return [];
    }

    const headersPlan = planSheet.getRange(1, 1, 1, lastColPlan).getValues()[0];

    const idxClientePlan = headersPlan.indexOf('CLIENTE');
    const idxEmpleadoPlan = headersPlan.indexOf('EMPLEADO');
    const idxDiaSemanaPlan = headersPlan.indexOf('DIA SEMANA');
    const idxHoraEntrada = headersPlan.indexOf('HORA ENTRADA');
    const idxHorasPlan = headersPlan.indexOf('HORAS PLAN');
    const idxActivo = headersPlan.indexOf('ACTIVO');
    const idxObsPlan = headersPlan.indexOf('OBSERVACIONES');

    if (idxClientePlan === -1 || idxEmpleadoPlan === -1 || idxDiaSemanaPlan === -1) {
      return [];
    }

    const dataPlan = planSheet
      .getRange(2, 1, lastRowPlan - 1, lastColPlan)
      .getValues();

    const planRows = [];

    dataPlan.forEach(function (row) {
      const diaRow = (row[idxDiaSemanaPlan] || '')
        .toString()
        .trim()
        .toUpperCase();

      if (!diaRow) return;
      if (diaRow !== dayName) return;

      let activo = true;
      if (idxActivo > -1) {
        activo = Util.isTruthy(row[idxActivo]);
      }
      if (!activo) return;

      const cliente = row[idxClientePlan];
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

    const asisSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
    const lastRowAsis = asisSheet.getLastRow();
    const lastColAsis = asisSheet.getLastColumn();

    let realMap = {};

    if (lastRowAsis >= 2 && lastColAsis > 0) {
      const headersAsis = asisSheet.getRange(1, 1, 1, lastColAsis).getValues()[0];

      const idxEmpleadoAsis = headersAsis.indexOf('EMPLEADO');
      const idxClienteAsis = headersAsis.indexOf('CLIENTE');
      const idxFechaAsis = headersAsis.indexOf('FECHA');
      const idxAsist = headersAsis.indexOf('ASISTENCIA');
      const idxHorasReal = headersAsis.indexOf('HORAS');
      const idxObsReal = headersAsis.indexOf('OBSERVACIONES');

      if (
        idxEmpleadoAsis > -1 &&
        idxClienteAsis > -1 &&
        idxFechaAsis > -1
      ) {
        const dataAsis = asisSheet
          .getRange(2, 1, lastRowAsis - 1, lastColAsis)
          .getValues();

        dataAsis.forEach(function (row, i) {
          const fechaRowNorm = Util.normalizeCellForSearch(row[idxFechaAsis]);
          if (fechaRowNorm !== fecha) return;

          const clienteRow = row[idxClienteAsis];
          const empleadoRow = row[idxEmpleadoAsis];
          if (!clienteRow || !empleadoRow) return;

          const key = clienteRow + '||' + empleadoRow;
          const asistio = idxAsist > -1 ? Util.isTruthy(row[idxAsist]) : false;

          realMap[key] = {
            rowNumber: i + 2,
            asistencia: asistio,
            horasReales: idxHorasReal > -1 ? row[idxHorasReal] : '',
            observaciones: idxObsReal > -1 ? row[idxObsReal] : ''
          };
        });
      }
    }

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

    const result = rawResult.map(function (row) {
      return {
        cliente: row.cliente != null ? String(row.cliente) : '',
        empleado: row.empleado != null ? String(row.empleado) : '',
        horaPlan: row.horaPlan != null ? String(row.horaPlan) : '',
        horasPlan: row.horasPlan != null && row.horasPlan !== '' ? Number(row.horasPlan) : 0,
        asistencia: !!row.asistencia,
        horasReales: row.horasReales != null && row.horasReales !== '' ? String(row.horasReales) : '',
        observaciones: row.observaciones != null ? String(row.observaciones) : '',
        asistenciaRowNumber: row.asistenciaRowNumber != null ? Number(row.asistenciaRowNumber) : null
      };
    });

    result.sort(function (a, b) {
      if (a.cliente < b.cliente) return -1;
      if (a.cliente > b.cliente) return 1;
      if (a.empleado < b.empleado) return -1;
      if (a.empleado > b.empleado) return 1;
      return 0;
    });

    return result;
  }

  function saveDailyAttendance(fechaStr, rows) {
    const fecha = (fechaStr || '').toString().trim();
    if (!fecha || !Array.isArray(rows)) return;

    rows.forEach(function (item) {
      if (!item || !item.cliente || !item.empleado) return;

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
        RecordController.updateRecord('ASISTENCIA', item.asistenciaRowNumber, record);
      } else {
        RecordController.saveRecord('ASISTENCIA', record);
      }
    });
  }

  function getClientDayCoverage(clienteLabel, dayName) {
    const result = {
      required: 0,
      planned: 0,
      diff: 0
    };

    if (!clienteLabel || !dayName) return result;

    const clientesSheet = DatabaseService.getDbSheetForFormat('CLIENTES');
    const lastRowCli = clientesSheet.getLastRow();
    const lastColCli = clientesSheet.getLastColumn();
    if (lastRowCli >= 2 && lastColCli > 0) {
      const headersCli = clientesSheet.getRange(1, 1, 1, lastColCli).getValues()[0];

      const idxNombre = headersCli.indexOf('NOMBRE');
      const idxRazon = headersCli.indexOf('RAZON SOCIAL');
      const idxLunes = headersCli.indexOf('LUNES HS');
      const idxMartes = headersCli.indexOf('MARTES HS');
      const idxMiercoles = headersCli.indexOf('MIERCOLES HS');
      const idxJueves = headersCli.indexOf('JUEVES HS');
      const idxViernes = headersCli.indexOf('VIERNES HS');
      const idxSabado = headersCli.indexOf('SABADO HS');
      const idxDomingo = headersCli.indexOf('DOMINGO HS');

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

        for (let i = 0; i < dataCli.length; i++) {
          const row = dataCli[i];
          const nombre = idxNombre > -1 ? row[idxNombre] : '';
          const razon = idxRazon > -1 ? row[idxRazon] : '';

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

    const planSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
    const lastRowPlan = planSheet.getLastRow();
    const lastColPlan = planSheet.getLastColumn();
    if (lastRowPlan >= 2 && lastColPlan > 0) {
      const headersPlan = planSheet.getRange(1, 1, 1, lastColPlan).getValues()[0];

      const idxClientePlan = headersPlan.indexOf('CLIENTE');
      const idxDiaSemanaPlan = headersPlan.indexOf('DIA SEMANA');
      const idxHorasPlan = headersPlan.indexOf('HORAS PLAN');
      const idxActivo = headersPlan.indexOf('ACTIVO');

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
            activo = Util.isTruthy(row[idxActivo]);
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

    const idxNombre = header.indexOf('NOMBRE');
    const idxRazon = header.indexOf('RAZON SOCIAL');
    const idxLunes = header.indexOf('LUNES HS');
    const idxMartes = header.indexOf('MARTES HS');
    const idxMiercoles = header.indexOf('MIERCOLES HS');
    const idxJueves = header.indexOf('JUEVES HS');
    const idxViernes = header.indexOf('VIERNES HS');
    const idxSabado = header.indexOf('SABADO HS');
    const idxDomingo = header.indexOf('DOMINGO HS');

    if (
      idxNombre === -1 || idxRazon === -1 ||
      idxLunes === -1 || idxMartes === -1 ||
      idxMiercoles === -1 || idxJueves === -1 ||
      idxViernes === -1 || idxSabado === -1 ||
      idxDomingo === -1
    ) {
      throw new Error('Faltan columnas de horas (LUNES HS, etc.) en CLIENTES_DB.');
    }

    let rowCliente = null;
    rows.forEach(function (row) {
      const nombre = row[idxNombre];
      const razon = row[idxRazon];
      if (nombre === cliente || razon === cliente) {
        rowCliente = row;
      }
    });

    if (!rowCliente) {
      return [];
    }

    const dias = [
      { label: 'LUNES', idx: idxLunes },
      { label: 'MARTES', idx: idxMartes },
      { label: 'MIERCOLES', idx: idxMiercoles },
      { label: 'JUEVES', idx: idxJueves },
      { label: 'VIERNES', idx: idxViernes },
      { label: 'SABADO', idx: idxSabado },
      { label: 'DOMINGO', idx: idxDomingo }
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
          horaEntrada: '',
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
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return null;

    const header = data[0];
    const rows = data.slice(1);

    const idxNombre = header.indexOf('NOMBRE');
    const idxRazon = header.indexOf('RAZON SOCIAL');
    const idxLunes = header.indexOf('LUNES HS');
    const idxMartes = header.indexOf('MARTES HS');
    const idxMiercoles = header.indexOf('MIERCOLES HS');
    const idxJueves = header.indexOf('JUEVES HS');
    const idxViernes = header.indexOf('VIERNES HS');
    const idxSabado = header.indexOf('SABADO HS');
    const idxDomingo = header.indexOf('DOMINGO HS');

    if (
      idxNombre === -1 || idxRazon === -1 ||
      idxLunes === -1 || idxMartes === -1 ||
      idxMiercoles === -1 || idxJueves === -1 ||
      idxViernes === -1 || idxSabado === -1 ||
      idxDomingo === -1
    ) {
      return null;
    }

    let rowCli = null;
    rows.forEach(function (row) {
      const nombre = row[idxNombre];
      const razon = row[idxRazon];
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
      lunes: num(rowCli[idxLunes]),
      martes: num(rowCli[idxMartes]),
      miercoles: num(rowCli[idxMiercoles]),
      jueves: num(rowCli[idxJueves]),
      viernes: num(rowCli[idxViernes]),
      sabado: num(rowCli[idxSabado]),
      domingo: num(rowCli[idxDomingo])
    };

    return JSON.parse(JSON.stringify(result));
  }

  function getWeeklyPlanForClient(cliente) {
    if (!cliente) return [];

    const sheetPlan = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
    const dataPlan = sheetPlan.getDataRange().getValues();
    if (dataPlan.length < 2) {
      return [];
    }

    const headerPlan = dataPlan[0];
    const rowsPlan = dataPlan.slice(1);

    const idxCliente = headerPlan.indexOf('CLIENTE');
    const idxEmpleado = headerPlan.indexOf('EMPLEADO');
    const idxDiaSemana = headerPlan.indexOf('DIA SEMANA');
    const idxHoraEntrada = headerPlan.indexOf('HORA ENTRADA');
    const idxHorasPlan = headerPlan.indexOf('HORAS PLAN');
    const idxActivo = headerPlan.indexOf('ACTIVO');
    const idxObs = headerPlan.indexOf('OBSERVACIONES');

    if (
      idxCliente === -1 ||
      idxEmpleado === -1 ||
      idxDiaSemana === -1 ||
      idxHoraEntrada === -1 ||
      idxHorasPlan === -1 ||
      idxActivo === -1 ||
      idxObs === -1
    ) {
      throw new Error('Faltan columnas en ASISTENCIA_PLAN_DB. Revisar encabezados.');
    }

    const targetNorm = String(cliente || '').trim().toLowerCase();
    const result = [];

    rowsPlan.forEach(function (row) {
      const cli = row[idxCliente];
      const cliNorm = String(cli || '').trim().toLowerCase();
      if (cliNorm !== targetNorm) return;

      result.push({
        cliente: String(cli || ''),
        empleado: row[idxEmpleado] || '',
        diaSemana: row[idxDiaSemana] || '',
        horaEntrada: row[idxHoraEntrada] || '',
        horasPlan: row[idxHorasPlan] || '',
        activo: Util.isTruthy(row[idxActivo]),
        observaciones: row[idxObs] || ''
      });
    });

    return JSON.parse(JSON.stringify(result));
  }

  function saveWeeklyPlanForClient(cliente, items) {
    if (!cliente) throw new Error('Falta el cliente para guardar el plan.');

    items = items || [];

    const sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
    if (!sheet) {
      throw new Error('No se encontró la hoja para ASISTENCIA_PLAN.');
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    const idxCliente = headers.indexOf('CLIENTE');
    const idxEmpleado = headers.indexOf('EMPLEADO');
    const idxDiaSemana = headers.indexOf('DIA SEMANA');
    const idxHoraEntrada = headers.indexOf('HORA ENTRADA');
    const idxHorasPlan = headers.indexOf('HORAS PLAN');
    const idxActivo = headers.indexOf('ACTIVO');
    const idxObs = headers.indexOf('OBSERVACIONES');

    if (idxCliente === -1) {
      throw new Error('No existe la columna "CLIENTE" en ASISTENCIA_PLAN.');
    }

    let existing = [];
    if (lastRow > 1) {
      existing = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    }

    const kept = existing.filter(function (row) {
      return String(row[idxCliente] || '') !== String(cliente);
    });

    const newRows = (items || []).map(function (it) {
      const row = new Array(headers.length).fill('');

      row[idxCliente] = cliente;

      if (idxEmpleado > -1) row[idxEmpleado] = it.empleado || '';
      if (idxDiaSemana > -1) row[idxDiaSemana] = it.diaSemana || '';
      if (idxHoraEntrada > -1) row[idxHoraEntrada] = it.horaEntrada || '';
      if (idxHorasPlan > -1 && it.horasPlan !== '') {
        row[idxHorasPlan] = Number(it.horasPlan);
      }
      if (idxActivo > -1) row[idxActivo] = it.activo ? true : false;
      if (idxObs > -1) row[idxObs] = it.observaciones || '';

      return row;
    });

    const all = kept.concat(newRows);

    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    }

    if (all.length) {
      sheet.getRange(2, 1, all.length, lastCol).setValues(all);
    }
  }

  return {
    getPlanVsAsistencia: getPlanVsAsistencia,
    saveAsistenciaFromPlan: saveAsistenciaFromPlan,
    getDailyAttendancePlan: getDailyAttendancePlan,
    saveDailyAttendance: saveDailyAttendance,
    getClientDayCoverage: getClientDayCoverage,
    buildWeeklyTemplateFromClient: buildWeeklyTemplateFromClient,
    getClientWeeklyRequestedHours: getClientWeeklyRequestedHours,
    getWeeklyPlanForClient: getWeeklyPlanForClient,
    saveWeeklyPlanForClient: saveWeeklyPlanForClient
  };
})();

// ===================== API pública (google.script.run) =====================

function getAvailableFormats() {
  return RecordController.getAvailableFormats();
}

function searchRecords(tipoFormato, query) {
  return RecordController.searchRecords(tipoFormato, query);
}

function saveFormRecord(tipoFormato, record) {
  return RecordController.saveRecord(tipoFormato, record);
}

function updateRecord(tipoFormato, rowNumber, newRecord) {
  return RecordController.updateRecord(tipoFormato, rowNumber, newRecord);
}

function deleteRecord(tipoFormato, rowNumber) {
  return RecordController.deleteRecord(tipoFormato, rowNumber);
}

function getReferenceData() {
  return RecordController.getReferenceData();
}

function getPlanVsAsistencia(fechaStr, cliente) {
  return AttendanceController.getPlanVsAsistencia(fechaStr, cliente);
}

function saveAsistenciaFromPlan(fechaStr, cliente, items) {
  return AttendanceController.saveAsistenciaFromPlan(fechaStr, cliente, items);
}

function getDailyAttendancePlan(fechaStr) {
  return AttendanceController.getDailyAttendancePlan(fechaStr);
}

function saveDailyAttendance(fechaStr, rows) {
  return AttendanceController.saveDailyAttendance(fechaStr, rows);
}

function getClientDayCoverage(clienteLabel, dayName) {
  return AttendanceController.getClientDayCoverage(clienteLabel, dayName);
}

function buildWeeklyTemplateFromClient(cliente) {
  return AttendanceController.buildWeeklyTemplateFromClient(cliente);
}

function getClientWeeklyRequestedHours(clienteLabel) {
  return AttendanceController.getClientWeeklyRequestedHours(clienteLabel);
}

function getWeeklyPlanForClient(cliente) {
  return AttendanceController.getWeeklyPlanForClient(cliente);
}

function saveWeeklyPlanForClient(cliente, items) {
  return AttendanceController.saveWeeklyPlanForClient(cliente, items);
}
