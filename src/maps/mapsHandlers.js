/**
 * MapsPanelHandlers
 * Eventos y acciones del mapa.
 */
(function (global) {
  const state = global.MapsPanelState;
  if (!state) {
    console.error("MapsPanelState no disponible");
    return;
  }

  function bindListClick(list) {
    if (state.listClickBound || !list) return;
    state.listClickBound = true;
    list.addEventListener("click", function (e) {
      const actionBtn = e.target.closest("[data-map-action]");
      const card = e.target.closest(".map-item");
      if (!card) return;
      const id = (actionBtn && actionBtn.getAttribute("data-map-id")) || card.getAttribute("data-map-id");
      const item = state.currentListItems.find((entry) => entry.id === id);
      if (!item) return;
      if (global.MapsPanelRender && typeof global.MapsPanelRender.setActiveClient === "function") {
        global.MapsPanelRender.setActiveClient(state.rootContainer, item.id);
      }

      if (!actionBtn) {
        if (global.MapsPanelRender) {
          global.MapsPanelRender.focusItem(item);
        }
        return;
      }

      const action = actionBtn.getAttribute("data-map-action");
      if (action === "detail") {
        if (global.MapsPanelRender) {
          global.MapsPanelRender.openClientDetailModal(item.id);
        }
        return;
      }
      if (action === "plan") {
        if (global.MapsPanelRender) {
          global.MapsPanelRender.openPlanModal(item.id);
        }
        return;
      }
      if (global.MapsPanelRender) {
        global.MapsPanelRender.focusItem(item);
      }
    });
  }

  function attachEvents(container) {
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler) => {
      if (!el) return;
      el.addEventListener(evt, handler, { signal: signal });
    };

    const employeeSelect = container.querySelector("[data-map-employee]");
    if (employeeSelect) {
      on(employeeSelect, "change", function () {
        state.filters.employeeId = employeeSelect.value || "";
        state.filters.employeeScope = "all";
        state.selectedClientId = "";
        if (global.MapsPanelRender) {
          global.MapsPanelRender.renderView(container);
        }
      });
    }

    const clientSelect = container.querySelector("[data-map-client]");
    if (clientSelect) {
      on(clientSelect, "change", function () {
        state.filters.clientId = clientSelect.value || "";
        state.selectedClientId = "";
        if (global.MapsPanelRender) {
          global.MapsPanelRender.renderView(container);
        }
      });
    }

    const planButtons = container.querySelectorAll("[data-map-plan]");
    planButtons.forEach((btn) => {
      on(btn, "click", function () {
        if (btn.disabled) return;
        const value = btn.getAttribute("data-map-plan") || "all";
        state.filters.planFilter = value;
        if (global.MapsPanelRender) {
          global.MapsPanelRender.renderView(container);
        }
      });
    });

    const scopeButtons = container.querySelectorAll("[data-map-employee-scope]");
    scopeButtons.forEach((btn) => {
      on(btn, "click", function () {
        if (btn.disabled) return;
        const value = btn.getAttribute("data-map-employee-scope") || "all";
        state.filters.employeeScope = value;
        if (global.MapsPanelRender) {
          global.MapsPanelRender.renderView(container);
        }
      });
    });

    const searchInput = container.querySelector("[data-map-search]");
    if (searchInput) {
      let searchTimer = null;
      on(searchInput, "input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          state.filters.query = searchInput.value || "";
          if (global.MapsPanelRender) {
            global.MapsPanelRender.renderView(container);
          }
        }, 200);
      });
    }

    const prevBtn = container.querySelector("[data-map-week-prev]");
    if (prevBtn) {
      on(prevBtn, "click", function () {
        state.filters.weekStart = state.addDays(state.filters.weekStart, -7);
        if (global.MapsPanelData) {
          global.MapsPanelData.refreshPlanData(container);
        }
      });
    }

    const nextBtn = container.querySelector("[data-map-week-next]");
    if (nextBtn) {
      on(nextBtn, "click", function () {
        state.filters.weekStart = state.addDays(state.filters.weekStart, 7);
        if (global.MapsPanelData) {
          global.MapsPanelData.refreshPlanData(container);
        }
      });
    }

    const todayBtn = container.querySelector("[data-map-week-today]");
    if (todayBtn) {
      on(todayBtn, "click", function () {
        state.filters.weekStart = state.getMondayOfWeek(new Date());
        if (global.MapsPanelData) {
          global.MapsPanelData.refreshPlanData(container);
        }
      });
    }

    const refreshBtn = container.querySelector("[data-map-week-refresh]");
    if (refreshBtn) {
      on(refreshBtn, "click", function () {
        if (global.MapsPanelData) {
          global.MapsPanelData.refreshPlanData(container);
        }
      });
    }
  }

  function isActiveView() {
    const view = document.getElementById("view-mapa");
    return !!(view && !view.classList.contains("d-none"));
  }

  global.MapsPanelHandlers = {
    attachEvents: attachEvents,
    bindListClick: bindListClick,
    isActiveView: isActiveView
  };
})(typeof window !== "undefined" ? window : this);
