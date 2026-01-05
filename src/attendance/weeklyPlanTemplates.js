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

    return {
        buildListPanel: buildListPanel
    };
})();
