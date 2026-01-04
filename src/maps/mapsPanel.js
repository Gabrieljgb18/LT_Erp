(function (global) {
  if (typeof document === "undefined") return;

  const MapPanel = (() => {
    let map = null;
    let markers = [];
    let markersByKey = new Map();
    let infoWindow = null;
    let cachedReference = { clientes: [], empleados: [] };
    let referenceIndex = {
      clientsById: new Map(),
      employeesById: new Map(),
      sortedClients: [],
      sortedEmployees: []
    };
    let cachedClientItems = [];
    let clientItemsDirty = true;
    let selectsDirty = true;
    let planData = null;
    let planIndex = createPlanIndex();
    let currentListItems = [];
    let listClickBound = false;
    let unsubscribeRef = null;
    let planRequestId = 0;
    let isPlanLoading = false;
    let isRefLoading = false;
    let clientDetailCache = new Map();

    const state = {
      employeeId: "",
      clientId: "",
      query: "",
      planFilter: "all", // all | planned | unplanned
      weekStart: getMondayOfWeek(new Date())
    };

    function buildPanelHtml() {
      return `
        <div class="lt-surface lt-surface--subtle p-3 mb-3">
          <div class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center justify-content-between">
            <div>
              <div class="small text-muted">Mapa operativo</div>
              <h5 class="m-0">Planificación semanal</h5>
            </div>
            <div class="map-week-nav">
              <button type="button" class="btn btn-outline-secondary btn-sm" title="Semana anterior" data-map-week-prev>
                <i class="bi bi-chevron-left"></i>
              </button>
              <div class="map-week-label" data-map-week-label>Semana</div>
              <button type="button" class="btn btn-outline-secondary btn-sm" title="Semana siguiente" data-map-week-next>
                <i class="bi bi-chevron-right"></i>
              </button>
              <button type="button" class="btn btn-outline-primary btn-sm" title="Ir a hoy" data-map-week-today>
                <i class="bi bi-calendar-check"></i>
              </button>
              <button type="button" class="btn btn-outline-primary btn-sm" title="Actualizar plan" data-map-week-refresh>
                <i class="bi bi-arrow-repeat"></i>
              </button>
            </div>
          </div>
          <div class="map-filters mt-3">
            <div class="map-filter">
              <label class="form-label">Empleado</label>
              <select class="form-select form-select-sm" data-map-employee>
                <option value="">Todos los empleados</option>
              </select>
            </div>
            <div class="map-filter">
              <label class="form-label">Cliente</label>
              <select class="form-select form-select-sm" data-map-client>
                <option value="">Todos los clientes</option>
              </select>
            </div>
            <div class="map-filter">
              <label class="form-label">Estado</label>
              <div class="map-status-toggle" data-map-plan-toggle>
                <button type="button" class="btn btn-outline-primary btn-sm active" data-map-plan="all">Todos</button>
                <button type="button" class="btn btn-outline-primary btn-sm" data-map-plan="planned">Planificados</button>
                <button type="button" class="btn btn-outline-primary btn-sm" data-map-plan="unplanned">Sin planificar</button>
              </div>
            </div>
            <div class="map-filter map-filter--wide">
              <label class="form-label">Buscar cliente</label>
              <input type="search" class="form-control form-control-sm" placeholder="Nombre o dirección" data-map-search>
            </div>
          </div>
        </div>
        <div class="row g-3">
          <div class="col-12 col-xl-8">
            <div class="lt-surface map-canvas-wrapper">
              <div id="map-canvas" class="map-canvas"></div>
              <div class="map-canvas-overlay d-none" data-map-overlay></div>
            </div>
          </div>
          <div class="col-12 col-xl-4">
            <div class="lt-surface p-3 map-list">
              <div class="map-summary mb-3" data-map-summary></div>
              <div class="map-employee-card d-none" data-map-employee-card></div>
              <div class="map-items" data-map-items></div>
              <div class="map-missing mt-3" data-map-missing></div>
            </div>
          </div>
        </div>
      `;
    }

    function createPlanIndex() {
      return {
        plannedClientIds: new Set(),
        clientAssignments: new Map(),
        employeeAssignments: new Map()
      };
    }

    const escapeHtml = (global.HtmlHelpers && typeof global.HtmlHelpers.escapeHtml === "function")
      ? global.HtmlHelpers.escapeHtml
      : function (value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      };

    function getClientDisplayName(cliente) {
      if (!cliente) return "";
      if (global.HtmlHelpers && typeof global.HtmlHelpers.getClientDisplayName === "function") {
        return global.HtmlHelpers.getClientDisplayName(cliente);
      }
      return cliente.nombre || cliente.razonSocial || "";
    }

    function normalizeText(value) {
      return String(value || "").toLowerCase();
    }

    function hasCoords(item) {
      return typeof item.lat === "number" && !isNaN(item.lat) &&
        typeof item.lng === "number" && !isNaN(item.lng);
    }

    function toNumber(value) {
      if (value === "" || value == null) return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    }

    function getMondayOfWeek(date) {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    }

    function addDays(date, days) {
      const d = new Date(date);
      d.setDate(d.getDate() + days);
      return d;
    }

    function formatDateISO(date) {
      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    function formatDateShort(date) {
      const d = new Date(date);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${dd}/${mm}`;
    }

    function formatWeekLabel(weekStart) {
      const end = addDays(weekStart, 6);
      return `Semana ${formatDateShort(weekStart)} - ${formatDateShort(end)}`;
    }

    function buildPlanIndex(data) {
      const index = createPlanIndex();
      if (!data || !Array.isArray(data.dias)) return index;

      data.dias.forEach(dia => {
        const dayLabel = dia.diaDisplay || dia.dia || dia.fechaDisplay || "";
        (dia.clientes || []).forEach(cliente => {
          const rawId = cliente && cliente.idCliente != null ? cliente.idCliente : "";
          const clientId = String(rawId || "").trim();
          if (!clientId) return;

          index.plannedClientIds.add(clientId);

          let clientEntry = index.clientAssignments.get(clientId);
          if (!clientEntry) {
            clientEntry = { id: clientId, empleados: new Set(), dias: new Set() };
            index.clientAssignments.set(clientId, clientEntry);
          }
          if (dayLabel) clientEntry.dias.add(dayLabel);

          (cliente.asignaciones || []).forEach(asg => {
            const empId = asg && asg.idEmpleado != null ? String(asg.idEmpleado).trim() : "";
            if (!empId) return;
            const empName = asg && asg.empleado ? String(asg.empleado).trim() : "";
            clientEntry.empleados.add(empName || empId);

            let empEntry = index.employeeAssignments.get(empId);
            if (!empEntry) {
              empEntry = { id: empId, nombre: empName || "", clientes: new Set() };
              index.employeeAssignments.set(empId, empEntry);
            }
            empEntry.clientes.add(clientId);
          });
        });
      });

      return index;
    }

    function getEmployeeById(id) {
      if (!id) return null;
      return referenceIndex.employeesById.get(String(id).trim()) || null;
    }

    function getClientById(id) {
      if (!id) return null;
      return referenceIndex.clientsById.get(String(id).trim()) || null;
    }

    function parseTags(value) {
      if (!value) return [];
      return String(value)
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);
    }

    function formatDocLabel(docType, docNumber) {
      const type = String(docType || "").trim();
      const number = String(docNumber || "").trim();
      if (!type && !number) return "";
      if (global.InputUtils && typeof global.InputUtils.formatDocLabel === "function") {
        return global.InputUtils.formatDocLabel(type || "CUIT", number);
      }
      return `${type} ${number}`.trim();
    }

    function buildClientDetailContent(ref, record, loading) {
      const data = record && record.record ? record.record : {};
      const nombre = data["NOMBRE"] || (ref && ref.nombre) || "";
      const razon = data["RAZON SOCIAL"] || data["RAZÓN SOCIAL"] || (ref && ref.razonSocial) || "";
      const docType = data["TIPO DOCUMENTO"] || (ref && ref.docType) || "";
      const docNumber = data["NUMERO DOCUMENTO"] || (ref && ref.docNumber) || "";
      const direccion = data["DIRECCION"] || (ref && ref.direccion) || "";
      const tipoServicio = data["TIPO SERVICIO"] || (ref && ref.tipoServicio) || "";
      const descripcion = data["DESCRIPCION"] || "";
      const administrador = data["NOMBRE ADMINISTRADOR"] || "";
      const correoAdmin = data["CORREO ADMINISTRACION"] || "";
      const telAdmin = data["TELEFONO ADMINISTRACION"] || "";
      const correoFact = data["CORREO FACTURACION"] || "";
      const encargado = data["ENCARGADO"] || "";
      const telEncargado = data["TELEFONO"] || "";
      const valorHora = data["VALOR HORA"] || "";
      const fechaContrato = data["FECHA CONTRATO"] || "";
      const tags = parseTags(data["ETIQUETAS"] || (ref && ref.tags) || "");
      const docLabel = formatDocLabel(docType, docNumber);

      const detailItem = (label, value) => {
        if (!value) return "";
        return `
          <div class="map-client-detail__item">
            <div class="map-client-detail__label">${escapeHtml(label)}</div>
            <div class="map-client-detail__value">${escapeHtml(value)}</div>
          </div>
        `;
      };

      const tagsHtml = tags.length
        ? `<div class="map-client-detail__tags">${tags.map(tag => `<span class="lt-chip lt-chip--muted">${escapeHtml(tag)}</span>`).join("")}</div>`
        : `<div class="text-muted small">Sin etiquetas</div>`;

      const loadingHtml = loading
        ? `<div class="map-client-detail__loading"><span class="spinner-border spinner-border-sm"></span>Actualizando datos...</div>`
        : "";

      return `
        <div class="map-client-detail">
          <div class="map-client-detail__header">
            <div class="map-client-detail__title">${escapeHtml(nombre || razon || "Cliente")}</div>
            ${razon ? `<div class="map-client-detail__subtitle">${escapeHtml(razon)}</div>` : ""}
          </div>
          ${loadingHtml}
          <div class="map-client-detail__grid">
            ${detailItem("Documento", docLabel)}
            ${detailItem("Dirección", direccion)}
            ${detailItem("Tipo de servicio", tipoServicio)}
            ${detailItem("Administrador", administrador)}
            ${detailItem("Teléfono administración", telAdmin)}
            ${detailItem("Correo administración", correoAdmin)}
            ${detailItem("Correo facturación", correoFact)}
            ${detailItem("Encargado", encargado)}
            ${detailItem("Teléfono encargado", telEncargado)}
            ${detailItem("Fecha contrato", fechaContrato)}
            ${detailItem("Valor hora", valorHora)}
          </div>
          ${descripcion ? `<div class="map-client-detail__description">${escapeHtml(descripcion)}</div>` : ""}
          <div class="map-client-detail__tags-block">
            <div class="map-client-detail__label">Etiquetas</div>
            ${tagsHtml}
          </div>
        </div>
      `;
    }

    function openClientDetailModal(clientId) {
      if (!clientId || !global.bootstrap || !global.bootstrap.Modal) {
        if (global.Alerts && global.Alerts.showAlert) {
          global.Alerts.showAlert("No se pudo abrir el detalle del cliente.", "warning");
        }
        return;
      }

      const ref = getClientById(clientId) || {};
      const name = getClientDisplayName(ref) || "Cliente";
      const modalId = "map-client-detail-modal";

      const oldModal = document.getElementById(modalId);
      if (oldModal) oldModal.remove();

      const cached = clientDetailCache.get(clientId);
      const modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
          <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header bg-primary text-white">
                <h5 class="modal-title">
                  <i class="bi bi-building me-2"></i>${escapeHtml(name)}
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div data-map-client-detail>
                  ${buildClientDetailContent(ref, cached, !cached)}
                </div>
              </div>
              <div class="modal-footer">
                ${ref && ref.direccion ? `
                  <a class="btn btn-outline-primary" target="_blank" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ref.direccion)}">
                    <i class="bi bi-geo-alt me-1"></i> Ver en mapa
                  </a>
                ` : ""}
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML("beforeend", modalHtml);
      const modalEl = document.getElementById(modalId);
      const modal = new bootstrap.Modal(modalEl);
      modal.show();

      modalEl.addEventListener("hidden.bs.modal", () => {
        modalEl.remove();
      });

      if (cached) return;

      if (!global.ApiService) return;

      global.ApiService.callLatest(`client-detail-${clientId}`, "getRecordById", "CLIENTES", clientId)
        .then(result => {
          if (result && result.ignored) return;
          if (!result || !result.record) return;
          clientDetailCache.set(clientId, result);
          const detail = modalEl.querySelector("[data-map-client-detail]");
          if (detail) {
            detail.innerHTML = buildClientDetailContent(ref, result, false);
          }
        })
        .catch(() => {
          const detail = modalEl.querySelector("[data-map-client-detail]");
          if (detail) {
            detail.innerHTML = buildClientDetailContent(ref, null, false);
          }
        });
    }

    function openPlanModal(clientId) {
      if (!clientId || !global.WeeklyPlanPanel || !global.bootstrap || !global.bootstrap.Modal) {
        if (global.Alerts && global.Alerts.showAlert) {
          global.Alerts.showAlert("No se pudo abrir el plan semanal.", "warning");
        }
        return;
      }

      const modalId = "map-plan-modal";
      const oldModal = document.getElementById(modalId);
      if (oldModal) oldModal.remove();

      const existingPanel = document.getElementById("plan-semanal-panel");
      if (existingPanel && !existingPanel.closest(`#${modalId}`)) {
        existingPanel.remove();
      }

      const ref = getClientById(clientId);
      const name = getClientDisplayName(ref) || "Cliente";

      const modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
          <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header bg-primary text-white">
                <h5 class="modal-title">
                  <i class="bi bi-calendar-week me-2"></i>Plan semanal · ${escapeHtml(name)}
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div id="map-plan-panel"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML("beforeend", modalHtml);
      const modalEl = document.getElementById(modalId);
      const modal = new bootstrap.Modal(modalEl);
      modal.show();

      modalEl.addEventListener("hidden.bs.modal", () => {
        modalEl.remove();
      });

      const panel = modalEl.querySelector("#map-plan-panel");
      if (!panel) return;

      if (typeof global.WeeklyPlanPanel.init === "function") {
        global.WeeklyPlanPanel.init(cachedReference);
      }
      global.WeeklyPlanPanel.render(panel);

      const select = modalEl.querySelector("#field-CLIENTE");
      if (select) {
        select.value = clientId;
        select.dispatchEvent(new Event("change"));
      }
    }

    function buildReferenceIndex() {
      const clients = cachedReference.clientes || [];
      const employees = cachedReference.empleados || [];
      const clientsById = new Map();
      const employeesById = new Map();

      clients.forEach(cli => {
        const id = cli && cli.id != null ? String(cli.id).trim() : "";
        if (id) clientsById.set(id, cli);
      });

      employees.forEach(emp => {
        const id = emp && emp.id != null ? String(emp.id).trim() : "";
        if (id) employeesById.set(id, emp);
      });

      referenceIndex = {
        clientsById,
        employeesById,
        sortedClients: clients.slice().sort((a, b) => getClientDisplayName(a).localeCompare(getClientDisplayName(b))),
        sortedEmployees: employees.slice().sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")))
      };
    }

    function rebuildClientItems() {
      const clients = referenceIndex.sortedClients.length
        ? referenceIndex.sortedClients
        : (cachedReference.clientes || []);
      cachedClientItems = clients.map(cli => {
        const id = cli && cli.id != null ? String(cli.id).trim() : "";
        if (!id) return null;
        const name = getClientDisplayName(cli);
        if (!name) return null;
        const assignment = planIndex.clientAssignments.get(id);
        const assignedEmployees = assignment ? Array.from(assignment.empleados).filter(Boolean) : [];
        return {
          type: "cliente",
          id: id,
          name: name,
          direccion: cli.direccion || "",
          lat: toNumber(cli.lat),
          lng: toNumber(cli.lng),
          isPlanned: planIndex.plannedClientIds.has(id),
          assignedEmployees: assignedEmployees
        };
      }).filter(Boolean);
      clientItemsDirty = false;
    }

    function applyFilters(items) {
      const query = normalizeText(state.query);
      let filtered = items.slice();

      if (state.clientId) {
        filtered = filtered.filter(item => item.id === state.clientId);
      }

      if (state.employeeId) {
        const entry = planIndex.employeeAssignments.get(state.employeeId);
        const allowed = entry ? entry.clientes : null;
        filtered = allowed ? filtered.filter(item => allowed.has(item.id)) : [];
      }

      const applyPlanFilter = !(state.employeeId || state.clientId);
      if (applyPlanFilter) {
        if (state.planFilter === "planned") {
          filtered = filtered.filter(item => item.isPlanned);
        } else if (state.planFilter === "unplanned") {
          filtered = filtered.filter(item => !item.isPlanned);
        }
      }

      if (query) {
        filtered = filtered.filter(item => {
          const haystack = normalizeText(`${item.name} ${item.direccion}`);
          return haystack.includes(query);
        });
      }

      return filtered;
    }

    function splitByCoords(items) {
      const withCoords = [];
      const missing = [];
      items.forEach(item => {
        if (hasCoords(item)) {
          withCoords.push(item);
        } else {
          missing.push(item);
        }
      });
      return { withCoords, missing };
    }

    function buildEmployeeMarker() {
      if (!state.employeeId) return null;
      const emp = getEmployeeById(state.employeeId);
      if (!emp) return null;
      const lat = toNumber(emp.lat);
      const lng = toNumber(emp.lng);
      return {
        type: "empleado",
        id: String(state.employeeId),
        name: emp.nombre || "Empleado",
        direccion: emp.direccion || "",
        lat: lat,
        lng: lng,
        isPlanned: true,
        assignedEmployees: []
      };
    }

    function renderSummary(container, filtered, missing) {
      const summary = container.querySelector("[data-map-summary]");
      if (!summary) return;

      const plannedCount = filtered.filter(item => item.isPlanned).length;
      const unplannedCount = filtered.length - plannedCount;
      const total = filtered.length;

      const loadingBadge = isPlanLoading
        ? '<span class="map-loading-inline"><span class="spinner-border spinner-border-sm"></span>Actualizando</span>'
        : '';

      summary.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="small text-muted">Resumen semanal</div>
          ${loadingBadge}
        </div>
        <div class="map-summary-chips">
          <span class="lt-chip lt-chip--primary">Mostrados: ${total}</span>
          <span class="lt-chip lt-chip--success">Planificados: ${plannedCount}</span>
          <span class="lt-chip lt-chip--muted">Sin planificar: ${unplannedCount}</span>
          <span class="lt-chip lt-chip--muted">Sin coordenadas: ${missing.length}</span>
        </div>
        <div class="map-legend">
          <span class="map-legend__item"><span class="map-legend__dot map-legend__dot--employee"></span>Empleados</span>
          <span class="map-legend__item"><span class="map-legend__dot map-legend__dot--client"></span>Clientes</span>
          <span class="map-legend__item"><span class="map-legend__dot map-legend__dot--planned"></span>Planificados</span>
        </div>
      `;
    }

    function renderEmployeeCard(container, filtered) {
      const card = container.querySelector("[data-map-employee-card]");
      if (!card) return;

      if (!state.employeeId) {
        card.classList.add("d-none");
        card.innerHTML = "";
        return;
      }

      const emp = getEmployeeById(state.employeeId);
      if (!emp) {
        card.classList.remove("d-none");
        card.innerHTML = `
          <div class="map-employee-card__title">Empleado seleccionado</div>
          <div class="map-employee-card__name">Sin información</div>
        `;
        return;
      }

      const entry = planIndex.employeeAssignments.get(state.employeeId);
      const assignedCount = entry ? entry.clientes.size : 0;
      const address = emp.direccion || "Sin dirección";

      card.classList.remove("d-none");
      card.innerHTML = `
        <div class="map-employee-card__title">Empleado seleccionado</div>
        <div class="map-employee-card__name">${escapeHtml(emp.nombre || "Empleado")}</div>
        <div class="map-employee-card__meta">Direccion: ${escapeHtml(address)}</div>
        <div class="map-employee-card__meta">Clientes esta semana: ${assignedCount}</div>
      `;
    }

    function renderList(container, items) {
      const list = container.querySelector("[data-map-items]");
      if (!list) return;

      if (!items.length) {
        list.innerHTML = '<div class="text-muted small map-empty">No hay clientes para mostrar.</div>';
        return;
      }

      list.innerHTML = items.map(item => {
        const name = escapeHtml(item.name);
        const direccion = escapeHtml(item.direccion || "Sin dirección");
        const statusLabel = item.isPlanned ? "Planificado" : "Sin planificar";
        const statusClass = item.isPlanned ? "map-status--planned" : "map-status--unplanned";

        return `
          <div class="map-item" data-map-id="${item.id}">
            <div class="map-item__title">
              <button type="button" class="map-item__focus" data-map-action="focus" data-map-id="${item.id}">
                ${name}
              </button>
              <span class="map-status ${statusClass}">${statusLabel}</span>
            </div>
            <div class="map-item__meta">${direccion}</div>
            <div class="map-item__actions">
              <button type="button" class="btn btn-light btn-sm" data-map-action="detail" data-map-id="${item.id}">
                <i class="bi bi-info-circle me-1"></i>Datos
              </button>
              <button type="button" class="btn btn-outline-primary btn-sm" data-map-action="plan" data-map-id="${item.id}">
                <i class="bi bi-calendar-week me-1"></i>Plan
              </button>
            </div>
          </div>
        `;
      }).join("");
      bindListClick(list);
    }

    function bindListClick(list) {
      if (listClickBound || !list) return;
      listClickBound = true;
      list.addEventListener("click", function (e) {
        const actionBtn = e.target.closest("[data-map-action]");
        const card = e.target.closest(".map-item");
        if (!card) return;
        const id = (actionBtn && actionBtn.getAttribute("data-map-id")) || card.getAttribute("data-map-id");
        const item = currentListItems.find(entry => entry.id === id);
        if (!item) return;

        if (!actionBtn) {
          focusItem(item);
          return;
        }

        const action = actionBtn.getAttribute("data-map-action");
        if (action === "detail") {
          openClientDetailModal(item.id);
          return;
        }
        if (action === "plan") {
          openPlanModal(item.id);
          return;
        }
        focusItem(item);
      });
    }

    function renderMissing(container, missing) {
      const section = container.querySelector("[data-map-missing]");
      if (!section) return;

      if (!missing.length) {
        section.innerHTML = "";
        return;
      }

      section.innerHTML = `
        <div class="small text-muted mb-2">Sin coordenadas</div>
        <div class="map-missing-list">
          ${missing.map(item => {
            const name = escapeHtml(item.name);
            const status = item.isPlanned ? "Planificado" : "Sin planificar";
            return `<div class="map-missing-item">${name} <span>${status}</span></div>`;
          }).join("")}
        </div>
      `;
    }

    function ensureMap(container, items) {
      const overlay = container.querySelector("[data-map-overlay]");
      const mapEl = container.querySelector("#map-canvas");
      if (!mapEl) return;

      if (!global.MapsLoader || !global.MapsLoader.hasKey()) {
        if (overlay) {
          overlay.classList.remove("d-none");
          overlay.innerHTML = '<div class="text-center"><i class="bi bi-exclamation-circle"></i><div class="mt-2">Configura MAPS_API_KEY para usar el mapa.</div></div>';
        }
        return;
      }

      if (!global.MapsLoader.isAvailable()) {
        if (overlay) {
          overlay.classList.remove("d-none");
          overlay.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div><div class="mt-2">Cargando mapa...</div></div>';
        }
        global.MapsLoader.onReady(function () {
          ensureMap(container, items);
        });
        return;
      }

      if (overlay) overlay.classList.add("d-none");

      if (!map) {
        map = new google.maps.Map(mapEl, {
          center: { lat: -34.6037, lng: -58.3816 },
          zoom: 11,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false
        });
        infoWindow = new google.maps.InfoWindow();
      }

      updateMarkers(items);
    }

    function getMarkerKey(item) {
      return `${item.type}:${item.id}`;
    }

    const MAP_ICON_BASE = "https:\\/\\/maps.google.com/mapfiles/ms/icons/";

    function getMarkerIcon(item) {
      if (item.type === "empleado") {
        return MAP_ICON_BASE + "purple-dot.png";
      }
      return item.isPlanned
        ? MAP_ICON_BASE + "green-dot.png"
        : MAP_ICON_BASE + "blue-dot.png";
    }

    function updateMarkers(items) {
      markers.forEach(marker => marker.setMap(null));
      markers = [];
      markersByKey.clear();

      if (!map) return;

      const bounds = new google.maps.LatLngBounds();
      const hasItems = items.length > 0;

      items.forEach(item => {
        if (!hasCoords(item)) return;
        const position = { lat: item.lat, lng: item.lng };
        const marker = new google.maps.Marker({
          position,
          map,
          title: item.name || "",
          icon: getMarkerIcon(item)
        });
        marker.addListener("click", function () {
          openInfo(marker, item);
        });
        markers.push(marker);
        markersByKey.set(getMarkerKey(item), marker);
        bounds.extend(position);
      });

      if (hasItems) {
        if (items.length === 1) {
          map.setCenter(bounds.getCenter());
          map.setZoom(15);
        } else {
          map.fitBounds(bounds);
        }
      }
    }

    function openInfo(marker, item) {
      if (!infoWindow || !marker) return;
      const name = escapeHtml(item.name);
      const direccion = escapeHtml(item.direccion || "Sin dirección");

      if (item.type === "empleado") {
        const content = `
          <div class="map-info">
            <div class="map-info__title">${name}</div>
            <div class="map-info__meta">Empleado</div>
            <div class="map-info__address">${direccion}</div>
          </div>
        `;
        infoWindow.setContent(content);
        infoWindow.open({ anchor: marker, map });
        return;
      }

      const statusText = item.isPlanned ? "Planificado" : "Sin planificar";
      const employees = item.assignedEmployees && item.assignedEmployees.length
        ? escapeHtml(item.assignedEmployees.join(", "))
        : "Sin asignaciones";

      const content = `
        <div class="map-info">
          <div class="map-info__title">${name}</div>
          <div class="map-info__meta">${statusText}</div>
          <div class="map-info__address">${direccion}</div>
          <div class="map-info__employees">Empleados: ${employees}</div>
        </div>
      `;
      infoWindow.setContent(content);
      infoWindow.open({ anchor: marker, map });
    }

    function focusItem(item) {
      if (!map || !item) return;
      const key = getMarkerKey(item);
      const marker = markersByKey.get(key);
      if (!marker) return;
      const position = marker.getPosition();
      if (position) {
        map.panTo(position);
        map.setZoom(15);
      }
      openInfo(marker, item);
    }

    function updateWeekLabel(container) {
      const label = container.querySelector("[data-map-week-label]");
      if (!label) return;
      if (planData && planData.semana && planData.semana.label) {
        label.textContent = `Semana ${planData.semana.label}`;
      } else {
        label.textContent = formatWeekLabel(state.weekStart);
      }
    }

    function populateSelects(container) {
      const employeeSelect = container.querySelector("[data-map-employee]");
      if (employeeSelect) {
        const current = state.employeeId;
        employeeSelect.innerHTML = '<option value="">Todos los empleados</option>';
        const empleados = referenceIndex.sortedEmployees.length
          ? referenceIndex.sortedEmployees
          : (cachedReference.empleados || []);
        empleados.forEach(emp => {
          const id = emp && emp.id != null ? String(emp.id).trim() : "";
          const nombre = emp && emp.nombre ? String(emp.nombre).trim() : "";
          if (!id || !nombre) return;
          const opt = document.createElement("option");
          opt.value = id;
          opt.textContent = nombre;
          if (id === current) opt.selected = true;
          employeeSelect.appendChild(opt);
        });
      }

      const clientSelect = container.querySelector("[data-map-client]");
      if (clientSelect) {
        const current = state.clientId;
        clientSelect.innerHTML = '<option value="">Todos los clientes</option>';
        const clientes = referenceIndex.sortedClients.length
          ? referenceIndex.sortedClients
          : (cachedReference.clientes || []);
        clientes.forEach(cli => {
          const id = cli && cli.id != null ? String(cli.id).trim() : "";
          const nombre = getClientDisplayName(cli);
          if (!id || !nombre) return;
          const opt = document.createElement("option");
          opt.value = id;
          opt.textContent = nombre;
          if (id === current) opt.selected = true;
          clientSelect.appendChild(opt);
        });
      }
    }

    function updatePlanToggleState(container) {
      const buttons = container.querySelectorAll("[data-map-plan]");
      const disabled = !!(state.employeeId || state.clientId);
      buttons.forEach(btn => {
        const value = btn.getAttribute("data-map-plan");
        btn.classList.toggle("active", value === state.planFilter);
        btn.disabled = disabled;
      });
    }

    function renderView(container) {
      if (!container) return;

      updateWeekLabel(container);
      if (selectsDirty) {
        populateSelects(container);
        selectsDirty = false;
      }
      updatePlanToggleState(container);

      if (isRefLoading && (!cachedReference.clientes || !cachedReference.clientes.length)) {
        const list = container.querySelector("[data-map-items]");
        if (list) {
          list.innerHTML = '<div class="text-muted small map-empty">Cargando datos...</div>';
        }
        return;
      }

      if (clientItemsDirty) rebuildClientItems();
      const clients = cachedClientItems;
      const filtered = applyFilters(clients);
      const split = splitByCoords(filtered);

      renderSummary(container, filtered, split.missing);
      renderEmployeeCard(container, filtered);
      renderList(container, split.withCoords);
      renderMissing(container, split.missing);

      currentListItems = split.withCoords;

      const mapItems = split.withCoords.slice();
      const employeeMarker = buildEmployeeMarker();
      if (employeeMarker && hasCoords(employeeMarker)) {
        mapItems.push(employeeMarker);
      }
      ensureMap(container, mapItems);
    }

    function refreshReferenceData(container) {
      if (!global.ReferenceService) return;
      isRefLoading = true;
      renderView(container);

      global.ReferenceService.load()
        .then(data => {
          cachedReference = data || { clientes: [], empleados: [] };
          buildReferenceIndex();
          clientItemsDirty = true;
          selectsDirty = true;
        })
        .catch(() => {
          cachedReference = { clientes: [], empleados: [] };
          buildReferenceIndex();
          clientItemsDirty = true;
          selectsDirty = true;
        })
        .finally(() => {
          isRefLoading = false;
          renderView(container);
        });
    }

    function refreshPlanData(container) {
      if (!global.ApiService) return;
      const requestId = ++planRequestId;
      isPlanLoading = true;
      renderView(container);

      const weekStartStr = formatDateISO(state.weekStart);
      global.ApiService.call("getWeeklyClientOverview", { weekStartDate: weekStartStr })
        .then(data => {
          if (requestId !== planRequestId) return;
          if (data && data.error) throw new Error(data.error);
          planData = data || null;
          planIndex = buildPlanIndex(planData);
          clientItemsDirty = true;
        })
        .catch(() => {
          if (requestId !== planRequestId) return;
          planData = null;
          planIndex = createPlanIndex();
          clientItemsDirty = true;
        })
        .finally(() => {
          if (requestId !== planRequestId) return;
          isPlanLoading = false;
          renderView(container);
        });
    }

    function attachEvents(container) {
      const employeeSelect = container.querySelector("[data-map-employee]");
      if (employeeSelect) {
        employeeSelect.addEventListener("change", function () {
          state.employeeId = employeeSelect.value || "";
          renderView(container);
        });
      }

      const clientSelect = container.querySelector("[data-map-client]");
      if (clientSelect) {
        clientSelect.addEventListener("change", function () {
          state.clientId = clientSelect.value || "";
          renderView(container);
        });
      }

      const planButtons = container.querySelectorAll("[data-map-plan]");
      planButtons.forEach(btn => {
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          const value = btn.getAttribute("data-map-plan") || "all";
          state.planFilter = value;
          renderView(container);
        });
      });

      const searchInput = container.querySelector("[data-map-search]");
      if (searchInput) {
        let searchTimer = null;
        searchInput.addEventListener("input", function () {
          clearTimeout(searchTimer);
          searchTimer = setTimeout(() => {
            state.query = searchInput.value || "";
            renderView(container);
          }, 200);
        });
      }

      const prevBtn = container.querySelector("[data-map-week-prev]");
      if (prevBtn) {
        prevBtn.addEventListener("click", function () {
          state.weekStart = addDays(state.weekStart, -7);
          refreshPlanData(container);
        });
      }

      const nextBtn = container.querySelector("[data-map-week-next]");
      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          state.weekStart = addDays(state.weekStart, 7);
          refreshPlanData(container);
        });
      }

      const todayBtn = container.querySelector("[data-map-week-today]");
      if (todayBtn) {
        todayBtn.addEventListener("click", function () {
          state.weekStart = getMondayOfWeek(new Date());
          refreshPlanData(container);
        });
      }

      const refreshBtn = container.querySelector("[data-map-week-refresh]");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", function () {
          refreshPlanData(container);
        });
      }
    }

    function isActiveView() {
      const view = document.getElementById("view-mapa");
      return !!(view && !view.classList.contains("d-none"));
    }

    function render(containerId) {
      const container = typeof containerId === "string"
        ? document.getElementById(containerId)
        : containerId;
      if (!container) return;

      container.innerHTML = buildPanelHtml();
      map = null;
      markers = [];
      markersByKey = new Map();
      infoWindow = null;
      currentListItems = [];
      cachedClientItems = [];
      clientItemsDirty = true;
      selectsDirty = true;
      listClickBound = false;
      attachEvents(container);

      refreshReferenceData(container);
      refreshPlanData(container);

      if (unsubscribeRef) unsubscribeRef();
      if (global.ReferenceService && typeof global.ReferenceService.subscribe === "function") {
        unsubscribeRef = global.ReferenceService.subscribe(function () {
          if (isActiveView()) {
            refreshReferenceData(container);
          }
        });
      }
    }

    return {
      render
    };
  })();

  global.MapPanel = MapPanel;
})(typeof window !== "undefined" ? window : this);
