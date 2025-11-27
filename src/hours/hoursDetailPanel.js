/**
 * Panel de Detalle de Horas - Seguimiento por Empleado
 */
var HoursDetailPanel = (function () {
    let containerId = 'hours-detail-panel';

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card shadow-sm mb-3">
                <div class="card-header bg-white py-2">
                    <h6 class="mb-0 text-primary fw-bold">
                        <i class="bi bi-clock-history me-2"></i>Seguimiento de Horas por Empleado
                    </h6>
                </div>
                <div class="card-body p-3">
                    <!-- Filtros -->
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label small text-muted fw-bold mb-1">Empleado</label>
                            <input list="hours-employee-list" id="hours-filter-employee" class="form-control form-control-sm" placeholder="Buscar empleado...">
                            <datalist id="hours-employee-list"></datalist>
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Desde</label>
                            <input type="date" id="hours-filter-start" class="form-control form-control-sm">
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
                            <input type="date" id="hours-filter-end" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-4 d-flex gap-2">
                            <button id="btn-search-hours" class="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1">
                                <i class="bi bi-search"></i> Buscar
                            </button>
                            <button id="btn-export-pdf" class="btn btn-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1">
                                <i class="bi bi-file-earmark-pdf-fill"></i> PDF
                            </button>
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div id="hours-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Cargando registros...</p>
                    </div>

                    <!-- Resumen -->
                    <div id="hours-summary" class="row g-2 mb-3 d-none">
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light">
                                <div class="card-body py-2 px-2 text-center">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Horas</div>
                                    <div class="fs-6 fw-bold text-dark" id="hours-summary-total">0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light">
                                <div class="card-body py-2 px-2 text-center">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Valor hora</div>
                                    <div class="fs-6 fw-bold text-dark" id="hours-summary-rate">$0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light">
                                <div class="card-body py-2 px-2 text-center">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Adelantos</div>
                                    <div class="fs-6 fw-bold text-danger" id="hours-summary-advances">$0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light">
                                <div class="card-body py-2 px-2 text-center">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Viáticos</div>
                                    <div class="fs-6 fw-bold text-dark" id="hours-summary-viaticos">$0</div>
                                </div>
                            </div>
                        </div>
                         <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light">
                                <div class="card-body py-2 px-2 text-center">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Presentismo</div>
                                    <div class="fs-6 fw-bold text-dark" id="hours-summary-presentismo">$0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-sm border-0 text-center" style="background: linear-gradient(135deg, #0f172a, #334155); color: #fff;">
                                <div class="card-body py-2 px-2">
                                    <div class="small text-white-50 text-uppercase" style="font-size: 0.7rem;">Total a pagar</div>
                                    <div class="fs-6 fw-bold" id="hours-summary-total-net">$0</div>
                                    <div class="small text-white-50" style="font-size: 0.65rem;" id="hours-summary-total-gross"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tabla de Resultados -->
                    <div id="hours-results-container" class="d-none">
                        <div class="table-responsive border rounded">
                            <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                                <thead class="bg-light">
                                    <tr>
                                        <th class="ps-3 py-2 text-muted font-weight-normal">Cliente</th>
                                        <th class="py-2 text-muted font-weight-normal">Fecha</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                                        <th class="py-2 text-muted font-weight-normal">Observaciones</th>
                                        <th class="text-end py-2 pe-3 text-muted font-weight-normal" style="width: 100px;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="hours-table-body">
                                    <!-- Rows will be injected here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Empty State -->
                    <div id="hours-empty-state" class="text-center py-4 d-none">
                        <i class="bi bi-search" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Utilizá los filtros para buscar registros.</p>
                    </div>
                </div>
            </div>
        `;

        // Populate Employees
        loadEmployees();

        // Set default dates (current month)
        setDefaultDates();

        // Attach Events
        document.getElementById('btn-search-hours').addEventListener('click', handleSearch);
        const pdfBtn = document.getElementById('btn-export-pdf');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', handleExportPdf);
        }
    }

    function setDefaultDates() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        document.getElementById('hours-filter-start').valueAsDate = firstDay;
        document.getElementById('hours-filter-end').valueAsDate = lastDay;
    }

    function loadEmployees() {
        const input = document.getElementById('hours-filter-employee');
        const datalist = document.getElementById('hours-employee-list');
        if (!input || !datalist) return;

        datalist.innerHTML = '';
        input.value = '';

        if (typeof ReferenceService === 'undefined') {
            console.warn('ReferenceService no disponible');
            return;
        }

        ReferenceService.load()
            .then(() => {
                const refs = ReferenceService.get();
                populateEmployeeSelect(refs && refs.empleados ? refs.empleados : []);
            })
            .catch(err => {
                console.error('Error loading employees:', err);
                Alerts.showAlert('No se pudieron cargar empleados. Reintentá.', 'warning');
            });
    }

    function populateEmployeeSelect(employees) {
        const datalist = document.getElementById('hours-employee-list');
        if (!datalist) return;

        const list = Array.isArray(employees) ? employees.slice().sort() : [];
        datalist.innerHTML = '';

        list.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee;
            datalist.appendChild(option);
        });
    }

    function handleSearch() {
        const start = document.getElementById('hours-filter-start').value;
        const end = document.getElementById('hours-filter-end').value;
        const employee = document.getElementById('hours-filter-employee').value;

        if (!employee) {
            Alerts.showAlert("Por favor seleccione un empleado", "warning");
            return;
        }

        // UI Loading
        document.getElementById('hours-results-container').classList.add('d-none');
        document.getElementById('hours-empty-state').classList.add('d-none');
        document.getElementById('hours-loading').classList.remove('d-none');

        const summaryBox = document.getElementById('hours-summary');
        if (summaryBox) summaryBox.classList.add('d-none');

        ApiService.call('getHoursByEmployee', start, end, employee)
            .then(results => {
                const parsed = (typeof results === 'string')
                    ? (function () { try { return JSON.parse(results); } catch (e) { console.warn('No se pudo parsear resultados', e); return {}; } })()
                    : results || {};

                const rows = parsed && parsed.rows ? parsed.rows : (Array.isArray(parsed) ? parsed : []);
                const summary = parsed && parsed.summary ? parsed.summary : null;

                console.log('[HoursDetail] Resultados recibidos:', rows, 'Resumen:', summary);
                renderTable(rows || [], summary);
            })
            .catch(err => {
                console.error(err);
                Alerts.showAlert("Error al cargar horas: " + err.message, "danger");
            })
            .finally(() => {
                document.getElementById('hours-loading').classList.add('d-none');
            });
    }

    function handleExportPdf() {
        const start = document.getElementById('hours-filter-start').value;
        const end = document.getElementById('hours-filter-end').value;
        const employee = document.getElementById('hours-filter-employee').value;
        if (!employee) {
            Alerts.showAlert("Selecciona un empleado para exportar", "warning");
            return;
        }

        const btn = document.getElementById('btn-export-pdf');
        const originalContent = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Descargando...';
        }

        UiState && UiState.setGlobalLoading(true, 'Generando PDF...');
        ApiService.call('generateHoursPdf', start, end, employee)
            .then(res => {
                if (!res || !res.base64) throw new Error('No se pudo generar PDF');
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,' + res.base64;
                link.download = res.filename || 'reporte.pdf';
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

    function renderTable(data, summary) {
        const tbody = document.getElementById('hours-table-body');
        const container = document.getElementById('hours-results-container');
        const emptyState = document.getElementById('hours-empty-state');

        tbody.innerHTML = '';

        console.log('[HoursDetail] Renderizando tabla. Items:', Array.isArray(data) ? data.length : 'no-array', data && data[0]);

        if (!data || data.length === 0) {
            container.classList.add('d-none');
            emptyState.classList.remove('d-none');
            updateSummary(summary);
            return;
        }

        let total = 0;

        data.forEach(row => {
            const tr = document.createElement('tr');
            const hours = parseFloat(row.horas) || 0;
            total += hours;
            const isAbsent = row.asistencia === false;

            tr.innerHTML = `
                <td>${row.cliente || '-'}</td>
                <td>${row.fecha}</td>
                <td class="text-center fw-bold">${hours}</td>
                <td class="text-muted small">${row.observaciones || '-'}</td>
                <td class="text-end">
                    <div class="d-flex gap-2 justify-content-end">
                        <button class="btn btn-sm text-white btn-edit-hour" data-id="${row.id}" title="Editar"
                            style="background:#5b7bfa;border:none;border-radius:12px; padding:6px 12px;">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn btn-sm text-white btn-delete-hour" data-id="${row.id}" title="Eliminar"
                            style="background:#e53e3e;border:none;border-radius:12px; padding:6px 12px;">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            `;
            if (isAbsent) {
                tr.classList.add('absence-row');
            }
            tbody.appendChild(tr);
        });

        updateSummary(summary || { totalHoras: total });

        // Show Table
        container.classList.remove('d-none');
        emptyState.classList.add('d-none');

        // Attach Action Events
        attachActionEvents(data);
    }

    function updateSummary(summary) {
        const box = document.getElementById('hours-summary');
        if (!box) return;

        const totals = {
            totalHoras: 0,
            valorHora: 0,
            totalBruto: 0,
            adelantos: 0,
            totalNeto: 0,
            viaticos: 0,
            ...(summary || {})
        };

        const totalHorasEl = document.getElementById('hours-summary-total');
        const rateEl = document.getElementById('hours-summary-rate');
        const advEl = document.getElementById('hours-summary-advances');
        const netEl = document.getElementById('hours-summary-total-net');
        const grossEl = document.getElementById('hours-summary-total-gross');
        const viaticosEl = document.getElementById('hours-summary-viaticos');
        const presentismoEl = document.getElementById('hours-summary-presentismo');

        if (totalHorasEl) totalHorasEl.textContent = formatNumber(totals.totalHoras);
        if (rateEl) rateEl.textContent = formatCurrency(totals.valorHora);
        if (advEl) advEl.textContent = formatCurrency(totals.adelantos);
        if (netEl) netEl.textContent = formatCurrency(totals.totalNeto);
        if (grossEl) grossEl.textContent = 'Total: ' + formatCurrency(totals.totalBruto);
        if (viaticosEl) viaticosEl.textContent = formatCurrency(totals.viaticos);
        if (presentismoEl) presentismoEl.textContent = formatCurrency(totals.presentismo);

        box.classList.remove('d-none');
    }

    function formatNumber(value) {
        const num = Number(value);
        if (isNaN(num)) return '0';
        return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatCurrency(value) {
        const num = Number(value);
        return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    }

    function exportToCsv(data) {
        if (!data || data.length === 0) return;

        // CSV Headers
        const headers = ['ID', 'Fecha', 'Cliente', 'Empleado', 'Horas', 'Observaciones'];

        // CSV Rows
        const rows = data.map(row => [
            row.id,
            row.fecha,
            `"${(row.cliente || '').replace(/"/g, '""')}"`, // Escape quotes
            `"${(row.empleado || '').replace(/"/g, '""')}"`,
            row.horas,
            `"${(row.observaciones || '').replace(/"/g, '""')}"`
        ]);

        // Combine
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        // Create Blob and Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_horas_${timestamp}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function attachActionEvents(data) {
        // Edit
        document.querySelectorAll('.btn-edit-hour').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                const record = data.find(r => r.id == id);
                if (record) {
                    editRecord(id, record);
                }
            });
        });

        // Delete
        document.querySelectorAll('.btn-delete-hour').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                deleteRecord(id);
            });
        });
    }

    function editRecord(id, record) {
        openInlineEditModal(record);
    }

    function deleteRecord(id) {
        if (!confirm('¿Está seguro de eliminar este registro de horas?')) return;

        UiState.setGlobalLoading(true, "Eliminando...");

        // Use existing delete logic
        // We need to know the format, which is ASISTENCIA
        ApiService.call('deleteRecord', ['ASISTENCIA', id])
            .then(() => {
                Alerts.showAlert("Registro eliminado correctamente", "success");
                handleSearch(); // Refresh table
            })
            .catch(err => {
                Alerts.showAlert("Error al eliminar: " + err.message, "danger");
            })
            .finally(() => {
                UiState.setGlobalLoading(false);
            });
    }

    function openInlineEditModal(record) {
        const existing = document.getElementById('hours-edit-modal');
        if (existing) existing.remove();

        const modalHtml = `
            <div class="modal fade" id="hours-edit-modal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar asistencia</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label small text-muted">Empleado</label>
                                <input type="text" class="form-control" value="${HtmlHelpers.escapeHtml(record.empleado || '')}" disabled>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Cliente</label>
                                <input type="text" class="form-control" value="${HtmlHelpers.escapeHtml(record.cliente || '')}" disabled>
                            </div>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label small text-muted">Fecha</label>
                                    <input type="date" id="hours-edit-fecha" class="form-control" value="${record.fecha || ''}">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small text-muted">Horas</label>
                                    <input type="number" step="0.25" id="hours-edit-horas" class="form-control" value="${record.horas || ''}">
                                </div>
                            </div>
                            <div class="form-check form-switch mt-3">
                                <input class="form-check-input" type="checkbox" id="hours-edit-asistencia" ${record.asistencia === false ? '' : 'checked'}>
                                <label class="form-check-label" for="hours-edit-asistencia">Asistencia</label>
                            </div>
                            <div class="mt-3">
                                <label class="form-label small text-muted">Observaciones</label>
                                <textarea id="hours-edit-observaciones" class="form-control" rows="2">${record.observaciones || ''}</textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="hours-edit-save">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHtml.trim();
        document.body.appendChild(wrapper.firstChild);

        const modalEl = document.getElementById('hours-edit-modal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        const fechaInput = document.getElementById('hours-edit-fecha');
        const horasInput = document.getElementById('hours-edit-horas');
        const obsInput = document.getElementById('hours-edit-observaciones');
        const asistenciaInput = document.getElementById('hours-edit-asistencia');

        if (asistenciaInput) {
            asistenciaInput.checked = record.asistencia !== false;
        }
        if (horasInput && record.asistencia === false && record.horasPlan) {
            horasInput.value = record.horasPlan;
        }

        const saveBtn = document.getElementById('hours-edit-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                const fecha = fechaInput ? fechaInput.value : '';
                const horas = horasInput ? horasInput.value : '';
                const observaciones = obsInput ? obsInput.value : '';
                const asistencia = asistenciaInput ? asistenciaInput.checked : true;
                const horasToSave = asistencia ? horas : (horas || record.horasPlan || '');

                if (!fecha) {
                    Alerts.showAlert("Seleccione fecha.", "warning");
                    return;
                }

                UiState.setGlobalLoading(true, "Guardando...");

                const payload = {
                    'EMPLEADO': record.empleado,
                    'CLIENTE': record.cliente,
                    'FECHA': fecha,
                    'ASISTENCIA': asistencia,
                    'HORAS': horasToSave,
                    'OBSERVACIONES': observaciones
                };

                ApiService.call('updateRecord', 'ASISTENCIA', record.id, payload)
                    .then(() => {
                        Alerts.showAlert("Registro actualizado.", "success");
                        modal.hide();
                        modalEl.remove();
                        handleSearch();
                    })
                    .catch(err => {
                        Alerts.showAlert("Error al guardar: " + err.message, "danger");
                    })
                    .finally(() => {
                        UiState.setGlobalLoading(false);
                    });
            });
        }

        modalEl.addEventListener('hidden.bs.modal', () => {
            modalEl.remove();
        });
    }

    return {
        render: render
    };
})();
