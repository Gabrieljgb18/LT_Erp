/**
 * WeeklyPlanPanelData
 * Carga de datos del plan semanal.
 */
(function (global) {
    const state = global.WeeklyPlanPanelState;
    const Dom = state && state.Dom ? state.Dom : global.DomHelpers;

    function fetchWeeklyPlanForClient() {
        const container = document.getElementById("plan-semanal-cards-container");
        const clienteSelect = document.getElementById("field-CLIENTE");
        const targetId = container ? "plan-semanal-cards-container" : "plan-semanal-panel";

        if (!clienteSelect) return;

        const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
        const idCliente = clienteSelect.value;
        const cliente = selectedOption ? selectedOption.textContent : '';
        if (!idCliente) {
            if (container) {
                if (Dom && typeof Dom.clear === 'function') {
                    Dom.clear(container);
                } else {
                    container.textContent = '';
                }
            }
            return;
        }

        UiState.renderLoading(
            targetId,
            "",
            "Cargando plan de " + cliente + "..."
        );

        global.ApiService.callLatest('weekly-plan-' + idCliente, 'getWeeklyPlanForClient', '', idCliente)
            .then(function (rows) {
                if (rows && rows.ignored) return;
                const planRows = Array.isArray(rows) ? rows : [];
                const currentClienteEl = document.getElementById("field-CLIENTE");
                const currentOption = currentClienteEl && currentClienteEl.selectedOptions ? currentClienteEl.selectedOptions[0] : null;
                const selectedId = currentClienteEl ? currentClienteEl.value : '';
                const currentCliente = currentOption ? currentOption.textContent : '';
                if (!selectedId || selectedId !== idCliente) return;

                if (!planRows.length) {
                    state.currentOriginalVigencia = null;
                    state.forceNewPlan = true;
                }

                let rowsToRender = planRows;
                if (state.forceNewPlan && planRows.length) {
                    rowsToRender = planRows.map(function (row) {
                        return Object.assign({}, row, {
                            ID: '',
                            id: '',
                            vigDesde: '',
                            vigHasta: ''
                        });
                    });
                    state.currentOriginalVigencia = null;
                } else if (planRows.length) {
                    const first = planRows[0];
                    const vigDesde = state.formatDateInput(first["VIGENTE DESDE"] || first.vigDesde);
                    const vigHasta = state.formatDateInput(first["VIGENTE HASTA"] || first.vigHasta);
                    state.currentOriginalVigencia = { desde: vigDesde, hasta: vigHasta };
                }

                state.lastInfoHorasClientId = idCliente;

                return global.ApiService.callLatest('weekly-hours-' + idCliente, 'getClientWeeklyRequestedHours', currentCliente, idCliente)
                    .then(function (infoHoras) {
                        if (infoHoras && infoHoras.ignored) return;
                        state.lastInfoHoras = infoHoras || null;
                        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.buildWeeklyPlanPanel === 'function') {
                            global.WeeklyPlanPanelRender.buildWeeklyPlanPanel(rowsToRender, currentCliente, infoHoras || null);
                        }
                    })
                    .catch(function (err2) {
                        if (Alerts && Alerts.notifyError) {
                            Alerts.notifyError('Error obteniendo info horas', err2, { silent: true });
                        } else {
                            console.warn('Error obteniendo info horas:', err2);
                        }
                        state.lastInfoHoras = null;
                        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.buildWeeklyPlanPanel === 'function') {
                            global.WeeklyPlanPanelRender.buildWeeklyPlanPanel(rowsToRender, currentCliente, null);
                        }
                    });
            })
            .catch(function (err) {
                if (Alerts && Alerts.notifyError) {
                    Alerts.notifyError('Error cargando plan semanal', err);
                } else if (Alerts && Alerts.showError) {
                    Alerts.showError('Error cargando plan semanal', err);
                } else {
                    console.error('Error cargando plan:', err);
                }
            });
    }

    function normalizePlanRecord(item) {
        const r = item && item.record ? item.record : (item || {});
        const idCliente = r.ID_CLIENTE || r.idCliente || "";
        const idEmpleado = r.ID_EMPLEADO || r.idEmpleado || "";
        if (!idCliente || !idEmpleado) return null;

        let clienteName = state.getClientNameById ? state.getClientNameById(idCliente) : "";
        if (!clienteName) {
            clienteName = r.cliente || r.CLIENTE || r.Cliente || "";
        }
        if (typeof clienteName === "object" && clienteName !== null) {
            if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getClientDisplayName === "function") {
                clienteName = DomainHelpers.getClientDisplayName(clienteName);
            } else {
                clienteName = clienteName.nombre || clienteName.razonSocial || clienteName.toString();
            }
        }

        const vigDesde = state.formatDateInput(r["VIGENTE DESDE"] || r.vigDesde);
        const vigHasta = state.formatDateInput(r["VIGENTE HASTA"] || r.vigHasta);
        const horasValue = r["HORAS PLAN"] || r.HORAS_PLAN || r.horasPlan || 0;
        const horas = parseFloat(horasValue);
        const dia = r["DIA SEMANA"] || r.DIA_SEMANA || r.diaSemana || r["DÍA DE LA SEMANA"];

        return {
            id: r.ID || r.id,
            cliente: clienteName || "",
            idCliente: idCliente || "",
            empleado: r.EMPLEADO || r.empleado || r.Empleado,
            idEmpleado: idEmpleado || "",
            diaSemana: dia,
            horaEntrada: r["HORA ENTRADA"] || r.HORA_ENTRADA || r.horaEntrada,
            horasPlan: horas,
            observaciones: r.OBSERVACIONES || r.observaciones,
            vigDesde: vigDesde,
            vigHasta: vigHasta,
            originalRecord: r
        };
    }

    function matchesVigencia(rowDesde, rowHasta, targetDesde, targetHasta) {
        const rowFrom = rowDesde || "";
        const rowTo = rowHasta || "";
        const targetFrom = targetDesde || "";
        const targetTo = targetHasta || "";
        if (!targetFrom && !targetTo) {
            return !rowFrom && !rowTo;
        }
        return rowFrom === targetFrom && rowTo === targetTo;
    }

    function fetchPlanRowsByVigencia(idCliente, originalVigencia) {
        if (!global.AttendanceService || typeof global.AttendanceService.searchRecords !== "function") {
            return Promise.resolve([]);
        }
        const targetId = idCliente != null ? String(idCliente).trim() : "";
        if (!targetId) return Promise.resolve([]);

        const rawDesde = originalVigencia
            ? (originalVigencia.desde || originalVigencia.vigDesde || originalVigencia["VIGENTE DESDE"] || "")
            : "";
        const rawHasta = originalVigencia
            ? (originalVigencia.hasta || originalVigencia.vigHasta || originalVigencia["VIGENTE HASTA"] || "")
            : "";
        const targetDesde = state.formatDateInput(rawDesde);
        const targetHasta = state.formatDateInput(rawHasta);

        return global.AttendanceService.searchRecords("ASISTENCIA_PLAN", "")
            .then(function (records) {
                if (records && records.ignored) return [];
                const list = Array.isArray(records) ? records : [];
                const rows = [];
                list.forEach(function (item) {
                    const normalized = normalizePlanRecord(item);
                    if (!normalized) return;
                    if (String(normalized.idCliente || "").trim() !== targetId) return;
                    const rowDesde = state.formatDateInput(normalized.vigDesde);
                    const rowHasta = state.formatDateInput(normalized.vigHasta);
                    if (!matchesVigencia(rowDesde, rowHasta, targetDesde, targetHasta)) return;
                    rows.push(normalized);
                });
                return rows;
            });
    }

    function fetchWeeklyHours(clienteLabel, idCliente) {
        return global.ApiService.callLatest('weekly-hours-' + idCliente, 'getClientWeeklyRequestedHours', clienteLabel, idCliente);
    }

    function ensureReferenceData() {
        if (!global.ReferenceService || typeof global.ReferenceService.ensureLoaded !== 'function') {
            console.warn('ReferenceService.ensureLoaded no disponible');
            return Promise.resolve(state.referenceData || {});
        }
        return global.ReferenceService.ensureLoaded()
            .then(() => {
                const ref = global.ReferenceService.get();
                if (ref) state.referenceData = ref;
                return ref || {};
            })
            .catch((err) => {
                if (Alerts && Alerts.notifyError) {
                    Alerts.notifyError('Error cargando referencias', err, { silent: true });
                } else {
                    console.warn('Error cargando referencia:', err);
                }
                return state.referenceData || {};
            });
    }

    function reloadList() {
        if (!state.currentContainer) return;
        if (typeof EmptyState !== 'undefined' && EmptyState) {
            EmptyState.render(state.currentContainer, { variant: 'loading', message: 'Actualizando lista...' });
        } else {
            state.currentContainer.textContent = 'Actualizando lista...';
        }
        AttendanceService.searchRecords("ASISTENCIA_PLAN", "")
            .then(function (records) {
                if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.renderList === 'function') {
                    global.WeeklyPlanPanelRender.renderList(state.currentContainer, records || []);
                }
            })
            .catch(function (err) {
                if (Alerts && Alerts.notifyError) {
                    Alerts.notifyError('Error al actualizar la lista', err, { container: state.currentContainer });
                } else {
                    console.error("Error recargando lista:", err);
                    if (state.currentContainer) {
                        if (typeof EmptyState !== 'undefined' && EmptyState) {
                            EmptyState.render(state.currentContainer, {
                                variant: 'error',
                                title: 'Error al actualizar',
                                message: 'No se pudo actualizar la lista.'
                            });
                        } else {
                            state.currentContainer.textContent = 'Error al actualizar la lista.';
                        }
                    }
                }
            });
    }

    function saveWeeklyPlan(cliente, items, originalVigencia, idCliente) {
        return AttendanceService.saveWeeklyPlanForClient(cliente, items, originalVigencia, idCliente);
    }

    global.WeeklyPlanPanelData = {
        fetchWeeklyPlanForClient: fetchWeeklyPlanForClient,
        fetchPlanRowsByVigencia: fetchPlanRowsByVigencia,
        fetchWeeklyHours: fetchWeeklyHours,
        ensureReferenceData: ensureReferenceData,
        reloadList: reloadList,
        saveWeeklyPlan: saveWeeklyPlan
    };
})(typeof window !== "undefined" ? window : this);
