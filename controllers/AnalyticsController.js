/**
 * Controlador de Analisis
 */
var AnalyticsController = (function () {
    function getAnalyticsSummary(input) {
        var period = parsePeriod_(input);
        var year = period.year;
        var month = period.month;
        var range = getMonthRange_(year, month);
        var monthsBack = parseMonthsBack_(input);

        var invoiceMetrics = getInvoiceMetrics_(range.start, range.end);
        var pagosClientes = getPaymentsSummary_('PAGOS_CLIENTES', range.start, range.end);
        var pagosEmpleados = getPaymentsSummary_('PAGOS_EMP', range.start, range.end);
        var adelantos = getPaymentsSummary_('ADELANTOS', range.start, range.end);
        var gastos = getExpensesSummary_(range.start, range.end);

        var topClientes = [];
        if (typeof HoursController !== 'undefined' && HoursController && HoursController.getMonthlySummaryByClient) {
            topClientes = HoursController.getMonthlySummaryByClient(year, month).slice(0, 5);
        }

        var topEmpleados = [];
        var totalHoras = 0;
        var sueldosMes = 0;
        if (typeof HoursController !== 'undefined' && HoursController && HoursController.getMonthlySummary) {
            var monthly = HoursController.getMonthlySummary(year, month) || [];
            monthly.forEach(function (row) {
                var horas = Number(row.horas) || 0;
                totalHoras += horas;
                sueldosMes += toNumber_(row.totalNeto);
            });
            topEmpleados = monthly
                .slice()
                .sort(function (a, b) {
                    return (Number(b.horas) || 0) - (Number(a.horas) || 0);
                })
                .slice(0, 5);
        }

        var clientesActivos = 0;
        var empleadosActivos = 0;
        if (DatabaseService) {
            try {
                clientesActivos = (DatabaseService.getClientesActivos && DatabaseService.getClientesActivos().length) || 0;
            } catch (e) {
                clientesActivos = 0;
            }
            try {
                empleadosActivos = (DatabaseService.getEmpleadosActivos && DatabaseService.getEmpleadosActivos().length) || 0;
            } catch (e2) {
                empleadosActivos = 0;
            }
        }

        var impuestosMes = invoiceMetrics.ivaTotal || 0;
        var gastosMes = gastos.total || 0;
        var netoMes = (invoiceMetrics.total || 0) - sueldosMes - impuestosMes - gastosMes;

        var trend = buildTrend_(year, month, monthsBack);
        var projection = buildProjection_(trend);

        return {
            period: {
                year: year,
                month: month,
                key: period.key,
                label: period.label,
                start: range.startStr,
                end: range.endStr
            },
            kpis: {
                facturacionMes: invoiceMetrics.total,
                facturacionNeta: invoiceMetrics.subtotalTotal,
                facturacionPagada: invoiceMetrics.totalPagada,
                facturacionPendiente: invoiceMetrics.totalPendiente,
                facturasEmitidas: invoiceMetrics.count,
                facturasPagadas: invoiceMetrics.countPagadas,
                facturasPendientes: invoiceMetrics.countPendientes,
                sueldosMes: sueldosMes,
                impuestosMes: impuestosMes,
                gastosMes: gastosMes,
                netoMes: netoMes,
                pagosClientesMes: pagosClientes.total,
                pagosEmpleadosMes: pagosEmpleados.total,
                adelantosMes: adelantos.total,
                horasMes: totalHoras,
                clientesActivos: clientesActivos,
                empleadosActivos: empleadosActivos
            },
            topClientes: topClientes,
            topEmpleados: topEmpleados,
            pagosPorMedio: pagosClientes.breakdown,
            gastosPorCategoria: gastos.byCategory,
            gastosPorMedio: gastos.byMethod,
            trend: trend,
            projection: projection
        };
    }

    function parsePeriod_(input) {
        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth() + 1;
        var periodStr = '';

        if (typeof input === 'string') {
            periodStr = input;
        } else if (input && typeof input === 'object') {
            if (input.period) periodStr = String(input.period);
            if (input.year) year = Number(input.year) || year;
            if (input.month) month = Number(input.month) || month;
        }

        if (periodStr) {
            var m = String(periodStr).trim().match(/^(\d{4})-(\d{2})$/);
            if (m) {
                year = Number(m[1]);
                month = Number(m[2]);
            }
        }

        var label = formatMonthLabel_(year, month);
        var key = year + '-' + pad2_(month);

        return { year: year, month: month, label: label, key: key };
    }

    function parseMonthsBack_(input) {
        var fallback = 6;
        var raw = null;
        if (input && typeof input === 'object') {
            raw = input.monthsBack || input.months || input.range;
        }
        var num = Number(raw);
        if (isNaN(num) || num <= 0) return fallback;
        return Math.max(3, Math.min(12, Math.round(num)));
    }

    function getMonthRange_(year, month) {
        var start = new Date(year, month - 1, 1);
        var end = new Date(year, month, 0, 23, 59, 59, 999);
        var tz = Session.getScriptTimeZone();
        return {
            start: start,
            end: end,
            startStr: Utilities.formatDate(start, tz, 'yyyy-MM-dd'),
            endStr: Utilities.formatDate(end, tz, 'yyyy-MM-dd')
        };
    }

    function getInvoiceMetrics_(start, end) {
        var sheet = DatabaseService.getDbSheetForFormat('FACTURACION');
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) {
            return emptyInvoiceMetrics_();
        }

        var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        var idxFecha = headers.indexOf('FECHA');
        var idxPeriodo = headers.indexOf('PERIODO');
        var idxTotal = headers.indexOf('TOTAL');
        var idxSubtotal = headers.indexOf('SUBTOTAL');
        var idxImporte = headers.indexOf('IMPORTE');
        var idxEstado = headers.indexOf('ESTADO');
        var ivaPct = getIvaPct_();

        var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        var total = 0;
        var totalPagada = 0;
        var totalPendiente = 0;
        var count = 0;
        var countPagadas = 0;
        var subtotalTotal = 0;
        var ivaTotal = 0;

        data.forEach(function (row) {
            var rowDate = null;
            if (idxFecha > -1) rowDate = parseDate_(row[idxFecha]);
            if (!rowDate && idxPeriodo > -1) rowDate = parsePeriodDate_(row[idxPeriodo]);
            if (!rowDate || rowDate < start || rowDate > end) return;

            var totalVal = toNumber_(idxTotal > -1 ? row[idxTotal] : null);
            var subtotalVal = toNumber_(idxSubtotal > -1 ? row[idxSubtotal] : null);
            var importeVal = toNumber_(idxImporte > -1 ? row[idxImporte] : null);

            if (!totalVal) totalVal = importeVal || 0;
            if (!subtotalVal) subtotalVal = importeVal || 0;

            if (!totalVal && subtotalVal && ivaPct) {
                totalVal = subtotalVal * (1 + ivaPct);
            }
            if (!subtotalVal && totalVal && ivaPct) {
                subtotalVal = totalVal / (1 + ivaPct);
            }

            var ivaVal = Math.max(0, totalVal - subtotalVal);

            var estado = idxEstado > -1 ? normalizeText_(row[idxEstado]) : '';
            var isPagada = estado === 'PAGADA';

            total += totalVal;
            subtotalTotal += subtotalVal || (totalVal - ivaVal);
            ivaTotal += ivaVal;
            count += 1;
            if (isPagada) {
                totalPagada += totalVal;
                countPagadas += 1;
            } else {
                totalPendiente += totalVal;
            }
        });

        return {
            total: total,
            totalPagada: totalPagada,
            totalPendiente: totalPendiente,
            count: count,
            countPagadas: countPagadas,
            countPendientes: Math.max(0, count - countPagadas),
            subtotalTotal: subtotalTotal,
            ivaTotal: ivaTotal
        };
    }

    function emptyInvoiceMetrics_() {
        return {
            total: 0,
            totalPagada: 0,
            totalPendiente: 0,
            count: 0,
            countPagadas: 0,
            countPendientes: 0,
            subtotalTotal: 0,
            ivaTotal: 0
        };
    }

    function getPaymentsSummary_(format, start, end) {
        var sheet = DatabaseService.getDbSheetForFormat(format);
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) {
            return { total: 0, breakdown: [] };
        }

        var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        var idxFecha = headers.indexOf('FECHA');
        var idxMonto = headers.indexOf('MONTO');
        var idxMedio = headers.indexOf('MEDIO DE PAGO');
        if (idxFecha === -1 || idxMonto === -1) {
            return { total: 0, breakdown: [] };
        }

        var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        var total = 0;
        var breakdownMap = {};

        data.forEach(function (row) {
            var rowDate = parseDate_(row[idxFecha]);
            if (!rowDate || rowDate < start || rowDate > end) return;
            var monto = toNumber_(row[idxMonto]);
            total += monto;

            if (idxMedio > -1) {
                var medio = normalizeText_(row[idxMedio]) || 'SIN MEDIO';
                breakdownMap[medio] = (breakdownMap[medio] || 0) + monto;
            }
        });

        var breakdown = Object.keys(breakdownMap)
            .map(function (medio) {
                return { medio: medio, total: breakdownMap[medio] };
            })
            .sort(function (a, b) { return b.total - a.total; });

        return { total: total, breakdown: breakdown };
    }

    function getExpensesSummary_(start, end) {
        var sheet;
        try {
            sheet = DatabaseService.getDbSheetForFormat('GASTOS');
        } catch (e) {
            return { total: 0, byCategory: [], byMethod: [] };
        }

        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) {
            return { total: 0, byCategory: [], byMethod: [] };
        }

        var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        var idxFecha = headers.indexOf('FECHA');
        var idxMonto = headers.indexOf('MONTO');
        var idxCategoria = headers.indexOf('CATEGORIA');
        var idxMedio = headers.indexOf('MEDIO DE PAGO');
        if (idxFecha === -1 || idxMonto === -1) {
            return { total: 0, byCategory: [], byMethod: [] };
        }

        var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        var total = 0;
        var catMap = {};
        var medioMap = {};

        data.forEach(function (row) {
            var rowDate = parseDate_(row[idxFecha]);
            if (!rowDate || rowDate < start || rowDate > end) return;

            var monto = toNumber_(row[idxMonto]);
            total += monto;

            if (idxCategoria > -1) {
                var categoria = String(row[idxCategoria] || '').trim() || 'Sin categoría';
                addBucket_(catMap, categoria, monto);
            }

            if (idxMedio > -1) {
                var medio = String(row[idxMedio] || '').trim() || 'Sin medio';
                addBucket_(medioMap, medio, monto);
            }
        });

        return {
            total: total,
            byCategory: bucketsToList_(catMap),
            byMethod: bucketsToList_(medioMap)
        };
    }

    function addBucket_(map, label, amount) {
        var key = String(label || '').trim().toLowerCase();
        if (!key) key = 'sin-categoria';
        if (!map[key]) {
            map[key] = { label: label || 'Sin categoría', total: 0 };
        }
        map[key].total += amount;
    }

    function bucketsToList_(map) {
        return Object.keys(map || {})
            .map(function (key) { return map[key]; })
            .sort(function (a, b) { return b.total - a.total; });
    }

    function buildTrend_(year, month, monthsBack) {
        var items = [];
        var curYear = year;
        var curMonth = month;

        for (var i = 0; i < monthsBack; i++) {
            var metrics = getMonthlyAnalytics_(curYear, curMonth);
            items.push(metrics);

            curMonth -= 1;
            if (curMonth <= 0) {
                curMonth = 12;
                curYear -= 1;
            }
        }

        return items.reverse();
    }

    function buildProjection_(trend) {
        if (!trend || !trend.length) {
            return { meses: 0, facturacion: 0, sueldos: 0, impuestos: 0, neto: 0, horas: 0, margenPct: 0 };
        }

        var sample = trend.slice(Math.max(0, trend.length - 3));
        var count = sample.length;
        var totals = { facturacion: 0, sueldos: 0, impuestos: 0, gastos: 0, neto: 0, horas: 0 };

        sample.forEach(function (item) {
            totals.facturacion += toNumber_(item.facturacion);
            totals.sueldos += toNumber_(item.sueldos);
            totals.impuestos += toNumber_(item.impuestos);
            totals.gastos += toNumber_(item.gastos);
            totals.neto += toNumber_(item.neto);
            totals.horas += toNumber_(item.horas);
        });

        var avgFacturacion = totals.facturacion / count;
        var avgSueldos = totals.sueldos / count;
        var avgImpuestos = totals.impuestos / count;
        var avgGastos = totals.gastos / count;
        var avgNeto = totals.neto / count;
        var avgHoras = totals.horas / count;
        var margenPct = avgFacturacion ? (avgNeto / avgFacturacion) * 100 : 0;

        return {
            meses: count,
            facturacion: avgFacturacion,
            sueldos: avgSueldos,
            impuestos: avgImpuestos,
            gastos: avgGastos,
            neto: avgNeto,
            horas: avgHoras,
            margenPct: margenPct
        };
    }

    function getMonthlyAnalytics_(year, month) {
        var range = getMonthRange_(year, month);
        var invoiceMetrics = getInvoiceMetrics_(range.start, range.end);
        var gastosSummary = getExpensesSummary_(range.start, range.end);
        var gastos = gastosSummary.total || 0;

        var horas = 0;
        var sueldos = 0;
        if (typeof HoursController !== 'undefined' && HoursController && HoursController.getMonthlySummary) {
            var monthly = HoursController.getMonthlySummary(year, month) || [];
            monthly.forEach(function (row) {
                horas += Number(row.horas) || 0;
                sueldos += toNumber_(row.totalNeto);
            });
        }

        var impuestos = invoiceMetrics.ivaTotal || 0;
        var neto = (invoiceMetrics.total || 0) - sueldos - impuestos - gastos;
        var label = formatMonthShort_(year, month);
        var key = year + '-' + pad2_(month);

        return {
            year: year,
            month: month,
            key: key,
            label: label,
            facturacion: invoiceMetrics.total,
            sueldos: sueldos,
            impuestos: impuestos,
            gastos: gastos,
            neto: neto,
            horas: horas
        };
    }

    function toNumber_(val) {
        var num = Number(val);
        return isNaN(num) ? 0 : num;
    }

    function normalizeText_(val) {
        return String(val || '').trim().toUpperCase();
    }

    function parseDate_(val) {
        if (!val) return null;
        if (val instanceof Date && !isNaN(val.getTime())) return val;
        if (typeof val === 'number') {
            var numDate = new Date(val);
            return isNaN(numDate.getTime()) ? null : numDate;
        }
        var s = String(val).trim();
        if (!s) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            return new Date(s + 'T00:00:00');
        }
        if (/^\d{4}-\d{2}$/.test(s)) {
            return new Date(s + '-01T00:00:00');
        }
        var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
            return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        }
        var parsed = new Date(s);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    function getIvaPct_() {
        if (!DatabaseService || !DatabaseService.getConfig) return 0;
        var config = DatabaseService.getConfig() || {};
        var raw = config['IVA_PORCENTAJE'] != null ? config['IVA_PORCENTAJE'] : config['IVA'];
        var num = Number(raw);
        if (isNaN(num) || num <= 0) return 0;
        return num > 1 ? num / 100 : num;
    }

    function parsePeriodDate_(val) {
        if (!val) return null;
        if (val instanceof Date && !isNaN(val.getTime())) return val;
        var s = String(val).trim();
        if (!s) return null;
        var m = s.match(/^(\d{4})-(\d{2})$/);
        if (m) return new Date(Number(m[1]), Number(m[2]) - 1, 1);
        return parseDate_(s);
    }

    function formatMonthLabel_(year, month) {
        var months = [
            'enero',
            'febrero',
            'marzo',
            'abril',
            'mayo',
            'junio',
            'julio',
            'agosto',
            'septiembre',
            'octubre',
            'noviembre',
            'diciembre'
        ];
        var idx = Math.max(0, Math.min(11, Number(month) - 1));
        return months[idx] + ' de ' + year;
    }

    function formatMonthShort_(year, month) {
        var months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        var idx = Math.max(0, Math.min(11, Number(month) - 1));
        return months[idx] + ' ' + year;
    }

    function pad2_(value) {
        return String(value).padStart(2, '0');
    }

    return {
        getAnalyticsSummary: getAnalyticsSummary
    };
})();
