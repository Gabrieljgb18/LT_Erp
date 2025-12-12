/**
 * Panel de Cuenta Corriente de Clientes
 */
var ClientAccountPanel = (function () {
    const containerId = 'client-account-panel';

    function render() {
        // Find or create container
        let container = document.getElementById(containerId);
        if (!container) {
            // If not found, try to append to client report panel if it exists, or main view
            const parent = document.getElementById('view-reportes-clientes'); // Assuming this is the view ID
            if (parent) {
                container = document.createElement('div');
                container.id = containerId;
                container.className = 'mt-4';
                parent.appendChild(container);
            } else {
                return; // Can't render
            }
        }

        container.innerHTML = `
            <div class="card shadow-sm mb-3">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-wallet2 me-2"></i>Cuenta Corriente Clientes</h6>
                    </div>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
                            <input list="client-acc-list" id="client-acc-input" class="form-control form-control-sm" placeholder="Buscar cliente...">
                            <datalist id="client-acc-list"></datalist>
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Desde</label>
                            <input type="date" id="client-acc-start" class="form-control form-control-sm">
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
                            <input type="date" id="client-acc-end" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-5 d-flex gap-2">
                            <button class="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-acc-search">
                                <i class="bi bi-search"></i> Consultar
                            </button>
                            <button class="btn btn-success btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-acc-pay">
                                <i class="bi bi-cash-coin"></i> Registrar Pago
                            </button>
                        </div>
                    </div>

                    <div id="client-acc-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Cargando movimientos...</p>
                    </div>

                    <div id="client-acc-empty" class="text-center text-muted py-4 d-none">
                        <i class="bi bi-receipt" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Seleccioná un cliente para ver su cuenta corriente.</p>
                    </div>

                    <div class="table-responsive border rounded d-none" id="client-acc-table-wrapper">
                        <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                            <thead class="bg-light">
                                <tr>
                                    <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                                    <th class="py-2 text-muted font-weight-normal">Concepto</th>
                                    <th class="text-end py-2 text-muted font-weight-normal">Debe (Factura)</th>
                                    <th class="text-end py-2 text-muted font-weight-normal">Haber (Pago)</th>
                                    <th class="text-end py-2 pe-3 text-muted font-weight-normal">Saldo</th>
                                </tr>
                            </thead>
                            <tbody id="client-acc-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        loadClients();
        setDefaultDates();
        attachEvents();
    }

    function loadClients() {
        const datalist = document.getElementById('client-acc-list');
        if (!datalist || !ReferenceService) return;

        ReferenceService.load().then(() => {
            const refs = ReferenceService.get();
            const clients = refs && refs.clientes ? refs.clientes : [];
            datalist.innerHTML = '';
            clients.forEach(c => {
                const opt = document.createElement('option');
                opt.value = typeof c === 'string' ? c : (c.razonSocial || c.nombre);
                datalist.appendChild(opt);
            });
        });
    }

    function attachEvents() {
        const searchBtn = document.getElementById('client-acc-search');
        if (searchBtn) searchBtn.addEventListener('click', handleSearch);

        const payBtn = document.getElementById('client-acc-pay');
        if (payBtn) payBtn.addEventListener('click', openPaymentModal);
    }

    function setDefaultDates() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startInput = document.getElementById('client-acc-start');
        const endInput = document.getElementById('client-acc-end');
        if (startInput) startInput.valueAsDate = firstDay;
        if (endInput) endInput.valueAsDate = lastDay;
    }

    function handleSearch() {
        const client = document.getElementById('client-acc-input').value;
        const startDate = document.getElementById('client-acc-start').value;
        const endDate = document.getElementById('client-acc-end').value;

        if (!client) {
            Alerts && Alerts.showAlert('Seleccioná un cliente', 'warning');
            return;
        }

        if (!startDate || !endDate) {
            Alerts && Alerts.showAlert('Seleccioná un rango de fechas', 'warning');
            return;
        }

        toggleLoading(true);
        ApiService.call('getClientAccountStatement', client, startDate, endDate)
            .then(renderTable)
            .catch(err => {
                console.error(err);
                Alerts && Alerts.showAlert('Error al cargar cuenta corriente: ' + err.message, 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function renderTable(data) {
        const tbody = document.getElementById('client-acc-tbody');
        const wrapper = document.getElementById('client-acc-table-wrapper');
        const empty = document.getElementById('client-acc-empty');

        if (!tbody || !wrapper || !empty) return;

        tbody.innerHTML = '';

        const rows = data && data.movimientos ? data.movimientos : [];
        const saldoInicial = data && typeof data.saldoInicial === 'number' ? data.saldoInicial : 0;

        if (rows.length === 0 && saldoInicial === 0) {
            wrapper.classList.add('d-none');
            empty.classList.remove('d-none');
            empty.innerHTML = '<i class="bi bi-info-circle" style="font-size: 1.5rem; opacity: 0.5;"></i><p class="small mt-2 mb-0">No hay movimientos registrados en este período.</p>';
            return;
        }

        // Fila de saldo inicial
        const initialRow = document.createElement('tr');
        initialRow.className = 'table-secondary fw-bold';
        initialRow.innerHTML = `
            <td class="ps-3" colspan="2">Saldo Anterior</td>
            <td class="text-end">-</td>
            <td class="text-end">-</td>
            <td class="text-end pe-3 ${saldoInicial > 0 ? 'text-danger' : (saldoInicial < 0 ? 'text-success' : 'text-muted')}">${formatCurrency(saldoInicial)}</td>
        `;
        tbody.appendChild(initialRow);

        // Movimientos del período
        rows.forEach(r => {
            const tr = document.createElement('tr');
            const saldoClass = r.saldo > 0 ? 'text-danger' : (r.saldo < 0 ? 'text-success' : 'text-muted');
            const d = new Date(r.fecha);
            const dateStr = d.toLocaleDateString('es-AR');

            tr.innerHTML = `
                <td class="ps-3">${dateStr}</td>
                <td>${r.concepto}</td>
                <td class="text-end text-danger">${r.debe > 0 ? formatCurrency(r.debe) : '-'}</td>
                <td class="text-end text-success">${r.haber > 0 ? formatCurrency(r.haber) : '-'}</td>
                <td class="text-end fw-bold pe-3 ${saldoClass}">${formatCurrency(r.saldo)}</td>
            `;
            tbody.appendChild(tr);
        });

        wrapper.classList.remove('d-none');
        empty.classList.add('d-none');
    }

    function openPaymentModal() {
        const client = document.getElementById('client-acc-input').value;
        if (!client) {
            Alerts && Alerts.showAlert('Seleccioná un cliente primero', 'warning');
            return;
        }

        const existing = document.getElementById('client-pay-modal');
        if (existing) existing.remove();

        const modalHtml = `
            <div class="modal fade" id="client-pay-modal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h6 class="modal-title fw-bold">Registrar Pago de Cliente</h6>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label small text-muted fw-bold">Cliente</label>
                                <input type="text" class="form-control" value="${client}" disabled>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted fw-bold">Fecha</label>
                                <input type="date" id="cp-fecha" class="form-control" value="${new Date().toISOString().slice(0, 10)}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted fw-bold">Monto</label>
                                <input type="number" id="cp-monto" class="form-control" step="0.01">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted fw-bold">Factura (opcional)</label>
                                <select id="cp-factura" class="form-select">
                                    <option value="">-- Sin factura --</option>
                                </select>
                                <div class="form-text">Vinculá el pago a una factura para reflejarlo en la cuenta corriente.</div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted fw-bold">Observaciones</label>
                                <textarea id="cp-obs" class="form-control" rows="2"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary btn-sm" id="cp-save">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHtml.trim();
        document.body.appendChild(wrapper.firstChild);

        const modalEl = document.getElementById('client-pay-modal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        // Cargar facturas del cliente
        ApiService.call('getClientInvoices', client)
            .then(list => {
                const select = document.getElementById('cp-factura');
                if (!select) return;
                const items = Array.isArray(list) ? list : [];
                items.forEach(inv => {
                    const opt = document.createElement('option');
                    opt.value = inv.id || '';
                    const fechaStr = inv.fecha ? new Date(inv.fecha).toLocaleDateString('es-AR') : '';
                    const labelParts = [
                        inv.numero || inv.comprobante || '',
                        inv.periodo || '',
                        fechaStr,
                        inv.total ? `Total ${formatCurrency(inv.total)}` : ''
                    ].filter(Boolean);
                    opt.textContent = labelParts.join(' - ');
                    opt.dataset.numero = inv.numero || '';
                    select.appendChild(opt);
                });
            })
            .catch(err => console.error('No se pudieron cargar facturas del cliente:', err));

        const saveBtn = document.getElementById('cp-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                const fecha = document.getElementById('cp-fecha').value;
                const monto = document.getElementById('cp-monto').value;
                const obs = document.getElementById('cp-obs').value;
                const facturaSelect = document.getElementById('cp-factura');
                const facturaId = facturaSelect ? facturaSelect.value : '';
                const facturaNumero = facturaSelect && facturaSelect.selectedOptions[0] ? (facturaSelect.selectedOptions[0].dataset.numero || '') : '';

                if (!monto) {
                    Alerts.showAlert('Ingresá un monto', 'warning');
                    return;
                }

                UiState.setGlobalLoading(true, 'Guardando pago...');
                ApiService.call('recordClientPayment', {
                    fecha: fecha,
                    cliente: client,
                    monto: monto,
                    detalle: obs,
                    idFactura: facturaId || '',
                    facturaNumero: facturaNumero
                })
                    .then(() => {
                        Alerts.showAlert('Pago registrado', 'success');
                        modal.hide();
                        modalEl.remove();
                        handleSearch(); // Refresh
                    })
                    .catch(err => {
                        Alerts.showAlert('Error: ' + err.message, 'danger');
                    })
                    .finally(() => UiState.setGlobalLoading(false));
            });
        }

        modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    }

    function toggleLoading(show) {
        const loading = document.getElementById('client-acc-loading');
        const empty = document.getElementById('client-acc-empty');
        const wrapper = document.getElementById('client-acc-table-wrapper');

        if (loading) loading.classList.toggle('d-none', !show);
        if (show) {
            if (empty) empty.classList.add('d-none');
            if (wrapper) wrapper.classList.add('d-none');
        }
    }

    function formatCurrency(v) {
        return Number(v).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    }

    return { render };
})();
