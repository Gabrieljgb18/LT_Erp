/**
 * Weekly Plan Panel
 * UI para gestión de planificación semanal de asistencia
 */

(function (global) {
    const WeeklyPlanPanel = (() => {
        let referenceData = { clientes: [], empleados: [] };

        function init(refData) {
            referenceData = refData;
        }

        function setup() {
            const container = document.getElementById("form-fields");
            if (!container) return;

            let panel = document.getElementById("plan-semanal-panel");
            if (!panel) {
                panel = document.createElement("div");
                panel.id = "plan-semanal-panel";
                panel.className = "mt-2";
                container.appendChild(panel);
            }

            panel.innerHTML =
                '<div class="mt-2 p-2 border rounded bg-light">' +
                '<div class="small fw-bold mb-1">Plan semanal del cliente</div>' +
                '<div class="small text-muted">Elegí un cliente para ver y editar todas las asignaciones semanales de una sola vez.</div>' +
                '</div>';

            const clienteSelect = document.getElementById("field-CLIENTE");
            if (clienteSelect) {
                clienteSelect.addEventListener("change", fetchWeeklyPlanForClient);
            }
        }

        function fetchWeeklyPlanForClient() {
            const panel = document.getElementById("plan-semanal-panel");
            const clienteSelect = document.getElementById("field-CLIENTE");
            if (!panel || !clienteSelect) return;

            const cliente = clienteSelect.value;
            if (!cliente) {
                UiState.renderLoading(
                    "plan-semanal-panel",
                    "Plan semanal del cliente",
                    "Elegí un cliente para ver su plan."
                );
                return;
            }

            UiState.renderLoading(
                "plan-semanal-panel",
                "Plan semanal del cliente",
                "Cargando plan de <strong>" + HtmlHelpers.escapeHtml(cliente) + "</strong>..."
            );

            ApiService.callLatest('weekly-plan-' + cliente, 'getWeeklyPlanForClient', cliente)
                .then(function (rows) {
                    if (rows && rows.ignored) return;
                    const planRows = Array.isArray(rows) ? rows : [];
                    const currentClienteEl = document.getElementById("field-CLIENTE");
                    const currentCliente = currentClienteEl ? currentClienteEl.value : '';
                    if (currentCliente !== cliente) return;

                    return ApiService.callLatest('weekly-hours-' + cliente, 'getClientWeeklyRequestedHours', cliente)
                        .then(function (infoHoras) {
                            if (infoHoras && infoHoras.ignored) return;
                            buildWeeklyPlanPanel(planRows, cliente, infoHoras || null);
                        })
                        .catch(function (err2) {
                            console.error("Error obteniendo horas pedidas:", err2);
                            buildWeeklyPlanPanel(planRows, cliente, null);
                        });
                })
                .catch(function (err) {
                    UiState.renderLoading(
                        "plan-semanal-panel",
                        "Plan semanal del cliente",
                        "Error al cargar plan: " + HtmlHelpers.escapeHtml(err.message)
                    );
                });
        }

        function buildWeeklyPlanPanel(rows, cliente, infoHoras) {
            const panel = document.getElementById("plan-semanal-panel");
            if (!panel) return;

            if (!rows.length) {
                rows = [{
                    empleado: "",
                    diaSemana: "",
                    horaEntrada: "",
                    horasPlan: "",
                    activo: true,
                    observaciones: ""
                }];
            }

            let html = "";
            html += '<div class="mt-2 p-2 border rounded bg-light">';
            html += '<div class="small fw-bold mb-1">Plan semanal del cliente</div>';
            html +=
                '<div class="small mb-2">Cliente: <strong>' +
                HtmlHelpers.escapeHtml(cliente) +
                "</strong></div>";

            if (infoHoras) {
                const partes = [];
                const pushSiTieneHoras = (label, valor) => {
                    const num = Number(valor || 0);
                    if (num > 0) {
                        partes.push(label + ': <strong>' + num + ' hs</strong>');
                    }
                };

                pushSiTieneHoras('Lu', infoHoras.lunes);
                pushSiTieneHoras('Ma', infoHoras.martes);
                pushSiTieneHoras('Mi', infoHoras.miercoles);
                pushSiTieneHoras('Ju', infoHoras.jueves);
                pushSiTieneHoras('Vi', infoHoras.viernes);
                pushSiTieneHoras('Sa', infoHoras.sabado);
                pushSiTieneHoras('Do', infoHoras.domingo);

                if (partes.length) {
                    html +=
                        '<div class="small text-muted mb-2">' +
                        'Horas contratadas · ' +
                        partes.join(' · ') +
                        '</div>';
                }
            }

            html += '<div class="table-responsive">';
            html +=
                '<table class="table table-sm table-bordered align-middle mb-2">' +
                "<thead>" +
                "<tr>" +
                '<th class="small">Empleado</th>' +
                '<th class="small text-center">Día</th>' +
                '<th class="small text-center">Hora entrada</th>' +
                '<th class="small text-center">Horas plan</th>' +
                '<th class="small text-center">Activo</th>' +
                '<th class="small">Observaciones</th>' +
                '<th class="small text-center" style="width:60px;">Acciones</th>' +
                "</tr>" +
                "</thead><tbody></tbody></table></div>";

            html +=
                '<div class="d-flex justify-content-between align-items-center mt-2">' +
                '<button type="button" class="btn btn-outline-secondary btn-sm btn-app" ' +
                'data-action="add-plan-row">+ Agregar fila</button>' +
                '<button type="button" class="btn btn-success btn-sm btn-app" ' +
                'data-action="save-weekly-plan">Guardar plan del cliente</button>' +
                "</div>";

            html += "</div>";

            panel.innerHTML = html;

            const tbody = panel.querySelector("tbody");
            if (tbody) {
                const frag = document.createDocumentFragment();
                rows.forEach(function (r, idx) {
                    const rowId = "plan-row-" + idx;
                    const empleadoOptions = HtmlHelpers.getEmpleadoOptionsHtml(r.empleado || "", referenceData.empleados);
                    const diaOptions = HtmlHelpers.getDiaOptionsHtml(r.diaSemana || "");
                    const checkedActivo = r.activo ? "checked" : "";
                    const horaFormatted = HtmlHelpers.formatHoraEntradaForInput(r.horaEntrada);

                    const tr = document.createElement("tr");
                    tr.setAttribute("data-idx", idx);
                    tr.innerHTML =
                        "<td>" +
                        '<select class="form-select form-select-sm" ' +
                        'id="' + rowId + '-empleado">' +
                        empleadoOptions +
                        "</select>" +
                        "</td>" +
                        "<td>" +
                        '<select class="form-select form-select-sm text-center" ' +
                        'id="' + rowId + '-dia">' +
                        diaOptions +
                        "</select>" +
                        "</td>" +
                        "<td>" +
                        '<input type="time" class="form-control form-control-sm text-center" ' +
                        'id="' + rowId + '-hora" value="' +
                        HtmlHelpers.escapeHtml(horaFormatted) +
                        '" step="1800">' +
                        "</td>" +
                        "<td>" +
                        '<input type="number" step="0.5" min="0" ' +
                        'class="form-control form-control-sm text-end" ' +
                        'id="' + rowId + '-horas" value="' +
                        HtmlHelpers.escapeHtml(r.horasPlan != null ? String(r.horasPlan) : "") +
                        '">' +
                        "</td>" +
                        "<td class='text-center'>" +
                        '<input type="checkbox" class="form-check-input" ' +
                        'id="' + rowId + '-activo" ' + checkedActivo + ">" +
                        "</td>" +
                        "<td>" +
                        '<input type="text" class="form-control form-control-sm" ' +
                        'id="' + rowId + '-obs" value="' +
                        HtmlHelpers.escapeHtml(r.observaciones || "") +
                        '">' +
                        "</td>" +
                        "<td class='text-center'>" +
                        '<button type="button" class="btn btn-outline-danger btn-sm" ' +
                        'data-action="delete-plan-row" data-idx="' + idx + '">🗑️</button>' +
                        "</td>";

                    frag.appendChild(tr);
                });
                tbody.appendChild(frag);
            }

            attachWeeklyPlanHandlers(panel);
        }

        function attachWeeklyPlanHandlers(panel) {
            panel.addEventListener("click", function (e) {
                const target = e.target;
                const action = target.getAttribute("data-action");

                if (action === "add-plan-row") {
                    addEmptyPlanRow();
                } else if (action === "delete-plan-row") {
                    const idx = target.getAttribute("data-idx");
                    deletePlanRow(idx);
                } else if (action === "save-weekly-plan") {
                    saveWeeklyPlan();
                }
            });
        }

        function addEmptyPlanRow() {
            const panel = document.getElementById("plan-semanal-panel");
            if (!panel) return;

            const tbody = panel.querySelector("tbody");
            if (!tbody) return;

            const idx = tbody.querySelectorAll("tr").length;
            const rowId = "plan-row-" + idx;

            const tr = document.createElement("tr");
            tr.setAttribute("data-idx", idx);

            tr.innerHTML =
                "<td>" +
                '<select class="form-select form-select-sm" id="' + rowId + '-empleado">' +
                HtmlHelpers.getEmpleadoOptionsHtml("", referenceData.empleados) +
                "</select>" +
                "</td>" +
                "<td>" +
                '<select class="form-select form-select-sm text-center" id="' + rowId + '-dia">' +
                HtmlHelpers.getDiaOptionsHtml("") +
                "</select>" +
                "</td>" +
                "<td>" +
                '<input type="time" class="form-control form-control-sm text-center" ' +
                'id="' + rowId + '-hora" step="1800">' +
                "</td>" +
                "<td>" +
                '<input type="number" step="0.5" min="0" ' +
                'class="form-control form-control-sm text-end" ' +
                'id="' + rowId + '-horas">' +
                "</td>" +
                "<td class='text-center'>" +
                '<input type="checkbox" class="form-check-input" ' +
                'id="' + rowId + '-activo" checked>' +
                "</td>" +
                "<td>" +
                '<input type="text" class="form-control form-control-sm" ' +
                'id="' + rowId + '-obs">' +
                "</td>" +
                "<td class='text-center'>" +
                '<button type="button" class="btn btn-outline-danger btn-sm" ' +
                'data-action="delete-plan-row" data-idx="' + idx + '">🗑️</button>' +
                "</td>";

            tbody.appendChild(tr);
        }

        function deletePlanRow(idx) {
            const panel = document.getElementById("plan-semanal-panel");
            if (!panel) return;

            const tbody = panel.querySelector("tbody");
            if (!tbody) return;

            const tr = tbody.querySelector('tr[data-idx="' + idx + '"]');
            if (tr) {
                tr.remove();
            }
        }

        function saveWeeklyPlan() {
            const clienteSelect = document.getElementById("field-CLIENTE");
            if (!clienteSelect) return;

            const cliente = clienteSelect.value;
            if (!cliente) {
                if (Alerts) Alerts.showAlert("Seleccioná un cliente primero.", "warning");
                return;
            }

            const panel = document.getElementById("plan-semanal-panel");
            if (!panel) return;

            const tbody = panel.querySelector("tbody");
            if (!tbody) return;

            const rows = Array.from(tbody.querySelectorAll("tr"));
            const items = rows.map(function (tr) {
                const idx = tr.getAttribute("data-idx");
                const empleadoSelect = document.getElementById(`plan-row-${idx}-empleado`);
                const diaSelect = document.getElementById(`plan-row-${idx}-dia`);
                const horaInput = document.getElementById(`plan-row-${idx}-hora`);
                const horasInput = document.getElementById(`plan-row-${idx}-horas`);
                const activoCheck = document.getElementById(`plan-row-${idx}-activo`);
                const obsInput = document.getElementById(`plan-row-${idx}-obs`);

                return {
                    empleado: empleadoSelect ? empleadoSelect.value : "",
                    diaSemana: diaSelect ? diaSelect.value : "",
                    horaEntrada: horaInput ? horaInput.value : "",
                    horasPlan: horasInput ? horasInput.value : "",
                    activo: activoCheck ? activoCheck.checked : true,
                    observaciones: obsInput ? obsInput.value : ""
                };
            }).filter(item => item.empleado || item.diaSemana || item.horasPlan);

            UiState.setGlobalLoading(true, "Guardando plan semanal...");
            ApiService.call('saveWeeklyPlanForClient', cliente, items)
                .then(function () {
                    if (Alerts) Alerts.showAlert("✅ Plan semanal guardado correctamente.", "success");
                    fetchWeeklyPlanForClient();
                })
                .catch(function (err) {
                    if (Alerts) Alerts.showAlert("Error al guardar plan: " + err.message, "danger");
                })
                .finally(function () {
                    UiState.setGlobalLoading(false);
                });
        }

        return {
            init,
            setup,
            fetchWeeklyPlanForClient
        };
    })();

    global.WeeklyPlanPanel = WeeklyPlanPanel;
})(typeof window !== "undefined" ? window : this);
