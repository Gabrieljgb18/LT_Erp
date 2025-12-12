/**
 * Daily Attendance UI
 * Maneja la captura de asistencia diaria basada en el plan y la carga fuera de plan.
 */

(function (global) {
    const AttendanceDailyUI = (() => {
        let state = {
            fecha: "",
            rows: [],
            loading: false
        };
        let reference = { clientes: [], empleados: [] };
        let rootEl = null;
        let pendingFecha = null;
        let pendingFocus = null;

        function resetState(fecha) {
            state = {
                fecha: fecha || getTodayIso(),
                rows: [],
                loading: false
            };
        }

        function render(container) {
            rootEl = container;
            reference = ReferenceService && ReferenceService.get ? ReferenceService.get() : { clientes: [], empleados: [] };
            const initialDate = pendingFecha || getTodayIso();
            resetState(initialDate);
            pendingFecha = null;

            container.innerHTML = buildBaseLayout();
            bindBaseEvents();
            loadPlan(state.fecha);
        }

        function getTodayIso() {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
        }

        function buildBaseLayout() {
            return `
                <div id="attendance-daily-root" class="d-flex flex-column gap-3">
                    <div class="lt-surface lt-surface--subtle p-2">
                        <div class="lt-toolbar">
                            <div class="d-flex align-items-center gap-2 flex-shrink-0">
                                <label class="form-label small fw-semibold text-muted mb-0">Fecha</label>
                                <input type="date" id="attendance-date" class="form-control form-control-sm" value="${state.fecha}" style="width: 140px;">
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

        function bindBaseEvents() {
            const dateInput = rootEl.querySelector("#attendance-date");
            const addBtn = rootEl.querySelector("#attendance-add-extra");

            if (dateInput) {
                dateInput.addEventListener("change", function () {
                    state.fecha = this.value;
                    state.rows = [];
                    renderRows("Cargando...");
                    updateSummary();
                    loadPlan(state.fecha);
                });
            }

            if (addBtn) {
                addBtn.addEventListener("click", function () {
                    addExtraRow();
                });
            }
        }

        function setLoading(isLoading) {
            state.loading = !!isLoading;
            const overlay = rootEl.querySelector("#attendance-loading");
            if (overlay) overlay.classList.toggle("d-none", !isLoading);
        }

        function normalizeRow(row, extra, idx) {
            return {
                uid: (extra ? "extra-" : "plan-") + (idx != null ? idx : Date.now()),
                cliente: row && row.cliente ? String(row.cliente) : "",
                idCliente: row && row.idCliente ? row.idCliente : "",
                empleado: row && row.empleado ? String(row.empleado) : "",
                idEmpleado: row && row.idEmpleado ? row.idEmpleado : "",
                horaPlan: row && row.horaPlan ? String(row.horaPlan) : "",
                horasPlan: row && row.horasPlan !== undefined && row.horasPlan !== null ? row.horasPlan : "",
                asistencia: row && row.asistencia ? true : false,
                horasReales: row && row.horasReales !== undefined && row.horasReales !== null ? row.horasReales : "",
                observaciones: row && row.observaciones ? String(row.observaciones) : "",
                asistenciaRowNumber: row && row.asistenciaRowNumber ? row.asistenciaRowNumber : null,
                idAsistencia: row && (row.idAsistencia != null && row.idAsistencia !== "") ? row.idAsistencia : null,
                fueraDePlan: !!extra || !!(row && row.fueraDePlan)
            };
        }

        function loadPlan(fecha) {
            if (!fecha) {
                if (Alerts) Alerts.showAlert("Elegí una fecha para cargar asistencia.", "warning");
                return;
            }

            state.rows = [];
            renderRows("Cargando...");
            updateSummary();
            setLoading(true);
            // callLatest para evitar respuestas viejas que pisan la vista
            ApiService.callLatest("attendance-plan-" + fecha, "getDailyAttendancePlan", fecha)
                .then(function (rows) {
                    if (rows && rows.ignored) return;
                    const data = Array.isArray(rows) ? rows : [];
                    state.rows = data.map((r, idx) => normalizeRow(r, false, idx));

                    applyPendingFocus();

                    if (!state.rows.length) {
                        // Si no hay plan para el día, ofrecer fila vacía para cargar fuera de plan
                        addExtraRow(true);
                    }
                    renderRows();
                })
                .catch(function (err) {
                    console.error("Error cargando plan diario:", err);
                    state.rows = [];
                    renderRows("No pudimos cargar el plan diario. Intentá de nuevo.");
                    if (Alerts) Alerts.showAlert("Error al cargar plan diario: " + err.message, "danger");
                })
                .finally(function () {
                    setLoading(false);
                    updateSummary();
                });
        }

        function addExtraRow(skipRender) {
            const newRow = normalizeRow({
                asistencia: true
            }, true);
            newRow._autoOpen = true;

            // Colocamos extras arriba para visibilidad inmediata
            state.rows.unshift(newRow);

            if (!skipRender) {
                renderRows();
                updateSummary();
            }
        }

        function renderRows(emptyMessage) {
            const list = rootEl.querySelector("#attendance-cards");
            if (!list) return;

            list.innerHTML = "";

            if (!state.rows.length) {
                const div = document.createElement("div");
                div.className = "text-center text-muted py-4";
                div.textContent = emptyMessage || "No hay plan para la fecha seleccionada. Podés agregar asistencia fuera de plan.";
                list.appendChild(div);
                return;
            }

            const frag = document.createDocumentFragment();

            const isPastDay = isDatePast(state.fecha);

            state.rows.forEach(function (row, idx) {
                const card = document.createElement("div");
                card.className = "card shadow-sm border-0";
                if (row.fueraDePlan) {
                    card.classList.add("border", "border-secondary", "border-opacity-50");
                }

                const clienteSelect = buildClienteSelect(row.uid, row.cliente, !row.fueraDePlan);
                const empleadoSelect = buildEmpleadoSelect(row.uid, row.empleado, !row.fueraDePlan);
                const horasPlanText = formatHorasPlan(row.horasPlan);
                const horaPlanText = formatHoraPlan(row.horaPlan);
                const collapseId = "att-card-" + row.uid;
                const isOpen = row._autoOpen === true; // abrir si se acaba de agregar fuera de plan
                const statusLabel = row.asistencia ? "Asistió" : "No asistió";
                const statusClass = row.asistencia ? "bg-success bg-opacity-75 text-white" : "bg-danger bg-opacity-75 text-white";
                const arrow = isOpen ? "▲" : "▼";

                // Color suave para fechas pasadas según asistencia
                let headerStyle = "";
                let cardStyle = "";
                if (isPastDay) {
                    if (row.asistencia) {
                        cardStyle = "background-color:#f7fff9;border-color:#b7e6c3;";
                        headerStyle = "background-color:#f0fff3;";
                    } else {
                        cardStyle = "background-color:#fff6f6;border-color:#f2c8c8;";
                        headerStyle = "background-color:#fff0f0;";
                    }
                }

                if (cardStyle) {
                    card.setAttribute("style", cardStyle);
                }

                card.innerHTML = `
                    <div class="card-header py-2 px-3 bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 att-card-toggle"
                         style="${headerStyle}"
                         data-bs-toggle="collapse"
                         data-bs-target="#${collapseId}"
                         aria-expanded="${isOpen}"
                         aria-controls="${collapseId}"
                         role="button">
                        <div class="d-flex flex-wrap gap-2 align-items-center">
                            <span class="badge px-2 ${statusClass}">${statusLabel}</span>
                            <span class="fw-semibold">${HtmlHelpers.escapeHtml(row.empleado || "Empleado")}</span>
                            <span class="text-muted">•</span>
                            <span class="fw-semibold text-primary">${HtmlHelpers.escapeHtml(row.cliente || "Cliente")}</span>
                        </div>
                        <div class="d-flex gap-2 align-items-center">
                            ${row.fueraDePlan ? '<span class="badge bg-secondary">Fuera de plan</span>' : '<span class="badge text-bg-success">Plan</span>'}
                            <span class="text-muted fw-semibold" data-role="collapse-arrow" aria-hidden="true">${arrow}</span>
                        </div>
                    </div>
                    <div id="${collapseId}" class="collapse att-collapse ${isOpen ? "show" : ""}">
                        <div class="card-body pt-2 pb-3 px-3">
                            <div class="row g-3">
                                <div class="col-12 col-md-6">
                                    <label class="small text-muted fw-semibold d-block mb-1">Cliente</label>
                                    ${clienteSelect}
                                </div>
                                <div class="col-12 col-md-6">
                                    <label class="small text-muted fw-semibold d-block mb-1">Empleado</label>
                                    ${empleadoSelect}
                                </div>
                            </div>

                            <div class="row g-3 align-items-center mt-1">
                                <div class="col-12 col-md-3">
                                    <div class="small text-muted fw-semibold">Horas planificadas</div>
                                    <div class="fw-semibold">${horasPlanText}</div>
                                    <div class="small text-muted">${horaPlanText || "&nbsp;"}</div>
                                </div>
                                <div class="col-6 col-md-2 text-center">
                                    <label class="small text-muted fw-semibold mb-1 d-block">Asistió</label>
                                    <input type="checkbox" class="form-check-input" data-role="asistencia-check" data-uid="${row.uid}" ${row.asistencia ? "checked" : ""}>
                                </div>
                                <div class="col-6 col-md-3">
                                    <label class="small text-muted fw-semibold mb-1 d-block">Horas reales</label>
                                    <input type="number" step="0.5" min="0" class="form-control form-control-sm text-end" data-role="horas-reales" data-uid="${row.uid}" value="${row.horasReales != null ? HtmlHelpers.escapeHtml(String(row.horasReales)) : ""}">
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="small text-muted fw-semibold mb-1 d-block">Observaciones</label>
                                    <textarea rows="2" class="form-control form-control-sm" data-role="observaciones" data-uid="${row.uid}">${HtmlHelpers.escapeHtml(row.observaciones)}</textarea>
                                </div>
                                <div class="col-12 col-md-1 text-end">
                                    ${row.fueraDePlan ? `<button class="btn btn-sm btn-outline-danger" data-role="remove-row" data-uid="${row.uid}" title="Quitar fila">✕</button>` : '<span class="text-muted small d-inline-block mt-3"> </span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                frag.appendChild(card);
            });

            list.appendChild(frag);
            bindCollapseArrows();
            attachRowEvents();
        }

        function bindCollapseArrows() {
            const collapses = rootEl.querySelectorAll(".att-collapse");
            collapses.forEach(function (col) {
                const targetId = col.id;
                const header = rootEl.querySelector(`[data-bs-target="#${targetId}"]`);
                if (!header) return;
                const arrowEl = header.querySelector('[data-role="collapse-arrow"]');
                if (!arrowEl) return;

                const updateArrow = function () {
                    const isShown = col.classList.contains("show");
                    arrowEl.textContent = isShown ? "▲" : "▼";
                    header.setAttribute("aria-expanded", isShown ? "true" : "false");
                };

                col.addEventListener("shown.bs.collapse", updateArrow);
                col.addEventListener("hidden.bs.collapse", updateArrow);
                updateArrow();
            });
        }

        function buildClienteSelect(uid, selected, disabled) {
            const opts = ['<option value="">Cliente...</option>'];
            let found = false;
            (reference.clientes || []).forEach(cli => {
                const label = cli.razonSocial || cli.nombre || cli.CLIENTE || cli;
                if (!label) return;
                if (label === selected) found = true;
                const sel = label === selected ? " selected" : "";
                opts.push(`<option value="${HtmlHelpers.escapeHtml(label)}"${sel}>${HtmlHelpers.escapeHtml(label)}</option>`);
            });
            if (selected && !found) {
                opts.push(`<option value="${HtmlHelpers.escapeHtml(selected)}" selected>${HtmlHelpers.escapeHtml(selected)}</option>`);
            }
            const disabledAttr = disabled ? "disabled" : "";
            return `<select class="form-select form-select-sm bg-white border" data-role="cliente" data-uid="${uid}" ${disabledAttr}>${opts.join("")}</select>`;
        }

        function buildEmpleadoSelect(uid, selected, disabled) {
            let found = false;
            const optsArr = ['<option value="">Empleado...</option>'];
            (reference.empleados || []).forEach(emp => {
                if (emp === selected) found = true;
                const sel = emp === selected ? " selected" : "";
                optsArr.push(`<option value="${HtmlHelpers.escapeHtml(emp)}"${sel}>${HtmlHelpers.escapeHtml(emp)}</option>`);
            });
            if (selected && !found) {
                optsArr.push(`<option value="${HtmlHelpers.escapeHtml(selected)}" selected>${HtmlHelpers.escapeHtml(selected)}</option>`);
            }
            const opts = optsArr.join("");
            const disabledAttr = disabled ? "disabled" : "";
            return `<select class="form-select form-select-sm bg-white border" data-role="empleado" data-uid="${uid}" ${disabledAttr}>${opts}</select>`;
        }

        function attachRowEvents() {
            rootEl.querySelectorAll('[data-role="cliente"]').forEach(el => {
                el.addEventListener("change", function () {
                    updateRow(this.dataset.uid, "cliente", this.value);
                });
            });

            rootEl.querySelectorAll('[data-role="empleado"]').forEach(el => {
                el.addEventListener("change", function () {
                    updateRow(this.dataset.uid, "empleado", this.value);
                });
            });

            rootEl.querySelectorAll('[data-role="asistencia-check"]').forEach(el => {
                el.addEventListener("change", function () {
                    updateRow(this.dataset.uid, "asistencia", this.checked);
                });
            });

            rootEl.querySelectorAll('[data-role="horas-reales"]').forEach(el => {
                el.addEventListener("input", function () {
                    updateRow(this.dataset.uid, "horasReales", this.value);
                });
            });

            rootEl.querySelectorAll('[data-role="observaciones"]').forEach(el => {
                el.addEventListener("input", function () {
                    updateRow(this.dataset.uid, "observaciones", this.value);
                });
            });

            rootEl.querySelectorAll('[data-role="remove-row"]').forEach(el => {
                el.addEventListener("click", function () {
                    removeRow(this.dataset.uid);
                });
            });
        }

        function updateRow(uid, field, value) {
            const row = state.rows.find(r => r.uid === uid);
            if (!row) return;
            row[field] = value;
            if (field === "cliente") {
                row.idCliente = "";
            }
            if (field === "empleado") {
                row.idEmpleado = "";
            }
            updateSummary();
        }

        function removeRow(uid) {
            const idx = state.rows.findIndex(r => r.uid === uid);
            if (idx === -1) return;
            state.rows.splice(idx, 1);
            renderRows();
            updateSummary();
        }

        function updateSummary() {
            const summaryEl = rootEl.querySelector("#attendance-summary");
            if (!summaryEl) return;

            if (!state.rows.length) {
                summaryEl.innerHTML = "";
                return;
            }

            const clientesAtendidos = new Set();
            let totalHoras = 0;
            let registros = state.rows.length;
            let presentes = 0;

            state.rows.forEach(r => {
                if (r.asistencia) {
                    presentes += 1;
                    if (r.cliente) clientesAtendidos.add(r.cliente);
                    const horas = parseFloat(r.horasReales !== "" ? r.horasReales : r.horasPlan);
                    if (!isNaN(horas)) totalHoras += horas;
                }
            });

            summaryEl.innerHTML = `
                <span class="lt-chip lt-chip--primary">
                    <span class="opacity-75">Clientes</span> <strong>${clientesAtendidos.size}</strong>
                </span>
                <span class="lt-chip lt-chip--success">
                    <span class="opacity-75">Horas</span> <strong>${totalHoras.toFixed(2)}</strong>
                </span>
                <span class="lt-chip lt-chip--muted">
                    <span class="opacity-75">Asistencias</span> <strong>${presentes}/${registros}</strong>
                </span>
            `;
        }

        function formatHorasPlan(val) {
            if (val === undefined || val === null || val === "") return "-";
            const num = Number(val);
            if (!isNaN(num)) {
                return num.toFixed(1) + " hs";
            }
            return HtmlHelpers.escapeHtml(String(val));
        }

        function formatHoraPlan(val) {
            if (!val) return "";
            // Date object
            if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val)) {
                return "Ingreso " + val.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
            }
            const s = String(val);
            const m = s.match(/(\d{1,2}):(\d{2})/);
            if (m) {
                const hh = m[1].padStart(2, "0");
                const mm = m[2];
                return "Ingreso " + hh + ":" + mm;
            }
            return "";
        }

        function renderSummary(records) {
            const headersRow = document.getElementById("grid-headers");
            const tbody = document.getElementById("grid-body");
            if (!headersRow || !tbody) return;

            headersRow.innerHTML = `
                <th>Fecha</th>
                <th class="text-center">Clientes atendidos</th>
                <th class="text-center">Horas totales</th>
                <th class="text-center">Asistencia (real / planificada)</th>
                <th class="text-center">Acciones</th>
            `;

            tbody.innerHTML = "";

            const summaryRows = buildSummaryRows(records);
            if (!summaryRows.length) {
                const tr = document.createElement("tr");
                tr.innerHTML = '<td colspan="5" class="text-center text-muted py-5">No hay asistencias registradas.</td>';
                tbody.appendChild(tr);
                return;
            }

            const frag = document.createDocumentFragment();
            summaryRows.forEach(item => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${HtmlHelpers.escapeHtml(item.fechaLabel)}</strong></td>
                    <td class="text-center">${item.clientes}</td>
                    <td class="text-center">${item.horas.toFixed(2)}</td>
                    <td class="text-center">${item.presentes} / ${item.registros}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-primary" data-action="open-day" data-fecha="${HtmlHelpers.escapeHtml(item.fecha)}">Editar día</button>
                    </td>
                `;
                frag.appendChild(tr);
            });

            tbody.appendChild(frag);

            tbody.querySelectorAll('[data-action="open-day"]').forEach(btn => {
                btn.addEventListener("click", function () {
                    openModalForDate(this.dataset.fecha);
                });
            });
        }

        function buildSummaryRows(records) {
            const map = new Map();
            (records || []).forEach(item => {
                const rec = item.record ? item.record : item;
                const fecha = rec.FECHA || rec.fecha;
                if (!fecha) return;
                const key = String(fecha).trim();
                if (!map.has(key)) {
                    map.set(key, { registros: 0, clientes: new Set(), horas: 0, presentes: 0 });
                }
                const agg = map.get(key);
                agg.registros += 1;
                const asist = rec.ASISTENCIA !== undefined ? rec.ASISTENCIA : rec.asistencia;
                const horasRaw = rec.HORAS !== undefined ? rec.HORAS : rec.horas;
                const cliente = rec.CLIENTE || rec.cliente;

                if (asist === true || asist === "TRUE" || asist === "true" || asist === 1 || asist === "1") {
                    if (cliente) agg.clientes.add(cliente);
                    const horasNum = parseFloat(horasRaw);
                    if (!isNaN(horasNum)) {
                        agg.horas += horasNum;
                    }
                    agg.presentes += 1;
                }
            });

            const result = [];
            map.forEach((val, fecha) => {
                result.push({
                    fecha: fecha,
                    fechaLabel: formatDateLabel(fecha),
                    registros: val.registros,
                    clientes: val.clientes.size,
                    horas: val.horas,
                    presentes: val.presentes
                });
            });

            result.sort((a, b) => a.fecha > b.fecha ? -1 : 1);
            return result;
        }

        function formatDateLabel(fecha) {
            if (!fecha) return "";
            const parts = String(fecha).split("-");
            if (parts.length === 3) {
                const y = Number(parts[0]);
                const m = Number(parts[1]) - 1;
                const d = Number(parts[2]);
                const dt = new Date(y, m, d);
                if (!isNaN(dt)) {
                    return dt.toLocaleDateString("es-AR");
                }
            }
            return fecha;
        }

        function isDatePast(fechaStr) {
            if (!fechaStr) return false;
            const p = fechaStr.split("-");
            if (p.length !== 3) return false;
            const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
            if (isNaN(d)) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return d < today;
        }

        function openModalForDate(fecha) {
            if (!GridManager || !FormManager) return;
            pendingFecha = fecha;

            const formatoSelect = document.getElementById("formato");
            if (formatoSelect) {
                formatoSelect.value = "ASISTENCIA";
            }

            GridManager.openModal("Asistencia del día", function () {
                FormManager.renderForm("ASISTENCIA");
            });
        }

        function openForDate(fecha) {
            if (!rootEl || !fecha) return;
            resetState(fecha);
            const dateInput = rootEl.querySelector("#attendance-date");
            if (dateInput) {
                dateInput.value = fecha;
            }
            renderRows("Cargando...");
            updateSummary();
            loadPlan(fecha);
        }

        function save() {
            const fechaInput = rootEl ? rootEl.querySelector("#attendance-date") : null;
            const fecha = fechaInput ? fechaInput.value : state.fecha;

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

            UiState.setGlobalLoading(true, "Guardando asistencia...");

            const payload = state.rows.map(r => ({
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
            }));

            ApiService.call("saveDailyAttendance", fecha, payload)
                .then(function () {
                    if (Alerts) Alerts.showAlert("Asistencia guardada correctamente.", "success");
                    if (GridManager) GridManager.refreshGrid();
                })
                .catch(function (err) {
                    if (Alerts) Alerts.showAlert("Error al guardar asistencia: " + err.message, "danger");
                })
                .finally(function () {
                    UiState.setGlobalLoading(false);
                });
        }

        function applyPendingFocus() {
            if (!pendingFocus) return;

            const targetEmp = (pendingFocus.empleado || '').toString().toLowerCase().trim();
            const targetCli = (pendingFocus.cliente || '').toString().toLowerCase().trim();

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
                if (pendingFocus.horas != null) matched.horasReales = pendingFocus.horas;
                if (pendingFocus.observaciones != null) matched.observaciones = pendingFocus.observaciones;
            } else if (targetEmp || targetCli) {
                const extra = normalizeRow({
                    cliente: pendingFocus.cliente || '',
                    empleado: pendingFocus.empleado || '',
                    asistencia: true,
                    horasReales: pendingFocus.horas != null ? pendingFocus.horas : '',
                    observaciones: pendingFocus.observaciones || ''
                }, true);
                extra._autoOpen = true;
                state.rows.unshift(extra);
            }

            pendingFocus = null;
        }

        function openForDateWithFocus(fecha, empleado, cliente, extras) {
            pendingFocus = {
                empleado: empleado,
                cliente: cliente,
                horas: extras && extras.horas != null ? extras.horas : null,
                observaciones: extras && extras.observaciones ? extras.observaciones : ''
            };
            openForDate(fecha);
        }

        return {
            render,
            renderSummary,
            openForDate,
            openForDateWithFocus,
            save
        };
    })();

    global.AttendanceDailyUI = AttendanceDailyUI;
})(typeof window !== "undefined" ? window : this);
