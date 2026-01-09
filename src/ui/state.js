(function (global) {
  const Dom = global.DomHelpers;

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
      Dom.clear(c);
      c.appendChild(
        Dom.el("div", { className: "lt-surface lt-surface--subtle p-3" }, [
          Dom.el("div", { className: "d-flex align-items-center gap-2" }, [
            Dom.el("div", {
              className: "spinner-border spinner-border-sm text-primary",
              role: "status"
            }),
            Dom.el("div", { className: "flex-grow-1" }, [
              Dom.el("div", { className: "small fw-bold mb-0", text: title || "" }),
              Dom.el("div", { className: "small text-muted", text: message || "" })
            ])
          ])
        ])
      );
    },
    setGlobalLoading: function (isLoading, message) {
      const badge = document.getElementById("global-loading");
      const btn = document.getElementById("btn-grabar");
      toggleControls(isLoading);
      if (btn) btn.disabled = !!isLoading;
      if (!badge) return;
      if (isLoading) {
        badge.classList.remove("d-none");
        Dom.clear(badge);
        badge.appendChild(
          Dom.el("span", { className: "lt-chip lt-chip--muted" }, [
            Dom.el("span", {
              className: "spinner-border spinner-border-sm",
              role: "status",
              style: "width:12px;height:12px;"
            }),
            Dom.el("span", { text: message || "Procesando..." })
          ])
        );
      } else {
        badge.classList.add("d-none");
        Dom.clear(badge);
      }
    }
  };

  global.UiState = UiState;
})(typeof window !== "undefined" ? window : this);
