/**
 * Invoice Templates
 */
var InvoiceTemplates = (function () {
    function buildMainPanel(options) {
        const opts = options || {};
        const statusOptionsAll = opts.statusOptionsAll || "";
        const statusOptionsDefault = opts.statusOptionsDefault || "";
        const comprobanteOptions = opts.comprobanteOptions || "";

        return `
            <div class="d-flex flex-column gap-3">
            <div class="card shadow-sm">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-receipt me-2"></i>Facturación</h6>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="collapse" data-bs-target="#invoice-history-collapse" aria-expanded="false" aria-controls="invoice-history-collapse">
                            <i class="bi bi-clock-history me-1"></i>Historial
                        </button>
                        <button class="btn btn-danger btn-sm" id="invoice-download-selected" disabled>
                            <span id="invoice-download-selected-spinner" class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                            <span>Descargar PDF</span>
                        </button>
                        <button class="btn btn-primary btn-sm" id="invoice-new-btn">
                            <i class="bi bi-plus-circle me-1"></i>Nueva factura
                        </button>
                    </div>
                </div>
                <div id="invoice-history-collapse" class="collapse">
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
                                ${statusOptionsAll}
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

            <div class="card shadow-sm">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-clipboard-check me-2"></i>Control de facturación</h6>
                    <div class="d-flex gap-2 align-items-center">
                        <input type="month" id="invoice-cov-period" class="form-control form-control-sm" style="max-width: 170px;">
                        <button class="btn btn-primary btn-sm" id="invoice-cov-search" title="Buscar">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body p-3">
                    <div id="invoice-cov-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Calculando cobertura...</p>
                    </div>

                    <div id="invoice-cov-summary" class="row g-2 mb-2 d-none"></div>

                    <div id="invoice-cov-results" class="d-none">
                        <div class="table-responsive lt-table-wrap">
                            <table class="table table-hover table-sm align-middle mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th class="ps-3 py-2 text-muted font-weight-normal">Cliente</th>
                                        <th class="py-2 text-muted font-weight-normal text-end">Horas</th>
                                        <th class="py-2 text-muted font-weight-normal text-end">Días</th>
                                        <th class="py-2 text-muted font-weight-normal text-center">Facturado</th>
                                        <th class="py-2 text-muted font-weight-normal">Factura</th>
                                        <th class="py-2 text-muted font-weight-normal text-end">Total</th>
                                        <th class="py-2 text-muted font-weight-normal text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="invoice-cov-tbody"></tbody>
                            </table>
                        </div>
                    </div>

                    <div id="invoice-cov-empty" class="text-center text-muted py-3">
                        <i class="bi bi-ui-checks-grid" style="font-size: 1.2rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Elegí un período y buscá para ver quién quedó sin facturar.</p>
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
                                            ${statusOptionsDefault}
                                        </select>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <label class="form-label">Comprobante</label>
                                        <select class="form-select" id="invoice-comprobante">
                                            ${comprobanteOptions}
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
                                        ${comprobanteOptions}
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
    }

    return {
        buildMainPanel: buildMainPanel
    };
})();
