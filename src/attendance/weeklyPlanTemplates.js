/**
 * Weekly Plan Templates
 */
var WeeklyPlanTemplates = (function () {
    function buildListPanel(rowsHtml) {
        const body = rowsHtml || "";
        return `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Planes de Asistencia Semanal</h5>
                <div class="d-flex gap-2 align-items-center">
                    <div class="form-check form-switch mb-0">
                        <input class="form-check-input" type="checkbox" id="check-active-plans" checked>
                        <label class="form-check-label small" for="check-active-plans">Solo vigentes</label>
                    </div>
                    <button class="btn btn-primary btn-sm" id="btn-nuevo-plan"><i class="bi bi-plus-lg me-1"></i>Nuevo Plan</button>
                </div>
            </div>

            <div class="card shadow-sm border-0">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Cliente</th>
                                    <th>Vigencia</th>
                                    <th class="text-center">Horas Semanales</th>
                                    <th>Días Programados</th>
                                    <th class="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>${body}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    function buildEditorWrapperStart(clienteHtml) {
        return `
            <div class="mt-2 p-3 lt-surface lt-surface--subtle">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <div class="fw-bold mb-1 text-primary"><i class="bi bi-calendar-week me-1"></i>Plan semanal del cliente</div>
                        <div class="small mb-2">Cliente: <strong class="text-primary-emphasis">${clienteHtml}</strong></div>
                    </div>
                </div>
        `;
    }

    function buildEditorWrapperEnd() {
        return `
            </div>
        `;
    }

    function buildEditorTopSection(horasHtml) {
        const hoursBlock = horasHtml || "<div></div>";
        return `
            <div class="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2">
                ${hoursBlock}
                <button type="button" class="btn btn-sm btn-outline-secondary lt-btn-compact text-nowrap" data-action="add-plan-row">
                    <i class="bi bi-plus-lg me-1"></i>Agregar día
                </button>
            </div>
        `;
    }

    function buildEmployeeCardStart(data) {
        const opts = data || {};
        return `
            <div class="card shadow-sm border-0" data-emp-key="${opts.empKey}">
                <div class="card-header py-2 px-3 bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 lt-clickable"
                    data-bs-toggle="collapse" data-bs-target="#${opts.collapseId}"
                    aria-expanded="${opts.isOpen}" aria-controls="${opts.collapseId}" role="button">
                    <div class="d-flex flex-wrap gap-2 align-items-center">
                        <span class="fw-semibold text-dark"><i class="bi bi-person-circle me-1"></i>${opts.empleadoLabel}</span>
                        <span class="badge bg-primary bg-opacity-75">${opts.diasLabel}</span>
                        <span class="badge text-bg-success">${opts.totalHoras} hs totales</span>
                    </div>
                    <div class="d-flex gap-2 align-items-center">
                        <span class="text-muted small">${opts.activeDays} día(s)</span>
                        <span class="text-muted fw-semibold" data-role="collapse-arrow">${opts.arrowLabel}</span>
                    </div>
                </div>
                <div id="${opts.collapseId}" class="collapse ${opts.isOpen ? "show" : ""}">
                    <div class="card-body pt-2 pb-3 px-3">
        `;
    }

    function buildEmployeeCardEnd() {
        return `
                    </div>
                </div>
            </div>
        `;
    }

    function buildPlanRowCard(data) {
        const opts = data || {};
        return `
            <div class="lt-surface lt-surface--subtle p-3 mb-2">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex gap-2 align-items-center">
                        <span class="badge bg-primary bg-opacity-75 text-white">Plan</span>
                        <span class="fw-semibold">${opts.diaLabel}</span>
                        ${opts.horasLabel}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger lt-btn-icon" data-action="delete-plan-row" data-idx="${opts.originalIdx}"><i class="bi bi-trash"></i></button>
                </div>
                <div class="row g-2">
                    <div class="col-12 col-md-6">
                        <label class="small text-muted fw-semibold d-block mb-1">Empleado</label>
                        <select class="form-select form-select-sm bg-white border" id="${opts.rowId}-empleado">${opts.empleadoOptions}</select>
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="small text-muted fw-semibold d-block mb-1">Día</label>
                        <select class="form-select form-select-sm text-center bg-white border" id="${opts.rowId}-dia">${opts.diaOptions}</select>
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="small text-muted fw-semibold d-block mb-1">Hora entrada</label>
                        <input type="time" class="form-control form-control-sm text-center" id="${opts.rowId}-horaEntrada" value="${opts.horaEntrada}" step="1800">
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="small text-muted fw-semibold d-block mb-1">Horas plan</label>
                        <input type="number" step="0.5" min="0" class="form-control form-control-sm text-end" id="${opts.rowId}-horasPlan" value="${opts.horasPlan}">
                    </div>
                    <div class="col-12 col-md-6">
                        <label class="small text-muted fw-semibold d-block mb-1">Observaciones</label>
                        <input type="text" class="form-control form-control-sm" id="${opts.rowId}-obs" value="${opts.observaciones}">
                    </div>
                    <input type="hidden" id="${opts.rowId}-id" value="${opts.recordId}">
                </div>
            </div>
        `;
    }

    function buildEditorFooter() {
        return `
            <div class="d-flex justify-content-end align-items-center mt-3 pt-3 border-top">
                <button type="button" class="btn btn-sm btn-success lt-btn-compact" data-action="save-weekly-plan" id="btn-save-weekly">
                    <i class="bi bi-save2 me-1"></i>Guardar plan del cliente
                </button>
            </div>
        `;
    }

    return {
        buildListPanel: buildListPanel,
        buildEditorWrapperStart: buildEditorWrapperStart,
        buildEditorWrapperEnd: buildEditorWrapperEnd,
        buildEditorTopSection: buildEditorTopSection,
        buildEmployeeCardStart: buildEmployeeCardStart,
        buildEmployeeCardEnd: buildEmployeeCardEnd,
        buildPlanRowCard: buildPlanRowCard,
        buildEditorFooter: buildEditorFooter
    };
})();
