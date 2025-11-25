/**
 * Panel de Detalle de Horas - Seguimiento por Empleado
 */
var HoursDetailPanel = (function () {
    let containerId = 'hours-detail-panel';

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-white py-3">
                    <h5 class="mb-0 text-primary">
                        <i class="bi bi-clock-history me-2"></i>Seguimiento de Horas por Empleado
                    </h5>
                </div>
                <div class="card-body">
                    <!-- Filtros -->
                    <div class="row g-3 mb-4 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label small text-muted fw-semibold">Empleado</label>
                            <select id="hours-filter-employee" class="form-select">
                                <option value="">Seleccionar Empleado...</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">Fecha Desde</label>
                            <input type="date" id="hours-filter-start" class="form-control">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">Fecha Hasta</label>
                            <input type="date" id="hours-filter-end" class="form-control">
                        </div>
                        <div class="col-md-2">
                            <button id="btn-search-hours" class="btn btn-primary w-100">
                                <i class="bi bi-search me-1"></i> Buscar
                            </button>
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div id="hours-loading" class="text-center py-5 d-none">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="text-muted mt-2">Cargando registros...</p>
                    </div>

                    <!-- Tabla de Resultados -->
                    <div id="hours-results-container" class="d-none">
                        <div class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th style="width: 120px;">Acciones</th>
                                        <th>Cliente</th>
                                        <th>Fecha</th>
                                        <th class="text-center">Horas</th>
                                        <th>Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody id="hours-table-body">
                                    <!-- Rows will be injected here -->
                                </tbody>
                                <tfoot class="table-light fw-bold">
                                    <tr>
                                        <td colspan="3" class="text-end">Total Horas:</td>
                                        <td class="text-center" id="hours-total-sum">0</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <!-- Acciones Globales -->
                        <div class="d-flex justify-content-end mt-3 pt-3 border-top">
                            <button id="btn-bill-hours" class="btn btn-success" disabled>
                                <i class="bi bi-receipt me-1"></i> Generar Factura
                            </button>
                        </div>
                    </div>
                    
                    <!-- Empty State -->
                    <div id="hours-empty-state" class="text-center py-5 d-none">
                        <i class="bi bi-inbox text-muted" style="font-size: 2rem;"></i>
                        <p class="text-muted mt-2">No se encontraron registros con los filtros seleccionados.</p>
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
        document.getElementById('btn-bill-hours').addEventListener('click', () => {
            Alerts.showAlert("Funcionalidad de facturación próximamente", "info");
        });
    }

    function setDefaultDates() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        document.getElementById('hours-filter-start').valueAsDate = firstDay;
        document.getElementById('hours-filter-end').valueAsDate = lastDay;
    }

    function loadEmployees() {
        // Reuse ReferenceService if available, or fetch fresh
        if (typeof ReferenceService !== 'undefined') {
            ReferenceService.getReferences().then(refs => {
                const select = document.getElementById('hours-filter-employee');
                if (!select) return;

                const employees = refs.empleados || [];
                employees.sort().forEach(employee => {
                    const option = document.createElement('option');
                    option.value = employee;
                    option.textContent = employee;
                    select.appendChild(option);
                });
            });
        }
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

        ApiService.call('getHoursByEmployee', [start, end, employee])
            .then(results => {
                renderTable(results);
            })
            .catch(err => {
                console.error(err);
                Alerts.showAlert("Error al cargar horas: " + err.message, "danger");
            })
            .finally(() => {
                document.getElementById('hours-loading').classList.add('d-none');
            });
    }

    function renderTable(data) {
        const tbody = document.getElementById('hours-table-body');
        const container = document.getElementById('hours-results-container');
        const emptyState = document.getElementById('hours-empty-state');
        const totalSum = document.getElementById('hours-total-sum');
        const btnBill = document.getElementById('btn-bill-hours');

        tbody.innerHTML = '';

        if (!data || data.length === 0) {
            container.classList.add('d-none');
            emptyState.classList.remove('d-none');
            return;
        }

        let total = 0;

        data.forEach(row => {
            const tr = document.createElement('tr');
            const hours = parseFloat(row.horas) || 0;
            total += hours;

            tr.innerHTML = `
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1 btn-edit-hour" data-id="${row.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-delete-hour" data-id="${row.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
                <td>${row.cliente || '-'}</td>
                <td>${row.fecha}</td>
                <td class="text-center fw-bold">${hours}</td>
                <td class="text-muted small">${row.observaciones || '-'}</td>
            `;
            tbody.appendChild(tr);
        });

        // Update Total
        totalSum.textContent = total.toFixed(2);

        // Enable Export Button
        const btnExport = document.getElementById('btn-bill-hours');
        if (btnExport) {
            btnExport.innerHTML = '<i class="bi bi-file-earmark-spreadsheet me-1"></i> Exportar CSV';
            btnExport.classList.remove('btn-success');
            btnExport.classList.add('btn-success'); // Keep green or change to other color
            btnExport.disabled = false;

            // Remove old listeners (cloning node is a simple way to clear listeners)
            const newBtn = btnExport.cloneNode(true);
            btnExport.parentNode.replaceChild(newBtn, btnExport);

            newBtn.addEventListener('click', () => exportToCsv(data));
        }

        // Show Table
        container.classList.remove('d-none');
        emptyState.classList.add('d-none');

        // Attach Action Events
        attachActionEvents(data);
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
        // We need to switch to the Registro view and open the modal
        // First, trigger view change to 'registro'
        const event = new CustomEvent('view-change', { detail: { view: 'registro' } });
        document.dispatchEvent(event);

        // Wait for view to load
        setTimeout(() => {
            // Set format to ASISTENCIA
            const formatSelect = document.getElementById('formato');
            if (formatSelect) {
                formatSelect.value = 'ASISTENCIA';
                formatSelect.dispatchEvent(new Event('change'));
            }

            // Wait for format to load
            setTimeout(() => {
                if (GridManager && FormManager && RecordManager) {
                    const fullRecord = {
                        ID: record.id,
                        FECHA: record.fecha,
                        EMPLEADO: record.empleado,
                        HORAS: record.horas,
                        OBSERVACIONES: record.observaciones,
                        CLIENTE: record.cliente,
                        ASISTENCIA: 'Presente' // Default assumption
                    };

                    // Open modal and load record
                    GridManager.openModal("Editar Registro de Horas", function () {
                        FormManager.renderForm('ASISTENCIA');
                        RecordManager.loadRecordForEdit(id, fullRecord);
                    });
                }
            }, 300);
        }, 300);
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

    return {
        render: render
    };
})();
