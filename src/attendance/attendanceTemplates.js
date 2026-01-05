/**
 * Attendance Templates
 * Plantillas HTML para los paneles de asistencia.
 */

(function (global) {
    const AttendanceTemplates = (() => {
        const escapeHtml = (global.HtmlHelpers && typeof global.HtmlHelpers.escapeHtml === 'function')
            ? global.HtmlHelpers.escapeHtml
            : function (val) {
                return String(val == null ? '' : val)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            };

        function buildDailyAttendanceLayout(fecha) {
            const safeFecha = escapeHtml(fecha || '');
            return `
                <div id="attendance-daily-root" class="d-flex flex-column gap-3">
                    <div class="lt-surface lt-surface--subtle p-2">
                        <div class="lt-toolbar">
                            <div class="d-flex align-items-center gap-2 flex-shrink-0">
                                <label class="form-label small fw-semibold text-muted mb-0">Fecha</label>
                                <input type="date" id="attendance-date" class="form-control form-control-sm" value="${safeFecha}" style="width: 140px;">
                            </div>
                            <div class="d-flex align-items-center gap-2 flex-shrink-0">
                                <button type="button" id="attendance-add-extra" class="btn btn-sm btn-primary lt-btn-compact text-nowrap">
                                    <i class="bi bi-plus-circle me-1"></i>Fuera de plan
                                </button>
                            </div>
                            <div id="attendance-summary" class="d-flex flex-nowrap gap-2 flex-shrink-0"></div>
                        </div>
                    </div>

                    <div class="lt-surface p-0 position-relative">
                        <div id="attendance-loading" class="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center bg-white bg-opacity-75 d-none">
                            <div class="text-center">
                                <div class="spinner-border text-primary mb-2" role="status"></div>
                                <div class="small text-muted">Cargando asistencia del día...</div>
                            </div>
                        </div>

                        <div id="attendance-cards" class="d-flex flex-column gap-3 p-2">
                            <div class="text-center text-muted py-4">Cargando...</div>
                        </div>
                    </div>
                </div>
            `;
        }

        function buildEmployeeCalendarPanelHtml() {
            return `
                <div class="employee-calendar-container">
                    <!-- Header con controles -->
                    <div class="lt-surface lt-surface--subtle p-3 mb-3">
                        <div class="row g-3 align-items-end">
                            <div class="col-12 col-md-4">
                                <label class="form-label small mb-1 fw-semibold d-flex align-items-center gap-2">
                                    <i class="bi bi-person-badge text-primary"></i>
                                    <span>Empleado</span>
                                </label>
                                <select id="calendar-empleado-select" class="form-select">
                                    <option value="">Seleccionar empleado...</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-5">
                                <label class="form-label small mb-1 fw-semibold d-flex align-items-center gap-2">
                                    <i class="bi bi-calendar-week text-primary"></i>
                                    <span>Semana</span>
                                </label>
                                <div class="d-flex align-items-center gap-2">
                                    <button id="calendar-prev-week" class="btn btn-outline-secondary btn-sm" title="Semana anterior">
                                        <i class="bi bi-chevron-left"></i>
                                    </button>
                                    <div id="calendar-week-label" class="flex-grow-1 text-center fw-medium">
                                        Seleccione un empleado
                                    </div>
                                    <button id="calendar-next-week" class="btn btn-outline-secondary btn-sm" title="Semana siguiente">
                                        <i class="bi bi-chevron-right"></i>
                                    </button>
                                    <button id="calendar-today" class="btn btn-outline-primary btn-sm" title="Ir a hoy">
                                        <i class="bi bi-calendar-check"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-12 col-md-3 text-end">
                                <button id="calendar-generate-pdf" class="btn btn-success d-flex align-items-center gap-2 ms-auto" disabled>
                                    <i class="bi bi-file-earmark-pdf"></i>
                                    <span>Generar PDF</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Calendario semanal -->
                    <div id="calendar-grid-container" class="calendar-grid-wrapper">
                        <div class="text-center text-muted py-5">
                            <i class="bi bi-calendar3 display-4 mb-3 d-block opacity-50"></i>
                            <p class="mb-0">Selecciona un empleado para ver su calendario</p>
                        </div>
                    </div>

                    <!-- Resumen -->
                    <div id="calendar-summary" class="mt-3 d-none">
                        <div class="lt-surface p-3">
                            <div class="d-flex justify-content-around text-center">
                                <div>
                                    <div class="h4 mb-0 text-primary" id="summary-horas">0</div>
                                    <small class="text-muted">Horas</small>
                                </div>
                                <div>
                                    <div class="h4 mb-0 text-primary" id="summary-clientes">0</div>
                                    <small class="text-muted" id="summary-clientes-label">Clientes</small>
                                </div>
                                <div>
                                    <div class="h4 mb-0 text-primary" id="summary-dias">0</div>
                                    <small class="text-muted">Días</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        function buildClientCalendarPanelHtml() {
            return `
                <div class="employee-calendar-container">
                    <div class="lt-surface lt-surface--subtle p-3 mb-3">
                        <div class="row g-3 align-items-end">
                            <div class="col-12 col-md-4">
                                <label class="form-label small mb-1 fw-semibold d-flex align-items-center gap-2">
                                    <i class="bi bi-buildings text-primary"></i>
                                    <span>Cliente</span>
                                </label>
                                <select id="client-calendar-select" class="form-select">
                                    <option value="">Todos los clientes</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-5">
                                <label class="form-label small mb-1 fw-semibold d-flex align-items-center gap-2">
                                    <i class="bi bi-calendar-week text-primary"></i>
                                    <span>Semana</span>
                                </label>
                                <div class="d-flex align-items-center gap-2">
                                    <button id="client-calendar-prev" class="btn btn-outline-secondary btn-sm" title="Semana anterior">
                                        <i class="bi bi-chevron-left"></i>
                                    </button>
                                    <div id="client-calendar-week-label" class="flex-grow-1 text-center fw-medium">Semana</div>
                                    <button id="client-calendar-next" class="btn btn-outline-secondary btn-sm" title="Semana siguiente">
                                        <i class="bi bi-chevron-right"></i>
                                    </button>
                                    <button id="client-calendar-today" class="btn btn-outline-primary btn-sm" title="Ir a hoy">
                                        <i class="bi bi-calendar-check"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-12 col-md-3 text-end">
                                <button id="client-calendar-refresh" class="btn btn-outline-primary d-flex align-items-center gap-2 ms-auto">
                                    <i class="bi bi-arrow-repeat"></i>
                                    <span>Actualizar</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div id="client-calendar-grid" class="calendar-grid-wrapper">
                        <div class="text-center text-muted py-5">
                            <i class="bi bi-calendar3 display-4 mb-3 d-block opacity-50"></i>
                            <p class="mb-0">Cargando calendario...</p>
                        </div>
                    </div>

                    <div id="client-calendar-summary" class="mt-3 d-none">
                        <div class="lt-surface p-3">
                            <div class="d-flex justify-content-around text-center">
                                <div>
                                    <div class="h4 mb-0 text-primary" id="client-summary-horas">0</div>
                                    <small class="text-muted">Horas</small>
                                </div>
                                <div>
                                    <div class="h4 mb-0 text-primary" id="client-summary-clientes">0</div>
                                    <small class="text-muted">Clientes</small>
                                </div>
                                <div>
                                    <div class="h4 mb-0 text-primary" id="client-summary-dias">0</div>
                                    <small class="text-muted">Días</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        return {
            buildDailyAttendanceLayout,
            buildEmployeeCalendarPanelHtml,
            buildClientCalendarPanelHtml
        };
    })();

    global.AttendanceTemplates = AttendanceTemplates;
})(typeof window !== "undefined" ? window : this);
