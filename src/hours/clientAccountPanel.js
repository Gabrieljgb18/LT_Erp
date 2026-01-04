/**
 * Panel de Cuenta Corriente de Clientes
 */
var ClientAccountPanel = (function () {
    const containerId = 'client-account-panel';
    const clientIdMap = new Map();
    let lastQuery = null;
    const defaultPaymentMethods = ["Uala", "Mercado Pago", "Efectivo", "Santander"];
    let referenceListenerBound = false;

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
                            <button class="btn btn-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-acc-pdf" title="Descargar PDF">
                                <i class="bi bi-file-earmark-pdf-fill"></i> PDF
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

                    <div id="client-acc-summary" class="row g-2 mb-2 d-none"></div>

                    <div class="table-responsive lt-table-wrap d-none" id="client-acc-table-wrapper">
                        <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                            <thead class="table-light">
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

                    <details class="mt-2 d-none" id="client-acc-debug">
                        <summary class="small text-muted">Diagnóstico</summary>
                        <pre class="small mb-0 mt-2 p-2 bg-light border rounded" id="client-acc-debug-pre" style="white-space: pre-wrap;"></pre>
                    </details>
                </div>
            </div>
        `;

        loadClients();
        setDefaultDates();
        attachEvents();
        bindReferenceListener_();
    }

    function loadClients() {
        const datalist = document.getElementById('client-acc-list');
        if (!datalist || !ReferenceService) return;

        ReferenceService.load().then(() => {
            const refs = ReferenceService.get();
            const clients = refs && refs.clientes ? refs.clientes : [];
            datalist.innerHTML = '';
            clientIdMap.clear();
            clients.forEach(c => {
                const label = formatClientLabel(c);
                const id = (c && typeof c === 'object' && c.id) ? c.id : '';
                if (label && id) {
                    clientIdMap.set(label, id);
                }
                const opt = document.createElement('option');
                opt.value = label;
                datalist.appendChild(opt);
            });
        });
    }

    function bindReferenceListener_() {
        if (referenceListenerBound || typeof document === "undefined") return;
        referenceListenerBound = true;
        document.addEventListener("reference-data:updated", function () {
            const view = document.getElementById("view-reportes-clientes");
            if (view && !view.classList.contains("d-none")) {
                loadClients();
            }
        });
    }

    function formatClientLabel(cli) {
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

    function extractClientIdFromLabel_(label) {
        const match = String(label || '').match(/ID\\s*:\\s*([^|)]+)/i);
        return match ? match[1].trim() : '';
    }

    function getClientIdFromLabel(label) {
        if (!label) return '';
        return clientIdMap.get(label) || extractClientIdFromLabel_(label);
    }

    function attachEvents() {
        const searchBtn = document.getElementById('client-acc-search');
        if (searchBtn) searchBtn.addEventListener('click', handleSearch);

        const pdfBtn = document.getElementById('client-acc-pdf');
        if (pdfBtn) pdfBtn.addEventListener('click', handleExportPdf);

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
        const clientRaw = document.getElementById('client-acc-input').value;
        const idCliente = getClientIdFromLabel(clientRaw);
        const startDate = document.getElementById('client-acc-start').value;
        const endDate = document.getElementById('client-acc-end').value;

        if (!clientRaw) {
            Alerts && Alerts.showAlert('Seleccioná un cliente', 'warning');
            return;
        }
        if (!idCliente) {
            Alerts && Alerts.showAlert('Seleccioná un cliente válido de la lista.', 'warning');
            return;
        }

        if (!startDate || !endDate) {
            Alerts && Alerts.showAlert('Seleccioná un rango de fechas', 'warning');
            return;
        }

        lastQuery = { clientRaw, idCliente, startDate, endDate };

        toggleLoading(true);
        ApiService.call('getClientAccountStatement', clientRaw, startDate, endDate, idCliente)
            .then((data) => {
                renderTable(data);
                setDebug({ query: lastQuery, response: data }, false);
                // Si viene vacío, mostrar diagnóstico mínimo (cuántas facturas encuentra el buscador)
                const rows = data && data.movimientos ? data.movimientos : [];
                const saldoInicial = data && typeof data.saldoInicial === 'number' ? data.saldoInicial : 0;
                if (rows.length === 0 && saldoInicial === 0) {
                    ApiService.call('getInvoices', { idCliente: idCliente, fechaDesde: startDate, fechaHasta: endDate })
                        .then((invs) => {
                            const count = Array.isArray(invs) ? invs.length : 0;
                            const empty = document.getElementById('client-acc-empty');
                            if (empty) {
                                empty.innerHTML = '<i class="bi bi-info-circle" style="font-size: 1.5rem; opacity: 0.5;"></i>' +
                                    '<p class="small mt-2 mb-1">No hay movimientos registrados en este período.</p>' +
                                    '<div class="small text-muted">Facturas encontradas para este cliente y rango: <strong>' + count + '</strong></div>';
                            }
                            if (count > 0) {
                                setDebug({ query: lastQuery, response: data, invoicesFound: count }, true);
                            }
                        })
                        .catch(() => { /* ignore diagnóstico */ });
                }
            })
            .catch(err => {
                console.error(err);
                Alerts && Alerts.showAlert('Error al cargar cuenta corriente: ' + err.message, 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function handleExportPdf() {
        const clientRaw = document.getElementById('client-acc-input').value;
        const idCliente = getClientIdFromLabel(clientRaw);
        const startDate = document.getElementById('client-acc-start').value;
        const endDate = document.getElementById('client-acc-end').value;

        if (!clientRaw) {
            Alerts && Alerts.showAlert('Seleccioná un cliente', 'warning');
            return;
        }
        if (!idCliente) {
            Alerts && Alerts.showAlert('Seleccioná un cliente válido de la lista.', 'warning');
            return;
        }
        if (!startDate || !endDate) {
            Alerts && Alerts.showAlert('Seleccioná un rango de fechas', 'warning');
            return;
        }

        const btn = document.getElementById('client-acc-pdf');
        const originalContent = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Descargando...';
        }

        UiState && UiState.setGlobalLoading(true, 'Generando PDF...');
        ApiService.call('generateClientAccountStatementPdf', clientRaw, startDate, endDate, idCliente)
            .then(res => {
                if (!res || !res.base64) throw new Error('No se pudo generar PDF');
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,' + res.base64;
                link.download = res.filename || 'cuenta_corriente_cliente.pdf';
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

    function renderTable(data) {
        const tbody = document.getElementById('client-acc-tbody');
        const wrapper = document.getElementById('client-acc-table-wrapper');
        const empty = document.getElementById('client-acc-empty');
        const summaryEl = document.getElementById('client-acc-summary');

        if (!tbody || !wrapper || !empty) return;

        tbody.innerHTML = '';

        const rows = data && data.movimientos ? data.movimientos : [];
        const saldoInicial = data && typeof data.saldoInicial === 'number' ? data.saldoInicial : 0;

        if (rows.length === 0 && saldoInicial === 0) {
            wrapper.classList.add('d-none');
            if (summaryEl) summaryEl.classList.add('d-none');
            empty.classList.remove('d-none');
            empty.innerHTML = '<i class="bi bi-info-circle" style="font-size: 1.5rem; opacity: 0.5;"></i><p class="small mt-2 mb-0">No hay movimientos registrados en este período.</p>';
            return;
        }

        // Summary del período
        const totalDebe = rows.reduce((acc, r) => acc + (Number(r.debe) || 0), 0);
        const totalHaber = rows.reduce((acc, r) => acc + (Number(r.haber) || 0), 0);

        let saldoFinal = saldoInicial;
        if (rows.length > 0) {
            const lastRowSaldo = rows[rows.length - 1].saldo;
            saldoFinal = (lastRowSaldo !== undefined && lastRowSaldo !== null) ? Number(lastRowSaldo) : saldoInicial;
        }

        if (summaryEl) {
            const saldoClass = saldoFinal > 0 ? 'text-danger' : (saldoFinal < 0 ? 'text-success' : 'text-muted');
            summaryEl.innerHTML = `
                <div class="col-md-3">
                    <div class="card border-0 bg-light">
                        <div class="card-body py-2">
                            <div class="text-muted small fw-bold">Saldo anterior</div>
                            <div class="fw-bold">${formatCurrency(saldoInicial)}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 bg-light">
                        <div class="card-body py-2">
                            <div class="text-muted small fw-bold">Facturado</div>
                            <div class="fw-bold text-danger">${formatCurrency(totalDebe)}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 bg-light">
                        <div class="card-body py-2">
                            <div class="text-muted small fw-bold">Cobrado</div>
                            <div class="fw-bold text-success">${formatCurrency(totalHaber)}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 bg-light">
                        <div class="card-body py-2">
                            <div class="text-muted small fw-bold">Saldo final</div>
                            <div class="fw-bold ${saldoClass}">${formatCurrency(saldoFinal)}</div>
                        </div>
                    </div>
                </div>
            `;
            summaryEl.classList.remove('d-none');
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
            const dateStr = formatDateDisplay(r.fecha);

            tr.innerHTML = `
                <td class="ps-3">${dateStr}</td>
                <td>${escapeHtml(r.concepto)}</td>
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
        const clientRaw = document.getElementById('client-acc-input').value;
        const idCliente = getClientIdFromLabel(clientRaw);
        const clientLabel = clientRaw;
        if (!clientRaw) {
            Alerts && Alerts.showAlert('Seleccioná un cliente primero', 'warning');
            return;
        }
        if (!idCliente) {
            Alerts && Alerts.showAlert('Seleccioná un cliente válido de la lista.', 'warning');
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
                                <input type="text" class="form-control" value="${escapeHtml(clientRaw)}" disabled>
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
                                <label class="form-label small text-muted fw-bold">Medio de pago</label>
                                <select id="cp-medio" class="form-select">
                                    <option value="">Seleccionar...</option>
                                    ${buildPaymentMethodOptionsHtml_()}
                                </select>
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

        // Cargar facturas pendientes del cliente (para vincular el pago)
        ApiService.call('getClientInvoicesForPayment', '', idCliente)
            .then(list => {
                const select = document.getElementById('cp-factura');
                if (!select) return;
                const items = Array.isArray(list) ? list : [];
                const help = modalEl.querySelector('.form-text');
                if (help) {
                    help.textContent = items.length
                        ? (`Facturas pendientes encontradas: ${items.length}.`)
                        : 'No hay facturas pendientes para vincular. Podés registrar el pago sin factura.';
                }
                items.forEach(inv => {
                    const opt = document.createElement('option');
                    opt.value = inv.id || '';
                    const fechaStr = inv.fecha ? formatDateDisplay(inv.fecha) : '';
                    const pendiente = inv.saldo != null ? Number(inv.saldo) : null;
                    const pendienteStr = (pendiente != null && !isNaN(pendiente) && pendiente > 0)
                        ? `Pendiente ${formatCurrency(pendiente)}`
                        : '';
                    const labelParts = [
                        inv.comprobante || 'Factura',
                        inv.numero || 'S/N',
                        inv.periodo || '',
                        fechaStr,
                        pendienteStr
                    ].filter(Boolean);
                    opt.textContent = labelParts.join(' - ');
                    opt.dataset.numero = inv.numero || '';
                    select.appendChild(opt);
                });
            })
            .catch(err => {
                console.error('No se pudieron cargar facturas del cliente:', err);
                const help = modalEl.querySelector('.form-text');
                if (help) {
                    help.textContent = 'Error cargando facturas pendientes: ' + (err && err.message ? err.message : String(err));
                }
            });

        const saveBtn = document.getElementById('cp-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                const fecha = document.getElementById('cp-fecha').value;
                const monto = document.getElementById('cp-monto').value;
                const obs = document.getElementById('cp-obs').value;
                const medioPago = document.getElementById('cp-medio')?.value || '';
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
                    cliente: clientLabel,
                    idCliente: idCliente,
                    monto: monto,
                    detalle: obs,
                    medioPago: medioPago,
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
        if (typeof Formatters !== 'undefined' && Formatters && typeof Formatters.formatCurrency === 'function') {
            return Formatters.formatCurrency(v);
        }
        return Number(v).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    }

    function formatDateDisplay(v) {
        if (typeof Formatters !== 'undefined' && Formatters && typeof Formatters.formatDateDisplay === 'function') {
            return Formatters.formatDateDisplay(v);
        }
        if (!v) return '';
        if (typeof v === 'string') {
            // yyyy-MM-dd -> dd/MM/yyyy (sin timezone issues)
            const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) return `${m[3]}/${m[2]}/${m[1]}`;
            const d = new Date(v);
            return isNaN(d.getTime()) ? v : d.toLocaleDateString('es-AR');
        }
        if (v instanceof Date) {
            return v.toLocaleDateString('es-AR');
        }
        const d = new Date(v);
        return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-AR');
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
                const safe = escapeHtml(method);
                return `<option value="${safe}">${safe}</option>`;
            })
            .join('');
    }

    function escapeHtml(value) {
        if (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.escapeHtml === 'function') {
            return HtmlHelpers.escapeHtml(value);
        }
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function setDebug(payload, show) {
        const details = document.getElementById('client-acc-debug');
        const pre = document.getElementById('client-acc-debug-pre');
        if (!details || !pre) return;

        if (!show) {
            details.classList.add('d-none');
            details.open = false;
            return;
        }

        let text = '';
        try {
            text = JSON.stringify(payload, null, 2);
        } catch (e) {
            text = String(payload);
        }

        // limitar tamaño para no romper la UI
        if (text.length > 12000) {
            text = text.slice(0, 12000) + '\n... (truncado)';
        }

        pre.textContent = text;
        details.classList.remove('d-none');
        details.open = true;
    }

    return { render };
})();
