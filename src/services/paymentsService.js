/**
 * PaymentsService
 * Encapsula llamadas de pagos de clientes.
 */
(function (global) {
  const PaymentsService = (() => {
    function toStr(value) {
      return value == null ? "" : String(value);
    }

    function toObj(value) {
      return value && typeof value === "object" ? value : {};
    }

    function getClientInvoicesForPayment(cliente, idCliente) {
      return ApiService.call("getClientInvoicesForPayment", toStr(cliente), toStr(idCliente));
    }

    function getUnappliedClientPayments(cliente, idCliente) {
      return ApiService.call("getUnappliedClientPayments", toStr(cliente), toStr(idCliente));
    }

    function applyClientPayment(paymentId, allocations) {
      return ApiService.call("applyClientPayment", toStr(paymentId), Array.isArray(allocations) ? allocations : []);
    }

    function recordClientPayment(payload) {
      return ApiService.call("recordClientPayment", toObj(payload));
    }

    return {
      getClientInvoicesForPayment,
      getUnappliedClientPayments,
      applyClientPayment,
      recordClientPayment
    };
  })();

  global.PaymentsService = PaymentsService;
})(typeof window !== "undefined" ? window : this);
