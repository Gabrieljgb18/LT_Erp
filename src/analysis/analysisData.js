/**
 * AnalysisPanelData
 * Carga de datos para el panel de analisis.
 */
(function (global) {
  const state = global.AnalysisPanelState;
  const PREFETCH_TTL_MS = 5 * 60 * 1000;

  function buildPayload() {
    var payload = state.currentPeriod
      ? { period: state.currentPeriod, monthsBack: state.currentRange }
      : { monthsBack: state.currentRange };
    payload.includeTrend = !!state.comparisonVisible;
    return payload;
  }

  function buildKey(payload) {
    if (!payload) return "";
    var period = payload.period || "";
    var monthsBack = payload.monthsBack || "";
    var trend = payload.includeTrend ? "1" : "0";
    return [period, monthsBack, trend].join("|");
  }

  function isPrefetchFresh(key) {
    if (!state.prefetchData || !state.prefetchKey) return false;
    if (key !== state.prefetchKey) return false;
    return (Date.now() - (state.prefetchAt || 0)) < PREFETCH_TTL_MS;
  }

  function prefetch() {
    if (!global.ApiService || typeof global.ApiService.call !== "function") {
      return Promise.resolve(null);
    }
    var payload = buildPayload();
    var key = buildKey(payload);
    return global.ApiService.call('getAnalyticsSummary', payload)
      .then(function (data) {
        state.prefetchData = data || {};
        state.prefetchKey = key;
        state.prefetchAt = Date.now();
        return state.prefetchData;
      })
      .catch(function () {
        return null;
      });
  }

  function load() {
    var loading = document.getElementById('analysis-loading');
    var dash = document.getElementById('analysis-dashboard');
    if (loading) loading.classList.remove('d-none');
    if (dash) dash.classList.add('d-none');

    if (!global.ApiService || typeof global.ApiService.call !== 'function') {
      if (loading) loading.classList.add('d-none');
      if (dash) dash.classList.add('d-none');
      var missingContainer = document.getElementById('analysis-content');
      if (missingContainer) {
        if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.render === 'function') {
          EmptyState.render(missingContainer, {
            variant: 'error',
            title: 'Análisis no disponible',
            message: 'No se pudo iniciar la conexión con el servidor.'
          });
        } else if (state.Dom) {
          state.Dom.clear(missingContainer);
          missingContainer.appendChild(
            state.Dom.el('div', {
              className: 'alert alert-danger',
              text: 'Análisis no disponible: no se pudo iniciar la conexión con el servidor.'
            })
          );
        } else {
          missingContainer.textContent = 'Análisis no disponible: no se pudo iniciar la conexión con el servidor.';
        }
      }
      return;
    }

    var payload = buildPayload();
    var key = buildKey(payload);

    if (isPrefetchFresh(key)) {
      state.lastData = state.prefetchData || {};
      if (global.AnalysisPanelRender && typeof global.AnalysisPanelRender.renderDashboard === 'function') {
        global.AnalysisPanelRender.renderDashboard(state.lastData);
      }
      if (loading) loading.classList.add('d-none');
      if (dash) dash.classList.remove('d-none');
      return;
    }

    global.ApiService.call('getAnalyticsSummary', payload)
      .then(function (data) {
        state.lastData = data || {};
        if (global.AnalysisPanelRender && typeof global.AnalysisPanelRender.renderDashboard === 'function') {
          global.AnalysisPanelRender.renderDashboard(state.lastData);
        }
      })
      .catch(function (err) {
        var container = document.getElementById('analysis-content');
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError('Error cargando análisis', err, { container: container });
        } else if (Alerts && Alerts.showError) {
          Alerts.showError('Error cargando análisis', err);
          if (container && typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.render === 'function') {
            EmptyState.render(container, {
              variant: 'error',
              title: 'Error cargando análisis',
              message: err && err.message ? err.message : err
            });
          }
        } else if (container) {
          if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.render === 'function') {
            EmptyState.render(container, {
              variant: 'error',
              title: 'Error cargando análisis',
              message: err && err.message ? err.message : err
            });
          } else if (state.Dom) {
            state.Dom.clear(container);
            container.appendChild(
              state.Dom.el('div', {
                className: 'alert alert-danger',
                text: 'Error cargando análisis: ' + (err && err.message ? err.message : err)
              })
            );
          } else {
            container.textContent = 'Error cargando análisis: ' + (err && err.message ? err.message : err);
          }
        }
      })
      .finally(function () {
        if (loading) loading.classList.add('d-none');
        if (dash) dash.classList.remove('d-none');
      });
  }

  global.AnalysisPanelData = { load: load, prefetch: prefetch };
})(typeof window !== 'undefined' ? window : this);
