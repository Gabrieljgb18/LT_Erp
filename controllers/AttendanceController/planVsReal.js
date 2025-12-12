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
    function getPlanVsAsistencia(fechaStr, cliente) {
        const fecha = (fechaStr || '').toString().trim();
        if (!fecha || !cliente) return [];

        const dayName = DateUtils.getDayNameFromDateString(fecha);
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
                activo = DataUtils.isTruthy(row[idxActivoPlan]);
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
                    const fechaRow = DataUtils.normalizeCellForSearch(row[idxFechaAsis]);
                    if (fechaRow !== fecha) return;

                    const cliRow = row[idxCliAsis];
                    const empRow = row[idxEmpAsis];
                    if (!cliRow || !empRow) return;
                    if (cliRow !== cliente) return;

                    const asistio = idxAsist > -1 ? DataUtils.isTruthy(row[idxAsist]) : false;

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

    /**
     * Guarda la asistencia real basada en el plan
     * @param {string} fechaStr - Fecha
     * @param {string} cliente - Cliente
     * @param {Array} items - Array de items con asistencia
     */
    function saveAsistenciaFromPlan(fechaStr, cliente, items) {
        if (!fechaStr || !cliente || !Array.isArray(items)) return;

        const fecha = fechaStr.toString().trim();

        const clienteId = (DatabaseService.findClienteByNombreORazon(cliente) || {}).id || '';
        const empIdCache = {};

        function resolveEmpId(nombre) {
            if (!nombre) return '';
            if (empIdCache[nombre] !== undefined) return empIdCache[nombre];
            const found = DatabaseService.findEmpleadoByNombre(nombre);
            const val = found && found.id ? found.id : '';
            empIdCache[nombre] = val;
            return val;
        }

        items.forEach(function (it) {
            if (!it.empleado) return;

            const record = {
                'ID_EMPLEADO': it.idEmpleado || resolveEmpId(it.empleado),
                'EMPLEADO': it.empleado,
                'ID_CLIENTE': it.idCliente || clienteId,
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

    return {
        getPlanVsAsistencia: getPlanVsAsistencia,
        saveAsistenciaFromPlan: saveAsistenciaFromPlan
    };
})();
