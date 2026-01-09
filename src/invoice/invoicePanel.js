/**
 * InvoicePanel
 * Orquestador del modulo de facturacion.
 */
var InvoicePanel = (function () {
  function ensureDeps() {
    if (!InvoicePanelState || !InvoicePanelRender || !InvoicePanelHandlers || !InvoicePanelData) {
      console.error("InvoicePanel dependencies no disponibles");
      return false;
    }
    return true;
  }

  function render() {
    if (!ensureDeps()) return;
    InvoicePanelRender.render();
  }

  return {
    render: render,
    editInvoice: function (id) {
      if (ensureDeps()) InvoicePanelHandlers.editInvoice(id);
    },
    deleteInvoice: function (id, skipRefreshMain) {
      if (ensureDeps()) InvoicePanelHandlers.deleteInvoice(id, skipRefreshMain);
    },
    openModal: function (data) {
      if (ensureDeps()) InvoicePanelHandlers.openModal(data);
    },
    downloadPdf: function (id) {
      if (ensureDeps()) InvoicePanelHandlers.downloadPdf(id);
    },
    prefillFromHours: function (fecha, empleado, horas) {
      if (ensureDeps()) InvoicePanelHandlers.prefillFromHours(fecha, empleado, horas);
    },
    editAttendance: function (id) {
      if (ensureDeps()) InvoicePanelHandlers.editAttendance(id);
    },
    deleteAttendance: function (id) {
      if (ensureDeps()) InvoicePanelHandlers.deleteAttendance(id);
    },
    setInvoicePage: function (page) {
      if (ensureDeps()) InvoicePanelHandlers.setInvoicePage(page);
    },
    setGeneratorPage: function (page) {
      if (ensureDeps()) InvoicePanelHandlers.setGeneratorPage(page);
    },
    toggleInvoiceSelection: function (id, checked) {
      if (ensureDeps()) InvoicePanelHandlers.toggleInvoiceSelection(id, checked);
    },
    toggleSelectAll: function (checked) {
      if (ensureDeps()) InvoicePanelHandlers.toggleSelectAll(checked);
    },
    generateCoverageInvoice: function (idCliente, cliente, period) {
      if (ensureDeps()) InvoicePanelHandlers.generateCoverageInvoice(idCliente, cliente, period);
    }
  };
})();
