/**
 * MapPanel
 * Orquestador del modulo de mapa.
 */
(function (global) {
  const MapPanel = (() => {
    function ensureDeps() {
      if (!global.MapsPanelState || !global.MapsPanelRender || !global.MapsPanelData || !global.MapsPanelHandlers) {
        console.error("MapsPanel dependencies no disponibles");
        return false;
      }
      return true;
    }

    function resetState() {
      const state = global.MapsPanelState;
      state.map = null;
      state.markers = [];
      state.markersByKey = new Map();
      state.infoWindow = null;
      state.currentListItems = [];
      state.cachedClientItems = [];
      state.clientItemsDirty = true;
      state.selectsDirty = true;
      state.listClickBound = false;
      state.planData = null;
      state.planIndex = state.createPlanIndex();
      state.planRequestId = 0;
      state.isPlanLoading = false;
      state.isRefLoading = false;
      state.filters.employeeId = "";
      state.filters.clientId = "";
      state.filters.query = "";
      state.filters.employeeScope = "all";
      state.filters.planFilter = "all";
      state.filters.weekStart = state.getMondayOfWeek(new Date());
      state.selectedClientId = "";
    }

    function render(containerId) {
      if (!ensureDeps()) return;
      const state = global.MapsPanelState;
      const container = typeof containerId === "string"
        ? document.getElementById(containerId)
        : containerId;
      if (!container) return;

      // safe static: layout fijo sin datos externos.
      container.innerHTML = global.MapsPanelRender.buildPanelHtml();
      state.rootContainer = container;
      resetState();

      global.MapsPanelHandlers.attachEvents(container);

      const usedPrefetch = global.MapsPanelData && typeof global.MapsPanelData.applyPrefetch === "function"
        ? global.MapsPanelData.applyPrefetch()
        : false;

      if (usedPrefetch && global.MapsPanelRender) {
        global.MapsPanelRender.renderView(container);
      } else {
        global.MapsPanelData.refreshReferenceData(container);
        global.MapsPanelData.refreshPlanData(container);
      }

      if (state.unsubscribeRef) state.unsubscribeRef();
      if (global.MapsPanelData && typeof global.MapsPanelData.subscribeReferenceUpdates === "function") {
        state.unsubscribeRef = global.MapsPanelData.subscribeReferenceUpdates(function () {
          if (global.MapsPanelHandlers.isActiveView()) {
            global.MapsPanelData.refreshReferenceData(container);
          }
        });
      }
    }

    return { render: render };
  })();

  global.MapPanel = MapPanel;
})(typeof window !== "undefined" ? window : this);
