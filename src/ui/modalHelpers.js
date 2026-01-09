/**
 * ModalHelpers
 * Helper para crear modales Bootstrap de forma segura.
 */
(function (global) {
  const Dom = global.DomHelpers;

  function normalizeClass(value) {
    const clean = String(value || "").trim();
    return clean ? " " + clean : "";
  }

  function buildTitleNode(title) {
    if (title == null) {
      return Dom.el("h5", { className: "modal-title", text: "" });
    }
    if (typeof title === "string" || typeof title === "number") {
      return Dom.el("h5", { className: "modal-title", text: String(title) });
    }
    return Dom.el("h5", { className: "modal-title" }, title);
  }

  function create(id, title, body, footer, options = {}) {
    if (!global.document || !global.document.body || !global.bootstrap || !global.bootstrap.Modal) {
      return null;
    }

    const existing = global.document.getElementById(id);
    if (existing) existing.remove();

    const dialogClasses = [
      "modal-dialog",
      options.centered ? "modal-dialog-centered" : "",
      options.scrollable ? "modal-dialog-scrollable" : "",
      options.size ? `modal-${options.size}` : ""
    ].filter(Boolean).join(" ");

    const modalEl = Dom.el("div", {
      className: "modal fade",
      id: id,
      tabindex: "-1",
      "aria-hidden": "true"
    }, [
      Dom.el("div", { className: dialogClasses }, [
        Dom.el("div", { className: "modal-content" + normalizeClass(options.contentClass) }, [
          Dom.el("div", { className: "modal-header" + normalizeClass(options.headerClass) }, [
            buildTitleNode(title),
            options.hideClose
              ? null
              : Dom.el("button", {
                type: "button",
                className: "btn-close" + normalizeClass(options.closeClass),
                "data-bs-dismiss": "modal",
                "aria-label": "Cerrar"
              })
          ]),
          Dom.el("div", { className: "modal-body" + normalizeClass(options.bodyClass) }, body),
          footer
            ? Dom.el("div", { className: "modal-footer" + normalizeClass(options.footerClass) }, footer)
            : null
        ])
      ])
    ]);

    global.document.body.appendChild(modalEl);
    modalEl.addEventListener("hidden.bs.modal", () => {
      const instance = global.bootstrap && global.bootstrap.Modal
        ? global.bootstrap.Modal.getInstance(modalEl)
        : null;
      if (instance && typeof instance.dispose === "function") {
        instance.dispose();
      }
      if (typeof options.onHidden === "function") {
        options.onHidden();
      }
      modalEl.remove();
    });

    return modalEl;
  }

  global.ModalHelpers = {
    create
  };
})(typeof window !== "undefined" ? window : this);
