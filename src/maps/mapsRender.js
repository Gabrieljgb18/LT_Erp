/**
 * MapsPanelRender
 * Render del mapa.
 */
(function (global) {
  const state = global.MapsPanelState;
  if (!state) {
    console.error("MapsPanelState no disponible");
    return;
  }
  const Dom = state.Dom;

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
            <label class="form-label">Clientes del empleado</label>
            <div class="map-status-toggle" data-map-employee-scope>
              <button type="button" class="btn btn-outline-primary btn-sm active" data-map-employee-scope="all">Todos</button>
              <button type="button" class="btn btn-outline-primary btn-sm" data-map-employee-scope="assigned">Asignados</button>
            </div>
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

  function isAssignedToSelectedEmployee(clientId) {
    if (!state.filters.employeeId || !clientId) return false;
    const entry = state.planIndex.employeeAssignments.get(state.filters.employeeId);
    return !!(entry && entry.clientes && entry.clientes.has(clientId));
  }

  function setActiveClient(container, clientId) {
    state.selectedClientId = clientId || "";
    const root = container || state.rootContainer || document;
    const list = root.querySelector ? root.querySelector("[data-map-items]") : null;
    if (!list) return;
    list.querySelectorAll(".map-item").forEach((el) => {
      const isActive = el.getAttribute("data-map-id") === state.selectedClientId;
      el.classList.toggle("map-item--active", isActive);
    });
    if (state.selectedClientId) {
      const escaped = (typeof CSS !== "undefined" && CSS && typeof CSS.escape === "function")
        ? CSS.escape(state.selectedClientId)
        : String(state.selectedClientId).replace(/"/g, '\\"');
      const active = list.querySelector(`[data-map-id="${escaped}"]`);
      if (active && active.scrollIntoView) {
        active.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
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
    const tags = state.parseTags(data["ETIQUETAS"] || (ref && ref.tags) || "");
    const docLabel = state.formatDocLabel(docType, docNumber);

    const root = Dom.el("div", { className: "map-client-detail" });
    const header = Dom.el("div", { className: "map-client-detail__header" }, [
      Dom.el("div", { className: "map-client-detail__title", text: nombre || razon || "Cliente" }),
      razon ? Dom.el("div", { className: "map-client-detail__subtitle", text: razon }) : null
    ]);
    root.appendChild(header);

    if (loading) {
      root.appendChild(
        Dom.el("div", { className: "map-client-detail__loading" }, [
          Dom.el("span", { className: "spinner-border spinner-border-sm" }),
          Dom.text("Actualizando datos...")
        ])
      );
    }

    const grid = Dom.el("div", { className: "map-client-detail__grid" });
    const addItem = (label, value) => {
      if (!value) return;
      grid.appendChild(
        Dom.el("div", { className: "map-client-detail__item" }, [
          Dom.el("div", { className: "map-client-detail__label", text: label }),
          Dom.el("div", { className: "map-client-detail__value", text: value })
        ])
      );
    };
    addItem("Documento", docLabel);
    addItem("Dirección", direccion);
    addItem("Tipo de servicio", tipoServicio);
    addItem("Administrador", administrador);
    addItem("Teléfono administración", telAdmin);
    addItem("Correo administración", correoAdmin);
    addItem("Correo facturación", correoFact);
    addItem("Encargado", encargado);
    addItem("Teléfono encargado", telEncargado);
    addItem("Fecha contrato", fechaContrato);
    addItem("Valor hora", valorHora);
    root.appendChild(grid);

    if (descripcion) {
      root.appendChild(Dom.el("div", { className: "map-client-detail__description", text: descripcion }));
    }

    const tagsBlock = Dom.el("div", { className: "map-client-detail__tags-block" });
    tagsBlock.appendChild(Dom.el("div", { className: "map-client-detail__label", text: "Etiquetas" }));
    if (tags.length) {
      const tagsWrap = Dom.el("div", { className: "map-client-detail__tags" });
      tags.forEach((tag) => {
        tagsWrap.appendChild(Dom.el("span", { className: "lt-chip lt-chip--muted", text: tag }));
      });
      tagsBlock.appendChild(tagsWrap);
    } else {
      tagsBlock.appendChild(Dom.el("div", { className: "text-muted small", text: "Sin etiquetas" }));
    }
    root.appendChild(tagsBlock);

    return root;
  }

  function renderClientDetail(detailEl, ref, record, loading) {
    if (!detailEl) return;
    Dom.clear(detailEl);
    Dom.append(detailEl, buildClientDetailContent(ref, record, loading));
  }

  function openClientDetailModal(clientId) {
    if (!clientId || !global.bootstrap || !global.bootstrap.Modal) {
      if (global.Alerts && global.Alerts.showAlert) {
        global.Alerts.showAlert("No se pudo abrir el detalle del cliente.", "warning");
      }
      return;
    }
    if (!global.ModalHelpers) return;

    const ref = state.getClientById(clientId) || {};
    const name = state.getClientDisplayName(ref) || "Cliente";
    const modalId = "map-client-detail-modal";

    const cached = state.clientDetailCache.get(clientId);
    const title = [
      Dom.el("i", { className: "bi bi-building me-2" }),
      Dom.el("span", { text: name })
    ];
    const body = Dom.el("div", {}, [
      Dom.el("div", { dataset: { mapClientDetail: "1" } })
    ]);

    const footer = [];
    if (ref && ref.direccion) {
      footer.push(
        Dom.el("a", {
          className: "btn btn-outline-primary",
          target: "_blank",
          rel: "noopener",
          href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ref.direccion)
        }, [
          Dom.el("i", { className: "bi bi-geo-alt me-1" }),
          Dom.text("Ver en mapa")
        ])
      );
    }
    footer.push(
      Dom.el("button", {
        type: "button",
        className: "btn btn-outline-secondary",
        "data-bs-dismiss": "modal",
        text: "Cerrar"
      })
    );

    const modalEl = global.ModalHelpers.create(
      modalId,
      title,
      body,
      footer,
      {
        size: "lg",
        centered: true,
        scrollable: true,
        headerClass: "bg-primary text-white",
        closeClass: "btn-close-white"
      }
    );
    if (!modalEl) return;

    const detailEl = modalEl.querySelector("[data-map-client-detail]");
    renderClientDetail(detailEl, ref, cached, !cached);
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    if (cached) return;

    if (!global.MapsService) return;

    global.MapsService.getClientById(clientId)
      .then((result) => {
        if (result && result.ignored) return;
        if (!result || !result.record) return;
        state.clientDetailCache.set(clientId, result);
        const detail = modalEl.querySelector("[data-map-client-detail]");
        renderClientDetail(detail, ref, result, false);
      })
      .catch(() => {
        const detail = modalEl.querySelector("[data-map-client-detail]");
        renderClientDetail(detail, ref, null, false);
      });
  }

  function openPlanModal(clientId) {
    if (!clientId || !global.WeeklyPlanPanel || !global.bootstrap || !global.bootstrap.Modal) {
      if (global.Alerts && global.Alerts.showAlert) {
        global.Alerts.showAlert("No se pudo abrir el plan semanal.", "warning");
      }
      return;
    }
    if (!global.ModalHelpers) return;

    const modalId = "map-plan-modal";
    const existingPanel = document.getElementById("plan-semanal-panel");
    if (existingPanel && !existingPanel.closest(`#${modalId}`)) {
      existingPanel.remove();
    }

    const ref = state.getClientById(clientId);
    const name = state.getClientDisplayName(ref) || "Cliente";
    const title = [
      Dom.el("i", { className: "bi bi-calendar-week me-2" }),
      Dom.el("span", { text: `Plan semanal · ${name}` })
    ];
    const body = Dom.el("div", {}, [
      Dom.el("div", { id: "map-plan-panel" })
    ]);

    const modalEl = global.ModalHelpers.create(
      modalId,
      title,
      body,
      null,
      {
        size: "xl",
        centered: true,
        scrollable: true,
        headerClass: "bg-primary text-white",
        closeClass: "btn-close-white"
      }
    );
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const panel = modalEl.querySelector("#map-plan-panel");
    if (!panel) return;

    if (typeof global.WeeklyPlanPanel.init === "function") {
      global.WeeklyPlanPanel.init(state.cachedReference);
    }
    global.WeeklyPlanPanel.render(panel);

    const select = modalEl.querySelector("#field-CLIENTE");
    if (select) {
      select.value = clientId;
      select.dispatchEvent(new Event("change"));
    }
  }

  function buildEmployeeMarker() {
    if (!state.filters.employeeId) return null;
    const emp = state.getEmployeeById(state.filters.employeeId);
    if (!emp) return null;
    const lat = state.toNumber(emp.lat);
    const lng = state.toNumber(emp.lng);
    return {
      type: "empleado",
      id: String(state.filters.employeeId),
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

    const total = filtered.length;
    const employeeSelected = !!state.filters.employeeId;
    const plannedCount = employeeSelected ? 0 : filtered.filter((item) => item.isPlanned).length;
    const unplannedCount = employeeSelected ? 0 : (filtered.length - plannedCount);
    const assignedCount = employeeSelected
      ? filtered.filter((item) => isAssignedToSelectedEmployee(item.id)).length
      : 0;
    const unassignedCount = employeeSelected ? (filtered.length - assignedCount) : 0;

    Dom.clear(summary);

    const header = Dom.el("div", { className: "d-flex align-items-center justify-content-between mb-2" }, [
      Dom.el("div", { className: "small text-muted", text: "Resumen semanal" }),
      state.isPlanLoading
        ? Dom.el("span", { className: "map-loading-inline" }, [
          Dom.el("span", { className: "spinner-border spinner-border-sm" }),
          Dom.text("Actualizando")
        ])
        : null
    ]);

    const chips = Dom.el("div", { className: "map-summary-chips" }, [
      Dom.el("span", { className: "lt-chip lt-chip--primary", text: `Mostrados: ${total}` }),
      employeeSelected
        ? Dom.el("span", { className: "lt-chip lt-chip--success", text: `Asignados: ${assignedCount}` })
        : Dom.el("span", { className: "lt-chip lt-chip--success", text: `Planificados: ${plannedCount}` }),
      employeeSelected
        ? Dom.el("span", { className: "lt-chip lt-chip--muted", text: `Sin asignar: ${unassignedCount}` })
        : Dom.el("span", { className: "lt-chip lt-chip--muted", text: `Sin planificar: ${unplannedCount}` }),
      Dom.el("span", { className: "lt-chip lt-chip--muted", text: `Sin coordenadas: ${missing.length}` })
    ]);

    const legendItems = [
      Dom.el("span", { className: "map-legend__item" }, [
        Dom.el("span", { className: "map-legend__dot map-legend__dot--employee" }),
        Dom.text("Empleados")
      ])
    ];

    if (employeeSelected) {
      legendItems.push(
        Dom.el("span", { className: "map-legend__item" }, [
          Dom.el("span", { className: "map-legend__dot map-legend__dot--assigned" }),
          Dom.text("Asignados")
        ]),
        Dom.el("span", { className: "map-legend__item" }, [
          Dom.el("span", { className: "map-legend__dot map-legend__dot--unassigned" }),
          Dom.text("Sin asignar")
        ])
      );
    } else {
      legendItems.push(
        Dom.el("span", { className: "map-legend__item" }, [
          Dom.el("span", { className: "map-legend__dot map-legend__dot--client" }),
          Dom.text("Clientes")
        ]),
        Dom.el("span", { className: "map-legend__item" }, [
          Dom.el("span", { className: "map-legend__dot map-legend__dot--planned" }),
          Dom.text("Planificados")
        ])
      );
    }

    const legend = Dom.el("div", { className: "map-legend" }, legendItems);

    summary.appendChild(header);
    summary.appendChild(chips);
    summary.appendChild(legend);
  }

  function renderEmployeeCard(container) {
    const card = container.querySelector("[data-map-employee-card]");
    if (!card) return;

    if (!state.filters.employeeId) {
      card.classList.add("d-none");
      Dom.clear(card);
      return;
    }

    const emp = state.getEmployeeById(state.filters.employeeId);
    if (!emp) {
      card.classList.remove("d-none");
      Dom.clear(card);
      card.appendChild(Dom.el("div", { className: "map-employee-card__title", text: "Empleado seleccionado" }));
      card.appendChild(Dom.el("div", { className: "map-employee-card__name", text: "Sin información" }));
      return;
    }

    const entry = state.planIndex.employeeAssignments.get(state.filters.employeeId);
    const assignedCount = entry ? entry.clientes.size : 0;
    const address = emp.direccion || "Sin dirección";

    card.classList.remove("d-none");
    Dom.clear(card);
    card.appendChild(Dom.el("div", { className: "map-employee-card__title", text: "Empleado seleccionado" }));
    card.appendChild(Dom.el("div", { className: "map-employee-card__name", text: emp.nombre || "Empleado" }));
    card.appendChild(Dom.el("div", { className: "map-employee-card__meta", text: `Direccion: ${address}` }));
    card.appendChild(Dom.el("div", { className: "map-employee-card__meta", text: `Clientes esta semana: ${assignedCount}` }));
  }

  function renderList(container, items) {
    const list = container.querySelector("[data-map-items]");
    if (!list) return;

    if (!items.length) {
      if (global.EmptyState) {
        global.EmptyState.render(list, { variant: "empty", title: "Sin clientes", message: "No hay clientes para mostrar." });
      } else {
        Dom.clear(list);
        list.appendChild(Dom.el("div", { className: "text-muted small map-empty", text: "No hay clientes para mostrar." }));
      }
      return;
    }

    Dom.clear(list);
    items.forEach((item) => {
      const isAssigned = isAssignedToSelectedEmployee(item.id);
      const statusLabel = state.filters.employeeId
        ? (isAssigned ? "Asignado" : "Sin asignar")
        : (item.isPlanned ? "Planificado" : "Sin planificar");
      const statusClass = state.filters.employeeId
        ? (isAssigned ? "map-status--assigned" : "map-status--unassigned")
        : (item.isPlanned ? "map-status--planned" : "map-status--unplanned");
      const activeClass = item.id === state.selectedClientId ? " map-item--active" : "";

      const card = Dom.el("div", { className: `map-item${activeClass}`, dataset: { mapId: item.id } });

      const title = Dom.el("div", { className: "map-item__title" });
      const focusBtn = Dom.el("button", {
        type: "button",
        className: "map-item__focus",
        dataset: { mapAction: "focus", mapId: item.id }
      }, item.name || "Cliente");
      const status = Dom.el("span", { className: `map-status ${statusClass}`.trim(), text: statusLabel });
      title.appendChild(focusBtn);
      title.appendChild(status);
      card.appendChild(title);

      card.appendChild(Dom.el("div", { className: "map-item__meta", text: item.direccion || "Sin dirección" }));

      const actions = Dom.el("div", { className: "map-item__actions" });
      const detailBtn = Dom.el("button", {
        type: "button",
        className: "btn btn-light btn-sm",
        dataset: { mapAction: "detail", mapId: item.id }
      }, [
        Dom.el("i", { className: "bi bi-info-circle me-1" }),
        Dom.text("Datos")
      ]);
      const planBtn = Dom.el("button", {
        type: "button",
        className: "btn btn-outline-primary btn-sm",
        dataset: { mapAction: "plan", mapId: item.id }
      }, [
        Dom.el("i", { className: "bi bi-calendar-week me-1" }),
        Dom.text("Plan")
      ]);
      actions.appendChild(detailBtn);
      actions.appendChild(planBtn);
      card.appendChild(actions);

      list.appendChild(card);
    });

    if (global.MapsPanelHandlers) {
      global.MapsPanelHandlers.bindListClick(list);
    }
  }

  function renderMissing(container, missing) {
    const section = container.querySelector("[data-map-missing]");
    if (!section) return;

    if (!missing.length) {
      Dom.clear(section);
      return;
    }

    Dom.clear(section);
    section.appendChild(Dom.el("div", { className: "small text-muted mb-2", text: "Sin coordenadas" }));
    const list = Dom.el("div", { className: "map-missing-list" });
    missing.forEach((item) => {
      const isAssigned = isAssignedToSelectedEmployee(item.id);
      const status = state.filters.employeeId
        ? (isAssigned ? "Asignado" : "Sin asignar")
        : (item.isPlanned ? "Planificado" : "Sin planificar");
      list.appendChild(
        Dom.el("div", { className: "map-missing-item" }, [
          Dom.text(item.name || "Cliente"),
          Dom.el("span", { text: status })
        ])
      );
    });
    section.appendChild(list);
  }

  function ensureMap(container, items) {
    const overlay = container.querySelector("[data-map-overlay]");
    const mapEl = container.querySelector("#map-canvas");
    if (!mapEl) return;

    if (!global.MapsLoader || !global.MapsLoader.hasKey()) {
      if (overlay) {
        overlay.classList.remove("d-none");
        Dom.clear(overlay);
        overlay.appendChild(
          Dom.el("div", { className: "text-center" }, [
            Dom.el("i", { className: "bi bi-exclamation-circle" }),
            Dom.el("div", { className: "mt-2", text: "Configura MAPS_API_KEY para usar el mapa." })
          ])
        );
      }
      return;
    }

    if (!global.MapsLoader.isAvailable()) {
      if (overlay) {
        overlay.classList.remove("d-none");
        Dom.clear(overlay);
        overlay.appendChild(
          Dom.el("div", { className: "text-center" }, [
            Dom.el("div", { className: "spinner-border text-primary" }),
            Dom.el("div", { className: "mt-2", text: "Cargando mapa..." })
          ])
        );
      }
      global.MapsLoader.onReady(function () {
        ensureMap(container, items);
      });
      return;
    }

    if (overlay) overlay.classList.add("d-none");

    if (!state.map) {
      state.map = new google.maps.Map(mapEl, {
        center: { lat: -34.6037, lng: -58.3816 },
        zoom: 11,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false
      });
      state.infoWindow = new google.maps.InfoWindow();
    }

    updateMarkers(items);
  }

  function getMarkerKey(item) {
    return `${item.type}-${item.id}`;
  }

  function getMarkerIcon(item) {
    if (item.type === "empleado") return `${state.MAP_ICON_BASE}green-dot.png`;
    if (state.filters.employeeId) {
      return isAssignedToSelectedEmployee(item.id)
        ? `${state.MAP_ICON_BASE}blue-dot.png`
        : `${state.MAP_ICON_BASE}yellow-dot.png`;
    }
    if (item.isPlanned) return `${state.MAP_ICON_BASE}purple-dot.png`;
    return `${state.MAP_ICON_BASE}red-dot.png`;
  }

  function updateMarkers(items) {
    state.markers.forEach((marker) => marker.setMap(null));
    state.markers = [];
    state.markersByKey.clear();

    if (!state.map) return;

    const bounds = new google.maps.LatLngBounds();
    const hasItems = items.length > 0;

    items.forEach((item) => {
      if (!state.hasCoords(item)) return;
      const position = { lat: item.lat, lng: item.lng };
      const marker = new google.maps.Marker({
        position: position,
        map: state.map,
        title: item.name || "",
        icon: getMarkerIcon(item)
      });
      marker.addListener("click", function () {
        openInfo(marker, item);
      });
      state.markers.push(marker);
      state.markersByKey.set(getMarkerKey(item), marker);
      bounds.extend(position);
    });

    if (hasItems) {
      if (items.length === 1) {
        state.map.setCenter(bounds.getCenter());
        state.map.setZoom(15);
      } else {
        state.map.fitBounds(bounds);
      }
    }
  }

  function openInfo(marker, item) {
    if (!state.infoWindow || !marker) return;
    const name = state.escapeHtml(item.name);
    const direccion = state.escapeHtml(item.direccion || "Sin dirección");

    if (item.type === "empleado") {
      const content = `
        <div class="map-info">
          <div class="map-info__title">${name}</div>
          <div class="map-info__meta">Empleado</div>
          <div class="map-info__address">${direccion}</div>
        </div>
      `;
      state.infoWindow.setContent(content);
      state.infoWindow.open({ anchor: marker, map: state.map });
      return;
    }

    const isAssigned = isAssignedToSelectedEmployee(item.id);
    const statusText = state.filters.employeeId
      ? (isAssigned ? "Asignado" : "Sin asignar")
      : (item.isPlanned ? "Planificado" : "Sin planificar");
    const employeeLabel = item.assignedEmployees && item.assignedEmployees.length
      ? item.assignedEmployees.join(", ")
      : "Sin asignaciones";

    if (!Dom) {
      const employees = state.escapeHtml(employeeLabel);
      const content = `
        <div class="map-info">
          <div class="map-info__title">${name}</div>
          <div class="map-info__meta">${statusText}</div>
          <div class="map-info__address">${direccion}</div>
          <div class="map-info__employees">Empleados: ${employees}</div>
        </div>
      `;
      state.infoWindow.setContent(content);
    } else {
      const content = Dom.el("div", { className: "map-info" }, [
        Dom.el("div", { className: "map-info__title", text: item.name || "Cliente" }),
        Dom.el("div", { className: "map-info__meta", text: statusText }),
        Dom.el("div", { className: "map-info__address", text: item.direccion || "Sin dirección" }),
        Dom.el("div", { className: "map-info__employees", text: `Empleados: ${employeeLabel}` })
      ]);
      state.infoWindow.setContent(content);
    }
    state.infoWindow.open({ anchor: marker, map: state.map });
    setActiveClient(state.rootContainer, item.id);
  }

  function focusItem(item) {
    if (!state.map || !item) return;
    const key = getMarkerKey(item);
    const marker = state.markersByKey.get(key);
    if (!marker) return;
    const position = marker.getPosition();
    if (position) {
      state.map.panTo(position);
      state.map.setZoom(15);
    }
    openInfo(marker, item);
  }

  function updateWeekLabel(container) {
    const label = container.querySelector("[data-map-week-label]");
    if (!label) return;
    if (state.planData && state.planData.semana && state.planData.semana.label) {
      label.textContent = `Semana ${state.planData.semana.label}`;
    } else {
      label.textContent = state.formatWeekLabel(state.filters.weekStart);
    }
  }

  function populateSelects(container) {
    const employeeSelect = container.querySelector("[data-map-employee]");
    if (employeeSelect) {
      const current = state.filters.employeeId;
      const empleados = state.referenceIndex.sortedEmployees.length
        ? state.referenceIndex.sortedEmployees
        : (state.cachedReference.empleados || []);
      const options = empleados
        .map((emp) => {
          const id = emp && emp.id != null ? String(emp.id).trim() : "";
          const nombre = emp && emp.nombre ? String(emp.nombre).trim() : "";
          if (!id || !nombre) return null;
          return { value: id, label: nombre };
        })
        .filter(Boolean);
      const ui = global.UIHelpers;
      if (ui && typeof ui.renderSelect === "function") {
        ui.renderSelect(employeeSelect, options, current || "", { includeEmpty: true, emptyLabel: "Todos los empleados" });
      } else {
        Dom.clear(employeeSelect);
        employeeSelect.appendChild(Dom.el("option", { value: "", text: "Todos los empleados" }));
        options.forEach((opt) => {
          const node = Dom.el("option", { value: opt.value, text: opt.label });
          if (opt.value === current) node.selected = true;
          employeeSelect.appendChild(node);
        });
      }
      employeeSelect.value = current || "";
    }

    const clientSelect = container.querySelector("[data-map-client]");
    if (clientSelect) {
      const current = state.filters.clientId;
      const clientes = state.referenceIndex.sortedClients.length
        ? state.referenceIndex.sortedClients
        : (state.cachedReference.clientes || []);
      const options = clientes
        .map((cli) => {
          const id = cli && cli.id != null ? String(cli.id).trim() : "";
          const nombre = state.getClientDisplayName(cli);
          if (!id || !nombre) return null;
          return { value: id, label: nombre };
        })
        .filter(Boolean);
      const ui = global.UIHelpers;
      if (ui && typeof ui.renderSelect === "function") {
        ui.renderSelect(clientSelect, options, current || "", { includeEmpty: true, emptyLabel: "Todos los clientes" });
      } else {
        Dom.clear(clientSelect);
        clientSelect.appendChild(Dom.el("option", { value: "", text: "Todos los clientes" }));
        options.forEach((opt) => {
          const node = Dom.el("option", { value: opt.value, text: opt.label });
          if (opt.value === current) node.selected = true;
          clientSelect.appendChild(node);
        });
      }
      clientSelect.value = current || "";
    }
  }

  function updatePlanToggleState(container) {
    const buttons = container.querySelectorAll("[data-map-plan]");
    const disabled = !!(state.filters.employeeId || state.filters.clientId);
    buttons.forEach((btn) => {
      const value = btn.getAttribute("data-map-plan");
      btn.classList.toggle("active", value === state.filters.planFilter);
      btn.disabled = disabled;
    });
  }

  function updateEmployeeScopeState(container) {
    const buttons = container.querySelectorAll("[data-map-employee-scope]");
    const disabled = !state.filters.employeeId;
    buttons.forEach((btn) => {
      const value = btn.getAttribute("data-map-employee-scope") || "all";
      btn.classList.toggle("active", value === state.filters.employeeScope);
      btn.disabled = disabled;
    });
  }

  function renderView(container) {
    if (!container) return;

    updateWeekLabel(container);
    if (state.selectsDirty) {
      populateSelects(container);
      state.selectsDirty = false;
    }
    updatePlanToggleState(container);
    updateEmployeeScopeState(container);

    if (state.isRefLoading && (!state.cachedReference.clientes || !state.cachedReference.clientes.length)) {
      const list = container.querySelector("[data-map-items]");
      if (list && global.EmptyState) {
        global.EmptyState.render(list, { variant: "loading", message: "Cargando datos..." });
      } else if (list) {
        Dom.clear(list);
        list.appendChild(Dom.el("div", { className: "text-muted small map-empty", text: "Cargando datos..." }));
      }
      return;
    }

    if (state.clientItemsDirty && global.MapsPanelData) {
      global.MapsPanelData.rebuildClientItems();
    }
    const clients = state.cachedClientItems;
    const filtered = global.MapsPanelData ? global.MapsPanelData.applyFilters(clients) : clients;
    const split = global.MapsPanelData ? global.MapsPanelData.splitByCoords(filtered) : { withCoords: filtered, missing: [] };

    renderSummary(container, filtered, split.missing);
    renderEmployeeCard(container);
    renderList(container, split.withCoords);
    renderMissing(container, split.missing);

    state.currentListItems = split.withCoords;

    const mapItems = split.withCoords.slice();
    const employeeMarker = buildEmployeeMarker();
    if (employeeMarker && state.hasCoords(employeeMarker)) {
      mapItems.push(employeeMarker);
    }
    ensureMap(container, mapItems);
  }

  global.MapsPanelRender = {
    buildPanelHtml: buildPanelHtml,
    renderView: renderView,
    renderSummary: renderSummary,
    renderEmployeeCard: renderEmployeeCard,
    renderList: renderList,
    renderMissing: renderMissing,
    ensureMap: ensureMap,
    updateMarkers: updateMarkers,
    openInfo: openInfo,
    focusItem: focusItem,
    setActiveClient: setActiveClient,
    updateWeekLabel: updateWeekLabel,
    populateSelects: populateSelects,
    updatePlanToggleState: updatePlanToggleState,
    openClientDetailModal: openClientDetailModal,
    openPlanModal: openPlanModal
  };
})(typeof window !== "undefined" ? window : this);
