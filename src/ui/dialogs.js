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

  function promptDialog(options = {}) {
    const title = options.title || "Ingresar dato";
    const message = options.message || "Por favor, ingresá el valor:";
    const confirmText = options.confirmText || "Aceptar";
    const cancelText = options.cancelText || "Cancelar";
    const placeholder = options.placeholder || "";
    const defaultValue = options.defaultValue || "";
    const inputType = options.inputType || "text";
    const onAction = typeof options.onAction === "function" ? options.onAction : null;

    if (!global.document || !global.document.body || !global.bootstrap || !global.bootstrap.Modal) {
      const val = global.prompt(`${title}\n\n${message}`, defaultValue);
      return Promise.resolve(val);
    }

    const modalId = "lt-erp-prompt-" + Date.now();
    const inputId = modalId + "-input";

    const modalEl = Dom.el("div", { className: "modal fade", id: modalId, tabindex: "-1", "data-bs-backdrop": "static" }, [
      Dom.el("div", { className: "modal-dialog modal-dialog-centered modal-sm" }, [
        Dom.el("div", { className: "modal-content border-0 shadow" }, [
          Dom.el("div", { className: "modal-header py-2" }, [
            Dom.el("h6", { className: "modal-title fw-bold", text: title }),
            Dom.el("button", { type: "button", className: "btn-close", "data-bs-dismiss": "modal", id: modalId + "-close" })
          ]),
          Dom.el("div", { className: "modal-body", id: modalId + "-body" }, [
            Dom.el("label", { className: "form-label small text-muted fw-bold", text: message }),
            Dom.el("input", {
              type: inputType,
              id: inputId,
              className: "form-control",
              placeholder: placeholder,
              value: defaultValue
            })
          ]),
          Dom.el("div", { className: "modal-footer py-2", id: modalId + "-footer" }, [
            Dom.el("button", { type: "button", className: "btn btn-sm btn-link text-muted mx-auto", "data-bs-dismiss": "modal" }, cancelText),
            Dom.el("button", { type: "button", className: "btn btn-sm btn-primary px-4", "data-lt-confirm": "1" }, confirmText)
          ])
        ])
      ])
    ]);

    document.body.appendChild(modalEl);

    return new Promise((resolve) => {
      let resolvedValue = null;
      const modal = new global.bootstrap.Modal(modalEl);
      const input = modalEl.querySelector("input");
      const confirmBtn = modalEl.querySelector('[data-lt-confirm="1"]');
      const body = document.getElementById(modalId + "-body");
      const footer = document.getElementById(modalId + "-footer");
      const closeBtn = document.getElementById(modalId + "-close");

      modalEl.addEventListener("shown.bs.modal", () => {
        if (input) {
          input.focus();
          if (defaultValue) input.select();
        }
      });

      const onConfirm = async () => {
        const val = input ? input.value : "";
        if (onAction) {
          // Modo asíncrono: mostrar spiner y ejecutar
          try {
            if (input) input.disabled = true;
            if (confirmBtn) {
              confirmBtn.disabled = true;
              const ui = global.UIHelpers;
              if (ui && typeof ui.withSpinner === "function") {
                ui.withSpinner(confirmBtn, true, "...");
              } else {
                confirmBtn.textContent = "⌛";
              }
            }

            // Ejecutar la acción asíncrona
            const result = await onAction(val);

            // Si la acción devuelve un objeto con 'success' y 'render', mostramos eso
            if (result && result.success && typeof result.render === "function") {
              if (body) {
                Dom.clear(body);
                result.render(body);
              }
              if (footer) {
                footer.innerHTML = "";
                const doneBtn = Dom.el("button", {
                  className: "btn btn-sm btn-outline-secondary mx-auto",
                  text: "Cerrar",
                  onClick: () => modal.hide()
                });
                footer.appendChild(doneBtn);
              }
            } else {
              // Comportamiento por defecto tras éxito: cerrar
              resolvedValue = val;
              modal.hide();
            }
          } catch (err) {
            console.error("Error en prompt action:", err);
            if (input) input.disabled = false;
            if (confirmBtn) {
              const ui = global.UIHelpers;
              if (ui && typeof ui.withSpinner === "function") {
                ui.withSpinner(confirmBtn, false);
              }
              confirmBtn.textContent = confirmText;
              confirmBtn.disabled = false;
            }
            if (global.Alerts) global.Alerts.showAlert(err.message || "Error al procesar", "danger");
          }
        } else {
          // Modo síncrono: resolver y cerrar
          resolvedValue = val;
          modal.hide();
        }
      };

      if (input) {
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !input.disabled) onConfirm();
        });
      }

      confirmBtn.addEventListener("click", onConfirm);

      modalEl.addEventListener("hidden.bs.modal", () => {
        modal.dispose();
        modalEl.remove();
        resolve(resolvedValue);
      });

      modal.show();
    });
  }

  global.UiDialogs = {
    confirm: confirmDialog,
    prompt: promptDialog
  };
})(typeof window !== "undefined" ? window : this);
