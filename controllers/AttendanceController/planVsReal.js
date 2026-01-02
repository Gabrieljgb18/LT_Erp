/**
 * AttendanceController - Plan vs Real
 * Funciones para comparar planificación vs asistencia real
 */

const AttendancePlanVsReal = (function () {

    /**
     * Obtiene la comparación entre plan y asistencia real para una fecha y cliente
     * @param {string} fechaStr - Fecha en formato string
     * @param {string} cliente - Nombre del cliente
     * @returns {Array} Lista de empleados con planificación y asistencia
     */
    function getPlanVsAsistencia(fechaStr, cliente, idCliente) {
        if (cliente && typeof cliente === 'object' && !Array.isArray(cliente)) {
            idCliente = cliente.idCliente || cliente.ID_CLIENTE || idCliente;
            cliente = cliente.cliente || cliente.clientName || cliente.label || '';
        }

        const fecha = (fechaStr || '').toString().trim();
        const targetIdCliente = idCliente != null ? String(idCliente).trim() : '';
        if (!fecha || !targetIdCliente) return [];

        const dayName = DateUtils.getDayNameFromDateString(fecha);
        if (!dayName) return [];

        const planSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
        const lastRowPlan = planSheet.getLastRow();
        const lastColPlan = planSheet.getLastColumn();
        if (lastRowPlan < 2 || lastColPlan === 0) return [];

        const headersPlan = planSheet.getRange(1, 1, 1, lastColPlan).getValues()[0];

        const idxClientePlan = headersPlan.indexOf('CLIENTE');
        const idxIdClientePlan = headersPlan.indexOf('ID_CLIENTE');
        const idxEmpleadoPlan = headersPlan.indexOf('EMPLEADO');
        const idxIdEmpleadoPlan = headersPlan.indexOf('ID_EMPLEADO');
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
            const rowIdCliente = idxIdClientePlan > -1 ? String(row[idxIdClientePlan] || '').trim() : '';
            const dia = (row[idxDiaSemanaPlan] || '').toString().trim().toUpperCase();

            if (!cli || !dia) return;
            if (!rowIdCliente || rowIdCliente !== targetIdCliente) return;
            if (dia !== dayName) return;

            let activo = true;
            if (idxActivoPlan > -1) {
                activo = DataUtils.isTruthy(row[idxActivoPlan]);
            }
            if (!activo) return;

            const emp = row[idxEmpleadoPlan];
            const rowIdEmpleado = idxIdEmpleadoPlan > -1 ? row[idxIdEmpleadoPlan] : '';
            if (!emp || !rowIdEmpleado) return;

            planRows.push({
                empleado: emp,
                idEmpleado: rowIdEmpleado,
                cliente: cli,
                idCliente: rowIdCliente,
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

            const idxIdAsis = headersAsis.indexOf('ID');
            const idxEmpAsis = headersAsis.indexOf('EMPLEADO');
            const idxIdEmpAsis = headersAsis.indexOf('ID_EMPLEADO');
            const idxCliAsis = headersAsis.indexOf('CLIENTE');
            const idxIdCliAsis = headersAsis.indexOf('ID_CLIENTE');
            const idxFechaAsis = headersAsis.indexOf('FECHA');
            const idxAsist = headersAsis.indexOf('ASISTENCIA');
            const idxHorasReal = headersAsis.indexOf('HORAS');
            const idxObsReal = headersAsis.indexOf('OBSERVACIONES');

            if (idxEmpAsis > -1 && idxCliAsis > -1 && idxFechaAsis > -1) {
                const dataAsis = asisSheet.getRange(2, 1, lastRowAsis - 1, lastColAsis).getValues();

                dataAsis.forEach(function (row, i) {
                    const fechaRow = DataUtils.normalizeCellForSearch(row[idxFechaAsis]);
                    if (fechaRow !== fecha) return;

                    const cliRow = row[idxCliAsis];
                    const empRow = row[idxEmpAsis];
                    const rowIdCli = idxIdCliAsis > -1 ? String(row[idxIdCliAsis] || '').trim() : '';
                    const rowIdEmp = idxIdEmpAsis > -1 ? String(row[idxIdEmpAsis] || '').trim() : '';
                    if (!cliRow || !empRow) return;
                    if (!rowIdCli || rowIdCli !== targetIdCliente) {
                        return;
                    }

                    const asistio = idxAsist > -1 ? DataUtils.isTruthy(row[idxAsist]) : false;

                    if (!rowIdEmp) return;
                    const empKey = rowIdEmp;
                    realMap[empKey] = {
                        rowNumber: i + 2,
                        empleado: empRow,
                        idEmpleado: rowIdEmp,
                        idAsistencia: idxIdAsis > -1 ? row[idxIdAsis] : '',
                        asistencia: asistio,
                        horas: idxHorasReal > -1 ? row[idxHorasReal] : '',
                        observaciones: idxObsReal > -1 ? row[idxObsReal] : ''
                    };
                });
            }
        }

        const empleados = planRows
            .map(function (r) { return r.idEmpleado; })
            .filter(function (v, i, arr) { return v && arr.indexOf(v) === i; })
            .sort();

        return empleados.map(function (empKey) {
            const p = planRows.find(function (x) { return x.idEmpleado === empKey; });
            const r = realMap[empKey];
            const empName = p ? p.empleado : (r ? r.empleado : empKey);

            const asistio = r ? !!r.asistencia : false;

            return {
                empleado: empName,
                idEmpleado: p ? (p.idEmpleado || '') : (r ? (r.idEmpleado || '') : ''),
                planificado: !!p,
                asistencia: asistio,
                horas: r ? r.horas : (p ? p.horasPlan : ''),
                observaciones: r ? r.observaciones : (p ? p.observacionesPlan || '' : ''),
                realRowNumber: r ? r.rowNumber : null,
                idAsistencia: r ? (r.idAsistencia || '') : ''
            };
        });
    }

    /**
     * Guarda la asistencia real basada en el plan
     * @param {string} fechaStr - Fecha
     * @param {string} cliente - Cliente
     * @param {Array} items - Array de items con asistencia
     */
    function saveAsistenciaFromPlan(fechaStr, cliente, items, idCliente) {
        if (cliente && typeof cliente === 'object' && !Array.isArray(cliente)) {
            idCliente = cliente.idCliente || cliente.ID_CLIENTE || idCliente;
            cliente = cliente.cliente || cliente.clientName || cliente.label || '';
        }
        const clienteId = idCliente != null ? String(idCliente).trim() : '';
        if (!fechaStr || !clienteId || !Array.isArray(items)) return;

        const fecha = fechaStr.toString().trim();
        const missingEmp = items.find(it => it && (it.empleado || it.idEmpleado) && !it.idEmpleado);
        if (missingEmp) {
            throw new Error('Falta ID_EMPLEADO en la asistencia real.');
        }

        items.forEach(function (it) {
            if (!it.empleado) return;

            const record = {
                'ID_EMPLEADO': it.idEmpleado || '',
                'EMPLEADO': it.empleado,
                'ID_CLIENTE': it.idCliente || clienteId,
                'CLIENTE': cliente,
                'FECHA': fecha,
                'ASISTENCIA': !!it.asistencia,
                'HORAS': it.horas != null ? it.horas : '',
                'OBSERVACIONES': it.observaciones != null ? it.observaciones : ''
            };

            const idAsistencia = it.idAsistencia || it.realId || it.id || '';
            if (idAsistencia) {
                RecordController.updateRecord('ASISTENCIA', idAsistencia, record);
            } else if (it.realRowNumber) {
                try {
                    const sheetAsis = DatabaseService.getDbSheetForFormat('ASISTENCIA');
                    const existingId = sheetAsis.getRange(Number(it.realRowNumber), 1).getValue();
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
        getPlanVsAsistencia: getPlanVsAsistencia,
        saveAsistenciaFromPlan: saveAsistenciaFromPlan
    };
})();
