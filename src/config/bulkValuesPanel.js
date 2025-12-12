/**
 * Panel de Valores Masivos (empleados/clientes/viáticos/presentismo)
 */
var BulkValuesPanel = (function () {
    const containerId = 'bulk-values-panel';

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white py-3">
                    <h5 class="mb-0 text-primary">
                        <i class="bi bi-sliders me-2"></i>Valores masivos
                    </h5>
                    <small class="text-muted">Actualiza en bloque valores de empleados y clientes.</small>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">Valor hora (empleados)</label>
                            <input type="number" step="0.01" class="form-control" id="bulk-valor-hora-emp" placeholder="Ej: 2500">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">Valor hora (clientes)</label>
                            <input type="number" step="0.01" class="form-control" id="bulk-valor-hora-cli" placeholder="Ej: 3000">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">Viáticos (empleados)</label>
                            <input type="number" step="0.01" class="form-control" id="bulk-viaticos" placeholder="Ej: 500">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">Presentismo media jornada</label>
                            <input type="number" step="0.01" class="form-control" id="bulk-pres-media" placeholder="Ej: 1000">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">Presentismo jornada completa</label>
                            <input type="number" step="0.01" class="form-control" id="bulk-pres-full" placeholder="Ej: 1500">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">IVA (%)</label>
                            <input type="number" step="0.01" class="form-control" id="bulk-iva" placeholder="Ej: 21">
                        </div>
                    </div>

                    <div class="d-flex justify-content-end mt-4">
                        <button class="btn btn-primary" id="bulk-apply-btn">
                            <i class="bi bi-arrow-repeat me-2"></i>Aplicar masivo
                        </button>
                    </div>
                </div>
            </div>
        `;

        const btn = document.getElementById('bulk-apply-btn');
        if (btn) {
            btn.addEventListener('click', applyValues);
        }
    }

    function applyValues() {
        const payload = {
            valorHoraEmpleado: getInputValue('bulk-valor-hora-emp'),
            valorHoraCliente: getInputValue('bulk-valor-hora-cli'),
            viaticos: getInputValue('bulk-viaticos'),
            presentismoMedia: getInputValue('bulk-pres-media'),
            presentismoCompleta: getInputValue('bulk-pres-full'),
            ivaPorcentaje: getInputValue('bulk-iva')
        };

        UiState && UiState.setGlobalLoading(true, 'Aplicando valores...');

        ApiService.call('applyMassValues', payload)
            .then(() => {
                Alerts && Alerts.showAlert('Valores actualizados masivamente.', 'success');
                if (ReferenceService) {
                    ReferenceService.load().then(() => {
                        if (FormManager) {
                            FormManager.updateReferenceData(ReferenceService.get());
                        }
                    });
                }
            })
            .catch(err => {
                Alerts && Alerts.showAlert('Error al aplicar valores: ' + err.message, 'danger');
            })
            .finally(() => {
                UiState && UiState.setGlobalLoading(false);
            });
    }

    function getInputValue(id) {
        const el = document.getElementById(id);
        if (!el) return '';
        const v = el.value;
        return v === '' ? '' : v;
    }

    return {
        render
    };
})();
