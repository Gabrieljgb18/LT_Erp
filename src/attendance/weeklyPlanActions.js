(function (global) {
    const state = global.WeeklyPlanPanelState;

    function init(refData) {
        state.referenceData = refData || { clientes: [], empleados: [] };
    }

    function setup() {
        const container = document.getElementById("form-fields");
        if (container && global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.render === "function") {
            global.WeeklyPlanPanelRender.render(container);
        }
    }

    function captureOpenGroupKeys() {
        const panel = document.getElementById("plan-semanal-panel");
        if (!panel) {
            state.openGroupKeys = new Set();
            return;
        }
        const open = new Set();
        panel.querySelectorAll("[data-emp-key]").forEach(card => {
            const key = card.getAttribute("data-emp-key") || "";
            const collapse = card.querySelector(".collapse");
            if (collapse && collapse.classList.contains("show")) {
                open.add(key);
            }
        });
        state.openGroupKeys = open;
    }

    function vigDesdeInputVal() {
        const el = document.getElementById("plan-vig-desde");
        return el ? el.value : "";
    }

    function vigHastaInputVal() {
        const el = document.getElementById("plan-vig-hasta");
        return el ? el.value : "";
    }

    function getInfoHorasForClient(clienteId) {
        const id = clienteId != null ? String(clienteId).trim() : "";
        if (!id) return null;
        return id === state.lastInfoHorasClientId ? state.lastInfoHoras : null;
    }

    function resolveInfoHorasForClient(clienteId, infoHoras) {
        const id = clienteId != null ? String(clienteId).trim() : "";
        if (infoHoras != null) {
            state.lastInfoHoras = infoHoras;
            state.lastInfoHorasClientId = id;
            return infoHoras;
        }
        if (id && state.lastInfoHorasClientId === id) {
            return state.lastInfoHoras;
        }
        state.lastInfoHoras = null;
        state.lastInfoHorasClientId = id;
        return null;
    }

    function switchToDetail(clienteId, clienteLabel, preloadedRows, originalVigencia) {
        const container = state.currentContainer;
        if (!container) return;

        state.currentOriginalVigencia = originalVigencia || null;
        state.forceNewPlan = false;
        state.openGroupKeys = new Set();

        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.render === "function") {
            global.WeeklyPlanPanelRender.render(container);
        }

        const select = document.getElementById("field-CLIENTE");
        if (select) {
            select.value = String(clienteId || "");
        }

        if (preloadedRows && preloadedRows.length) {
            const fallbackRows = Array.isArray(preloadedRows) ? preloadedRows : [];
            const rowsPromise = (global.WeeklyPlanPanelData && typeof global.WeeklyPlanPanelData.fetchPlanRowsByVigencia === "function")
                ? global.WeeklyPlanPanelData.fetchPlanRowsByVigencia(clienteId, originalVigencia)
                    .then(function (rows) {
                        return Array.isArray(rows) ? rows : [];
                    })
                    .catch(function (err) {
                        if (Alerts && Alerts.notifyError) {
                            Alerts.notifyError("Error actualizando plan semanal", err, { silent: true });
                        } else {
                            console.warn("Error actualizando plan semanal:", err);
                        }
                        return null;
                    })
                : Promise.resolve(fallbackRows);

            const horasPromise = global.WeeklyPlanPanelData.fetchWeeklyHours(clienteLabel, clienteId)
                .then(function (infoHoras) {
                    return resolveInfoHorasForClient(clienteId, infoHoras || null);
                })
                .catch(function (err) {
                    if (Alerts && Alerts.notifyError) {
                        Alerts.notifyError("Error obteniendo info horas", err, { silent: true });
                    } else {
                        console.warn("Error obteniendo info horas:", err);
                    }
                    return resolveInfoHorasForClient(clienteId, null);
                });

            Promise.all([rowsPromise, horasPromise])
                .then(function (results) {
                    const rows = results[0];
                    const infoHoras = results[1];
                    const rowsToRender = rows === null ? fallbackRows : rows;
                    if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.buildWeeklyPlanPanel === "function") {
                        global.WeeklyPlanPanelRender.buildWeeklyPlanPanel(rowsToRender, clienteLabel, infoHoras || null);
                    }
                });
        } else {
            global.WeeklyPlanPanelData.fetchWeeklyPlanForClient();
        }

        const panel = document.getElementById("plan-semanal-panel");
        insertBackButton(panel);
    }

    function insertBackButton(panel) {
        if (!panel) return;
        if (panel.querySelector('[data-weekly-plan-back]')) return;
        const backBtnDiv = document.createElement("div");
        backBtnDiv.className = "mb-3";
        const backBtn = document.createElement("button");
        backBtn.className = "btn btn-outline-secondary btn-sm";
        backBtn.setAttribute("data-weekly-plan-back", "true");
        const backIcon = document.createElement("i");
        backIcon.className = "bi bi-arrow-left me-1";
        backBtn.appendChild(backIcon);
        backBtn.appendChild(document.createTextNode("Volver al listado"));
        backBtn.addEventListener("click", () => {
            if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.renderList === "function") {
                global.WeeklyPlanPanelRender.renderList(state.currentContainer, state.allRecordsCache);
            }
        });
        backBtnDiv.appendChild(backBtn);
        panel.insertBefore(backBtnDiv, panel.firstChild);
    }

    function openNewPlan() {
        const container = state.currentContainer;
        if (!container) return;
        state.currentOriginalVigencia = null;
        state.forceNewPlan = true;
        state.openGroupKeys = new Set();
        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.render === "function") {
            global.WeeklyPlanPanelRender.render(container);
        }
        const panel = document.getElementById("plan-semanal-panel");
        insertBackButton(panel);
    }

    function addEmptyPlanRow() {
        const clienteSelect = document.getElementById("field-CLIENTE");
        if (!clienteSelect) return;

        const clienteId = clienteSelect.value;
        if (!clienteId) {
            if (Alerts) Alerts.showAlert("Seleccioná un cliente primero.", "warning");
            return;
        }
        const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
        const clienteLabel = selectedOption ? selectedOption.textContent : clienteId;
        const defaultHoraEntrada = state.getClientDefaultHoraEntrada
            ? state.getClientDefaultHoraEntrada(clienteId)
            : "";

        const panel = document.getElementById("plan-semanal-panel");
        if (!panel) return;

        captureOpenGroupKeys();

        const currentRows = [];
        const allInputs = panel.querySelectorAll('[id^="plan-row-"]');
        const processedIndices = new Set();

        allInputs.forEach(input => {
            const match = input.id.match(/plan-row-(\d+)-/);
            if (match && !processedIndices.has(match[1])) {
                const idx = match[1];
                processedIndices.add(idx);

                const empleadoSelect = document.getElementById(`plan-row-${idx}-empleado`);
                const diaSelect = document.getElementById(`plan-row-${idx}-dia`);
                const horaInput = document.getElementById(`plan-row-${idx}-horaEntrada`);
                const horasInput = document.getElementById(`plan-row-${idx}-horasPlan`);
                const obsInput = document.getElementById(`plan-row-${idx}-obs`);
                const idInput = document.getElementById(`plan-row-${idx}-id`);
                const selectedOption = empleadoSelect && empleadoSelect.selectedOptions ? empleadoSelect.selectedOptions[0] : null;

                const row = {
                    id: idInput ? idInput.value : "",
                    empleado: selectedOption ? selectedOption.textContent : "",
                    idEmpleado: empleadoSelect ? empleadoSelect.value : "",
                    diaSemana: diaSelect ? diaSelect.value : "",
                    horaEntrada: horaInput ? horaInput.value : "",
                    horasPlan: horasInput ? horasInput.value : "",
                    vigDesde: vigDesdeInputVal(),
                    vigHasta: vigHastaInputVal(),
                    observaciones: obsInput ? obsInput.value : ""
                };

                if (row.empleado || row.diaSemana || row.horaEntrada || row.horasPlan || row.observaciones) {
                    currentRows.push(row);
                }
            }
        });

        currentRows.unshift({
            empleado: "",
            diaSemana: "",
            horaEntrada: defaultHoraEntrada || "",
            horasPlan: "",
            vigDesde: vigDesdeInputVal(),
            vigHasta: vigHastaInputVal(),
            observaciones: ""
        });

        const infoHoras = getInfoHorasForClient(clienteId);
        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.buildWeeklyPlanPanel === "function") {
            global.WeeklyPlanPanelRender.buildWeeklyPlanPanel(currentRows, clienteLabel, infoHoras);
        }

        setTimeout(() => {
            const sinAsignarCollapse = document.querySelector('[id*="collapse-Sin asignar"]');
            if (sinAsignarCollapse && !sinAsignarCollapse.classList.contains("show")) {
                new bootstrap.Collapse(sinAsignarCollapse, { show: true });
            }
        }, 100);
    }

    function deletePlanRow(idx) {
        const clienteSelect = document.getElementById("field-CLIENTE");
        if (!clienteSelect) return;

        const clienteId = clienteSelect.value;
        const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
        const clienteLabel = selectedOption ? selectedOption.textContent : clienteId;
        if (!clienteId) return;

        const panel = document.getElementById("plan-semanal-panel");
        if (!panel) return;

        captureOpenGroupKeys();

        const currentRows = [];
        const allInputs = panel.querySelectorAll('[id^="plan-row-"]');
        const processedIndices = new Set();

        allInputs.forEach(input => {
            const match = input.id.match(/plan-row-(\d+)-/);
            if (match && !processedIndices.has(match[1])) {
                const currentIdx = match[1];
                if (currentIdx === String(idx)) return;

                processedIndices.add(currentIdx);

                const empleadoSelect = document.getElementById(`plan-row-${currentIdx}-empleado`);
                const diaSelect = document.getElementById(`plan-row-${currentIdx}-dia`);
                const horaInput = document.getElementById(`plan-row-${currentIdx}-horaEntrada`);
                const horasInput = document.getElementById(`plan-row-${currentIdx}-horasPlan`);
                const obsInput = document.getElementById(`plan-row-${currentIdx}-obs`);
                const idInput = document.getElementById(`plan-row-${currentIdx}-id`);
                const selectedOption = empleadoSelect && empleadoSelect.selectedOptions ? empleadoSelect.selectedOptions[0] : null;

                const row = {
                    id: idInput ? idInput.value : "",
                    empleado: selectedOption ? selectedOption.textContent : "",
                    idEmpleado: empleadoSelect ? empleadoSelect.value : "",
                    diaSemana: diaSelect ? diaSelect.value : "",
                    horaEntrada: horaInput ? horaInput.value : "",
                    horasPlan: horasInput ? horasInput.value : "",
                    vigDesde: vigDesdeInputVal(),
                    vigHasta: vigHastaInputVal(),
                    observaciones: obsInput ? obsInput.value : ""
                };

                if (row.empleado || row.diaSemana || row.horaEntrada || row.horasPlan || row.observaciones) {
                    currentRows.push(row);
                }
            }
        });

        const infoHoras = getInfoHorasForClient(clienteId);
        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.buildWeeklyPlanPanel === "function") {
            global.WeeklyPlanPanelRender.buildWeeklyPlanPanel(currentRows, clienteLabel, infoHoras);
        }
    }

    function saveWeeklyPlan() {
        const panel = document.getElementById("plan-semanal-panel");
        if (!panel) return;

        const clienteSelect = document.getElementById("field-CLIENTE");
        if (!clienteSelect) return;

        const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
        const cliente = selectedOption ? selectedOption.textContent : clienteSelect.value;
        const idCliente = clienteSelect.value;
        if (!idCliente || !cliente) {
            if (Alerts) Alerts.showAlert("Seleccioná un cliente primero.", "warning");
            return;
        }

        const items = [];
        const allInputs = panel.querySelectorAll('[id^="plan-row-"]');
        const processedIndices = new Set();

        allInputs.forEach(input => {
            const match = input.id.match(/plan-row-(\d+)-/);
            if (match && !processedIndices.has(match[1])) {
                const idx = match[1];
                processedIndices.add(idx);

                const empleadoSelect = document.getElementById(`plan-row-${idx}-empleado`);
                const diaSelect = document.getElementById(`plan-row-${idx}-dia`);
                const horaInput = document.getElementById(`plan-row-${idx}-horaEntrada`);
                const horasInput = document.getElementById(`plan-row-${idx}-horasPlan`);
                const obsInput = document.getElementById(`plan-row-${idx}-obs`);
                const idInput = document.getElementById(`plan-row-${idx}-id`);

                const item = {
                    id: idInput ? idInput.value : "",
                    idCliente: idCliente,
                    cliente: cliente,
                    idEmpleado: empleadoSelect ? empleadoSelect.value : "",
                    empleado: empleadoSelect && empleadoSelect.selectedOptions ? empleadoSelect.selectedOptions[0].textContent : "",
                    diaSemana: diaSelect ? diaSelect.value : "",
                    horaEntrada: horaInput ? horaInput.value : "",
                    horasPlan: horasInput ? horasInput.value : "",
                    observaciones: obsInput ? obsInput.value : "",
                    vigDesde: vigDesdeInputVal(),
                    vigHasta: vigHastaInputVal()
                };

                items.push(item);
            }
        });

        if (!items.length) {
            if (Alerts) Alerts.showAlert("No hay filas para guardar.", "warning");
            return;
        }

        const originalVigencia = state.forceNewPlan ? null : state.currentOriginalVigencia;
        setSavingState(true);

        global.WeeklyPlanPanelData.saveWeeklyPlan(cliente, items, originalVigencia, idCliente)
            .then(function () {
                Alerts && Alerts.showAlert("Plan guardado correctamente.", "success");
                state.forceNewPlan = false;
                global.WeeklyPlanPanelData.reloadList();
            })
            .catch(function (err) {
                if (Alerts && Alerts.notifyError) {
                    Alerts.notifyError("Error guardando plan", err);
                } else if (Alerts && Alerts.showError) {
                    Alerts.showError("Error guardando plan", err);
                } else {
                    console.error("Error guardando plan:", err);
                }
            })
            .finally(function () {
                setSavingState(false);
            });
    }

    function deleteWeeklyPlan() {
        const panel = document.getElementById("plan-semanal-panel");
        if (!panel) return;

        const clienteSelect = document.getElementById("field-CLIENTE");
        if (!clienteSelect) return;

        const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
        const cliente = selectedOption ? selectedOption.textContent : clienteSelect.value;
        const idCliente = clienteSelect.value;
        if (!idCliente || !cliente) {
            if (Alerts) Alerts.showAlert("Seleccioná un cliente primero.", "warning");
            return;
        }

        const originalVigencia = state.currentOriginalVigencia;
        if (!originalVigencia || (!originalVigencia.desde && !originalVigencia.hasta)) {
            if (Alerts) Alerts.showAlert("No hay un plan vigente seleccionado para eliminar.", "warning");
            return;
        }

        const confirmPromise =
            global.UiDialogs && typeof global.UiDialogs.confirm === "function"
                ? global.UiDialogs.confirm({
                    title: "Eliminar plan",
                    message: "¿Querés eliminar este plan semanal? Esta acción no se puede deshacer.",
                    confirmText: "Eliminar",
                    cancelText: "Cancelar",
                    confirmVariant: "danger",
                    icon: "bi-trash3-fill",
                    iconClass: "text-danger"
                })
                : Promise.resolve(confirm("¿Querés eliminar este plan semanal?"));

        confirmPromise.then(function (confirmed) {
            if (!confirmed) return;
            setSavingState(true);
            global.WeeklyPlanPanelData.saveWeeklyPlan(cliente, [], originalVigencia, idCliente)
                .then(function () {
                    Alerts && Alerts.showAlert("Plan eliminado correctamente.", "success");
                    state.forceNewPlan = false;
                    global.WeeklyPlanPanelData.reloadList();
                })
                .catch(function (err) {
                    if (Alerts && Alerts.notifyError) {
                        Alerts.notifyError("Error eliminando plan", err);
                    } else if (Alerts && Alerts.showError) {
                        Alerts.showError("Error eliminando plan", err);
                    } else {
                        console.error("Error eliminando plan:", err);
                    }
                })
                .finally(function () {
                    setSavingState(false);
                });
        });
    }

    function setSavingState(isSaving) {
        const btn = document.getElementById("btn-save-weekly");
        const deleteBtn = document.getElementById("btn-delete-weekly");
        if (!btn && !deleteBtn) return;
        const ui = global.UIHelpers;
        if (isSaving) {
            if (ui && typeof ui.withSpinner === "function") {
                if (btn) ui.withSpinner(btn, true, "Guardando...");
            } else {
                if (btn) btn.disabled = true;
            }
            if (deleteBtn) deleteBtn.disabled = true;
        } else {
            if (ui && typeof ui.withSpinner === "function") {
                if (btn) ui.withSpinner(btn, false);
            } else {
                if (btn) btn.disabled = false;
            }
            if (deleteBtn) deleteBtn.disabled = false;
        }
    }

    global.WeeklyPlanPanelActions = {
        init: init,
        setup: setup,
        openNewPlan: openNewPlan,
        switchToDetail: switchToDetail,
        captureOpenGroupKeys: captureOpenGroupKeys,
        addEmptyPlanRow: addEmptyPlanRow,
        deletePlanRow: deletePlanRow,
        deleteWeeklyPlan: deleteWeeklyPlan,
        saveWeeklyPlan: saveWeeklyPlan,
        vigDesdeInputVal: vigDesdeInputVal,
        vigHastaInputVal: vigHastaInputVal
    };
})(typeof window !== "undefined" ? window : this);
