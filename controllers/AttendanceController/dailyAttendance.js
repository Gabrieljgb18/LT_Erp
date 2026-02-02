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

        const parseDateOnly = (value) => {
            if (!value) return null;
            if (Object.prototype.toString.call(value) === '[object Date]') {
                return new Date(value.getFullYear(), value.getMonth(), value.getDate());
            }
            const s = String(value).trim();
            if (!s) return null;
            if (s.indexOf('-') >= 0) {
                const p = s.split('-');
                if (p.length === 3) {
                    const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
                    return isNaN(d) ? null : d;
                }
            }
            if (s.indexOf('/') >= 0) {
                const p = s.split('/');
                if (p.length === 3) {
                    const d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
                    return isNaN(d) ? null : d;
                }
            }
            const d = new Date(s);
            if (isNaN(d)) return null;
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        };

        const fechaDate = parseDateOnly(fecha);
        if (!fechaDate) return [];

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
            const vigDesdeDate = idxVigDesde > -1 ? parseDateOnly(row[idxVigDesde]) : null;
            const vigHastaDate = idxVigHasta > -1 ? parseDateOnly(row[idxVigHasta]) : null;

            if (vigDesdeDate && vigDesdeDate.getTime() > fechaDate.getTime()) return;
            if (vigHastaDate && vigHastaDate.getTime() < fechaDate.getTime()) return;

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
    function buildAttendanceIndexForDate_(sheet, fecha) {
        const map = new Map();
        if (!sheet) return map;
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return map;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const idxId = headers.indexOf('ID');
        const idxFecha = headers.indexOf('FECHA');
        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxIdEmpleado = headers.indexOf('ID_EMPLEADO');

        if (idxFecha === -1 || idxIdCliente === -1 || idxIdEmpleado === -1) return map;

        const fechaKey = DataUtils && DataUtils.normalizeCellForSearch
            ? DataUtils.normalizeCellForSearch(fecha, 'FECHA')
            : String(fecha || '').trim();

        if (!fechaKey) return map;

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        data.forEach(function (row) {
            const rowFecha = DataUtils && DataUtils.normalizeCellForSearch
                ? DataUtils.normalizeCellForSearch(row[idxFecha], 'FECHA')
                : String(row[idxFecha] || '').trim();
            if (rowFecha !== fechaKey) return;

            const idCliente = String(row[idxIdCliente] || '').trim();
            const idEmpleado = String(row[idxIdEmpleado] || '').trim();
            if (!idCliente || !idEmpleado) return;

            const rowId = idxId > -1 ? row[idxId] : row[0];
            if (!rowId) return;

            const key = idCliente + '||' + idEmpleado;
            if (!map.has(key)) map.set(key, rowId);
        });

        return map;
    }

    function collectAttendanceRowsForDate_(sheet, fecha) {
        const rows = [];
        if (!sheet) return rows;
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return rows;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const idxId = headers.indexOf('ID');
        const idxFecha = headers.indexOf('FECHA');
        if (idxFecha === -1) return rows;

        const fechaKey = DataUtils && DataUtils.normalizeCellForSearch
            ? DataUtils.normalizeCellForSearch(fecha, 'FECHA')
            : String(fecha || '').trim();
        if (!fechaKey) return rows;

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        data.forEach(function (row, i) {
            const rowFecha = DataUtils && DataUtils.normalizeCellForSearch
                ? DataUtils.normalizeCellForSearch(row[idxFecha], 'FECHA')
                : String(row[idxFecha] || '').trim();
            if (rowFecha !== fechaKey) return;
            const rowId = idxId > -1 ? row[idxId] : row[0];
            if (!rowId) return;
            rows.push({ id: rowId, rowNumber: i + 2 });
        });

        return rows;
    }

    function saveDailyAttendance(fechaStr, payload) {
        const fecha = (fechaStr || '').toString().trim();
        if (!fecha) return [];

        let rows = [];
        let removed = [];
        let purgeMissing = false;
        if (Array.isArray(payload)) {
            rows = payload;
        } else if (payload && typeof payload === 'object') {
            rows = Array.isArray(payload.rows) ? payload.rows : [];
            removed = Array.isArray(payload.removed) ? payload.removed : [];
            purgeMissing = payload.purgeMissing === true || payload.purgeMissing === 'true';
        }
        if (!Array.isArray(rows)) return [];

        const missingId = rows.find(item => item && ((!item.idCliente && item.cliente) || (!item.idEmpleado && item.empleado)));
        if (missingId) {
            throw new Error('Faltan IDs de cliente o empleado en la asistencia. Seleccioná los registros nuevamente.');
        }

        const sheetAsis = DatabaseService.getDbSheetForFormat('ASISTENCIA');
        const attendanceIndex = buildAttendanceIndexForDate_(sheetAsis, fecha);
        const updates = [];
        const activeKeys = new Set();
        const activeIds = new Set();

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
            const key = String(item.idCliente || '').trim() + '||' + String(item.idEmpleado || '').trim();
            if (key) activeKeys.add(key);
            if (idAsistencia) activeIds.add(String(idAsistencia));
            if (idAsistencia) {
                RecordController.updateRecord('ASISTENCIA', idAsistencia, record);
                if (key) attendanceIndex.set(key, idAsistencia);
                updates.push({ idCliente: record.ID_CLIENTE, idEmpleado: record.ID_EMPLEADO, idAsistencia: idAsistencia });
            } else if (key && attendanceIndex.has(key)) {
                const existingId = attendanceIndex.get(key);
                RecordController.updateRecord('ASISTENCIA', existingId, record);
                if (existingId) activeIds.add(String(existingId));
                updates.push({ idCliente: record.ID_CLIENTE, idEmpleado: record.ID_EMPLEADO, idAsistencia: existingId });
            } else if (item.asistenciaRowNumber) {
                // Fallback legacy: obtener ID desde rowNumber y actualizar por ID
                try {
                    const sheetAsis = DatabaseService.getDbSheetForFormat('ASISTENCIA');
                    const existingId = sheetAsis.getRange(Number(item.asistenciaRowNumber), 1).getValue();
                    if (existingId) {
                        RecordController.updateRecord('ASISTENCIA', existingId, record);
                        if (key) attendanceIndex.set(key, existingId);
                        activeIds.add(String(existingId));
                        updates.push({ idCliente: record.ID_CLIENTE, idEmpleado: record.ID_EMPLEADO, idAsistencia: existingId });
                    } else {
                        const newId = RecordController.saveRecord('ASISTENCIA', record);
                        if (key) attendanceIndex.set(key, newId);
                        activeIds.add(String(newId));
                        updates.push({ idCliente: record.ID_CLIENTE, idEmpleado: record.ID_EMPLEADO, idAsistencia: newId });
                    }
                } catch (e) {
                    const newId = RecordController.saveRecord('ASISTENCIA', record);
                    if (key) attendanceIndex.set(key, newId);
                    activeIds.add(String(newId));
                    updates.push({ idCliente: record.ID_CLIENTE, idEmpleado: record.ID_EMPLEADO, idAsistencia: newId });
                }
            } else {
                const newId = RecordController.saveRecord('ASISTENCIA', record);
                if (key) attendanceIndex.set(key, newId);
                activeIds.add(String(newId));
                updates.push({ idCliente: record.ID_CLIENTE, idEmpleado: record.ID_EMPLEADO, idAsistencia: newId });
            }
        });

        let deletedCount = 0;
        if (purgeMissing) {
            const rowsForDate = collectAttendanceRowsForDate_(sheetAsis, fecha);
            rowsForDate.forEach(function (row) {
                const idStr = String(row.id || '').trim();
                if (!idStr) return;
                if (activeIds.has(idStr)) return;
                RecordController.deleteRecord('ASISTENCIA', { id: row.id, rowNumber: row.rowNumber });
                deletedCount += 1;
            });
        } else if (removed.length) {
            removed.forEach(function (item) {
                if (!item) return;
                const idCandidate = item.idAsistencia || item.id || item.ID || '';
                const rowNumber = item.asistenciaRowNumber || item.rowNumber || null;
                const key = String(item.idCliente || '').trim() + '||' + String(item.idEmpleado || '').trim();
                if (idCandidate && activeIds.has(String(idCandidate))) return;
                if (key && activeKeys.has(key)) return;

                if (idCandidate) {
                    RecordController.deleteRecord('ASISTENCIA', { id: idCandidate, rowNumber: rowNumber });
                    deletedCount += 1;
                    return;
                }
                if (key && attendanceIndex.has(key)) {
                    const existingId = attendanceIndex.get(key);
                    if (existingId) {
                        RecordController.deleteRecord('ASISTENCIA', { id: existingId });
                        deletedCount += 1;
                    }
                }
            });
        }

        updates.deleted = deletedCount;
        return updates;
    }

    return {
        getDailyAttendancePlan: getDailyAttendancePlan,
        saveDailyAttendance: saveDailyAttendance
    };
})();
