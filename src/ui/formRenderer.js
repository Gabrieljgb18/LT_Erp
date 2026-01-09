(function (global) {
  const render = global.FormRendererRender;

  if (!render || typeof render.renderField !== "function") {
    global.FormRenderer = {
      renderField: function () { return document.createElement("div"); }
    };
    return;
  }

  global.FormRenderer = {
    renderField: render.renderField
  };
})(typeof window !== "undefined" ? window : this);
