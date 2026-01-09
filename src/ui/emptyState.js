/**
 * EmptyState
 * Helper común para estados de loading / empty / error.
 */
(function (global) {
  const Dom = global.DomHelpers || null;
  const escapeHtml = (global.HtmlHelpers && typeof global.HtmlHelpers.escapeHtml === "function")
    ? global.HtmlHelpers.escapeHtml
    : function (val) {
      return String(val == null ? "" : val)
        .replace(/&/g, "&amp;")
        .replace(/[<]/g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

  function clearContainer(container) {
    if (!container) return;
    if (Dom && typeof Dom.clear === "function") {
      Dom.clear(container);
      return;
    }
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  function renderInline(container, message, variant) {
    if (!container) return;
    const text = message || "Sin datos para mostrar.";
    clearContainer(container);
    const className = variant === "error" ? "text-danger small" : "text-muted small";
    if (Dom) {
      container.appendChild(Dom.el("div", { className: className, text: text }));
    } else {
      const div = document.createElement("div");
      div.className = className;
      div.textContent = text;
      container.appendChild(div);
    }
  }

  function render(container, opts) {
    if (!container) return;
    const config = opts || {};
    const variant = config.variant || "empty";
    const title = config.title || (variant === "error" ? "Ocurrió un error" : "Sin datos");
    const message = config.message || "";

    clearContainer(container);
    if (variant === "error") {
      if (Dom) {
        const alert = Dom.el("div", { className: "alert alert-danger" }, [
          Dom.text(title),
          message ? Dom.text(": " + message) : null
        ]);
        container.appendChild(alert);
      } else {
        const alert = document.createElement("div");
        alert.className = "alert alert-danger";
        alert.textContent = title + (message ? ": " + message : "");
        container.appendChild(alert);
      }
      return;
    }
    if (variant === "loading") {
      if (Dom) {
        container.appendChild(
          Dom.el("div", { className: "lt-surface lt-surface--subtle p-3 text-center" }, [
            Dom.el("div", { className: "spinner-border spinner-border-sm text-primary", role: "status" }),
            Dom.el("div", { className: "text-muted small mt-2", text: message || "Cargando..." })
          ])
        );
      } else {
        const wrap = document.createElement("div");
        wrap.className = "lt-surface lt-surface--subtle p-3 text-center";
        const spinner = document.createElement("div");
        spinner.className = "spinner-border spinner-border-sm text-primary";
        spinner.setAttribute("role", "status");
        const msg = document.createElement("div");
        msg.className = "text-muted small mt-2";
        msg.textContent = message || "Cargando...";
        wrap.appendChild(spinner);
        wrap.appendChild(msg);
        container.appendChild(wrap);
      }
      return;
    }

    if (Dom) {
      const body = Dom.el("div", { className: "lt-surface lt-surface--subtle p-3 text-center" });
      body.appendChild(Dom.el("div", { className: "text-muted small fw-semibold", text: title }));
      if (message) {
        body.appendChild(Dom.el("div", { className: "text-muted small mt-1", text: message }));
      }
      container.appendChild(body);
    } else {
      const body = document.createElement("div");
      body.className = "lt-surface lt-surface--subtle p-3 text-center";
      const titleEl = document.createElement("div");
      titleEl.className = "text-muted small fw-semibold";
      titleEl.textContent = title;
      body.appendChild(titleEl);
      if (message) {
        const msgEl = document.createElement("div");
        msgEl.className = "text-muted small mt-1";
        msgEl.textContent = message;
        body.appendChild(msgEl);
      }
      container.appendChild(body);
    }
  }

  global.EmptyState = {
    render,
    renderInline
  };
})(typeof window !== "undefined" ? window : this);
