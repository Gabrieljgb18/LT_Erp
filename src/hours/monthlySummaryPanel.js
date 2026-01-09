/**
 * MonthlySummaryPanel
 */
(function (global) {
  const MonthlySummaryPanel = (() => {
    function ensureDeps() {
      return global.MonthlySummaryPanelState
        && global.MonthlySummaryPanelRender
        && global.MonthlySummaryPanelHandlers
        && global.MonthlySummaryPanelData;
    }

    function render() {
      if (!ensureDeps()) {
        console.error("MonthlySummaryPanel dependencies no disponibles");
        return;
      }
      global.MonthlySummaryPanelRender.render();
      global.MonthlySummaryPanelHandlers.attachEvents();
    }

    return { render: render };
  })();

  global.MonthlySummaryPanel = MonthlySummaryPanel;
})(typeof window !== "undefined" ? window : this);
