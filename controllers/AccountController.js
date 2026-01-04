/**
 * Controlador para cuenta corriente de empleados
 */
var AccountController = (function () {

    function normalizeHeaderKey_(val) {
        return String(val || '')
            .normalize('NFD') // Remover acentos
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function normalizeIdString_(val) {
        if (val == null) return '';
        const s = String(val).trim();
        if (!s) return '';
        if (/^\d+$/.test(s)) return String(Number(s));
        return s;
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
        if (!filter.clientName && !filter.idCliente) return [];

        // Preferimos usar el mismo origen que la UI de Facturación para evitar desvíos
        const invoices = (typeof InvoiceController !== 'undefined' && InvoiceController.getInvoices)
            ? InvoiceController.getInvoices({ cliente: filter.clientName, idCliente: filter.idCliente })
            : [];

        const tz = 'GMT';
        const list = (invoices || []).map(inv => {
            const estado = String(inv['ESTADO'] || '').trim();
            if (estado && estado.toLowerCase() === 'anulada') return null;
            const fecha = parseDateFlexible_(inv['FECHA']);
            return {
                id: inv.ID != null ? String(inv.ID) : String(inv['ID'] || ''),
                idCliente: inv['ID_CLIENTE'] || '',
                fecha: (fecha && !isNaN(fecha.getTime())) ? Utilities.formatDate(fecha, tz, 'yyyy-MM-dd') : '',
                periodo: inv['PERIODO'] || '',
                numero: inv['NUMERO'] || '',
                comprobante: inv['COMPROBANTE'] || '',
                total: toNumber_(inv['TOTAL'] || inv['SUBTOTAL'] || inv['IMPORTE'] || 0),
                estado: estado || ''
            };
        }).filter(Boolean);

        return list.sort((a, b) => {
            return String(b.fecha || '').localeCompare(String(a.fecha || ''));
        });
    }

    function getClientInvoicesForPayment(clientName, idCliente) {
        const filter = normalizeClientFilter_(clientName, idCliente);
        if (!filter.clientName && !filter.idCliente) return [];

        const invoices = getInvoicesForClient_(filter, null, null);
        const payments = getClientPayments(filter, null, null);

        const paidByInvoiceId = new Map();
        const paidByInvoiceNumber = new Map();

        (payments || []).forEach(p => {
            const amount = toNumber_(p && p.haber);
            if (amount <= 0) return;

            const pid = normalizeIdString_(p && p.idFactura);
            if (pid) {
                paidByInvoiceId.set(pid, (paidByInvoiceId.get(pid) || 0) + amount);
            }

            const pnum = String((p && p.facturaNumero) || '').trim();
            if (pnum) {
                paidByInvoiceNumber.set(pnum, (paidByInvoiceNumber.get(pnum) || 0) + amount);
            }
        });

        const tz = 'GMT';
        const list = (invoices || []).map(inv => {
            if (!inv) return null;
            const estado = String(inv['ESTADO'] || '').trim();
            if (estado && estado.toLowerCase() === 'anulada') return null;
            if (estado && estado.toLowerCase() === 'pagada') return null;

            const invId = inv.ID != null ? String(inv.ID) : String(inv['ID'] || '');
            const invIdNorm = normalizeIdString_(invId);
            const numero = String(inv['NUMERO'] || '').trim();

            const total = toNumber_(inv['TOTAL'] || inv['SUBTOTAL'] || inv['IMPORTE'] || 0);
            const paid = (invIdNorm && paidByInvoiceId.get(invIdNorm)) ||
                (numero && paidByInvoiceNumber.get(numero)) ||
                0;
            const saldo = total - paid;

            const fecha = parseDateFlexible_(inv['FECHA']);
            const fechaStr = (fecha && !isNaN(fecha.getTime())) ? Utilities.formatDate(fecha, tz, 'yyyy-MM-dd') : '';

            return {
                id: invIdNorm || invId,
                idCliente: inv['ID_CLIENTE'] || '',
                fecha: fechaStr,
                periodo: inv['PERIODO'] || '',
                numero: numero,
                comprobante: inv['COMPROBANTE'] || '',
                total: total,
                pagado: paid,
                saldo: saldo,
                estado: estado || ''
            };
        }).filter(Boolean);

        return list
            .filter(i => (Number(i.saldo) || 0) > 0.009)
            .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
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
        const movimientos = [...(debitos || []), ...(creditos || [])].sort(compareMovimientos_);

        // 4. Calcular saldo acumulado partiendo del saldo inicial
        let saldo = saldoInicial;
        const movimientosConSaldo = movimientos.map(m => {
            saldo += (m.debe - m.haber);
            return {
                ...m,
                saldo: saldo
            };
        });

        // Normalizar salida para el cliente (google.script.run es sensible a tipos no-serializables)
        // - fecha: yyyy-MM-dd (string)
        // - montos: number
        // Importante: usamos GMT/UTC para evitar corrimientos de fecha cuando la hoja/ejecución
        // tiene zona horaria distinta a la del usuario.
        const tz = 'GMT';
        const movimientosOut = movimientosConSaldo.map(m => {
            const fecha = parseDateFlexible_(m && m.fecha);
            const fechaStr = fecha && !isNaN(fecha.getTime())
                ? Utilities.formatDate(fecha, tz, 'yyyy-MM-dd')
                : '';
            return {
                fecha: fechaStr,
                concepto: (m && m.concepto != null) ? String(m.concepto) : '',
                debe: toNumber_(m && m.debe),
                haber: toNumber_(m && m.haber),
                saldo: toNumber_(m && m.saldo),
                tipo: (m && m.tipo) ? String(m.tipo) : '',
                idFactura: (m && m.idFactura != null) ? String(m.idFactura) : '',
                facturaNumero: (m && m.facturaNumero != null) ? String(m.facturaNumero) : '',
                periodo: (m && m.periodo != null) ? String(m.periodo) : '',
                estado: (m && m.estado != null) ? String(m.estado) : ''
            };
        });

        return {
            saldoInicial: toNumber_(saldoInicial),
            movimientos: movimientosOut
        };
    }

    function mapInvoiceToDebit_(inv) {
        if (!inv) return null;
        const estado = String(inv['ESTADO'] || '').trim();
        if (estado && estado.toLowerCase() === 'anulada') return null;

        const fecha = parseDateFlexible_(inv['FECHA']);
        if (!fecha || isNaN(fecha.getTime())) return null;

        const periodo = inv['PERIODO'] || '';
        const numero = inv['NUMERO'] || '';
        const comp = inv['COMPROBANTE'] || '';

        const partes = [];
        if (comp) partes.push(comp);
        if (numero) partes.push(numero);
        if (periodo) partes.push(periodo);

        const monto = toNumber_(inv['TOTAL'] || inv['SUBTOTAL'] || inv['IMPORTE'] || 0);
        const invId = inv.ID != null ? inv.ID : (inv['ID'] || '');

        return {
            fecha: fecha,
            concepto: partes.length ? ('Factura ' + partes.join(' - ')) : 'Factura',
            debe: monto,
            haber: 0,
            tipo: 'FACTURA',
            idFactura: invId,
            facturaNumero: numero || '',
            periodo: periodo || '',
            estado: estado || ''
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

    function normalizeClientFilter_(clientName, idCliente) {
        if (clientName && typeof clientName === 'object' && !Array.isArray(clientName)) {
            idCliente = clientName.idCliente || clientName.ID_CLIENTE || idCliente;
            clientName = clientName.cliente || clientName.clientName || clientName.label || '';
        }
        const targetId = (idCliente != null && idCliente !== '') ? normalizeIdString_(idCliente) : '';
        if (!targetId) return { clientName: '', idCliente: '' };
        if (!clientName && DatabaseService.findClienteById) {
            const cli = DatabaseService.findClienteById(targetId);
            if (cli && (cli.razonSocial || cli.nombre)) {
                clientName = cli.nombre || cli.razonSocial;
            }
        }
        return { clientName: clientName || '', idCliente: targetId };
    }

    function getInvoicesForClient_(filter, startDate, endDate) {
        if (typeof InvoiceController === 'undefined' || !InvoiceController.getInvoices) return [];
        const base = { idCliente: filter.idCliente };
        const invoices = InvoiceController.getInvoices({
            ...base,
            fechaDesde: startDate || '',
            fechaHasta: endDate || ''
        }) || [];

        if (invoices.length) return invoices;

        // Fallback: traer todo y filtrar localmente por fechas (evita edge cases de parsing/timezone)
        if (startDate || endDate) {
            const from = toStartOfDay_(parseDateFlexible_(startDate));
            const to = toEndOfDay_(parseDateFlexible_(endDate));
            const all = InvoiceController.getInvoices(base) || [];
            return all.filter(inv => {
                const f = parseDateFlexible_(inv && inv['FECHA']);
                if (!f || isNaN(f.getTime())) return false;
                if (from && f < from) return false;
                if (to && f > to) return false;
                return true;
            });
        }

        return [];
    }

    function compareMovimientos_(a, b) {
        const da = parseDateFlexible_(a && a.fecha);
        const db = parseDateFlexible_(b && b.fecha);
        const ta = da && !isNaN(da.getTime()) ? da.getTime() : 0;
        const tb = db && !isNaN(db.getTime()) ? db.getTime() : 0;
        if (ta !== tb) return ta - tb;

        const order = { FACTURA: 0, PAGO: 1 };
        const oa = a && a.tipo && order[a.tipo] !== undefined ? order[a.tipo] : 9;
        const ob = b && b.tipo && order[b.tipo] !== undefined ? order[b.tipo] : 9;
        if (oa !== ob) return oa - ob;

        const ida = a && a.idFactura != null ? String(a.idFactura) : '';
        const idb = b && b.idFactura != null ? String(b.idFactura) : '';
        return ida.localeCompare(idb, 'es', { numeric: true, sensitivity: 'base' });
    }

    function getClientDebits(clientName, startDate, endDate, idCliente) {
        const filter = normalizeClientFilter_(clientName, idCliente);
        if (!filter.clientName && !filter.idCliente) return [];

        const invoices = getInvoicesForClient_(filter, startDate, endDate);
        return (invoices || []).map(inv => mapInvoiceToDebit_(inv)).filter(Boolean);
    }

    function getClientPayments(clientName, startDate, endDate, idCliente) {
        const filter = normalizeClientFilter_(clientName, idCliente);
        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_CLIENTES');
        if (!sheet) return [];
        if (!filter.idCliente) return [];

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
        const targetId = normalizeIdString_(filter.idCliente);

        const from = toStartOfDay_(startDate);
        const to = toEndOfDay_(endDate);

        return data.map(row => {
            const fecha = parseDateFlexible_(row[idxFecha]);
            if (!fecha || isNaN(fecha.getTime())) return null;

            if (from && fecha < from) return null;
            if (to && fecha > to) return null;

            if (!targetId || idxIdCliente === -1) return null;
            if (normalizeIdString_(row[idxIdCliente]) !== targetId) return null;

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

    function getUnappliedClientPayments(clientName, idCliente) {
        const filter = normalizeClientFilter_(clientName, idCliente);
        if (!filter.idCliente) return [];

        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_CLIENTES');
        if (!sheet) return [];

        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return [];

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const colMap = {};
        headers.forEach((h, i) => { colMap[normalizeHeaderKey_(h)] = i; });
        const idxId = getIdx_(colMap, ['ID']);
        const idxFecha = getIdx_(colMap, ['FECHA']);
        const idxCliente = getIdx_(colMap, ['RAZÓN SOCIAL', 'RAZON SOCIAL', 'CLIENTE']);
        const idxIdCliente = getIdx_(colMap, ['ID_CLIENTE', 'ID CLIENTE']);
        const idxMonto = getIdx_(colMap, ['MONTO']);
        const idxDet = getIdx_(colMap, ['DETALLE', 'OBSERVACIONES']);
        const idxFactura = getIdx_(colMap, ['ID_FACTURA', 'ID FACTURA']);
        const idxFacturaNum = getIdx_(colMap, ['FACTURA_NUMERO', 'FACTURA NÚMERO']);
        const idxMedio = getIdx_(colMap, ['MEDIO DE PAGO', 'MEDIO PAGO']);
        const idxNro = getIdx_(colMap, ['N° COMPROBANTE', 'NUMERO COMPROBANTE', 'NRO COMPROBANTE']);

        if (idxMonto === -1) return [];

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        const targetId = normalizeIdString_(filter.idCliente);
        const tz = 'GMT';

        const list = data.map(row => {
            if (!targetId || idxIdCliente === -1) return null;
            if (normalizeIdString_(row[idxIdCliente]) !== targetId) return null;

            const idFactura = idxFactura > -1 ? row[idxFactura] : '';
            const facturaNum = idxFacturaNum > -1 ? row[idxFacturaNum] : '';
            if (normalizeIdString_(idFactura) || String(facturaNum || '').trim()) return null;

            const monto = toNumber_(row[idxMonto]);
            if (monto <= 0) return null;

            const fecha = idxFecha > -1 ? parseDateFlexible_(row[idxFecha]) : null;
            const fechaStr = (fecha && !isNaN(fecha.getTime())) ? Utilities.formatDate(fecha, tz, 'yyyy-MM-dd') : '';

            return {
                id: idxId > -1 ? row[idxId] : '',
                fecha: fechaStr,
                monto: monto,
                detalle: idxDet > -1 ? row[idxDet] : '',
                medioPago: idxMedio > -1 ? row[idxMedio] : '',
                numeroComprobante: idxNro > -1 ? row[idxNro] : ''
            };
        }).filter(Boolean);

        return list.sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
    }

    function applyClientPayment(paymentId, allocations) {
        if (!paymentId) throw new Error('Pago no encontrado.');
        if (!Array.isArray(allocations) || allocations.length === 0) {
            throw new Error('No hay montos para aplicar.');
        }

        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_CLIENTES');
        if (!sheet) throw new Error('Sheet PAGOS_CLIENTES no encontrado');

        const rowNumber = DatabaseService.findRowById(sheet, paymentId);
        if (!rowNumber) throw new Error('Pago no encontrado.');

        const lastCol = sheet.getLastColumn();
        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const colMap = {};
        headers.forEach((h, i) => { colMap[normalizeHeaderKey_(h)] = i; });
        const idxId = getIdx_(colMap, ['ID']);
        const idxFecha = getIdx_(colMap, ['FECHA']);
        const idxCliente = getIdx_(colMap, ['RAZÓN SOCIAL', 'RAZON SOCIAL', 'CLIENTE']);
        const idxIdCliente = getIdx_(colMap, ['ID_CLIENTE', 'ID CLIENTE']);
        const idxMonto = getIdx_(colMap, ['MONTO']);
        const idxDet = getIdx_(colMap, ['DETALLE', 'OBSERVACIONES']);
        const idxFactura = getIdx_(colMap, ['ID_FACTURA', 'ID FACTURA']);
        const idxFacturaNum = getIdx_(colMap, ['FACTURA_NUMERO', 'FACTURA NÚMERO']);
        const idxMedio = getIdx_(colMap, ['MEDIO DE PAGO', 'MEDIO PAGO']);
        const idxNro = getIdx_(colMap, ['N° COMPROBANTE', 'NUMERO COMPROBANTE', 'NRO COMPROBANTE']);
        const idxCuit = getIdx_(colMap, ['CUIT']);

        const row = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
        const montoOriginal = idxMonto > -1 ? toNumber_(row[idxMonto]) : 0;
        if (montoOriginal <= 0) throw new Error('El pago no tiene saldo disponible.');

        const idFacturaActual = idxFactura > -1 ? row[idxFactura] : '';
        const facturaNumActual = idxFacturaNum > -1 ? row[idxFacturaNum] : '';
        if (normalizeIdString_(idFacturaActual) || String(facturaNumActual || '').trim()) {
            throw new Error('El pago ya está asociado a una factura.');
        }

        const clientName = idxCliente > -1 ? row[idxCliente] : '';
        const idCliente = idxIdCliente > -1 ? row[idxIdCliente] : '';
        const filter = normalizeClientFilter_(clientName, idCliente);
        const invoices = getClientInvoicesForPayment(filter.clientName, filter.idCliente);

        const normalized = allocations.map(item => {
            return {
                id: normalizeIdString_(item.invoiceId || item.idFactura || item.id || ''),
                amount: toNumber_(item.amount || item.monto || item.value || 0)
            };
        }).filter(a => a.id && a.amount > 0);

        if (!normalized.length) {
            throw new Error('No hay montos para aplicar.');
        }

        let totalApplied = 0;
        const rowsToAppend = [];
        normalized.forEach(a => {
            const inv = invoices.find(i => normalizeIdString_(i.id) === a.id);
            if (!inv) {
                throw new Error('Factura no encontrada: ' + a.id);
            }
            const saldo = toNumber_(inv.saldo);
            if (a.amount > saldo + 0.01) {
                throw new Error('El monto supera el saldo de la factura ' + (inv.numero || inv.id));
            }
            totalApplied += a.amount;
            rowsToAppend.push({ inv: inv, amount: a.amount });
        });

        if (totalApplied > montoOriginal + 0.01) {
            throw new Error('El monto total aplicado supera el saldo disponible.');
        }

        const remaining = Math.max(0, montoOriginal - totalApplied);

        if (idxMonto > -1) {
            sheet.getRange(rowNumber, idxMonto + 1).setValue(remaining);
        }
        if (idxDet > -1) {
            const baseDet = String(row[idxDet] || '').trim();
            const facturasTxt = rowsToAppend.map(r => (r.inv.numero || r.inv.id)).join(', ');
            const suffix = remaining > 0
                ? `Aplicado a facturas ${facturasTxt}. Saldo pendiente ${remaining}.`
                : `Aplicado a facturas ${facturasTxt}.`;
            sheet.getRange(rowNumber, idxDet + 1).setValue(baseDet ? (baseDet + ' | ' + suffix) : suffix);
        }

        let nextId = DatabaseService.getNextId(sheet);
        rowsToAppend.forEach(r => {
            const newRow = new Array(headers.length).fill('');
            if (idxId > -1) {
                newRow[idxId] = nextId;
            } else {
                newRow[0] = nextId;
            }
            if (idxFecha > -1) newRow[idxFecha] = row[idxFecha] || new Date();
            if (idxCliente > -1) newRow[idxCliente] = filter.clientName || row[idxCliente] || '';
            if (idxIdCliente > -1) newRow[idxIdCliente] = filter.idCliente || row[idxIdCliente] || '';
            if (idxCuit > -1) newRow[idxCuit] = row[idxCuit] || '';
            if (idxMonto > -1) newRow[idxMonto] = r.amount;
            if (idxFactura > -1) newRow[idxFactura] = r.inv.id || '';
            if (idxFacturaNum > -1) newRow[idxFacturaNum] = r.inv.numero || '';
            if (idxMedio > -1) newRow[idxMedio] = row[idxMedio] || '';
            if (idxNro > -1) newRow[idxNro] = row[idxNro] || '';
            if (idxDet > -1) {
                const baseDet = String(row[idxDet] || '').trim();
                newRow[idxDet] = baseDet
                    ? `Aplicación de pago #${paymentId}: ${baseDet}`
                    : `Aplicación de pago #${paymentId}`;
            }
            sheet.appendRow(newRow);
            nextId += 1;

            if (r.inv && r.inv.id) {
                tryUpdateInvoiceStatusIfPaid_(r.inv.id);
            }
        });

        return { ok: true, applied: totalApplied, remaining: remaining };
    }

    function recordClientPayment(payload) {
        // payload: { fecha, cliente, idCliente, monto, detalle, numeroComprobante, medioPago, cuit, razonSocial, idFactura, facturaNumero }
        if (!payload) throw new Error('Faltan datos de pago');
        const fechaRaw = payload.fecha || payload.FECHA;
        const clienteNameRaw = payload.cliente || payload.CLIENTE || '';
        const filter = normalizeClientFilter_(clienteNameRaw, payload.idCliente || payload.ID_CLIENTE);
        const idCliente = filter.idCliente || '';
        const clienteName = (clienteNameRaw || filter.clientName || payload.razonSocial || '').toString().trim();
        const fecha = parseDateFlexible_(fechaRaw);
        const monto = toNumber_(payload.monto || payload.MONTO);
        if (!fecha || isNaN(fecha.getTime()) || monto <= 0 || (!clienteName && !idCliente)) {
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
            fecha,
            clienteName,
            payload.cuit || '',
            payload.detalle || '',
            payload['N° COMPROBANTE'] || payload.nroComprobante || '',
            payload.medioPago || payload['MEDIO DE PAGO'] || '',
            monto,
            payload.idFactura || payload.ID_FACTURA || '',
            payload.facturaNumero || payload.FACTURA_NUMERO || ''
        ];

        sheet.appendRow(row);

        // Si el pago está vinculado a una factura, actualizar estado de la factura si quedó saldada.
        const invoiceId = normalizeIdString_(payload.idFactura || payload.ID_FACTURA || '');
        if (invoiceId) {
            tryUpdateInvoiceStatusIfPaid_(invoiceId);
        }
        return { success: true, id };
    }

    function tryUpdateInvoiceStatusIfPaid_(invoiceId) {
        if (!invoiceId) return;
        const invId = normalizeIdString_(invoiceId);
        if (!invId) return;

        const invSheet = DatabaseService.getDbSheetForFormat('FACTURACION');
        const invRowNumber = DatabaseService.findRowById(invSheet, invId);
        if (!invRowNumber) return;

        const invLastCol = invSheet.getLastColumn();
        if (!invLastCol) return;
        const invHeaders = invSheet.getRange(1, 1, 1, invLastCol).getValues()[0];
        const invColMap = {};
        invHeaders.forEach((h, i) => { invColMap[normalizeHeaderKey_(h)] = i; });
        const idxEstado = getIdx_(invColMap, ['ESTADO']);
        const idxTotal = getIdx_(invColMap, ['TOTAL']);
        const idxSubtotal = getIdx_(invColMap, ['SUBTOTAL']);
        const idxImporte = getIdx_(invColMap, ['IMPORTE']);
        if (idxEstado === -1 || (idxTotal === -1 && idxSubtotal === -1 && idxImporte === -1)) return;

        const invRow = invSheet.getRange(invRowNumber, 1, 1, invLastCol).getValues()[0];
        const estadoActual = String(invRow[idxEstado] || '').trim();
        if (estadoActual && estadoActual.toLowerCase() === 'anulada') return;
        if (estadoActual && estadoActual.toLowerCase() === 'pagada') return;

        const total = (
            (idxTotal > -1 ? toNumber_(invRow[idxTotal]) : 0) ||
            (idxSubtotal > -1 ? toNumber_(invRow[idxSubtotal]) : 0) ||
            (idxImporte > -1 ? toNumber_(invRow[idxImporte]) : 0)
        );
        if (total <= 0) return;

        const paySheet = DatabaseService.getDbSheetForFormat('PAGOS_CLIENTES');
        const payLastRow = paySheet.getLastRow();
        const payLastCol = paySheet.getLastColumn();
        if (payLastRow < 2 || payLastCol === 0) return;

        const payHeaders = paySheet.getRange(1, 1, 1, payLastCol).getValues()[0];
        const payColMap = {};
        payHeaders.forEach((h, i) => { payColMap[normalizeHeaderKey_(h)] = i; });
        const idxPayInv = getIdx_(payColMap, ['ID_FACTURA', 'ID FACTURA']);
        const idxPayMonto = getIdx_(payColMap, ['MONTO']);
        if (idxPayInv === -1 || idxPayMonto === -1) return;

        const payData = paySheet.getRange(2, 1, payLastRow - 1, payLastCol).getValues();
        let paid = 0;
        for (let i = 0; i < payData.length; i++) {
            const row = payData[i];
            const pid = normalizeIdString_(row[idxPayInv]);
            if (pid && pid === invId) {
                paid += toNumber_(row[idxPayMonto]);
            }
        }

        if (paid >= total - 0.01) {
            invSheet.getRange(invRowNumber, idxEstado + 1).setValue('Pagada');
        }
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
        getClientInvoices: getClientInvoices,
        getClientInvoicesForPayment: getClientInvoicesForPayment,
        getUnappliedClientPayments: getUnappliedClientPayments,
        applyClientPayment: applyClientPayment
    };
})();
