(function (global) {
  const escapeHtml = (global.HtmlHelpers && typeof global.HtmlHelpers.escapeHtml === "function")
    ? global.HtmlHelpers.escapeHtml
    : function (val) {
      return String(val == null ? "" : val)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

  function toggleControls(disabled) {
    // Don't disable search-query so users can keep typing during search
    ["btn-nuevo", "btn-refresh"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = !!disabled;
    });
  }

  const UiState = {
    renderLoading: function (componentId, title, message) {
      const c = document.getElementById(componentId);
      if (!c) return;
      c.innerHTML =
        '<div class="lt-surface lt-surface--subtle p-3">' +
        '<div class="d-flex align-items-center gap-2">' +
        '<div class="spinner-border spinner-border-sm text-primary" role="status"></div>' +
        '<div class="flex-grow-1">' +
        '<div class="small fw-bold mb-0">' +
        escapeHtml(title) +
        "</div>" +
        '<div class="small text-muted">' +
        escapeHtml(message) +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>";
    },
    setGlobalLoading: function (isLoading, message) {
      const badge = document.getElementById("global-loading");
      const btn = document.getElementById("btn-grabar");
      toggleControls(isLoading);
      if (btn) btn.disabled = !!isLoading;
      if (!badge) return;
      if (isLoading) {
        badge.classList.remove("d-none");
        badge.innerHTML =
          '<span class="lt-chip lt-chip--muted">' +
          '<span class="spinner-border spinner-border-sm" role="status" style="width:12px;height:12px;"></span>' +
          '<span>' +
          escapeHtml(message || "Procesando...") +
          "</span>" +
          "</span>";
      } else {
        badge.classList.add("d-none");
        badge.innerHTML = "";
      }
    }
  };

  global.UiState = UiState;
})(typeof window !== "undefined" ? window : this);
