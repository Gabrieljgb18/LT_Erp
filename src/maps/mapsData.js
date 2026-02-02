/**
 * MapsPanelData
 * Capa de datos del mapa.
 */
(function (global) {
  const state = global.MapsPanelState;
  if (!state) {
    console.error("MapsPanelState no disponible");
    return;
  }
  const PREFETCH_TTL_MS = 5 * 60 * 1000;

  function buildPlanIndex(data) {
    const index = state.createPlanIndex();
    if (!data || !Array.isArray(data.dias)) return index;

    data.dias.forEach((dia) => {
      const dayLabel = dia.diaDisplay || dia.dia || dia.fechaDisplay || "";
      (dia.clientes || []).forEach((cliente) => {
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

        (cliente.asignaciones || []).forEach((asg) => {
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

  function buildReferenceIndex() {
    const clients = state.cachedReference.clientes || [];
    const employees = state.cachedReference.empleados || [];
    const clientsById = new Map();
    const employeesById = new Map();

    clients.forEach((cli) => {
      const id = cli && cli.id != null ? String(cli.id).trim() : "";
      if (id) clientsById.set(id, cli);
    });

    employees.forEach((emp) => {
      const id = emp && emp.id != null ? String(emp.id).trim() : "";
      if (id) employeesById.set(id, emp);
    });

    state.referenceIndex = {
      clientsById: clientsById,
      employeesById: employeesById,
      sortedClients: clients.slice().sort((a, b) =>
        state.getClientDisplayName(a).localeCompare(state.getClientDisplayName(b))
      ),
      sortedEmployees: employees.slice().sort((a, b) =>
        String(a.nombre || "").localeCompare(String(b.nombre || ""))
      )
    };
  }

  function rebuildClientItems() {
    const clients = state.referenceIndex.sortedClients.length
      ? state.referenceIndex.sortedClients
      : (state.cachedReference.clientes || []);

    state.cachedClientItems = clients
      .map((cli) => {
        const id = cli && cli.id != null ? String(cli.id).trim() : "";
        if (!id) return null;
        const name = state.getClientDisplayName(cli);
        if (!name) return null;
        const assignment = state.planIndex.clientAssignments.get(id);
        const assignedEmployees = assignment ? Array.from(assignment.empleados).filter(Boolean) : [];
        return {
          type: "cliente",
          id: id,
          name: name,
          direccion: cli.direccion || "",
          lat: state.toNumber(cli.lat),
          lng: state.toNumber(cli.lng),
          isPlanned: state.planIndex.plannedClientIds.has(id),
          assignedEmployees: assignedEmployees
        };
      })
      .filter(Boolean);

    state.clientItemsDirty = false;
  }

  function applyFilters(items) {
    const filters = state.filters;
    const query = state.normalizeText(filters.query);
    let filtered = items.slice();

    if (filters.clientId) {
      filtered = filtered.filter((item) => item.id === filters.clientId);
    }

    if (filters.employeeId && filters.employeeScope === "assigned") {
      const entry = state.planIndex.employeeAssignments.get(filters.employeeId);
      const allowed = entry ? entry.clientes : null;
      filtered = allowed ? filtered.filter((item) => allowed.has(item.id)) : [];
    }

    const applyPlanFilter = !(filters.employeeId || filters.clientId);
    if (applyPlanFilter) {
      if (filters.planFilter === "planned") {
        filtered = filtered.filter((item) => item.isPlanned);
      } else if (filters.planFilter === "unplanned") {
        filtered = filtered.filter((item) => !item.isPlanned);
      }
    }

    if (query) {
      filtered = filtered.filter((item) => {
        const haystack = state.normalizeText(`${item.name} ${item.direccion}`);
        return haystack.includes(query);
      });
    }

    return filtered;
  }

  function splitByCoords(items) {
    const withCoords = [];
    const missing = [];
    items.forEach((item) => {
      if (state.hasCoords(item)) {
        withCoords.push(item);
      } else {
        missing.push(item);
      }
    });
    return { withCoords: withCoords, missing: missing };
  }

  function refreshReferenceData(container) {
    if (!global.ReferenceService) return;
    state.isRefLoading = true;
    if (global.MapsPanelRender) {
      global.MapsPanelRender.renderView(container);
    }

    if (!global.ReferenceService || typeof global.ReferenceService.ensureLoaded !== "function") {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return;
    }
    const loadPromise = global.ReferenceService.ensureLoaded();

    loadPromise
      .then((data) => {
        state.cachedReference = data || { clientes: [], empleados: [] };
        buildReferenceIndex();
        state.clientItemsDirty = true;
        state.selectsDirty = true;
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando referencias", err, { silent: true });
        }
        state.cachedReference = { clientes: [], empleados: [] };
        buildReferenceIndex();
        state.clientItemsDirty = true;
        state.selectsDirty = true;
      })
      .finally(() => {
        state.isRefLoading = false;
        if (global.MapsPanelRender) {
          global.MapsPanelRender.renderView(container);
        }
      });
  }

  function subscribeReferenceUpdates(callback) {
    if (!global.ReferenceService || typeof global.ReferenceService.subscribe !== "function") {
      return null;
    }
    return global.ReferenceService.subscribe(callback);
  }

  function refreshPlanData(container) {
    if (!global.MapsService) return;
    const requestId = ++state.planRequestId;
    state.isPlanLoading = true;
    if (global.MapsPanelRender) {
      global.MapsPanelRender.renderView(container);
    }

    const weekStartStr = state.formatDateISO(state.filters.weekStart);
    global.MapsService.getWeeklyClientOverview(weekStartStr)
      .then((data) => {
        if (requestId !== state.planRequestId) return;
        if (data && data.error) throw new Error(data.error);
        state.planData = data || null;
        state.planIndex = buildPlanIndex(state.planData);
        state.clientItemsDirty = true;
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando plan semanal", err, { silent: true });
        }
        if (requestId !== state.planRequestId) return;
        state.planData = null;
        state.planIndex = state.createPlanIndex();
        state.clientItemsDirty = true;
      })
      .finally(() => {
        if (requestId !== state.planRequestId) return;
        state.isPlanLoading = false;
        if (global.MapsPanelRender) {
          global.MapsPanelRender.renderView(container);
        }
      });
  }

  function applyPrefetch() {
    if (!state.prefetchAt || (Date.now() - state.prefetchAt) > PREFETCH_TTL_MS) {
      return false;
    }
    let used = false;
    if (state.prefetchReference) {
      state.cachedReference = state.prefetchReference;
      buildReferenceIndex();
      state.clientItemsDirty = true;
      state.selectsDirty = true;
      used = true;
    }
    const currentWeek = state.formatDateISO(state.filters.weekStart);
    const weekMatches = !state.prefetchWeekStart || state.prefetchWeekStart === currentWeek;
    if (state.prefetchPlanData && weekMatches) {
      state.planData = state.prefetchPlanData;
      state.planIndex = state.prefetchPlanIndex || buildPlanIndex(state.prefetchPlanData);
      state.clientItemsDirty = true;
      used = true;
    }
    return used;
  }

  function prefetch() {
    const tasks = [];
    if (global.ReferenceService && typeof global.ReferenceService.ensureLoaded === "function") {
      tasks.push(
        global.ReferenceService.ensureLoaded()
          .then(() => {
            const data = global.ReferenceService.get();
            state.prefetchReference = data || { clientes: [], empleados: [] };
            state.prefetchAt = Date.now();
          })
          .catch(() => {
            state.prefetchReference = { clientes: [], empleados: [] };
            state.prefetchAt = Date.now();
          })
      );
    }

    if (global.MapsService && typeof global.MapsService.getWeeklyClientOverview === "function") {
      const weekStart = state.filters && state.filters.weekStart
        ? state.filters.weekStart
        : state.getMondayOfWeek(new Date());
      const weekStartStr = state.formatDateISO(weekStart);
      tasks.push(
        global.MapsService.getWeeklyClientOverview(weekStartStr)
          .then((data) => {
            if (data && data.error) throw new Error(data.error);
            state.prefetchPlanData = data || null;
            state.prefetchPlanIndex = buildPlanIndex(state.prefetchPlanData);
            state.prefetchWeekStart = weekStartStr;
            state.prefetchAt = Date.now();
          })
          .catch(() => {
            state.prefetchPlanData = null;
            state.prefetchPlanIndex = buildPlanIndex(null);
            state.prefetchWeekStart = weekStartStr;
            state.prefetchAt = Date.now();
          })
      );
    }

    if (!tasks.length) return Promise.resolve(null);
    return Promise.allSettled(tasks);
  }

  global.MapsPanelData = {
    buildPlanIndex: buildPlanIndex,
    buildReferenceIndex: buildReferenceIndex,
    rebuildClientItems: rebuildClientItems,
    applyFilters: applyFilters,
    splitByCoords: splitByCoords,
    refreshReferenceData: refreshReferenceData,
    refreshPlanData: refreshPlanData,
    subscribeReferenceUpdates: subscribeReferenceUpdates,
    applyPrefetch: applyPrefetch,
    prefetch: prefetch
  };
})(typeof window !== "undefined" ? window : this);
