/**
 * Panel de resumen mensual por empleado
 */
var MonthlySummaryPanel = (function () {
    const containerId = 'monthly-summary-panel';

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
                            <input type="month" id="ms-month" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1" id="ms-search">
                                <i class="bi bi-search"></i> Consultar
                            </button>
                        </div>
                    </div>

                    <div id="ms-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Calculando...</p>
                    </div>
                    <div id="ms-empty" class="text-center text-muted py-4 d-none">
                        <i class="bi bi-calendar-x" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Sin datos para el mes seleccionado.</p>
                    </div>
                    <div class="table-responsive border rounded d-none" id="ms-table-wrapper">
                        <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                            <thead class="bg-light">
                                <tr>
                                    <th class="ps-3 py-2 text-muted font-weight-normal">Empleado</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Valor Hora</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Viáticos</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Presentismo</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Adelantos</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Total</th>
                                    <th class="text-end py-2 pe-3 text-muted font-weight-normal">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="ms-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const monthInput = document.getElementById('ms-month');
        if (monthInput) {
            const now = new Date();
            const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            monthInput.value = ym;
        }

        const btn = document.getElementById('ms-search');
        if (btn) btn.addEventListener('click', handleSearch);
    }

    function handleSearch() {
        const monthInput = document.getElementById('ms-month');
        const val = monthInput ? monthInput.value : '';
        if (!val) {
            Alerts && Alerts.showAlert('Selecciona un mes', 'warning');
            return;
        }
        const [y, m] = val.split('-');

        toggleLoading(true);
        ApiService.call('getMonthlySummary', Number(y), Number(m))
            .then(renderTable)
            .catch(err => {
                console.error(err);
                Alerts && Alerts.showAlert('Error al calcular resumen: ' + err.message, 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function renderTable(rows) {
        const tbody = document.getElementById('ms-tbody');
        const wrapper = document.getElementById('ms-table-wrapper');
        const empty = document.getElementById('ms-empty');

        if (!tbody || !wrapper || !empty) return;

        tbody.innerHTML = '';

        if (!rows || !rows.length) {
            wrapper.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.empleado}</td>
                <td class="text-center fw-bold">${formatNumber(row.horas)}</td>
                <td class="text-center">${formatCurrency(row.valorHora)}</td>
                <td class="text-center">${formatCurrency(row.viaticos)}</td>
                <td class="text-center">${formatCurrency(row.presentismo)}</td>
                <td class="text-center text-danger">${formatCurrency(row.adelantos)}</td>
                <td class="text-center fw-bold text-success">${formatCurrency(row.totalNeto)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary ms-view-detail" data-emp="${row.empleado}">
                        <i class="bi bi-eye"></i> Detalle
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Acción Ver detalle: cambia a Reportes y prefiltra
        document.querySelectorAll('.ms-view-detail').forEach(btn => {
            btn.addEventListener('click', function () {
                const emp = this.getAttribute('data-emp');
                if (!emp) return;
                const monthInput = document.getElementById('ms-month');
                const val = monthInput ? monthInput.value : '';
                const [y, m] = val.split('-');
                const start = `${y}-${m}-01`;
                const end = new Date(Number(y), Number(m), 0);
                const endStr = `${y}-${m}-${String(end.getDate()).padStart(2, '0')}`;

                const event = new CustomEvent('view-change', { detail: { view: 'reportes' } });
                document.dispatchEvent(event);

                setTimeout(() => {
                    const empInput = document.getElementById('hours-filter-employee');
                    const startInput = document.getElementById('hours-filter-start');
                    const endInput = document.getElementById('hours-filter-end');
                    if (empInput) empInput.value = emp;
                    if (startInput) startInput.value = start;
                    if (endInput) endInput.value = endStr;
                    const btnSearch = document.getElementById('btn-search-hours');
                    if (btnSearch) btnSearch.click();
                }, 200);
            });
        });

        wrapper.classList.remove('d-none');
        empty.classList.add('d-none');
    }

    function toggleLoading(show) {
        const loading = document.getElementById('ms-loading');
        const empty = document.getElementById('ms-empty');
        const wrapper = document.getElementById('ms-table-wrapper');
        if (loading) loading.classList.toggle('d-none', !show);
        if (wrapper && show) wrapper.classList.add('d-none');
        if (empty && show) empty.classList.add('d-none');
    }

    function formatNumber(v) {
        const n = Number(v);
        return isNaN(n) ? '0.00' : n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatCurrency(v) {
        const n = Number(v);
        return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    }

    return { render };
})();
