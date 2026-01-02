/**
 * AttendanceController - Coverage
 * Funciones para cálculo de cobertura de horas
 */

const AttendanceCoverage = (function () {

    /**
     * Calcula la cobertura de horas para un cliente en un día específico
     * @param {string} clienteLabel - Nombre del cliente
     * @param {string} dayName - Nombre del día (LUNES, MARTES, etc.)
     * @returns {Object} required, planned, diff
     */
    function getClientDayCoverage(clienteLabel, dayName, idCliente) {
        const result = {
            required: 0,
            planned: 0,
            diff: 0
        };

        const targetId = idCliente != null && idCliente !== '' ? String(idCliente).trim() : '';
        if (!targetId || !dayName) return result;

        // Obtener horas requeridas del cliente
        const clientesSheet = DatabaseService.getDbSheetForFormat('CLIENTES');
        const lastRowCli = clientesSheet.getLastRow();
        const lastColCli = clientesSheet.getLastColumn();
        if (lastRowCli >= 2 && lastColCli > 0) {
            const headersCli = clientesSheet.getRange(1, 1, 1, lastColCli).getValues()[0];

            const idxId = headersCli.indexOf('ID');
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
                    const rowId = idxId > -1 ? String(row[idxId] || '').trim() : '';
                    if (!rowId || rowId !== targetId) continue;
                    const raw = row[idxDay];
                    const num = (raw === '' || raw == null) ? 0 : Number(raw);
                    if (!isNaN(num)) {
                        result.required = num;
                    }
                    break;
                }
            }
        }

        // Calcular horas planificadas
        const planSheet = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
        const lastRowPlan = planSheet.getLastRow();
        const lastColPlan = planSheet.getLastColumn();
        if (lastRowPlan >= 2 && lastColPlan > 0) {
            const headersPlan = planSheet.getRange(1, 1, 1, lastColPlan).getValues()[0];

            const idxIdClientePlan = headersPlan.indexOf('ID_CLIENTE');
            const idxDiaSemanaPlan = headersPlan.indexOf('DIA SEMANA');
            const idxHorasPlan = headersPlan.indexOf('HORAS PLAN');
            const idxActivo = headersPlan.indexOf('ACTIVO');

            if (idxIdClientePlan > -1 && idxDiaSemanaPlan > -1 && idxHorasPlan > -1) {
                const dataPlan = planSheet
                    .getRange(2, 1, lastRowPlan - 1, lastColPlan)
                    .getValues();

                let totalPlan = 0;

                dataPlan.forEach(function (row) {
                    const clienteRowId = String(row[idxIdClientePlan] || '').trim();
                    const diaRow = (row[idxDiaSemanaPlan] || '').toString().trim().toUpperCase();

                    if (!clienteRowId || diaRow !== dayName) return;
                    if (clienteRowId !== targetId) return;

                    let activo = true;
                    if (idxActivo > -1) {
                        activo = DataUtils.isTruthy(row[idxActivo]);
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

    /**
     * Obtiene las horas semanales contratadas para un cliente
     * @param {string} clienteLabel - Nombre del cliente
     * @returns {Object|null} Objeto con horas por día de la semana
     */
    function getClientWeeklyRequestedHours(clienteLabel, idCliente) {
        const targetId = idCliente != null && idCliente !== '' ? String(idCliente).trim() : '';
        if (!targetId) return null;

        const sheet = DatabaseService.getDbSheetForFormat('CLIENTES');
        const data = sheet.getDataRange().getValues();
        if (data.length < 2) return null;

        const header = data[0];
        const rows = data.slice(1);

        const idxId = header.indexOf('ID');
        const idxLunes = header.indexOf('LUNES HS');
        const idxMartes = header.indexOf('MARTES HS');
        const idxMiercoles = header.indexOf('MIERCOLES HS');
        const idxJueves = header.indexOf('JUEVES HS');
        const idxViernes = header.indexOf('VIERNES HS');
        const idxSabado = header.indexOf('SABADO HS');
        const idxDomingo = header.indexOf('DOMINGO HS');

        if (
            idxId === -1 ||
            idxLunes === -1 || idxMartes === -1 ||
            idxMiercoles === -1 || idxJueves === -1 ||
            idxViernes === -1 || idxSabado === -1 ||
            idxDomingo === -1
        ) {
            return null;
        }

        let rowCli = null;
        rows.forEach(function (row) {
            const rowId = String(row[idxId] || '').trim();
            if (rowId && rowId === targetId) {
                rowCli = row;
            }
        });

        if (!rowCli) return null;

        function num(val) {
            const n = Number(val);
            return isNaN(n) ? 0 : n;
        }

        const result = {
            cliente: clienteLabel || '',
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

    return {
        getClientDayCoverage: getClientDayCoverage,
        getClientWeeklyRequestedHours: getClientWeeklyRequestedHours
    };
})();
