/**
 * Controlador para cuenta corriente de empleados
 */
var AccountController = (function () {

    function normalizeHeaderKey_(val) {
        return String(val || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function getIdx_(colMap, keys) {
        for (let i = 0; i < keys.length; i++) {
            const k = normalizeHeaderKey_(keys[i]);
            if (colMap[k] !== undefined) return colMap[k];
        }
        return -1;
    }

    function toStartOfDay_(d) {
        if (!d) return null;
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return null;
        dt.setHours(0, 0, 0, 0);
        return dt;
    }

    function toEndOfDay_(d) {
        if (!d) return null;
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return null;
        dt.setHours(23, 59, 59, 999);
        return dt;
    }

    function toNumber_(val) {
        if (val == null || val === '') return 0;
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        const s = String(val).trim();
        if (!s) return 0;
        const cleaned = s
            .replace(/\s/g, '')
            .replace(/[^\d.,-]/g, '')
            .replace(/\./g, '')
            .replace(',', '.');
        const n = Number(cleaned);
        return isNaN(n) ? 0 : n;
    }

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

    function getClientInvoices(clientName, idCliente) {
        const filter = normalizeClientFilter_(clientName, idCliente);
        const resolvedName = filter.clientName;
        const resolvedId = filter.idCliente;
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

        const targetId = resolvedId || getClientId_(resolvedName);
        const targetClient = normalizeClientName_(resolvedName);

        return rows.map(row => {
            let matches = false;
            if (targetId && idxIdCliente > -1) {
                matches = String(row[idxIdCliente]) === String(targetId);
            }
            if (!matches && idxCliente > -1 && targetClient) {
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

    function getClientAccountStatement(clientName, startDateStr, endDateStr, idCliente) {
        const filter = normalizeClientFilter_(clientName, idCliente);
        if (!filter.clientName && !filter.idCliente) return { saldoInicial: 0, movimientos: [] };

        const startDate = toStartOfDay_(parseDateFlexible_(startDateStr));
        const endDate = toEndOfDay_(parseDateFlexible_(endDateStr));

        if (!startDate || !endDate) {
            return { saldoInicial: 0, movimientos: [] };
        }
        if (endDate < startDate) {
            return { saldoInicial: 0, movimientos: [] };
        }

        // 1. Calcular saldo inicial (antes del período)
        const saldoInicial = getClientBalanceBeforeDate(filter, startDate);

        // 2. Obtener movimientos dentro del período
        const debitos = getClientDebits(filter, startDate, endDate);
        const creditos = getClientPayments(filter, startDate, endDate);

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

    function getClientBalanceBeforeDate(clientName, beforeDate, idCliente) {
        const filter = normalizeClientFilter_(clientName, idCliente);
        if ((!filter.clientName && !filter.idCliente) || !beforeDate) return 0;

        // End exclusive: el saldo inicial debe ser estrictamente "antes" del inicio del período
        const beforeStart = toStartOfDay_(parseDateFlexible_(beforeDate));
        if (!beforeStart) return 0;
        const endExclusive = new Date(beforeStart.getTime() - 1);

        // Calcular débitos (facturas) antes de la fecha
        const debitosAnteriores = getClientDebits(filter, null, endExclusive);
        const totalDebitos = debitosAnteriores.reduce((sum, item) => sum + item.debe, 0);

        // Calcular créditos (pagos) antes de la fecha
        const creditosAnteriores = getClientPayments(filter, null, endExclusive);
        const totalCreditos = creditosAnteriores.reduce((sum, item) => sum + item.haber, 0);

        return totalDebitos - totalCreditos;
    }

    function getClientId_(clientName) {
        const found = DatabaseService.findClienteByNombreORazon(clientName);
        return found && found.id ? found.id : '';
    }

    function normalizeClientFilter_(clientName, idCliente) {
        if (clientName && typeof clientName === 'object' && !Array.isArray(clientName)) {
            idCliente = clientName.idCliente || clientName.ID_CLIENTE || idCliente;
            clientName = clientName.cliente || clientName.clientName || clientName.label || '';
        }
        const targetId = idCliente != null && idCliente !== '' ? String(idCliente) : '';
        if (!clientName && targetId && DatabaseService.findClienteById) {
            const cli = DatabaseService.findClienteById(targetId);
            if (cli && (cli.razonSocial || cli.nombre)) {
                clientName = cli.razonSocial || cli.nombre;
            }
        }
        const resolvedId = targetId || getClientId_(clientName);
        return { clientName: clientName || '', idCliente: resolvedId || '' };
    }

    function getClientDebits(clientName, startDate, endDate, idCliente) {
        const filter = normalizeClientFilter_(clientName, idCliente);
        const sheet = DatabaseService.getDbSheetForFormat('FACTURACION');
        const data = sheet.getDataRange().getValues();
        if (!data || data.length < 2) {
            return [];
        }

        const headers = data[0];
        const rows = data.slice(1);

        const colMap = {};
        headers.forEach((h, i) => { colMap[normalizeHeaderKey_(h)] = i; });

        const idxIdCliente = getIdx_(colMap, ['ID_CLIENTE', 'ID CLIENTE']);
        const idxCliente = getIdx_(colMap, ['RAZÓN SOCIAL', 'RAZON SOCIAL', 'CLIENTE']);
        const idxFecha = getIdx_(colMap, ['FECHA']);
        const idxPeriodo = getIdx_(colMap, ['PERIODO']);
        const idxNum = getIdx_(colMap, ['NUMERO', 'NÚMERO']);
        const idxComp = getIdx_(colMap, ['COMPROBANTE']);
        const idxTotal = getIdx_(colMap, ['TOTAL']);
        const idxImporte = getIdx_(colMap, ['IMPORTE']);
        const idxSubtotal = getIdx_(colMap, ['SUBTOTAL']);
        const idxId = getIdx_(colMap, ['ID']);
        const idxEstado = getIdx_(colMap, ['ESTADO']);

        if (idxFecha === -1) return [];

        const targetId = filter.idCliente || getClientId_(filter.clientName);
        const targetClient = normalizeClientName_(filter.clientName);
        const from = toStartOfDay_(startDate);
        const to = toEndOfDay_(endDate);

        return rows.map(row => {
            const fecha = parseDateFlexible_(row[idxFecha]);
            if (!fecha || isNaN(fecha.getTime())) return null;

            if (from && fecha < from) return null;
            if (to && fecha > to) return null;

            let matches = false;
            if (targetId && idxIdCliente > -1) {
                matches = String(row[idxIdCliente]) === String(targetId);
            }
            if (!matches && idxCliente > -1 && targetClient) {
                const rowClient = normalizeClientName_(row[idxCliente]);
                matches = rowClient === targetClient ||
                    rowClient.indexOf(targetClient) !== -1 ||
                    targetClient.indexOf(rowClient) !== -1;
            }
            if (!matches) return null;

            const estado = idxEstado > -1 ? String(row[idxEstado] || '').trim() : '';
            if (estado && String(estado).toLowerCase() === 'anulada') return null;

            const monto = idxTotal > -1 ? toNumber_(row[idxTotal])
                : idxImporte > -1 ? toNumber_(row[idxImporte])
                    : idxSubtotal > -1 ? toNumber_(row[idxSubtotal])
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
                periodo: periodo || '',
                estado: estado || ''
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

    function getClientPayments(clientName, startDate, endDate, idCliente) {
        const filter = normalizeClientFilter_(clientName, idCliente);
        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_CLIENTES');
        if (!sheet) return [];

        const lastRow = sheet.getLastRow();
        if (lastRow < 2) return [];

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const colMap = {};
        headers.forEach((h, i) => { colMap[normalizeHeaderKey_(h)] = i; });
        const idxFecha = getIdx_(colMap, ['FECHA']);
        const idxCliente = getIdx_(colMap, ['RAZÓN SOCIAL', 'RAZON SOCIAL', 'CLIENTE']);
        const idxIdCliente = getIdx_(colMap, ['ID_CLIENTE', 'ID CLIENTE']);
        const idxMonto = getIdx_(colMap, ['MONTO']);
        const idxDet = getIdx_(colMap, ['DETALLE', 'OBSERVACIONES']);
        const idxFactura = getIdx_(colMap, ['ID_FACTURA', 'ID FACTURA']);
        const idxFacturaNum = getIdx_(colMap, ['FACTURA_NUMERO', 'FACTURA NÚMERO']);

        if (idxFecha === -1 || idxMonto === -1) return [];

        const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
        const targetClient = normalizeClientName_(filter.clientName);
        const targetId = filter.idCliente || getClientId_(filter.clientName);

        const from = toStartOfDay_(startDate);
        const to = toEndOfDay_(endDate);

        return data.map(row => {
            const fecha = parseDateFlexible_(row[idxFecha]);
            if (!fecha || isNaN(fecha.getTime())) return null;

            if (from && fecha < from) return null;
            if (to && fecha > to) return null;

            let matches = false;
            if (targetId && idxIdCliente > -1) {
                matches = String(row[idxIdCliente]) === String(targetId);
            }
            if (!matches && idxCliente > -1 && targetClient) {
                const rowClient = normalizeClientName_(row[idxCliente]);
                matches = rowClient === targetClient ||
                    rowClient.indexOf(targetClient) !== -1 ||
                    targetClient.indexOf(rowClient) !== -1;
            }
            if (!matches) return null;

            const monto = toNumber_(row[idxMonto]);
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
            // Soportar yyyy-mm-dd (input date)
            const m2 = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (m2) {
                const y = Number(m2[1]);
                const mo = Number(m2[2]) - 1;
                const d = Number(m2[3]);
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
        recordClientPayment: recordClientPayment,
        getClientInvoices: getClientInvoices
    };
})();
