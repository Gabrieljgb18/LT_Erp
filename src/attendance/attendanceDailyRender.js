/**
 * AttendanceDailyRender
 * Render seguro para asistencia diaria.
 */
(function (global) {
  const state = global.AttendanceDailyState;
  const Dom = global.DomHelpers;

  function renderLayout(container, fecha) {
    if (!container) return;
    if (!global.AttendanceTemplates || typeof global.AttendanceTemplates.buildDailyAttendanceLayout !== "function") {
      console.error("AttendanceTemplates no disponible");
      return;
    }
    if (Dom && Dom.clear) {
      Dom.clear(container);
    } else {
      container.textContent = "";
    }
    // safe static: layout fijo sin datos externos.
    container.innerHTML = global.AttendanceTemplates.buildDailyAttendanceLayout();
    const dateInput = container.querySelector("#attendance-date");
    if (dateInput) dateInput.value = fecha || state.fecha || "";
  }

  function setLoading(isLoading) {
    if (!state || !state.rootEl) return;
    state.setLoading(isLoading);
    const overlay = state.rootEl.querySelector("#attendance-loading");
    if (!overlay) return;
    overlay.classList.toggle("d-none", !isLoading);
    if (isLoading) {
      if (global.EmptyState) {
        global.EmptyState.render(overlay, { variant: "loading", message: "Cargando asistencia del día..." });
      } else if (Dom) {
        Dom.clear(overlay);
        overlay.appendChild(Dom.el("div", { className: "text-center text-muted small", text: "Cargando asistencia del día..." }));
      }
      return;
    }
    if (Dom && Dom.clear) {
      Dom.clear(overlay);
    } else {
      overlay.textContent = "";
    }
  }

  function renderRows(emptyMessage) {
    const root = state.rootEl;
    if (!root || !Dom) return;

    const list = root.querySelector("#attendance-cards");
    if (!list) return;

    Dom.clear(list);

    if (!state.rows.length) {
      const message = emptyMessage || "No hay plan para la fecha seleccionada. Podés agregar asistencia fuera de plan.";
      if (global.EmptyState) {
        const normalized = String(message).toLowerCase();
        let variant = "empty";
        if (normalized.includes("cargando")) {
          variant = "loading";
        } else if (normalized.includes("no pudimos") || normalized.includes("error")) {
          variant = "error";
        }
        global.EmptyState.render(list, {
          variant: variant,
          title: variant === "error" ? "Error al cargar" : "Sin plan",
          message: message
        });
      } else {
        list.appendChild(Dom.el("div", {
          className: "text-center text-muted py-4",
          text: message
        }));
      }
      return;
    }

    const frag = document.createDocumentFragment();
    const isPastDay = isDatePast(state.fecha);

    state.rows.forEach(function (row) {
      const card = document.createElement("div");
      card.className = "card shadow-sm border-0";
      if (row.fueraDePlan) {
        card.classList.add("border", "border-secondary", "border-opacity-50");
      }

      const clienteSelect = buildClienteSelect(row.uid, row.cliente, !row.fueraDePlan, row.idCliente);
      const empleadoSelect = buildEmpleadoSelect(row.uid, row.empleado, !row.fueraDePlan, row.idEmpleado);
      const horasPlanText = formatHorasPlan(row.horasPlan);
      const horaPlanText = formatHoraPlan(row.horaPlan);
      const collapseId = "att-card-" + row.uid;
      const isOpen = row._autoOpen === true;
      const statusLabel = row.asistencia ? "Asistió" : "No asistió";
      const statusClass = row.asistencia ? "bg-success bg-opacity-75 text-white" : "bg-danger bg-opacity-75 text-white";
      const arrow = isOpen ? "▲" : "▼";

      let headerStyle = "";
      let cardStyle = "";
      if (isPastDay) {
        if (row.asistencia) {
          cardStyle = "background-color:#f7fff9;border-color:#b7e6c3;";
          headerStyle = "background-color:#f0fff3;";
        } else {
          cardStyle = "background-color:#fff6f6;border-color:#f2c8c8;";
          headerStyle = "background-color:#fff0f0;";
        }
      }

      if (cardStyle) {
        card.setAttribute("style", cardStyle);
      }

      const header = Dom.el("div", {
        className: "card-header py-2 px-3 bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 att-card-toggle",
        style: headerStyle || "",
        "data-bs-toggle": "collapse",
        "data-bs-target": "#" + collapseId,
        "aria-expanded": isOpen ? "true" : "false",
        "aria-controls": collapseId,
        role: "button"
      });

      const headerLeft = Dom.el("div", { className: "d-flex flex-wrap gap-2 align-items-center" }, [
        Dom.el("span", { className: "badge px-2 " + statusClass, text: statusLabel }),
        Dom.el("span", { className: "fw-semibold", text: row.empleado || "Empleado" }),
        Dom.el("span", { className: "text-muted", text: "•" }),
        Dom.el("span", { className: "fw-semibold text-primary", text: row.cliente || "Cliente" })
      ]);

      const headerRight = Dom.el("div", { className: "d-flex gap-2 align-items-center" }, [
        Dom.el("span", {
          className: row.fueraDePlan ? "badge bg-secondary" : "badge text-bg-success",
          text: row.fueraDePlan ? "Fuera de plan" : "Plan"
        }),
        Dom.el("span", {
          className: "text-muted fw-semibold",
          dataset: { role: "collapse-arrow" },
          "aria-hidden": "true",
          text: arrow
        })
      ]);

      header.appendChild(headerLeft);
      header.appendChild(headerRight);

      const body = Dom.el("div", { className: "card-body pt-2 pb-3 px-3" });

      const rowSelects = Dom.el("div", { className: "row g-3" }, [
        Dom.el("div", { className: "col-12 col-md-6" }, [
          Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Cliente" }),
          clienteSelect
        ]),
        Dom.el("div", { className: "col-12 col-md-6" }, [
          Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Empleado" }),
          empleadoSelect
        ])
      ]);

      const checkInput = Dom.el("input", {
        type: "checkbox",
        className: "form-check-input",
        dataset: { role: "asistencia-check", uid: row.uid }
      });
      if (row.asistencia) checkInput.checked = true;

      const horasInput = Dom.el("input", {
        type: "number",
        step: "0.5",
        min: "0",
        className: "form-control form-control-sm text-end",
        dataset: { role: "horas-reales", uid: row.uid },
        value: row.horasReales != null ? String(row.horasReales) : ""
      });

      const obsInput = Dom.el("textarea", {
        rows: "2",
        className: "form-control form-control-sm",
        dataset: { role: "observaciones", uid: row.uid }
      }, row.observaciones || "");

      const removeCell = row.fueraDePlan
        ? Dom.el("button", {
          className: "btn btn-sm btn-outline-danger",
          dataset: { role: "remove-row", uid: row.uid },
          title: "Quitar fila"
        }, "✕")
        : Dom.el("span", { className: "text-muted small d-inline-block mt-3", text: "\u00a0" });

      const rowInputs = Dom.el("div", { className: "row g-3 align-items-center mt-1" }, [
        Dom.el("div", { className: "col-12 col-md-3" }, [
          Dom.el("div", { className: "small text-muted fw-semibold", text: "Horas planificadas" }),
          Dom.el("div", { className: "fw-semibold", text: horasPlanText }),
          Dom.el("div", { className: "small text-muted", text: horaPlanText || "\u00a0" })
        ]),
        Dom.el("div", { className: "col-6 col-md-2 text-center" }, [
          Dom.el("label", { className: "small text-muted fw-semibold mb-1 d-block", text: "Asistió" }),
          checkInput
        ]),
        Dom.el("div", { className: "col-6 col-md-3" }, [
          Dom.el("label", { className: "small text-muted fw-semibold mb-1 d-block", text: "Horas reales" }),
          horasInput
        ]),
        Dom.el("div", { className: "col-12 col-md-3" }, [
          Dom.el("label", { className: "small text-muted fw-semibold mb-1 d-block", text: "Observaciones" }),
          obsInput
        ]),
        Dom.el("div", { className: "col-12 col-md-1 text-end" }, removeCell)
      ]);

      body.appendChild(rowSelects);
      body.appendChild(rowInputs);

      const collapse = Dom.el("div", {
        id: collapseId,
        className: "collapse att-collapse " + (isOpen ? "show" : "")
      }, body);

      card.appendChild(header);
      card.appendChild(collapse);

      frag.appendChild(card);
    });

    list.appendChild(frag);
  }

  function renderDailySummary() {
    const root = state.rootEl;
    if (!root || !Dom) return;

    const summaryEl = root.querySelector("#attendance-summary");
    if (!summaryEl) return;

    if (!state.rows.length) {
      Dom.clear(summaryEl);
      return;
    }

    const clientesAtendidos = new Set();
    let totalHoras = 0;
    let registros = state.rows.length;
    let presentes = 0;

    state.rows.forEach(r => {
      if (r.asistencia) {
        presentes += 1;
        if (r.cliente) clientesAtendidos.add(r.cliente);
        const horas = parseFloat(r.horasReales !== "" ? r.horasReales : r.horasPlan);
        if (!isNaN(horas)) totalHoras += horas;
      }
    });

    Dom.clear(summaryEl);
    const chips = [
      { className: 'lt-chip lt-chip--primary', label: 'Clientes', value: clientesAtendidos.size },
      { className: 'lt-chip lt-chip--success', label: 'Horas', value: totalHoras.toFixed(2) },
      { className: 'lt-chip lt-chip--muted', label: 'Asistencias', value: presentes + '/' + registros }
    ];
    chips.forEach(chip => {
      summaryEl.appendChild(Dom.el('span', { className: chip.className }, [
        Dom.el('span', { className: 'opacity-75', text: chip.label }),
        Dom.text(' '),
        Dom.el('strong', { text: String(chip.value) })
      ]));
    });
  }

  function renderSummary(records) {
    const headersRow = document.getElementById("grid-headers");
    const tbody = document.getElementById("grid-body");
    if (!headersRow || !tbody || !Dom) return;

    Dom.clear(headersRow);
    ['Fecha', 'Clientes atendidos', 'Horas totales', 'Asistencia (real / planificada)', 'Acciones']
      .forEach(function (label, idx) {
        const th = Dom.el('th', {
          className: idx === 0 ? '' : 'text-center',
          text: label
        });
        headersRow.appendChild(th);
      });

    Dom.clear(tbody);

    const summaryRows = buildSummaryRows(records);
    if (!summaryRows.length) {
      tbody.appendChild(Dom.el('tr', null, Dom.el('td', {
        colspan: '5',
        className: 'text-center text-muted py-5',
        text: 'No hay asistencias registradas.'
      })));
      return;
    }

    const renderRow = (item) => {
      const tr = Dom.el('tr', null, [
        Dom.el('td', null, Dom.el('strong', { text: item.fechaLabel })),
        Dom.el('td', { className: 'text-center', text: String(item.clientes) }),
        Dom.el('td', { className: 'text-center', text: item.horas.toFixed(2) }),
        Dom.el('td', { className: 'text-center', text: item.presentes + ' / ' + item.registros })
      ]);
      const btn = Dom.el('button', {
        className: 'btn btn-sm btn-primary',
        dataset: { action: 'open-day', fecha: item.fecha }
      }, 'Editar día');
      tr.appendChild(Dom.el('td', { className: 'text-center' }, btn));
      return tr;
    };

    const ui = global.UIHelpers;
    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, summaryRows, renderRow, { chunkSize: 120 });
    } else {
      const frag = document.createDocumentFragment();
      summaryRows.forEach(item => {
        frag.appendChild(renderRow(item));
      });
      tbody.appendChild(frag);
    }
  }

  function buildSummaryRows(records) {
    const map = new Map();
    (records || []).forEach(item => {
      const rec = item.record ? item.record : item;
      const fecha = rec.FECHA || rec.fecha;
      if (!fecha) return;
      const key = String(fecha).trim();
      if (!map.has(key)) {
        map.set(key, { registros: 0, clientes: new Set(), horas: 0, presentes: 0 });
      }
      const agg = map.get(key);
      agg.registros += 1;
      const asist = rec.ASISTENCIA !== undefined ? rec.ASISTENCIA : rec.asistencia;
      const horasRaw = rec.HORAS !== undefined ? rec.HORAS : rec.horas;
      const cliente = rec.CLIENTE || rec.cliente;

      if (asist === true || asist === "TRUE" || asist === "true" || asist === 1 || asist === "1") {
        if (cliente) agg.clientes.add(cliente);
        const horasNum = parseFloat(horasRaw);
        if (!isNaN(horasNum)) {
          agg.horas += horasNum;
        }
        agg.presentes += 1;
      }
    });

    const result = [];
    map.forEach((val, fecha) => {
      result.push({
        fecha: fecha,
        fechaLabel: formatDateLabel(fecha),
        registros: val.registros,
        clientes: val.clientes.size,
        horas: val.horas,
        presentes: val.presentes
      });
    });

    result.sort((a, b) => a.fecha > b.fecha ? -1 : 1);
    return result;
  }

  function formatDateLabel(fecha) {
    if (!fecha) return "";
    const parts = String(fecha).split("-");
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      const dt = new Date(y, m, d);
      if (!isNaN(dt)) {
        return dt.toLocaleDateString("es-AR");
      }
    }
    return fecha;
  }

  function isDatePast(fechaStr) {
    if (!fechaStr) return false;
    const p = fechaStr.split("-");
    if (p.length !== 3) return false;
    const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    if (isNaN(d)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }

  function formatHorasPlan(val) {
    if (val === undefined || val === null || val === "") return "-";
    const num = Number(val);
    if (!isNaN(num)) {
      return num.toFixed(1) + " hs";
    }
    return String(val);
  }

  function formatHoraPlan(val) {
    if (!val) return "";
    if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val)) {
      return "Ingreso " + val.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    }
    const numericVal = Number(val);
    if (Number.isFinite(numericVal)) {
      const fraction = numericVal >= 1 ? (numericVal % 1) : numericVal;
      if (fraction > 0) {
        const totalMinutes = Math.round(fraction * 24 * 60);
        const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
        const mm = String(totalMinutes % 60).padStart(2, "0");
        return "Ingreso " + hh + ":" + mm;
      }
    }
    const s = String(val);
    const m = s.match(/(\d{1,2}):(\d{2})/);
    if (m) {
      const hh = m[1].padStart(2, "0");
      const mm = m[2];
      return "Ingreso " + hh + ":" + mm;
    }
    return "";
  }

  function buildClienteSelect(uid, selected, disabled, selectedId) {
    if (!Dom) return document.createElement("select");
    const select = Dom.el("select", {
      className: "form-select form-select-sm bg-white border",
      dataset: { role: "cliente", uid: uid }
    });
    if (disabled) select.disabled = true;
    select.appendChild(Dom.el("option", { value: "", text: "Cliente..." }));

    let found = false;
    const selectedIdStr = selectedId != null && selectedId !== '' ? String(selectedId) : '';
    (state.reference.clientes || []).forEach(cli => {
      const label = (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.getClientDisplayName === 'function')
        ? DomainHelpers.getClientDisplayName(cli)
        : (cli && typeof cli === 'object'
          ? (cli.nombre || cli.razonSocial || cli.CLIENTE || cli)
          : cli);
      const id = cli && typeof cli === 'object' && cli.id != null ? String(cli.id) : '';
      if (!label) return;
      if (!id) return;
      const opt = Dom.el("option", { value: String(id), text: String(label) });
      if (selectedIdStr && id === selectedIdStr) {
        opt.selected = true;
        found = true;
      }
      select.appendChild(opt);
    });

    if (selected && !found) {
      const fallback = Dom.el("option", { value: "", text: selected + " (sin ID)" });
      fallback.selected = true;
      select.appendChild(fallback);
    }
    return select;
  }

  function buildEmpleadoSelect(uid, selected, disabled, selectedId) {
    if (!Dom) return document.createElement("select");
    const select = Dom.el("select", {
      className: "form-select form-select-sm bg-white border",
      dataset: { role: "empleado", uid: uid }
    });
    if (disabled) select.disabled = true;
    select.appendChild(Dom.el("option", { value: "", text: "Empleado..." }));

    let found = false;
    const selectedIdStr = selectedId != null && selectedId !== '' ? String(selectedId) : '';
    (state.reference.empleados || []).forEach(emp => {
      const label = typeof emp === 'string' ? emp : (emp.nombre || emp.empleado || emp.label || '');
      const id = emp && typeof emp === 'object' && emp.id != null ? String(emp.id) : '';
      if (!label) return;
      if (!id) return;
      const opt = Dom.el("option", { value: String(id), text: String(label) });
      if (selectedIdStr && id === selectedIdStr) {
        opt.selected = true;
        found = true;
      }
      select.appendChild(opt);
    });

    if (selected && !found) {
      const fallback = Dom.el("option", { value: "", text: selected + " (sin ID)" });
      fallback.selected = true;
      select.appendChild(fallback);
    }
    return select;
  }

  global.AttendanceDailyRender = {
    renderLayout: renderLayout,
    setLoading: setLoading,
    renderRows: renderRows,
    renderDailySummary: renderDailySummary,
    renderSummary: renderSummary
  };
})(typeof window !== "undefined" ? window : this);
