/**
 * Controlador de Facturación
 * Maneja la lógica de negocio para facturas
 */
var InvoiceController = (function () {

    const FORMAT_ID = 'FACTURACION';

    /**
     * Obtiene facturas filtradas
     */
    function getInvoices(filters) {
        filters = filters || {};
        const sheet = DatabaseService.getDbSheetForFormat(FORMAT_ID);

        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();

        if (lastRow < 2 || lastCol === 0) return [];

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

        // Map headers to indices (normalized)
        const colMap = {};
        headers.forEach((h, i) => {
            colMap[normalizeHeader_(h)] = i;
        });

        // Prepare search terms
        const searchClient = filters.cliente ? normalizeClientSearch_(filters.cliente) : null;
        const searchPeriod = filters.periodo || null;
        const searchStatus = (filters.estado && filters.estado !== 'Todos') ? filters.estado : null;

        let dateFrom = parseDateSafe_(filters.fechaDesde);
        let dateTo = parseDateSafe_(filters.fechaHasta);
        if (dateTo) dateTo.setHours(23, 59, 59, 999);

        const results = [];
        const idxId = getColIdx_(colMap, ['ID']);
        const idxCliente = getColIdx_(colMap, ['RAZON SOCIAL', 'CLIENTE']);
        const idxPeriodo = getColIdx_(colMap, ['PERIODO']);
        const idxEstado = getColIdx_(colMap, ['ESTADO']);
        const idxFecha = getColIdx_(colMap, ['FECHA']);

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            // 1. Filter Logic (on RAW values)

            // Client
            if (searchClient && idxCliente > -1) {
                const cliNorm = normalizeClientSearch_(row[idxCliente] || '');
                if (cliNorm.indexOf(searchClient) === -1) continue;
            }

            // Period
            if (searchPeriod && idxPeriodo > -1) {
                const val = row[idxPeriodo];
                let periodVal = '';
                if (val instanceof Date && !isNaN(val)) {
                    periodVal = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM');
                } else {
                    periodVal = String(val || '');
                }
                if (periodVal !== searchPeriod && periodVal.indexOf(searchPeriod) === -1) continue;
            }

            // Status
            if (searchStatus && idxEstado > -1) {
                if (String(row[idxEstado] || '') !== String(searchStatus)) continue;
            }

            // Date Range
            if ((dateFrom || dateTo) && idxFecha > -1) {
                const rowDate = parseDateSafe_(row[idxFecha]);
                if (dateFrom && (!rowDate || rowDate < dateFrom)) continue;
                if (dateTo && (!rowDate || rowDate > dateTo)) continue;
            }

            // 2. Map to Object
            const record = {};
            // Return normalized values for consistency
            headers.forEach((h, colIdx) => {
                record[h] = DataUtils.normalizeCellForSearch(row[colIdx]);
            });
            // Ensure ID is present
            record.ID = idxId > -1 ? row[idxId] : row[0];
            results.push(record);
        }

        return results;
    }

    /**
     * Obtiene una factura por ID
     */
    function getInvoiceById(id) {
        const sheet = DatabaseService.getDbSheetForFormat(FORMAT_ID);
        const rowNumber = DatabaseService.findRowById(sheet, id);
        if (!rowNumber) return null;

        const lastCol = sheet.getLastColumn();
        if (!lastCol) return null;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const row = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];

        const record = {};
        headers.forEach((h, colIdx) => {
            record[h] = DataUtils.normalizeCellForSearch(row[colIdx]);
        });
        record.ID = row[0];
        return record;
    }

    /**
     * Crea una nueva factura
     */
    function createInvoice(data) {
        data = data || {};
        applyTotals_(data);
        return RecordController.saveRecord(FORMAT_ID, data);
    }

    /**
     * Actualiza una factura
     */
    function updateInvoice(id, data) {
        data = data || {};
        applyTotals_(data);
        return RecordController.updateRecord(FORMAT_ID, id, data);
    }

    /**
     * Crea una factura a partir de asistencia (rango de fechas, cliente)
     * Calcula horas y total facturable usando la tarifa vigente por día.
     */
    function createInvoiceFromAttendance(cliente, fechaDesdeStr, fechaHastaStr, extra) {
        const clienteNombre = (cliente || '').toString().trim();
        if (!clienteNombre) {
            throw new Error('Falta el cliente para generar la factura.');
        }

        const start = parseDateSafe_(fechaDesdeStr);
        const end = parseDateSafe_(fechaHastaStr);
        if (!start || !end) {
            throw new Error('Fechas inválidas para generar factura.');
        }
        // Cerrar end al final del día
        end.setHours(23, 59, 59, 999);

        const clienteData = resolveClienteData_(clienteNombre);
        const asistenciaData = getAsistenciaData_(clienteData, start, end);

        if (asistenciaData.totalHoras <= 0) {
            throw new Error('No hay horas con asistencia para ese rango.');
        }

        const periodoLabel = buildPeriodoLabel_(start, end);
        const valorHoraProm = asistenciaData.totalHoras > 0 ? asistenciaData.totalImporte / asistenciaData.totalHoras : 0;

        // Validar duplicado de periodo para el cliente
        if (existsInvoiceForPeriod_(clienteData, periodoLabel)) {
            throw new Error('Ya existe una factura para este cliente en ese período.');
        }

        const record = {
            'ID_CLIENTE': clienteData.id || '',
            'FECHA': end,
            'PERIODO': periodoLabel,
            'COMPROBANTE': (extra && extra.comprobante) || 'Factura B',
            'NUMERO': (extra && extra.numero) || '',
            'RAZÓN SOCIAL': clienteData.razonSocial || clienteNombre,
            'CUIT': clienteData.cuit || '',
            'CONCEPTO': (extra && extra.concepto) || ('Servicios ' + periodoLabel),
            'HORAS': asistenciaData.totalHoras,
            'VALOR HORA': valorHoraProm,
            'IMPORTE': asistenciaData.totalImporte,
            'SUBTOTAL': asistenciaData.totalImporte,
            'TOTAL': asistenciaData.totalImporte,
            'ESTADO': (extra && extra.estado) || 'Pendiente',
            'OBSERVACIONES': (extra && extra.observaciones) || ''
        };

        applyTotals_(record);
        const id = RecordController.saveRecord(FORMAT_ID, record);
        return { id: id, record: record };
    }

    function parseDateSafe_(val) {
        if (!val) return null;
        if (val instanceof Date && !isNaN(val)) return val;
        const d = new Date(val);
        return isNaN(d) ? null : d;
    }

    function resolveClienteData_(clienteNombre) {
        const ref = DatabaseService.getClientesActivos() || [];
        const normTarget = normalize_(clienteNombre);
        let found = null;
        ref.forEach(c => {
            const n1 = normalize_(c.nombre || '');
            const n2 = normalize_(c.razonSocial || '');
            if (n1 === normTarget || n2 === normTarget) {
                found = c;
            }
        });

        if (found) {
            return {
                id: found.id || '',
                razonSocial: found.razonSocial || found.nombre || clienteNombre,
                cuit: found.cuit || ''
            };
        }

        const byName = DatabaseService.findClienteByNombreORazon(clienteNombre);
        return {
            id: byName && byName.id ? byName.id : '',
            razonSocial: byName && (byName.razonSocial || byName.nombre) ? (byName.razonSocial || byName.nombre) : clienteNombre,
            cuit: ''
        };
    }

    function getAsistenciaData_(clienteData, start, end) {
        const sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) {
            return { totalHoras: 0, totalImporte: 0 };
        }

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').toUpperCase());
        const idxFecha = headers.indexOf('FECHA');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxHoras = headers.indexOf('HORAS');
        const idxAsistencia = headers.indexOf('ASISTENCIA');

        if (idxFecha === -1 || idxCliente === -1) {
            return { totalHoras: 0, totalImporte: 0 };
        }

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        let totalHoras = 0;
        let totalImporte = 0;
        const targetId = clienteData.id ? String(clienteData.id) : '';
        const targetNorm = normalize_(clienteData.razonSocial || '');
        const resolveRateAtDate = buildClientRateResolver_(clienteData.razonSocial || '');

        data.forEach(row => {
            const fecha = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
            if (isNaN(fecha) || fecha < start || fecha > end) return;

            let matches = false;
            if (targetId && idxIdCliente > -1) {
                matches = String(row[idxIdCliente]) === targetId;
            }
            if (!matches) {
                const cliNorm = normalize_(row[idxCliente] || '');
                matches = cliNorm === targetNorm || cliNorm.indexOf(targetNorm) !== -1 || targetNorm.indexOf(cliNorm) !== -1;
            }
            if (!matches) return;

            const asistencia = idxAsistencia > -1 ? DataUtils.isTruthy(row[idxAsistencia]) : true;
            if (!asistencia) return;

            const horasVal = idxHoras > -1 ? Number(row[idxHoras]) : 0;
            const horas = isNaN(horasVal) ? 0 : horasVal;
            if (!horas) return;

            const rate = resolveRateAtDate(fecha);
            const rateNum = isNaN(rate) ? 0 : Number(rate);

            totalHoras += horas;
            totalImporte += horas * rateNum;
        });

        return { totalHoras: totalHoras, totalImporte: totalImporte };
    }

    function normalizeHeader_(h) {
        return normalize_(h).toUpperCase();
    }

    function getColIdx_(map, keys) {
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (map[k] !== undefined && map[k] !== null) return map[k];
        }
        return -1;
    }

    function normalizeClientSearch_(val) {
        if (!val) return '';
        const base = String(val).replace(/\([^)]*\)/g, '');
        return normalize_(base);
    }

    function normalizeClientNameForRates_(name) {
        if (!name) return '';
        return String(name)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\([^)]*\)/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\./g, '')
            .replace(/s\.?a\.?$/i, 'sa')
            .replace(/s\.?r\.?l\.?$/i, 'srl')
            .trim();
    }

    /**
     * Construye un resolver de tarifas para un cliente leyendo el histórico una sola vez.
     */
    function buildClientRateResolver_(clientName) {
        const fallbackRateRaw = DatabaseService.getClientHourlyRate ? DatabaseService.getClientHourlyRate(clientName) : 0;
        const fallbackRate = isNaN(fallbackRateRaw) ? 0 : Number(fallbackRateRaw);
        const ss = DatabaseService.getDbSpreadsheet ? DatabaseService.getDbSpreadsheet() : null;
        const sheet = ss ? ss.getSheetByName('CLIENTES_VHORA_DB') : null;
        if (!sheet) {
            return () => fallbackRate;
        }

        const lastRow = sheet.getLastRow();
        if (lastRow < 2) {
            return () => fallbackRate;
        }

        const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
        const targetNorm = normalizeClientNameForRates_(clientName);
        const entries = [];

        data.forEach(r => {
            const cliNorm = normalizeClientNameForRates_(r[0]);
            if (!cliNorm || !targetNorm) return;
            const matches = cliNorm === targetNorm ||
                cliNorm.indexOf(targetNorm) !== -1 ||
                targetNorm.indexOf(cliNorm) !== -1;
            if (!matches) return;

            const fecha = parseDateSafe_(r[1]);
            if (!fecha) return;
            const rate = Number(r[2]);
            if (isNaN(rate)) return;
            entries.push({ ts: fecha.getTime(), rate: rate });
        });

        if (!entries.length) {
            return () => fallbackRate;
        }

        entries.sort((a, b) => a.ts - b.ts);

        return (dateObj) => {
            const d = parseDateSafe_(dateObj);
            if (!d) return fallbackRate;
            const ts = d.getTime();
            let lo = 0;
            let hi = entries.length - 1;
            let best = null;
            while (lo <= hi) {
                const mid = Math.floor((lo + hi) / 2);
                if (entries[mid].ts <= ts) {
                    best = entries[mid].rate;
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }
            return best != null ? best : fallbackRate;
        };
    }

    function normalize_(val) {
        return String(val || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function round2_(n) {
        const num = Number(n);
        if (isNaN(num)) return 0;
        return Math.round(num * 100) / 100;
    }

    /**
     * Lee el IVA desde CONFIG_DB. Se acepta 21 o 0.21.
     * @returns {number} IVA en formato fracción (ej 0.21)
     */
    function getIvaPct_() {
        const config = DatabaseService.getConfig ? DatabaseService.getConfig() : {};
        const raw = config['IVA_PORCENTAJE'] != null ? config['IVA_PORCENTAJE'] : config['IVA'];
        if (raw == null || raw === '') return 0.21;
        const cleaned = String(raw).replace('%', '').trim();
        const n = Number(cleaned);
        if (isNaN(n)) return 0.21;
        return n > 1 ? n / 100 : n;
    }

    /**
     * Calcula IMPORTE, SUBTOTAL y TOTAL según HORAS, VALOR HORA e IVA.
     */
    function applyTotals_(record) {
        if (!record) return;
        const horasRaw = record['HORAS'];
        const valorHoraRaw = record['VALOR HORA'];
        const horas = Number(horasRaw);
        const valorHora = Number(valorHoraRaw);
        let subtotal = null;

        const hasHoras = horasRaw !== undefined && horasRaw !== null && horasRaw !== '';
        const hasValorHora = valorHoraRaw !== undefined && valorHoraRaw !== null && valorHoraRaw !== '';

        if (hasHoras && hasValorHora && !isNaN(horas) && !isNaN(valorHora)) {
            subtotal = horas * valorHora;
        } else {
            const impRaw = record['IMPORTE'];
            if (impRaw !== undefined && impRaw !== null && impRaw !== '') {
                const imp = Number(impRaw);
                if (!isNaN(imp)) subtotal = imp;
            }
        }

        if (subtotal == null) return;
        subtotal = round2_(subtotal);
        const ivaPct = getIvaPct_();
        const total = round2_(subtotal * (1 + ivaPct));

        record['IMPORTE'] = subtotal;
        record['SUBTOTAL'] = subtotal;
        record['TOTAL'] = total;
    }

    function sameDate_(a, b) {
        if (!a || !b) return false;
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    }

    /**
     * Construye etiqueta de período.
     * - Si cubre el mes completo: yyyy-MM
     * - Si no: yyyy-MM-dd a yyyy-MM-dd
     */
    function buildPeriodoLabel_(start, end) {
        if (!start || !end) return '';
        const tz = Session.getScriptTimeZone();
        const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
        if (sameMonth) {
            const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
            const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            if (sameDate_(start, firstDay) && sameDate_(end, lastDay)) {
                return Utilities.formatDate(start, tz, 'yyyy-MM');
            }
        }
        const s = Utilities.formatDate(start, tz, 'yyyy-MM-dd');
        const e = Utilities.formatDate(end, tz, 'yyyy-MM-dd');
        return s === e ? s : (s + ' a ' + e);
    }

    function existsInvoiceForPeriod_(clienteData, periodoLabel) {
        const sheet = DatabaseService.getDbSheetForFormat(FORMAT_ID);
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return false;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').toUpperCase());
        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxCliente = headers.indexOf('RAZÓN SOCIAL');
        const idxPeriodo = headers.indexOf('PERIODO');

        if (idxPeriodo === -1) return false;

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        const targetId = clienteData.id ? String(clienteData.id) : '';
        const targetNorm = normalize_(clienteData.razonSocial || '');

        return data.some(row => {
            const periodoRow = row[idxPeriodo];
            if (periodoRow !== periodoLabel) return false;

            if (targetId && idxIdCliente > -1 && String(row[idxIdCliente]) === targetId) return true;

            if (idxCliente > -1) {
                const cliNorm = normalize_(row[idxCliente]);
                if (cliNorm === targetNorm) return true;
            }
            return false;
        });
    }

    /**
     * Elimina (o anula) una factura
     * En este caso usamos borrar físico, pero podría ser cambio de estado
     */
    function deleteInvoice(id) {
        const sheet = DatabaseService.getDbSheetForFormat(FORMAT_ID);
        const rowNumber = DatabaseService.findRowById(sheet, id);
        if (!rowNumber) {
            throw new Error('Registro con ID ' + id + ' no encontrado');
        }

        const lastCol = sheet.getLastColumn();
        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const idxEstado = headers.indexOf('ESTADO');
        if (idxEstado === -1) {
            // fallback a borrado físico si no hay estado
            return RecordController.deleteRecord(FORMAT_ID, id);
        }

        sheet.getRange(rowNumber, idxEstado + 1).setValue('Anulada');
        return true;
    }

    function generateInvoicePdf(id) {
        const inv = getInvoiceById(id);
        if (!inv) {
            throw new Error('Factura no encontrada');
        }

        // Determinar rango de fechas para detalle de asistencia
        let startStr = '';
        let endStr = '';
        if (inv['PERIODO']) {
            const p = String(inv['PERIODO']);
            if (/^\d{4}-\d{2}$/.test(p)) {
                const y = Number(p.slice(0, 4));
                const m = Number(p.slice(5, 7)) - 1;
                const start = new Date(y, m, 1);
                const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
                startStr = Utilities.formatDate(start, Session.getScriptTimeZone(), 'yyyy-MM-dd');
                endStr = Utilities.formatDate(end, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            } else {
                startStr = p;
                endStr = p;
            }
        } else if (inv['FECHA']) {
            startStr = inv['FECHA'];
            endStr = inv['FECHA'];
        }
        const clientName = inv['RAZÓN SOCIAL'] || '';
        let asistencia = [];
        try {
            const horas = HoursController.getHoursByClient(startStr, endStr, clientName);
            asistencia = (horas && horas.rows) ? horas.rows : [];
        } catch (e) {
            asistencia = [];
        }

        const ivaPct = getIvaPct_();
        const ivaLabel = (ivaPct * 100).toFixed(2).replace(/\.00$/, '') + '%';

        const style = `
            <style>
                body { font-family: 'Inter', sans-serif; color: #0f172a; padding: 32px; }
                h1 { margin: 0 0 8px 0; font-size: 20px; }
                .meta { color: #475569; margin-bottom: 24px; }
                .meta div { margin-bottom: 4px; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
                th { background: #f8fafc; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
                .total { font-size: 18px; font-weight: 700; text-align: right; padding-top: 16px; }
                .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #e0e7ff; color: #4338ca; font-size: 12px; }
            </style>
        `;

        const asistenciaRows = asistencia.map(r => `
            <tr>
                <td>${r.fecha || ''}</td>
                <td>${r.empleado || ''}</td>
                <td>${r.horas || ''}</td>
                <td>${r.observaciones || ''}</td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html><head>${style}</head>
            <body>
                <h1>Factura ${inv['NUMERO'] || ''}</h1>
                <div class="meta">
                    <div><strong>Cliente:</strong> ${inv['RAZÓN SOCIAL'] || '-'}</div>
                    <div><strong>CUIT:</strong> ${inv['CUIT'] || '-'}</div>
                    <div><strong>Fecha:</strong> ${inv['FECHA'] || '-'}</div>
                    <div><strong>Periodo:</strong> ${inv['PERIODO'] || '-'}</div>
                    <div><strong>Comprobante:</strong> ${inv['COMPROBANTE'] || '-'}</div>
                    <div><strong>IVA:</strong> ${ivaLabel}</div>
                    <div><strong>Estado:</strong> <span class="badge">${inv['ESTADO'] || '-'}</span></div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th>Horas</th>
                            <th>Valor Hora</th>
                            <th>Importe</th>
                            <th>Subtotal</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${inv['CONCEPTO'] || 'Servicios profesionales'}</td>
                            <td>${inv['HORAS'] || '-'}</td>
                            <td>${inv['VALOR HORA'] || '-'}</td>
                            <td>${inv['IMPORTE'] || '-'}</td>
                            <td>${inv['SUBTOTAL'] || '-'}</td>
                            <td>${inv['TOTAL'] || '-'}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="total">Total: $ ${inv['TOTAL'] || '0'}</div>
                <div style="margin-top:20px; color:#64748b;">Observaciones: ${inv['OBSERVACIONES'] || 'N/A'}</div>
                <h3 style="margin-top:32px;">Detalle de asistencia</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Empleado</th>
                            <th>Horas</th>
                            <th>Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${asistenciaRows || '<tr><td colspan="4">Sin registros</td></tr>'}
                    </tbody>
                </table>
            </body></html>
        `;

        const output = HtmlService.createHtmlOutput(html).setTitle('Factura');
        const pdfBlob = output.getAs('application/pdf');
        const base64 = Utilities.base64Encode(pdfBlob.getBytes());
        const filename = `factura_${inv['NUMERO'] || inv['ID'] || ''}.pdf`;
        return { filename: filename, base64: base64 };
    }

    // Helper para parsear fechas
    function parseDate(val) {
        if (!val) return null;
        if (val instanceof Date) return val;
        return new Date(val);
    }

    return {
        getInvoices: getInvoices,
        getInvoiceById: getInvoiceById,
        createInvoice: createInvoice,
        createInvoiceFromAttendance: createInvoiceFromAttendance,
        updateInvoice: updateInvoice,
        deleteInvoice: deleteInvoice,
        generateInvoicePdf: generateInvoicePdf
    };

})();
