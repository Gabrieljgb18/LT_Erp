/**
 * AnalysisPanelData
 * Carga de datos para el panel de analisis.
 */
(function (global) {
  const state = global.AnalysisPanelState;

  function load() {
    var loading = document.getElementById('analysis-loading');
    var dash = document.getElementById('analysis-dashboard');
    if (loading) loading.classList.remove('d-none');
    if (dash) dash.classList.add('d-none');

    if (!global.ApiService || typeof global.ApiService.call !== 'function') return;

    var payload = state.currentPeriod
      ? { period: state.currentPeriod, monthsBack: state.currentRange }
      : { monthsBack: state.currentRange };

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

  global.AnalysisPanelData = { load: load };
})(typeof window !== 'undefined' ? window : this);
