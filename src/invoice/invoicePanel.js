/**
 * Panel de gestión de facturas
 */
var InvoicePanel = (function () {
    const containerId = 'invoice-main-panel';
    const PAGE_SIZE = 10;
    let lastInvoices = [];
    let generatorInvoices = [];
    let generatorHours = [];
    let lastGeneratorFilters = null;
    const clientIdMap = new Map();
    let selectedInvoiceIds = new Set();
    let lastSavedInvoiceId = null;
    let ivaPct = 0.21; // fracción, default 21%
    let invoicePage = 1;
    let generatorPage = 1;

	    function render() {
	        const container = document.getElementById(containerId);
	        if (!container) return;

        container.innerHTML = `
            <div class="d-flex flex-column gap-3">
            <div class="card shadow-sm">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-receipt me-2"></i>Facturación</h6>
                    <div class="d-flex gap-2">
                        <button class="btn btn-danger btn-sm" id="invoice-download-selected" disabled>
                            <span id="invoice-download-selected-spinner" class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                            <span>Descargar PDF</span>
                        </button>
                        <button class="btn btn-primary btn-sm" id="invoice-new-btn">
                            <i class="bi bi-plus-circle me-1"></i>Nueva factura
                        </button>
                    </div>
                </div>
                <div class="card-body p-3">
                    <!-- Filtros búsqueda -->
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
                            <input list="invoice-client-list" id="invoice-filter-client" class="form-control form-control-sm" placeholder="Todos los clientes">
                            <datalist id="invoice-client-list"></datalist>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Periodo</label>
                            <input type="month" id="invoice-filter-period" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Estado</label>
                            <select id="invoice-filter-status" class="form-select form-select-sm">
                                <option value="">Todos</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Pagada">Pagada</option>
                                <option value="Anulada">Anulada</option>
                                <option value="Vencida">Vencida</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Desde</label>
                            <input type="date" id="invoice-filter-from" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
                            <input type="date" id="invoice-filter-to" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-primary btn-sm w-100" id="invoice-search-btn" title="Buscar">
                                <i class="bi bi-search"></i>
                            </button>
                        </div>
                    </div>

                    <div id="invoice-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Cargando...</p>
                    </div>

                    <div id="invoice-summary" class="row g-2 mb-3 d-none"></div>

	                    <div id="invoice-results" class="d-none">
	                        <div class="table-responsive lt-table-wrap">
	                            <table class="table table-hover table-sm align-middle mb-0">
	                                <thead class="table-light">
	                                    <tr>
	                                        <th class="ps-3 py-2 text-muted font-weight-normal">
	                                            <input type="checkbox" id="invoice-select-all">
	                                        </th>
                                        <th class="py-2 text-muted font-weight-normal">Fecha</th>
                                        <th class="py-2 text-muted font-weight-normal">Periodo</th>
                                        <th class="py-2 text-muted font-weight-normal">Número</th>
                                        <th class="py-2 text-muted font-weight-normal">Cliente</th>
                                        <th class="text-end py-2 text-muted font-weight-normal">Total</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Estado</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="invoice-tbody"></tbody>
	                            </table>
	                        </div>
	                        <div id="invoice-pagination" class="d-flex justify-content-between align-items-center py-2"></div>
	                    </div>

                    <div id="invoice-empty" class="text-center text-muted py-4">
                        <i class="bi bi-receipt" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">No hay facturas para mostrar. Usá los filtros o creá una nueva factura.</p>
                    </div>
                </div>
            </div>

            <div class="card shadow-sm">
                <div class="card-header bg-white py-2">
                    <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-plus-circle me-2"></i>Generar factura</h6>
                    <div class="small text-muted">Buscar registros de asistencia del cliente y completar datos pendientes.</div>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label small text-muted fw-bold">Cliente a facturar</label>
                            <input list="invoice-gen-client-list" id="invoice-gen-client" class="form-control form-control-sm" placeholder="Seleccionar cliente">
                            <datalist id="invoice-gen-client-list"></datalist>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold">Desde</label>
                            <input type="date" id="invoice-gen-desde" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold">Hasta</label>
                            <input type="date" id="invoice-gen-hasta" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2 d-grid">
	                            <button class="btn btn-outline-secondary btn-sm" id="invoice-gen-search">
	                                <i class="bi bi-search me-1"></i>Buscar
	                            </button>
	                        </div>
	                    </div>
	                    <div class="row g-2 align-items-center">
	                        <div class="col-md-6 d-grid">
	                            <button class="btn btn-primary btn-sm" id="invoice-gen-open-modal">
	                                <i class="bi bi-check2-circle me-1"></i>Completar y guardar
	                            </button>
	                        </div>
	                        <div class="col-md-6 d-grid">
	                            <button class="btn btn-danger btn-sm" id="invoice-download-last-btn" disabled>
	                                <i class="bi bi-file-earmark-pdf-fill me-1"></i>PDF
	                            </button>
	                        </div>
	                    </div>

                    <div id="invoice-gen-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Buscando asistencia del cliente...</p>
                    </div>

	                    <div id="invoice-gen-results" class="d-none mt-3">
	                        <div class="table-responsive lt-table-wrap">
	                            <table class="table table-hover table-sm align-middle mb-0">
	                                <thead class="table-light">
	                                    <tr>
	                                        <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
	                                        <th class="py-2 text-muted font-weight-normal">Empleado</th>
	                                        <th class="py-2 text-muted font-weight-normal">Horas</th>
                                        <th class="py-2 text-muted font-weight-normal">Observaciones</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Acciones</th>
                                    </tr>
                                </thead>
	                                <tbody id="invoice-gen-tbody"></tbody>
	                            </table>
	                        </div>
	                        <div id="invoice-gen-pagination" class="d-flex justify-content-between align-items-center py-2"></div>
	                    </div>

                    <div id="invoice-gen-empty" class="text-center text-muted py-3">
                        <i class="bi bi-calendar4-week" style="font-size: 1.2rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">No hay registros de asistencia de este cliente en el rango indicado.</p>
                    </div>
                </div>
            </div>
            </div>

            <!-- Modal de factura -->
            <div class="modal fade" id="invoice-modal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="invoice-modal-title">Nueva Factura</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="invoice-form">
                                <input type="hidden" id="invoice-id">
                                <input type="hidden" id="invoice-id-cliente">
                                
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <label class="form-label">Fecha <span class="text-danger">*</span></label>
                                        <input type="date" class="form-control" id="invoice-fecha" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Periodo</label>
                                        <input type="month" class="form-control" id="invoice-periodo">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Estado</label>
                                        <select class="form-select" id="invoice-estado">
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="Pagada">Pagada</option>
                                            <option value="Anulada">Anulada</option>
                                            <option value="Vencida">Vencida</option>
                                        </select>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <label class="form-label">Comprobante</label>
                                        <select class="form-select" id="invoice-comprobante">
                                            <option value="Factura A">Factura A</option>
                                            <option value="Factura B" selected>Factura B</option>
                                            <option value="Factura C">Factura C</option>
                                            <option value="Nota de Crédito">Nota de Crédito</option>
                                            <option value="Nota de Débito">Nota de Débito</option>
                                            <option value="Recibo">Recibo</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Número</label>
                                        <input type="text" class="form-control" id="invoice-numero" placeholder="0001-00000001">
                                    </div>
                                    
                                    <div class="col-md-8">
                                        <label class="form-label">Razón Social <span class="text-danger">*</span></label>
                                        <input list="invoice-modal-client-list" class="form-control" id="invoice-razon-social" required>
                                        <datalist id="invoice-modal-client-list"></datalist>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">CUIT</label>
                                        <input type="text" class="form-control" id="invoice-cuit">
                                    </div>
                                    
                                    <div class="col-12">
                                        <label class="form-label">Concepto</label>
                                        <textarea class="form-control" id="invoice-concepto" rows="2" placeholder="Descripción del servicio facturado"></textarea>
                                    </div>
                                    
                                    <div class="col-md-4">
                                        <label class="form-label">Horas</label>
                                        <input type="number" class="form-control" id="invoice-horas" step="0.5" min="0">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Valor Hora</label>
                                        <input type="number" class="form-control" id="invoice-valor-hora" step="0.01" min="0">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Importe</label>
                                        <input type="number" class="form-control" id="invoice-importe" step="0.01" min="0">
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <label class="form-label">Subtotal</label>
                                        <input type="number" class="form-control" id="invoice-subtotal" step="0.01" min="0">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Total <span class="text-danger">*</span></label>
                                        <input type="number" class="form-control" id="invoice-total" step="0.01" min="0" required>
                                    </div>
                                    
                                    <div class="col-12">
                                        <label class="form-label">Observaciones</label>
                                        <textarea class="form-control" id="invoice-observaciones" rows="2"></textarea>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="invoice-save-btn">
                                <i class="bi bi-save me-1"></i>Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal de factura desde asistencia -->
            <div class="modal fade" id="invoice-att-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Factura desde asistencia</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Cliente <span class="text-danger">*</span></label>
                                <input list="invoice-client-list" id="invoice-att-cliente" class="form-control" placeholder="Seleccionar cliente">
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Desde</label>
                                    <input type="date" id="invoice-att-desde" class="form-control">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Hasta</label>
                                    <input type="date" id="invoice-att-hasta" class="form-control">
                                </div>
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Comprobante</label>
                                    <select class="form-select" id="invoice-att-comp">
                                        <option value="Factura B" selected>Factura B</option>
                                        <option value="Factura A">Factura A</option>
                                        <option value="Factura C">Factura C</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Número</label>
                                    <input type="text" id="invoice-att-numero" class="form-control" placeholder="0001-00000001">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Observaciones</label>
                                <textarea id="invoice-att-obs" class="form-control" rows="2"></textarea>
                            </div>
                            <div class="alert alert-info small mb-0">
                                Se calcularán horas con asistencia y tarifa diaria del cliente en el rango indicado. Si dejás fechas vacías, usa el mes actual.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary btn-sm" id="invoice-att-save">Generar factura</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        attachEvents();
        loadClients();
        loadIvaConfig();
    }

	    function attachEvents() {
        const newBtn = document.getElementById('invoice-new-btn');
        if (newBtn) newBtn.addEventListener('click', () => openModal());

        const genSearchBtn = document.getElementById('invoice-gen-search');
        if (genSearchBtn) genSearchBtn.addEventListener('click', searchClientHours);
        const genOpenModalBtn = document.getElementById('invoice-gen-open-modal');
        if (genOpenModalBtn) genOpenModalBtn.addEventListener('click', openModalFromGenerator);

        const searchBtn = document.getElementById('invoice-search-btn');
        if (searchBtn) searchBtn.addEventListener('click', handleSearch);

        const saveBtn = document.getElementById('invoice-save-btn');
        if (saveBtn) saveBtn.addEventListener('click', handleSave);

	        const dlLastBtn = document.getElementById('invoice-download-last-btn');
	        if (dlLastBtn) dlLastBtn.addEventListener('click', () => {
	            if (lastSavedInvoiceId) downloadPdf(lastSavedInvoiceId);
	        });
	        const dlSelectedBtn = document.getElementById('invoice-download-selected');
	        if (dlSelectedBtn) dlSelectedBtn.addEventListener('click', downloadSelectedPdfs);
        const selectAll = document.getElementById('invoice-select-all');
        if (selectAll) selectAll.addEventListener('change', (e) => toggleSelectAll(e.target.checked));

        // Auto-calcular importes cuando cambian horas o valor hora
        const horasInput = document.getElementById('invoice-horas');
        const valorHoraInput = document.getElementById('invoice-valor-hora');
        if (horasInput) horasInput.addEventListener('input', recalculateTotals_);
        if (valorHoraInput) valorHoraInput.addEventListener('input', recalculateTotals_);

        // Auto-completar CUIT cuando se selecciona cliente
        const razonSocialInput = document.getElementById('invoice-razon-social');
        if (razonSocialInput) {
            razonSocialInput.addEventListener('change', autocompleteCUIT);
        }
    }

    function loadClients() {
        if (typeof ReferenceService === 'undefined' || !ReferenceService.load) return;

        ReferenceService.load()
            .then(() => {
                const refs = ReferenceService.get();
                const clientes = refs && refs.clientes ? refs.clientes : [];
                populateClientLists(clientes);
            })
            .catch(() => {
                // fallback si ReferenceService falla
                ApiService.call('getReferenceData')
                    .then(refs => {
                        const clientes = refs && refs.clientes ? refs.clientes : [];
                        populateClientLists(clientes);
                    })
                    .catch(err => console.error('Error cargando clientes (fallback):', err));
            })
            .catch(err => console.error('Error cargando clientes:', err));
    }

    function populateClientLists(clients) {
        const filterList = document.getElementById('invoice-client-list');
        const modalList = document.getElementById('invoice-modal-client-list');
        const generatorList = document.getElementById('invoice-gen-client-list');

        clientIdMap.clear();

        [filterList, modalList, generatorList].forEach(list => {
            if (!list) return;
            list.innerHTML = '';

            clients
                .map(cli => {
                    const label = formatClientLabel(cli);
                    if (label && cli && cli.id) {
                        clientIdMap.set(label, cli.id);
                    }
                    return label;
                })
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b, 'es'))
                .forEach(label => {
                    const opt = document.createElement('option');
                    opt.value = label;
                    list.appendChild(opt);
                });
        });
    }

    function formatClientLabel(cli) {
        if (!cli) return '';
        if (typeof cli === 'string') return cli;
        const base = cli.razonSocial || cli.nombre || '';
        const cuit = cli.cuit ? ` (${cli.cuit})` : '';
        return (base + cuit).trim();
    }

    function autocompleteCUIT() {
        const razonSocialInput = document.getElementById('invoice-razon-social');
        const cuitInput = document.getElementById('invoice-cuit');
        const idClienteInput = document.getElementById('invoice-id-cliente');

        if (!razonSocialInput || !cuitInput || !ReferenceService) return;

        const selectedClient = razonSocialInput.value;
        const refs = ReferenceService.get();
        const clientes = refs && refs.clientes ? refs.clientes : [];

        const cliente = clientes.find(c => {
            const label = formatClientLabel(c);
            return label === selectedClient ||
                (c.razonSocial && c.razonSocial === selectedClient) ||
                (c.nombre && c.nombre === selectedClient);
        });

        if (cliente) {
            if (cliente.cuit) {
                cuitInput.value = cliente.cuit;
            }
            // Guardar el ID del cliente
            if (cliente.id && idClienteInput) {
                idClienteInput.value = cliente.id;
            }
        }
    }

    function cleanClientValue(raw) {
        if (!raw) return '';
        const idx = raw.indexOf('(');
        return idx > 0 ? raw.slice(0, idx).trim() : raw.trim();
    }

    function getClientIdFromLabel(label) {
        if (!label) return '';
        return clientIdMap.get(label) || '';
    }

    function searchClientHours() {
        const clientInput = document.getElementById('invoice-gen-client');
        const clienteRaw = clientInput ? clientInput.value.trim() : '';
        const cliente = cleanClientValue(clienteRaw);
        if (!cliente) {
            Alerts && Alerts.showAlert('Elegí un cliente para buscar.', 'warning');
            return;
        }
        const desde = document.getElementById('invoice-gen-desde')?.value || '';
        const hasta = document.getElementById('invoice-gen-hasta')?.value || '';
        const idCliente = getClientIdFromLabel(clienteRaw || cliente);

        lastGeneratorFilters = { cliente, clienteLabel: clienteRaw || cliente, idCliente: idCliente, fechaDesde: desde, fechaHasta: hasta };
        fetchGeneratorHours();
    }

    function openModalFromGenerator() {
        const clientInput = document.getElementById('invoice-gen-client');
        const cliente = clientInput ? clientInput.value.trim() : '';
        if (!cliente) {
            Alerts && Alerts.showAlert('Elegí un cliente para facturar.', 'warning');
            return;
        }
        const desde = document.getElementById('invoice-gen-desde')?.value || '';
        const hasta = document.getElementById('invoice-gen-hasta')?.value || '';

        const preset = buildPresetFromHours(cliente, desde, hasta);
        openModal(preset);
    }

    function getFilters() {
        const clientRaw = document.getElementById('invoice-filter-client')?.value || '';
        const idCliente = getClientIdFromLabel(clientRaw);
        return {
            cliente: cleanClientValue(clientRaw),
            idCliente: idCliente,
            periodo: document.getElementById('invoice-filter-period')?.value || '',
            estado: document.getElementById('invoice-filter-status')?.value || '',
            fechaDesde: document.getElementById('invoice-filter-from')?.value || '',
            fechaHasta: document.getElementById('invoice-filter-to')?.value || ''
        };
    }

    function handleSearch() {
        const filters = getFilters();
        toggleLoading(true);

        selectedInvoiceIds.clear();
        ApiService.call('getInvoices', filters)
            .then(invoices => {
                lastInvoices = invoices || [];
                invoicePage = 1;
                renderSummary(lastInvoices);
                renderTable(lastInvoices);
            })
            .catch(err => {
                console.error('Error al cargar facturas:', err);
                Alerts && Alerts.showAlert('Error al cargar facturas: ' + err.message, 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function renderSummary(invoices) {
        const summaryDiv = document.getElementById('invoice-summary');
        if (!summaryDiv) return;

        summaryDiv.classList.add('d-none');
    }

	    function renderGeneratorResults(rows) {
        const tbody = document.getElementById('invoice-gen-tbody');
        const results = document.getElementById('invoice-gen-results');
        const empty = document.getElementById('invoice-gen-empty');

        if (!tbody || !results || !empty) return;

        tbody.innerHTML = '';

        if (!rows || rows.length === 0) {
            results.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        if (generatorPage > totalPages) generatorPage = totalPages;
        const start = (generatorPage - 1) * PAGE_SIZE;
        const pageItems = rows.slice(start, start + PAGE_SIZE);

	        pageItems.forEach(item => {
	            const tr = document.createElement('tr');
	            tr.innerHTML = `
	                <td class="ps-3">${item.fecha || '-'}</td>
	                <td>${item.empleado || '-'}</td>
	                <td>${item.horas || 0}</td>
	                <td>${item.observaciones || ''}</td>
	                <td class="text-center">
	                    <button class="btn btn-sm btn-outline-primary lt-btn-icon me-1" onclick="InvoicePanel.editAttendance(${item.id})" title="Editar">
	                        <i class="bi bi-pencil-fill"></i>
	                    </button>
	                    <button class="btn btn-sm btn-outline-danger lt-btn-icon" onclick="InvoicePanel.deleteAttendance(${item.id})" title="Eliminar">
	                        <i class="bi bi-trash"></i>
	                    </button>
	                </td>
	            `;
	            tbody.appendChild(tr);
	        });

        results.classList.remove('d-none');
        empty.classList.add('d-none');
        updateSelectionUi();
        renderGeneratorPagination(totalPages);
    }

	    function renderTable(invoices) {
        const tbody = document.getElementById('invoice-tbody');
        const results = document.getElementById('invoice-results');
        const empty = document.getElementById('invoice-empty');

        if (!tbody || !results || !empty) return;

        tbody.innerHTML = '';

        if (!invoices || invoices.length === 0) {
            results.classList.add('d-none');
            empty.classList.remove('d-none');
            renderInvoicePagination(0);
            return;
        }

        const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
        if (invoicePage > totalPages) invoicePage = totalPages;
        const start = (invoicePage - 1) * PAGE_SIZE;
        const pageItems = invoices.slice(start, start + PAGE_SIZE);

        pageItems.forEach(inv => {
            const periodLabel = formatPeriod(inv['PERIODO']);
            const tr = document.createElement('tr');
            const estado = inv['ESTADO'] || 'Pendiente';
            const estadoBadge = getEstadoBadge(estado);

	            tr.innerHTML = `
                <td class="ps-3">
                    <input type="checkbox" class="invoice-select" data-id="${inv.ID}" ${selectedInvoiceIds.has(String(inv.ID)) ? 'checked' : ''} onclick="InvoicePanel.toggleInvoiceSelection('${inv.ID}', this.checked)">
                </td>
                <td class="ps-3">${inv['FECHA'] || '-'}</td>
                <td>${periodLabel || '-'}</td>
                <td><span class="badge bg-light text-dark border">${inv['NUMERO'] || 'S/N'}</span></td>
                <td>${inv['RAZÓN SOCIAL'] || '-'}</td>
                <td class="text-end fw-bold">${formatCurrency(inv['TOTAL'])}</td>
	                <td class="text-center">${estadoBadge}</td>
	                <td class="text-center">
	                    <button class="btn btn-sm btn-outline-primary lt-btn-icon me-1" onclick="InvoicePanel.editInvoice('${inv.ID}')" title="Editar">
	                        <i class="bi bi-pencil-fill"></i>
	                    </button>
	                    <button class="btn btn-sm btn-outline-danger lt-btn-icon" onclick="InvoicePanel.deleteInvoice('${inv.ID}')" title="Anular">
	                        <i class="bi bi-x-circle-fill"></i>
	                    </button>
	                </td>
	            `;

            tbody.appendChild(tr);
        });

        results.classList.remove('d-none');
        empty.classList.add('d-none');
        renderInvoicePagination(totalPages);
    }

    function getEstadoBadge(estado) {
        const badges = {
            'Pendiente': '<span class="badge bg-warning">Pendiente</span>',
            'Pagada': '<span class="badge bg-success">Pagada</span>',
            'Anulada': '<span class="badge bg-danger">Anulada</span>',
            'Vencida': '<span class="badge bg-dark">Vencida</span>'
        };
        return badges[estado] || '<span class="badge bg-secondary">' + estado + '</span>';
    }

    function renderInvoicePagination(totalPages) {
        const container = document.getElementById('invoice-pagination');
        if (!container) return;
        container.innerHTML = '';
        if (totalPages <= 1) return;

        const info = document.createElement('div');
        info.className = 'small text-muted';
        info.textContent = `Página ${invoicePage} de ${totalPages}`;

        const controls = document.createElement('div');
        controls.className = 'btn-group btn-group-sm';

        const prev = document.createElement('button');
        prev.className = 'btn btn-outline-secondary';
        prev.textContent = '‹';
        prev.disabled = invoicePage <= 1;
        prev.onclick = () => setInvoicePage(invoicePage - 1);

        const next = document.createElement('button');
        next.className = 'btn btn-outline-secondary';
        next.textContent = '›';
        next.disabled = invoicePage >= totalPages;
        next.onclick = () => setInvoicePage(invoicePage + 1);

        controls.appendChild(prev);
        controls.appendChild(next);

        container.appendChild(info);
        container.appendChild(controls);
    }

    function renderGeneratorPagination(totalPages) {
        const container = document.getElementById('invoice-gen-pagination');
        if (!container) return;
        container.innerHTML = '';
        if (totalPages <= 1) return;

        const info = document.createElement('div');
        info.className = 'small text-muted';
        info.textContent = `Página ${generatorPage} de ${totalPages}`;

        const controls = document.createElement('div');
        controls.className = 'btn-group btn-group-sm';

        const prev = document.createElement('button');
        prev.className = 'btn btn-outline-secondary';
        prev.textContent = '‹';
        prev.disabled = generatorPage <= 1;
        prev.onclick = () => setGeneratorPage(generatorPage - 1);

        const next = document.createElement('button');
        next.className = 'btn btn-outline-secondary';
        next.textContent = '›';
        next.disabled = generatorPage >= totalPages;
        next.onclick = () => setGeneratorPage(generatorPage + 1);

        controls.appendChild(prev);
        controls.appendChild(next);

        container.appendChild(info);
        container.appendChild(controls);
    }

    function setInvoicePage(page) {
        invoicePage = Math.max(1, page);
        renderTable(lastInvoices);
    }

    function setGeneratorPage(page) {
        generatorPage = Math.max(1, page);
        renderGeneratorResults(generatorHours);
    }

    function openModal(invoiceData) {
        const modal = new bootstrap.Modal(document.getElementById('invoice-modal'));
        const title = document.getElementById('invoice-modal-title');
        const form = document.getElementById('invoice-form');

        if (title) title.textContent = invoiceData ? 'Editar Factura' : 'Nueva Factura';
        if (form) form.reset();

        if (invoiceData) {
            document.getElementById('invoice-id').value = invoiceData.ID || '';
            document.getElementById('invoice-id-cliente').value = invoiceData['ID_CLIENTE'] || '';
            document.getElementById('invoice-fecha').value = invoiceData['FECHA'] || '';
            document.getElementById('invoice-periodo').value = invoiceData['PERIODO'] || '';
            document.getElementById('invoice-comprobante').value = invoiceData['COMPROBANTE'] || 'Factura B';
            document.getElementById('invoice-numero').value = invoiceData['NUMERO'] || '';
            document.getElementById('invoice-razon-social').value = invoiceData['RAZÓN SOCIAL'] || '';
            document.getElementById('invoice-cuit').value = invoiceData['CUIT'] || '';
            document.getElementById('invoice-concepto').value = invoiceData['CONCEPTO'] || '';
            document.getElementById('invoice-horas').value = invoiceData['HORAS'] || '';
            document.getElementById('invoice-valor-hora').value = invoiceData['VALOR HORA'] || '';
            document.getElementById('invoice-importe').value = invoiceData['IMPORTE'] || '';
            document.getElementById('invoice-subtotal').value = invoiceData['SUBTOTAL'] || '';
            document.getElementById('invoice-total').value = invoiceData['TOTAL'] || '';
            document.getElementById('invoice-estado').value = invoiceData['ESTADO'] || 'Pendiente';
            document.getElementById('invoice-observaciones').value = invoiceData['OBSERVACIONES'] || '';
        } else {
            // Valores por defecto para nueva factura
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('invoice-fecha').value = today;
            document.getElementById('invoice-estado').value = 'Pendiente';
        }

        // Completar CUIT e ID si existe en referencias
        autocompleteCUIT();
        if (!invoiceData || !invoiceData.ID) {
            recalculateTotals_();
        }
        modal.show();
    }

    function parseIvaPctFromConfig_(config) {
        if (!config) return 0.21;
        const raw = config['IVA_PORCENTAJE'] != null ? config['IVA_PORCENTAJE'] : config['IVA'];
        if (raw == null || raw === '') return 0.21;
        const cleaned = String(raw).replace('%', '').trim();
        const n = Number(cleaned);
        if (isNaN(n)) return 0.21;
        return n > 1 ? n / 100 : n;
    }

    function loadIvaConfig() {
        if (!ApiService || !ApiService.call) return;
        ApiService.call('getConfig')
            .then(cfg => {
                ivaPct = parseIvaPctFromConfig_(cfg);
                recalculateTotals_();
            })
            .catch(() => { /* usar default */ });
    }

    function recalculateTotals_() {
        const horasInput = document.getElementById('invoice-horas');
        const valorHoraInput = document.getElementById('invoice-valor-hora');
        const importeInput = document.getElementById('invoice-importe');
        const subtotalInput = document.getElementById('invoice-subtotal');
        const totalInput = document.getElementById('invoice-total');
        if (!horasInput || !valorHoraInput) return;

        const horas = Number(horasInput.value) || 0;
        const valorHora = Number(valorHoraInput.value) || 0;
        const subtotal = horas * valorHora;
        const subtotalFixed = (isNaN(subtotal) ? 0 : subtotal).toFixed(2);
        const totalFixed = (subtotal * (1 + ivaPct)).toFixed(2);

        if (importeInput) importeInput.value = subtotalFixed;
        if (subtotalInput) subtotalInput.value = subtotalFixed;
        if (totalInput) totalInput.value = totalFixed;
    }

    function handleSave() {
        const form = document.getElementById('invoice-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('invoice-id').value;
        const idCliente = document.getElementById('invoice-id-cliente').value;

        const data = {
            'ID_CLIENTE': idCliente || '',
            'FECHA': document.getElementById('invoice-fecha').value,
            'PERIODO': document.getElementById('invoice-periodo').value,
            'COMPROBANTE': document.getElementById('invoice-comprobante').value,
            'NUMERO': document.getElementById('invoice-numero').value,
            'RAZÓN SOCIAL': document.getElementById('invoice-razon-social').value,
            'CUIT': document.getElementById('invoice-cuit').value,
            'CONCEPTO': document.getElementById('invoice-concepto').value,
            'HORAS': document.getElementById('invoice-horas').value,
            'VALOR HORA': document.getElementById('invoice-valor-hora').value,
            'IMPORTE': document.getElementById('invoice-importe').value,
            'SUBTOTAL': document.getElementById('invoice-subtotal').value,
            'TOTAL': document.getElementById('invoice-total').value,
            'ESTADO': document.getElementById('invoice-estado').value,
            'OBSERVACIONES': document.getElementById('invoice-observaciones').value
        };

        const saveBtn = document.getElementById('invoice-save-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';
        }

        const apiMethod = id ? 'updateInvoice' : 'createInvoice';
        const apiArgs = id ? [id, data] : [data];

        ApiService.call(apiMethod, ...apiArgs)
            .then((res) => {
                const newId = res && res.id ? res.id : res;
                Alerts && Alerts.showAlert('Factura guardada exitosamente', 'success');
                bootstrap.Modal.getInstance(document.getElementById('invoice-modal')).hide();
                invoicePage = 1;
                refreshGeneratorList(); // Refrescar lista del generador si hay filtros
                if (newId) {
                    lastSavedInvoiceId = newId;
                    updateSelectionUi();
                }
            })
            .catch(err => {
                console.error('Error al guardar factura:', err);
                Alerts && Alerts.showAlert('Error al guardar: ' + err.message, 'danger');
            })
            .finally(() => {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="bi bi-save me-1"></i>Guardar';
                }
            });
    }

    function openFromAttendanceModal() {
        const modalEl = document.getElementById('invoice-att-modal');
        if (!modalEl) return;
        const modal = new bootstrap.Modal(modalEl);

        // Prefill fechas: mes actual
        const hoy = new Date();
        const first = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
        const last = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
        const desde = document.getElementById('invoice-att-desde');
        const hasta = document.getElementById('invoice-att-hasta');
        if (desde && !desde.value) desde.value = first;
        if (hasta && !hasta.value) hasta.value = last;

        modal.show();

        const saveBtn = document.getElementById('invoice-att-save');
        if (saveBtn && !saveBtn._bound) {
            saveBtn._bound = true;
            saveBtn.addEventListener('click', handleFromAttendanceSave);
        }
    }

    function handleFromAttendanceSave() {
        const clienteInput = document.getElementById('invoice-att-cliente');
        const desdeInput = document.getElementById('invoice-att-desde');
        const hastaInput = document.getElementById('invoice-att-hasta');
        const compInput = document.getElementById('invoice-att-comp');
        const numInput = document.getElementById('invoice-att-numero');
        const obsInput = document.getElementById('invoice-att-obs');

        const clienteRaw = clienteInput ? clienteInput.value.trim() : '';
        const idCliente = getClientIdFromLabel(clienteRaw);
        const cliente = cleanClientValue(clienteRaw);
        if (!clienteRaw) {
            Alerts && Alerts.showAlert('Elegí un cliente', 'warning');
            return;
        }

        const fechaDesde = desdeInput && desdeInput.value ? desdeInput.value : '';
        const fechaHasta = hastaInput && hastaInput.value ? hastaInput.value : '';

        UiState && UiState.setGlobalLoading(true, 'Generando factura desde asistencia...');
        ApiService.call('createInvoiceFromAttendance', cliente, fechaDesde, fechaHasta, {
            comprobante: compInput ? compInput.value : '',
            numero: numInput ? numInput.value : '',
            observaciones: obsInput ? obsInput.value : ''
        }, idCliente)
            .then(() => {
                Alerts && Alerts.showAlert('Factura generada desde asistencia.', 'success');
                const modalEl = document.getElementById('invoice-att-modal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    modal && modal.hide();
                }
                handleSearch();
            })
            .catch(err => {
                Alerts && Alerts.showAlert('Error: ' + err.message, 'danger');
            })
            .finally(() => {
                UiState && UiState.setGlobalLoading(false);
            });
    }

    function generateFromGenerator() {
        const clientInput = document.getElementById('invoice-gen-client');
        const desdeInput = document.getElementById('invoice-gen-desde');
        const hastaInput = document.getElementById('invoice-gen-hasta');

        const clienteRaw = clientInput ? clientInput.value.trim() : '';
        const idCliente = getClientIdFromLabel(clienteRaw);
        const cliente = cleanClientValue(clienteRaw);
        const fechaDesde = desdeInput && desdeInput.value ? desdeInput.value : '';
        const fechaHasta = hastaInput && hastaInput.value ? hastaInput.value : '';

        if (!clienteRaw) {
            Alerts && Alerts.showAlert('Elegí un cliente antes de generar.', 'warning');
            return;
        }
        if (!fechaDesde || !fechaHasta) {
            Alerts && Alerts.showAlert('Indicá fechas Desde y Hasta para generar la factura.', 'warning');
            return;
        }

        UiState && UiState.setGlobalLoading(true, 'Generando factura con filtros...');
        ApiService.call('createInvoiceFromAttendance', cliente, fechaDesde, fechaHasta, {}, idCliente)
            .then(() => {
                Alerts && Alerts.showAlert('Factura generada.', 'success');
                handleSearch();
            })
            .catch(err => {
                Alerts && Alerts.showAlert('Error: ' + err.message, 'danger');
            })
            .finally(() => UiState && UiState.setGlobalLoading(false));
    }

    function editInvoice(id) {
        ApiService.call('getInvoiceById', id)
            .then(invoice => {
                if (invoice) {
                    openModal(invoice);
                }
            })
            .catch(err => {
                console.error('Error al cargar factura:', err);
                Alerts && Alerts.showAlert('Error al cargar factura: ' + err.message, 'danger');
            });
    }

    function deleteInvoice(id, skipRefreshMain) {
        if (!confirm('¿Estás seguro de que querés anular esta factura?')) {
            return;
        }

        ApiService.call('deleteInvoice', id)
            .then(() => {
                Alerts && Alerts.showAlert('Factura anulada exitosamente', 'success');
                if (!skipRefreshMain) {
                    handleSearch(); // Recargar lista principal
                }
                refreshGeneratorList();
            })
            .catch(err => {
                console.error('Error al anular factura:', err);
                Alerts && Alerts.showAlert('Error al anular: ' + err.message, 'danger');
            });
    }

    function toggleLoading(show) {
        const loading = document.getElementById('invoice-loading');
        const results = document.getElementById('invoice-results');
        const empty = document.getElementById('invoice-empty');

        if (loading) loading.classList.toggle('d-none', !show);
        if (show) {
            if (results) results.classList.add('d-none');
            if (empty) empty.classList.add('d-none');
        }
    }

    function toggleGeneratorLoading(show) {
        const loading = document.getElementById('invoice-gen-loading');
        const results = document.getElementById('invoice-gen-results');
        const empty = document.getElementById('invoice-gen-empty');
        if (loading) loading.classList.toggle('d-none', !show);
        if (show) {
            if (results) results.classList.add('d-none');
            if (empty) empty.classList.add('d-none');
        }
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function formatCurrency(val) {
        const num = Number(val) || 0;
        return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    }

    function formatPeriod(period) {
        if (!period) return '';
        const str = String(period);
        // Expect yyyy-mm or yyyy-mm-dd
        let year, month;
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            year = str.slice(0, 4);
            month = str.slice(5, 7);
        } else if (/^\d{4}-\d{2}$/.test(str)) {
            year = str.slice(0, 4);
            month = str.slice(5, 7);
        } else {
            return str;
        }
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mIdx = Number(month) - 1;
        return `${months[mIdx] || month} ${year}`;
    }

    function fetchGeneratorHours() {
        if (!lastGeneratorFilters || !lastGeneratorFilters.cliente) {
            renderGeneratorResults([]);
            return;
        }

        toggleGeneratorLoading(true);
        ApiService.call('getHoursByClient',
            lastGeneratorFilters.fechaDesde,
            lastGeneratorFilters.fechaHasta,
            lastGeneratorFilters.cliente,
            lastGeneratorFilters.idCliente
        )
            .then(res => {
                generatorHours = (res && res.rows) ? res.rows : [];
                renderGeneratorResults(generatorHours);
            })
            .catch(err => {
                console.error('Error al cargar asistencia del cliente:', err);
                Alerts && Alerts.showAlert('Error al cargar asistencia del cliente: ' + err.message, 'danger');
            })
            .finally(() => toggleGeneratorLoading(false));
    }

    function refreshGeneratorList() {
        if (lastGeneratorFilters) {
            fetchGeneratorHours();
        }
    }

    function buildPresetFromHours(clienteRaw, desde, hasta) {
        const cliente = cleanClientValue(clienteRaw);
        const preset = {
            'RAZÓN SOCIAL': cliente || clienteRaw,
            'FECHA': new Date().toISOString().slice(0, 10),
            'OBSERVACIONES': (desde || hasta) ? `Período: ${desde || 's/d'} a ${hasta || 's/h'}` : ''
        };

        if (generatorHours && generatorHours.length > 0) {
            const totalHoras = generatorHours.reduce((acc, r) => acc + (Number(r.horas) || 0), 0);
            preset['HORAS'] = totalHoras || '';
            preset['CONCEPTO'] = `Servicios ${cliente} (${desde || ''} a ${hasta || ''})`;
            const idCli = getClientIdFromLabel(clienteRaw || cliente);
            if (idCli) {
                preset['ID_CLIENTE'] = idCli;
            }
        }
        if (desde) {
            preset['PERIODO'] = desde.slice(0, 7);
        }
        return preset;
    }

    function prefillFromHours(fecha, empleado, horas) {
        const clienteRaw = document.getElementById('invoice-gen-client')?.value || '';
        const cliente = cleanClientValue(clienteRaw);
        const desde = document.getElementById('invoice-gen-desde')?.value || '';
        const hasta = document.getElementById('invoice-gen-hasta')?.value || '';
        const preset = buildPresetFromHours(clienteRaw || cliente, desde, hasta);
        preset['FECHA'] = fecha || preset['FECHA'];
        preset['CONCEPTO'] = `Servicios ${cliente} - ${empleado || ''} ${fecha || ''}`;
        if (horas) preset['HORAS'] = horas;
        openModal(preset);
    }

    function editAttendance(id) {
        const row = generatorHours.find(r => String(r.id) === String(id));
        if (!row) {
            Alerts && Alerts.showAlert('Registro no encontrado.', 'warning');
            return;
        }
        const newHoras = prompt('Horas trabajadas', row.horas || '');
        if (newHoras === null) return;
        const newObs = prompt('Observaciones', row.observaciones || '');
        const payload = {
            'HORAS': Number(newHoras) || 0,
            'OBSERVACIONES': newObs || '',
            'ASISTENCIA': true,
            'CLIENTE': row.cliente || '',
            'ID_CLIENTE': row.idCliente || '',
            'EMPLEADO': row.empleado || '',
            'FECHA': row.fecha
        };
        UiState && UiState.setGlobalLoading(true, 'Guardando asistencia...');
        ApiService.call('updateRecord', 'ASISTENCIA', id, payload)
            .then(() => {
                Alerts && Alerts.showAlert('Registro actualizado.', 'success');
                refreshGeneratorList();
            })
            .catch(err => {
                console.error(err);
                Alerts && Alerts.showAlert('Error al actualizar: ' + err.message, 'danger');
            })
            .finally(() => UiState && UiState.setGlobalLoading(false));
    }

    function deleteAttendance(id) {
        if (!confirm('¿Eliminar este registro de asistencia?')) return;
        UiState && UiState.setGlobalLoading(true, 'Eliminando asistencia...');
        ApiService.call('deleteRecord', 'ASISTENCIA', id)
            .then(() => {
                Alerts && Alerts.showAlert('Registro eliminado.', 'success');
                refreshGeneratorList();
            })
            .catch(err => {
                console.error(err);
                Alerts && Alerts.showAlert('Error al eliminar: ' + err.message, 'danger');
            })
            .finally(() => UiState && UiState.setGlobalLoading(false));
    }

    function downloadPdf(id) {
        if (!id) return;
        UiState && UiState.setGlobalLoading(true, 'Generando PDF...');
        ApiService.call('generateInvoicePdf', id)
            .then(res => {
                if (!res || !res.base64) {
                    Alerts && Alerts.showAlert('No se pudo generar el PDF.', 'warning');
                    return;
                }
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,' + res.base64;
                link.download = res.filename || 'factura.pdf';
                link.click();
            })
            .catch(err => {
                console.error('Error al generar PDF:', err);
                Alerts && Alerts.showAlert('Error al generar PDF: ' + err.message, 'danger');
            })
            .finally(() => UiState && UiState.setGlobalLoading(false));
    }

	    function updateSelectionUi() {
	        const dlLastBtn = document.getElementById('invoice-download-last-btn');
	        if (dlLastBtn) {
	            dlLastBtn.disabled = !lastSavedInvoiceId;
	        }
	        const dlSelected = document.getElementById('invoice-download-selected');
	        if (dlSelected) {
	            dlSelected.disabled = selectedInvoiceIds.size === 0;
	        }
        const selectAll = document.getElementById('invoice-select-all');
        if (selectAll) {
            const checkboxes = document.querySelectorAll('.invoice-select');
            const total = checkboxes.length;
            const selected = selectedInvoiceIds.size;
            selectAll.checked = total > 0 && selected === total;
            selectAll.indeterminate = selected > 0 && selected < total;
        }
    }

    function toggleInvoiceSelection(id, checked) {
        const key = String(id);
        if (checked) {
            selectedInvoiceIds.add(key);
        } else {
            selectedInvoiceIds.delete(key);
        }
        updateSelectionUi();
    }

    function toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.invoice-select');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            const id = cb.getAttribute('data-id');
            if (checked) {
                selectedInvoiceIds.add(String(id));
            } else {
                selectedInvoiceIds.delete(String(id));
            }
        });
        updateSelectionUi();
    }

    function downloadSelectedPdfs() {
        if (selectedInvoiceIds.size === 0) return;
        const ids = Array.from(selectedInvoiceIds);
        (async () => {
            for (const id of ids) {
                try {
                    const res = await ApiService.call('generateInvoicePdf', id);
                    if (!res || !res.base64) continue;
                    const link = document.createElement('a');
                    link.href = 'data:application/pdf;base64,' + res.base64;
                    link.download = res.filename || `factura_${id}.pdf`;
                    link.click();
                } catch (err) {
                    console.error('PDF error', err);
                }
            }
        })();
    }

    return {
        render: render,
        editInvoice: editInvoice,
        deleteInvoice: deleteInvoice,
        openModal: openModal,
        downloadPdf: downloadPdf,
        prefillFromHours: prefillFromHours,
        editAttendance: editAttendance,
        deleteAttendance: deleteAttendance,
        setInvoicePage: setInvoicePage,
        setGeneratorPage: setGeneratorPage,
        toggleInvoiceSelection: toggleInvoiceSelection,
        toggleSelectAll: toggleSelectAll
    };
})();
