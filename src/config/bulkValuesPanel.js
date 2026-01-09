/**
 * Panel de Valores Masivos (empleados/clientes/viáticos/presentismo)
 */
var BulkValuesPanel = (function () {
    const containerId = 'bulk-values-panel';
    let eventsController = null;
    const Dom = window.DomHelpers;

    function render() {
        const container = document.getElementById(containerId);
        if (!container || !Dom) return;

        Dom.clear(container);
        container.appendChild(buildCard());
        bindEvents(container);
    }

    function bindEvents(container) {
        if (!container) return;
        if (eventsController) {
            eventsController.abort();
        }
        eventsController = new AbortController();
        const signal = eventsController.signal;
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('#bulk-apply-btn');
            if (!btn || !container.contains(btn)) return;
            applyValues();
        }, { signal });
    }

    function buildCard() {
        return Dom.el('div', { className: 'card shadow-sm border-0' }, [
            Dom.el('div', { className: 'card-header bg-white py-3' }, [
                Dom.el('h5', { className: 'mb-0 text-primary' }, [
                    Dom.el('i', { className: 'bi bi-sliders me-2' }),
                    'Valores masivos'
                ]),
                Dom.el('small', {
                    className: 'text-muted',
                    text: 'Actualiza en bloque valores de empleados y clientes.'
                })
            ]),
            Dom.el('div', { className: 'card-body' }, [
                Dom.el('div', { className: 'row g-3' }, [
                    buildInputCol('bulk-valor-hora-emp', 'Valor hora (empleados)', 'Ej: 2500'),
                    buildInputCol('bulk-valor-hora-cli', 'Valor hora (clientes)', 'Ej: 3000'),
                    buildInputCol('bulk-viaticos', 'Viáticos (empleados)', 'Ej: 500'),
                    buildInputCol('bulk-pres-media', 'Presentismo media jornada', 'Ej: 1000'),
                    buildInputCol('bulk-pres-full', 'Presentismo jornada completa', 'Ej: 1500'),
                    buildInputCol('bulk-iva', 'IVA (%)', 'Ej: 21')
                ]),
                Dom.el('div', { className: 'd-flex justify-content-end mt-4' },
                    Dom.el('button', {
                        className: 'btn btn-primary',
                        id: 'bulk-apply-btn',
                        type: 'button'
                    }, [
                        Dom.el('i', { className: 'bi bi-arrow-repeat me-2' }),
                        'Aplicar masivo'
                    ])
                )
            ])
        ]);
    }

    function buildInputCol(id, labelText, placeholder) {
        return Dom.el('div', { className: 'col-md-3' }, [
            Dom.el('label', {
                className: 'form-label small text-muted fw-semibold',
                for: id,
                text: labelText
            }),
            Dom.el('input', {
                type: 'number',
                step: '0.01',
                className: 'form-control',
                id: id,
                placeholder: placeholder || ''
            })
        ]);
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

        const data = global.BulkValuesData;
        if (!data || typeof data.applyMassValues !== 'function') {
            Alerts && Alerts.showAlert('No se pudo aplicar valores: servicio no disponible.', 'danger');
            UiState && UiState.setGlobalLoading(false);
            return;
        }
        data.applyMassValues(payload)
            .then((refData) => {
                Alerts && Alerts.showAlert('Valores actualizados masivamente.', 'success');
                if (FormManager && refData) {
                    FormManager.updateReferenceData(refData);
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
