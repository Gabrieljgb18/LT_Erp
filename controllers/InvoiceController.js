/**
 * Controlador de Facturación
 * Maneja la lógica de negocio para facturas
 */
var InvoiceController = (function () {

    const FORMAT_ID = 'FACTURACION';

    /**
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
        const searchIdClienteRaw = filters.idCliente || filters.ID_CLIENTE || null;
        const searchIdCliente = (searchIdClienteRaw != null && String(searchIdClienteRaw).trim() !== '')
            ? normalizeIdString_(searchIdClienteRaw)
            : null;
        const searchClient = filters.cliente ? normalizeClientSearch_(filters.cliente) : null;
        const searchPeriod = filters.periodo || null;
        const searchStatus = (filters.estado && filters.estado !== 'Todos') ? filters.estado : null;

        let dateFrom = parseDateSafe_(filters.fechaDesde);
        let dateTo = parseDateSafe_(filters.fechaHasta);
        if (dateTo) dateTo.setHours(23, 59, 59, 999);

        const results = [];
        const idxId = getColIdx_(colMap, ['ID']);
        const idxCliente = getColIdx_(colMap, ['RAZON SOCIAL', 'CLIENTE']);
        const idxIdCliente = getColIdx_(colMap, ['ID_CLIENTE', 'ID CLIENTE']);
        const idxPeriodo = getColIdx_(colMap, ['PERIODO']);
        const idxEstado = getColIdx_(colMap, ['ESTADO']);
        const idxFecha = getColIdx_(colMap, ['FECHA']);

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            // 1. Filter Logic (on RAW values)

            // Client (ID-first, con fallback por nombre si la fila no tiene ID_CLIENTE)
            if (searchIdCliente && idxIdCliente > -1) {
                const rowIdCliente = normalizeIdString_(row[idxIdCliente]);
                if (rowIdCliente !== searchIdCliente) {
                    // Facturas legacy pueden no tener ID_CLIENTE: si hay cliente, matchear por nombre.
                    if (!(rowIdCliente === '' && searchClient && idxCliente > -1)) continue;
                    const cliNorm = normalizeClientSearch_(row[idxCliente] || '');
                    if (cliNorm.indexOf(searchClient) === -1) continue;
                }
            } else if (searchClient && idxCliente > -1) {
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

        // Validar duplicado de periodo para el cliente antes de crear
        const clienteData = {
            id: data.ID_CLIENTE || data.id_cliente || '',
            razonSocial: data['RAZÓN SOCIAL'] || data.razonSocial || data.cliente || ''
        };
        const periodo = data.PERIODO || data.periodo || '';

        if (periodo && (clienteData.id || clienteData.razonSocial)) {
            if (existsInvoiceForPeriod_(clienteData, periodo)) {
                throw new Error('Ya existe una factura para este cliente en el período ' + periodo);
            }
        }

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
    function createInvoiceFromAttendance(cliente, fechaDesdeStr, fechaHastaStr, extra, idCliente) {
        // Soportar payloads legacy (string) y nuevos (objeto con idCliente)
        if (cliente && typeof cliente === 'object') {
            idCliente = cliente.idCliente || cliente.ID_CLIENTE || idCliente;
            cliente = cliente.cliente || cliente.nombre || cliente.razonSocial || cliente.label || '';
        }
        const clienteNombre = (cliente || '').toString().trim();
        const idClienteStr = (idCliente != null) ? String(idCliente).trim() : '';
        if (!clienteNombre && !idClienteStr) {
            throw new Error('Falta el cliente para generar la factura.');
        }

        const start = parseDateSafe_(fechaDesdeStr);
        const end = parseDateSafe_(fechaHastaStr);
        if (!start || !end) {
            throw new Error('Fechas inválidas para generar factura.');
        }
        // Cerrar end al final del día
        end.setHours(23, 59, 59, 999);

        const clienteData = resolveClienteData_(clienteNombre, idClienteStr);
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

    function resolveClienteData_(clienteNombre, idCliente) {
        const idStr = (idCliente != null) ? String(idCliente).trim() : '';
        if (idStr && DatabaseService.findClienteById) {
            const byId = DatabaseService.findClienteById(idStr);
            if (byId) {
                return {
                    id: byId.id || idStr,
                    razonSocial: byId.razonSocial || byId.nombre || clienteNombre || '',
                    docType: byId.docType || '',
                    docNumber: byId.docNumber || '',
                    cuit: resolveCuitFromClient_(byId)
                };
            }
        }

        const ref = DatabaseService.getClientesActivos() || [];
        const normTarget = normalize_(clienteNombre);
        let found = null;
        if (normTarget) {
            ref.forEach(c => {
                const n1 = normalize_(c.nombre || '');
                const n2 = normalize_(c.razonSocial || '');
                if (n1 === normTarget || n2 === normTarget) {
                    found = c;
                }
            });
        }

        if (found) {
            return {
                id: found.id || '',
                razonSocial: found.razonSocial || found.nombre || clienteNombre,
                docType: found.docType || '',
                docNumber: found.docNumber || '',
                cuit: resolveCuitFromClient_(found)
            };
        }

        const byName = clienteNombre ? DatabaseService.findClienteByNombreORazon(clienteNombre) : null;
        return {
            id: byName && byName.id ? byName.id : idStr || '',
            razonSocial: byName && (byName.razonSocial || byName.nombre)
                ? (byName.razonSocial || byName.nombre)
                : (clienteNombre || ''),
            docType: byName && byName.docType ? byName.docType : '',
            docNumber: byName && byName.docNumber ? byName.docNumber : '',
            cuit: resolveCuitFromClient_(byName)
        };
    }

    function resolveCuitFromClient_(client) {
        if (!client) return '';
        const docType = normalizeDocType_(client.docType || client['TIPO DOCUMENTO'] || '');
        const docNumber = String(client.docNumber || client['NUMERO DOCUMENTO'] || '').trim();
        if (docNumber && (docType === 'CUIT' || docType === 'CUIL')) {
            return docNumber;
        }
        const legacy = client.cuit || client.CUIT || '';
        return String(legacy || '').trim();
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
        const targetId = normalizeIdString_(clienteData.id);
        const targetNorm = normalize_(clienteData.razonSocial || '');
        const resolveRateAtDate = buildClientRateResolver_(clienteData.razonSocial || '', clienteData.id || '');

        data.forEach(row => {
            const fecha = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
            if (isNaN(fecha) || fecha < start || fecha > end) return;

            let matches = false;
            if (targetId && idxIdCliente > -1) {
                matches = normalizeIdString_(row[idxIdCliente]) === targetId;
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
    function buildClientRateResolver_(clientName, idCliente) {
        const fallbackRateRaw = DatabaseService.getClientHourlyRate
            ? DatabaseService.getClientHourlyRate(clientName, idCliente)
            : 0;
        const fallbackRate = isNaN(fallbackRateRaw) ? 0 : Number(fallbackRateRaw);

        if (DatabaseService.getClientRateHistoryEntries) {
            const entries = DatabaseService.getClientRateHistoryEntries(clientName, idCliente) || [];
            if (entries.length) {
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
        }

        if (DatabaseService.getClientRateAtDate) {
            return (dateObj) => DatabaseService.getClientRateAtDate(clientName, dateObj, idCliente);
        }
        return () => fallbackRate;
    }

    function normalize_(val) {
        return String(val || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function normalizeDocType_(val) {
        const raw = String(val || '').trim().toUpperCase();
        if (raw === 'DNI') return 'DNI';
        if (raw === 'CUIL') return 'CUIL';
        if (raw === 'CUIT') return 'CUIT';
        return '';
    }

    function normalizeIdString_(val) {
        if (val == null) return '';
        const s = String(val).trim();
        if (!s) return '';
        if (/^\d+$/.test(s)) return String(Number(s));
        return s;
    }

    function round2_(n) {
        const num = Number(n);
        if (isNaN(num)) return 0;
        return Math.round(num * 100) / 100;
    }

    function escapeHtml_(val) {
        return String(val == null ? '' : val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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

    function existsInvoiceForPeriod_(clienteData, periodoLabel, excludeId) {
        const sheet = DatabaseService.getDbSheetForFormat(FORMAT_ID);
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return false;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').toUpperCase());
        const idxId = headers.indexOf('ID');
        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxCliente = headers.indexOf('RAZÓN SOCIAL');
        const idxPeriodo = headers.indexOf('PERIODO');
        const idxEstado = headers.indexOf('ESTADO');

        if (idxPeriodo === -1) return false;

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        const targetId = clienteData.id ? String(clienteData.id) : '';
        const targetNorm = normalize_(clienteData.razonSocial || '');
        const normExcludeId = excludeId != null ? String(excludeId) : null;

        return data.some((row, i) => {
            // Excluir si es el mismo registro
            if (normExcludeId) {
                const rowId = idxId > -1 ? String(row[idxId]) : String(i + 2);
                if (rowId === normExcludeId) return false;
            }

            // Excluir si está anulada
            if (idxEstado > -1 && String(row[idxEstado] || '').toLowerCase() === 'anulada') return false;

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

        const tz = Session.getScriptTimeZone();

        function parseRangeFromPeriodo_(periodoRaw, assumeMonthWhenDayIsOne) {
            const p = String(periodoRaw || '').trim();
            if (!p) return { startStr: '', endStr: '' };

            // yyyy-MM => month range
            if (/^\d{4}-\d{2}$/.test(p)) {
                const y = Number(p.slice(0, 4));
                const m = Number(p.slice(5, 7)) - 1;
                const start = new Date(y, m, 1);
                const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
                return {
                    startStr: Utilities.formatDate(start, tz, 'yyyy-MM-dd'),
                    endStr: Utilities.formatDate(end, tz, 'yyyy-MM-dd')
                };
            }

            // yyyy-MM-dd a yyyy-MM-dd
            const m = p.match(/(\d{4}-\d{2}-\d{2})\s*a\s*(\d{4}-\d{2}-\d{2})/i);
            if (m) {
                return { startStr: m[1], endStr: m[2] };
            }

            // yyyy-MM-dd => day (o mes si parece "month picker" serializado como 1er día)
            if (/^\d{4}-\d{2}-\d{2}$/.test(p)) {
                if (assumeMonthWhenDayIsOne && p.slice(-2) === '01') {
                    const y = Number(p.slice(0, 4));
                    const m = Number(p.slice(5, 7)) - 1;
                    const start = new Date(y, m, 1);
                    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
                    return {
                        startStr: Utilities.formatDate(start, tz, 'yyyy-MM-dd'),
                        endStr: Utilities.formatDate(end, tz, 'yyyy-MM-dd')
                    };
                }
                return { startStr: p, endStr: p };
            }

            // fallback: try date parse
            const d = parseDateSafe_(p);
            if (d) {
                const ds = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
                return { startStr: ds, endStr: ds };
            }
            return { startStr: '', endStr: '' };
        }

        function parseRangeFromText_(text) {
            const s = String(text || '').trim();
            if (!s) return { startStr: '', endStr: '' };
            const m = s.match(/(\d{4}-\d{2}-\d{2}).*?(\d{4}-\d{2}-\d{2})/);
            if (m) return { startStr: m[1], endStr: m[2] };
            return { startStr: '', endStr: '' };
        }

        // Determinar rango de fechas para detalle de asistencia
        let startStr = '';
        let endStr = '';

        // 1) Prioridad: rango explícito en observaciones (ej: "Período: 2025-11-01 a 2025-11-30")
        const obsRange = parseRangeFromText_(inv['OBSERVACIONES']);
        if (obsRange.startStr && obsRange.endStr) {
            startStr = obsRange.startStr;
            endStr = obsRange.endStr;
        } else if (inv['PERIODO']) {
            // 2) PERIODO: a veces queda como fecha del 1er día (Sheets), asumimos mes
            const r = parseRangeFromPeriodo_(inv['PERIODO'], true);
            startStr = r.startStr;
            endStr = r.endStr;
        }
        if ((!startStr || !endStr) && inv['FECHA']) {
            startStr = String(inv['FECHA']);
            endStr = String(inv['FECHA']);
        }

        const clientName = inv['RAZÓN SOCIAL'] || inv['RAZON SOCIAL'] || inv['CLIENTE'] || '';
        const idCliente = inv['ID_CLIENTE'] || inv['ID CLIENTE'] || '';
        let asistencia = [];
        try {
            const horas = HoursController.getHoursByClient(startStr, endStr, clientName, idCliente);
            asistencia = (horas && horas.rows) ? horas.rows : [];
        } catch (e) {
            asistencia = [];
        }

        asistencia = (asistencia || []).filter(r => {
            const h = Number(r.horas);
            return r && r.asistencia !== false && !isNaN(h) && h > 0;
        });

        const ivaPct = getIvaPct_();
        const ivaLabel = (ivaPct * 100).toFixed(2).replace(/\.00$/, '') + '%';

        function toNum_(val) {
            if (val == null || val === '') return 0;
            const n = Number(String(val).replace(/[^0-9.,-]/g, '').replace(',', '.'));
            return isNaN(n) ? 0 : n;
        }

        function money_(val) {
            const n = toNum_(val);
            return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        const total = toNum_(inv['TOTAL']);
        const subtotal = toNum_(inv['SUBTOTAL'] || inv['IMPORTE'] || total);
        const iva = Math.max(0, total - subtotal);

        const style = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                body { 
                    font-family: 'Inter', -apple-system, sans-serif; 
                    color: #1e293b; 
                    padding: 40px; 
                    line-height: 1.5;
                    background: #fff;
                }
                .header-container { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: flex-start; 
                    margin-bottom: 40px;
                    border-bottom: 2px solid #f1f5f9;
                    padding-bottom: 20px;
                }
                .brand-box h1 { 
                    font-size: 28px; 
                    font-weight: 800; 
                    margin: 0; 
                    color: #0f172a;
                    letter-spacing: -0.02em;
                }
                .brand-box p { 
                    margin: 4px 0 0 0; 
                    color: #64748b; 
                    font-size: 13px;
                    font-weight: 500;
                }
                .invoice-info { text-align: right; }
                .invoice-info h2 { 
                    font-size: 24px; 
                    font-weight: 700; 
                    margin: 0; 
                    color: #2563eb;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .invoice-info .number { 
                    font-size: 14px; 
                    font-weight: 600; 
                    color: #475569;
                    margin-top: 4px;
                }

                .details-grid { 
                    display: grid; 
                    grid-template-columns: 1.5fr 1fr; 
                    gap: 24px; 
                    margin-bottom: 30px; 
                }
                .info-card { 
                    background: #f8fafc; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 12px; 
                    padding: 20px; 
                }
                .section-title { 
                    font-size: 11px; 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    letter-spacing: 0.1em; 
                    color: #64748b; 
                    margin-bottom: 12px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 4px;
                }
                .info-row { display: flex; margin-bottom: 8px; font-size: 13px; }
                .info-row:last-child { margin-bottom: 0; }
                .info-label { width: 80px; color: #94a3b8; font-weight: 500; }
                .info-value { flex: 1; color: #1e293b; font-weight: 600; }

                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { 
                    text-align: left; 
                    padding: 12px 16px; 
                    background: #f1f5f9; 
                    color: #475569; 
                    font-size: 11px; 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    letter-spacing: 0.05em;
                }
                td { 
                    padding: 16px; 
                    border-bottom: 1px solid #f1f5f9; 
                    font-size: 13px; 
                    color: #334155;
                }
                .text-right { text-align: right; }
                .fw-bold { font-weight: 700; }

                .totals-container { 
                    display: flex; 
                    justify-content: flex-end; 
                    margin-top: 30px; 
                }
                .totals-box { 
                    width: 280px; 
                    background: #f8fafc; 
                    border-radius: 12px; 
                    padding: 20px;
                }
                .total-row { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 8px; 
                    font-size: 13px;
                }
                .total-row.grand-total { 
                    margin-top: 12px; 
                    padding-top: 12px; 
                    border-top: 2px solid #e2e8f0;
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                }
                .observations { 
                    margin-top: 40px; 
                    padding: 16px; 
                    border-left: 4px solid #e2e8f0;
                    background: #f8fafc;
                    font-size: 12px;
                    color: #64748b;
                }
                h3 { 
                    font-size: 16px; 
                    font-weight: 700; 
                    margin: 40px 0 16px; 
                    color: #0f172a;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                h3::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }
            </style>
        `;

        const asistenciaRows = asistencia.map(r => `
            <tr>
                <td class="fw-bold">${escapeHtml_(r.fecha || '')}</td>
                <td>${escapeHtml_(r.empleado || '')}</td>
                <td class="text-right fw-bold">${escapeHtml_(String(r.horas || '0'))} hs</td>
                <td style="color: #64748b; font-style: italic;">${escapeHtml_(r.observaciones || '')}</td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                ${style}
            </head>
            <body>
                <div class="header-container">
                    <div class="brand-box">
                        <h1>LT ERP</h1>
                        <p>Gestión de Servicios Profesionales</p>
                    </div>
                    <div class="invoice-info">
                        <h2>${escapeHtml_(inv['COMPROBANTE'] || 'Factura')}</h2>
                        <div class="number">Nº ${escapeHtml_(inv['NUMERO'] || inv['ID'] || '')}</div>
                        <div class="muted" style="margin-top: 4px; font-size: 11px;">Fecha emisión: ${escapeHtml_(inv['FECHA'] || '-')}</div>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="info-card">
                        <div class="section-title">Datos del Cliente</div>
                        <div class="info-row">
                            <div class="info-label">Cliente</div>
                            <div class="info-value" style="font-size: 15px;">${escapeHtml_(inv['RAZÓN SOCIAL'] || '-')}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">CUIT</div>
                            <div class="info-value">${escapeHtml_(inv['CUIT'] || '-')}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">IVA</div>
                            <div class="info-value">Responsable Inscripto (21%)</div>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="section-title">Resumen Período</div>
                        <div class="info-row">
                            <div class="info-label">Período</div>
                            <div class="info-value">${escapeHtml_(inv['PERIODO'] || '-')}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Horas</div>
                            <div class="info-value">${escapeHtml_(String(inv['HORAS'] || '0'))} hs</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Valor/H</div>
                            <div class="info-value">$ ${escapeHtml_(money_(inv['VALOR HORA'] || 0))}</div>
                        </div>
                    </div>
                </div>

                <div class="info-card" style="padding: 0; overflow: hidden;">
                    <table>
                        <thead>
                            <tr>
                                <th>Descripción de Servicios</th>
                                <th class="text-right" style="width: 150px;">Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="fw-bold">
                                    ${escapeHtml_(inv['CONCEPTO'] || 'Servicios profesionales correspondientes al período')}
                                </td>
                                <td class="text-right fw-bold" style="font-size: 15px;">
                                    $ ${escapeHtml_(money_(subtotal))}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="totals-container">
                    <div class="totals-box">
                        <div class="total-row">
                            <span style="color: #64748b;">Subtotal</span>
                            <span>$ ${escapeHtml_(money_(subtotal))}</span>
                        </div>
                        <div class="total-row">
                            <span style="color: #64748b;">IVA (21%)</span>
                            <span>$ ${escapeHtml_(money_(iva))}</span>
                        </div>
                        <div class="total-row grand-total">
                            <span>Total</span>
                            <span>$ ${escapeHtml_(money_(total))}</span>
                        </div>
                    </div>
                </div>

                <div class="observations">
                    <strong>Observaciones:</strong><br>
                    ${escapeHtml_(inv['OBSERVACIONES'] || 'Servicios liquidados según planilla de asistencia adjunta.')}
                </div>

                <h3>Detalle de días trabajados</h3>
                <div class="info-card" style="padding: 0; overflow: hidden;">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Empleado</th>
                                <th class="text-right">Horas</th>
                                <th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${asistenciaRows || '<tr><td colspan="4" style="text-align: center;">Sin registros de asistencia detallada</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;

        const output = HtmlService.createHtmlOutput(html).setTitle('Factura');
        const pdfBlob = output.getAs('application/pdf');
        const base64 = Utilities.base64Encode(pdfBlob.getBytes());
        const filename = `factura_${inv['NUMERO'] || inv['ID'] || ''}.pdf`;
        return { filename: filename, base64: base64 };
    }

    /**
     * Devuelve un control de facturación para un período (yyyy-MM):
     * - Horas con asistencia por cliente (ASISTENCIA_DB)
     * - Si existe factura emitida en el período (FACTURACION_DB)
     */
    function getInvoicingCoverage(periodStr, opts) {
        opts = opts || {};
        const period = String(periodStr || '').trim();
        if (!/^\d{4}-\d{2}$/.test(period)) {
            throw new Error('Periodo inválido. Usá formato yyyy-MM.');
        }

        const tz = Session.getScriptTimeZone();
        const y = Number(period.slice(0, 4));
        const m = Number(period.slice(5, 7)) - 1;
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
        const startStr = Utilities.formatDate(start, tz, 'yyyy-MM-dd');
        const endStr = Utilities.formatDate(end, tz, 'yyyy-MM-dd');

        const attendanceByClient = buildAttendanceByClient_(start, end);
        const invoicesByClient = buildInvoicesByClientForMonth_(period);

        const rows = [];
        attendanceByClient.forEach(group => {
            const key = group.key;
            const inv = invoicesByClient.get(key);
            rows.push({
                idCliente: group.idCliente || '',
                cliente: group.cliente || '',
                horas: round2_(group.horas || 0),
                dias: group.dias || 0,
                facturado: !!inv,
                facturas: inv ? inv.count : 0,
                facturaId: inv ? inv.lastId : '',
                facturaNumero: inv ? inv.lastNumero : '',
                facturaEstado: inv ? inv.lastEstado : '',
                facturaTotal: inv ? round2_(inv.lastTotal) : 0,
                totalFacturado: inv ? round2_(inv.totalSum) : 0
            });
        });

        // Orden: no facturado primero, luego horas desc, luego cliente asc
        rows.sort((a, b) => {
            if (a.facturado !== b.facturado) return a.facturado ? 1 : -1;
            if (Number(b.horas) !== Number(a.horas)) return Number(b.horas) - Number(a.horas);
            return String(a.cliente || '').localeCompare(String(b.cliente || ''), 'es');
        });

        return {
            period: period,
            start: startStr,
            end: endStr,
            rows: rows
        };
    }

    function buildAttendanceByClient_(start, end) {
        const tz = Session.getScriptTimeZone();
        const sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        const result = new Map();

        if (lastRow < 2 || lastCol === 0) return result;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').toUpperCase());
        const idxFecha = headers.indexOf('FECHA');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxHoras = headers.indexOf('HORAS');
        const idxAsistencia = headers.indexOf('ASISTENCIA');

        if (idxFecha === -1 || idxCliente === -1 || idxHoras === -1) return result;

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

        data.forEach(row => {
            const fecha = row[idxFecha] instanceof Date ? row[idxFecha] : parseDateSafe_(row[idxFecha]);
            if (!fecha || fecha < start || fecha > end) return;

            const asistencia = idxAsistencia > -1 ? DataUtils.isTruthy(row[idxAsistencia]) : true;
            if (!asistencia) return;

            const horasNum = Number(row[idxHoras]);
            const horas = isNaN(horasNum) ? 0 : horasNum;
            if (horas <= 0) return;

            const idCliente = idxIdCliente > -1 ? normalizeIdString_(row[idxIdCliente]) : '';
            const clienteRaw = String(row[idxCliente] || '').trim();
            const key = idCliente ? ('id:' + idCliente) : ('name:' + normalize_(clienteRaw));
            if (!key || key === 'name:') return;

            let group = result.get(key);
            if (!group) {
                let clienteLabel = clienteRaw;
                if (idCliente && DatabaseService.findClienteById) {
                    const cli = DatabaseService.findClienteById(idCliente);
                    if (cli && (cli.razonSocial || cli.nombre)) {
                        clienteLabel = cli.razonSocial || cli.nombre;
                    }
                }
                group = {
                    key: key,
                    idCliente: idCliente,
                    cliente: clienteLabel,
                    horas: 0,
                    diasSet: {}
                };
                result.set(key, group);
            }

            group.horas += horas;
            const d = Utilities.formatDate(fecha, tz, 'yyyy-MM-dd');
            group.diasSet[d] = true;
        });

        // compactar diasSet
        result.forEach(group => {
            group.dias = Object.keys(group.diasSet || {}).length;
            delete group.diasSet;
        });

        return result;
    }

    function buildInvoicesByClientForMonth_(period) {
        const sheet = DatabaseService.getDbSheetForFormat(FORMAT_ID);
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        const result = new Map();
        if (lastRow < 2 || lastCol === 0) return result;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').toUpperCase());
        const idxId = headers.indexOf('ID');
        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxCliente = headers.indexOf('RAZÓN SOCIAL') > -1 ? headers.indexOf('RAZÓN SOCIAL') : headers.indexOf('RAZON SOCIAL');
        const idxPeriodo = headers.indexOf('PERIODO');
        const idxFecha = headers.indexOf('FECHA');
        const idxTotal = headers.indexOf('TOTAL');
        const idxNumero = headers.indexOf('NUMERO');
        const idxEstado = headers.indexOf('ESTADO');

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

        data.forEach(row => {
            if (!invoiceMatchesMonth_(period, idxPeriodo > -1 ? row[idxPeriodo] : null, idxFecha > -1 ? row[idxFecha] : null)) return;

            const idCliente = idxIdCliente > -1 ? normalizeIdString_(row[idxIdCliente]) : '';
            const clienteRaw = idxCliente > -1 ? String(row[idxCliente] || '').trim() : '';
            const key = idCliente ? ('id:' + idCliente) : ('name:' + normalize_(clienteRaw));
            if (!key || key === 'name:') return;

            const invId = idxId > -1 ? row[idxId] : row[0];
            const numero = idxNumero > -1 ? String(row[idxNumero] || '').trim() : '';
            const estado = idxEstado > -1 ? String(row[idxEstado] || '').trim() : '';
            if (estado && String(estado).toLowerCase() === 'anulada') return;
            const totalNum = idxTotal > -1 ? Number(row[idxTotal]) : 0;
            const total = isNaN(totalNum) ? 0 : totalNum;

            let entry = result.get(key);
            if (!entry) {
                entry = { count: 0, totalSum: 0, lastId: '', lastNumero: '', lastEstado: '', lastTotal: 0 };
                result.set(key, entry);
            }

            entry.count += 1;
            entry.totalSum += total;

            // "última" factura: preferimos la de mayor ID numérico, si se puede
            const invIdNum = Number(invId);
            const lastIdNum = Number(entry.lastId);
            const isNewer = !entry.lastId ||
                (!isNaN(invIdNum) && !isNaN(lastIdNum) ? invIdNum > lastIdNum : String(invId) > String(entry.lastId));

            if (isNewer) {
                entry.lastId = invId != null ? String(invId) : '';
                entry.lastNumero = numero;
                entry.lastEstado = estado;
                entry.lastTotal = total;
            }
        });

        return result;
    }

    function invoiceMatchesMonth_(targetPeriod, periodoRaw, fechaRaw) {
        const period = String(targetPeriod || '').trim();
        if (!period) return false;

        // PERIODO como Date (Sheets)
        if (periodoRaw instanceof Date && !isNaN(periodoRaw)) {
            const p = Utilities.formatDate(periodoRaw, Session.getScriptTimeZone(), 'yyyy-MM');
            if (p === period) return true;
        }

        const periodo = String(periodoRaw || '').trim();
        if (periodo) {
            if (/^\d{4}-\d{2}$/.test(periodo)) return periodo === period;
            if (periodo.indexOf(period) !== -1) return true; // ej: "2025-11-01 a 2025-11-30"

            const m = periodo.match(/(\d{4}-\d{2}-\d{2})\s*a\s*(\d{4}-\d{2}-\d{2})/i);
            if (m) {
                const s = parseDateSafe_(m[1]);
                const e = parseDateSafe_(m[2]);
                if (s && e) {
                    const y = Number(period.slice(0, 4));
                    const mm = Number(period.slice(5, 7)) - 1;
                    const monthStart = new Date(y, mm, 1);
                    const monthEnd = new Date(y, mm + 1, 0, 23, 59, 59, 999);
                    return e >= monthStart && s <= monthEnd;
                }
            }

            if (/^\d{4}-\d{2}-\d{2}$/.test(periodo)) {
                const p = periodo.slice(0, 7);
                if (p === period) return true;
            }
        }

        // Fallback: FECHA
        const fecha = (fechaRaw instanceof Date && !isNaN(fechaRaw)) ? fechaRaw : parseDateSafe_(fechaRaw);
        if (fecha) {
            const fp = Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'yyyy-MM');
            if (fp === period) return true;
        }

        return false;
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
        getInvoicingCoverage: getInvoicingCoverage,
        updateInvoice: updateInvoice,
        deleteInvoice: deleteInvoice,
        generateInvoicePdf: generateInvoicePdf
    };

})();
