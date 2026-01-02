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

        const idxIdClientePlan = headersPlan.indexOf('ID_CLIENTE');
        const idxIdEmpleadoPlan = headersPlan.indexOf('ID_EMPLEADO');
        const idxClientePlan = headersPlan.indexOf('CLIENTE');
        const idxEmpleadoPlan = headersPlan.indexOf('EMPLEADO');
        const idxDiaSemanaPlan = headersPlan.indexOf('DIA SEMANA');
        const idxHoraEntrada = headersPlan.indexOf('HORA ENTRADA');
        const idxHorasPlan = headersPlan.indexOf('HORAS PLAN');
        const idxVigDesde = headersPlan.indexOf('VIGENTE DESDE');
        const idxVigHasta = headersPlan.indexOf('VIGENTE HASTA');
        const idxObsPlan = headersPlan.indexOf('OBSERVACIONES');

        if (idxClientePlan === -1 || idxEmpleadoPlan === -1 || idxDiaSemanaPlan === -1) {
            return [];
        }
        if (idxIdClientePlan === -1 || idxIdEmpleadoPlan === -1) {
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

            // Vigencia
            let vigDesdeDate = null;
            let vigHastaDate = null;
            if (idxVigDesde > -1 && row[idxVigDesde]) {
                const d = row[idxVigDesde] instanceof Date ? row[idxVigDesde] : new Date(row[idxVigDesde]);
                vigDesdeDate = isNaN(d) ? null : d;
            }
            if (idxVigHasta > -1 && row[idxVigHasta]) {
                const d = row[idxVigHasta] instanceof Date ? row[idxVigHasta] : new Date(row[idxVigHasta]);
                vigHastaDate = isNaN(d) ? null : d;
            }

            if (vigDesdeDate && vigDesdeDate > fecha) return;
            if (vigHastaDate && vigHastaDate < fecha) return;

            const cliente = row[idxClientePlan];
            const empleado = row[idxEmpleadoPlan];
            const idCliente = idxIdClientePlan > -1 ? String(row[idxIdClientePlan] || '').trim() : '';
            const idEmpleado = idxIdEmpleadoPlan > -1 ? String(row[idxIdEmpleadoPlan] || '').trim() : '';
            if (!idCliente || !idEmpleado) return;
            if (!cliente || !empleado) return;

            const horasPlanVal = idxHorasPlan > -1 ? row[idxHorasPlan] : '';
            const numHoras = Number(horasPlanVal);
            if (!isNaN(numHoras) && numHoras <= 0) return; // skip planes de 0 horas

            planRows.push({
                cliente: cliente,
                empleado: empleado,
                horaPlan: idxHoraEntrada > -1 ? row[idxHoraEntrada] : '',
                horasPlan: horasPlanVal,
                observacionesPlan: idxObsPlan > -1 ? row[idxObsPlan] : '',
                idCliente: idCliente,
                idEmpleado: idEmpleado
            });
        });

        // Si no hay plan para el día, igual intentamos mostrar la asistencia ya cargada
        const noPlanForDay = planRows.length === 0;

        const asisSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
        const lastRowAsis = asisSheet.getLastRow();
        const lastColAsis = asisSheet.getLastColumn();

        const planMap = new Map();
        planRows.forEach(function (p) {
            if (!p.idCliente || !p.idEmpleado) return;
            const key = String(p.idCliente) + '||' + String(p.idEmpleado);
            planMap.set(key, p);
        });

        const attendanceRows = [];

        if (lastRowAsis >= 2 && lastColAsis > 0) {
            const headersAsis = asisSheet.getRange(1, 1, 1, lastColAsis).getValues()[0];

            const idxIdAsis = headersAsis.indexOf('ID');
            const idxIdEmpleadoAsis = headersAsis.indexOf('ID_EMPLEADO');
            const idxEmpleadoAsis = headersAsis.indexOf('EMPLEADO');
            const idxIdClienteAsis = headersAsis.indexOf('ID_CLIENTE');
            const idxClienteAsis = headersAsis.indexOf('CLIENTE');
            const idxFechaAsis = headersAsis.indexOf('FECHA');
            const idxAsist = headersAsis.indexOf('ASISTENCIA');
            const idxHorasReal = headersAsis.indexOf('HORAS');
            const idxObsReal = headersAsis.indexOf('OBSERVACIONES');

            if (
                idxEmpleadoAsis > -1 &&
                idxClienteAsis > -1 &&
                idxFechaAsis > -1 &&
                idxIdClienteAsis > -1 &&
                idxIdEmpleadoAsis > -1
            ) {
                const dataAsis = asisSheet
                    .getRange(2, 1, lastRowAsis - 1, lastColAsis)
                    .getValues();

                dataAsis.forEach(function (row, i) {
                    const fechaRowNorm = DataUtils.normalizeCellForSearch(row[idxFechaAsis]);
                    if (fechaRowNorm !== fecha) return;

                    const clienteRow = row[idxClienteAsis];
                    const empleadoRow = row[idxEmpleadoAsis];
                    const rowIdCliente = String(row[idxIdClienteAsis] || '').trim();
                    const rowIdEmpleado = String(row[idxIdEmpleadoAsis] || '').trim();
                    if (!clienteRow || !empleadoRow) return;
                    if (!rowIdCliente || !rowIdEmpleado) return;

                    const asistio = idxAsist > -1 ? DataUtils.isTruthy(row[idxAsist]) : false;
                    const key = rowIdCliente + '||' + rowIdEmpleado;
                    const planData = planMap.get(key);

                    attendanceRows.push({
                        cliente: clienteRow,
                        empleado: empleadoRow,
                        idAsistencia: idxIdAsis > -1 ? row[idxIdAsis] : '',
                        idCliente: rowIdCliente,
                        idEmpleado: rowIdEmpleado,
                        horaPlan: planData ? planData.horaPlan : '',
                        horasPlan: planData ? planData.horasPlan : '',
                        asistenciaRowNumber: i + 2,
                        asistencia: asistio,
                        horasReales: idxHorasReal > -1 ? row[idxHorasReal] : '',
                        observaciones: idxObsReal > -1 ? row[idxObsReal] : '',
                        fueraDePlan: !planData
                    });

                    // Si hay asistencia para un registro de plan, no lo repetimos luego como faltante
                    if (planMap.has(key)) {
                        planMap.delete(key);
                    }
                });
            }
        }

        // Si no hay plan ni registros reales para la fecha, devolvemos vacío
        if (planMap.size === 0 && attendanceRows.length === 0 && noPlanForDay) {
            return [];
        }

        // Lo que queda en planMap son filas de plan sin asistencia registrada
        const planPendiente = Array.from(planMap.values()).map(function (p) {
            return {
                cliente: p.cliente,
                empleado: p.empleado,
                horaPlan: p.horaPlan,
                horasPlan: p.horasPlan,
                observaciones: p.observacionesPlan || '',
                asistencia: false,
                horasReales: '',
                asistenciaRowNumber: null,
                idAsistencia: null,
                fueraDePlan: false,
                idCliente: p.idCliente || '',
                idEmpleado: p.idEmpleado || ''
            };
        });

        const combined = attendanceRows.concat(planPendiente);

        if (!combined.length) {
            return [];
        }

        const result = combined.map(function (row) {
            return {
                cliente: row.cliente != null ? String(row.cliente) : '',
                empleado: row.empleado != null ? String(row.empleado) : '',
                horaPlan: row.horaPlan != null ? String(row.horaPlan) : '',
                horasPlan: row.horasPlan != null && row.horasPlan !== '' ? Number(row.horasPlan) : 0,
                asistencia: !!row.asistencia,
                horasReales: row.horasReales != null && row.horasReales !== '' ? String(row.horasReales) : '',
                observaciones: row.observaciones != null ? String(row.observaciones) : '',
                asistenciaRowNumber: row.asistenciaRowNumber != null ? Number(row.asistenciaRowNumber) : null,
                idAsistencia: row.idAsistencia != null && row.idAsistencia !== '' ? row.idAsistencia : null,
                fueraDePlan: !!row.fueraDePlan,
                idCliente: row.idCliente != null ? row.idCliente : '',
                idEmpleado: row.idEmpleado != null ? row.idEmpleado : ''
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

        const missingId = rows.find(item => item && ((!item.idCliente && item.cliente) || (!item.idEmpleado && item.empleado)));
        if (missingId) {
            throw new Error('Faltan IDs de cliente o empleado en la asistencia. Seleccioná los registros nuevamente.');
        }

        rows.forEach(function (item) {
            if (!item || !item.cliente || !item.empleado) return;

            const record = {
                'ID_EMPLEADO': item.idEmpleado || '',
                'EMPLEADO': item.empleado,
                'ID_CLIENTE': item.idCliente || '',
                'CLIENTE': item.cliente,
                'FECHA': fecha,
                'ASISTENCIA': !!item.asistencia,
                'HORAS': item.horasReales != null && item.horasReales !== ''
                    ? item.horasReales
                    : (item.horasPlan || ''),
                'OBSERVACIONES': item.observaciones != null ? item.observaciones : ''
            };

            const idAsistencia = item.idAsistencia || item.id || '';
            if (idAsistencia) {
                RecordController.updateRecord('ASISTENCIA', idAsistencia, record);
            } else if (item.asistenciaRowNumber) {
                // Fallback legacy: obtener ID desde rowNumber y actualizar por ID
                try {
                    const sheetAsis = DatabaseService.getDbSheetForFormat('ASISTENCIA');
                    const existingId = sheetAsis.getRange(Number(item.asistenciaRowNumber), 1).getValue();
                    if (existingId) {
                        RecordController.updateRecord('ASISTENCIA', existingId, record);
                    } else {
                        RecordController.saveRecord('ASISTENCIA', record);
                    }
                } catch (e) {
                    RecordController.saveRecord('ASISTENCIA', record);
                }
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
