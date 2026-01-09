/**
 * InvoiceService
 * Encapsula llamadas de facturacion.
 */
(function (global) {
  const InvoiceService = (() => {
    function toStr(value) {
      return value == null ? "" : String(value);
    }

    function toObj(value) {
      return value && typeof value === "object" ? value : {};
    }

    function getInvoicingCoverage(period, filters) {
      return ApiService.call("getInvoicingCoverage", toStr(period), toObj(filters));
    }

    function createInvoiceFromAttendance(cliente, desde, hasta, options, idCliente) {
      return ApiService.call(
        "createInvoiceFromAttendance",
        cliente || "",
        toStr(desde),
        toStr(hasta),
        toObj(options),
        toStr(idCliente)
      );
    }

    function getInvoices(filters) {
      return ApiService.call("getInvoices", toObj(filters));
    }

    function getInvoiceById(id) {
      return ApiService.call("getInvoiceById", toStr(id));
    }

    function createInvoice(data) {
      return ApiService.call("createInvoice", toObj(data));
    }

    function updateInvoice(id, data) {
      return ApiService.call("updateInvoice", toStr(id), toObj(data));
    }

    function deleteInvoice(id) {
      return ApiService.call("deleteInvoice", toStr(id));
    }

    function generateInvoicePdf(id) {
      return ApiService.call("generateInvoicePdf", toStr(id));
    }

    function getHoursByClient(start, end, cliente, idCliente) {
      return ApiService.call("getHoursByClient", toStr(start), toStr(end), cliente || "", toStr(idCliente));
    }

    function getConfig() {
      return ApiService.call("getConfig");
    }

    function getReferenceData() {
      return ApiService.call("getReferenceData");
    }

    return {
      getInvoicingCoverage,
      createInvoiceFromAttendance,
      getInvoices,
      getInvoiceById,
      createInvoice,
      updateInvoice,
      deleteInvoice,
      generateInvoicePdf,
      getHoursByClient,
      getConfig,
      getReferenceData
    };
  })();

  global.InvoiceService = InvoiceService;
})(typeof window !== "undefined" ? window : this);
