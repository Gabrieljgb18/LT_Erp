(function (global) {
  function bindBooleanToggle(input, labelEl, trueLabel, falseLabel) {
    if (!input || !labelEl) return;
    const onChange = function () {
      labelEl.textContent = input.checked ? trueLabel : falseLabel;
    };
    input.addEventListener("change", onChange);
  }

  global.FormRendererHandlers = {
    bindBooleanToggle: bindBooleanToggle
  };
})(typeof window !== "undefined" ? window : this);
