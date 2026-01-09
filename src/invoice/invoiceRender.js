/**
 * InvoicePanelRender
 * Render del panel de facturacion.
 */
(function (global) {
  const state = global.InvoicePanelState;
  if (!state) {
    console.error("InvoicePanelState no disponible");
    return;
  }
  const Dom = state.Dom;

  function buildBadge_(label, options) {
    const ui = global.UIHelpers;
    const text = label == null ? "" : String(label);
    if (ui && typeof ui.badge === "function") {
      return ui.badge(text, options);
    }
    const className = options && options.className ? options.className : "badge bg-light text-dark border";
    if (Dom) {
      return Dom.el("span", { className: className, text: text });
    }
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    return span;
  }

  function getInvoiceStatusOptions_() {
    const defaults = ["Pendiente", "Pagada", "Anulada", "Vencida"];
    if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.getOptions === "function") {
      return DropdownConfig.getOptions("INVOICE_ESTADO", defaults);
    }
    return defaults;
  }

  function getInvoiceComprobanteOptions_() {
    const defaults = [
      "Factura A",
      "Factura B",
      "Factura C",
      "Nota de Crédito",
      "Nota de Débito",
      "Recibo"
    ];
    if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.getOptions === "function") {
      return DropdownConfig.getOptions("INVOICE_COMPROBANTE", defaults);
    }
    return defaults;
  }

  function renderInitialStates_() {
    const empty = document.getElementById("invoice-empty");
    if (empty && global.EmptyState) {
      global.EmptyState.render(empty, {
        variant: "empty",
        title: "Sin facturas",
        message: "No hay facturas para mostrar. Usá los filtros o creá una nueva factura."
      });
    }
    if (empty) empty.classList.remove("d-none");

    const genEmpty = document.getElementById("invoice-gen-empty");
    if (genEmpty && global.EmptyState) {
      global.EmptyState.render(genEmpty, {
        variant: "empty",
        title: "Sin registros",
        message: "No hay registros de asistencia de este cliente en el rango indicado."
      });
    }
    if (genEmpty) genEmpty.classList.remove("d-none");

    const covEmpty = document.getElementById("invoice-cov-empty");
    if (covEmpty && global.EmptyState) {
      global.EmptyState.render(covEmpty, {
        variant: "empty",
        title: "Sin datos",
        message: "Elegí un período y buscá para ver quién quedó sin facturar."
      });
    }
    if (covEmpty) covEmpty.classList.remove("d-none");
  }

  function renderSelectOptions_() {
    const ui = global.UIHelpers;
    const renderSelect = (selectEl, options, selected, config) => {
      if (!selectEl) return;
      if (ui && typeof ui.renderSelect === "function") {
        ui.renderSelect(selectEl, options, selected, config);
        return;
      }
      const opts = Array.isArray(options) ? options.slice() : [];
      const sel = selected != null ? String(selected) : "";
      if (sel && opts.indexOf(sel) === -1 && (!config || config.ensureSelected !== false)) {
        opts.unshift(sel);
      }
      selectEl.innerHTML = "";
      if (config && config.includeEmpty) {
        const emptyOpt = document.createElement("option");
        emptyOpt.value = "";
        emptyOpt.textContent = config.emptyLabel || "Seleccionar...";
        selectEl.appendChild(emptyOpt);
      }
      opts.forEach((optValue) => {
        if (optValue == null) return;
        const opt = document.createElement("option");
        opt.value = String(optValue);
        opt.textContent = String(optValue);
        if (sel && String(optValue) === sel) opt.selected = true;
        selectEl.appendChild(opt);
      });
    };

    const statusOptions = getInvoiceStatusOptions_();
    renderSelect(document.getElementById("invoice-filter-status"), statusOptions, "", {
      includeEmpty: true,
      emptyLabel: "Todos"
    });
    renderSelect(document.getElementById("invoice-estado"), statusOptions, "Pendiente");

    const comprobanteOptions = getInvoiceComprobanteOptions_();
    renderSelect(document.getElementById("invoice-comprobante"), comprobanteOptions, "Factura B");
    renderSelect(document.getElementById("invoice-att-comp"), comprobanteOptions, "Factura B");
  }

  function ensureSelectOption_(selectEl, value) {
    if (!selectEl || value == null || value === "") return;
    const val = String(value);
    const exists = Array.from(selectEl.options || []).some((opt) => opt.value === val);
    if (exists) return;
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    selectEl.appendChild(opt);
  }

  function initCoveragePeriod_() {
    const el = document.getElementById("invoice-cov-period");
    if (!el) return;
    if (!el.value) {
      const d = new Date();
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      el.value = `${yyyy}-${mm}`;
    }
  }

  function setCoverageLoading_(loading) {
    const loadingEl = document.getElementById("invoice-cov-loading");
    const resultsEl = document.getElementById("invoice-cov-results");
    const emptyEl = document.getElementById("invoice-cov-empty");
    const summaryEl = document.getElementById("invoice-cov-summary");
    if (loadingEl) {
      loadingEl.classList.toggle("d-none", !loading);
      if (loading && global.EmptyState) {
        global.EmptyState.render(loadingEl, { variant: "loading", message: "Calculando cobertura..." });
      }
    }
    if (resultsEl) resultsEl.classList.toggle("d-none", loading || !state.coverageRows || state.coverageRows.length === 0);
    if (emptyEl) emptyEl.classList.toggle("d-none", loading || (state.coverageRows && state.coverageRows.length > 0));
    if (summaryEl) summaryEl.classList.toggle("d-none", loading || !state.coverageRows || state.coverageRows.length === 0);
  }

  function renderCoverageSummary_(rows) {
    const el = document.getElementById("invoice-cov-summary");
    if (!el) return;
    if (!rows || rows.length === 0) {
      el.classList.add("d-none");
      return;
    }
    const totalClientes = rows.length;
    const pendientes = rows.filter((r) => !r.facturado).length;
    const horas = rows.reduce((acc, r) => acc + (Number(r.horas) || 0), 0);
    if (Dom) {
      Dom.clear(el);
      const cards = [
        { label: "Clientes", value: totalClientes, valueClass: "" },
        { label: "Pendientes", value: pendientes, valueClass: "text-danger" },
        { label: "Facturados", value: totalClientes - pendientes, valueClass: "text-success" },
        { label: "Horas", value: (Number(horas) || 0).toFixed(2).replace(/\.00$/, ""), valueClass: "" }
      ];
      cards.forEach((card) => {
        const col = Dom.el("div", { className: "col-md-3" }, [
          Dom.el("div", { className: "card border-0 bg-light" }, [
            Dom.el("div", { className: "card-body py-2" }, [
              Dom.el("div", { className: "text-muted small fw-bold", text: card.label }),
              Dom.el("div", { className: `fw-bold ${card.valueClass}`.trim(), text: card.value })
            ])
          ])
        ]);
        el.appendChild(col);
      });
    } else {
      el.innerHTML = `
        <div class="col-md-3">
          <div class="card border-0 bg-light">
            <div class="card-body py-2">
              <div class="text-muted small fw-bold">Clientes</div>
              <div class="fw-bold">${totalClientes}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 bg-light">
            <div class="card-body py-2">
              <div class="text-muted small fw-bold">Pendientes</div>
              <div class="fw-bold text-danger">${pendientes}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 bg-light">
            <div class="card-body py-2">
              <div class="text-muted small fw-bold">Facturados</div>
              <div class="fw-bold text-success">${totalClientes - pendientes}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 bg-light">
            <div class="card-body py-2">
              <div class="text-muted small fw-bold">Horas</div>
              <div class="fw-bold">${(Number(horas) || 0).toFixed(2).replace(/\.00$/, "")}</div>
            </div>
          </div>
        </div>
      `;
    }
    el.classList.remove("d-none");
  }

  function renderCoverageTable_(rows, period) {
    const tbody = document.getElementById("invoice-cov-tbody");
    const results = document.getElementById("invoice-cov-results");
    const empty = document.getElementById("invoice-cov-empty");
    if (!tbody || !results || !empty) return;

    if (Dom) {
      Dom.clear(tbody);
    } else {
      tbody.innerHTML = "";
    }
    if (!rows || rows.length === 0) {
      const progressEl = document.getElementById("invoice-gen-render-progress");
      if (progressEl) progressEl.remove();
      results.classList.add("d-none");
      empty.classList.remove("d-none");
      if (global.EmptyState) {
        global.EmptyState.render(empty, { variant: "empty", title: "Sin datos", message: "No hay datos de cobertura para el período." });
      }
      return;
    }

    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.appendChild(Dom.el("td", { className: "ps-3", text: r.cliente || "-" }));
      tr.appendChild(Dom.el("td", { className: "text-end fw-bold", text: String(r.horas || 0) }));
      tr.appendChild(Dom.el("td", { className: "text-end", text: String(r.dias || 0) }));

      const badgeTd = Dom.el("td", { className: "text-center" });
      const badge = buildBadge_(r.facturado ? "Sí" : "No", {
        className: r.facturado
          ? "badge bg-success-subtle text-success border"
          : "badge bg-danger-subtle text-danger border"
      });
      badgeTd.appendChild(badge);
      tr.appendChild(badgeTd);

      const facturaTd = Dom.el("td");
      if (r.facturado) {
        const label = r.facturaNumero || ("#" + (r.facturaId || ""));
        facturaTd.appendChild(buildBadge_(label, { className: "badge bg-light text-dark border" }));
      } else {
        facturaTd.appendChild(Dom.el("span", { className: "text-muted", text: "—" }));
      }
      tr.appendChild(facturaTd);

      const totalLabel = r.facturado ? Formatters.formatCurrency(r.facturaTotal || 0) : "—";
      tr.appendChild(Dom.el("td", { className: "text-end fw-bold", text: totalLabel }));

      const actionsTd = Dom.el("td", { className: "text-center" });
      if (r.facturado) {
        const editBtn = Dom.el("button", {
          className: "btn btn-sm btn-outline-primary lt-btn-icon me-1",
          title: "Abrir factura",
          onClick: () => {
            if (global.InvoicePanelHandlers) {
              global.InvoicePanelHandlers.editInvoice(r.facturaId);
            }
          }
        }, Dom.el("i", { className: "bi bi-pencil-fill" }));
        const pdfBtn = Dom.el("button", {
          className: "btn btn-sm btn-outline-danger lt-btn-icon",
          title: "PDF",
          onClick: () => {
            if (global.InvoicePanelHandlers) {
              global.InvoicePanelHandlers.downloadPdf(r.facturaId);
            }
          }
        }, Dom.el("i", { className: "bi bi-file-earmark-pdf-fill" }));
        actionsTd.appendChild(editBtn);
        actionsTd.appendChild(pdfBtn);
      } else {
        const generateBtn = Dom.el("button", {
          className: "btn btn-sm btn-primary invoice-cov-generate",
          dataset: {
            idCliente: String(r.idCliente || ""),
            cliente: String(r.cliente || ""),
            period: String(period || "")
          }
        }, [
          Dom.el("i", { className: "bi bi-lightning-charge-fill me-1" }),
          Dom.text("Generar")
        ]);
        actionsTd.appendChild(generateBtn);
      }
      tr.appendChild(actionsTd);

      tbody.appendChild(tr);
    });

    results.classList.remove("d-none");
    empty.classList.add("d-none");
  }

  function renderSummary() {
    const summaryDiv = document.getElementById("invoice-summary");
    if (!summaryDiv) return;
    summaryDiv.classList.add("d-none");
  }

  function renderGeneratorResults(rows) {
    const tbody = document.getElementById("invoice-gen-tbody");
    const results = document.getElementById("invoice-gen-results");
    const empty = document.getElementById("invoice-gen-empty");

    if (!tbody || !results || !empty) return;

    if (Dom) {
      Dom.clear(tbody);
    } else {
      tbody.innerHTML = "";
    }

    if (!rows || rows.length === 0) {
      results.classList.add("d-none");
      empty.classList.remove("d-none");
      if (global.EmptyState) {
        global.EmptyState.render(empty, { variant: "empty", title: "Sin registros", message: "No hay registros de asistencia en el rango indicado." });
      }
      return;
    }

    const totalPages = Math.max(1, Math.ceil(rows.length / state.PAGE_SIZE));
    if (state.generatorPage > totalPages) state.generatorPage = totalPages;
    const start = (state.generatorPage - 1) * state.PAGE_SIZE;
    const pageItems = rows.slice(start, start + state.PAGE_SIZE);

    const ui = global.UIHelpers;
    const progressId = "invoice-gen-render-progress";
    let progressEl = document.getElementById(progressId);
    if (!progressEl) {
      progressEl = Dom.el("div", { id: progressId, className: "small text-muted py-2" });
      results.insertBefore(progressEl, results.firstChild);
    }
    progressEl.textContent = "Renderizando...";
    progressEl.classList.remove("d-none");

    const renderRow = (item) => {
      const tr = document.createElement("tr");
      tr.appendChild(Dom.el("td", { className: "ps-3", text: item.fecha || "-" }));
      tr.appendChild(Dom.el("td", { text: item.empleado || "-" }));
      tr.appendChild(Dom.el("td", { text: String(item.horas != null ? item.horas : 0) }));
      tr.appendChild(Dom.el("td", { text: item.observaciones || "" }));

      const actionsTd = Dom.el("td", { className: "text-center" });
      const editBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-primary lt-btn-icon me-1",
        title: "Editar",
        onClick: () => {
          if (global.InvoicePanelHandlers) {
            global.InvoicePanelHandlers.editAttendance(item.id);
          }
        }
      }, Dom.el("i", { className: "bi bi-pencil-fill" }));
      const deleteBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-danger lt-btn-icon",
        title: "Eliminar",
        onClick: () => {
          if (global.InvoicePanelHandlers) {
            global.InvoicePanelHandlers.deleteAttendance(item.id);
          }
        }
      }, Dom.el("i", { className: "bi bi-trash" }));
      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(deleteBtn);
      tr.appendChild(actionsTd);
      return tr;
    };

    const finish = () => {
      if (progressEl) progressEl.remove();
    };

    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, pageItems, renderRow, {
        chunkSize: 150,
        onProgress: (done, total) => {
          if (progressEl) {
            progressEl.textContent = `Renderizando ${done} de ${total} registros...`;
          }
        },
        onDone: finish
      });
    } else {
      pageItems.forEach((item) => {
        const tr = renderRow(item);
        if (tr) tbody.appendChild(tr);
      });
      finish();
    }

    results.classList.remove("d-none");
    empty.classList.add("d-none");
    updateSelectionUi();
    renderGeneratorPagination(totalPages);
  }

  function renderTable(invoices) {
    const tbody = document.getElementById("invoice-tbody");
    const results = document.getElementById("invoice-results");
    const empty = document.getElementById("invoice-empty");

    if (!tbody || !results || !empty) return;

    if (Dom) {
      Dom.clear(tbody);
    } else {
      tbody.innerHTML = "";
    }

    if (!invoices || invoices.length === 0) {
      const progressEl = document.getElementById("invoice-render-progress");
      if (progressEl) progressEl.remove();
      results.classList.add("d-none");
      empty.classList.remove("d-none");
      if (global.EmptyState) {
        global.EmptyState.render(empty, {
          variant: "empty",
          title: "Sin facturas",
          message: "No hay facturas para mostrar. Usá los filtros o creá una nueva factura."
        });
      }
      renderInvoicePagination(0);
      return;
    }

    const totalPages = Math.max(1, Math.ceil(invoices.length / state.PAGE_SIZE));
    if (state.invoicePage > totalPages) state.invoicePage = totalPages;
    const start = (state.invoicePage - 1) * state.PAGE_SIZE;
    const pageItems = invoices.slice(start, start + state.PAGE_SIZE);

    const ui = global.UIHelpers;
    const progressId = "invoice-render-progress";
    let progressEl = document.getElementById(progressId);
    if (!progressEl) {
      progressEl = Dom.el("div", { id: progressId, className: "small text-muted py-2" });
      results.insertBefore(progressEl, results.firstChild);
    }
    progressEl.textContent = "Renderizando...";
    progressEl.classList.remove("d-none");

    const renderRow = (inv) => {
      const periodLabel = (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.formatPeriodLabel === "function")
        ? DomainHelpers.formatPeriodLabel(inv["PERIODO"])
        : (inv["PERIODO"] || "");
      const tr = document.createElement("tr");
      const estado = inv["ESTADO"] || "Pendiente";
      const idStr = inv.ID != null ? String(inv.ID) : "";
      const fecha = inv["FECHA"] || "-";
      const periodo = periodLabel || "-";
      const numero = inv["NUMERO"] || "S/N";
      const razon = inv["RAZÓN SOCIAL"] || "-";
      const total = Formatters.formatCurrency(inv["TOTAL"]);

      const selectTd = Dom.el("td", { className: "ps-3" });
      const checkbox = Dom.el("input", {
        type: "checkbox",
        className: "invoice-select",
        dataset: { id: idStr }
      });
      checkbox.checked = state.selectedInvoiceIds.has(String(inv.ID));
      checkbox.addEventListener("change", () => {
        if (global.InvoicePanelHandlers) {
          global.InvoicePanelHandlers.toggleInvoiceSelection(idStr, checkbox.checked);
        }
      });
      selectTd.appendChild(checkbox);
      tr.appendChild(selectTd);

      tr.appendChild(Dom.el("td", { className: "ps-3", text: fecha }));
      tr.appendChild(Dom.el("td", { text: periodo }));

      const numeroBadge = buildBadge_(numero, { className: "badge bg-light text-dark border" });
      tr.appendChild(Dom.el("td", null, numeroBadge));

      tr.appendChild(Dom.el("td", { text: razon }));
      tr.appendChild(Dom.el("td", { className: "text-end fw-bold", text: total }));

      const estadoTd = Dom.el("td", { className: "text-center" });
      estadoTd.appendChild(buildEstadoBadge_(estado));
      tr.appendChild(estadoTd);

      const actionsTd = Dom.el("td", { className: "text-center" });
      const editBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-primary lt-btn-icon me-1",
        title: "Editar",
        onClick: () => {
          if (global.InvoicePanelHandlers) {
            global.InvoicePanelHandlers.editInvoice(idStr);
          }
        }
      }, Dom.el("i", { className: "bi bi-pencil-fill" }));
      const deleteBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-danger lt-btn-icon",
        title: "Anular",
        onClick: () => {
          if (global.InvoicePanelHandlers) {
            global.InvoicePanelHandlers.deleteInvoice(idStr);
          }
        }
      }, Dom.el("i", { className: "bi bi-x-circle-fill" }));
      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(deleteBtn);
      tr.appendChild(actionsTd);

      return tr;
    };

    const finish = () => {
      if (progressEl) progressEl.remove();
    };

    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, pageItems, renderRow, {
        chunkSize: 150,
        onProgress: (done, total) => {
          if (progressEl) {
            progressEl.textContent = `Renderizando ${done} de ${total} facturas...`;
          }
        },
        onDone: finish
      });
    } else {
      pageItems.forEach((inv) => {
        const tr = renderRow(inv);
        if (tr) tbody.appendChild(tr);
      });
      finish();
    }

    results.classList.remove("d-none");
    empty.classList.add("d-none");
    renderInvoicePagination(totalPages);
  }

  function buildEstadoBadge_(estado) {
    const normalized = String(estado || "").trim();
    const map = {
      Pendiente: { className: "badge bg-warning", label: "Pendiente" },
      Pagada: { className: "badge bg-success", label: "Pagada" },
      Anulada: { className: "badge bg-danger", label: "Anulada" },
      Vencida: { className: "badge bg-dark", label: "Vencida" }
    };
    const entry = map[normalized] || { className: "badge bg-secondary", label: normalized || "Estado" };
    return buildBadge_(entry.label, { className: entry.className });
  }

  function renderInvoicePagination(totalPages) {
    const container = document.getElementById("invoice-pagination");
    if (!container) return;
    container.innerHTML = "";
    if (totalPages <= 1) return;

    const info = document.createElement("div");
    info.className = "small text-muted";
    info.textContent = `Página ${state.invoicePage} de ${totalPages}`;

    const controls = document.createElement("div");
    controls.className = "btn-group btn-group-sm";

    const prev = document.createElement("button");
    prev.className = "btn btn-outline-secondary";
    prev.textContent = "‹";
    prev.disabled = state.invoicePage <= 1;
    prev.onclick = () => {
      if (global.InvoicePanelHandlers) {
        global.InvoicePanelHandlers.setInvoicePage(state.invoicePage - 1);
      }
    };

    const next = document.createElement("button");
    next.className = "btn btn-outline-secondary";
    next.textContent = "›";
    next.disabled = state.invoicePage >= totalPages;
    next.onclick = () => {
      if (global.InvoicePanelHandlers) {
        global.InvoicePanelHandlers.setInvoicePage(state.invoicePage + 1);
      }
    };

    controls.appendChild(prev);
    controls.appendChild(next);

    container.appendChild(info);
    container.appendChild(controls);
  }

  function renderGeneratorPagination(totalPages) {
    const container = document.getElementById("invoice-gen-pagination");
    if (!container) return;
    container.innerHTML = "";
    if (totalPages <= 1) return;

    const info = document.createElement("div");
    info.className = "small text-muted";
    info.textContent = `Página ${state.generatorPage} de ${totalPages}`;

    const controls = document.createElement("div");
    controls.className = "btn-group btn-group-sm";

    const prev = document.createElement("button");
    prev.className = "btn btn-outline-secondary";
    prev.textContent = "‹";
    prev.disabled = state.generatorPage <= 1;
    prev.onclick = () => {
      if (global.InvoicePanelHandlers) {
        global.InvoicePanelHandlers.setGeneratorPage(state.generatorPage - 1);
      }
    };

    const next = document.createElement("button");
    next.className = "btn btn-outline-secondary";
    next.textContent = "›";
    next.disabled = state.generatorPage >= totalPages;
    next.onclick = () => {
      if (global.InvoicePanelHandlers) {
        global.InvoicePanelHandlers.setGeneratorPage(state.generatorPage + 1);
      }
    };

    controls.appendChild(prev);
    controls.appendChild(next);

    container.appendChild(info);
    container.appendChild(controls);
  }

  function updateSelectionUi() {
    const dlLastBtn = document.getElementById("invoice-download-last-btn");
    if (dlLastBtn) {
      dlLastBtn.disabled = !state.lastSavedInvoiceId;
    }
    const dlSelected = document.getElementById("invoice-download-selected");
    if (dlSelected) {
      dlSelected.disabled = state.selectedInvoiceIds.size === 0;
    }
    const selectAll = document.getElementById("invoice-select-all");
    if (selectAll) {
      const checkboxes = document.querySelectorAll(".invoice-select");
      const total = checkboxes.length;
      const selected = state.selectedInvoiceIds.size;
      selectAll.checked = total > 0 && selected === total;
      selectAll.indeterminate = selected > 0 && selected < total;
    }
  }

  function toggleLoading(show) {
    const loading = document.getElementById("invoice-loading");
    const results = document.getElementById("invoice-results");
    const empty = document.getElementById("invoice-empty");

    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && global.EmptyState) {
        global.EmptyState.render(loading, { variant: "loading", message: "Cargando..." });
      }
    }
    if (show) {
      if (results) results.classList.add("d-none");
      if (empty) empty.classList.add("d-none");
    }
  }

  function toggleGeneratorLoading(show) {
    const loading = document.getElementById("invoice-gen-loading");
    const results = document.getElementById("invoice-gen-results");
    const empty = document.getElementById("invoice-gen-empty");
    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && global.EmptyState) {
        global.EmptyState.render(loading, { variant: "loading", message: "Buscando asistencia del cliente..." });
      }
    }
    if (show) {
      if (results) results.classList.add("d-none");
      if (empty) empty.classList.add("d-none");
    }
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function populateClientLists(clients) {
    const filterList = document.getElementById("invoice-client-list");
    const modalList = document.getElementById("invoice-modal-client-list");
    const generatorList = document.getElementById("invoice-gen-client-list");

    state.clientIdMap.clear();
    const ui = global.UIHelpers;
    const renderList = (list, labels) => {
      if (!list) return;
      if (ui && typeof ui.renderDatalist === "function") {
        ui.renderDatalist(list, labels || []);
        return;
      }
      list.innerHTML = "";
      (labels || []).forEach((label) => {
        const opt = document.createElement("option");
        opt.value = label;
        list.appendChild(opt);
      });
    };

    const labels = (clients || [])
      .map((cli) => {
        const label = state.formatClientLabel(cli);
        if (label && cli && cli.id) {
          state.clientIdMap.set(label, cli.id);
        }
        return label;
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es"));

    [filterList, modalList, generatorList].forEach((list) => {
      renderList(list, labels);
    });
  }

  function render() {
    const container = document.getElementById(state.containerId);
    if (!container) return;

    if (!InvoiceTemplates || typeof InvoiceTemplates.buildMainPanel !== "function") {
      console.error("InvoiceTemplates no disponible");
      return;
    }
    // safe static: layout fijo sin datos externos.
    container.innerHTML = InvoiceTemplates.buildMainPanel({});

    renderInitialStates_();
    renderSelectOptions_();

    if (global.InvoicePanelHandlers) {
      global.InvoicePanelHandlers.attachEvents();
    }
    if (global.InvoicePanelData) {
      global.InvoicePanelData.loadClients();
      global.InvoicePanelData.loadIvaConfig();
    }
    initCoveragePeriod_();
  }

  global.InvoicePanelRender = {
    render: render,
    ensureSelectOption: ensureSelectOption_,
    initCoveragePeriod: initCoveragePeriod_,
    setCoverageLoading: setCoverageLoading_,
    renderCoverageSummary: renderCoverageSummary_,
    renderCoverageTable: renderCoverageTable_,
    renderSummary: renderSummary,
    renderGeneratorResults: renderGeneratorResults,
    renderTable: renderTable,
    renderInvoicePagination: renderInvoicePagination,
    renderGeneratorPagination: renderGeneratorPagination,
    updateSelectionUi: updateSelectionUi,
    toggleLoading: toggleLoading,
    toggleGeneratorLoading: toggleGeneratorLoading,
    setText: setText,
    populateClientLists: populateClientLists
  };
})(typeof window !== "undefined" ? window : this);
