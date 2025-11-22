/**
 * AttendanceController - Daily Attendance
 * Funciones para gestión de asistencia diaria
 */

const AttendanceDailyAttendance = (function () {

    /**
     * Obtiene el plan de asistencia diaria para una fecha específica
     * @param {string} fechaStr - Fecha
     * @returns {Array} Lista con cliente, empleado, plan y asistencia real
     */
    function getDailyAttendancePlan(fechaStr) {
        const fecha = (fechaStr || '').toString().trim();
        if (!fecha) return [];

        const dayName = DateUtils.getDayNameFromDateString(fecha);
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
                activo = DataUtils.isTruthy(row[idxActivo]);
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
                    const fechaRowNorm = DataUtils.normalizeCellForSearch(row[idxFechaAsis]);
                    if (fechaRowNorm !== fecha) return;

                    const clienteRow = row[idxClienteAsis];
                    const empleadoRow = row[idxEmpleadoAsis];
                    if (!clienteRow || !empleadoRow) return;

                    const key = clienteRow + '||' + empleadoRow;
                    const asistio = idxAsist > -1 ? DataUtils.isTruthy(row[idxAsist]) : false;

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

    /**
     * Guarda la asistencia diaria
     * @param {string} fechaStr - Fecha
     * @param {Array} rows - Array de registros de asistencia
     */
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

    return {
        getDailyAttendancePlan: getDailyAttendancePlan,
        saveDailyAttendance: saveDailyAttendance
    };
})();
