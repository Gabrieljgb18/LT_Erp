(function (global) {
  function toggleControls(disabled) {
    ["formato", "search-query", "btn-nuevo"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = !!disabled;
    });
  }

  const UiState = {
    renderLoading: function (componentId, title, message) {
      const c = document.getElementById(componentId);
      if (!c) return;
      c.innerHTML =
        '<div class="mt-2 p-2 border rounded bg-light">' +
        '<div class="small fw-bold mb-1">' +
        title +
        "</div>" +
        '<div class="small text-muted">' +
        message +
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
          '<div class="spinner-border spinner-border-sm me-2" role="status"></div>' +
          '<span class="small">' +
          (message || "Procesando...") +
          "</span>";
      } else {
        badge.classList.add("d-none");
        badge.innerHTML = "";
      }
    }
  };

  global.UiState = UiState;
})(typeof window !== "undefined" ? window : this);
