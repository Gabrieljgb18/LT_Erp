/**
 * ClientAccountPanel
 * Orquestador de cuenta corriente de clientes.
 */
(function (global) {
  const ClientAccountPanel = (() => {
    function ensureDeps() {
      return global.ClientAccountPanelState
        && global.ClientAccountPanelRender
        && global.ClientAccountPanelHandlers
        && global.ClientAccountPanelData;
    }

    function render() {
      if (!ensureDeps()) {
        console.error("ClientAccountPanel dependencies no disponibles");
        return;
      }
      global.ClientAccountPanelRender.render();
      global.ClientAccountPanelHandlers.attachEvents();
      global.ClientAccountPanelHandlers.init();
    }

    return { render: render, handleReferenceUpdate: global.ClientAccountPanelHandlers ? global.ClientAccountPanelHandlers.handleReferenceUpdate : undefined };
  })();

  global.ClientAccountPanel = ClientAccountPanel;
})(typeof window !== "undefined" ? window : this);
