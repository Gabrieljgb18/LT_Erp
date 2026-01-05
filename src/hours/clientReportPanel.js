/**
 * Panel de reporte de horas por cliente
 */
var ClientReportPanel = (function () {
    const containerId = 'client-report-panel';
    let lastRows = [];
    const clientIdMap = new Map();
    const escapeHtml = (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.escapeHtml === 'function')
        ? HtmlHelpers.escapeHtml
        : function (value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };
    const formatClientLabel = (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.formatClientLabel === 'function')
        ? HtmlHelpers.formatClientLabel
        : function (cli) {
            if (!cli) return '';
            if (typeof cli === 'string') return cli;
            const base = (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.getClientDisplayName === 'function')
                ? HtmlHelpers.getClientDisplayName(cli)
                : (cli.nombre || cli.razonSocial || '');
            const id = cli.id != null ? String(cli.id).trim() : '';
            const docType = (cli.docType || cli["TIPO DOCUMENTO"] || '').toString().trim();
            const rawDoc = cli.docNumber || cli["NUMERO DOCUMENTO"] || cli.cuit || '';
            const docLabel = rawDoc && (typeof InputUtils !== 'undefined' && InputUtils && typeof InputUtils.formatDocLabel === 'function')
                ? InputUtils.formatDocLabel(docType || (cli.cuit ? 'CUIT' : ''), rawDoc)
                : '';
            const meta = [];
            if (id) meta.push(`ID: ${id}`);
            if (docLabel) meta.push(docLabel);
            const metaSuffix = meta.length ? ` (${meta.join(' | ')})` : '';
            return (base + metaSuffix).trim();
        };

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card shadow-sm mb-3">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-graph-up me-2"></i>Reporte de Clientes</h6>
                    </div>
                    <span class="badge text-bg-light border">Vista dedicada</span>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
                            <input list="client-report-client-list" id="client-report-client" class="form-control form-control-sm" placeholder="Buscar cliente...">
                            <datalist id="client-report-client-list"></datalist>
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Desde</label>
                            <input type="date" id="client-report-start" class="form-control form-control-sm">
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
                            <input type="date" id="client-report-end" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-4 d-flex gap-2">
                            <button class="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-report-search">
                                <i class="bi bi-search"></i> Buscar
                            </button>
                            <button class="btn btn-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-report-pdf" title="Descargar PDF">
                                <i class="bi bi-file-earmark-pdf-fill"></i> PDF
                            </button>
                        </div>
                    </div>

                    <div id="client-report-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Procesando...</p>
                    </div>

                    <div id="client-report-summary" class="row g-2 mb-3 d-none">
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light text-center">
                                <div class="card-body py-2 px-1">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Horas</div>
                                    <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-hours">0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light text-center">
                                <div class="card-body py-2 px-1">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Empleados</div>
                                    <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-emps">0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light text-center">
                                <div class="card-body py-2 px-1">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Días</div>
                                    <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-days">0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="card h-100 shadow-none border bg-light text-center">
                                <div class="card-body py-2 px-1">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Valor Hora</div>
                                    <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-rate">$0</div>
                                </div>
                            </div>
                        </div>
	                        <div class="col-12 col-md-3">
	                            <div class="lt-metric lt-metric--dark h-100 text-center">
	                                <div class="card-body py-2 px-1">
	                                    <div class="small lt-metric__k text-uppercase" style="font-size: 0.7rem;">Total a Facturar</div>
	                                    <div class="fs-5 fw-bold mb-0" id="client-summary-total">$0</div>
	                                </div>
	                            </div>
	                        </div>
                    </div>

                    <div id="client-report-aggregate" class="card shadow-none border mb-3 d-none">
                        <div class="card-header bg-light py-1 px-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="text-muted small fw-bold text-uppercase" style="font-size: 0.75rem;">Resumen por Empleado</span>
                                <span class="badge bg-white text-dark border" id="client-agg-count"></span>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive lt-table-wrap">
                                <table class="table table-sm mb-0 align-middle table-striped" style="font-size: 0.85rem;">
                                    <thead class="table-light text-muted">
                                        <tr>
                                            <th class="ps-3 border-0 font-weight-normal">Empleado</th>
                                            <th class="text-center border-0 font-weight-normal">Horas</th>
                                            <th class="text-center border-0 font-weight-normal">Días</th>
                                            <th class="text-center border-0 font-weight-normal">Registros</th>
                                        </tr>
                                    </thead>
                                    <tbody id="client-report-agg-body"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="client-report-results" class="d-none">
                        <div class="table-responsive lt-table-wrap">
                            <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                                <thead class="table-light">
                                    <tr>
                                        <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                                        <th class="py-2 text-muted font-weight-normal">Empleado</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Asist.</th>
                                        <th class="py-2 text-muted font-weight-normal">Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody id="client-report-tbody"></tbody>
                            </table>
                        </div>
                    </div>

                    <div id="client-report-empty" class="text-center text-muted py-4 d-none">
                        <i class="bi bi-search" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Utilizá los filtros para buscar registros.</p>
                    </div>
                </div>
            </div>
        `;

        lastRows = [];
        setDefaultDates();
        loadClients();
        attachEvents();
    }

    function attachEvents() {
        const searchBtn = document.getElementById('client-report-search');
        if (searchBtn) searchBtn.addEventListener('click', handleSearch);

        const pdfBtn = document.getElementById('client-report-pdf');
        if (pdfBtn) pdfBtn.addEventListener('click', handleExportPdf);

        const csvBtn = document.getElementById('client-report-csv');
        if (csvBtn) csvBtn.addEventListener('click', handleExportCsv);
    }

    function setDefaultDates() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startInput = document.getElementById('client-report-start');
        const endInput = document.getElementById('client-report-end');
        if (startInput) startInput.valueAsDate = firstDay;
        if (endInput) endInput.valueAsDate = lastDay;
    }

    function loadClients() {
        const datalist = document.getElementById('client-report-client-list');
        const input = document.getElementById('client-report-client');
        if (!datalist || !input) return;

        datalist.innerHTML = '';
        input.value = '';
        clientIdMap.clear();

        if (typeof ReferenceService === 'undefined' || !ReferenceService.load) {
            console.warn('ReferenceService no disponible');
            return;
        }

        ReferenceService.load()
            .then(() => {
                const refs = ReferenceService.get();
                populateClientList(refs && refs.clientes ? refs.clientes : []);
            })
            .catch(err => {
                console.error('Error cargando clientes:', err);
                Alerts && Alerts.showAlert('No se pudieron cargar clientes. Reintentá.', 'warning');
            });
    }

    function populateClientList(clients) {
        const datalist = document.getElementById('client-report-client-list');
        if (!datalist) return;

        datalist.innerHTML = '';
        const list = Array.isArray(clients) ? clients.slice() : [];

        list
            .map(cli => ({ raw: cli, label: formatClientLabel(cli) }))
            .filter(item => item.label)
            .sort((a, b) => a.label.localeCompare(b.label, 'es'))
            .forEach(item => {
                const raw = item.raw;
                const id = raw && typeof raw === 'object' && raw.id != null ? String(raw.id) : '';
                if (id) {
                    clientIdMap.set(item.label, id);
                }
                const opt = document.createElement('option');
                opt.value = item.label;
                datalist.appendChild(opt);
            });
    }

    function extractClientIdFromLabel_(label) {
        const match = String(label || '').match(/ID\\s*:\\s*([^|)]+)/i);
        return match ? match[1].trim() : '';
    }

    function getClientIdFromLabel(label) {
        if (!label) return '';
        return clientIdMap.get(label) || extractClientIdFromLabel_(label);
    }

    function getFilters() {
        const start = document.getElementById('client-report-start');
        const end = document.getElementById('client-report-end');
        const client = document.getElementById('client-report-client');

        return {
            start: start ? start.value : '',
            end: end ? end.value : '',
            client: client ? client.value : ''
        };
    }

    function handleSearch() {
        const filters = getFilters();
        if (!filters.client) {
            Alerts && Alerts.showAlert('Seleccioná un cliente para consultar', 'warning');
            return;
        }

        toggleLoading(true);
        const clientRaw = filters.client;
        const idCliente = getClientIdFromLabel(clientRaw);
        if (!idCliente) {
            Alerts && Alerts.showAlert('Seleccioná un cliente válido de la lista.', 'warning');
            return;
        }
        ApiService.call('getHoursByClient', filters.start, filters.end, clientRaw, idCliente)
            .then(res => {
                const rows = res && res.rows ? res.rows : [];
                const summary = res && res.summary ? res.summary : {};
                lastRows = rows;
                renderSummary(rows, summary);
                renderTable(rows);
                renderAggregate(rows);
            })
            .catch(err => {
                console.error('Error en reporte de clientes:', err);
                Alerts && Alerts.showAlert('No se pudo cargar el reporte: ' + (err.message || err), 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function handleExportPdf() {
        const filters = getFilters();
        if (!filters.client) {
            Alerts && Alerts.showAlert('Seleccioná un cliente para exportar', 'warning');
            return;
        }
        if (!lastRows || lastRows.length === 0) {
            Alerts && Alerts.showAlert('Generá primero el reporte para descargarlo.', 'info');
            return;
        }

        const btn = document.getElementById('client-report-pdf');
        const originalContent = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Descargando...';
        }

        const idCliente = getClientIdFromLabel(filters.client);
        if (!idCliente) {
            Alerts && Alerts.showAlert('Seleccioná un cliente válido de la lista.', 'warning');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
            return;
        }

        UiState && UiState.setGlobalLoading(true, 'Generando PDF...');
        ApiService.call('generateClientHoursPdf', filters.start, filters.end, '', idCliente)
            .then(res => {
                if (!res || !res.base64) throw new Error('No se pudo generar PDF');
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,' + res.base64;
                link.download = res.filename || 'reporte_cliente.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(err => {
                Alerts && Alerts.showAlert('Error generando PDF: ' + err.message, 'danger');
            })
            .finally(() => {
                UiState && UiState.setGlobalLoading(false);
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalContent;
                }
            });
    }

    function handleExportCsv() {
        if (!lastRows || lastRows.length === 0) {
            Alerts && Alerts.showAlert('Nada para exportar. Buscá primero.', 'info');
            return;
        }

        const headers = ['Fecha', 'Cliente', 'Empleado', 'Horas', 'Asistencia', 'Observaciones'];
        const rows = lastRows.map(r => [
            r.fecha || '',
            '"' + (String(r.cliente || '')).replace(/"/g, '""') + '"',
            '"' + (String(r.empleado || '')).replace(/"/g, '""') + '"',
            Number(r.horas || 0),
            r.asistencia === false ? 'No' : 'Si',
            '"' + (String(r.observaciones || '')).replace(/"/g, '""') + '"'
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'reporte_cliente_' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function renderSummary(rows, summary) {
        const box = document.getElementById('client-report-summary');
        if (!box) return;

        if (!rows || rows.length === 0) {
            box.classList.add('d-none');
            return;
        }

        const totals = {
            totalHoras: 0,
            empleados: 0,
            dias: 0,
            valorHora: 0,
            totalFacturacion: 0,
            ...(summary || {})
        };

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('client-summary-hours', formatNumber(totals.totalHoras));
        setText('client-summary-emps', formatNumber(totals.empleados, 0));
        setText('client-summary-days', formatNumber(totals.dias, 0));
        const rateEl = document.getElementById('client-summary-rate');
        const totalEl = document.getElementById('client-summary-total');
        if (rateEl) rateEl.textContent = formatCurrency(totals.valorHora);
        if (totalEl) totalEl.textContent = formatCurrency(totals.totalFacturacion);

        box.classList.remove('d-none');
    }

    function renderAggregate(rows) {
        const wrapper = document.getElementById('client-report-aggregate');
        const tbody = document.getElementById('client-report-agg-body');
        const countBadge = document.getElementById('client-agg-count');
        if (!wrapper || !tbody) return;

        tbody.innerHTML = '';

        if (!rows || rows.length === 0) {
            wrapper.classList.add('d-none');
            if (countBadge) countBadge.textContent = '';
            return;
        }

        const aggMap = new Map();
        rows.forEach(r => {
            const key = r.empleado || 'Sin empleado';
            const entry = aggMap.get(key) || { horas: 0, dias: new Set(), registros: 0 };
            const h = Number(r.horas);
            entry.horas += isNaN(h) ? 0 : h;
            if (r.fecha) entry.dias.add(r.fecha);
            entry.registros += 1;
            aggMap.set(key, entry);
        });

        const list = Array.from(aggMap.entries()).map(([empleado, info]) => ({
            empleado: empleado,
            horas: info.horas,
            dias: info.dias.size,
            registros: info.registros
        })).sort((a, b) => b.horas - a.horas);

        list.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(item.empleado)}</td>
                <td class="text-center fw-bold">${formatNumber(item.horas)}</td>
                <td class="text-center">${formatNumber(item.dias, 0)}</td>
                <td class="text-center">${formatNumber(item.registros, 0)}</td>
            `;
            tbody.appendChild(tr);
        });

        if (countBadge) countBadge.textContent = list.length + ' empleados';
        wrapper.classList.remove('d-none');
    }

    function renderTable(rows) {
        const tbody = document.getElementById('client-report-tbody');
        const results = document.getElementById('client-report-results');
        const empty = document.getElementById('client-report-empty');
        if (!tbody || !results || !empty) return;

        tbody.innerHTML = '';

        if (!rows || rows.length === 0) {
            results.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        rows.forEach(r => {
            const tr = document.createElement('tr');
            const asistenciaBadge = r.asistencia === false
                ? '<span class="badge bg-danger-subtle text-danger">No</span>'
                : '<span class="badge bg-success-subtle text-success">Sí</span>';
            tr.innerHTML = `
                <td>${r.fecha || ''}</td>
                <td>${escapeHtml(r.empleado || '')}</td>
                <td class="text-center fw-bold">${formatNumber(r.horas)}</td>
                <td class="text-center">${asistenciaBadge}</td>
                <td class="text-muted small">${escapeHtml(r.observaciones || '-')}</td>
            `;
            if (r.asistencia === false) {
                tr.classList.add('table-warning');
            }
            tbody.appendChild(tr);
        });

        results.classList.remove('d-none');
        empty.classList.add('d-none');
    }

    function toggleLoading(show) {
        const loading = document.getElementById('client-report-loading');
        const results = document.getElementById('client-report-results');
        const empty = document.getElementById('client-report-empty');

        if (loading) loading.classList.toggle('d-none', !show);
        if (show) {
            if (results) results.classList.add('d-none');
            if (empty) empty.classList.add('d-none');
        }
    }

    function formatNumber(val, decimals) {
        if (typeof Formatters !== 'undefined' && Formatters && typeof Formatters.formatNumber === 'function') {
            return Formatters.formatNumber(val, typeof decimals === 'number' ? decimals : 2);
        }
        const num = Number(val);
        if (isNaN(num)) return '0';
        const fractionDigits = typeof decimals === 'number' ? decimals : 2;
        return num.toLocaleString('es-AR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
    }

    function formatCurrency(val) {
        if (typeof Formatters !== 'undefined' && Formatters && typeof Formatters.formatCurrency === 'function') {
            return Formatters.formatCurrency(val);
        }
        const num = Number(val);
        return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    }

    return {
        render: render
    };
})();
