/**
 * PaymentsPanelData
 * Datos del panel de pagos.
 */
(function (global) {
  const state = global.PaymentsPanelState;

  function extractClientIdFromLabel_(label) {
    if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
      return DomainHelpers.extractIdFromLabel(label);
    }
    return "";
  }

  function getClientIdFromLabel(label) {
    if (!label) return "";
    const extracted = extractClientIdFromLabel_(label);
    if (extracted) return extracted;
    const plain = String(label).trim();
    if (/^\d+$/.test(plain)) return plain;
    return "";
  }

  function loadClients() {
    const datalist = document.getElementById("payments-client-list");
    if (!datalist || !ReferenceService) return;

    if (!ReferenceService || typeof ReferenceService.ensureLoaded !== "function") {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return;
    }
    const loadPromise = ReferenceService.ensureLoaded();

    loadPromise.then(() => {
      const refs = ReferenceService.get();
      const clients = refs && refs.clientes ? refs.clientes : [];
      const ui = global.UIHelpers;
      if (ui && typeof ui.renderDatalist === "function") {
        ui.renderDatalist(datalist, []);
      } else {
        datalist.innerHTML = "";
      }
      state.clientIdMap.clear();

      const labels = clients
        .map((c) => {
          if (!c || typeof c !== "object") return "";
          const id = c.id != null ? String(c.id).trim() : "";
          if (!id) return "";
          let label = state.formatClientLabel(c);
          label = label != null ? String(label).trim() : "";
          if (!label) label = `ID: ${id}`;
          if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
            if (!DomainHelpers.extractIdFromLabel(label)) {
              label = `${label} (ID: ${id})`;
            }
          }
          state.clientIdMap.set(label, id);
          return label;
        })
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "es"));

      if (ui && typeof ui.renderDatalist === "function") {
        ui.renderDatalist(datalist, labels);
        return;
      }
      labels.forEach((label) => {
        const opt = document.createElement("option");
        opt.value = label;
        datalist.appendChild(opt);
      });
    });
  }

  function refreshClientData() {
    const clientRaw = document.getElementById("payments-client")?.value || "";
    const idCliente = getClientIdFromLabel(clientRaw);

    if (!clientRaw || !idCliente) {
      state.pendingInvoices = [];
      state.unappliedPayments = [];
      PaymentsPanelRender.renderInvoiceTable([]);
      PaymentsPanelRender.renderUnappliedTable([]);
      PaymentsPanelRender.renderInvoiceOptions([]);
      PaymentsPanelRender.renderInvoiceSummary("");
      PaymentsPanelRender.updateInvoiceCount(0);
      PaymentsPanelRender.updateUnappliedCount(0);
      return;
    }

    fetchPendingInvoices(clientRaw, idCliente);
    fetchUnappliedPayments(clientRaw, idCliente);
  }

  function fetchPendingInvoices(clientRaw, idCliente) {
    PaymentsPanelRender.toggleInvoiceLoading(true);
    PaymentsService.getClientInvoicesForPayment("", idCliente)
      .then((res) => {
        state.pendingInvoices = (res && res.invoices) ? res.invoices : (res || []);
        PaymentsPanelRender.renderInvoiceTable(state.pendingInvoices);
        PaymentsPanelRender.renderInvoiceOptions(state.pendingInvoices);
        PaymentsPanelRender.updateInvoiceCount(state.pendingInvoices.length);
      })
      .catch((err) => {
        Alerts && Alerts.notifyError
          ? Alerts.notifyError("Error cargando facturas", err)
          : (Alerts && Alerts.showError ? Alerts.showError("Error cargando facturas", err) : console.error(err));
        state.pendingInvoices = [];
        PaymentsPanelRender.renderInvoiceTable([]);
        PaymentsPanelRender.renderInvoiceOptions([]);
        PaymentsPanelRender.updateInvoiceCount(0);
      })
      .finally(() => PaymentsPanelRender.toggleInvoiceLoading(false));
  }

  function fetchUnappliedPayments(clientRaw, idCliente) {
    PaymentsPanelRender.toggleUnappliedLoading(true);
    PaymentsService.getUnappliedClientPayments("", idCliente)
      .then((res) => {
        state.unappliedPayments = (res && res.payments) ? res.payments : (res || []);
        PaymentsPanelRender.renderUnappliedTable(state.unappliedPayments);
        PaymentsPanelRender.updateUnappliedCount(state.unappliedPayments.length);
      })
      .catch((err) => {
        Alerts && Alerts.notifyError
          ? Alerts.notifyError("Error cargando pagos", err)
          : (Alerts && Alerts.showError ? Alerts.showError("Error cargando pagos", err) : console.error(err));
        state.unappliedPayments = [];
        PaymentsPanelRender.renderUnappliedTable([]);
        PaymentsPanelRender.updateUnappliedCount(0);
      })
      .finally(() => PaymentsPanelRender.toggleUnappliedLoading(false));
  }

  global.PaymentsPanelData = {
    loadClients,
    refreshClientData,
    fetchPendingInvoices,
    fetchUnappliedPayments,
    getClientIdFromLabel
  };
})(typeof window !== "undefined" ? window : this);
