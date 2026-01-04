/**
 * Resumen mensual por cliente
 */
var ClientMonthlySummaryPanel = (function () {
    const containerId = 'client-monthly-summary-panel';
    const escapeHtml_ = (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.escapeHtml === 'function')
        ? HtmlHelpers.escapeHtml
        : function (value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card shadow-sm mb-3">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-calendar3 me-2"></i>Resumen Mensual</h6>
                    </div>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold mb-1">Mes</label>
                            <input type="month" id="cms-month" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1" id="cms-search">
                                <i class="bi bi-search"></i> Consultar
                            </button>
                        </div>
                    </div>

                    <div id="cms-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Calculando...</p>
                    </div>
                    <div id="cms-empty" class="text-center text-muted py-4 d-none">
                        <i class="bi bi-calendar-x" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Sin datos para el mes seleccionado.</p>
                    </div>
                    <div class="table-responsive lt-table-wrap d-none" id="cms-table-wrapper">
                        <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3 py-2 text-muted font-weight-normal">Cliente</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Días</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Valor hora</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Total</th>
                                    <th class="text-end py-2 pe-3 text-muted font-weight-normal">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="cms-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const monthInput = document.getElementById('cms-month');
        if (monthInput) {
            const now = new Date();
            const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            monthInput.value = ym;
        }

        const btn = document.getElementById('cms-search');
        if (btn) btn.addEventListener('click', handleSearch);
    }

    function handleSearch() {
        const monthInput = document.getElementById('cms-month');
        const val = monthInput ? monthInput.value : '';
        if (!val) {
            Alerts && Alerts.showAlert('Selecciona un mes', 'warning');
            return;
        }
        const [y, m] = val.split('-');
        toggleLoading(true);
        ApiService.call('getMonthlySummaryByClient', Number(y), Number(m))
            .then(renderTable)
            .catch(err => {
                console.error(err);
                Alerts && Alerts.showAlert('Error al calcular resumen: ' + err.message, 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function renderTable(rows) {
        const tbody = document.getElementById('cms-tbody');
        const wrapper = document.getElementById('cms-table-wrapper');
        const empty = document.getElementById('cms-empty');
        if (!tbody || !wrapper || !empty) return;

        tbody.innerHTML = '';

        if (!rows || !rows.length) {
            wrapper.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        rows.forEach(row => {
            const tr = document.createElement('tr');
            const idCliente = row.idCliente != null ? String(row.idCliente).trim() : '';
            const clienteNombre = row.cliente || '';
            const clienteFallbackLabel = buildFallbackClientLabel_(clienteNombre, idCliente);
            tr.innerHTML = `
                <td>${escapeHtml_(clienteNombre || '-')}</td>
                <td class="text-center fw-bold">${formatNumber(row.horas)}</td>
                <td class="text-center">${escapeHtml_(String(row.dias || 0))}</td>
                <td class="text-center">${escapeHtml_(formatCurrency(row.valorHora))}</td>
                <td class="text-center fw-bold text-success">${escapeHtml_(formatCurrency(row.totalFacturacion))}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary cms-view-detail" data-id-cliente="${escapeHtml_(idCliente)}" data-cliente-label="${escapeHtml_(clienteFallbackLabel)}">
                        <i class="bi bi-eye"></i> Detalle
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // detalle -> cambia a Reporte Clientes con filtros del mes
        document.querySelectorAll('.cms-view-detail').forEach(btn => {
            btn.addEventListener('click', function () {
                const idCliente = this.getAttribute('data-id-cliente') || '';
                const fallbackLabel = this.getAttribute('data-cliente-label') || '';
                const cliente = getClientLabelById_(idCliente) || fallbackLabel;
                if (!cliente) return;
                const monthInput = document.getElementById('cms-month');
                const val = monthInput ? monthInput.value : '';
                const [y, m] = val.split('-');
                const start = `${y}-${m}-01`;
                const endDate = new Date(Number(y), Number(m), 0);
                const endStr = `${y}-${m}-${String(endDate.getDate()).padStart(2, '0')}`;

                const evt = new CustomEvent('view-change', { detail: { view: 'reportes-clientes' } });
                document.dispatchEvent(evt);

                setTimeout(() => {
                    const cliInput = document.getElementById('client-report-client');
                    const startInput = document.getElementById('client-report-start');
                    const endInput = document.getElementById('client-report-end');
                    if (cliInput) cliInput.value = cliente;
                    if (startInput) startInput.value = start;
                    if (endInput) endInput.value = endStr;
                    const btnSearch = document.getElementById('client-report-search');
                    if (btnSearch) btnSearch.click();
                }, 200);
            });
        });

        wrapper.classList.remove('d-none');
        empty.classList.add('d-none');
    }

    function toggleLoading(show) {
        const loading = document.getElementById('cms-loading');
        const empty = document.getElementById('cms-empty');
        const wrapper = document.getElementById('cms-table-wrapper');
        if (loading) loading.classList.toggle('d-none', !show);
        if (wrapper && show) wrapper.classList.add('d-none');
        if (empty && show) empty.classList.add('d-none');
    }

    function formatNumber(v) {
        if (typeof Formatters !== 'undefined' && Formatters && typeof Formatters.formatNumber === 'function') {
            return Formatters.formatNumber(v, 2);
        }
        const n = Number(v);
        return isNaN(n) ? '0.00' : n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatCurrency(v) {
        if (typeof Formatters !== 'undefined' && Formatters && typeof Formatters.formatCurrency === 'function') {
            return Formatters.formatCurrency(v);
        }
        const n = Number(v);
        return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    }

    function buildFallbackClientLabel_(nombre, idCliente) {
        const name = String(nombre || '').trim();
        const id = String(idCliente || '').trim();
        if (!name && !id) return '';
        if (!id) return name;
        return name ? `${name} (ID: ${id})` : `ID: ${id}`;
    }

    function formatClientLabel_(cli) {
        if (!cli) return '';
        if (typeof cli === 'string') return cli;
        const base = (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.getClientDisplayName === 'function')
            ? HtmlHelpers.getClientDisplayName(cli)
            : (cli.nombre || cli.razonSocial || '');
        const id = cli.id != null ? String(cli.id).trim() : '';
        const docLabel = getClientDocLabel_(cli);
        const meta = [];
        if (id) meta.push(`ID: ${id}`);
        if (docLabel) meta.push(docLabel);
        const metaSuffix = meta.length ? ` (${meta.join(' | ')})` : '';
        return (base + metaSuffix).trim();
    }

    function getClientDocLabel_(cli) {
        if (!cli || typeof cli !== 'object') return '';
        const docType = (cli.docType || cli["TIPO DOCUMENTO"] || '').toString().trim();
        const rawDoc = cli.docNumber || cli["NUMERO DOCUMENTO"] || cli.cuit || '';
        if (!rawDoc) return '';
        const fallbackType = docType || (cli.cuit ? 'CUIT' : '');
        if (typeof InputUtils !== 'undefined' && InputUtils && typeof InputUtils.formatDocLabel === 'function') {
            return InputUtils.formatDocLabel(fallbackType, rawDoc);
        }
        return (fallbackType ? (fallbackType + ' ') : '') + rawDoc;
    }

    function getClientLabelById_(idCliente) {
        const idStr = String(idCliente || '').trim();
        if (!idStr || !ReferenceService || typeof ReferenceService.get !== 'function') return '';
        const refs = ReferenceService.get();
        const clientes = refs && refs.clientes ? refs.clientes : [];
        const match = clientes.find(c => c && typeof c === 'object' && String(c.id || '').trim() === idStr);
        return match ? formatClientLabel_(match) : '';
    }

    return { render };
})();
