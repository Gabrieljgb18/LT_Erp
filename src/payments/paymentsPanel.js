/**
 * Panel de Pagos
 * Permite registrar pagos a cuenta o asociados a factura.
 */
var PaymentsPanel = (function () {
    const containerId = "payments-panel";
    const clientIdMap = new Map();
    let pendingInvoices = [];
    let unappliedPayments = [];
    let currentMode = "account"; // account | invoice
    const defaultPaymentMethods = ["Uala", "Mercado Pago", "Efectivo", "Santander"];
    let referenceListenerBound = false;

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        const paymentMethodOptions = buildPaymentMethodOptionsHtml_();
        container.innerHTML = `
            <div class="card shadow-sm mb-3">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-wallet2 me-2"></i>Pagos</h6>
                        <div class="small text-muted">Registrá pagos a cuenta o aplicados a facturas.</div>
                    </div>
                    <button class="btn btn-outline-secondary btn-sm" id="payments-refresh">
                        <i class="bi bi-arrow-repeat me-1"></i>Actualizar
                    </button>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 align-items-end mb-3">
                        <div class="col-md-5">
                            <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
                            <input list="payments-client-list" id="payments-client" class="form-control form-control-sm" placeholder="Seleccionar cliente...">
                            <datalist id="payments-client-list"></datalist>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small text-muted fw-bold mb-1">Tipo de pago</label>
                            <div class="btn-group w-100" role="group" id="payments-mode-group">
                                <button type="button" class="btn btn-outline-primary btn-sm active" data-mode="account">
                                    <i class="bi bi-cash-stack me-1"></i>A cuenta
                                </button>
                                <button type="button" class="btn btn-outline-primary btn-sm" data-mode="invoice">
                                    <i class="bi bi-receipt-cutoff me-1"></i>A factura
                                </button>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold mb-1">Fecha</label>
                            <input type="date" id="payments-date" class="form-control form-control-sm">
                        </div>
                    </div>

                    <div class="row g-2">
                        <div class="col-md-4">
                            <label class="form-label small text-muted fw-bold mb-1">Monto</label>
                            <input type="number" id="payments-amount" class="form-control form-control-sm" step="0.01" min="0">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small text-muted fw-bold mb-1">Medio de pago</label>
                            <select id="payments-method" class="form-select form-select-sm">
                                <option value="">Seleccionar...</option>
                                ${paymentMethodOptions}
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small text-muted fw-bold mb-1">N° comprobante</label>
                            <input type="text" id="payments-receipt" class="form-control form-control-sm" placeholder="Opcional">
                        </div>
                    </div>

                    <div class="row g-2 mt-1">
                        <div class="col-md-7">
                            <div id="payments-invoice-block" class="d-none">
                                <label class="form-label small text-muted fw-bold mb-1">Factura pendiente</label>
                                <select id="payments-invoice" class="form-select form-select-sm">
                                    <option value="">Seleccionar factura...</option>
                                </select>
                                <div class="small text-muted mt-1" id="payments-invoice-hint">Seleccioná una factura para asociar el pago.</div>
                                <div class="lt-surface lt-surface--subtle p-2 mt-2 d-none" id="payments-invoice-summary"></div>
                            </div>
                            <div id="payments-account-hint" class="lt-surface lt-surface--subtle p-2 small text-muted">
                                <i class="bi bi-info-circle me-1"></i>El pago se registrará a cuenta y podrá aplicarse luego.
                            </div>
                        </div>
                        <div class="col-md-5">
                            <label class="form-label small text-muted fw-bold mb-1">Observaciones</label>
                            <textarea id="payments-notes" class="form-control form-control-sm" rows="3" placeholder="Detalle adicional..."></textarea>
                        </div>
                    </div>

                    <div class="d-flex justify-content-end mt-3 gap-2">
                        <button class="btn btn-outline-secondary btn-sm" id="payments-clear">
                            <i class="bi bi-x-circle me-1"></i>Limpiar
                        </button>
                        <button class="btn btn-primary btn-sm" id="payments-save">
                            <i class="bi bi-check2-circle me-1"></i>Registrar pago
                        </button>
                    </div>
                </div>
            </div>

            <div class="card shadow-sm">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-list-check me-2"></i>Facturas pendientes</h6>
                        <div class="small text-muted">Solo se muestran facturas con saldo.</div>
                    </div>
                    <span class="badge bg-light text-dark border" id="payments-invoice-count">0</span>
                </div>
                <div class="card-body p-0">
                    <div id="payments-invoice-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Cargando facturas...</p>
                    </div>
                    <div class="table-responsive lt-table-wrap" id="payments-invoice-table-wrapper">
                        <table class="table table-hover table-sm align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                                    <th class="py-2 text-muted font-weight-normal">Factura</th>
                                    <th class="py-2 text-muted font-weight-normal">Periodo</th>
                                    <th class="text-end py-2 text-muted font-weight-normal">Saldo</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Acción</th>
                                </tr>
                            </thead>
                            <tbody id="payments-invoice-tbody">
                                <tr>
                                    <td class="text-center text-muted py-4" colspan="5">
                                        Seleccioná un cliente para ver sus facturas pendientes.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card shadow-sm mt-3">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-cash-stack me-2"></i>Pagos a cuenta pendientes</h6>
                        <div class="small text-muted">Aplicá pagos sin factura a una o más facturas.</div>
                    </div>
                    <span class="badge bg-light text-dark border" id="payments-unapplied-count">0</span>
                </div>
                <div class="card-body p-0">
                    <div id="payments-unapplied-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Cargando pagos...</p>
                    </div>
                    <div class="table-responsive lt-table-wrap" id="payments-unapplied-table-wrapper">
                        <table class="table table-hover table-sm align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                                    <th class="py-2 text-muted font-weight-normal">Detalle</th>
                                    <th class="text-end py-2 text-muted font-weight-normal">Disponible</th>
                                    <th class="py-2 text-muted font-weight-normal">Medio</th>
                                    <th class="py-2 text-muted font-weight-normal">Comprobante</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Acción</th>
                                </tr>
                            </thead>
                            <tbody id="payments-unapplied-tbody">
                                <tr>
                                    <td class="text-center text-muted py-4" colspan="6">
                                        Seleccioná un cliente para ver pagos a cuenta.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        setDefaultDate();
        loadClients();
        attachEvents();
        updateMode("account");
        bindReferenceListener_();
    }

    function setDefaultDate() {
        const dateInput = document.getElementById("payments-date");
        if (dateInput) {
            dateInput.value = new Date().toISOString().slice(0, 10);
        }
    }

    function loadClients() {
        const datalist = document.getElementById("payments-client-list");
        if (!datalist || !ReferenceService) return;

        ReferenceService.load().then(() => {
            const refs = ReferenceService.get();
            const clients = refs && refs.clientes ? refs.clientes : [];
            datalist.innerHTML = "";
            clientIdMap.clear();

            clients.forEach((c) => {
                const label = formatClientLabel(c);
                const id = c && typeof c === "object" && c.id ? c.id : "";
                if (label && id) {
                    clientIdMap.set(label, id);
                }
                const opt = document.createElement("option");
                opt.value = label;
                datalist.appendChild(opt);
            });
        });
    }

    function bindReferenceListener_() {
        if (referenceListenerBound || typeof document === "undefined") return;
        referenceListenerBound = true;
        document.addEventListener("reference-data:updated", function () {
            const view = document.getElementById("view-pagos");
            if (view && !view.classList.contains("d-none")) {
                loadClients();
            }
        });
    }

    function attachEvents() {
        const refreshBtn = document.getElementById("payments-refresh");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => {
                loadClients();
                refreshClientData();
            });
        }

        const modeGroup = document.getElementById("payments-mode-group");
        if (modeGroup) {
            modeGroup.addEventListener("click", (e) => {
                const btn = e.target.closest("button[data-mode]");
                if (!btn) return;
                updateMode(btn.dataset.mode);
            });
        }

        const clientInput = document.getElementById("payments-client");
        if (clientInput) {
            clientInput.addEventListener("change", () => {
                refreshClientData();
            });
        }

        const invoiceSelect = document.getElementById("payments-invoice");
        if (invoiceSelect) {
            invoiceSelect.addEventListener("change", () => {
                renderInvoiceSummary(invoiceSelect.value);
            });
        }

        const saveBtn = document.getElementById("payments-save");
        if (saveBtn) {
            saveBtn.addEventListener("click", savePayment);
        }

        const clearBtn = document.getElementById("payments-clear");
        if (clearBtn) {
            clearBtn.addEventListener("click", clearForm);
        }
    }

    function updateMode(mode) {
        currentMode = mode === "invoice" ? "invoice" : "account";
        const buttons = document.querySelectorAll("#payments-mode-group button");
        buttons.forEach((btn) => {
            const active = btn.dataset.mode === currentMode;
            btn.classList.toggle("active", active);
            btn.classList.toggle("btn-primary", active);
            btn.classList.toggle("btn-outline-primary", !active);
        });

        const invoiceBlock = document.getElementById("payments-invoice-block");
        const accountHint = document.getElementById("payments-account-hint");
        if (invoiceBlock) invoiceBlock.classList.toggle("d-none", currentMode !== "invoice");
        if (accountHint) accountHint.classList.toggle("d-none", currentMode === "invoice");
    }

    function refreshClientData() {
        fetchPendingInvoices();
        fetchUnappliedPayments();
    }

    function fetchPendingInvoices() {
        const clientRaw = document.getElementById("payments-client")?.value || "";
        const idCliente = getClientIdFromLabel(clientRaw);

        pendingInvoices = [];
        renderInvoiceOptions([]);
        renderInvoiceSummary("");

        const tbody = document.getElementById("payments-invoice-tbody");
        if (!clientRaw) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td class="text-center text-muted py-4" colspan="5">
                            Seleccioná un cliente para ver sus facturas pendientes.
                        </td>
                    </tr>
                `;
            }
            updateInvoiceCount(0);
            return;
        }
        if (!idCliente) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td class="text-center text-muted py-4" colspan="5">
                            Seleccioná un cliente válido de la lista.
                        </td>
                    </tr>
                `;
            }
            updateInvoiceCount(0);
            return;
        }

        toggleInvoiceLoading(true);
        ApiService.call("getClientInvoicesForPayment", "", idCliente)
            .then((list) => {
                const items = Array.isArray(list) ? list : [];
                pendingInvoices = items;
                renderInvoiceOptions(items);
                renderInvoiceTable(items);
                updateInvoiceCount(items.length);
            })
            .catch((err) => {
                console.error("Error cargando facturas:", err);
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td class="text-center text-danger py-4" colspan="5">
                                Error al cargar facturas pendientes.
                            </td>
                        </tr>
                    `;
                }
                updateInvoiceCount(0);
            })
            .finally(() => toggleInvoiceLoading(false));
    }

    function fetchUnappliedPayments() {
        const clientRaw = document.getElementById("payments-client")?.value || "";
        const idCliente = getClientIdFromLabel(clientRaw);

        unappliedPayments = [];

        const tbody = document.getElementById("payments-unapplied-tbody");
        if (!clientRaw) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td class="text-center text-muted py-4" colspan="6">
                            Seleccioná un cliente para ver pagos a cuenta.
                        </td>
                    </tr>
                `;
            }
            updateUnappliedCount(0);
            return;
        }
        if (!idCliente) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td class="text-center text-muted py-4" colspan="6">
                            Seleccioná un cliente válido de la lista.
                        </td>
                    </tr>
                `;
            }
            updateUnappliedCount(0);
            return;
        }

        toggleUnappliedLoading(true);
        ApiService.call("getUnappliedClientPayments", "", idCliente)
            .then((list) => {
                const items = Array.isArray(list) ? list : [];
                unappliedPayments = items;
                renderUnappliedTable(items);
                updateUnappliedCount(items.length);
            })
            .catch((err) => {
                console.error("Error cargando pagos a cuenta:", err);
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td class="text-center text-danger py-4" colspan="6">
                                Error al cargar pagos a cuenta.
                            </td>
                        </tr>
                    `;
                }
                updateUnappliedCount(0);
            })
            .finally(() => toggleUnappliedLoading(false));
    }

    function renderInvoiceOptions(items) {
        const select = document.getElementById("payments-invoice");
        const hint = document.getElementById("payments-invoice-hint");
        if (!select) return;
        select.innerHTML = `<option value="">Seleccionar factura...</option>`;
        if (hint) {
            hint.textContent = items.length
                ? `Facturas pendientes encontradas: ${items.length}.`
                : "No hay facturas pendientes para asociar.";
        }
        items.forEach((inv) => {
            const opt = document.createElement("option");
            opt.value = inv.id || "";
            const fechaStr = inv.fecha ? formatDateDisplay(inv.fecha) : "";
            const pendiente = inv.saldo != null ? Number(inv.saldo) : null;
            const pendienteStr = (pendiente != null && !isNaN(pendiente) && pendiente > 0)
                ? `Pendiente ${formatCurrency(pendiente)}`
                : "";
            const labelParts = [
                inv.comprobante || "Factura",
                inv.numero || "S/N",
                inv.periodo || "",
                fechaStr,
                pendienteStr
            ].filter(Boolean);
            opt.textContent = labelParts.join(" - ");
            opt.dataset.numero = inv.numero || "";
            select.appendChild(opt);
        });
    }

    function renderInvoiceSummary(invoiceId) {
        const summary = document.getElementById("payments-invoice-summary");
        if (!summary) return;
        const inv = pendingInvoices.find((i) => String(i.id || "") === String(invoiceId || ""));
        if (!inv) {
            summary.classList.add("d-none");
            summary.innerHTML = "";
            return;
        }
        const comp = escapeHtml(inv.comprobante || "Factura");
        const numero = escapeHtml(inv.numero || "S/N");
        const periodo = escapeHtml(inv.periodo || "-");
        summary.innerHTML = `
            <div class="small text-muted">Resumen de la factura</div>
            <div class="d-flex flex-wrap gap-2 small">
                <span><strong>${comp}</strong> ${numero}</span>
                <span>Periodo: ${periodo}</span>
                <span>Fecha: ${formatDateDisplay(inv.fecha)}</span>
                <span>Saldo: <strong>${formatCurrency(inv.saldo || 0)}</strong></span>
            </div>
        `;
        summary.classList.remove("d-none");
    }

    function renderInvoiceTable(items) {
        const tbody = document.getElementById("payments-invoice-tbody");
        if (!tbody) return;
        if (!items.length) {
            tbody.innerHTML = `
                <tr>
                    <td class="text-center text-muted py-4" colspan="5">
                        No hay facturas pendientes para este cliente.
                    </td>
                </tr>
            `;
            return;
        }
        tbody.innerHTML = "";
        items.forEach((inv) => {
            const tr = document.createElement("tr");
            const comp = escapeHtml(inv.comprobante || "Factura");
            const numero = escapeHtml(inv.numero || "S/N");
            const periodo = escapeHtml(inv.periodo || "-");
            tr.innerHTML = `
                <td class="ps-3">${formatDateDisplay(inv.fecha)}</td>
                <td>${comp} ${numero}</td>
                <td>${periodo}</td>
                <td class="text-end text-danger">${formatCurrency(inv.saldo || 0)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary payments-select-invoice" data-id="${escapeHtml(inv.id || "")}">
                        Aplicar pago
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll(".payments-select-invoice").forEach((btn) => {
            btn.addEventListener("click", () => {
                updateMode("invoice");
                const select = document.getElementById("payments-invoice");
                if (select) {
                    select.value = btn.dataset.id || "";
                    renderInvoiceSummary(select.value);
                }
            });
        });
    }

    function renderUnappliedTable(items) {
        const tbody = document.getElementById("payments-unapplied-tbody");
        if (!tbody) return;
        if (!items.length) {
            tbody.innerHTML = `
                <tr>
                    <td class="text-center text-muted py-4" colspan="6">
                        No hay pagos a cuenta pendientes para este cliente.
                    </td>
                </tr>
            `;
            return;
        }
        tbody.innerHTML = "";
        items.forEach((pay) => {
            const tr = document.createElement("tr");
            const detalle = pay.detalle ? String(pay.detalle) : "-";
            tr.innerHTML = `
                <td class="ps-3">${formatDateDisplay(pay.fecha)}</td>
                <td>${escapeHtml(detalle)}</td>
                <td class="text-end text-success">${formatCurrency(pay.monto || 0)}</td>
                <td>${escapeHtml(pay.medioPago || "-")}</td>
                <td>${escapeHtml(pay.numeroComprobante || "-")}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary payments-apply-payment" data-id="${escapeHtml(pay.id || "")}">
                        Aplicar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll(".payments-apply-payment").forEach((btn) => {
            btn.addEventListener("click", () => {
                openApplyModal(btn.dataset.id || "");
            });
        });
    }

    function openApplyModal(paymentId) {
        const payment = unappliedPayments.find((p) => String(p.id || "") === String(paymentId || ""));
        if (!payment) {
            Alerts && Alerts.showAlert("Pago no encontrado.", "warning");
            return;
        }
        if (!pendingInvoices.length) {
            Alerts && Alerts.showAlert("No hay facturas pendientes para aplicar.", "warning");
            return;
        }
        showApplyModal(payment);
    }

    function showApplyModal(payment) {
        if (typeof bootstrap === "undefined" || !bootstrap.Modal) {
            Alerts && Alerts.showAlert("No se pudo abrir el modal de aplicación.", "warning");
            return;
        }

        const modalId = "payments-apply-modal";
        const oldModal = document.getElementById(modalId);
        if (oldModal) oldModal.remove();

        const invoices = pendingInvoices.slice();
        const invoiceRows = invoices.map((inv) => {
            const saldo = Number(inv.saldo || 0);
            return `
                <tr>
                    <td>${formatDateDisplay(inv.fecha)}</td>
                    <td>${escapeHtml((inv.comprobante || "Factura") + " " + (inv.numero || "S/N"))}</td>
                    <td class="text-end">${formatCurrency(saldo)}</td>
                    <td style="width: 140px;">
                        <input type="number" class="form-control form-control-sm payments-apply-input"
                               data-id="${escapeHtml(inv.id || "")}"
                               data-saldo="${saldo}" min="0" step="0.01" inputmode="decimal">
                    </td>
                </tr>
            `;
        }).join("");

        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-cash-coin me-2"></i>Aplicar pago a facturas
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="lt-surface lt-surface--subtle p-3 mb-3">
                                <div class="row g-2 small">
                                    <div class="col-md-3">
                                        <div class="text-muted">Fecha</div>
                                        <div class="fw-semibold">${formatDateDisplay(payment.fecha)}</div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="text-muted">Disponible</div>
                                        <div class="fw-semibold text-success">${formatCurrency(payment.monto || 0)}</div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="text-muted">Medio</div>
                                        <div class="fw-semibold">${escapeHtml(payment.medioPago || "-")}</div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="text-muted">Comprobante</div>
                                        <div class="fw-semibold">${escapeHtml(payment.numeroComprobante || "-")}</div>
                                    </div>
                                    ${payment.detalle ? `
                                        <div class="col-12 text-muted">Obs: ${escapeHtml(payment.detalle)}</div>
                                    ` : ""}
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-sm align-middle">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Factura</th>
                                            <th class="text-end">Saldo</th>
                                            <th class="text-end">Aplicar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${invoiceRows || `
                                            <tr>
                                                <td colspan="4" class="text-center text-muted py-3">
                                                    No hay facturas pendientes para aplicar.
                                                </td>
                                            </tr>
                                        `}
                                    </tbody>
                                </table>
                            </div>
                            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
                                <button type="button" class="btn btn-outline-primary btn-sm" id="payments-apply-auto">
                                    <i class="bi bi-magic me-1"></i>Distribuir saldo
                                </button>
                                <div class="small">
                                    <span class="text-muted me-1">Total a aplicar:</span>
                                    <strong id="payments-apply-total">${formatCurrency(0)}</strong>
                                    <span class="text-muted ms-3 me-1">Restante:</span>
                                    <strong id="payments-apply-remaining">${formatCurrency(payment.monto || 0)}</strong>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="payments-apply-confirm">
                                <i class="bi bi-check2-circle me-1"></i>Aplicar pago
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modalHtml);
        const modalEl = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        modalEl.addEventListener("hidden.bs.modal", () => {
            modalEl.remove();
        });

        modalEl.querySelectorAll(".payments-apply-input").forEach((input) => {
            input.addEventListener("input", () => updateApplyTotals(modalEl, payment));
        });

        const autoBtn = modalEl.querySelector("#payments-apply-auto");
        if (autoBtn) {
            autoBtn.addEventListener("click", () => {
                autoDistributeAllocations(modalEl, payment);
            });
        }

        const confirmBtn = modalEl.querySelector("#payments-apply-confirm");
        if (confirmBtn) {
            confirmBtn.addEventListener("click", () => {
                handleApplyConfirm(modalEl, payment, modal);
            });
        }

        updateApplyTotals(modalEl, payment);
    }

    function autoDistributeAllocations(modalEl, payment) {
        let remaining = Number(payment.monto || 0);
        const inputs = modalEl.querySelectorAll(".payments-apply-input");
        inputs.forEach((input) => {
            const saldo = Number(input.dataset.saldo || 0);
            const apply = Math.max(0, Math.min(saldo, remaining));
            input.value = apply > 0 ? apply.toFixed(2) : "";
            remaining -= apply;
        });
        updateApplyTotals(modalEl, payment);
    }

    function updateApplyTotals(modalEl, payment) {
        const available = Number(payment.monto || 0);
        let total = 0;
        let hasError = false;

        modalEl.querySelectorAll(".payments-apply-input").forEach((input) => {
            const value = parseFloat(input.value);
            const saldo = parseFloat(input.dataset.saldo || "0");
            if (!isNaN(value) && value > 0) {
                total += value;
                if (!isNaN(saldo) && value > saldo + 0.01) {
                    input.classList.add("is-invalid");
                    hasError = true;
                } else {
                    input.classList.remove("is-invalid");
                }
            } else {
                input.classList.remove("is-invalid");
            }
        });

        const remaining = available - total;
        const totalEl = modalEl.querySelector("#payments-apply-total");
        const remainingEl = modalEl.querySelector("#payments-apply-remaining");
        if (totalEl) totalEl.textContent = formatCurrency(total);
        if (remainingEl) {
            remainingEl.textContent = formatCurrency(remaining);
            remainingEl.classList.toggle("text-danger", remaining < -0.01);
            remainingEl.classList.toggle("text-success", remaining >= 0);
        }

        const confirmBtn = modalEl.querySelector("#payments-apply-confirm");
        if (confirmBtn) {
            confirmBtn.disabled = hasError || total <= 0 || remaining < -0.01;
        }

        return { total, remaining, hasError };
    }

    function collectAllocations(modalEl) {
        const allocations = [];
        modalEl.querySelectorAll(".payments-apply-input").forEach((input) => {
            const value = parseFloat(input.value);
            if (!isNaN(value) && value > 0) {
                allocations.push({ invoiceId: input.dataset.id, amount: value });
            }
        });
        return allocations;
    }

    function handleApplyConfirm(modalEl, payment, modal) {
        const summary = updateApplyTotals(modalEl, payment);
        if (summary.hasError) {
            Alerts && Alerts.showAlert("Revisá los montos aplicados.", "warning");
            return;
        }

        const allocations = collectAllocations(modalEl);
        if (!allocations.length) {
            Alerts && Alerts.showAlert("Ingresá al menos un monto para aplicar.", "warning");
            return;
        }

        if (summary.remaining < -0.01) {
            Alerts && Alerts.showAlert("El total aplicado supera el saldo disponible.", "warning");
            return;
        }

        UiState.setGlobalLoading(true, "Aplicando pago...");
        ApiService.call("applyClientPayment", payment.id, allocations)
            .then((res) => {
                const applied = res && res.applied != null ? formatCurrency(res.applied) : "";
                const remaining = res && res.remaining != null ? formatCurrency(res.remaining) : "";
                const detail = remaining ? ` Saldo pendiente ${remaining}.` : "";
                Alerts && Alerts.showAlert(`Pago aplicado. ${applied ? "Aplicado " + applied + "." : ""}${detail}`, "success");
                modal.hide();
                refreshClientData();
            })
            .catch((err) => {
                Alerts && Alerts.showAlert("Error al aplicar pago: " + err.message, "danger");
            })
            .finally(() => UiState.setGlobalLoading(false));
    }

    function savePayment() {
        const clientRaw = document.getElementById("payments-client")?.value || "";
        const idCliente = getClientIdFromLabel(clientRaw);
        const fecha = document.getElementById("payments-date")?.value || "";
        const monto = document.getElementById("payments-amount")?.value || "";
        const medioPago = document.getElementById("payments-method")?.value || "";
        const nroComprobante = document.getElementById("payments-receipt")?.value || "";
        const obs = document.getElementById("payments-notes")?.value || "";
        const facturaSelect = document.getElementById("payments-invoice");
        const facturaId = currentMode === "invoice" && facturaSelect ? facturaSelect.value : "";
        const facturaNumero = currentMode === "invoice" && facturaSelect && facturaSelect.selectedOptions[0]
            ? (facturaSelect.selectedOptions[0].dataset.numero || "")
            : "";

        if (!clientRaw) {
            Alerts && Alerts.showAlert("Seleccioná un cliente.", "warning");
            return;
        }
        if (!idCliente) {
            Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
            return;
        }
        if (!monto) {
            Alerts && Alerts.showAlert("Ingresá un monto.", "warning");
            return;
        }
        if (currentMode === "invoice" && !facturaId) {
            Alerts && Alerts.showAlert("Seleccioná una factura para asociar el pago.", "warning");
            return;
        }

        UiState.setGlobalLoading(true, "Guardando pago...");
        ApiService.call("recordClientPayment", {
            fecha: fecha,
            cliente: clientRaw,
            idCliente: idCliente,
            monto: monto,
            detalle: obs,
            numeroComprobante: nroComprobante,
            medioPago: medioPago,
            idFactura: facturaId || "",
            facturaNumero: facturaNumero || ""
        })
            .then(() => {
                Alerts && Alerts.showAlert("Pago registrado correctamente.", "success");
                clearForm(false);
                refreshClientData();
            })
            .catch((err) => {
                Alerts && Alerts.showAlert("Error al registrar pago: " + err.message, "danger");
            })
            .finally(() => UiState.setGlobalLoading(false));
    }

    function clearForm(resetClient = true) {
        if (resetClient) {
            const clientInput = document.getElementById("payments-client");
            if (clientInput) clientInput.value = "";
            pendingInvoices = [];
            unappliedPayments = [];
        }
        const amount = document.getElementById("payments-amount");
        if (amount) amount.value = "";
        const method = document.getElementById("payments-method");
        if (method) method.value = "";
        const receipt = document.getElementById("payments-receipt");
        if (receipt) receipt.value = "";
        const notes = document.getElementById("payments-notes");
        if (notes) notes.value = "";
        const invoiceSelect = document.getElementById("payments-invoice");
        if (invoiceSelect) invoiceSelect.value = "";
        renderInvoiceSummary("");
        if (resetClient) {
            renderInvoiceTable([]);
            updateInvoiceCount(0);
            renderUnappliedTable([]);
            updateUnappliedCount(0);
        }
    }

    function updateInvoiceCount(count) {
        const badge = document.getElementById("payments-invoice-count");
        if (badge) badge.textContent = String(count || 0);
    }

    function updateUnappliedCount(count) {
        const badge = document.getElementById("payments-unapplied-count");
        if (badge) badge.textContent = String(count || 0);
    }

    function toggleInvoiceLoading(show) {
        const loading = document.getElementById("payments-invoice-loading");
        const wrapper = document.getElementById("payments-invoice-table-wrapper");
        if (loading) loading.classList.toggle("d-none", !show);
        if (wrapper) wrapper.classList.toggle("d-none", show);
    }

    function toggleUnappliedLoading(show) {
        const loading = document.getElementById("payments-unapplied-loading");
        const wrapper = document.getElementById("payments-unapplied-table-wrapper");
        if (loading) loading.classList.toggle("d-none", !show);
        if (wrapper) wrapper.classList.toggle("d-none", show);
    }

    function formatClientLabel(cli) {
        if (!cli) return "";
        if (typeof cli === "string") return cli;
        const base = (typeof HtmlHelpers !== "undefined" && HtmlHelpers && typeof HtmlHelpers.getClientDisplayName === "function")
            ? HtmlHelpers.getClientDisplayName(cli)
            : (cli.nombre || cli.razonSocial || "");
        const id = cli.id != null ? String(cli.id).trim() : "";
        const docLabel = getClientDocLabel_(cli);
        const meta = [];
        if (id) meta.push(`ID: ${id}`);
        if (docLabel) meta.push(docLabel);
        const metaSuffix = meta.length ? ` (${meta.join(" | ")})` : "";
        return (base + metaSuffix).trim();
    }

    function getClientDocLabel_(cli) {
        if (!cli || typeof cli !== "object") return "";
        const docType = (cli.docType || cli["TIPO DOCUMENTO"] || "").toString().trim();
        const rawDoc = cli.docNumber || cli["NUMERO DOCUMENTO"] || cli.cuit || "";
        if (!rawDoc) return "";
        const fallbackType = docType || (cli.cuit ? "CUIT" : "");
        if (typeof InputUtils !== "undefined" && InputUtils && typeof InputUtils.formatDocLabel === "function") {
            return InputUtils.formatDocLabel(fallbackType, rawDoc);
        }
        return (fallbackType ? fallbackType + " " : "") + rawDoc;
    }

    function extractClientIdFromLabel_(label) {
        const match = String(label || "").match(/ID\\s*:\\s*([^|)]+)/i);
        return match ? match[1].trim() : "";
    }

    function getClientIdFromLabel(label) {
        if (!label) return "";
        return clientIdMap.get(label) || extractClientIdFromLabel_(label);
    }

    function formatCurrency(v) {
        if (typeof Formatters !== "undefined" && Formatters && typeof Formatters.formatCurrency === "function") {
            return Formatters.formatCurrency(v);
        }
        return Number(v).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
    }

    function formatDateDisplay(v) {
        if (typeof Formatters !== "undefined" && Formatters && typeof Formatters.formatDateDisplay === "function") {
            return Formatters.formatDateDisplay(v);
        }
        if (!v) return "";
        if (typeof v === "string") {
            const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) return `${m[3]}/${m[2]}/${m[1]}`;
        }
        const d = v instanceof Date ? v : new Date(v);
        if (!isNaN(d.getTime())) return d.toLocaleDateString("es-AR");
        return String(v);
    }

    function escapeHtml(value) {
        if (typeof HtmlHelpers !== "undefined" && HtmlHelpers && typeof HtmlHelpers.escapeHtml === "function") {
            return HtmlHelpers.escapeHtml(value);
        }
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getPaymentMethods_() {
        if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.getOptions === "function") {
            const list = DropdownConfig.getOptions("MEDIO DE PAGO", defaultPaymentMethods);
            if (Array.isArray(list) && list.length) return list;
        }
        return defaultPaymentMethods.slice();
    }

    function buildPaymentMethodOptionsHtml_() {
        return getPaymentMethods_()
            .map((method) => {
                const safe = escapeHtml(method);
                return `<option value="${safe}">${safe}</option>`;
            })
            .join("");
    }

    return { render: render };
})();
