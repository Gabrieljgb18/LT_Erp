/**
 * HoursDetailPanel
 * Orquestador del panel de detalle de horas.
 */
(function (global) {
  const HoursDetailPanel = (() => {
    function ensureDeps() {
      return global.HoursDetailPanelState
        && global.HoursDetailPanelRender
        && global.HoursDetailPanelHandlers
        && global.HoursDetailPanelData;
    }

    function render() {
      if (!ensureDeps()) {
        console.error("HoursDetailPanel dependencies no disponibles");
        return;
      }
      global.HoursDetailPanelRender.render();
      global.HoursDetailPanelHandlers.attachEvents();
      global.HoursDetailPanelHandlers.init();
    }

    return { render: render };
  })();

  global.HoursDetailPanel = HoursDetailPanel;
})(typeof window !== "undefined" ? window : this);
