/**
 * InvoicePanelState
 * Estado y helpers del panel de facturacion.
 */
(function (global) {
  const InvoicePanelState = {
    containerId: "invoice-main-panel",
    PAGE_SIZE: 10,
    lastInvoices: [],
    generatorInvoices: [],
    generatorHours: [],
    lastGeneratorFilters: null,
    clientIdMap: new Map(),
    selectedInvoiceIds: new Set(),
    lastSavedInvoiceId: null,
    ivaPct: 0.21,
    invoicePage: 1,
    generatorPage: 1,
    coverageRows: [],
    eventsController: null,
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null,
    escapeHtml: (typeof HtmlHelpers !== "undefined" && HtmlHelpers && typeof HtmlHelpers.escapeHtml === "function")
      ? HtmlHelpers.escapeHtml
      : function (val) {
        return String(val == null ? "" : val)
          .replace(/&/g, "&amp;")
          .replace(/[<]/g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");
      },
    formatClientLabel: (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getClientLabel === "function")
      ? function (cli) {
        return DomainHelpers.getClientLabel(cli, { preferRazon: true });
      }
      : function (cli) {
        return (typeof HtmlHelpers !== "undefined" && HtmlHelpers && typeof HtmlHelpers.formatClientLabel === "function")
          ? HtmlHelpers.formatClientLabel(cli, { preferRazon: true })
          : (cli || "");
      }
  };

  global.InvoicePanelState = InvoicePanelState;
})(typeof window !== "undefined" ? window : this);
