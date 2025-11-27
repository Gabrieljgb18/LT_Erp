/**
 * Controlador para cuenta corriente de empleados
 */
var AccountController = (function () {

    /**
     * Devuelve la cuenta corriente mensual por empleado
     * @param {number} year
     * @param {number} month - 1-12
     */
    function getEmployeeAccountStatement(year, month) {
        const resumen = HoursController.getMonthlySummary(year, month) || [];
        const pagos = getPagosEmpForMonth(year, month);
        const adelantos = getAdelantosForMonth(year, month);

        const pagosMap = aggregateByEmpleado(pagos);
        const adelMap = aggregateByEmpleado(adelantos);

        return resumen.map(item => {
            const emp = item.empleado;
            const pagosEmp = pagosMap.get(emp) || 0;
            const adel = adelMap.get(emp) || 0;
            const debe = Number(item.totalNeto || 0);
            const haber = pagosEmp + adel;
            const saldo = debe - haber;
            return {
                empleado: emp,
                debe: debe,
                haber: haber,
                saldo: saldo,
                detalle: {
                    pagos: pagosEmp,
                    adelantos: adel
                }
            };
        });
    }

    function getPagosEmpForMonth(year, month) {
        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_EMP');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return [];

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const idxFecha = headers.indexOf('FECHA');
        const idxEmp = headers.indexOf('EMPLEADO');
        const idxMonto = headers.indexOf('MONTO');
        if (idxFecha === -1 || idxEmp === -1 || idxMonto === -1) return [];

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        return data
            .map(row => {
                const fecha = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
                if (fecha < start || fecha > end) return null;
                return {
                    empleado: row[idxEmp],
                    monto: Number(row[idxMonto]) || 0
                };
            })
            .filter(Boolean);
    }

    function getAdelantosForMonth(year, month) {
        const sheet = DatabaseService.getDbSheetForFormat('ADELANTOS');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return [];

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const idxFecha = headers.indexOf('FECHA');
        const idxEmp = headers.indexOf('EMPLEADO');
        const idxMonto = headers.indexOf('MONTO');
        if (idxFecha === -1 || idxEmp === -1 || idxMonto === -1) return [];

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        return data
            .map(row => {
                const fecha = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
                if (fecha < start || fecha > end) return null;
                return {
                    empleado: row[idxEmp],
                    monto: Number(row[idxMonto]) || 0
                };
            })
            .filter(Boolean);
    }

    function aggregateByEmpleado(items) {
        const map = new Map();
        items.forEach(i => {
            const key = i.empleado;
            const prev = map.get(key) || 0;
            map.set(key, prev + (i.monto || 0));
        });
        return map;
    }

    function getClientAccountStatement(clientName, startDateStr, endDateStr) {
        if (!clientName) return { saldoInicial: 0, movimientos: [] };

        const startDate = parseDateFlexible_(startDateStr);
        const endDate = parseDateFlexible_(endDateStr);

        if (!startDate || !endDate) {
            return { saldoInicial: 0, movimientos: [] };
        }

        // 1. Calcular saldo inicial (antes del período)
        const saldoInicial = getClientBalanceBeforeDate(clientName, startDate);

        // 2. Obtener movimientos dentro del período
        const debitos = getClientDebits(clientName, startDate, endDate);
        const creditos = getClientPayments(clientName, startDate, endDate);

        // 3. Unificar y ordenar
        const movimientos = [...debitos, ...creditos].sort((a, b) => a.fecha - b.fecha);

        // 4. Calcular saldo acumulado partiendo del saldo inicial
        let saldo = saldoInicial;
        const movimientosConSaldo = movimientos.map(m => {
            saldo += (m.debe - m.haber);
            return {
                ...m,
                saldo: saldo
            };
        });

        return {
            saldoInicial: saldoInicial,
            movimientos: movimientosConSaldo
        };
    }

    function getClientBalanceBeforeDate(clientName, beforeDate) {
        if (!clientName || !beforeDate) return 0;

        // Calcular débitos (facturas) antes de la fecha
        const debitosAnteriores = getClientDebits(clientName, null, beforeDate);
        const totalDebitos = debitosAnteriores.reduce((sum, item) => sum + item.debe, 0);

        // Calcular créditos (pagos) antes de la fecha
        const creditosAnteriores = getClientPayments(clientName, null, beforeDate);
        const totalCreditos = creditosAnteriores.reduce((sum, item) => sum + item.haber, 0);

        return totalDebitos - totalCreditos;
    }

    function getClientDebits(clientName, startDate, endDate) {
        const sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
        const data = sheet.getDataRange().getValues();
        if (!data || data.length < 2) return [];

        const headers = data[0];
        const rows = data.slice(1);

        const idxFecha = headers.indexOf('FECHA');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxHoras = headers.indexOf('HORAS');
        const idxAsistencia = headers.indexOf('ASISTENCIA');

        if (idxFecha === -1 || idxCliente === -1) return [];

        const targetClient = normalizeClientName_(clientName);
        const monthlyMap = new Map(); // "YYYY-MM" -> { fecha, monto }

        // Ajustar endDate para incluir todo el día
        const adjustedEndDate = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59) : null;

        rows.forEach(row => {
            const rowClient = normalizeClientName_(row[idxCliente]);
            if (!rowClient) return;

            // Mejorar matching: buscar coincidencia parcial
            const matches = rowClient === targetClient ||
                rowClient.indexOf(targetClient) !== -1 ||
                targetClient.indexOf(rowClient) !== -1;

            if (!matches) return;

            const fecha = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
            if (isNaN(fecha.getTime())) return;

            // Filtrar por rango de fechas si se proporciona
            if (startDate && adjustedEndDate) {
                // Dentro del rango [startDate, endDate]
                if (fecha < startDate || fecha > adjustedEndDate) return;
            } else if (adjustedEndDate && !startDate) {
                // Antes de endDate (para saldo inicial)
                if (fecha >= startDate) return;
            }

            const asistencia = idxAsistencia > -1 ? DataUtils.isTruthy(row[idxAsistencia]) : true;
            if (!asistencia) return;

            const horas = Number(row[idxHoras]) || 0;
            let rate = 0;
            if (typeof DatabaseService.getClientRateAtDate === 'function') {
                rate = DatabaseService.getClientRateAtDate(clientName, fecha);
            }

            const monto = horas * rate;

            // Agrupar por mes (primer día del mes)
            const key = `${fecha.getFullYear()}-${fecha.getMonth()}`;
            if (!monthlyMap.has(key)) {
                monthlyMap.set(key, {
                    fecha: new Date(fecha.getFullYear(), fecha.getMonth(), 1), // 1ro del mes
                    concepto: `Servicios ${getMonthName(fecha.getMonth())} ${fecha.getFullYear()}`,
                    debe: 0,
                    haber: 0,
                    tipo: 'FACTURA'
                });
            }
            const entry = monthlyMap.get(key);
            entry.debe += monto;
        });

        return Array.from(monthlyMap.values());
    }

    function normalizeClientName_(name) {
        if (!name) return '';
        return String(name)
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/\./g, '')
            .replace(/s\.?a\.?$/i, 'sa')
            .replace(/s\.?r\.?l\.?$/i, 'srl')
            .trim();
    }

    function getClientPayments(clientName, startDate, endDate) {
        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_CLIENTES');
        if (!sheet) return [];

        const lastRow = sheet.getLastRow();
        if (lastRow < 2) return [];

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const idxFecha = headers.indexOf('FECHA');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxMonto = headers.indexOf('MONTO');
        const idxObs = headers.indexOf('OBSERVACIONES');

        if (idxFecha === -1 || idxCliente === -1 || idxMonto === -1) return [];

        const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
        const targetClient = normalizeClientName_(clientName);

        // Ajustar endDate para incluir todo el día
        const adjustedEndDate = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59) : null;

        return data.map(row => {
            const rowClient = normalizeClientName_(row[idxCliente]);
            if (!rowClient) return null;

            // Mejorar matching: buscar coincidencia parcial
            const matches = rowClient === targetClient ||
                rowClient.indexOf(targetClient) !== -1 ||
                targetClient.indexOf(rowClient) !== -1;

            if (!matches) return null;

            const fecha = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
            if (isNaN(fecha.getTime())) return null;

            // Filtrar por rango de fechas si se proporciona
            if (startDate && adjustedEndDate) {
                // Dentro del rango [startDate, endDate]
                if (fecha < startDate || fecha > adjustedEndDate) return null;
            } else if (adjustedEndDate && !startDate) {
                // Antes de endDate (para saldo inicial)
                if (fecha >= startDate) return null;
            }

            const monto = Number(row[idxMonto]) || 0;

            return {
                fecha: fecha,
                concepto: 'Pago' + (row[idxObs] ? `: ${row[idxObs]}` : ''),
                debe: 0,
                haber: monto,
                tipo: 'PAGO'
            };
        }).filter(Boolean);
    }

    function recordClientPayment(fecha, cliente, monto, obs) {
        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_CLIENTES');
        // Si no existe, DatabaseService debería crearla o fallar. 
        // Asumimos que si getDbSheetForFormat devuelve algo, es usable.
        // Si es nueva, necesitamos headers.
        if (sheet.getLastRow() === 0) {
            sheet.appendRow(['ID', 'FECHA', 'CLIENTE', 'MONTO', 'OBSERVACIONES', 'TIMESTAMP']);
        }

        const id = new Date().getTime().toString(); // Simple ID
        sheet.appendRow([
            id,
            new Date(fecha),
            cliente,
            Number(monto),
            obs,
            new Date()
        ]);
        return { success: true };
    }

    function getMonthName(monthIndex) {
        const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return names[monthIndex] || '';
    }

    function parseDateFlexible_(val) {
        if (!val) return null;
        if (val instanceof Date) return val;
        if (typeof val === 'string') {
            // Soportar dd/mm/yyyy o dd/mm/yyyy hh:mm
            const m = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (m) {
                const d = Number(m[1]);
                const mo = Number(m[2]) - 1;
                const y = Number(m[3]);
                const dt = new Date(y, mo, d);
                if (!isNaN(dt.getTime())) return dt;
            }
        }
        const parsed = new Date(val);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    return {
        getEmployeeAccountStatement: getEmployeeAccountStatement,
        getClientAccountStatement: getClientAccountStatement,
        recordClientPayment: recordClientPayment
    };
})();
