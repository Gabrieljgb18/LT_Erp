/**
 * Weekly Plan Templates
 */
var WeeklyPlanTemplates = (function (global) {
    const Dom = global.DomHelpers;
    const UI = global.UIHelpers;

    function createIcon(className) {
        return Dom ? Dom.el("i", { className: className }) : null;
    }

    function buildListPanel() {
        const root = Dom ? Dom.el("div") : document.createElement("div");
        if (!Dom) {
            return { root: root, tbody: null };
        }

        const header = Dom.el("div", { className: "d-flex justify-content-between align-items-center mb-3" });
        header.appendChild(Dom.el("h5", { className: "mb-0", text: "Planes de Asistencia Semanal" }));

        const headerActions = Dom.el("div", { className: "d-flex gap-2 align-items-center" });
        const switchWrap = Dom.el("div", { className: "form-check form-switch mb-0" });
        const check = Dom.el("input", {
            className: "form-check-input",
            type: "checkbox",
            id: "check-active-plans"
        });
        check.checked = true;
        const checkLabel = Dom.el("label", {
            className: "form-check-label small",
            for: "check-active-plans",
            text: "Solo vigentes"
        });
        switchWrap.appendChild(check);
        switchWrap.appendChild(checkLabel);
        headerActions.appendChild(switchWrap);

        const newBtn = Dom.el("button", {
            className: "btn btn-primary btn-sm",
            id: "btn-nuevo-plan",
            type: "button"
        }, [
            createIcon("bi bi-plus-lg me-1"),
            Dom.text("Nuevo Plan")
        ]);
        headerActions.appendChild(newBtn);
        header.appendChild(headerActions);

        const card = Dom.el("div", { className: "card shadow-sm border-0" });
        const cardBody = Dom.el("div", { className: "card-body p-0" });
        const tableResponsive = Dom.el("div", { className: "table-responsive" });
        const table = Dom.el("table", { className: "table table-hover align-middle mb-0" });
        const thead = Dom.el("thead", { className: "table-light" });
        const headRow = Dom.el("tr");
        headRow.appendChild(Dom.el("th", { text: "Cliente" }));
        headRow.appendChild(Dom.el("th", { text: "Vigencia" }));
        headRow.appendChild(Dom.el("th", { className: "text-center", text: "Horas Semanales" }));
        headRow.appendChild(Dom.el("th", { text: "Días Programados" }));
        headRow.appendChild(Dom.el("th", { className: "text-end", text: "Acciones" }));
        thead.appendChild(headRow);

        const tbody = Dom.el("tbody");

        table.appendChild(thead);
        table.appendChild(tbody);
        tableResponsive.appendChild(table);
        cardBody.appendChild(tableResponsive);
        card.appendChild(cardBody);

        root.appendChild(header);
        root.appendChild(card);

        return { root: root, tbody: tbody };
    }

    function buildEditorWrapperStart(clienteLabel) {
        if (!Dom) return document.createElement("div");
        const wrapper = Dom.el("div", { className: "mt-2 p-3 lt-surface lt-surface--subtle" });
        const header = Dom.el("div", { className: "d-flex justify-content-between align-items-center mb-3" });
        const info = Dom.el("div");
        const title = Dom.el("div", { className: "fw-bold mb-1 text-primary" }, [
            createIcon("bi bi-calendar-week me-1"),
            Dom.text("Plan semanal del cliente")
        ]);
        const small = Dom.el("div", { className: "small mb-2" }, [
            Dom.text("Cliente: "),
            Dom.el("strong", { className: "text-primary-emphasis", text: clienteLabel || "" })
        ]);
        info.appendChild(title);
        info.appendChild(small);
        header.appendChild(info);
        wrapper.appendChild(header);
        return wrapper;
    }

    function buildEditorWrapperEnd() {
        return null;
    }

    function buildEditorTopSection(hoursBlock) {
        if (!Dom) return document.createElement("div");
        const top = Dom.el("div", { className: "d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2" });
        top.appendChild(hoursBlock || Dom.el("div"));
        const addBtn = Dom.el("button", {
            type: "button",
            className: "btn btn-sm btn-outline-secondary lt-btn-compact text-nowrap",
            "data-action": "add-plan-row"
        }, [
            createIcon("bi bi-plus-lg me-1"),
            Dom.text("Agregar día")
        ]);
        top.appendChild(addBtn);
        return top;
    }

    function buildEmployeeCardStart(data) {
        if (!Dom) return { card: document.createElement("div"), body: null };
        const opts = data || {};
        const card = Dom.el("div", {
            className: "card shadow-sm border-0",
            dataset: { empKey: opts.empKey || "" }
        });
        const header = Dom.el("div", {
            className: "card-header py-2 px-3 bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 lt-clickable",
            "data-bs-toggle": "collapse",
            "data-bs-target": "#" + opts.collapseId,
            "aria-expanded": String(!!opts.isOpen),
            "aria-controls": opts.collapseId,
            role: "button"
        });

        const left = Dom.el("div", { className: "d-flex flex-wrap gap-2 align-items-center" });
        const name = Dom.el("span", { className: "fw-semibold text-dark" }, [
            createIcon("bi bi-person-circle me-1"),
            Dom.text(opts.empleadoLabel || "")
        ]);
        left.appendChild(name);
        left.appendChild(Dom.el("span", { className: "badge bg-primary bg-opacity-75", text: opts.diasLabel || "" }));
        left.appendChild(Dom.el("span", { className: "badge text-bg-success", text: (opts.totalHoras || "") + " hs totales" }));

        const right = Dom.el("div", { className: "d-flex gap-2 align-items-center" });
        right.appendChild(Dom.el("span", { className: "text-muted small", text: (opts.activeDays || 0) + " día(s)" }));
        right.appendChild(Dom.el("span", {
            className: "text-muted fw-semibold",
            dataset: { role: "collapse-arrow" },
            text: opts.arrowLabel || ""
        }));

        header.appendChild(left);
        header.appendChild(right);
        card.appendChild(header);

        const collapse = Dom.el("div", {
            id: opts.collapseId,
            className: "collapse" + (opts.isOpen ? " show" : "")
        });
        const body = Dom.el("div", { className: "card-body pt-2 pb-3 px-3" });
        collapse.appendChild(body);
        card.appendChild(collapse);

        return { card: card, body: body };
    }

    function buildEmployeeCardEnd() {
        return null;
    }

    function buildPlanRowCard(data) {
        if (!Dom) return document.createElement("div");
        const opts = data || {};
        const card = Dom.el("div", { className: "lt-surface lt-surface--subtle p-3 mb-2" });

        const header = Dom.el("div", { className: "d-flex justify-content-between align-items-center mb-2" });
        const left = Dom.el("div", { className: "d-flex gap-2 align-items-center" });
        left.appendChild(Dom.el("span", { className: "badge bg-primary bg-opacity-75 text-white", text: "Plan" }));
        left.appendChild(Dom.el("span", { className: "fw-semibold", text: opts.diaLabel || "" }));
        if (opts.horasLabel) {
            left.appendChild(Dom.el("span", { className: "text-muted", text: opts.horasLabel }));
        }

        const deleteBtn = Dom.el("button", {
            type: "button",
            className: "btn btn-sm btn-outline-danger lt-btn-icon",
            "data-action": "delete-plan-row",
            "data-idx": opts.originalIdx
        }, [createIcon("bi bi-trash")]);

        header.appendChild(left);
        header.appendChild(deleteBtn);
        card.appendChild(header);

        const formRow = Dom.el("div", { className: "row g-2" });

        const colEmpleado = Dom.el("div", { className: "col-12 col-md-6" });
        colEmpleado.appendChild(Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Empleado" }));
        const empleadoSelect = Dom.el("select", {
            className: "form-select form-select-sm bg-white border",
            id: opts.rowId + "-empleado"
        });
        if (UI && typeof UI.renderSelect === "function") {
            UI.renderSelect(empleadoSelect, opts.empleadoOptions || [], opts.empleadoId || "", {
                includeEmpty: true,
                emptyLabel: "Seleccionar..."
            });
        }
        colEmpleado.appendChild(empleadoSelect);

        const colDia = Dom.el("div", { className: "col-6 col-md-3" });
        colDia.appendChild(Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Día" }));
        const diaSelect = Dom.el("select", {
            className: "form-select form-select-sm text-center bg-white border",
            id: opts.rowId + "-dia"
        });
        if (UI && typeof UI.renderSelect === "function") {
            UI.renderSelect(diaSelect, opts.diaOptions || [], opts.diaSemana || "", {
                includeEmpty: true,
                emptyLabel: "Día..."
            });
        }
        colDia.appendChild(diaSelect);

        const colHora = Dom.el("div", { className: "col-6 col-md-3" });
        colHora.appendChild(Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Hora entrada" }));
        colHora.appendChild(Dom.el("input", {
            type: "time",
            className: "form-control form-control-sm text-center",
            id: opts.rowId + "-horaEntrada",
            value: opts.horaEntrada || "",
            step: "1800"
        }));

        const colHoras = Dom.el("div", { className: "col-6 col-md-3" });
        colHoras.appendChild(Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Horas plan" }));
        colHoras.appendChild(Dom.el("input", {
            type: "number",
            step: "0.5",
            min: "0",
            className: "form-control form-control-sm text-end",
            id: opts.rowId + "-horasPlan",
            value: opts.horasPlan || ""
        }));

        const colObs = Dom.el("div", { className: "col-12 col-md-6" });
        colObs.appendChild(Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Observaciones" }));
        colObs.appendChild(Dom.el("input", {
            type: "text",
            className: "form-control form-control-sm",
            id: opts.rowId + "-obs",
            value: opts.observaciones || ""
        }));

        const hiddenId = Dom.el("input", {
            type: "hidden",
            id: opts.rowId + "-id",
            value: opts.recordId || ""
        });

        formRow.appendChild(colEmpleado);
        formRow.appendChild(colDia);
        formRow.appendChild(colHora);
        formRow.appendChild(colHoras);
        formRow.appendChild(colObs);
        formRow.appendChild(hiddenId);

        card.appendChild(formRow);
        return card;
    }

    function buildEditorFooter() {
        if (!Dom) return document.createElement("div");
        const footer = Dom.el("div", { className: "d-flex justify-content-end align-items-center gap-2 mt-3 pt-3 border-top" });
        const deleteBtn = Dom.el("button", {
            type: "button",
            className: "btn btn-sm btn-outline-danger lt-btn-compact",
            "data-action": "delete-weekly-plan",
            id: "btn-delete-weekly"
        }, [
            createIcon("bi bi-trash me-1"),
            Dom.text("Eliminar plan")
        ]);
        const btn = Dom.el("button", {
            type: "button",
            className: "btn btn-sm btn-success lt-btn-compact",
            "data-action": "save-weekly-plan",
            id: "btn-save-weekly"
        }, [
            createIcon("bi bi-save2 me-1"),
            Dom.text("Guardar plan del cliente")
        ]);
        footer.appendChild(deleteBtn);
        footer.appendChild(btn);
        return footer;
    }

    return {
        buildListPanel: buildListPanel,
        buildEditorWrapperStart: buildEditorWrapperStart,
        buildEditorWrapperEnd: buildEditorWrapperEnd,
        buildEditorTopSection: buildEditorTopSection,
        buildEmployeeCardStart: buildEmployeeCardStart,
        buildEmployeeCardEnd: buildEmployeeCardEnd,
        buildPlanRowCard: buildPlanRowCard,
        buildEditorFooter: buildEditorFooter
    };
})(typeof window !== "undefined" ? window : this);
