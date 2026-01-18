/**
 * Controlador para cuenta corriente de empleados
 */
var AccountController = (function () {

    function logToSheet(msg) {
        try {
            const ss = DatabaseService.getDbSpreadsheet();
            let sheet = ss.getSheetByName('DEBUG_LOG');
            if (!sheet) {
                sheet = ss.insertSheet('DEBUG_LOG');
                sheet.appendRow(['Timestamp', 'Message']);
            }
            sheet.appendRow([new Date(), msg]);
        } catch (e) {
            // ignore
        }
    }

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

    function getClientInvoices(clientName) {
        const sheet = DatabaseService.getDbSheetForFormat('FACTURACION');
        if (!sheet) return [];

        const data = sheet.getDataRange().getValues();
        if (!data || data.length < 2) return [];

        const headers = data[0].map(h => String(h || '').trim().toUpperCase());
        const rows = data.slice(1);

        const idxId = headers.indexOf('ID');
        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxCliente = headers.indexOf('RAZÓN SOCIAL');
        const idxFecha = headers.indexOf('FECHA');
        const idxPeriodo = headers.indexOf('PERIODO');
        const idxNum = headers.indexOf('NUMERO');
        const idxComp = headers.indexOf('COMPROBANTE');
        const idxTotal = headers.indexOf('TOTAL');

        const targetId = getClientId_(clientName);
        const targetClient = normalizeClientName_(clientName);

        return rows.map(row => {
            let matches = false;
            if (targetId && idxIdCliente > -1) {
                matches = String(row[idxIdCliente]) === String(targetId);
            }
            if (!matches && idxCliente > -1) {
                const rowClient = normalizeClientName_(row[idxCliente]);
                matches = rowClient === targetClient ||
                    rowClient.indexOf(targetClient) !== -1 ||
                    targetClient.indexOf(rowClient) !== -1;
            }
            if (!matches) return null;

            const fecha = parseDateFlexible_(row[idxFecha]);
            return {
                id: idxId > -1 ? row[idxId] : '',
                idCliente: idxIdCliente > -1 ? row[idxIdCliente] : '',
                fecha: fecha || '',
                periodo: idxPeriodo > -1 ? row[idxPeriodo] : '',
                numero: idxNum > -1 ? row[idxNum] : '',
                comprobante: idxComp > -1 ? row[idxComp] : '',
                total: idxTotal > -1 ? Number(row[idxTotal]) || 0 : 0
            };
        }).filter(Boolean).sort((a, b) => {
            const fa = a.fecha instanceof Date ? a.fecha.getTime() : 0;
            const fb = b.fecha instanceof Date ? b.fecha.getTime() : 0;
            return fb - fa;
        });
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

    function getClientId_(clientName) {
        const found = DatabaseService.findClienteByNombreORazon(clientName);
        return found && found.id ? found.id : '';
    }

    function getClientDebits(clientName, startDate, endDate) {
        const sheet = DatabaseService.getDbSheetForFormat('FACTURACION');
        const data = sheet.getDataRange().getValues();
        if (!data || data.length < 2) {
            return [];
        }

        const headers = data[0].map(h => String(h || '').trim().toUpperCase());
        const rows = data.slice(1);

        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxCliente = headers.indexOf('RAZÓN SOCIAL');
        const idxFecha = headers.indexOf('FECHA');
        const idxPeriodo = headers.indexOf('PERIODO');
        const idxNum = headers.indexOf('NUMERO');
        const idxComp = headers.indexOf('COMPROBANTE');
        const idxTotal = headers.indexOf('TOTAL');
        const idxImporte = headers.indexOf('IMPORTE');
        const idxSubtotal = headers.indexOf('SUBTOTAL');
        const idxId = headers.indexOf('ID');

        if (idxFecha === -1) return [];

        const targetId = getClientId_(clientName);
        const targetClient = normalizeClientName_(clientName);
        const adjustedEndDate = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59) : null;

        return rows.map(row => {
            const fecha = parseDateFlexible_(row[idxFecha]);
            if (!fecha || isNaN(fecha.getTime())) return null;

            if (startDate && adjustedEndDate) {
                if (fecha < startDate || fecha > adjustedEndDate) return null;
            } else if (adjustedEndDate && !startDate) {
                if (fecha >= adjustedEndDate) return null;
            }

            let matches = false;
            if (targetId && idxIdCliente > -1) {
                matches = String(row[idxIdCliente]) === String(targetId);
            }
            if (!matches && idxCliente > -1) {
                const rowClient = normalizeClientName_(row[idxCliente]);
                matches = rowClient === targetClient ||
                    rowClient.indexOf(targetClient) !== -1 ||
                    targetClient.indexOf(rowClient) !== -1;
            }
            if (!matches) return null;

            const monto = idxTotal > -1 ? Number(row[idxTotal]) || 0
                : idxImporte > -1 ? Number(row[idxImporte]) || 0
                    : idxSubtotal > -1 ? Number(row[idxSubtotal]) || 0
                        : 0;

            const periodo = idxPeriodo > -1 ? row[idxPeriodo] : '';
            const numero = idxNum > -1 ? row[idxNum] : '';
            const comp = idxComp > -1 ? row[idxComp] : '';

            const partes = [];
            if (comp) partes.push(comp);
            if (numero) partes.push(numero);
            if (periodo) partes.push(periodo);

            return {
                fecha: fecha,
                concepto: partes.length ? ('Factura ' + partes.join(' - ')) : 'Factura',
                debe: monto,
                haber: 0,
                tipo: 'FACTURA',
                idFactura: idxId > -1 ? row[idxId] : '',
                facturaNumero: numero || '',
                periodo: periodo || ''
            };
        }).filter(Boolean);
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
        const idxCliente = headers.indexOf('RAZÓN SOCIAL');
        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxMonto = headers.indexOf('MONTO');
        const idxDet = headers.indexOf('DETALLE');
        const idxFactura = headers.indexOf('ID_FACTURA');
        const idxFacturaNum = headers.indexOf('FACTURA_NUMERO');

        if (idxFecha === -1 || idxMonto === -1) return [];

        const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
        const targetClient = normalizeClientName_(clientName);
        const targetId = getClientId_(clientName);

        const adjustedEndDate = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59) : null;

        return data.map(row => {
            const fecha = parseDateFlexible_(row[idxFecha]);
            if (!fecha || isNaN(fecha.getTime())) return null;

            if (startDate && adjustedEndDate) {
                if (fecha < startDate || fecha > adjustedEndDate) return null;
            } else if (adjustedEndDate && !startDate) {
                if (fecha >= adjustedEndDate) return null;
            }

            let matches = false;
            if (targetId && idxIdCliente > -1) {
                matches = String(row[idxIdCliente]) === String(targetId);
            }
            if (!matches && idxCliente > -1) {
                const rowClient = normalizeClientName_(row[idxCliente]);
                matches = rowClient === targetClient ||
                    rowClient.indexOf(targetClient) !== -1 ||
                    targetClient.indexOf(rowClient) !== -1;
            }
            if (!matches) return null;

            const monto = Number(row[idxMonto]) || 0;
            const idFactura = idxFactura > -1 ? row[idxFactura] : '';
            const facturaNum = idxFacturaNum > -1 ? row[idxFacturaNum] : '';
            const det = idxDet > -1 ? row[idxDet] : '';

            let concepto = 'Pago';
            if (idFactura || facturaNum) {
                concepto += ` a factura ${facturaNum || idFactura}`;
            }
            if (det) {
                concepto += `: ${det}`;
            }

            return {
                fecha: fecha,
                concepto: concepto,
                debe: 0,
                haber: monto,
                tipo: 'PAGO',
                idFactura: idFactura,
                facturaNumero: facturaNum
            };
        }).filter(Boolean);
    }

    function recordClientPayment(payload) {
        // payload: { fecha, cliente, idCliente, monto, detalle, numeroComprobante, medioPago, cuit, razonSocial, idFactura, facturaNumero }
        if (!payload) throw new Error('Faltan datos de pago');
        const fecha = payload.fecha || payload.FECHA;
        const clienteName = payload.cliente || payload.CLIENTE || '';
        const idCliente = payload.idCliente || payload.ID_CLIENTE || getClientId_(clienteName);
        const monto = payload.monto || payload.MONTO;
        if (!fecha || !monto || (!clienteName && !idCliente)) {
            throw new Error('Datos incompletos para registrar pago');
        }

        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_CLIENTES');
        if (sheet.getLastRow() === 0) {
            sheet.appendRow([
                'ID',
                'ID_CLIENTE',
                'FECHA',
                'RAZÓN SOCIAL',
                'CUIT',
                'DETALLE',
                'N° COMPROBANTE',
                'MEDIO DE PAGO',
                'MONTO',
                'ID_FACTURA',
                'FACTURA_NUMERO'
            ]);
        }

        const id = DatabaseService.getNextId(sheet);
        const row = [
            id,
            idCliente || '',
            new Date(fecha),
            payload.razonSocial || clienteName,
            payload.cuit || '',
            payload.detalle || '',
            payload['N° COMPROBANTE'] || payload.nroComprobante || '',
            payload.medioPago || payload['MEDIO DE PAGO'] || '',
            Number(monto) || 0,
            payload.idFactura || payload.ID_FACTURA || '',
            payload.facturaNumero || payload.FACTURA_NUMERO || ''
        ];

        sheet.appendRow(row);
        return { success: true, id };
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
