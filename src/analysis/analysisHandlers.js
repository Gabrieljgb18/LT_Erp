/**
 * AnalysisPanelHandlers
 * Eventos del panel de analisis.
 */
(function (global) {
  const state = global.AnalysisPanelState;

  function attach() {
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    var signal = state.eventsController.signal;
    var on = function (el, evt, handler) {
      if (!el) return;
      el.addEventListener(evt, handler, { signal: signal });
    };

    var periodInput = document.getElementById('analysis-period');
    if (periodInput) {
      var now = new Date();
      var y = now.getFullYear();
      var m = String(now.getMonth() + 1).padStart(2, '0');
      periodInput.value = y + '-' + m;
      state.currentPeriod = periodInput.value;
      on(periodInput, 'change', function () {
        state.currentPeriod = periodInput.value;
        global.AnalysisPanelData.load();
      });
    }

    var rangeSelect = document.getElementById('analysis-range');
    if (rangeSelect) {
      rangeSelect.value = String(state.currentRange);
      on(rangeSelect, 'change', function () {
        state.currentRange = Number(rangeSelect.value) || 6;
        global.AnalysisPanelData.load();
      });
    }

    var compareToggle = document.getElementById('analysis-compare-toggle');
    if (compareToggle) {
      on(compareToggle, 'click', function () {
        state.comparisonVisible = !state.comparisonVisible;
        if (global.AnalysisPanelRender && typeof global.AnalysisPanelRender.updateComparisonUI === 'function') {
          global.AnalysisPanelRender.updateComparisonUI();
        }
        if (state.comparisonVisible && state.lastData && global.AnalysisPanelRender && typeof global.AnalysisPanelRender.renderTrend === 'function') {
          global.AnalysisPanelRender.renderTrend(state.lastData.trend || []);
        }
      });
    }

    var refreshBtn = document.getElementById('analysis-refresh');
    if (refreshBtn) {
      on(refreshBtn, 'click', function () {
        global.AnalysisPanelData.load();
      });
    }
  }

  global.AnalysisPanelHandlers = { attach: attach };
})(typeof window !== 'undefined' ? window : this);
