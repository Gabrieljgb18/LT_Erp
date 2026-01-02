/**
 * Cuenta corriente de empleados (debe/haber mensual)
 */
var AccountStatementPanel = (function () {
    const containerId = 'account-statement-panel';
    const defaultPaymentMethods = ["Uala", "Mercado Pago", "Efectivo", "Santander"];

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card shadow-sm mb-3">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-journal-text me-2"></i>Cuenta Corriente Empleados</h6>
                    </div>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold mb-1">Mes</label>
                            <input type="month" id="acc-month" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-4 d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1" id="acc-refresh" title="Actualizar">
                                <i class="bi bi-arrow-repeat"></i>
                            </button>
                            <button class="btn btn-success btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="acc-new-payment">
                                <i class="bi bi-cash-coin"></i> Registrar pago
                            </button>
                        </div>
                    </div>

                    <div id="acc-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Cargando...</p>
                    </div>
                    <div id="acc-empty" class="text-center text-muted py-4 d-none">
                        <i class="bi bi-wallet2" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Sin movimientos para el mes seleccionado.</p>
                    </div>
                    <div class="table-responsive border rounded d-none" id="acc-table-wrapper">
                        <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                            <thead class="bg-light">
                                <tr>
                                    <th class="ps-3 py-2 text-muted font-weight-normal">Empleado</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Debe (neto)</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Haber (pagos+adelantos)</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Saldo</th>
                                </tr>
                            </thead>
                            <tbody id="acc-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const monthInput = document.getElementById('acc-month');
        if (monthInput) {
            const now = new Date();
            const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            monthInput.value = ym;
        }

        const refreshBtn = document.getElementById('acc-refresh');
        if (refreshBtn) refreshBtn.addEventListener('click', loadData);
        const newPayBtn = document.getElementById('acc-new-payment');
        if (newPayBtn) newPayBtn.addEventListener('click', openPaymentModal);
        loadData();
    }

    function loadData() {
        const monthInput = document.getElementById('acc-month');
        const val = monthInput ? monthInput.value : '';
        if (!val) return;
        const [y, m] = val.split('-');

        toggleLoading(true);
        ApiService.call('getEmployeeAccountStatement', Number(y), Number(m))
            .then(renderTable)
            .catch(err => {
                console.error(err);
                Alerts && Alerts.showAlert('Error cuenta corriente: ' + err.message, 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function renderTable(rows) {
        const tbody = document.getElementById('acc-tbody');
        const wrapper = document.getElementById('acc-table-wrapper');
        const empty = document.getElementById('acc-empty');
        if (!tbody || !wrapper || !empty) return;

        tbody.innerHTML = '';
        if (!rows || !rows.length) {
            wrapper.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        rows.forEach(r => {
            const tr = document.createElement('tr');
            const saldoClass = Number(r.saldo) >= 0 ? 'text-success' : 'text-danger';
            tr.innerHTML = `
                <td>${r.empleado}</td>
                <td class="text-center">${formatCurrency(r.debe)}</td>
                <td class="text-center">${formatCurrency(r.haber)}</td>
                <td class="text-center fw-bold ${saldoClass}">${formatCurrency(r.saldo)}</td>
            `;
            tbody.appendChild(tr);
        });

        wrapper.classList.remove('d-none');
        empty.classList.add('d-none');
    }

    function openPaymentModal() {
        const existing = document.getElementById('acc-payment-modal');
        if (existing) existing.remove();

        const modalHtml = `
            <div class="modal fade" id="acc-payment-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Registrar pago a empleado</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label small text-muted">Empleado</label>
                                <input list="acc-emp-list" id="acc-pay-emp" class="form-control" placeholder="Empleado">
                                <datalist id="acc-emp-list"></datalist>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Fecha</label>
                                <input type="date" id="acc-pay-fecha" class="form-control" value="${getToday()}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Concepto</label>
                                <input type="text" id="acc-pay-concepto" class="form-control" value="Pago mensual">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Monto</label>
                                <input type="number" step="0.01" id="acc-pay-monto" class="form-control">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Medio de pago</label>
                                <select id="acc-pay-medio" class="form-select">
                                    <option value="">Seleccionar...</option>
                                    ${buildPaymentMethodOptionsHtml_()}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Observaciones</label>
                                <textarea id="acc-pay-obs" class="form-control" rows="2"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="acc-pay-save">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHtml.trim();
        document.body.appendChild(wrapper.firstChild);

        const datalist = document.getElementById('acc-emp-list');
        if (datalist && ReferenceService && ReferenceService.get) {
            const emps = ReferenceService.get().empleados || [];
            datalist.innerHTML = '';
            emps.forEach(e => {
                const label = typeof e === 'string' ? e : (e.nombre || e.empleado || '');
                if (!label) return;
                const opt = document.createElement('option');
                opt.value = label;
                datalist.appendChild(opt);
            });
        }

        const modalEl = document.getElementById('acc-payment-modal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        const saveBtn = document.getElementById('acc-pay-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                const emp = document.getElementById('acc-pay-emp').value;
                const fecha = document.getElementById('acc-pay-fecha').value;
                const concepto = document.getElementById('acc-pay-concepto').value;
                const monto = document.getElementById('acc-pay-monto').value;
                const medioPago = document.getElementById('acc-pay-medio')?.value || '';
                const obs = document.getElementById('acc-pay-obs').value;

                if (!emp || !monto) {
                    Alerts && Alerts.showAlert('Empleado y monto son requeridos', 'warning');
                    return;
                }

                UiState && UiState.setGlobalLoading(true, 'Guardando pago...');
                ApiService.call('recordEmployeePayment', fecha, emp, concepto, monto, medioPago, obs)
                    .then(() => {
                        Alerts && Alerts.showAlert('Pago registrado', 'success');
                        modal.hide();
                        modalEl.remove();
                        loadData();
                    })
                    .catch(err => {
                        Alerts && Alerts.showAlert('Error al guardar pago: ' + err.message, 'danger');
                    })
                    .finally(() => {
                        UiState && UiState.setGlobalLoading(false);
                    });
            });
        }

        modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    }

    function toggleLoading(show) {
        const loading = document.getElementById('acc-loading');
        const empty = document.getElementById('acc-empty');
        const wrapper = document.getElementById('acc-table-wrapper');
        if (loading) loading.classList.toggle('d-none', !show);
        if (wrapper && show) wrapper.classList.add('d-none');
        if (empty && show) empty.classList.add('d-none');
    }

    function formatCurrency(v) {
        const n = Number(v);
        return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    }

    function getToday() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getPaymentMethods_() {
        if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.getOptions === "function") {
            const list = DropdownConfig.getOptions("MEDIO DE PAGO", defaultPaymentMethods);
            if (Array.isArray(list) && list.length) return list;
        }
        return defaultPaymentMethods.slice();
    }

    function buildPaymentMethodOptionsHtml_() {
        return getPaymentMethods_()
            .map((method) => {
                const safe = String(method || '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                return `<option value="${safe}">${safe}</option>`;
            })
            .join('');
    }

    return { render };
})();
