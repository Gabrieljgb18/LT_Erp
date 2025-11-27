/**
 * Controlador para el detalle de horas
 */
var HoursController = (function () {

    /**
     * Devuelve fecha inicio/fin normalizadas
     */
    function parseDateAtStart(dateStr) {
        return dateStr ? new Date(dateStr + 'T00:00:00') : null;
    }

    function getEmployeeData(employeeName) {
        if (!employeeName) return { valorHora: 0, viaticos: 0 };

        const sheet = DatabaseService.getDbSheetForFormat('EMPLEADOS');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return { valorHora: 0, viaticos: 0 };

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxValorHora = headers.indexOf('VALOR DE HORA');
        const idxViaticos = headers.indexOf('VIATICOS');
        if (idxEmpleado === -1) return { valorHora: 0, viaticos: 0 };

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        const target = employeeName.toLowerCase().trim();

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowEmp = String(row[idxEmpleado] || '').toLowerCase().trim();
            if (rowEmp === target) {
                const rate = idxValorHora > -1 ? Number(row[idxValorHora]) : 0;
                const viaticos = idxViaticos > -1 ? Number(row[idxViaticos]) : 0;
                return {
                    valorHora: isNaN(rate) ? 0 : rate,
                    viaticos: isNaN(viaticos) ? 0 : viaticos
                };
            }
        }

        return { valorHora: 0, viaticos: 0 };
    }

    function parseDateAtEnd(dateStr) {
        return dateStr ? new Date(dateStr + 'T23:59:59') : null;
    }

    /**
     * Obtiene valor hora de un empleado (EMPLEADOS_DB)
     */
    function getEmployeeHourlyRate(employeeName) {
        if (!employeeName) return 0;

        const sheet = DatabaseService.getDbSheetForFormat('EMPLEADOS');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return 0;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxValorHora = headers.indexOf('VALOR DE HORA');
        if (idxEmpleado === -1 || idxValorHora === -1) return 0;

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        const target = employeeName.toLowerCase().trim();

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowEmp = String(row[idxEmpleado] || '').toLowerCase().trim();
            if (rowEmp === target) {
                const rate = Number(row[idxValorHora]);
                return isNaN(rate) ? 0 : rate;
            }
        }

        return 0;
    }

    function getEmployeeData(employeeName) {
        const rate = getEmployeeHourlyRate(employeeName);
        const sheet = DatabaseService.getDbSheetForFormat('EMPLEADOS');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        let viaticos = 0;

        if (lastRow >= 2 && lastCol > 0) {
            const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
            const idxEmpleado = headers.indexOf('EMPLEADO');
            const idxViaticos = headers.indexOf('VIATICOS');
            if (idxEmpleado > -1 && idxViaticos > -1) {
                const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
                const target = employeeName ? employeeName.toLowerCase().trim() : '';
                for (let i = 0; i < data.length; i++) {
                    const rowEmp = String(data[i][idxEmpleado] || '').toLowerCase().trim();
                    if (rowEmp === target) {
                        const v = Number(data[i][idxViaticos]);
                        viaticos = isNaN(v) ? 0 : v;
                        break;
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
        const idxHoras = headers.indexOf('HORAS');
        const idxAsistencia = headers.indexOf('ASISTENCIA');

        if (idxFecha === -1 || idxEmpleado === -1) {
            return [];
        }

        const summaryMap = new Map(); // empleado -> {horas, hasAbsence, clientes:Set}

        rows.forEach(function (row) {
            const rowDate = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
            if (rowDate < start || rowDate > end) return;

            const empleado = row[idxEmpleado];
            if (!empleado) return;
            const key = String(empleado);
            const entry = summaryMap.get(key) || { horas: 0, hasAbsence: false, clientes: new Set() };

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

        summaryMap.forEach(function (entry, empleado) {
            const empData = getEmployeeData(empleado);
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

            const adelantos = getEmployeeAdvancesTotal(empleado, start, end);
            const totalBruto = valorHora * horas;
            const total = totalBruto + viaticosCalc + presentismoCalc - adelantos;

            result.push({
                empleado: empleado,
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
    function getEmployeeAdvancesTotal(employeeName, startDate, endDate) {
        if (!employeeName) return 0;

        const sheet = DatabaseService.getDbSheetForFormat('ADELANTOS');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return 0;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxFecha = headers.indexOf('FECHA');
        const idxMonto = headers.indexOf('MONTO');
        if (idxEmpleado === -1 || idxFecha === -1 || idxMonto === -1) return 0;

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        const target = employeeName.toLowerCase().trim();
        let total = 0;

        data.forEach(function (row) {
            const rowEmp = String(row[idxEmpleado] || '').toLowerCase().trim();
            if (rowEmp !== target) return;

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

    /**
     * Normaliza nombre de cliente para comparación flexible
     */
    function normalizeClientName(name) {
        if (!name) return '';
        return String(name)
            .toLowerCase()
            // quitar CUIT u otros paréntesis
            .replace(/\([^)]*\)/g, '')
            .replace(/\s+/g, ' ')
            .trim();
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

    /**
     * Obtiene el detalle de horas filtrado por fecha y cliente
     * @param {string} startDateStr - Fecha inicio (YYYY-MM-DD)
     * @param {string} endDateStr - Fecha fin (YYYY-MM-DD)
     * @param {string} clientName - Nombre del cliente
     * @returns {Array} Lista de registros filtrados
     */
    function getHoursDetail(startDateStr, endDateStr, clientName) {
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

        // Normalize client name for comparison
        const targetClient = clientName ? clientName.toLowerCase().trim() : '';
        const targetClientNorm = normalizeClientName(clientName);

        const results = [];

        rows.forEach(function (row) {
            const rowClient = String(row[idxCliente] || '').toLowerCase().trim();
            const rowClientNorm = normalizeClientName(row[idxCliente]);
            const rowDate = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);

            // Filter by Client
            if (targetClient) {
                const exact = rowClient === targetClient;
                const normMatch = rowClientNorm === targetClientNorm;
                const partial = rowClientNorm && targetClientNorm && (rowClientNorm.indexOf(targetClientNorm) !== -1 || targetClientNorm.indexOf(rowClientNorm) !== -1);
                if (!exact && !normMatch && !partial) {
                    return;
                }
            }

            // Filter by Date Range
            if (start && rowDate < start) return;
            if (end && rowDate > end) return;

            // Add to results
            results.push({
                id: row[idxId],
                fecha: DataUtils.normalizeCellForSearch(row[idxFecha]), // Return as string for frontend
                cliente: row[idxCliente], // Include client name
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
    function getHoursByClient(startDateStr, endDateStr, clientName) {
        // Tolerar array/string heredado (misma lógica que getHoursByEmployee)
        if (Array.isArray(startDateStr)) {
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

        if (idxFecha === -1 || idxCliente === -1) {
            Logger.log('Columnas requeridas no encontradas en ASISTENCIA (getHoursByClient)');
            return { rows: [], summary: {} };
        }

        const start = parseDateAtStart(startDateStr);
        const end = parseDateAtEnd(endDateStr);
        const targetClient = clientName ? clientName.toLowerCase().trim() : '';
        const targetClientNorm = normalizeClientName(clientName);

        const resultRows = [];
        const empleadosSet = new Set();
        const diasSet = new Set();
        let totalFacturacion = 0;

        rows.forEach(function (row) {
            const rowClient = String(row[idxCliente] || '').toLowerCase().trim();
            const rowClientNorm = normalizeClientName(row[idxCliente]);
            if (targetClient) {
                const exact = rowClient === targetClient;
                const normMatch = rowClientNorm === targetClientNorm;
                const partial = rowClientNorm && targetClientNorm && (rowClientNorm.indexOf(targetClientNorm) !== -1 || targetClientNorm.indexOf(rowClientNorm) !== -1);
                if (!exact && !normMatch && !partial) return;
            }

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
                horas: horas,
                asistencia: asistencia,
                observaciones: idxObs > -1 ? row[idxObs] : ''
            });

            if (row[idxEmpleado]) empleadosSet.add(row[idxEmpleado]);
            if (rowDate && !isNaN(rowDate.getTime())) {
                diasSet.add(rowDate.toISOString().slice(0, 10));
            }
            const rateForDate = getClientRateAtDate(clientName, rowDate);
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
        const valorHoraCli = getClientRateAtDate(clientName, end || new Date());

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
            const idxEmpleado = headers.indexOf('EMPLEADO');
            const idxHoras = headers.indexOf('HORAS');
            const idxAsistencia = headers.indexOf('ASISTENCIA');

            if (idxFecha === -1 || idxCliente === -1) {
                return [];
            }

            const summaryMap = new Map(); // cliente -> {horas, empleados:Set, dias:Set, totalFacturacion}

            rows.forEach(function (row) {
                const fecha = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
                if (isNaN(fecha.getTime()) || fecha < start || fecha > end) return;

                const cliente = row[idxCliente];
                if (!cliente) return;

                const asistencia = idxAsistencia > -1 ? DataUtils.isTruthy(row[idxAsistencia]) : true;
                if (!asistencia) return;

                const horasVal = idxHoras > -1 ? Number(row[idxHoras]) : 0;
                const horas = isNaN(horasVal) ? 0 : horasVal;
                const rate = getClientRateAtDate(cliente, fecha);
                const facturacion = horas * (isNaN(rate) ? 0 : rate);

                const key = String(cliente);
                const entry = summaryMap.get(key) || { horas: 0, empleados: new Set(), dias: new Set(), totalFacturacion: 0 };

                entry.horas += horas;
                entry.totalFacturacion += facturacion;
                if (idxEmpleado > -1 && row[idxEmpleado]) entry.empleados.add(row[idxEmpleado]);
                entry.dias.add(fecha.toISOString().slice(0, 10));

                summaryMap.set(key, entry);
            });

            const result = [];
            summaryMap.forEach(function (entry, cliente) {
                const rateFin = getClientRateAtDate(cliente, end);
                result.push({
                    cliente: cliente,
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
    function getHoursByEmployee(startDateStr, endDateStr, employeeName) {
        // Tolerar llamadas antiguas que envían un array como primer argumento
        if (Array.isArray(startDateStr)) {
            var params = startDateStr;
            startDateStr = params[0];
            endDateStr = params[1];
            employeeName = params[2];
        } else if (startDateStr && typeof startDateStr === 'string' && startDateStr.indexOf(',') !== -1 && !endDateStr && !employeeName) {
            // También tolerar string "a,b,c" que llega de un array stringify
            var parts = startDateStr.split(',');
            startDateStr = parts[0];
            endDateStr = parts[1];
            employeeName = parts[2];
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

        if (idxFecha === -1 || idxEmpleado === -1) {
            console.error("Columnas requeridas no encontradas en ASISTENCIA");
            return [];
        }

        // Parse filter dates
        const start = parseDateAtStart(startDateStr);
        const end = parseDateAtEnd(endDateStr);

        // Normalize employee name for comparison
        const targetEmployee = employeeName ? employeeName.toLowerCase().trim() : '';

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
            const rowDate = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
            const rowAsistencia = idxAsistencia > -1 ? DataUtils.isTruthy(row[idxAsistencia]) : true;

            // DEBUG primeras 3 filas
            if (idx < 3) {
                Logger.log('Fila ' + idx + ':');
                Logger.log('  rowEmployee: "' + rowEmployee + '"');
                Logger.log('  targetEmployee: "' + targetEmployee + '"');
                Logger.log('  Match: ' + (rowEmployee === targetEmployee));
                Logger.log('  rowDate: ' + rowDate);
                Logger.log('  start: ' + start);
                Logger.log('  end: ' + end);
            }

            // Filter by Employee
            if (targetEmployee && rowEmployee !== targetEmployee) {
                return;
            }

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
        const empleadoData = getEmployeeData(employeeName);
        const valorHora = empleadoData.valorHora;
        const viaticosBase = empleadoData.viaticos;
        const adelantos = getEmployeeAdvancesTotal(employeeName, start, end);
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
