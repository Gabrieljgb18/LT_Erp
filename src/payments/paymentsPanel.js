/**
 * PaymentsPanel
 * Orquestador del modulo de pagos.
 */
var PaymentsPanel = (function () {
  function render() {
    if (typeof PaymentsPanelRender !== "undefined" && PaymentsPanelRender && typeof PaymentsPanelRender.render === "function") {
      PaymentsPanelRender.render();
    }
  }

  return { render: render };
})();
