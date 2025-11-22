/**
 * AttendanceController - Weekly Plan
 * Funciones para gestión de planificación semanal
 */

const AttendanceWeeklyPlan = (function () {

    /**
     * Construye un template semanal basado en las horas contratadas del cliente
     * @param {string} cliente - Nombre del cliente
     * @returns {Array} Template con días y horas
     */
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

    /**
     * Obtiene el plan semanal completo para un cliente
     * @param {string} cliente - Nombre del cliente
     * @returns {Array} Plan semanal actual
     */
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
                activo: DataUtils.isTruthy(row[idxActivo]),
                observaciones: row[idxObs] || ''
            });
        });

        return JSON.parse(JSON.stringify(result));
    }

    /**
     * Guarda el plan semanal completo para un cliente
     * @param {string} cliente - Nombre del cliente
     * @param {Array} items - Array de items del plan
     */
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

        // Mantener registros de otros clientes
        let existing = [];
        if (lastRow > 1) {
            existing = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        }

        const kept = existing.filter(function (row) {
            return String(row[idxCliente] || '') !== String(cliente);
        });

        // Crear nuevas filas para este cliente
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

        // Limpiar y escribir
        if (lastRow > 1) {
            sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
        }

        if (all.length) {
            sheet.getRange(2, 1, all.length, lastCol).setValues(all);
        }
    }

    return {
        buildWeeklyTemplateFromClient: buildWeeklyTemplateFromClient,
        getWeeklyPlanForClient: getWeeklyPlanForClient,
        saveWeeklyPlanForClient: saveWeeklyPlanForClient
    };
})();
