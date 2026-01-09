/**
 * AnalysisPanel
 * Orquestador del modulo de analisis.
 */
var AnalysisPanel = (function () {
  function render(targetId) {
    if (!AnalysisPanelState || !AnalysisPanelRender || !AnalysisPanelHandlers || !AnalysisPanelData) {
      console.error('AnalysisPanel dependencies no disponibles');
      return;
    }

    var container = document.getElementById(targetId || AnalysisPanelState.containerId);
    if (!container) return;

    AnalysisPanelState.comparisonVisible = false;
    AnalysisPanelState.lastData = null;

    AnalysisPanelRender.renderShell(container);
    AnalysisPanelHandlers.attach();
    AnalysisPanelRender.updateComparisonUI();
    AnalysisPanelData.load();
  }

  return { render: render };
})();
