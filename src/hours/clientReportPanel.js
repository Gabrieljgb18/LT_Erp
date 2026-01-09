/**
 * ClientReportPanel
 * Orquestador del reporte de clientes.
 */
(function (global) {
  const ClientReportPanel = (() => {
    function ensureDeps() {
      return global.ClientReportPanelState
        && global.ClientReportPanelRender
        && global.ClientReportPanelHandlers
        && global.ClientReportPanelData;
    }

    function render() {
      if (!ensureDeps()) {
        console.error("ClientReportPanel dependencies no disponibles");
        return;
      }
      global.ClientReportPanelRender.render();
      global.ClientReportPanelHandlers.attachEvents();
      global.ClientReportPanelHandlers.init();
    }

    return { render: render };
  })();

  global.ClientReportPanel = ClientReportPanel;
})(typeof window !== "undefined" ? window : this);
