/**
 * PaymentsPanelState
 * Estado y helpers del panel de pagos.
 */
(function (global) {
  const PaymentsPanelState = {
    containerId: "payments-panel",
    clientIdMap: new Map(),
    pendingInvoices: [],
    unappliedPayments: [],
    currentMode: "account",
    defaultPaymentMethods: ["Uala", "Mercado Pago", "Efectivo", "Santander"],
    referenceListenerBound: false,
    eventsController: null,
    escapeHtml: (typeof HtmlHelpers !== "undefined" && HtmlHelpers && typeof HtmlHelpers.escapeHtml === "function")
      ? HtmlHelpers.escapeHtml
      : function (value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/[<]/g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      },
    formatClientLabel: (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getClientLabel === "function")
      ? DomainHelpers.getClientLabel
      : function (cli) {
        return cli == null ? "" : String(cli);
      }
  };

  global.PaymentsPanelState = PaymentsPanelState;
})(typeof window !== "undefined" ? window : this);
