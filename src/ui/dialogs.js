(function (global) {
  function safeEscape(str) {
    if (global.HtmlHelpers && typeof global.HtmlHelpers.escapeHtml === "function") {
      return global.HtmlHelpers.escapeHtml(str);
    }
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeTextToHtml(text) {
    return safeEscape(text).replace(/\n/g, "<br>");
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

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${titleId}" aria-describedby="${bodyId}">
        <div class="modal-dialog modal-dialog-centered ${modalSizeClass}">
          <div class="modal-content border-0 shadow">
            <div class="modal-header">
              <h5 class="modal-title d-flex align-items-center gap-2" id="${titleId}">
                <i class="bi ${safeEscape(icon)} ${safeEscape(iconClass)}"></i>
                <span>${safeEscape(title)}</span>
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body" id="${bodyId}">
              <div class="text-body-secondary">${normalizeTextToHtml(message)}</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${safeEscape(cancelText)}</button>
              <button type="button" class="btn btn-${safeEscape(confirmVariant)}" data-lt-confirm="1">${safeEscape(confirmText)}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const modalEl = wrapper.firstElementChild;
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

      if (confirmBtn) confirmBtn.addEventListener("click", onConfirm);
      modalEl.addEventListener("hidden.bs.modal", onHidden);
      modalEl.addEventListener("shown.bs.modal", onShown);

      modal.show();
    });
  }

  global.UiDialogs = {
    confirm: confirmDialog
  };
})(typeof window !== "undefined" ? window : this);
