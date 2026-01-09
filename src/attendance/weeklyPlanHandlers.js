/**
 * WeeklyPlanPanelHandlers
 * Eventos del plan semanal.
 */
(function (global) {
    const state = global.WeeklyPlanPanelState;
    const actions = global.WeeklyPlanPanelActions;

    function attachListEvents(container) {
        if (state.listEventsController) {
            state.listEventsController.abort();
        }
        state.listEventsController = new AbortController();
        const listSignal = state.listEventsController.signal;
        const onList = (el, evt, handler) => {
            if (!el) return;
            el.addEventListener(evt, handler, { signal: listSignal });
        };

        const checkActive = container.querySelector('#check-active-plans');
        if (checkActive) {
            onList(checkActive, 'change', (e) => {
                const rows = container.querySelectorAll('.plan-row');
                rows.forEach(r => {
                    if (e.target.checked && r.dataset.active === "false") {
                        r.style.display = 'none';
                    } else {
                        r.style.display = '';
                    }
                });
            });
            checkActive.dispatchEvent(new Event('change'));
        }

        const newPlanBtn = container.querySelector('#btn-nuevo-plan');
        if (newPlanBtn) {
            onList(newPlanBtn, 'click', () => {
                if (actions && typeof actions.openNewPlan === 'function') {
                    actions.openNewPlan();
                }
            });
        }

        const editButtons = container.querySelectorAll('.btn-editar-plan');
        editButtons.forEach(btn => {
            onList(btn, 'click', () => {
                const key = btn.dataset ? (btn.dataset.key || '') : '';
                const idCliente = btn.dataset ? (btn.dataset.idCliente || '') : '';
                const clienteLabel = btn.dataset ? (btn.dataset.clienteLabel || '') : '';
                if (!key || !idCliente) return;

                const rows = state.planGroupsCache[key] || [];
                if (actions && typeof actions.switchToDetail === 'function') {
                    actions.switchToDetail(idCliente, clienteLabel, rows, {
                        desde: (key.split('|')[1] || ''),
                        hasta: (key.split('|')[2] || '')
                    });
                }
            });
        });
    }

    function attachDetailEvents() {
        const clienteSelect = document.getElementById("field-CLIENTE");
        if (!clienteSelect) return;
        if (state.detailEventsController) {
            state.detailEventsController.abort();
        }
        state.detailEventsController = new AbortController();
        const detailSignal = state.detailEventsController.signal;
        clienteSelect.addEventListener("change", () => {
            state.currentOriginalVigencia = null;
            global.WeeklyPlanPanelData.fetchWeeklyPlanForClient();
        }, { signal: detailSignal });
    }

    function attachWeeklyPlanHandlers(panel) {
        if (!panel) return;
        if (state.panelEventsController) {
            state.panelEventsController.abort();
        }
        state.panelEventsController = new AbortController();
        const signal = state.panelEventsController.signal;
        panel.addEventListener("click", function (e) {
            const actionBtn = e.target.closest("[data-action]");
            if (!actionBtn) return;
            const action = actionBtn.getAttribute("data-action");

            if (action === "add-plan-row") {
                if (actions && typeof actions.addEmptyPlanRow === 'function') {
                    actions.addEmptyPlanRow();
                }
            } else if (action === "delete-plan-row") {
                const idx = actionBtn.getAttribute("data-idx");
                if (actions && typeof actions.deletePlanRow === 'function') {
                    actions.deletePlanRow(idx);
                }
            } else if (action === "save-weekly-plan") {
                if (actions && typeof actions.saveWeeklyPlan === 'function') {
                    actions.saveWeeklyPlan();
                }
            } else if (action === "delete-weekly-plan") {
                if (actions && typeof actions.deleteWeeklyPlan === "function") {
                    actions.deleteWeeklyPlan();
                }
            }
        }, { signal: signal });
    }

    global.WeeklyPlanPanelHandlers = {
        init: actions && actions.init ? actions.init : function () { },
        setup: actions && actions.setup ? actions.setup : function () { },
        openNewPlan: actions && actions.openNewPlan ? actions.openNewPlan : function () { },
        switchToDetail: actions && actions.switchToDetail ? actions.switchToDetail : function () { },
        attachListEvents: attachListEvents,
        attachDetailEvents: attachDetailEvents,
        attachWeeklyPlanHandlers: attachWeeklyPlanHandlers,
        addEmptyPlanRow: actions && actions.addEmptyPlanRow ? actions.addEmptyPlanRow : function () { },
        deletePlanRow: actions && actions.deletePlanRow ? actions.deletePlanRow : function () { },
        deleteWeeklyPlan: actions && actions.deleteWeeklyPlan ? actions.deleteWeeklyPlan : function () { },
        saveWeeklyPlan: actions && actions.saveWeeklyPlan ? actions.saveWeeklyPlan : function () { },
        vigDesdeInputVal: actions && actions.vigDesdeInputVal ? actions.vigDesdeInputVal : function () { return ""; },
        vigHastaInputVal: actions && actions.vigHastaInputVal ? actions.vigHastaInputVal : function () { return ""; }
    };
})(typeof window !== "undefined" ? window : this);
