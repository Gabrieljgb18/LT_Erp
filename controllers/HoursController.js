/**
 * Controlador para el detalle de horas
 */
var HoursController = (function () {

    /**
     * Devuelve fecha inicio/fin normalizadas
     */
    function parseDateAtStart(dateStr) {
        if (!dateStr) return null;
        // Soportar yyyy-mm-dd (input date) y dd/mm/yyyy
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return new Date(dateStr + 'T00:00:00');
        }
        const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
            const d = Number(m[1]);
            const mo = Number(m[2]) - 1;
            const y = Number(m[3]);
            return new Date(y, mo, d, 0, 0, 0, 0);
        }
        return new Date(dateStr);
    }

    function parseDateAtEnd(dateStr) {
        if (!dateStr) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return new Date(dateStr + 'T23:59:59');
        }
        const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
            const d = Number(m[1]);
            const mo = Number(m[2]) - 1;
            const y = Number(m[3]);
            return new Date(y, mo, d, 23, 59, 59, 999);
        }
        const dt = new Date(dateStr);
        if (!isNaN(dt.getTime())) {
            dt.setHours(23, 59, 59, 999);
            return dt;
        }
        return null;
    }

    /**
     * Obtiene valor hora de un empleado (EMPLEADOS_DB)
     * Prioriza búsqueda por ID si se provee.
     */
    function getEmployeeHourlyRate(employeeName, idEmpleado) {
        if (!idEmpleado) return 0;

        const sheet = DatabaseService.getDbSheetForFormat('EMPLEADOS');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return 0;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxValorHora = headers.indexOf('VALOR DE HORA');
        if (idxValorHora === -1) return 0;

        if (idEmpleado) {
            const rowNumber = DatabaseService.findRowById(sheet, idEmpleado);
            if (rowNumber) {
                const v = Number(sheet.getRange(rowNumber, idxValorHora + 1).getValue());
                return isNaN(v) ? 0 : v;
            }
        }

        return 0;
    }

    function getEmployeeData(employeeName, idEmpleado) {
        if (!idEmpleado) return { valorHora: 0, viaticos: 0 };
        const rate = getEmployeeHourlyRate(employeeName, idEmpleado);
        const sheet = DatabaseService.getDbSheetForFormat('EMPLEADOS');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        let viaticos = 0;

        if (lastRow >= 2 && lastCol > 0) {
            const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
            const idxEmpleado = headers.indexOf('EMPLEADO');
            const idxViaticos = headers.indexOf('VIATICOS');
            if (idxViaticos > -1) {
                if (idEmpleado) {
                    const rowNumber = DatabaseService.findRowById(sheet, idEmpleado);
                    if (rowNumber) {
                        const v = Number(sheet.getRange(rowNumber, idxViaticos + 1).getValue());
                        viaticos = isNaN(v) ? 0 : v;
                    }
                }
            }
        }

        return { valorHora: rate, viaticos: viaticos };
    }

    /**
     * Resumen mensual por empleado
     * @param {number} year
     * @param {number} month // 1-12
     */
    function getMonthlySummary(year, month) {
        year = Number(year);
        month = Number(month);
        if (!year || !month) return [];

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        const sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
        const data = sheet.getDataRange().getValues();
        if (!data || data.length < 2) return [];

        const headers = data[0];
        const rows = data.slice(1);

        const idxId = headers.indexOf('ID');
        const idxFecha = headers.indexOf('FECHA');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxIdEmpleado = headers.indexOf('ID_EMPLEADO');
        const idxHoras = headers.indexOf('HORAS');
        const idxAsistencia = headers.indexOf('ASISTENCIA');

        if (idxFecha === -1 || idxEmpleado === -1) {
            return [];
        }

        const summaryMap = new Map(); // key -> {idEmpleado, empleado, horas, hasAbsence, clientes:Set}

        rows.forEach(function (row) {
            const rowDate = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
            if (rowDate < start || rowDate > end) return;

            const empleado = row[idxEmpleado];
            const rowIdEmpleado = idxIdEmpleado > -1 ? String(row[idxIdEmpleado] || '').trim() : '';
            if (!empleado && !rowIdEmpleado) return;
            const key = rowIdEmpleado || String(empleado || '').toLowerCase().trim();
            const entry = summaryMap.get(key) || { idEmpleado: rowIdEmpleado, empleado: empleado, horas: 0, hasAbsence: false, clientes: new Set() };

            const asistencia = idxAsistencia > -1 ? DataUtils.isTruthy(row[idxAsistencia]) : true;
            const horasVal = idxHoras > -1 ? Number(row[idxHoras]) : 0;
            if (asistencia) {
                entry.horas += isNaN(horasVal) ? 0 : horasVal;
            } else {
                entry.hasAbsence = true;
            }
            if (idxCliente > -1 && row[idxCliente]) {
                entry.clientes.add(row[idxCliente]);
            }
            summaryMap.set(key, entry);
        });

        const config = DatabaseService.getConfig ? DatabaseService.getConfig() : {};
        const presMedia = Number(config['PRESENTISMO_MEDIA']) || 0;
        const presFull = Number(config['PRESENTISMO_COMPLETA']) || 0;

        const result = [];

        summaryMap.forEach(function (entry) {
            const displayName = entry.empleado || '';
            const empData = getEmployeeData(displayName, entry.idEmpleado);
            const valorHora = empData.valorHora;
            const viaticosBase = empData.viaticos;
            const horas = entry.horas;

            let viaticosCalc = 0;
            if (viaticosBase > 0) {
                if (horas > 80) viaticosCalc = viaticosBase;
                else if (horas >= 60) viaticosCalc = viaticosBase / 2;
            }

            let presentismoCalc = 0;
            if (!entry.hasAbsence) {
                if (horas > 80) presentismoCalc = presFull;
                else if (horas >= 60) presentismoCalc = presMedia;
            }

            const adelantos = getEmployeeAdvancesTotal(displayName, start, end, entry.idEmpleado);
            const totalBruto = valorHora * horas;
            const total = totalBruto + viaticosCalc + presentismoCalc - adelantos;

            result.push({
                empleado: displayName,
                idEmpleado: entry.idEmpleado || '',
                clientes: Array.from(entry.clientes),
                horas: horas,
                valorHora: valorHora,
                viaticos: viaticosCalc,
                presentismo: presentismoCalc,
                adelantos: adelantos,
                totalBruto: totalBruto,
                totalNeto: total
            });
        });

        // Ordenar por nombre
        result.sort(function (a, b) {
            return a.empleado.localeCompare(b.empleado, 'es', { sensitivity: 'base' });
        });

        return result;
    }

    /**
     * Suma adelantos de un empleado en rango de fechas
     */
    function getEmployeeAdvancesTotal(employeeName, startDate, endDate, idEmpleado) {
        const targetId = idEmpleado != null ? String(idEmpleado).trim() : '';
        if (!targetId) return 0;

        if (DatabaseService && typeof DatabaseService.repairAdelantosLegacyRows === 'function') {
            try {
                DatabaseService.repairAdelantosLegacyRows();
            } catch (e) {
                // ignore
            }
        }

        const sheet = DatabaseService.getDbSheetForFormat('ADELANTOS');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return 0;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const idxIdEmpleado = headers.indexOf('ID_EMPLEADO');
        const idxFecha = headers.indexOf('FECHA');
        const idxMonto = headers.indexOf('MONTO');
        if (idxIdEmpleado === -1 || idxFecha === -1 || idxMonto === -1) return 0;

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        let total = 0;

        data.forEach(function (row) {
            const rowId = String(row[idxIdEmpleado] || '').trim();
            if (!rowId || rowId !== targetId) return;

            const fechaRow = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
            if (startDate && fechaRow < startDate) return;
            if (endDate && fechaRow > endDate) return;

            const monto = Number(row[idxMonto]);
            if (!isNaN(monto)) {
                total += monto;
            }
        });

        return total;
    }

    function getClientHourlyRate(clientName) {
        if (typeof DatabaseService.getClientHourlyRate === 'function') {
            return DatabaseService.getClientHourlyRate(clientName);
        }
        return 0;
    }
    function getClientRateAtDate(clientName, dateObj) {
        if (typeof DatabaseService.getClientRateAtDate === 'function') {
            return DatabaseService.getClientRateAtDate(clientName, dateObj);
        }
        return getClientHourlyRate(clientName);
    }

    function getClientNameById_(idCliente) {
        if (!idCliente || !DatabaseService || typeof DatabaseService.findClienteById !== 'function') {
            return '';
        }
        const cli = DatabaseService.findClienteById(idCliente);
        if (!cli) return '';
        return cli.razonSocial || cli.nombre || '';
    }

    /**
     * Obtiene el detalle de horas filtrado por fecha y cliente
     * @param {string} startDateStr - Fecha inicio (YYYY-MM-DD)
     * @param {string} endDateStr - Fecha fin (YYYY-MM-DD)
     * @param {string} clientName - Nombre del cliente
     * @returns {Array} Lista de registros filtrados
     */
    function getHoursDetail(startDateStr, endDateStr, clientName, idCliente) {
        // Soportar objeto {fechaDesde, fechaHasta, cliente, idCliente}
        if (startDateStr && typeof startDateStr === 'object' && !Array.isArray(startDateStr)) {
            const obj = startDateStr;
            startDateStr = obj.fechaDesde || obj.startDateStr || obj.startDate;
            endDateStr = obj.fechaHasta || obj.endDateStr || obj.endDate;
            clientName = obj.cliente || obj.clientName;
            idCliente = obj.idCliente || obj.clientId || idCliente;
        } else if (Array.isArray(startDateStr)) {
            var params = startDateStr;
            startDateStr = params[0];
            endDateStr = params[1];
            clientName = params[2];
            idCliente = params[3] || idCliente;
        } else if (startDateStr && typeof startDateStr === 'string' && startDateStr.indexOf(',') !== -1 && !endDateStr && !clientName) {
            var parts = startDateStr.split(',');
            startDateStr = parts[0];
            endDateStr = parts[1];
            clientName = parts[2];
            idCliente = parts[3] || idCliente;
        }
        const sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
        const data = sheet.getDataRange().getValues();

        // Headers are in row 1 (index 0)
        const headers = data[0];
        const rows = data.slice(1); // Skip headers

        // Find column indices
        const idxId = headers.indexOf('ID');
        const idxFecha = headers.indexOf('FECHA');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxHoras = headers.indexOf('HORAS');
        const idxAsistencia = headers.indexOf('ASISTENCIA');
        const idxObs = headers.indexOf('OBSERVACIONES');

        if (idxFecha === -1 || idxCliente === -1) {
            console.error("Columnas requeridas no encontradas en ASISTENCIA");
            return [];
        }

        // Parse filter dates
        // Assuming input dates are YYYY-MM-DD
        const start = parseDateAtStart(startDateStr);
        const end = parseDateAtEnd(endDateStr);

        const targetClientId = idCliente ? String(idCliente).trim() : '';
        if (clientName && !targetClientId) {
            return [];
        }

        const results = [];

        rows.forEach(function (row) {
            const rowDate = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
            const rowIdCliente = idxIdCliente > -1 ? String(row[idxIdCliente] || '').trim() : '';

            // Filter by Client
            if (targetClientId) {
                if (!rowIdCliente || rowIdCliente !== targetClientId) return;
            }

            // Filter by Date Range
            if (start && rowDate < start) return;
            if (end && rowDate > end) return;

            // Add to results
            results.push({
                id: row[idxId],
                fecha: DataUtils.normalizeCellForSearch(row[idxFecha]), // Return as string for frontend
                cliente: row[idxCliente], // Include client name
                idCliente: idxIdCliente > -1 ? row[idxIdCliente] : '',
                empleado: row[idxEmpleado],
                horas: row[idxHoras],
                observaciones: row[idxObs],
                // Keep original row index if needed for updates, though ID is better
                originalRow: row
            });
        });

        // Sort by date descending
        return results.sort(function (a, b) {
            return new Date(b.fecha) - new Date(a.fecha);
        });
    }

    /**
     * Reporte de horas por cliente (con resumen)
     * @param {string} startDateStr
     * @param {string} endDateStr
     * @param {string} clientName
     * @returns {{rows:Array, summary:Object}}
     */
    function getHoursByClient(startDateStr, endDateStr, clientName, idCliente) {
        var clientIdFromPayload = idCliente || '';
        // Soportar objeto con propiedades {fechaDesde, fechaHasta, cliente, idCliente}
        if (startDateStr && typeof startDateStr === 'object' && !Array.isArray(startDateStr)) {
            const obj = startDateStr;
            startDateStr = obj.fechaDesde || obj.startDateStr || obj.startDate;
            endDateStr = obj.fechaHasta || obj.endDateStr || obj.endDate;
            clientName = obj.cliente || obj.clientName;
            clientIdFromPayload = obj.idCliente || obj.clientId || clientIdFromPayload;
        } else if (Array.isArray(startDateStr)) {
            var params = startDateStr;
            startDateStr = params[0];
            endDateStr = params[1];
            clientName = params[2];
        } else if (startDateStr && typeof startDateStr === 'string' && startDateStr.indexOf(',') !== -1 && !endDateStr && !clientName) {
            var parts = startDateStr.split(',');
            startDateStr = parts[0];
            endDateStr = parts[1];
            clientName = parts[2];
        }

        const sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
        const data = sheet.getDataRange().getValues();
        if (!data || data.length < 2) {
            return { rows: [], summary: {} };
        }

        const headers = data[0];
        const rows = data.slice(1);

        const idxId = headers.indexOf('ID');
        const idxFecha = headers.indexOf('FECHA');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxHoras = headers.indexOf('HORAS');
        const idxObs = headers.indexOf('OBSERVACIONES');
        const idxAsistencia = headers.indexOf('ASISTENCIA');
        const idxIdCliente = headers.indexOf('ID_CLIENTE');

        if (idxFecha === -1 || idxCliente === -1) {
            Logger.log('Columnas requeridas no encontradas en ASISTENCIA (getHoursByClient)');
            return { rows: [], summary: {} };
        }

        const start = parseDateAtStart(startDateStr);
        const end = parseDateAtEnd(endDateStr);
        const targetClientId = clientIdFromPayload ? String(clientIdFromPayload).trim() : '';
        if (clientName && !targetClientId) {
            return { rows: [], summary: {} };
        }
        if (!targetClientId) {
            return { rows: [], summary: {} };
        }
        const rateClientName = getClientNameById_(targetClientId) || clientName || '';

        const resultRows = [];
        const empleadosSet = new Set();
        const diasSet = new Set();
        let totalFacturacion = 0;

        rows.forEach(function (row) {
            const rowIdCliente = idxIdCliente > -1 ? String(row[idxIdCliente] || '').trim() : '';
            if (!rowIdCliente || rowIdCliente !== targetClientId) return;

            const rowDate = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
            if (start && rowDate < start) return;
            if (end && rowDate > end) return;

            const asistencia = idxAsistencia > -1 ? DataUtils.isTruthy(row[idxAsistencia]) : true;
            const horasVal = idxHoras > -1 ? Number(row[idxHoras]) : 0;
            const horas = asistencia ? horasVal : 0;

            resultRows.push({
                id: row[idxId],
                fecha: DataUtils.normalizeCellForSearch(row[idxFecha]),
                cliente: row[idxCliente],
                empleado: row[idxEmpleado],
                idCliente: rowIdCliente,
                horas: horas,
                asistencia: asistencia,
                observaciones: idxObs > -1 ? row[idxObs] : ''
            });

            if (row[idxEmpleado]) empleadosSet.add(row[idxEmpleado]);
            if (rowDate && !isNaN(rowDate.getTime())) {
                diasSet.add(rowDate.toISOString().slice(0, 10));
            }
            const rateForDate = getClientRateAtDate(rateClientName, rowDate);
            const horasNum = isNaN(horas) ? 0 : Number(horas);
            const rateNum = isNaN(rateForDate) ? 0 : Number(rateForDate);
            totalFacturacion += rateNum * horasNum;
        });

        const sorted = resultRows.sort(function (a, b) {
            return new Date(b.fecha) - new Date(a.fecha);
        });

        const totalHoras = sorted.reduce(function (acc, r) {
            const h = Number(r.horas);
            return acc + (isNaN(h) ? 0 : h);
        }, 0);
        const valorHoraCli = getClientRateAtDate(rateClientName, end || new Date());

        const summary = {
            totalHoras: totalHoras,
            empleados: empleadosSet.size,
            dias: diasSet.size,
            horasPromEmpleado: empleadosSet.size ? totalHoras / empleadosSet.size : 0,
            totalRegistros: sorted.length,
            valorHora: valorHoraCli,
            totalFacturacion: totalFacturacion
        };

        return { rows: sorted, summary: summary };
    }

    /**
     * Resumen mensual por cliente (horas y facturación)
     * @param {number} year
     * @param {number} month // 1-12
     */
    function getMonthlySummaryByClient(year, month) {
        year = Number(year);
        month = Number(month);
        try {
            if (!year || !month) return [];

            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59, 999);

            const sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
            if (!sheet) return [];
            const data = sheet.getDataRange().getValues();
            if (!data || data.length < 2) return [];

            const headers = data[0];
            const rows = data.slice(1);

            const idxFecha = headers.indexOf('FECHA');
            const idxCliente = headers.indexOf('CLIENTE');
            const idxIdCliente = headers.indexOf('ID_CLIENTE');
            const idxEmpleado = headers.indexOf('EMPLEADO');
            const idxHoras = headers.indexOf('HORAS');
            const idxAsistencia = headers.indexOf('ASISTENCIA');

            if (idxFecha === -1 || idxCliente === -1) {
                return [];
            }

            const summaryMap = new Map(); // key -> {idCliente, cliente, horas, empleados:Set, dias:Set, totalFacturacion}

            rows.forEach(function (row) {
                const fecha = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
                if (isNaN(fecha.getTime()) || fecha < start || fecha > end) return;

                const cliente = row[idxCliente];
                const rowIdCliente = idxIdCliente > -1 ? String(row[idxIdCliente] || '').trim() : '';
                if (!rowIdCliente) return;

                const asistencia = idxAsistencia > -1 ? DataUtils.isTruthy(row[idxAsistencia]) : true;
                if (!asistencia) return;

                const horasVal = idxHoras > -1 ? Number(row[idxHoras]) : 0;
                const horas = isNaN(horasVal) ? 0 : horasVal;
                const rateName = getClientNameById_(rowIdCliente) || cliente || '';
                const rate = getClientRateAtDate(rateName, fecha);
                const facturacion = horas * (isNaN(rate) ? 0 : rate);

                const key = rowIdCliente;
                const entry = summaryMap.get(key) || {
                    idCliente: rowIdCliente,
                    cliente: getClientNameById_(rowIdCliente) || cliente,
                    horas: 0,
                    empleados: new Set(),
                    dias: new Set(),
                    totalFacturacion: 0
                };

                entry.horas += horas;
                entry.totalFacturacion += facturacion;
                if (idxEmpleado > -1 && row[idxEmpleado]) entry.empleados.add(row[idxEmpleado]);
                entry.dias.add(fecha.toISOString().slice(0, 10));

                summaryMap.set(key, entry);
            });

            const result = [];
            summaryMap.forEach(function (entry) {
                const displayName = entry.cliente || '';
                const rateFin = getClientRateAtDate(displayName, end);
                result.push({
                    cliente: displayName,
                    idCliente: entry.idCliente || '',
                    horas: entry.horas,
                    empleados: entry.empleados.size,
                    dias: entry.dias.size,
                    valorHora: rateFin,
                    totalFacturacion: entry.totalFacturacion
                });
            });

            return result.sort(function (a, b) {
                return b.totalFacturacion - a.totalFacturacion;
            });
        } catch (err) {
            Logger.log('Error getMonthlySummaryByClient: ' + err);
            return [];
        }
    }

    /**
     * Obtiene el detalle de horas filtrado por fecha y empleado
     * @param {string} startDateStr - Fecha inicio (YYYY-MM-DD)
     * @param {string} endDateStr - Fecha fin (YYYY-MM-DD)
     * @param {string} employeeName - Nombre del empleado
     * @returns {Array} Lista de registros filtrados
     */
    function getHoursByEmployee(startDateStr, endDateStr, employeeName, idEmpleado) {
        // Soportar objeto {fechaDesde, fechaHasta, empleado, idEmpleado}
        if (startDateStr && typeof startDateStr === 'object' && !Array.isArray(startDateStr)) {
            const obj = startDateStr;
            startDateStr = obj.fechaDesde || obj.startDateStr || obj.startDate;
            endDateStr = obj.fechaHasta || obj.endDateStr || obj.endDate;
            employeeName = obj.empleado || obj.employeeName;
            idEmpleado = obj.idEmpleado || obj.employeeId || idEmpleado;
        } else if (Array.isArray(startDateStr)) {
            var params = startDateStr;
            startDateStr = params[0];
            endDateStr = params[1];
            employeeName = params[2];
            idEmpleado = params[3] || idEmpleado;
        } else if (startDateStr && typeof startDateStr === 'string' && startDateStr.indexOf(',') !== -1 && !endDateStr && !employeeName) {
            var parts = startDateStr.split(',');
            startDateStr = parts[0];
            endDateStr = parts[1];
            employeeName = parts[2];
            idEmpleado = parts[3] || idEmpleado;
        }

        if (!employeeName && idEmpleado && DatabaseService.findEmpleadoById) {
            const emp = DatabaseService.findEmpleadoById(idEmpleado);
            if (emp && emp.nombre) employeeName = emp.nombre;
        }

        const sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
        const data = sheet.getDataRange().getValues();

        // Headers are in row 1 (index 0)
        const headers = data[0];
        const rows = data.slice(1); // Skip headers

        // Find column indices
        const idxId = headers.indexOf('ID');
        const idxFecha = headers.indexOf('FECHA');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxHoras = headers.indexOf('HORAS');
        const idxObs = headers.indexOf('OBSERVACIONES');
        const idxAsistencia = headers.indexOf('ASISTENCIA');
        const idxIdEmpleado = headers.indexOf('ID_EMPLEADO');

        if (idxFecha === -1 || idxEmpleado === -1) {
            console.error("Columnas requeridas no encontradas en ASISTENCIA");
            return [];
        }

        // Parse filter dates
        const start = parseDateAtStart(startDateStr);
        const end = parseDateAtEnd(endDateStr);

        // Normalize employee name for comparison
        const targetEmployeeId = idEmpleado ? String(idEmpleado).trim() : '';
        if (employeeName && !targetEmployeeId) {
            return [];
        }
        if (!targetEmployeeId) {
            return [];
        }

        // DEBUG
        Logger.log('=== getHoursByEmployee DEBUG ===');
        Logger.log('Filtros recibidos:');
        Logger.log('  startDateStr: ' + startDateStr);
        Logger.log('  endDateStr: ' + endDateStr);
        Logger.log('  employeeName: ' + employeeName);
        Logger.log('  targetEmployee (normalizado): ' + targetEmployee);
        Logger.log('Total filas a procesar: ' + rows.length);

        const results = [];

        rows.forEach(function (row, idx) {
            const rowEmployee = String(row[idxEmpleado] || '').toLowerCase().trim();
            const rowIdEmpleado = idxIdEmpleado > -1 ? String(row[idxIdEmpleado] || '').trim() : '';
            const rowDate = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
            const rowAsistencia = idxAsistencia > -1 ? DataUtils.isTruthy(row[idxAsistencia]) : true;

            // DEBUG primeras 3 filas
            if (idx < 3) {
                Logger.log('Fila ' + idx + ':');
                Logger.log('  rowEmployee: "' + rowEmployee + '"');
                Logger.log('  targetEmployeeId: "' + targetEmployeeId + '"');
                Logger.log('  Match: ' + (rowIdEmpleado === targetEmployeeId));
                Logger.log('  rowDate: ' + rowDate);
                Logger.log('  start: ' + start);
                Logger.log('  end: ' + end);
            }

            // Filter by Employee (prioriza ID)
            if (!rowIdEmpleado || rowIdEmpleado !== targetEmployeeId) return;

            // Filter by Date Range
            if (start && rowDate < start) return;
            if (end && rowDate > end) return;

            // Add to results
            const horasValue = idxHoras > -1 ? row[idxHoras] : 0;
            const obsValue = idxObs > -1 ? row[idxObs] : '';

            results.push({
                id: row[idxId],
                fecha: DataUtils.normalizeCellForSearch(row[idxFecha]),
                cliente: row[idxCliente],
                empleado: row[idxEmpleado],
                idEmpleado: idxIdEmpleado > -1 ? row[idxIdEmpleado] : '',
                horas: rowAsistencia ? horasValue : 0,
                asistencia: rowAsistencia,
                observaciones: obsValue
            });
        });

        Logger.log('Resultados encontrados: ' + results.length);

        // Sort by date descending and devolver datos "planos" serializables
        const sorted = results.sort(function (a, b) {
            return new Date(b.fecha) - new Date(a.fecha);
        });

        const totalHoras = sorted.reduce(function (acc, r) {
            const h = Number(r.horas);
            return acc + (isNaN(h) ? 0 : h);
        }, 0);
        const empleadoData = getEmployeeData(employeeName, idEmpleado);
        const valorHora = empleadoData.valorHora;
        const viaticosBase = empleadoData.viaticos;
        const adelantos = getEmployeeAdvancesTotal(employeeName, start, end, idEmpleado);
        const totalBruto = valorHora * totalHoras;
        const hasAbsence = sorted.some(function (r) { return r.asistencia === false; });

        let viaticosCalc = 0;
        if (viaticosBase > 0) {
            if (totalHoras > 80) {
                viaticosCalc = viaticosBase;
            } else if (totalHoras >= 60 && totalHoras <= 80) {
                viaticosCalc = viaticosBase / 2;
            }
        }

        const config = DatabaseService.getConfig ? DatabaseService.getConfig() : {};
        const presMedia = Number(config['PRESENTISMO_MEDIA']) || 0;
        const presFull = Number(config['PRESENTISMO_COMPLETA']) || 0;
        let presentismoCalc = 0;
        if (!hasAbsence) {
            if (totalHoras > 80) {
                presentismoCalc = presFull;
            } else if (totalHoras >= 60) {
                presentismoCalc = presMedia;
            }
        }

        const totalNeto = totalBruto + viaticosCalc + presentismoCalc - adelantos;

        const payload = {
            rows: sorted,
            summary: {
                totalHoras: totalHoras,
                valorHora: valorHora,
                totalBruto: totalBruto,
                adelantos: adelantos,
                totalNeto: totalNeto,
                viaticos: viaticosCalc,
                presentismo: presentismoCalc
            }
        };

        Logger.log('Payload (primeros 3): ' + JSON.stringify(sorted.slice(0, 3)));
        Logger.log('Resumen: ' + JSON.stringify(payload.summary));

        return payload;
    }

    return {
        getHoursDetail: getHoursDetail,
        getHoursByClient: getHoursByClient,
        getHoursByEmployee: getHoursByEmployee,
        getMonthlySummary: getMonthlySummary,
        getMonthlySummaryByClient: getMonthlySummaryByClient
    };

})();
