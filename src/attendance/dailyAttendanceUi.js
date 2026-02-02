/**
 * Daily Attendance UI
 * Orquesta la asistencia diaria usando state/render/handlers/data.
 */

(function (global) {
    const AttendanceDailyUI = (() => {
        const state = global.AttendanceDailyState;
        const render = global.AttendanceDailyRender;
        const handlers = global.AttendanceDailyHandlers;
        const data = global.AttendanceDailyData;

        function ensureDeps() {
            if (!state || !render || !handlers) {
                console.error("AttendanceDaily modules no disponibles");
                return false;
            }
            return true;
        }

        function renderPanel(container) {
            if (!ensureDeps()) return;
            state.setRoot(container);
            const initialDate = state.consumePendingFecha() || state.getTodayIso();
            state.reset(initialDate);

            render.renderLayout(container, state.fecha);
            render.renderRows("Cargando...");

            handlers.bindBaseEvents({
                onDateChange: function (fecha) {
                    state.setFecha(fecha);
                    state.setRows([]);
                    render.renderRows("Cargando...");
                    render.renderDailySummary();
                    loadPlan(state.fecha);
                },
                onAddRow: function () {
                    addExtraRow();
                },
                onSave: function () {
                    save();
                }
            });

            render.setLoading(true);
            if (data && typeof data.loadReference === "function") {
                data.loadReference()
                    .then(function (refs) {
                        state.setReference(refs || { clientes: [], empleados: [] });
                        return loadPlan(state.fecha);
                    })
                    .catch(function () {
                        state.setReference({ clientes: [], empleados: [] });
                        return loadPlan(state.fecha);
                    });
            } else {
                state.setReference({ clientes: [], empleados: [] });
                loadPlan(state.fecha);
            }
        }

        function loadPlan(fecha) {
            if (!fecha) {
                if (Alerts) Alerts.showAlert("Elegí una fecha para cargar asistencia.", "warning");
                return Promise.resolve([]);
            }

            state.setRows([]);
            render.renderRows("Cargando...");
            render.renderDailySummary();
            render.setLoading(true);

            if (!data || typeof data.loadDailyPlan !== "function") {
                render.renderRows("No pudimos cargar el plan diario. Intentá de nuevo.");
                render.setLoading(false);
                return Promise.resolve([]);
            }

            return data.loadDailyPlan(fecha)
                .then(function (rows) {
                    if (rows && rows.ignored) return;
                    const list = Array.isArray(rows) ? rows : [];
                    state.setRows(list.map((r, idx) => state.normalizeRow(r, false, idx)));

                    applyPendingFocus();

                    if (!state.rows.length) {
                        addExtraRow(true);
                    }

                    render.renderRows();
                    handlers.bindRowEvents({
                        onUpdateRow: updateRow,
                        onRemoveRow: removeRow
                    });
                    handlers.bindCollapseArrows();
                    render.renderDailySummary();
                })
                .catch(function (err) {
                    if (Alerts && typeof Alerts.showError === "function") {
                        Alerts.showError("Error al cargar plan diario", err);
                    } else {
                        console.error("Error cargando plan diario:", err);
                        Alerts && Alerts.showAlert("Error al cargar plan diario", "danger");
                    }
                    state.setRows([]);
                    render.renderRows("No pudimos cargar el plan diario. Intentá de nuevo.");
                })
                .finally(function () {
                    render.setLoading(false);
                    render.renderDailySummary();
                });
        }

        function addExtraRow(skipRender) {
            const newRow = state.normalizeRow({ asistencia: true }, true);
            newRow._autoOpen = true;
            state.rows.unshift(newRow);

            if (!skipRender) {
                render.renderRows();
                handlers.bindRowEvents({
                    onUpdateRow: updateRow,
                    onRemoveRow: removeRow
                });
                handlers.bindCollapseArrows();
                render.renderDailySummary();
            }
        }

        function updateRow(uid, patch) {
            const row = state.rows.find(r => r.uid === uid);
            if (!row) return;
            Object.assign(row, patch || {});
            render.renderDailySummary();
        }

        function removeRow(uid) {
            const idx = state.rows.findIndex(r => r.uid === uid);
            if (idx === -1) return;
            const removed = state.rows[idx];
            if (removed && (removed.idAsistencia || removed.asistenciaRowNumber || removed.idCliente || removed.idEmpleado)) {
                if (!Array.isArray(state.removedRows)) state.removedRows = [];
                state.removedRows.push({
                    idAsistencia: removed.idAsistencia || null,
                    asistenciaRowNumber: removed.asistenciaRowNumber || null,
                    idCliente: removed.idCliente || "",
                    idEmpleado: removed.idEmpleado || ""
                });
            }
            state.rows.splice(idx, 1);
            render.renderRows();
            handlers.bindRowEvents({
                onUpdateRow: updateRow,
                onRemoveRow: removeRow
            });
            handlers.bindCollapseArrows();
            render.renderDailySummary();
        }

        function applyPendingFocus() {
            const pending = state.consumePendingFocus();
            if (!pending) return;

            const targetEmp = (pending.empleado || '').toString().toLowerCase().trim();
            const targetCli = (pending.cliente || '').toString().toLowerCase().trim();

            let matched = null;
            if (targetEmp || targetCli) {
                matched = state.rows.find(function (r) {
                    const emp = (r.empleado || '').toString().toLowerCase().trim();
                    const cli = (r.cliente || '').toString().toLowerCase().trim();
                    return emp === targetEmp && cli === targetCli;
                });
            }

            if (matched) {
                matched._autoOpen = true;
                if (pending.horas != null) matched.horasReales = pending.horas;
                if (pending.observaciones != null) matched.observaciones = pending.observaciones;
            } else if (targetEmp || targetCli) {
                const extra = state.normalizeRow({
                    cliente: pending.cliente || '',
                    empleado: pending.empleado || '',
                    asistencia: true,
                    horasReales: pending.horas != null ? pending.horas : '',
                    observaciones: pending.observaciones || ''
                }, true);
                extra._autoOpen = true;
                state.rows.unshift(extra);
            }
        }

        function openModalForDate(fecha) {
            if (!GridManager || !FormManager) return;
            state.setPendingFecha(fecha);

            GridManager.openModal("Asistencia del día", function () {
                FormManager.renderForm("ASISTENCIA");
            });
        }

        function openForDate(fecha) {
            if (!state.rootEl || !fecha) return;
            state.reset(fecha);
            const dateInput = state.rootEl.querySelector("#attendance-date");
            if (dateInput) {
                dateInput.value = fecha;
            }
            render.renderRows("Cargando...");
            render.renderDailySummary();
            loadPlan(fecha);
        }

        function openForDateWithFocus(fecha, empleado, cliente, extras) {
            state.setPendingFocus({
                empleado: empleado,
                cliente: cliente,
                horas: extras && extras.horas != null ? extras.horas : null,
                observaciones: extras && extras.observaciones ? extras.observaciones : ''
            });
            openForDate(fecha);
        }

        function save() {
            const root = state.rootEl;
            const fechaInput = root ? root.querySelector("#attendance-date") : null;
            const fecha = fechaInput ? fechaInput.value : state.fecha;

            if (state.loading) {
                if (Alerts) Alerts.showAlert("Ya estamos guardando la asistencia.", "warning");
                return;
            }

            if (!fecha) {
                if (Alerts) Alerts.showAlert("Elegí una fecha para guardar asistencia.", "warning");
                return;
            }

            if (!state.rows.length) {
                if (Alerts) Alerts.showAlert("No hay filas para guardar.", "warning");
                return;
            }

            const filaIncompleta = state.rows.find(r => !r.cliente || !r.empleado);
            if (filaIncompleta) {
                if (Alerts) Alerts.showAlert("Completá cliente y empleado en todas las filas.", "warning");
                return;
            }
            const filaSinId = state.rows.find(r => !r.idCliente || !r.idEmpleado);
            if (filaSinId) {
                if (Alerts) Alerts.showAlert("Seleccioná cliente y empleado desde la lista para guardar IDs.", "warning");
                return;
            }

            const saveBtn = root ? root.querySelector("#attendance-save") : null;

            state.setLoading(true);
            if (saveBtn) saveBtn.disabled = true;
            UiState.setGlobalLoading(true, "Guardando asistencia...");

            const payload = {
                rows: state.rows.map(r => ({
                    cliente: r.cliente,
                    idCliente: r.idCliente || "",
                    empleado: r.empleado,
                    idEmpleado: r.idEmpleado || "",
                    asistencia: !!r.asistencia,
                    horasReales: r.horasReales !== undefined && r.horasReales !== null ? r.horasReales : "",
                    horasPlan: r.horasPlan !== undefined && r.horasPlan !== null ? r.horasPlan : "",
                    observaciones: r.observaciones || "",
                    asistenciaRowNumber: r.asistenciaRowNumber || null,
                    idAsistencia: r.idAsistencia || null
                })),
                removed: Array.isArray(state.removedRows) ? state.removedRows.slice() : [],
                purgeMissing: true
            };

            if (!data || typeof data.saveDailyAttendance !== "function") {
                if (Alerts) Alerts.showAlert("No se puede guardar la asistencia en este momento.", "danger");
                UiState.setGlobalLoading(false);
                state.setLoading(false);
                if (saveBtn) saveBtn.disabled = false;
                return;
            }

            data.saveDailyAttendance(fecha, payload)
                .then(function (res) {
                    const deletedCount = Array.isArray(res) && typeof res.deleted === "number"
                        ? res.deleted
                        : (res && typeof res.deleted === "number" ? res.deleted : 0);
                    if (Array.isArray(res) && res.length) {
                        const byKey = new Map();
                        res.forEach(function (item) {
                            if (!item) return;
                            const key = String(item.idCliente || '').trim() + '||' + String(item.idEmpleado || '').trim();
                            if (!key || !item.idAsistencia) return;
                            if (!byKey.has(key)) byKey.set(key, item.idAsistencia);
                        });
                        if (byKey.size) {
                            state.rows.forEach(function (row) {
                                const key = String(row.idCliente || '').trim() + '||' + String(row.idEmpleado || '').trim();
                                if (byKey.has(key)) {
                                    row.idAsistencia = byKey.get(key);
                                }
                            });
                        }
                    }
                    if (Alerts) {
                        const msg = deletedCount > 0
                            ? "Asistencia guardada correctamente. Se eliminaron " + deletedCount + " registros."
                            : "Asistencia guardada correctamente.";
                        Alerts.showAlert(msg, "success");
                    }
                    state.removedRows = [];
                    if (GridManager) GridManager.refreshGrid();
                })
                .catch(function (err) {
                    if (Alerts && typeof Alerts.showError === "function") {
                        Alerts.showError("Error al guardar asistencia", err);
                    } else {
                        Alerts && Alerts.showAlert("Error al guardar asistencia", "danger");
                    }
                })
                .finally(function () {
                    UiState.setGlobalLoading(false);
                    state.setLoading(false);
                    if (saveBtn) saveBtn.disabled = false;
                });
        }

        function renderSummary(records) {
            if (!ensureDeps()) return;
            render.renderSummary(records);
            handlers.bindSummaryEvents(openModalForDate);
        }

        return {
            render: renderPanel,
            renderSummary: renderSummary,
            openForDate: openForDate,
            openForDateWithFocus: openForDateWithFocus,
            save: save
        };
    })();

    global.AttendanceDailyUI = AttendanceDailyUI;
})(typeof window !== "undefined" ? window : this);
