/**
 * WeeklyPlanPanelRender
 * Render del panel de plan semanal.
 */
(function (global) {
    const state = global.WeeklyPlanPanelState;
    const Dom = state && state.Dom ? state.Dom : null;
    const UI = global.UIHelpers;
    const formatClientLabel = state && state.formatClientLabel ? state.formatClientLabel : (v => v || '');
    const WEEK_DAYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

    function buildEmployeeOptions() {
        const opts = [];
        const empleados = state.referenceData && state.referenceData.empleados ? state.referenceData.empleados : [];
        empleados.forEach(emp => {
            if (!emp) return;
            const label = typeof emp === 'string'
                ? String(emp)
                : (emp.nombre || emp.empleado || emp.label || '');
            const id = emp && typeof emp === 'object' && emp.id != null ? String(emp.id) : '';
            if (!id || !label) return;
            opts.push({ value: id, label: label, dataset: { name: label } });
        });
        return opts;
    }

    function buildDayOptions() {
        return WEEK_DAYS.map(day => ({ value: day, label: day }));
    }

    function buildHorasBlock(infoHoras) {
        if (!Dom) return document.createElement("div");
        if (!infoHoras) return Dom.el("div");

        const partes = [];
        const pushIfHours = (label, value) => {
            const num = Number(value || 0);
            if (num > 0) {
                partes.push({ label: label, horas: num });
            }
        };

        pushIfHours('Lu', infoHoras.lunes);
        pushIfHours('Ma', infoHoras.martes);
        pushIfHours('Mi', infoHoras.miercoles);
        pushIfHours('Ju', infoHoras.jueves);
        pushIfHours('Vi', infoHoras.viernes);
        pushIfHours('Sa', infoHoras.sabado);
        pushIfHours('Do', infoHoras.domingo);

        if (!partes.length) return Dom.el("div");

        const wrapper = Dom.el("div", {
            className: "lt-surface lt-surface--subtle p-2 flex-grow-1 border-start border-success border-3"
        });
        wrapper.appendChild(Dom.el("div", {
            className: "small fw-semibold text-muted mb-1",
            text: "Horas contratadas por día"
        }));
        const chips = Dom.el("div", { className: "d-flex flex-wrap gap-1" });
        partes.forEach(part => {
            if (UI && typeof UI.chip === "function") {
                chips.appendChild(UI.chip(`${part.label}: ${part.horas} hs`, { variant: "success" }));
            } else {
                chips.appendChild(Dom.el("span", {
                    className: "lt-chip lt-chip--success",
                    text: `${part.label}: ${part.horas} hs`
                }));
            }
        });
        wrapper.appendChild(chips);
        return wrapper;
    }

    function renderList(container, records) {
        state.currentContainer = container;
        state.allRecordsCache = records || [];
        state.planGroupsCache = {};
        state.openGroupKeys = new Set();

        if (!container || !Dom) return;

        const grouped = {};
        state.allRecordsCache.forEach(item => {
            const r = item.record || item;
            const idCliente = r.ID_CLIENTE || r.idCliente || "";
            const idEmpleado = r.ID_EMPLEADO || r.idEmpleado || "";
            if (!idCliente || !idEmpleado) return;

            let clienteName = state.getClientNameById(idCliente) || r.cliente || r.CLIENTE || r.Cliente;
            if (typeof clienteName === 'object' && clienteName !== null) {
                if (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.getClientDisplayName === 'function') {
                    clienteName = DomainHelpers.getClientDisplayName(clienteName);
                } else {
                    clienteName = clienteName.nombre || clienteName.razonSocial || clienteName.toString();
                }
            }

            const cliente = clienteName || "Sin asignar";
            const vigDesde = state.formatDateInput(r["VIGENTE DESDE"] || r.vigDesde);
            const vigHasta = state.formatDateInput(r["VIGENTE HASTA"] || r.vigHasta);
            const clienteKey = `id:${idCliente}`;
            const key = `${clienteKey}|${vigDesde}|${vigHasta}`;

            if (!grouped[key]) {
                grouped[key] = {
                    cliente: cliente,
                    idCliente: idCliente || "",
                    vigDesde: vigDesde,
                    vigHasta: vigHasta,
                    horasTotales: 0,
                    diasActivos: 0,
                    dias: new Set(),
                    rows: []
                };
            }

            const horasValue = r["HORAS PLAN"] || r.HORAS_PLAN || r.horasPlan || 0;
            const horas = parseFloat(horasValue);
            const dia = r["DIA SEMANA"] || r.DIA_SEMANA || r.diaSemana || r["DÍA DE LA SEMANA"];

            const normalizedRow = {
                id: r.ID || r.id,
                cliente: cliente,
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

            grouped[key].horasTotales += horas;
            grouped[key].diasActivos++;
            if (dia) grouped[key].dias.add(dia);
            grouped[key].rows.push(normalizedRow);
        });

        const listaClientes = Object.values(grouped);

        if (typeof WeeklyPlanTemplates === "undefined" || !WeeklyPlanTemplates || typeof WeeklyPlanTemplates.buildListPanel !== "function") {
            console.error("WeeklyPlanTemplates no disponible");
            return;
        }

        Dom.clear(container);
        const listPanel = WeeklyPlanTemplates.buildListPanel();
        if (!listPanel || !listPanel.root) return;
        container.appendChild(listPanel.root);
        const tbody = listPanel.tbody;
        if (!tbody) return;
        Dom.clear(tbody);

        if (listaClientes.length === 0) {
            const cell = Dom.el('td', { colSpan: '5', className: 'py-4' });
            const wrapper = Dom.el('div');
            if (typeof EmptyState !== 'undefined' && EmptyState) {
                EmptyState.render(wrapper, { variant: 'empty', title: 'Sin planes', message: 'No hay planes registrados.' });
            } else {
                wrapper.appendChild(Dom.el('div', { className: 'text-center text-muted', text: 'No hay planes registrados.' }));
            }
            cell.appendChild(wrapper);
            tbody.appendChild(Dom.el('tr', {}, [cell]));
        } else {
            const today = new Date().toISOString().split('T')[0];

            listaClientes.forEach(item => {
                if (!item.idCliente) return;
                const isActive = (!item.vigDesde || item.vigDesde <= today) && (!item.vigHasta || item.vigHasta >= today);
                const diasStr = Array.from(item.dias).join(', ');
                const vigenciaStr = (item.vigDesde || 'Inicio') + ' ➡ ' + (item.vigHasta || 'Fin');
                const badgeClass = isActive ? 'bg-success' : 'bg-secondary';
                const textClass = isActive ? 'fw-semibold' : '';
                const keyBase = `id:${item.idCliente}`;
                const key = `${keyBase}|${item.vigDesde}|${item.vigHasta}`;

                state.planGroupsCache[key] = item.rows;

                const row = Dom.el('tr', {
                    className: 'plan-row',
                    dataset: { active: String(isActive) },
                    style: isActive ? null : { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                });

                row.appendChild(Dom.el('td', { className: textClass, text: item.cliente }));
                row.appendChild(Dom.el('td', { className: 'small', text: vigenciaStr }));
                row.appendChild(
                    Dom.el('td', { className: 'text-center' }, [
                        Dom.el('span', {
                            className: `badge ${badgeClass} rounded-pill`,
                            text: `${item.horasTotales.toFixed(1)} hs`
                        })
                    ])
                );
                row.appendChild(Dom.el('td', { className: 'small', text: diasStr || '-' }));

                const actions = Dom.el('td', { className: 'text-end' });
                const editBtn = Dom.el('button', {
                    type: 'button',
                    className: 'btn btn-sm btn-outline-primary me-1 btn-editar-plan',
                    dataset: {
                        key: key,
                        idCliente: item.idCliente,
                        clienteLabel: item.cliente
                    }
                }, [
                    Dom.el('i', { className: 'bi bi-pencil-square me-1' }),
                    Dom.text('Editar')
                ]);
                actions.appendChild(editBtn);
                row.appendChild(actions);
                tbody.appendChild(row);
            });
        }

        if (global.WeeklyPlanPanelHandlers && typeof global.WeeklyPlanPanelHandlers.attachListEvents === 'function') {
            global.WeeklyPlanPanelHandlers.attachListEvents(container);
        }
    }

    function render(container) {
        state.currentContainer = container;
        if (!container || !Dom) return;
        state.forceNewPlan = false;
        state.openGroupKeys = new Set();

        if ((!state.referenceData.clientes || !state.referenceData.clientes.length)
            && global.WeeklyPlanPanelData
            && typeof global.WeeklyPlanPanelData.ensureReferenceData === 'function') {
            global.WeeklyPlanPanelData.ensureReferenceData().then(() => {
                if (state.currentContainer === container) {
                    render(container);
                }
            });
            return;
        }

        Dom.clear(container);

        const panel = Dom.el("div", { id: "plan-semanal-panel", className: "d-flex flex-column gap-3" });

        const selectorDiv = Dom.el("div", { className: "card shadow-sm p-3" });
        const row = Dom.el("div", { className: "row g-3 align-items-end" });
        const clientCol = Dom.el("div", { className: "col-12 col-md-6" });
        clientCol.appendChild(Dom.el("label", { className: "form-label fw-bold mb-1", text: "Cliente" }));
        const select = Dom.el("select", { id: "field-CLIENTE", className: "form-select" });
        populateClienteOptions(select);
        clientCol.appendChild(select);
        row.appendChild(clientCol);

        const desdeCol = Dom.el("div", { className: "col-6 col-md-3" });
        desdeCol.appendChild(Dom.el("label", { className: "form-label small text-muted fw-semibold mb-1", text: "Vigente desde" }));
        desdeCol.appendChild(Dom.el("input", { type: "date", id: "plan-vig-desde", className: "form-control" }));
        row.appendChild(desdeCol);

        const hastaCol = Dom.el("div", { className: "col-6 col-md-3" });
        hastaCol.appendChild(Dom.el("label", { className: "form-label small text-muted fw-semibold mb-1", text: "Vigente hasta" }));
        hastaCol.appendChild(Dom.el("input", { type: "date", id: "plan-vig-hasta", className: "form-control" }));
        row.appendChild(hastaCol);

        selectorDiv.appendChild(row);
        panel.appendChild(selectorDiv);

        const cardsContainer = Dom.el("div", { id: "plan-semanal-cards-container" });
        panel.appendChild(cardsContainer);

        container.appendChild(panel);

        if (global.WeeklyPlanPanelHandlers && typeof global.WeeklyPlanPanelHandlers.attachDetailEvents === 'function') {
            global.WeeklyPlanPanelHandlers.attachDetailEvents();
        }
    }

    function populateClienteOptions(select) {
        if (!select || !Dom) return;
        Dom.clear(select);
        select.appendChild(Dom.el("option", { value: "", text: "Seleccioná un cliente..." }));
        state.referenceData.clientes.forEach(c => {
            if (!c || typeof c !== 'object' || c.id == null) return;
            const label = formatClientLabel(c);
            const id = String(c.id);
            if (!label || !id) return;
            select.appendChild(Dom.el("option", { value: id, text: label }));
        });
    }

    function buildWeeklyPlanPanel(rows, cliente, infoHoras) {
        let panel = document.getElementById("plan-semanal-cards-container");
        if (!panel) panel = document.getElementById("plan-semanal-panel");
        if (!panel || !Dom) return;
        if (typeof WeeklyPlanTemplates === "undefined" || !WeeklyPlanTemplates || typeof WeeklyPlanTemplates.buildEditorTopSection !== "function") {
            console.error("WeeklyPlanTemplates no disponible");
            return;
        }

        const modalFooter = document.querySelector('.modal-footer-custom');
        if (modalFooter) modalFooter.style.display = 'none';

        const clienteSelect = document.getElementById("field-CLIENTE");
        const clienteId = clienteSelect ? clienteSelect.value : "";
        const effectiveInfoHoras = infoHoras || (clienteId && clienteId === state.lastInfoHorasClientId ? state.lastInfoHoras : null);
        const defaultHoraEntrada = state.getClientDefaultHoraEntrada
            ? state.getClientDefaultHoraEntrada(clienteId)
            : "";

        if (!rows.length) {
            rows = [{
                empleado: "",
                diaSemana: "",
                horaEntrada: defaultHoraEntrada || "",
                horasPlan: "",
                vigDesde: global.WeeklyPlanPanelHandlers && global.WeeklyPlanPanelHandlers.vigDesdeInputVal
                    ? global.WeeklyPlanPanelHandlers.vigDesdeInputVal() : "",
                vigHasta: global.WeeklyPlanPanelHandlers && global.WeeklyPlanPanelHandlers.vigHastaInputVal
                    ? global.WeeklyPlanPanelHandlers.vigHastaInputVal() : "",
                id: "",
                observaciones: ""
            }];
        }
        if (defaultHoraEntrada) {
            rows = rows.map(r => {
                if (r && r.horaEntrada) return r;
                return Object.assign({}, r, { horaEntrada: defaultHoraEntrada });
            });
        }
        const vigDesdeVal = state.formatDateInput(rows[0].vigDesde || (global.WeeklyPlanPanelHandlers && global.WeeklyPlanPanelHandlers.vigDesdeInputVal ? global.WeeklyPlanPanelHandlers.vigDesdeInputVal() : ''));
        const vigHastaVal = state.formatDateInput(rows[0].vigHasta || (global.WeeklyPlanPanelHandlers && global.WeeklyPlanPanelHandlers.vigHastaInputVal ? global.WeeklyPlanPanelHandlers.vigHastaInputVal() : ''));

        const groupedByEmpleado = {};
        rows.forEach((r, idx) => {
            const empName = r.empleado || "Sin asignar";
            const empId = r.idEmpleado != null && r.idEmpleado !== '' ? String(r.idEmpleado) : '';
            const key = empId ? `id:${empId}` : 'sin-id';
            if (!groupedByEmpleado[key]) {
                groupedByEmpleado[key] = { label: empName, id: empId, rows: [] };
            }
            groupedByEmpleado[key].rows.push(Object.assign({}, r, { originalIdx: idx }));
        });

        const needsWrapper = panel.id === "plan-semanal-panel";
        Dom.clear(panel);

        const container = needsWrapper
            ? WeeklyPlanTemplates.buildEditorWrapperStart(String(cliente || ""))
            : panel;

        const hoursBlock = buildHorasBlock(effectiveInfoHoras);
        const topSection = WeeklyPlanTemplates.buildEditorTopSection(hoursBlock);
        container.appendChild(topSection);

        const cardsContainer = Dom.el("div", { id: "weekly-plan-cards", className: "d-flex flex-column gap-3" });
        container.appendChild(cardsContainer);

        const employeeOptions = buildEmployeeOptions();
        const dayOptions = buildDayOptions();

        Object.keys(groupedByEmpleado).forEach((key) => {
            const group = groupedByEmpleado[key];
            const empleado = group.label;
            const empleadoRows = group.rows;
            const collapseId = "plan-emp-" + state.normalizePlanKey(key);
            const totalHoras = empleadoRows.reduce((sum, r) => sum + (parseFloat(r.horasPlan) || 0), 0);
            const activeDays = empleadoRows.length;

            const diasList = [...new Set(empleadoRows.map(r => r.diaSemana).filter(Boolean))].join(", ");
            const diasLabel = diasList || (empleadoRows.length + ' día' + (empleadoRows.length !== 1 ? 's' : ''));

            const isSinAsignar = empleado === "Sin asignar";
            const hasOpenState = state.openGroupKeys && state.openGroupKeys.size > 0;
            const isOpen = hasOpenState ? state.openGroupKeys.has(key) : isSinAsignar;

            const cardInfo = WeeklyPlanTemplates.buildEmployeeCardStart({
                empKey: key,
                collapseId: collapseId,
                isOpen: isOpen,
                empleadoLabel: empleado,
                diasLabel: diasLabel,
                totalHoras: totalHoras.toFixed(1),
                activeDays: activeDays,
                arrowLabel: isOpen ? '▲' : '▼'
            });

            if (!cardInfo || !cardInfo.card || !cardInfo.body) return;

            empleadoRows.forEach((r) => {
                const rowId = "plan-row-" + r.originalIdx;
                const horaFormatted = HtmlHelpers.formatHoraEntradaForInput(r.horaEntrada);
                const horasValue = r.horasPlan != null && r.horasPlan !== '' ? String(r.horasPlan) : '';
                const horasLabel = horasValue ? `• ${horasValue} hs` : '';
                const rowCard = WeeklyPlanTemplates.buildPlanRowCard({
                    rowId: rowId,
                    diaLabel: r.diaSemana || 'Día no seleccionado',
                    horasLabel: horasLabel,
                    originalIdx: r.originalIdx,
                    empleadoOptions: employeeOptions,
                    diaOptions: dayOptions,
                    empleadoId: r.idEmpleado || '',
                    diaSemana: r.diaSemana || '',
                    horaEntrada: horaFormatted,
                    horasPlan: horasValue,
                    observaciones: r.observaciones || '',
                    recordId: r.id || ''
                });
                cardInfo.body.appendChild(rowCard);
            });

            cardsContainer.appendChild(cardInfo.card);
        });

        container.appendChild(WeeklyPlanTemplates.buildEditorFooter());
        if (needsWrapper) {
            panel.appendChild(container);
        }

        const vigDesdeInput = document.getElementById('plan-vig-desde');
        const vigHastaInput = document.getElementById('plan-vig-hasta');
        if (vigDesdeInput && rows[0]) vigDesdeInput.value = state.formatDateInput(rows[0].vigDesde || vigDesdeVal);
        if (vigHastaInput && rows[0]) vigHastaInput.value = state.formatDateInput(rows[0].vigHasta || vigHastaVal);

        bindWeeklyPlanCollapseArrows();
        if (global.WeeklyPlanPanelHandlers && typeof global.WeeklyPlanPanelHandlers.attachWeeklyPlanHandlers === 'function') {
            global.WeeklyPlanPanelHandlers.attachWeeklyPlanHandlers(panel);
        }
    }

    function bindWeeklyPlanCollapseArrows() {
        const panel = document.getElementById("plan-semanal-panel");
        if (!panel) return;

        const collapses = panel.querySelectorAll(".collapse");
        collapses.forEach(function (col) {
            const targetId = col.id;
            const header = panel.querySelector(`[data-bs-target="#${targetId}"]`);
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

    global.WeeklyPlanPanelRender = {
        renderList: renderList,
        render: render,
        buildWeeklyPlanPanel: buildWeeklyPlanPanel,
        populateClienteOptions: populateClienteOptions
    };
})(typeof window !== "undefined" ? window : this);
