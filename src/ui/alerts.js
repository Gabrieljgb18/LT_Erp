(function (global) {
  const Dom = global.DomHelpers;

  function clearAlerts() {
    const c = document.getElementById("alert-container");
    if (c) Dom.clear(c);
  }

  function showAlert(message, type = "info") {
    const container = document.getElementById("alert-container");
    if (!container) return;
    Dom.clear(container);

    const div = Dom.el("div", {
      className:
        "alert alert-" +
        type +
        " alert-dismissible fade show py-2 px-3 mb-2",
      role: "alert"
    }, [
      Dom.el("div", { className: "small", text: message }),
      Dom.el("button", {
        type: "button",
        className: "btn-close btn-sm",
        "data-bs-dismiss": "alert",
        "aria-label": "Close"
      })
    ]);

    container.appendChild(div);
  }

  function formatError(err, fallback) {
    if (!err) return fallback || "Ocurrió un error.";
    if (typeof err === "string") return err;
    if (err && typeof err.message === "string" && err.message.trim()) {
      return err.message.trim();
    }
    return fallback || "Ocurrió un error.";
  }

  function showError(title, err, fallback) {
    const message = formatError(err, fallback);
    const prefix = title ? String(title).trim() : "";
    const full = prefix ? `${prefix}: ${message}` : message;
    console.error(prefix || "Error", err);
    showAlert(full, "danger");
    return message;
  }

  function notifyError(title, err, options) {
    const opts = options || {};
    const prefix = title ? String(title).trim() : "Ocurrió un error";
    const message = formatError(err, opts.fallback);

    if (opts.silent) {
      console.error(prefix, err);
    } else {
      showError(prefix, err, opts.fallback);
    }

    if (opts.container && global.EmptyState && typeof global.EmptyState.render === "function") {
      global.EmptyState.render(opts.container, {
        variant: "error",
        title: prefix,
        message: message
      });
    }
    if (opts.inline && opts.container && global.EmptyState && typeof global.EmptyState.renderInline === "function") {
      global.EmptyState.renderInline(opts.container, message, "error");
    }
    return message;
  }

  global.Alerts = {
    clearAlerts,
    showAlert,
    formatError,
    showError,
    notifyError
  };
})(typeof window !== "undefined" ? window : this);
