/**
 * AttendanceDailyHandlers
 * Eventos para asistencia diaria.
 */
(function (global) {
  const state = global.AttendanceDailyState;

  function bindBaseEvents(callbacks) {
    if (!state || !state.rootEl) return;
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;

    const dateInput = state.rootEl.querySelector("#attendance-date");
    const addBtn = state.rootEl.querySelector("#attendance-add-extra");
    const saveBtn = state.rootEl.querySelector("#attendance-save");

    if (dateInput) {
      dateInput.addEventListener("change", function () {
        if (callbacks && typeof callbacks.onDateChange === "function") {
          callbacks.onDateChange(this.value);
        }
      }, { signal });
    }

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        if (callbacks && typeof callbacks.onAddRow === "function") {
          callbacks.onAddRow();
        }
      }, { signal });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        if (callbacks && typeof callbacks.onSave === "function") {
          callbacks.onSave();
        }
      }, { signal });
    }
  }

  function bindRowEvents(callbacks) {
    if (!state || !state.rootEl) return;
    if (state.rowEventsController) {
      state.rowEventsController.abort();
    }
    state.rowEventsController = new AbortController();
    const signal = state.rowEventsController.signal;

    state.rootEl.addEventListener("change", function (e) {
      const target = e.target;
      if (!target || !target.dataset) return;
      const role = target.dataset.role;
      const uid = target.dataset.uid;
      if (!role || !uid) return;

      if (role === "cliente") {
        const opt = target.selectedOptions ? target.selectedOptions[0] : null;
        const id = target.value || "";
        const label = opt ? opt.textContent : "";
        if (callbacks && typeof callbacks.onUpdateRow === "function") {
          callbacks.onUpdateRow(uid, { cliente: label || "", idCliente: id });
        }
      } else if (role === "empleado") {
        const opt = target.selectedOptions ? target.selectedOptions[0] : null;
        const id = target.value || "";
        const label = opt ? opt.textContent : "";
        if (callbacks && typeof callbacks.onUpdateRow === "function") {
          callbacks.onUpdateRow(uid, { empleado: label || "", idEmpleado: id });
        }
      } else if (role === "asistencia-check") {
        if (callbacks && typeof callbacks.onUpdateRow === "function") {
          callbacks.onUpdateRow(uid, { asistencia: !!target.checked });
        }
      }
    }, { signal });

    state.rootEl.addEventListener("input", function (e) {
      const target = e.target;
      if (!target || !target.dataset) return;
      const role = target.dataset.role;
      const uid = target.dataset.uid;
      if (!role || !uid) return;

      if (role === "horas-reales") {
        if (callbacks && typeof callbacks.onUpdateRow === "function") {
          callbacks.onUpdateRow(uid, { horasReales: target.value });
        }
      } else if (role === "observaciones") {
        if (callbacks && typeof callbacks.onUpdateRow === "function") {
          callbacks.onUpdateRow(uid, { observaciones: target.value });
        }
      }
    }, { signal });

    state.rootEl.addEventListener("click", function (e) {
      const btn = e.target && e.target.closest ? e.target.closest('[data-role="remove-row"]') : null;
      if (!btn) return;
      const uid = btn.dataset ? btn.dataset.uid : "";
      if (!uid) return;
      if (callbacks && typeof callbacks.onRemoveRow === "function") {
        callbacks.onRemoveRow(uid);
      }
    }, { signal });
  }

  function bindSummaryEvents(onOpenDay) {
    const tbody = document.getElementById("grid-body");
    if (!tbody) return;
    if (state.summaryEventsController) {
      state.summaryEventsController.abort();
    }
    state.summaryEventsController = new AbortController();
    const signal = state.summaryEventsController.signal;

    tbody.addEventListener("click", function (e) {
      const btn = e.target && e.target.closest ? e.target.closest('[data-action="open-day"]') : null;
      if (!btn) return;
      if (typeof onOpenDay === "function") {
        onOpenDay(btn.dataset.fecha || "");
      }
    }, { signal });
  }

  function bindCollapseArrows() {
    if (!state || !state.rootEl) return;
    if (state.collapseEventsController) {
      state.collapseEventsController.abort();
    }
    state.collapseEventsController = new AbortController();
    const signal = state.collapseEventsController.signal;

    const collapses = state.rootEl.querySelectorAll(".att-collapse");
    collapses.forEach(function (col) {
      const targetId = col.id;
      const header = state.rootEl.querySelector(`[data-bs-target="#${targetId}"]`);
      if (!header) return;
      const arrowEl = header.querySelector('[data-role="collapse-arrow"]');
      if (!arrowEl) return;

      const updateArrow = function () {
        const isShown = col.classList.contains("show");
        arrowEl.textContent = isShown ? "▲" : "▼";
        header.setAttribute("aria-expanded", isShown ? "true" : "false");
      };

      col.addEventListener("shown.bs.collapse", updateArrow, { signal });
      col.addEventListener("hidden.bs.collapse", updateArrow, { signal });
      updateArrow();
    });
  }

  global.AttendanceDailyHandlers = {
    bindBaseEvents: bindBaseEvents,
    bindRowEvents: bindRowEvents,
    bindSummaryEvents: bindSummaryEvents,
    bindCollapseArrows: bindCollapseArrows
  };
})(typeof window !== "undefined" ? window : this);
