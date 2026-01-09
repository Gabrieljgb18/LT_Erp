/**
 * ClientMonthlySummaryPanel
 */
(function (global) {
  const ClientMonthlySummaryPanel = (() => {
    function ensureDeps() {
      return global.ClientMonthlySummaryPanelState
        && global.ClientMonthlySummaryPanelRender
        && global.ClientMonthlySummaryPanelHandlers
        && global.ClientMonthlySummaryPanelData;
    }

    function render() {
      if (!ensureDeps()) {
        console.error("ClientMonthlySummaryPanel dependencies no disponibles");
        return;
      }
      global.ClientMonthlySummaryPanelRender.render();
      global.ClientMonthlySummaryPanelHandlers.attachEvents();
    }

    return { render: render };
  })();

  global.ClientMonthlySummaryPanel = ClientMonthlySummaryPanel;
})(typeof window !== "undefined" ? window : this);
