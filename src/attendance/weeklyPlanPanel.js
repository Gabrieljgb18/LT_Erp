/**
 * Weekly Plan Panel
 * UI para gestión de planificación semanal de asistencia
 * Version: 3.1 - New Row Appears at Top
 */

(function (global) {
    const WeeklyPlanPanel = (() => {
        let referenceData = { clientes: [], empleados: [] };
        const formatClientLabel_ = (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.formatClientLabel === 'function')
            ? HtmlHelpers.formatClientLabel
            : function (cli) {
                if (!cli) return '';
                if (typeof cli === 'string') return cli;
                const base = (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.getClientDisplayName === 'function')
                    ? HtmlHelpers.getClientDisplayName(cli)
                    : (cli.nombre || cli.razonSocial || '');
                const id = cli.id != null ? String(cli.id).trim() : '';
                const docType = (cli.docType || cli["TIPO DOCUMENTO"] || '').toString().trim();
                const rawDoc = cli.docNumber || cli["NUMERO DOCUMENTO"] || cli.cuit || '';
                const docLabel = rawDoc && (typeof InputUtils !== 'undefined' && InputUtils && typeof InputUtils.formatDocLabel === 'function')
                    ? InputUtils.formatDocLabel(docType || (cli.cuit ? 'CUIT' : ''), rawDoc)
                    : '';
                const meta = [];
                if (id) meta.push(`ID: ${id}`);
                if (docLabel) meta.push(docLabel);
                const metaSuffix = meta.length ? ` (${meta.join(' | ')})` : '';
                return (base + metaSuffix).trim();
            };

        // Estado interno para navegación
        let currentContainer = null;
        let allRecordsCache = [];
        let currentOriginalVigencia = null; // Para saber qué plan estamos editando
        let forceNewPlan = false;
        let lastInfoHoras = null;
        let lastInfoHorasClientId = "";
        let openGroupKeys = new Set();

        function init(refData) {
            referenceData = refData;
        }

        // IDs vienen desde el select, sin fallback por nombre.

        function getClientNameById_(idCliente) {
            const id = idCliente != null ? String(idCliente).trim() : '';
            if (!id) return '';
            const list = referenceData && referenceData.clientes ? referenceData.clientes : [];
            const match = list.find(cli => cli && String(cli.id || '').trim() === id);
            if (!match) return '';
            if (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.getClientDisplayName === 'function') {
                return HtmlHelpers.getClientDisplayName(match);
            }
            return match.nombre || match.razonSocial || '';
        }

        function formatDateForInput(v) {
            if (!v) return '';
            if (v instanceof Date && !isNaN(v)) {
                return v.toISOString().split('T')[0];
            }
            const str = String(v || '').trim();
            if (str.includes('/')) {
                const parts = str.split('/');
                if (parts.length === 3) {
                    const dd = Number(parts[0]);
                    const mm = Number(parts[1]);
                    const yyyy = Number(parts[2]);
                    const d = new Date(yyyy, mm - 1, dd);
                    if (!isNaN(d)) return d.toISOString().split('T')[0];
                }
            }
            if (str.includes('-')) {
                const parts = str.split('-');
                if (parts.length === 3) {
                    const a = parts[0];
                    const b = parts[1];
                    const c = parts[2];
                    // yyyy-mm-dd
                    if (a.length === 4) {
                        const d = new Date(Number(a), Number(b) - 1, Number(c));
                        if (!isNaN(d)) return d.toISOString().split('T')[0];
                    }
                    // dd-mm-yyyy
                    if (c.length === 4) {
                        const d = new Date(Number(c), Number(b) - 1, Number(a));
                        if (!isNaN(d)) return d.toISOString().split('T')[0];
                    }
                }
            }
            const d = new Date(str);
            if (!isNaN(d)) return d.toISOString().split('T')[0];
            return '';
        }

        function normalizePlanKey(value) {
            return String(value || '')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_-]/g, '_');
        }

        function captureOpenGroupKeys() {
            const panel = document.getElementById("plan-semanal-panel");
            if (!panel) {
                openGroupKeys = new Set();
                return;
            }
            const open = new Set();
            panel.querySelectorAll('[data-emp-key]').forEach(card => {
                const key = card.getAttribute('data-emp-key') || '';
                const collapse = card.querySelector('.collapse');
                if (collapse && collapse.classList.contains('show')) {
                    open.add(key);
                }
            });
            openGroupKeys = open;
        }

        function vigDesdeInputVal() {
            const el = document.getElementById('plan-vig-desde');
            return el ? el.value : '';
        }

        function vigHastaInputVal() {
            const el = document.getElementById('plan-vig-hasta');
            return el ? el.value : '';
        }

        let planGroupsCache = {};

        function renderList(container, records) {
            currentContainer = container;
            allRecordsCache = records || [];
            planGroupsCache = {}; // Limpiar caché
            openGroupKeys = new Set();

            // DEBUG: Ver estructura de los datos
            console.log('=== DEBUG WeeklyPlanPanel ===');
            console.log('Total records:', allRecordsCache.length);
            if (allRecordsCache.length > 0) {
                console.log('Primer record completo:', allRecordsCache[0]);
                console.log('Keys del primer record:', Object.keys(allRecordsCache[0]));
                const firstRecord = allRecordsCache[0].record || allRecordsCache[0];
                console.log('Contenido de record:', firstRecord);
                console.log('Keys de record:', Object.keys(firstRecord));
            }

            if (!container) return;

            // Agrupar por cliente y vigencia
            const grouped = {};
            allRecordsCache.forEach(item => {
                // Los registros vienen envueltos: {rowNumber, record, id}
                const r = item.record || item;

                const idCliente = r.ID_CLIENTE || r.idCliente || "";
                const idEmpleado = r.ID_EMPLEADO || r.idEmpleado || "";
                if (!idCliente || !idEmpleado) return;
                // Intentar obtener cliente de varias formas (CLIENTE, Cliente, cliente)
                let clienteName = getClientNameById_(idCliente) || r.cliente || r.CLIENTE || r.Cliente;

                // Si es un objeto (referencia), intentar obtener nombre o razon social
                if (typeof clienteName === 'object' && clienteName !== null) {
                    if (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.getClientDisplayName === 'function') {
                        clienteName = HtmlHelpers.getClientDisplayName(clienteName);
                    } else {
                        clienteName = clienteName.nombre || clienteName.razonSocial || clienteName.toString();
                    }
                }

                const cliente = clienteName || "Sin asignar";

                // Clave única: Cliente + Vigencia
                const vigDesde = formatDateForInput(r["VIGENTE DESDE"] || r.vigDesde);
                const vigHasta = formatDateForInput(r["VIGENTE HASTA"] || r.vigHasta);
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
                        rows: [] // Guardamos las filas para pasarlas al editor
                    };
                }

                // Normalizar horas (viene como string "3", "4", etc.)
                const horasValue = r["HORAS PLAN"] || r.HORAS_PLAN || r.horasPlan || 0;
                const horas = parseFloat(horasValue);

                // Normalizar día (viene como "LUNES", "MARTES", etc.)
                const dia = r["DIA SEMANA"] || r.DIA_SEMANA || r.diaSemana || r["DÍA DE LA SEMANA"];

                // Normalizar registro completo para la UI (camelCase)
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

            let html = '<div class="d-flex justify-content-between align-items-center mb-3">';
            html += '<h5 class="mb-0">Planes de Asistencia Semanal</h5>';
            html += '<div class="d-flex gap-2 align-items-center">';
            html += '<div class="form-check form-switch mb-0">';
            html += '<input class="form-check-input" type="checkbox" id="check-active-plans" checked>';
            html += '<label class="form-check-label small" for="check-active-plans">Solo vigentes</label>';
            html += '</div>';
            html += '<button class="btn btn-primary btn-sm" id="btn-nuevo-plan"><i class="bi bi-plus-lg me-1"></i>Nuevo Plan</button>';
            html += '</div>';
            html += '</div>';

            html += '<div class="card shadow-sm border-0"><div class="card-body p-0"><div class="table-responsive">';
            html += '<table class="table table-hover align-middle mb-0">';
            html += '<thead class="table-light"><tr>';
            html += '<th>Cliente</th>';
            html += '<th>Vigencia</th>';
            html += '<th class="text-center">Horas Semanales</th>';
            html += '<th>Días Programados</th>';
            html += '<th class="text-end">Acciones</th>';
            html += '</tr></thead><tbody>';

            if (listaClientes.length === 0) {
                html += '<tr><td colspan="4" class="text-center py-5 text-muted">No hay planes registrados.</td></tr>';
            } else {
                const today = new Date().toISOString().split('T')[0];

                listaClientes.forEach(item => {
                    // Filtro de vigencia
                    const isActive = (!item.vigDesde || item.vigDesde <= today) && (!item.vigHasta || item.vigHasta >= today);
                    const showActiveOnly = container.querySelector('#check-active-plans')?.checked ?? true; // Default true?

                    // Nota: El checkbox aún no existe en el DOM cuando construimos el string HTML, 
                    // así que necesitamos manejar esto post-render o re-renderizar.
                    // Por ahora, agregamos data-active attribute y filtramos con CSS o JS.

                    const diasStr = Array.from(item.dias).join(', ');
                    const vigenciaStr = (item.vigDesde || 'Inicio') + ' ➡ ' + (item.vigHasta || 'Fin');

                    // Estilo para filas vencidas (inactivas)
                    const rowStyle = isActive ? '' : 'background-color: #f1f5f9; color: #94a3b8;';
                    const badgeClass = isActive ? 'bg-success' : 'bg-secondary';
                    const textClass = isActive ? 'fw-semibold' : '';

                    html += `<tr class="plan-row" data-active="${isActive}" style="${rowStyle}">`;
                    html += `<td class="${textClass}">` + HtmlHelpers.escapeHtml(item.cliente) + '</td>';
                    html += '<td class="small">' + vigenciaStr + '</td>';
                    html += `<td class="text-center"><span class="badge ${badgeClass} rounded-pill">` + item.horasTotales.toFixed(1) + ' hs</span></td>';
                    html += '<td class="small">' + (diasStr || '-') + '</td>';
                    html += '<td class="text-end">';
                    // Guardamos key en data-key para recuperar
                    if (!item.idCliente) return;
                    const keyBase = `id:${item.idCliente}`;
                    const key = `${keyBase}|${item.vigDesde}|${item.vigHasta}`;

                    // Guardar filas en caché para recuperación segura
                    planGroupsCache[key] = item.rows;

                    html += `<button class="btn btn-sm btn-outline-primary me-1 btn-editar-plan" data-key="${HtmlHelpers.escapeHtml(key)}" data-id-cliente="${HtmlHelpers.escapeHtml(item.idCliente)}" data-cliente-label="${HtmlHelpers.escapeHtml(item.cliente)}"><i class="bi bi-pencil-square me-1"></i>Editar</button>`;
                    html += '</td>';
                    html += '</tr>';
                });
            }

            html += '</tbody></table></div></div></div>';

            container.innerHTML = html;

            // Bind events
            const checkActive = container.querySelector('#check-active-plans');
            if (checkActive) {
                checkActive.addEventListener('change', (e) => {
                    const rows = container.querySelectorAll('.plan-row');
                    rows.forEach(r => {
                        if (e.target.checked && r.dataset.active === "false") {
                            r.style.display = 'none';
                        } else {
                            r.style.display = '';
                        }
                    });
                });
                // Trigger initial state
                checkActive.dispatchEvent(new Event('change'));
            }

            container.querySelectorAll('.btn-editar-plan').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const target = e.currentTarget || e.target;
                    const key = target.dataset.key;
                    const idCliente = target.dataset.idCliente || '';
                    const clienteLabel = target.dataset.clienteLabel || '';
                    const parts = key.split('|');
                    const desde = parts[1] || '';
                    const hasta = parts[2] || '';

                    // Recuperar filas directamente del caché
                    const rows = planGroupsCache[key] || [];

                    if (rows.length === 0) {
                        console.warn("No se encontraron filas en caché para:", key);
                    }

                    switchToDetail(idCliente, clienteLabel, rows, { desde, hasta });
                });
            });

            const btnNuevo = container.querySelector('#btn-nuevo-plan');
            if (btnNuevo) {
                btnNuevo.addEventListener('click', () => {
                    switchToDetail('', '', [], null); // Nuevo (sin cliente preseleccionado)
                });
            }
        }

        function switchToDetail(clienteId, clienteLabel, preloadedRows, originalVigencia) {
            if (!currentContainer) return;

            currentOriginalVigencia = originalVigencia; // Guardar vigencia original
            forceNewPlan = !originalVigencia;

            // Renderizar la vista de detalle (cards)
            render(currentContainer);

            // Si hay cliente, seleccionarlo automáticamente
            if (clienteId) {
                const select = document.getElementById('field-CLIENTE');
                if (select) {
                    select.value = clienteId;
                    // Si tenemos filas precargadas, usarlas directamente en lugar de fetch
                    if (preloadedRows && preloadedRows.length > 0) {
                        // Simular carga de horas pedidas (opcional, o fetch solo horas)
                        // Para simplificar, llamamos a buildWeeklyPlanPanel directamente
                        // Pero necesitamos infoHoras. Podemos hacer un fetch rápido solo de horas.

                        ApiService.callLatest('weekly-hours-' + clienteId, 'getClientWeeklyRequestedHours', clienteLabel, clienteId)
                            .then(function (infoHoras) {
                                buildWeeklyPlanPanel(preloadedRows, clienteLabel, infoHoras || null);
                            })
                            .catch(function () {
                                buildWeeklyPlanPanel(preloadedRows, clienteLabel, null);
                            });
                    } else {
                        // Disparar evento change para cargar los datos (si no hay filas precargadas)
                        select.dispatchEvent(new Event('change'));
                    }
                }
            }

            // Agregar botón "Volver" al panel
            const panel = document.getElementById('plan-semanal-panel');
            if (panel) {
                const backBtnDiv = document.createElement('div');
                backBtnDiv.className = 'mb-3';
                backBtnDiv.innerHTML = '<button class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left me-1"></i>Volver al listado</button>';
                backBtnDiv.querySelector('button').addEventListener('click', () => {
                    renderList(currentContainer, allRecordsCache);
                });
                panel.insertBefore(backBtnDiv, panel.firstChild);
            }
        }

        function render(container) {
            currentContainer = container; // Actualizar referencia
            if (!container) return;
            forceNewPlan = false;
            openGroupKeys = new Set();

            // Fallback para datos de referencia
            if ((!referenceData.clientes || !referenceData.clientes.length) && typeof ReferenceService !== 'undefined') {
                const globalRef = ReferenceService.get();
                if (globalRef) referenceData = globalRef;
            }

            // Limpiar contenedor
            container.innerHTML = '';

            // Crear estructura base
            const panel = document.createElement("div");
            panel.id = "plan-semanal-panel";
            panel.className = "d-flex flex-column gap-3";

            // Agregar selector de cliente
            const selectorDiv = document.createElement("div");
            selectorDiv.className = "card shadow-sm p-3";
            selectorDiv.innerHTML = `
                <div class="row g-3 align-items-end">
                    <div class="col-12 col-md-6">
                        <label class="form-label fw-bold mb-1">Cliente</label>
                        <select id="field-CLIENTE" class="form-select">
                            <option value="">Seleccioná un cliente...</option>
                            ${buildClienteOptions()}
                        </select>
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="form-label small text-muted fw-semibold mb-1">Vigente desde</label>
                        <input type="date" id="plan-vig-desde" class="form-control">
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="form-label small text-muted fw-semibold mb-1">Vigente hasta</label>
                        <input type="date" id="plan-vig-hasta" class="form-control">
                    </div>
                </div>
            `;

            panel.appendChild(selectorDiv);

            // Contenedor para las cards
            const cardsContainer = document.createElement("div");
            cardsContainer.id = "plan-semanal-cards-container";
            panel.appendChild(cardsContainer);

            container.appendChild(panel);

            // Bind eventos
            const clienteSelect = document.getElementById("field-CLIENTE");
            if (clienteSelect) {
                clienteSelect.addEventListener("change", () => {
                    // Si cambiamos de cliente manualmente, es un "Nuevo Plan" para ese cliente,
                    // así que limpiamos originalVigencia.
                    currentOriginalVigencia = null;
                    fetchWeeklyPlanForClient();
                });
            }
        }

        function buildClienteOptions() {
            return referenceData.clientes.map(c => {
                if (!c || typeof c !== 'object' || c.id == null) return '';
                const label = formatClientLabel_(c);
                const id = String(c.id);
                if (!label || !id) return '';
                return `<option value="${HtmlHelpers.escapeHtml(id)}">${HtmlHelpers.escapeHtml(label)}</option>`;
            }).filter(Boolean).join('');
        }

        function setup() {
            // Deprecated: usar render()
            const container = document.getElementById("form-fields");
            if (container) render(container);
        }

        function fetchWeeklyPlanForClient() {
            const container = document.getElementById("plan-semanal-cards-container");
            const clienteSelect = document.getElementById("field-CLIENTE");
            const targetId = container ? "plan-semanal-cards-container" : "plan-semanal-panel";

            if (!clienteSelect) return;

            const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
            const idCliente = clienteSelect.value;
            const cliente = selectedOption ? selectedOption.textContent : '';
            if (!idCliente) {
                // Limpiar si no hay cliente
                if (container) container.innerHTML = '';
                return;
            }

            // Fix: Pasar string vacío en lugar de null para evitar que se imprima "null"
            UiState.renderLoading(
                targetId,
                "",
                "Cargando plan de <strong>" + HtmlHelpers.escapeHtml(cliente) + "</strong>..."
            );

            ApiService.callLatest('weekly-plan-' + idCliente, 'getWeeklyPlanForClient', '', idCliente)
                .then(function (rows) {
                    if (rows && rows.ignored) return;
                    const planRows = Array.isArray(rows) ? rows : [];
                    const currentClienteEl = document.getElementById("field-CLIENTE");
                    const currentCliente = currentClienteEl ? currentClienteEl.value : '';

                    // Si cambió el cliente mientras cargaba, ignorar
                    if (currentCliente !== idCliente) return;

                    lastInfoHorasClientId = idCliente;
                    let rowsToRender = planRows;
                    if (!forceNewPlan) {
                        const groups = new Map();
                        planRows.forEach(function (row) {
                            const desde = formatDateForInput(row.vigDesde || row["VIGENTE DESDE"] || "");
                            const hasta = formatDateForInput(row.vigHasta || row["VIGENTE HASTA"] || "");
                            const key = `${desde}|${hasta}`;
                            if (!groups.has(key)) {
                                groups.set(key, { vigencia: { desde, hasta }, rows: [] });
                            }
                            groups.get(key).rows.push(row);
                        });

                        if (groups.size === 1) {
                            const entry = Array.from(groups.values())[0];
                            currentOriginalVigencia = entry.vigencia;
                            rowsToRender = entry.rows;
                        } else if (groups.size > 1) {
                            let selected = null;
                            let latestTime = -Infinity;
                            groups.forEach(entry => {
                                const baseDate = entry.vigencia.desde || entry.vigencia.hasta || "";
                                const time = baseDate ? new Date(baseDate).getTime() : 0;
                                const normalizedTime = isNaN(time) ? 0 : time;
                                if (normalizedTime >= latestTime) {
                                    latestTime = normalizedTime;
                                    selected = entry;
                                }
                            });
                            if (selected) {
                                currentOriginalVigencia = selected.vigencia;
                                rowsToRender = selected.rows;
                                if (Alerts) {
                                    Alerts.showAlert("Hay varios planes para este cliente. Se muestra el más reciente. Para editar otro, usá el listado.", "warning");
                                }
                            }
                        } else {
                            currentOriginalVigencia = null;
                        }
                    } else {
                        currentOriginalVigencia = null;
                        if (planRows.length) {
                            rowsToRender = planRows.map(row => ({ ...row, id: "" }));
                            if (Alerts) {
                                Alerts.showAlert("Estás creando un plan nuevo. Definí una nueva vigencia antes de guardar.", "info");
                            }
                        }
                    }

                    return ApiService.callLatest('weekly-hours-' + idCliente, 'getClientWeeklyRequestedHours', cliente, idCliente)
                        .then(function (infoHoras) {
                            if (infoHoras && infoHoras.ignored) return;
                            lastInfoHoras = infoHoras || null;
                            buildWeeklyPlanPanel(rowsToRender, cliente, infoHoras || null);
                        })
                        .catch(function (err2) {
                            console.error("Error obteniendo horas pedidas:", err2);
                            lastInfoHoras = null;
                            buildWeeklyPlanPanel(rowsToRender, cliente, null);
                        });
                })
                .catch(function (err) {
                    UiState.renderLoading(
                        targetId,
                        "Error",
                        "Error al cargar plan: " + HtmlHelpers.escapeHtml(err.message)
                    );
                });
        }

        function buildWeeklyPlanPanel(rows, cliente, infoHoras) {
            // Intentar usar el contenedor de cards, fallback al panel principal
            let panel = document.getElementById("plan-semanal-cards-container");
            if (!panel) panel = document.getElementById("plan-semanal-panel");

            if (!panel) return;

            // Ocultar footer del modal si estamos en un modal
            const modalFooter = document.querySelector('.modal-footer-custom');
            if (modalFooter) modalFooter.style.display = 'none';

            const clienteSelect = document.getElementById("field-CLIENTE");
            const clienteId = clienteSelect ? clienteSelect.value : "";
            const effectiveInfoHoras = infoHoras || (clienteId && clienteId === lastInfoHorasClientId ? lastInfoHoras : null);

            if (!rows.length) {
                rows = [{
                    empleado: "",
                    diaSemana: "",
                    horaEntrada: "",
                    horasPlan: "",
                    vigDesde: vigDesdeInputVal(),
                    vigHasta: vigHastaInputVal(),
                    id: "",
                    observaciones: ""
                }];
            }
            const vigDesdeVal = formatDateForInput(rows[0].vigDesde || vigDesdeInputVal());
            const vigHastaVal = formatDateForInput(rows[0].vigHasta || vigHastaInputVal());

            // Agrupar por empleado (por ID)
            const groupedByEmpleado = {};
            rows.forEach((r, idx) => {
                const empName = r.empleado || "Sin asignar";
                const empId = r.idEmpleado != null && r.idEmpleado !== '' ? String(r.idEmpleado) : '';
                const key = empId ? `id:${empId}` : 'sin-id';
                if (!groupedByEmpleado[key]) {
                    groupedByEmpleado[key] = { label: empName, id: empId, rows: [] };
                }
                groupedByEmpleado[key].rows.push({ ...r, originalIdx: idx });
            });

            let html = "";

            // Header solo si estamos en fallback
            if (panel.id === "plan-semanal-panel") {
                html += '<div class="mt-2 p-3 lt-surface lt-surface--subtle">';
                html += '<div class="d-flex justify-content-between align-items-center mb-3">';
                html += '<div>';
                html += '<div class="fw-bold mb-1 text-primary"><i class="bi bi-calendar-week me-1"></i>Plan semanal del cliente</div>';
                html += '<div class="small mb-2">Cliente: <strong class="text-primary-emphasis">' + HtmlHelpers.escapeHtml(cliente) + "</strong></div>";
                html += '</div>';
                html += '</div>';
            }

            // Sección superior: Horas contratadas y Botón Agregar
            html += '<div class="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2">';

            // Horas contratadas
            let horasHtml = '';
            if (effectiveInfoHoras) {
                const partes = [];
                const pushSiTieneHoras = (label, valor) => {
                    const num = Number(valor || 0);
                    if (num > 0) {
                        partes.push('<span class="lt-chip lt-chip--success">' + label + ': ' + num + ' hs</span>');
                    }
                };

                pushSiTieneHoras('Lu', effectiveInfoHoras.lunes);
                pushSiTieneHoras('Ma', effectiveInfoHoras.martes);
                pushSiTieneHoras('Mi', effectiveInfoHoras.miercoles);
                pushSiTieneHoras('Ju', effectiveInfoHoras.jueves);
                pushSiTieneHoras('Vi', effectiveInfoHoras.viernes);
                pushSiTieneHoras('Sa', effectiveInfoHoras.sabado);
                pushSiTieneHoras('Do', effectiveInfoHoras.domingo);

                if (partes.length) {
                    horasHtml += '<div class="lt-surface lt-surface--subtle p-2 flex-grow-1 border-start border-success border-3">';
                    horasHtml += '<div class="small fw-semibold text-muted mb-1">Horas contratadas por día</div>';
                    horasHtml += '<div class="d-flex flex-wrap gap-1">' + partes.join('') + '</div>';
                    horasHtml += '</div>';
                }
            }
            if (!horasHtml) horasHtml = '<div></div>'; // Spacer
            html += horasHtml;

            // Botón Agregar día (Movido arriba)
            html += '<button type="button" class="btn btn-sm btn-outline-secondary lt-btn-compact text-nowrap" data-action="add-plan-row">';
            html += '<i class="bi bi-plus-lg me-1"></i>Agregar día</button>';

            html += '</div>'; // End top section

            // Cards por empleado
            html += '<div id="weekly-plan-cards" class="d-flex flex-column gap-3">';

            Object.keys(groupedByEmpleado).forEach((key, empIdx) => {
                const group = groupedByEmpleado[key];
                const empleado = group.label;
                const empleadoRows = group.rows;
                const collapseId = "plan-emp-" + normalizePlanKey(key);
                const totalHoras = empleadoRows.reduce((sum, r) => sum + (parseFloat(r.horasPlan) || 0), 0);
                const activeDays = empleadoRows.length;

                // Lista de días
                const diasList = [...new Set(empleadoRows.map(r => r.diaSemana).filter(Boolean))].join(", ");
                const diasLabel = diasList || (empleadoRows.length + ' día' + (empleadoRows.length !== 1 ? 's' : ''));

                // Determinar si debe estar abierto:
                // 1. Si es "Sin asignar" (donde van los nuevos)
                // 2. O si no hay ninguno abierto (opcional, aquí lo dejamos cerrado por defecto excepto Sin Asignar)
                const isSinAsignar = empleado === "Sin asignar";
                const hasOpenState = openGroupKeys && openGroupKeys.size > 0;
                const isOpen = hasOpenState ? openGroupKeys.has(key) : isSinAsignar;

                html += '<div class="card shadow-sm border-0" data-emp-key="' + HtmlHelpers.escapeHtml(key) + '">';

                // Card Header
                html += '<div class="card-header py-2 px-3 bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 lt-clickable" ';
                html += 'data-bs-toggle="collapse" data-bs-target="#' + collapseId + '" ';
                html += 'aria-expanded="' + isOpen + '" aria-controls="' + collapseId + '" role="button">';

                html += '<div class="d-flex flex-wrap gap-2 align-items-center">';
                html += '<span class="fw-semibold text-dark"><i class="bi bi-person-circle me-1"></i>' + HtmlHelpers.escapeHtml(empleado) + '</span>';
                html += '<span class="badge bg-primary bg-opacity-75">' + diasLabel + '</span>';
                html += '<span class="badge text-bg-success">' + totalHoras.toFixed(1) + ' hs totales</span>';
                html += '</div>';

                html += '<div class="d-flex gap-2 align-items-center">';
                html += '<span class="text-muted small">' + activeDays + ' día(s)</span>';
                html += '<span class="text-muted fw-semibold" data-role="collapse-arrow">' + (isOpen ? '▲' : '▼') + '</span>';
                html += '</div>';

                html += '</div>';

                // Card Body (collapsible)
                // Fix: Quitar 'show' por defecto, solo ponerlo si isOpen es true
                html += '<div id="' + collapseId + '" class="collapse ' + (isOpen ? 'show' : '') + '">';
                html += '<div class="card-body pt-2 pb-3 px-3">';

                // Días del empleado
                empleadoRows.forEach((r) => {
                    const rowId = "plan-row-" + r.originalIdx;
                    const empleadoOptions = HtmlHelpers.getEmpleadoOptionsHtml(r.idEmpleado || "", referenceData.empleados);
                    const diaOptions = HtmlHelpers.getDiaOptionsHtml(r.diaSemana || "");
                    const horaFormatted = HtmlHelpers.formatHoraEntradaForInput(r.horaEntrada);
                    html += '<div class="lt-surface lt-surface--subtle p-3 mb-2">';

                    // Header de día
                    html += '<div class="d-flex justify-content-between align-items-center mb-2">';
                    html += '<div class="d-flex gap-2 align-items-center">';
                    html += '<span class="badge bg-primary bg-opacity-75 text-white">Plan</span>';
                    html += '<span class="fw-semibold">' + (r.diaSemana || 'Día no seleccionado') + '</span>';
                    if (r.horasPlan) {
                        html += '<span class="text-muted">• ' + r.horasPlan + ' hs</span>';
                    }
                    html += '</div>';
                    html += '<button type="button" class="btn btn-sm btn-outline-danger lt-btn-icon" data-action="delete-plan-row" data-idx="' + r.originalIdx + '"><i class="bi bi-trash"></i></button>';
                    html += '</div>';

                    // Campos del día
                    html += '<div class="row g-2">';

                    html += '<div class="col-12 col-md-6">';
                    html += '<label class="small text-muted fw-semibold d-block mb-1">Empleado</label>';
                    html += '<select class="form-select form-select-sm bg-white border" id="' + rowId + '-empleado">' + empleadoOptions + '</select>';
                    html += '</div>';

                    html += '<div class="col-6 col-md-3">';
                    html += '<label class="small text-muted fw-semibold d-block mb-1">Día</label>';
                    html += '<select class="form-select form-select-sm text-center bg-white border" id="' + rowId + '-dia">' + diaOptions + '</select>';
                    html += '</div>';

                    html += '<div class="col-6 col-md-3">';
                    html += '<label class="small text-muted fw-semibold d-block mb-1">Hora entrada</label>';
                    html += '<input type="time" class="form-control form-control-sm text-center" id="' + rowId + '-horaEntrada" value="' + HtmlHelpers.escapeHtml(horaFormatted) + '" step="1800">';
                    html += '</div>';

                    html += '<div class="col-6 col-md-3">';
                    html += '<label class="small text-muted fw-semibold d-block mb-1">Horas plan</label>';
                    html += '<input type="number" step="0.5" min="0" class="form-control form-control-sm text-end" id="' + rowId + '-horasPlan" value="' + HtmlHelpers.escapeHtml(r.horasPlan != null ? String(r.horasPlan) : "") + '">';
                    html += '</div>';

                    html += '<div class="col-12 col-md-6">';
                    html += '<label class="small text-muted fw-semibold d-block mb-1">Observaciones</label>';
                    html += '<input type="text" class="form-control form-control-sm" id="' + rowId + '-obs" value="' + HtmlHelpers.escapeHtml(r.observaciones || "") + '">';
                    html += '</div>';

                    html += '<input type="hidden" id="' + rowId + '-id" value="' + HtmlHelpers.escapeHtml(r.id || "") + '">';

                    html += '</div>'; // row
                    html += '</div>'; // border rounded
                });

                html += '</div>'; // card-body
                html += '</div>'; // collapse
                html += '</div>'; // card
            });

            html += '</div>'; // weekly-plan-cards

            // Botones de acción (Solo Guardar, Agregar se movió arriba)
            html += '<div class="d-flex justify-content-end align-items-center mt-3 pt-3 border-top">';
            html += '<button type="button" class="btn btn-sm btn-success lt-btn-compact" ';
            html += 'data-action="save-weekly-plan" id="btn-save-weekly"><i class="bi bi-save2 me-1"></i>Guardar plan del cliente</button>';
            html += "</div>";

            if (panel.id === "plan-semanal-panel") {
                html += "</div>";
            }

            panel.innerHTML = html;

            // Set vigencias en inputs superiores
            const vigDesdeInput = document.getElementById('plan-vig-desde');
            const vigHastaInput = document.getElementById('plan-vig-hasta');
            if (vigDesdeInput && rows[0]) vigDesdeInput.value = formatDateForInput(rows[0].vigDesde || vigDesdeInputVal());
            if (vigHastaInput && rows[0]) vigHastaInput.value = formatDateForInput(rows[0].vigHasta || vigHastaInputVal());

            // Bind collapse arrows
            bindWeeklyPlanCollapseArrows();
            attachWeeklyPlanHandlers(panel);
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

        function attachWeeklyPlanHandlers(panel) {
            panel.addEventListener("click", function (e) {
                const actionBtn = e.target.closest("[data-action]");
                if (!actionBtn) return;
                const action = actionBtn.getAttribute("data-action");

                if (action === "add-plan-row") {
                    addEmptyPlanRow();
                } else if (action === "delete-plan-row") {
                    const idx = actionBtn.getAttribute("data-idx");
                    deletePlanRow(idx);
                } else if (action === "save-weekly-plan") {
                    saveWeeklyPlan();
                }
            });
        }

        function addEmptyPlanRow() {
            // Simplemente recargamos el plan con una fila nueva agregada
            const clienteSelect = document.getElementById("field-CLIENTE");
            if (!clienteSelect) return;

            const cliente = clienteSelect.value;
            if (!cliente) {
                if (Alerts) Alerts.showAlert("Seleccioná un cliente primero.", "warning");
                return;
            }

            // Obtener las filas actuales del DOM
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

                    // Solo agregar si no es una fila completamente vacía
                    if (row.empleado || row.diaSemana || row.horaEntrada || row.horasPlan || row.observaciones) {
                        currentRows.push(row);
                    }
                }
            });

            // Agregar nueva fila vacía AL INICIO (para que aparezca arriba)
            currentRows.unshift({
                empleado: "",
                diaSemana: "",
                horaEntrada: "",
                horasPlan: "",
                vigDesde: vigDesdeInputVal(),
                vigHasta: vigHastaInputVal(),
                observaciones: ""
            });

            // Reconstruir el panel
            buildWeeklyPlanPanel(currentRows, cliente, lastInfoHoras);

            // Expandir automáticamente el grupo "Sin asignar"
            setTimeout(() => {
                const sinAsignarCollapse = document.querySelector('[id*="collapse-Sin asignar"]');
                if (sinAsignarCollapse && !sinAsignarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(sinAsignarCollapse, { show: true });
                }
            }, 100);
        }

        function deletePlanRow(idx) {
            const clienteSelect = document.getElementById("field-CLIENTE");
            if (!clienteSelect) return;

            const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
            const cliente = selectedOption ? selectedOption.textContent : clienteSelect.value;
            if (!cliente) return;

            const panel = document.getElementById("plan-semanal-panel");
            if (!panel) return;

            captureOpenGroupKeys();

            // Obtener todas las filas actuales excepto la que queremos eliminar
            const currentRows = [];
            const allInputs = panel.querySelectorAll('[id^="plan-row-"]');
            const processedIndices = new Set();

            allInputs.forEach(input => {
                const match = input.id.match(/plan-row-(\d+)-/);
                if (match && !processedIndices.has(match[1])) {
                    const currentIdx = match[1];

                    // Saltar la fila que queremos eliminar
                    if (currentIdx === String(idx)) {
                        processedIndices.add(currentIdx);
                        return;
                    }

                    processedIndices.add(currentIdx);

                    const empleadoSelect = document.getElementById(`plan-row-${currentIdx}-empleado`);
                    const diaSelect = document.getElementById(`plan-row-${currentIdx}-dia`);
                    const horaInput = document.getElementById(`plan-row-${currentIdx}-horaEntrada`);
                    const horasInput = document.getElementById(`plan-row-${currentIdx}-horasPlan`);
                    const obsInput = document.getElementById(`plan-row-${currentIdx}-obs`);
                    const idInput = document.getElementById(`plan-row-${currentIdx}-id`);

                    const selectedOption = empleadoSelect && empleadoSelect.selectedOptions ? empleadoSelect.selectedOptions[0] : null;
                    currentRows.push({
                        id: idInput ? idInput.value : "",
                        empleado: selectedOption ? selectedOption.textContent : "",
                        idEmpleado: empleadoSelect ? empleadoSelect.value : "",
                        diaSemana: diaSelect ? diaSelect.value : "",
                        horaEntrada: horaInput ? horaInput.value : "",
                        horasPlan: horasInput ? horasInput.value : "",
                        vigDesde: vigDesdeInputVal(),
                        vigHasta: vigHastaInputVal(),
                        observaciones: obsInput ? obsInput.value : ""
                    });
                }
            });

            // Reconstruir el panel sin la fila eliminada
            buildWeeklyPlanPanel(currentRows, cliente, lastInfoHoras);
        }

        function saveWeeklyPlan() {
            const clienteSelect = document.getElementById("field-CLIENTE");
            if (!clienteSelect) return;

            const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
            const idCliente = clienteSelect.value;
            const cliente = selectedOption ? selectedOption.textContent : '';
            if (!idCliente) {
                if (Alerts) Alerts.showAlert("Seleccioná un cliente primero.", "warning");
                return;
            }

            const panel = document.getElementById("plan-semanal-panel");
            if (!panel) return;

            // Recolectar filas por índice de los inputs
            const itemsMap = new Map();
            const inputs = panel.querySelectorAll('[id^="plan-row-"]');
            inputs.forEach((el) => {
                // Fix: Use unambiguous IDs
                const match = el.id.match(/plan-row-(\d+)-(empleado|dia|horaEntrada|horasPlan|obs|id)/);
                if (!match) return;
                const idx = match[1];
                const field = match[2];

                if (!itemsMap.has(idx)) {
                    itemsMap.set(idx, {
                        id: "",
                        empleado: "",
                        idEmpleado: "",
                        diaSemana: "",
                        horaEntrada: "",
                        horasPlan: "",
                        vigDesde: vigDesdeInputVal(),
                        vigHasta: vigHastaInputVal(),
                        observaciones: ""
                    });
                }
                const obj = itemsMap.get(idx);
                const val = el.value;

                if (field === "id") obj.id = val;
                if (field === "empleado") {
                    const empleadoSelect = document.getElementById(`plan-row-${idx}-empleado`);
                    const selectedEmp = empleadoSelect && empleadoSelect.selectedOptions ? empleadoSelect.selectedOptions[0] : null;
                    obj.idEmpleado = empleadoSelect ? empleadoSelect.value : "";
                    obj.empleado = selectedEmp ? selectedEmp.textContent : "";
                }
                if (field === "dia") obj.diaSemana = val;
                if (field === "horaEntrada") obj.horaEntrada = val;
                if (field === "horasPlan") obj.horasPlan = val;
                if (field === "obs") obj.observaciones = val;
            });

            const items = Array.from(itemsMap.values()).filter(item =>
                item.id || item.empleado || item.diaSemana || item.horasPlan || item.observaciones
            );

            if (!items.length) {
                UiState && UiState.setGlobalLoading(false);
                setSavingState(false);
                Alerts && Alerts.showAlert("No hay filas para guardar. Agregá al menos un día.", "warning");
                return;
            }
            const missingEmp = items.find(item => item.empleado && !item.idEmpleado);
            if (missingEmp) {
                UiState && UiState.setGlobalLoading(false);
                setSavingState(false);
                Alerts && Alerts.showAlert("Seleccioná empleado desde la lista para guardar IDs.", "warning");
                return;
            }

            setSavingState(true);
            UiState.setGlobalLoading(true, "Guardando plan semanal...");

            // Pasamos currentOriginalVigencia para que el backend sepa qué reemplazar
            let originalVigencia = currentOriginalVigencia;
            if (!forceNewPlan && (!originalVigencia || (!originalVigencia.desde && !originalVigencia.hasta))) {
                const desde = vigDesdeInputVal();
                const hasta = vigHastaInputVal();
                if (desde || hasta) {
                    originalVigencia = { desde: desde, hasta: hasta };
                }
            }

            ApiService.call('saveWeeklyPlanForClient', cliente, items, forceNewPlan ? null : originalVigencia, idCliente)
                .then(function () {
                    if (Alerts) Alerts.showAlert("✅ Plan semanal guardado correctamente.", "success");
                    // Recargar la lista completa desde el servidor
                    reloadList();
                })
                .catch(function (err) {
                    if (Alerts) Alerts.showAlert("Error al guardar plan: " + err.message, "danger");
                })
                .finally(function () {
                    UiState.setGlobalLoading(false);
                    setSavingState(false);
                });
        }

        function setSavingState(isSaving) {
            const btn = document.getElementById('btn-save-weekly');
            if (!btn) return;
            if (isSaving) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Guardando...';
            } else {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-save2 me-1"></i>Guardar plan del cliente';
            }
        }

        function reloadList() {
            if (!currentContainer) return;

            // Mostrar loading en el contenedor actual
            currentContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><div class="mt-2">Actualizando lista...</div></div>';

            ApiService.call("searchRecords", "ASISTENCIA_PLAN", "")
                .then(function (records) {
                    renderList(currentContainer, records || []);
                })
                .catch(function (err) {
                    console.error("Error recargando lista:", err);
                    currentContainer.innerHTML = '<div class="alert alert-danger">Error al actualizar la lista.</div>';
                });
        }

        return {
            init,
            setup,
            render,
            renderList,
            fetchWeeklyPlanForClient,
            reloadList
        };
    })();

    global.WeeklyPlanPanel = WeeklyPlanPanel;
})(typeof window !== "undefined" ? window : this);
