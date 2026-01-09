(function (global) {
  const Dom = global.DomHelpers;

  function renderMultilineText(container, text) {
    const value = String(text || "");
    const lines = value.split(/\n/);
    lines.forEach((line, idx) => {
      container.appendChild(Dom.el("span", { text: line }));
      if (idx < lines.length - 1) {
        container.appendChild(document.createElement("br"));
      }
    });
  }

  function confirmDialog(options = {}) {
    const title = options.title || "Confirmar";
    const message = options.message || "¿Estás seguro?";
    const confirmText = options.confirmText || "Confirmar";
    const cancelText = options.cancelText || "Cancelar";
    const icon = options.icon || "bi-exclamation-triangle-fill";
    const iconClass = options.iconClass || "text-warning";
    const confirmVariant = options.confirmVariant || "danger";
    const modalSizeClass = options.size === "sm" ? "modal-sm" : options.size === "lg" ? "modal-lg" : "";

    if (!global.document || !global.document.body) {
      return Promise.resolve(global.confirm(`${title}\n\n${message}`));
    }

    if (!global.bootstrap || !global.bootstrap.Modal) {
      return Promise.resolve(global.confirm(`${title}\n\n${message}`));
    }

    const modalId = "lt-erp-confirm-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    const titleId = modalId + "-title";
    const bodyId = modalId + "-body";

    const headerTitle = Dom.el("h5", {
      className: "modal-title d-flex align-items-center gap-2",
      id: titleId
    }, [
      Dom.el("i", { className: "bi " + String(icon) + " " + String(iconClass) }),
      Dom.el("span", { text: title })
    ]);

    const bodyText = Dom.el("div", { className: "text-body-secondary", id: bodyId });
    renderMultilineText(bodyText, message);

    const modalEl = Dom.el("div", {
      className: "modal fade",
      id: modalId,
      tabindex: "-1",
      "aria-labelledby": titleId,
      "aria-describedby": bodyId
    }, [
      Dom.el("div", { className: "modal-dialog modal-dialog-centered " + modalSizeClass }, [
        Dom.el("div", { className: "modal-content border-0 shadow" }, [
          Dom.el("div", { className: "modal-header" }, [
            headerTitle,
            Dom.el("button", {
              type: "button",
              className: "btn-close",
              "data-bs-dismiss": "modal",
              "aria-label": "Cerrar"
            })
          ]),
          Dom.el("div", { className: "modal-body" }, bodyText),
          Dom.el("div", { className: "modal-footer" }, [
            Dom.el("button", {
              type: "button",
              className: "btn btn-outline-secondary",
              "data-bs-dismiss": "modal"
            }, cancelText),
            Dom.el("button", {
              type: "button",
              className: "btn btn-" + String(confirmVariant),
              "data-lt-confirm": "1"
            }, confirmText)
          ])
        ])
      ])
    ]);
    document.body.appendChild(modalEl);
    modalEl.style.zIndex = "2600";

    return new Promise((resolve) => {
      let result = false;
      const modal = new global.bootstrap.Modal(modalEl, { backdrop: true, keyboard: true, focus: true });
      const confirmBtn = modalEl.querySelector('[data-lt-confirm="1"]');

      function cleanup() {
        modalEl.removeEventListener("hidden.bs.modal", onHidden);
        modalEl.removeEventListener("shown.bs.modal", onShown);
        if (confirmBtn) confirmBtn.removeEventListener("click", onConfirm);
        modal.dispose();
        modalEl.remove();
      }

      function onConfirm() {
        result = true;
        modal.hide();
      }

      function onHidden() {
        cleanup();
        resolve(result);
      }

      function onShown() {
        const backdrops = document.querySelectorAll(".modal-backdrop");
        const lastBackdrop = backdrops && backdrops.length ? backdrops[backdrops.length - 1] : null;
        if (lastBackdrop) lastBackdrop.style.zIndex = "2590";
      }

      // Single-use modal: listeners adjuntos una sola vez y limpiados en hidden.
      if (confirmBtn) confirmBtn.addEventListener("click", onConfirm, { once: true });
      modalEl.addEventListener("hidden.bs.modal", onHidden, { once: true });
      modalEl.addEventListener("shown.bs.modal", onShown, { once: true });

      modal.show();
    });
  }

  global.UiDialogs = {
    confirm: confirmDialog
  };
})(typeof window !== "undefined" ? window : this);
