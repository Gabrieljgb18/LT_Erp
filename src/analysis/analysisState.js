/**
 * AnalysisPanelState
 * Estado compartido del panel de analisis.
 */
(function (global) {
  const AnalysisPanelState = {
    containerId: 'analysis-panel',
    currentPeriod: null,
    currentRange: 6,
    comparisonVisible: false,
    lastData: null,
    Dom: (typeof DomHelpers !== 'undefined' && DomHelpers) ? DomHelpers : null,
    eventsController: null,
    escapeHtml: (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.escapeHtml === 'function')
      ? HtmlHelpers.escapeHtml
      : function (value) {
        return String(value || '')
          .replace(/&/g, '&amp;')
          .replace(/[<]/g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
  };

  global.AnalysisPanelState = AnalysisPanelState;
})(typeof window !== 'undefined' ? window : this);
