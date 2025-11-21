(function (global) {
  function clearAlerts() {
    const c = document.getElementById("alert-container");
    if (c) c.innerHTML = "";
  }

  function showAlert(message, type = "info") {
    const container = document.getElementById("alert-container");
    if (!container) return;
    container.innerHTML = "";

    const div = document.createElement("div");
    div.className =
      "alert alert-" +
      type +
      " alert-dismissible fade show py-2 px-3 mb-2";
    div.setAttribute("role", "alert");

    div.innerHTML =
      '<div class="small">' +
      message +
      '</div><button type="button" class="btn-close btn-sm" data-bs-dismiss="alert" aria-label="Close"></button>';

    container.appendChild(div);
  }

  global.Alerts = {
    clearAlerts,
    showAlert
  };
})(typeof window !== "undefined" ? window : this);
