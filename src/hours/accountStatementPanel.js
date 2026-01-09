/**
 * AccountStatementPanel
 */
(function (global) {
  const AccountStatementPanel = (() => {
    function ensureDeps() {
      return global.AccountStatementPanelState
        && global.AccountStatementPanelRender
        && global.AccountStatementPanelHandlers
        && global.AccountStatementPanelData;
    }

    function render() {
      if (!ensureDeps()) {
        console.error("AccountStatementPanel dependencies no disponibles");
        return;
      }
      global.AccountStatementPanelRender.render();
      global.AccountStatementPanelHandlers.attachEvents();
      global.AccountStatementPanelHandlers.loadData();
    }

    return { render: render };
  })();

  global.AccountStatementPanel = AccountStatementPanel;
})(typeof window !== "undefined" ? window : this);
