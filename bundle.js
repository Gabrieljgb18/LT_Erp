// Archivo generado. Editá los módulos en /src y corré `node generate_bundle_html.js`.
/**
 * HTML Helpers
 * Utilidades para generación de HTML y escape de strings
 */

(function (global) {
    const HtmlHelpers = (() => {

        /**
         * Escapa caracteres HTML para prevenir XSS
         * @param {string} str - String a escapar
         * @returns {string} String escapado
         */
        function escapeHtml(str) {
            return String(str || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }

        /**
         * Genera opciones HTML para select de empleados
         * @param {string} selected - Empleado seleccionado
         * @param {Array} empleados - Lista de empleados
         * @returns {string} HTML de opciones
         */
        function getEmpleadoOptionsHtml(selected, empleados = []) {
            const opts = ['<option value="">Seleccionar...</option>'];
            empleados.forEach(emp => {
                const sel = emp === selected ? " selected" : "";
                opts.push('<option value="' + escapeHtml(emp) + '"' + sel + ">" +
                    escapeHtml(emp) + "</option>");
            });
            return opts.join("");
        }

        /**
         * Genera opciones HTML para select de días de la semana
         * @param {string} selected - Día seleccionado
         * @returns {string} HTML de opciones
         */
        function getDiaOptionsHtml(selected) {
            const days = [
                "LUNES",
                "MARTES",
                "MIERCOLES",
                "JUEVES",
                "VIERNES",
                "SABADO",
                "DOMINGO",
            ];
            const opts = ['<option value="">Día...</option>'];
            days.forEach(d => {
                const sel = d === selected ? " selected" : "";
                opts.push('<option value="' + d + '"' + sel + ">" + d + "</option>");
            });
            return opts.join("");
        }

        /**
         * Formatea hora de entrada para input type="time"
         * @param {Date|string} horaEntrada - Hora a formatear
         * @returns {string} Hora en formato HH:MM
         */
        function formatHoraEntradaForInput(horaEntrada) {
            if (!horaEntrada) return "";

            // Si viene como Date desde Apps Script
            if (Object.prototype.toString.call(horaEntrada) === "[object Date]" && !isNaN(horaEntrada)) {
                const hh = String(horaEntrada.getHours()).padStart(2, "0");
                const mm = String(horaEntrada.getMinutes()).padStart(2, "0");
                return `${hh}:${mm}`;
            }

            // Si viene como string, tratamos de rescatar hh:mm
            const s = String(horaEntrada).trim();
            const match = s.match(/(\d{1,2}):(\d{2})/);
            if (match) {
                const hh = match[1].padStart(2, "0");
                const mm = match[2];
                return `${hh}:${mm}`;
            }

            return "";
        }

        return {
            escapeHtml,
            getEmpleadoOptionsHtml,
            getDiaOptionsHtml,
            formatHoraEntradaForInput
        };
    })();

    global.HtmlHelpers = HtmlHelpers;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  // Constantes y definiciones de campos para cada formato.
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  const FORM_DEFINITIONS = {
    CLIENTES: {
      title: "Registro de clientes",
      fields: [
        { id: "NOMBRE", label: "Nombre", type: "text", placeholder: "Nombre del cliente" },
        { id: "ESTADO", label: "Estado", type: "boolean", trueLabel: "Activo" },
        { id: "RAZON SOCIAL", label: "Razón social", type: "text" },
        { id: "CUIT", label: "CUIT", type: "text" },
        { id: "ENCARGADO", label: "Encargado", type: "text" },
        { id: "TELEFONO", label: "Teléfono", type: "phone" },
        { id: "DIRECCION", label: "Dirección", type: "text", full: true },
        { id: "CORREO ADMINISTRACION", label: "Correo administración", type: "email" },
        { id: "CORREO FACTURACION", label: "Correo facturación", type: "email" },
        { id: "FECHA CONTRATO", label: "Fecha contrato", type: "date" },
        { id: "VALOR HORA", label: "Valor de hora", type: "number", step: "0.01" },
        { id: "LUNES HS", label: "Horas lunes", type: "number", step: "0.5" },
        { id: "MARTES HS", label: "Horas martes", type: "number", step: "0.5" },
        { id: "MIERCOLES HS", label: "Horas miércoles", type: "number", step: "0.5" },
        { id: "JUEVES HS", label: "Horas jueves", type: "number", step: "0.5" },
        { id: "VIERNES HS", label: "Horas viernes", type: "number", step: "0.5" },
        { id: "SABADO HS", label: "Horas sábado", type: "number", step: "0.5" },
        { id: "DOMINGO HS", label: "Horas domingo", type: "number", step: "0.5" }
      ]
    },
    EMPLEADOS: {
      title: "Registro de empleados",
      fields: [
        { id: "ESTADO", label: "Estado", type: "boolean", trueLabel: "Activo" },
        { id: "EMPLEADO", label: "Empleado", type: "text", full: true },
        { id: "CUIL", label: "CUIL", type: "text" },
        { id: "DIRECCION", label: "Dirección", type: "text", full: true },
        { id: "TELEFONO", label: "Teléfono", type: "phone" },
        { id: "CONTACTO DE EMERGENCIA", label: "Contacto de emergencia", type: "phone", full: true },
        { id: "CBU - ALIAS", label: "CBU / Alias", type: "text", full: true },
        { id: "DNI", label: "DNI", type: "dni" },
        { id: "VALOR DE HORA", label: "Valor de hora", type: "number", step: "0.01" },
        { id: "VIATICOS", label: "Viáticos", type: "number", step: "0.01" }
      ]
    },
    FACTURACION: {
      title: "Registro de facturación",
      fields: [
        { id: "ID_CLIENTE", label: "ID Cliente", type: "text", hidden: true },
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "COMPROBANTE", label: "Comprobante", type: "text" },
        { id: "NUMERO", label: "Número", type: "text" },
        { id: "RAZÓN SOCIAL", label: "Razón social", type: "cliente", full: true },
        { id: "CUIT", label: "CUIT", type: "text" },
        { id: "IMPORTE", label: "Importe", type: "number", step: "0.01" },
        { id: "SUBTOTAL", label: "Subtotal", type: "number", step: "0.01" },
        { id: "TOTAL", label: "Total", type: "number", step: "0.01" }
      ]
    },
    PAGOS_CLIENTES: {
      title: "Pagos de clientes",
      fields: [
        { id: "ID_CLIENTE", label: "ID Cliente", type: "text", hidden: true },
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "RAZÓN SOCIAL", label: "Razón social", type: "cliente", full: true },
        { id: "CUIT", label: "CUIT", type: "text" },
        { id: "DETALLE", label: "Detalle", type: "text", full: true },
        { id: "N° COMPROBANTE", label: "Nº comprobante", type: "text" },
        { id: "MEDIO DE PAGO", label: "Medio de pago", type: "text" },
        { id: "MONTO", label: "Monto", type: "number", step: "0.01" },
        { id: "ID_FACTURA", label: "ID Factura", type: "text", hidden: true },
        { id: "FACTURA_NUMERO", label: "Factura número", type: "text" }
      ]
    },
    ASISTENCIA_PLAN: {
      title: "Plan de asistencia semanal",
      fields: [
        { id: "CLIENTE", label: "Cliente", type: "cliente", full: true },
        { id: "EMPLEADO", label: "Empleado", type: "empleado", full: true },
        { id: "DIA SEMANA", label: "Día de la semana", type: "select", options: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] },
        { id: "HORA ENTRADA", label: "Hora de entrada", type: "time" },
        { id: "HORAS PLAN", label: "Horas planificadas", type: "number", step: "0.5" },
        { id: "VIGENTE DESDE", label: "Vigente desde", type: "date" },
        { id: "VIGENTE HASTA", label: "Vigente hasta", type: "date" },
        { id: "OBSERVACIONES", label: "Observaciones", type: "textarea", full: true }
      ]
    },
    ASISTENCIA: {
      title: "Registro de asistencia",
      fields: [
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "EMPLEADO", label: "Empleado", type: "empleado", full: true },
        { id: "CLIENTE", label: "Cliente", type: "cliente", full: true },
        { id: "ASISTENCIA", label: "Asistencia", type: "boolean", trueLabel: "Presente" },
        { id: "HORAS", label: "Horas trabajadas", type: "number", step: "0.5" },
        { id: "OBSERVACIONES", label: "Observaciones", type: "textarea", full: true }
      ]
    },
    ADELANTOS: {
      title: "Registro de adelantos",
      fields: [
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "EMPLEADO", label: "Empleado", type: "empleado", full: true },
        { id: "MONTO", label: "Monto", type: "number", step: "0.01" },
        { id: "OBSERVACION", label: "Observación", type: "textarea", full: true }
      ]
    }
  };

  global.CACHE_TTL_MS = CACHE_TTL_MS;
  global.FORM_DEFINITIONS = FORM_DEFINITIONS;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  // Wrappers para llamadas a google.script.run con control de concurrencia.
  const ApiService = (() => {
    const latestTokens = new Map();
    const dataCache = {
      reference: null,
      referenceTs: 0,
      search: new Map() // key: format|query -> {ts, results}
    };

    function call(functionName, ...args) {
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)[functionName](...args);
      });
    }

    function callLatest(key, functionName, ...args) {
      const token = Date.now() + "-" + Math.random().toString(16).slice(2);
      latestTokens.set(key, token);
      return call(functionName, ...args)
        .then((res) => {
          if (latestTokens.get(key) !== token) {
            return { ignored: true };
          }
          return res;
        })
        .catch((err) => {
          if (latestTokens.get(key) !== token) {
            return { ignored: true };
          }
          throw err;
        });
    }

    return {
      call,
      callLatest,
      dataCache
    };
  })();

  global.ApiService = ApiService;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  // Manejo de datos de referencia (clientes/empleados) con cache.
  const ReferenceService = (() => {
    const state = {
      data: { clientes: [], empleados: [] },
      loaded: false
    };

    function load() {
      const now = Date.now();
      if (
        ApiService.dataCache.reference &&
        now - ApiService.dataCache.referenceTs < CACHE_TTL_MS
      ) {
        state.data = ApiService.dataCache.reference;
        state.loaded = true;
        return Promise.resolve(state.data);
      }

      return ApiService.call("getReferenceData")
        .then(function (data) {
          if (data && data.ignored) return;
          state.data = data || { clientes: [], empleados: [] };
          ApiService.dataCache.reference = state.data;
          ApiService.dataCache.referenceTs = Date.now();
        })
        .catch(function (err) {
          console.error("Error obteniendo referencia:", err);
          state.data = { clientes: [], empleados: [] };
        })
        .finally(function () {
          state.loaded = true;
        });
    }

    function get() {
      return state.data;
    }

    function isLoaded() {
      return state.loaded;
    }

    return {
      load,
      get,
      isLoaded
    };
  })();

  global.ReferenceService = ReferenceService;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  // Metadata y helpers por formato (CLIENTES, EMPLEADOS, etc.)
  const DEFAULTS = {
    entity: "registro",
    label: function (record) {
      return "";
    },
    refreshReference: false
  };

  const META_BY_FORMAT = {
    CLIENTES: {
      entity: "cliente",
      label: function (record) {
        return record["NOMBRE"] || "";
      },
      refreshReference: true
    },
    EMPLEADOS: {
      entity: "empleado",
      label: function (record) {
        return record["EMPLEADO"] || "";
      },
      refreshReference: true
    },
    FACTURACION: {
      entity: "comprobante",
      label: function (record) {
        return (
          record["COMPROBANTE"] ||
          record["NÚMERO"] ||
          record["RAZÓN SOCIAL"] ||
          ""
        );
      }
    },
    PAGOS_CLIENTES: {
      entity: "pago de cliente",
      label: function (record) {
        return record["RAZÓN SOCIAL"] || "";
      }
    },
    ASISTENCIA: {
      entity: "registro de asistencia",
      label: function (record) {
        return record["EMPLEADO"] || record["CLIENTE"] || "";
      }
    },
    ASISTENCIA_PLAN: {
      entity: "plan de asistencia",
      label: function (record) {
        return record["EMPLEADO"] || record["CLIENTE"] || "";
      }
    }
  };

  function getMeta(format) {
    return META_BY_FORMAT[format] || DEFAULTS;
  }

  global.DomainMeta = {
    getMeta
  };
})(typeof window !== "undefined" ? window : this);


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


(function (global) {
  function escapeHtml(val) {
    return String(val == null ? "" : val)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toggleControls(disabled) {
    // Don't disable search-query so users can keep typing during search
    ["formato", "btn-nuevo"].forEach(function (id) {
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


(function (global) {
  // Renderers de campos según tipo. Devuelven nodos listos para insertar.
  function renderBoolean(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1";

    const label = document.createElement("label");
    label.className = "form-label mb-1";
    label.htmlFor = "field-" + field.id;
    label.textContent = field.label;

    const switchDiv = document.createElement("div");
    switchDiv.className = "form-check form-switch";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "form-check-input";
    input.id = "field-" + field.id;
    input.checked = true;

    const switchLabel = document.createElement("label");
    switchLabel.className = "form-check-label small";
    switchLabel.htmlFor = input.id;
    switchLabel.textContent = field.trueLabel || "Activo";

    switchDiv.appendChild(input);
    switchDiv.appendChild(switchLabel);

    wrapper.appendChild(label);
    wrapper.appendChild(switchDiv);
    return wrapper;
  }

  function renderDayOfWeek(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1";

    const label = document.createElement("label");
    label.className = "form-label mb-1";
    label.htmlFor = "field-" + field.id;
    label.textContent = field.label;

    const input = document.createElement("select");
    input.id = "field-" + field.id;
    input.className = "form-select form-select-sm";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Seleccionar día...";
    input.appendChild(placeholder);

    const days = [
      "LUNES",
      "MARTES",
      "MIERCOLES",
      "JUEVES",
      "VIERNES",
      "SABADO",
      "DOMINGO"
    ];

    days.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      input.appendChild(opt);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  function renderDeclarativeSelect(field, options) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1";

    const label = document.createElement("label");
    label.className = "form-label mb-1";
    label.htmlFor = "field-" + field.id;
    label.textContent = field.label;

    const input = document.createElement("select");
    input.id = "field-" + field.id;
    input.className = "form-select form-select-sm";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Seleccionar...";
    input.appendChild(placeholder);

    options.forEach((optItem) => {
      const opt = document.createElement("option");
      opt.value = optItem.value;
      opt.textContent = optItem.label;
      if (optItem.dataset) {
        Object.keys(optItem.dataset).forEach((k) => {
          opt.dataset[k] = optItem.dataset[k];
        });
      }
      input.appendChild(opt);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  function renderInput(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1";

    const label = document.createElement("label");
    label.className = "form-label mb-1";
    label.htmlFor = "field-" + field.id;
    label.textContent = field.label;

    const input = document.createElement("input");
    input.id = "field-" + field.id;
    input.className = "form-control form-control-sm";
    input.type =
      field.type === "phone" || field.type === "dni" ? "text" : field.type;
    if (field.step) input.step = field.step;
    if (field.placeholder) input.placeholder = field.placeholder;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  const FormRenderer = {
    renderField: function (field, referenceData) {
      switch (field.type) {
        case "boolean":
          return renderBoolean(field);
        case "dayOfWeek":
          return renderDayOfWeek(field);
        case "cliente": {
          const options =
            (referenceData.clientes || []).map((cli) => ({
              value: cli.razonSocial || cli.nombre,
              label: cli.razonSocial || cli.nombre,
              dataset: { cuit: cli.cuit || "" }
            })) || [];
          return renderDeclarativeSelect(field, options);
        }
        case "empleado": {
          const options =
            (referenceData.empleados || []).map((emp) => ({
              value: emp,
              label: emp
            })) || [];
          return renderDeclarativeSelect(field, options);
        }
        case "select": {
          // Select con opciones definidas en el campo
          const options = (field.options || []).map(opt => ({
            value: opt,
            label: opt
          }));
          return renderDeclarativeSelect(field, options);
        }
        case "textarea": {
          // Textarea para textos largos
          const wrapper = document.createElement("div");
          wrapper.className = "mb-1";

          const label = document.createElement("label");
          label.className = "form-label mb-1";
          label.htmlFor = "field-" + field.id;
          label.textContent = field.label;

          const textarea = document.createElement("textarea");
          textarea.id = "field-" + field.id;
          textarea.className = "form-control form-control-sm";
          textarea.rows = field.rows || 3;
          if (field.placeholder) textarea.placeholder = field.placeholder;

          wrapper.appendChild(label);
          wrapper.appendChild(textarea);
          return wrapper;
        }
        case "time": {
          // Input type time
          const wrapper = document.createElement("div");
          wrapper.className = "mb-1";

          const label = document.createElement("label");
          label.className = "form-label mb-1";
          label.htmlFor = "field-" + field.id;
          label.textContent = field.label;

          const input = document.createElement("input");
          input.id = "field-" + field.id;
          input.className = "form-control form-control-sm";
          input.type = "time";

          wrapper.appendChild(label);
          wrapper.appendChild(input);
          return wrapper;
        }
        default:
          return renderInput(field);
      }
    }
  };

  global.FormRenderer = FormRenderer;
})(typeof window !== "undefined" ? window : this);


/**
 * Footer UI Component
 */
(function (global) {
    const Footer = (function () {
        const footerHtml = `
            <footer class="fixed-bottom bg-white border-top py-2">
                <div class="container d-flex justify-content-between align-items-center">
                    <div class="d-flex gap-2">
                        <button id="btn-nuevo" class="btn btn-primary rounded-pill px-4">
                            <i class="bi bi-plus-lg me-1"></i> Nuevo
                        </button>
                    </div>
                    <button id="btn-grabar" class="btn btn-success rounded-pill px-4" disabled>
                        <i class="bi bi-check-lg me-1"></i> Grabar
                    </button>
                </div>
            </footer>
        `;

        function render() {
            const container = document.getElementById('footer-container');
            if (container) {
                container.innerHTML = footerHtml;
                attachEvents();
            }
        }

        function attachEvents() {
            const btnNuevo = document.getElementById('btn-nuevo');
            const btnGrabar = document.getElementById('btn-grabar');

            if (btnNuevo) {
                btnNuevo.addEventListener('click', function () {
                    if (global.FormManager) {
                        global.FormManager.resetForm();
                    }

                    // Reset buttons
                    btnGrabar.disabled = false;
                    btnNuevo.disabled = true;
                });
            }

            if (btnGrabar) {
                btnGrabar.addEventListener('click', function () {
                    if (global.FormManager) {
                        global.FormManager.submitForm();
                    }
                });
            }
        }

        return {
            render: render
        };
    })();

    global.Footer = Footer;
})(typeof window !== "undefined" ? window : this);


/**
 * Sidebar Component
 * Handles the responsive sidebar navigation logic
 */
const Sidebar = (() => {
    // State
    let isOpen = false;
    let activeItem = null;

    // DOM Elements
    const elements = {
        sidebar: null,
        overlay: null,
        toggleBtn: null,
        menuItems: []
    };

    /**
     * Initialize the sidebar
     */
    function init() {
        elements.sidebar = document.getElementById('app-sidebar');
        elements.overlay = document.getElementById('sidebar-overlay');
        elements.toggleBtn = document.getElementById('sidebar-toggle');

        if (!elements.sidebar) return;

        // Setup event listeners
        if (elements.toggleBtn) {
            elements.toggleBtn.addEventListener('click', toggle);
        }

        if (elements.overlay) {
            elements.overlay.addEventListener('click', close);
        }

        // Setup menu items
        const links = elements.sidebar.querySelectorAll('.nav-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('data-target');
                if (targetId) {
                    setActive(targetId);
                    // On mobile, close sidebar after selection
                    if (window.innerWidth < 992) {
                        close();
                    }
                }
            });
            elements.menuItems.push(link);
        });
    }

    /**
     * Toggle sidebar state
     */
    function toggle() {
        isOpen = !isOpen;
        updateState();
    }

    /**
     * Open sidebar
     */
    function open() {
        isOpen = true;
        updateState();
    }

    /**
     * Close sidebar
     */
    function close() {
        isOpen = false;
        updateState();
    }

    /**
     * Update DOM based on state
     */
    function updateState() {
        if (isOpen) {
            document.body.classList.add('sidebar-open');
        } else {
            document.body.classList.remove('sidebar-open');
        }
    }

    /**
     * Set active menu item
     * @param {string} targetId - ID of the target view
     */
    function setActive(targetId) {
        activeItem = targetId;

        // Update menu items
        elements.menuItems.forEach(item => {
            if (item.getAttribute('data-target') === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Trigger custom event for view change
        const event = new CustomEvent('view-change', {
            detail: { view: targetId }
        });
        document.dispatchEvent(event);
    }

    return {
        init,
        toggle,
        open,
        close,
        setActive
    };
})();


/**
 * Grid Manager
 * Maneja la visualización de datos en formato de grilla/tabla
 */

(function (global) {
    const GridManager = (() => {
        let currentFormat = null;
        let allRecords = [];
        let currentEditingRecord = null;

        function formatDateForGrid(value) {
            if (!value) return '';

            if (Object.prototype.toString.call(value) === '[object Date]') {
                const d0 = value;
                if (!isNaN(d0.getTime())) {
                    return d0.toLocaleDateString('es-ES');
                }
            }

            const s = String(value).trim();
            if (!s) return '';

            let d = null;

            // YYYY-MM-DD (evitar corrimiento por timezone interpretándolo como fecha local)
            const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (iso) {
                d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
            } else {
                // DD/MM/YYYY
                const dmySlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                if (dmySlash) {
                    d = new Date(Number(dmySlash[3]), Number(dmySlash[2]) - 1, Number(dmySlash[1]));
                } else {
                    // DD-MM-YYYY
                    const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
                    if (dmyDash) {
                        d = new Date(Number(dmyDash[3]), Number(dmyDash[2]) - 1, Number(dmyDash[1]));
                    } else {
                        d = new Date(s);
                    }
                }
            }

            if (!d || isNaN(d.getTime())) return s;
            return d.toLocaleDateString('es-ES');
        }

        /**
         * Renderiza la grilla con los registros del formato actual
         */
        function renderGrid(tipoFormato, records) {
            currentFormat = tipoFormato;

            // Vista resumida especial para asistencia diaria
            if (tipoFormato === 'ASISTENCIA' && global.AttendanceDailyUI) {
                global.AttendanceDailyUI.renderSummary(records || []);
                return;
            }

            // Los registros vienen en formato {id, rowNumber, record}
            // Extraer solo los records y agregar el ID
            allRecords = (records || []).map(item => {
                if (item.record) {
                    // Agregar el ID al record para poder usarlo después
                    item.record.ID = item.id;
                    item.record._rowNumber = item.rowNumber;
                    return item.record;
                }
                return item;
            });

            const formDef = FORM_DEFINITIONS[tipoFormato];
            if (!formDef) return;

            // Obtener los 5 campos más relevantes
            const relevantFields = formDef.fields.slice(0, 5);

            // Renderizar headers
            const headersRow = document.getElementById('grid-headers');
            if (headersRow) {
                headersRow.innerHTML = '';

                relevantFields.forEach(field => {
                    const th = document.createElement('th');
                    th.textContent = field.label;
                    headersRow.appendChild(th);
                });

                // Columna de acciones
                const thActions = document.createElement('th');
                thActions.textContent = 'Acciones';
                thActions.style.width = '150px';
                thActions.style.textAlign = 'center';
                headersRow.appendChild(thActions);
            }

            // Renderizar body
            const tbody = document.getElementById('grid-body');
            if (!tbody) return;

            tbody.innerHTML = '';

            if (!allRecords.length) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = relevantFields.length + 1;
                td.className = 'text-center text-muted py-5';
                td.textContent = 'No hay registros para mostrar';
                tr.appendChild(td);
                tbody.appendChild(tr);
                return;
            }

            allRecords.forEach(record => {
                const tr = document.createElement('tr');

                relevantFields.forEach(field => {
                    const td = document.createElement('td');
                    // Buscar el valor usando el ID del campo (puede estar en mayúsculas o minúsculas)
                    let value = record[field.id];

                    // Si no encuentra, intentar con el label
                    if (value === undefined || value === null) {
                        value = record[field.label];
                    }

                    // Si aún no encuentra, intentar buscar case-insensitive
                    if (value === undefined || value === null) {
                        const keys = Object.keys(record);
                        const matchingKey = keys.find(k => k.toUpperCase() === field.id.toUpperCase());
                        if (matchingKey) {
                            value = record[matchingKey];
                        }
                    }

                    // Formatear según el tipo
                    if (field.type === 'boolean') {
                        value = value ? '✅ Activo' : '❌ Inactivo';
                    } else if (field.type === 'date' && value) {
                        value = formatDateForGrid(value);
                    } else if (field.type === 'number' && value) {
                        value = Number(value).toLocaleString('es-ES');
                    }

                    td.textContent = value || '-';
                    td.style.maxWidth = '200px';
                    td.style.overflow = 'hidden';
                    td.style.textOverflow = 'ellipsis';
                    td.style.whiteSpace = 'nowrap';
                    tr.appendChild(td);
                });

                // Botones de acción - inline y más pequeños
                const tdActions = document.createElement('td');
                tdActions.style.textAlign = 'center';
                tdActions.style.whiteSpace = 'nowrap';

                const btnEdit = document.createElement('button');
                btnEdit.className = 'btn btn-sm btn-outline-primary lt-btn-icon me-1';
                btnEdit.innerHTML = '<i class=\"bi bi-pencil-fill\"></i>';
                btnEdit.title = 'Editar';
                btnEdit.onclick = () => editRecord(record);

                const btnDelete = document.createElement('button');
                btnDelete.className = 'btn btn-sm btn-outline-danger lt-btn-icon';
                btnDelete.innerHTML = '<i class=\"bi bi-trash-fill\"></i>';
                btnDelete.title = 'Eliminar';
                btnDelete.onclick = () => deleteRecord(record);

                tdActions.appendChild(btnEdit);
                tdActions.appendChild(btnDelete);
                tr.appendChild(tdActions);

                tbody.appendChild(tr);
            });
        }

        /**
         * Abre el modal para editar un registro
         */
        function editRecord(record) {
            currentEditingRecord = record;
            const recordId = record.ID || record.Id || record.id;

            // Abrir modal y renderizar formulario en el callback
            const formDef = FORM_DEFINITIONS[currentFormat];
            const title =
                currentFormat === 'EMPLEADOS'
                    ? 'Editar empleado'
                    : currentFormat === 'CLIENTES'
                        ? 'Editar cliente'
                        : formDef && formDef.title
                            ? 'Editar ' + formDef.title.toLowerCase()
                            : 'Editar registro';

            openModal(title, function () {
                if (FormManager) {
                    FormManager.renderForm(currentFormat);

                    // Esperar un momento adicional para que se rendericen los campos
                    setTimeout(() => {
                        if (RecordManager && recordId) {
                            RecordManager.loadRecordForEdit(recordId, record);
                        } else {
                            loadRecordIntoForm(record);
                        }

                        const btnEliminar = document.getElementById('btn-eliminar-modal');
                        if (btnEliminar) btnEliminar.classList.remove('d-none');
                    }, 100);
                }
            });
        }

        /**
         * Carga los datos del registro en el formulario
         */
        function loadRecordIntoForm(record) {
            const formDef = FORM_DEFINITIONS[currentFormat];
            if (!formDef) return;

            formDef.fields.forEach(field => {
                const input = document.getElementById('field-' + field.id);
                if (!input) return;

                const value = record[field.id];

                if (field.type === 'boolean') {
                    input.checked = !!value;
                } else if (field.type === 'date' && value) {
                    // Convertir fecha a formato YYYY-MM-DD
                    const date = new Date(value);
                    input.value = date.toISOString().split('T')[0];
                } else {
                    input.value = value || '';
                }
            });
        }

        /**
         * Elimina un registro
         */
        function deleteRecord(record) {
            if (!record) return;
            const id = record.ID || record.Id || record.id;
            if (!id) {
                Alerts && Alerts.showAlert('ID no encontrado para eliminar.', 'warning');
                return;
            }

            const confirmPromise =
                global.UiDialogs && typeof global.UiDialogs.confirm === 'function'
                    ? global.UiDialogs.confirm({
                        title: 'Eliminar registro',
                        message: '¿Estás seguro de que deseas eliminar este registro?',
                        confirmText: 'Eliminar',
                        cancelText: 'Cancelar',
                        confirmVariant: 'danger',
                        icon: 'bi-trash3-fill',
                        iconClass: 'text-danger'
                    })
                    : Promise.resolve(confirm('¿Estás seguro de que deseas eliminar este registro?'));

            confirmPromise.then(function (confirmed) {
                if (!confirmed) return;

            UiState && UiState.setGlobalLoading(true, 'Eliminando...');

            ApiService.call('deleteRecord', currentFormat, id)
                .then(function () {
                    Alerts && Alerts.showAlert('✅ Registro eliminado correctamente.', 'success');
                    if (ReferenceService) {
                        ReferenceService.load().then(function () {
                            if (FormManager) {
                                FormManager.updateReferenceData(ReferenceService.get());
                            }
                        });
                    }
                    refreshGrid();
                })
                .catch(function (err) {
                    Alerts && Alerts.showAlert('Error al eliminar: ' + err.message, 'danger');
                })
                .finally(function () {
                    UiState && UiState.setGlobalLoading(false);
                });
            });
        }

        /**
         * Abre el modal del formulario
         * @param {string} title - Título del modal
         * @param {function} callback - Función a ejecutar después de abrir el modal
         */
        function openModal(title, callback) {
            const modal = document.getElementById('form-modal');
            const modalTitle = document.getElementById('modal-title');

            if (modal) {
                modal.classList.remove('d-none');
            }

            if (modalTitle) {
                modalTitle.textContent = title || 'Nuevo Registro';
            }

            // Ejecutar callback después de que el modal esté visible
            if (callback && typeof callback === 'function') {
                setTimeout(callback, 50);
            }
        }

        /**
         * Cierra el modal del formulario
         */
        function closeModal() {
            const modal = document.getElementById('form-modal');
            if (modal) {
                modal.classList.add('d-none');
            }

            currentEditingRecord = null;

            // Limpiar formulario
            if (FormManager) {
                FormManager.clearForm();
            }

            // Ocultar botón eliminar
            const btnEliminar = document.getElementById('btn-eliminar-modal');
            if (btnEliminar) {
                btnEliminar.classList.add('d-none');
            }
        }

        /**
         * Obtiene el registro que se está editando actualmente
         */
        function getCurrentEditingRecord() {
            return currentEditingRecord;
        }

        /**
         * Recarga los datos de la grilla
         */
        function refreshGrid() {
            if (!currentFormat) return;

            // Aquí iría la lógica para recargar los datos desde el servidor
            if (ApiService) {
                ApiService.call('searchRecords', currentFormat, '')
                    .then(records => {
                        renderGrid(currentFormat, records);
                    })
                    .catch(err => {
                        console.error('Error al recargar la grilla:', err);
                    });
            }
        }

        return {
            renderGrid,
            openModal,
            closeModal,
            getCurrentEditingRecord,
            refreshGrid
        };
    })();

    global.GridManager = GridManager;
})(typeof window !== 'undefined' ? window : this);


/**
 * Panel de fotos para Clientes (Fachadas / Llaves)
 * - Soporta múltiples fotos por tipo
 * - Se renderiza dentro del modal de edición de CLIENTES
 */
var ClientMediaPanel = (function () {
    const SECTION_ID = 'client-media-section';
    const NOTICE_ID = 'client-media-notice';
    const LOADING_ID = 'client-media-loading';
    const LOADING_TEXT_ID = 'client-media-loading-text';
    const VIEWER_ID = 'client-media-viewer';
    const VIEWER_TITLE_ID = 'client-media-viewer-title';
    const VIEWER_IMG_ID = 'client-media-viewer-img';
    const VIEWER_SPINNER_ID = 'client-media-viewer-spinner';
    const VIEWER_MSG_ID = 'client-media-viewer-msg';
    const VIEWER_DRIVE_ID = 'client-media-viewer-drive';
    const ACCEPT_IMAGE_ANY = 'image/' + '*';

    let state = {
        clientId: '',
        fachada: [],
        llave: [],
        viewerKeyHandlerInstalled: false
    };

    function escapeHtml_(val) {
        if (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.escapeHtml === 'function') {
            return HtmlHelpers.escapeHtml(val);
        }
        return String(val == null ? '' : val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getEditingClient_() {
        try {
            if (typeof GridManager !== 'undefined' && GridManager && typeof GridManager.getCurrentEditingRecord === 'function') {
                const r = GridManager.getCurrentEditingRecord();
                if (r) return r;
            }
        } catch (e) {
            // ignore
        }
        return null;
    }

    function getClientIdFromRecord_(rec) {
        if (!rec) return '';
        return String(rec.ID || rec.Id || rec.id || '').trim();
    }

    function showNotice_(type, message) {
        const el = document.getElementById(NOTICE_ID);
        if (!el) return;
        if (!message) {
            el.innerHTML = '';
            return;
        }
        const safeType = type || 'info';
        el.innerHTML = `
            <div class="alert alert-${escapeHtml_(safeType)} py-2 px-3 mb-0 d-flex align-items-start gap-2">
                <i class="bi ${safeType === 'danger' ? 'bi-exclamation-triangle-fill' : safeType === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle-fill'}"></i>
                <div class="small">${escapeHtml_(message)}</div>
            </div>
        `;
    }

    function setPanelLoading_(isLoading, message) {
        const overlay = document.getElementById(LOADING_ID);
        if (!overlay) return;
        const text = document.getElementById(LOADING_TEXT_ID);
        if (text) text.textContent = message || 'Procesando...';
        overlay.classList.toggle('d-none', !isLoading);
    }

    function ensureViewer_() {
        const existing = document.getElementById(VIEWER_ID);
        if (existing) return existing;

        const overlay = document.createElement('div');
        overlay.id = VIEWER_ID;
        overlay.className = 'client-media-viewer d-none';
        overlay.innerHTML = `
            <div class="client-media-viewer__backdrop" data-cm-viewer-close="1"></div>
            <div class="client-media-viewer__dialog" role="dialog" aria-modal="true" aria-labelledby="${VIEWER_TITLE_ID}">
                <div class="client-media-viewer__header">
                    <div class="client-media-viewer__title" id="${VIEWER_TITLE_ID}">Foto</div>
                    <button type="button" class="btn btn-sm btn-outline-light lt-btn-icon" data-cm-viewer-close="1" aria-label="Cerrar">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="client-media-viewer__body">
                    <div class="client-media-viewer__spinner" id="${VIEWER_SPINNER_ID}">
                        <div class="spinner-border text-light" role="status" aria-label="Cargando"></div>
                        <div class="small mt-2 text-light opacity-75" id="${VIEWER_MSG_ID}">Cargando...</div>
                    </div>
                    <img id="${VIEWER_IMG_ID}" class="d-none" alt="">
                </div>
                <div class="client-media-viewer__footer">
                    <a id="${VIEWER_DRIVE_ID}" class="btn btn-outline-light btn-sm d-none" target="_blank" rel="noopener">
                        <i class="bi bi-box-arrow-up-right"></i> Abrir en Drive
                    </a>
                    <button type="button" class="btn btn-light btn-sm" data-cm-viewer-close="1">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', function (e) {
            const closeTarget = e.target && e.target.closest ? e.target.closest('[data-cm-viewer-close]') : null;
            if (closeTarget) {
                closeViewer_();
            }
        });

        if (!state.viewerKeyHandlerInstalled) {
            state.viewerKeyHandlerInstalled = true;
            document.addEventListener('keydown', function (e) {
                if (e && e.key === 'Escape') closeViewer_();
            });
        }

        return overlay;
    }

    function openViewerLoading_(title, message) {
        const overlay = ensureViewer_();
        const titleEl = document.getElementById(VIEWER_TITLE_ID);
        const img = document.getElementById(VIEWER_IMG_ID);
        const spinner = document.getElementById(VIEWER_SPINNER_ID);
        const msg = document.getElementById(VIEWER_MSG_ID);
        const drive = document.getElementById(VIEWER_DRIVE_ID);

        if (titleEl) titleEl.textContent = title || 'Foto';
        if (msg) msg.textContent = message || 'Cargando...';
        if (drive) {
            drive.classList.add('d-none');
            drive.removeAttribute('href');
        }
        if (img) {
            img.classList.add('d-none');
            img.removeAttribute('src');
        }
        if (spinner) spinner.classList.remove('d-none');

        overlay.classList.remove('d-none');
    }

    function openViewerImage_(title, imageState) {
        const overlay = ensureViewer_();
        const titleEl = document.getElementById(VIEWER_TITLE_ID);
        const img = document.getElementById(VIEWER_IMG_ID);
        const spinner = document.getElementById(VIEWER_SPINNER_ID);
        const drive = document.getElementById(VIEWER_DRIVE_ID);

        if (titleEl) titleEl.textContent = title || 'Foto';

        if (!imageState || !imageState.base64) return;
        const dataUrl = `data:${imageState.mimeType || 'image/jpeg'};base64,${imageState.base64 || ''}`;

        if (spinner) spinner.classList.add('d-none');
        if (img) {
            img.src = dataUrl;
            img.alt = title || 'Foto';
            img.classList.remove('d-none');
        }
        if (drive) {
            if (imageState.url) {
                drive.href = String(imageState.url);
                drive.classList.remove('d-none');
            } else {
                drive.classList.add('d-none');
                drive.removeAttribute('href');
            }
        }
        overlay.classList.remove('d-none');
    }

    function closeViewer_() {
        const overlay = document.getElementById(VIEWER_ID);
        if (!overlay) return;
        overlay.classList.add('d-none');
    }

    function buildKindCardHtml_(kind) {
        const key = kind.toLowerCase();
        const meta = kind === 'FACHADA'
            ? { title: 'Fachadas', icon: 'bi-building', iconClass: 'text-primary' }
            : { title: 'Llaves', icon: 'bi-key-fill', iconClass: 'text-warning' };

        return `
            <div class="col-12 col-md-6">
                <div class="lt-surface p-3 h-100">
                    <div class="d-flex align-items-start justify-content-between gap-2">
                        <div class="d-flex align-items-center gap-2">
                            <i class="bi ${escapeHtml_(meta.icon)} ${escapeHtml_(meta.iconClass)}"></i>
                            <div>
                                <div class="fw-semibold">${escapeHtml_(meta.title)}</div>
                                <div class="small text-muted" id="client-media-${key}-count">0 fotos</div>
                            </div>
                        </div>
                        <button type="button"
                            class="btn btn-sm btn-outline-primary lt-btn-compact d-flex align-items-center gap-1"
                            data-cm-action="add"
                            data-cm-kind="${escapeHtml_(kind)}">
                            <i class="bi bi-plus-lg"></i><span>Agregar</span>
                        </button>
                    </div>

                    <div class="mt-3">
                        <div class="row g-2" id="client-media-${key}-grid"></div>
                        <div class="text-center text-muted small py-4 d-none" id="client-media-${key}-empty">
                            <i class="bi bi-image" style="font-size: 1.6rem; opacity: 0.35;"></i>
                            <div class="mt-1">Sin fotos</div>
                        </div>
                    </div>

                    <input type="file" class="d-none" multiple
                        id="client-media-${key}-add-input" data-cm-input-kind="${escapeHtml_(kind)}">
                </div>
            </div>
        `;
    }

    function render(containerEl) {
        if (!containerEl) return;

        const existing = document.getElementById(SECTION_ID);
        if (existing) existing.remove();

        const rec = getEditingClient_();
        const clientId = getClientIdFromRecord_(rec);

        state = {
            clientId: clientId,
            fachada: [],
            llave: [],
            viewerKeyHandlerInstalled: state.viewerKeyHandlerInstalled
        };

        const section = document.createElement('div');
        section.className = 'col-12';
        section.id = SECTION_ID;
        section.innerHTML = `
            <div class="lt-surface lt-surface--subtle p-3 client-media-panel">
                <div class="client-media-loading d-none" id="${LOADING_ID}">
                    <div class="client-media-loading__backdrop"></div>
                    <div class="client-media-loading__content">
                        <div class="spinner-border text-primary" role="status" aria-label="Cargando"></div>
                        <div class="small mt-2" id="${LOADING_TEXT_ID}">Procesando...</div>
                    </div>
                </div>

                <div class="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                    <div class="d-flex align-items-center gap-3">
                        <div class="rounded-circle d-flex align-items-center justify-content-center"
                            style="width: 40px; height: 40px; background: rgba(99,102,241,0.12);">
                            <i class="bi bi-camera-fill text-primary"></i>
                        </div>
                        <div>
                            <div class="fw-semibold">Fotos del cliente</div>
                            <div class="small text-muted">Guardá y consultá fotos de fachada y llaves.</div>
                        </div>
                    </div>
                    <span class="lt-chip lt-chip--muted">
                        <i class="bi bi-hash"></i>
                        <span>ID: ${escapeHtml_(clientId || '—')}</span>
                    </span>
                </div>

                <div id="${NOTICE_ID}" class="mb-2"></div>

                <div class="row g-2">
                    ${buildKindCardHtml_('FACHADA')}
                    ${buildKindCardHtml_('LLAVE')}
                </div>
            </div>
        `;

        containerEl.appendChild(section);

        attachEvents_(section);

        if (clientId) {
            refresh_(clientId);
        } else {
            showNotice_('warning', 'Guardá el cliente para habilitar la carga de fotos.');
        }
    }

    function setKindCount_(kind, count) {
        const key = kind.toLowerCase();
        const el = document.getElementById(`client-media-${key}-count`);
        if (!el) return;
        el.textContent = count === 1 ? '1 foto' : `${count} fotos`;
    }

    function renderKindGrid_(kind, items) {
        const key = kind.toLowerCase();
        const grid = document.getElementById(`client-media-${key}-grid`);
        const empty = document.getElementById(`client-media-${key}-empty`);
        if (!grid || !empty) return;

        const list = Array.isArray(items) ? items : [];
        setKindCount_(kind, list.length);

        grid.innerHTML = '';

        if (!list.length) {
            empty.classList.remove('d-none');
            return;
        }
        empty.classList.add('d-none');

        list.forEach((it) => {
            const thumb = it && it.thumbnailBase64 ? it.thumbnailBase64 : '';
            const mime = it && it.mimeType ? it.mimeType : 'image/jpeg';
            const fileId = it && it.fileId ? String(it.fileId) : '';
            const name = it && it.name ? String(it.name) : '';

            const col = document.createElement('div');
            col.className = 'col-6 col-lg-4';

            const dataUrl = thumb ? `data:${mime};base64,${thumb}` : '';

            col.innerHTML = `
                <div class="lt-surface p-2 h-100">
                    <div class="ratio ratio-4x3 bg-white border rounded-3 overflow-hidden client-media-thumb">
                        <div class="client-media-thumb__inner">
                            ${dataUrl
                        ? `<img src="${dataUrl}" alt="${escapeHtml_(name || kind)}" class="client-media-thumb__img"
                                    data-cm-action="view" data-cm-kind="${escapeHtml_(kind)}" data-cm-file-id="${escapeHtml_(fileId)}">`
                        : `<div class="d-flex align-items-center justify-content-center text-muted small h-100">Sin preview</div>`
                    }
                            <button type="button" class="client-media-thumb__delete"
                                data-cm-action="delete" data-cm-kind="${escapeHtml_(kind)}" data-cm-file-id="${escapeHtml_(fileId)}"
                                title="Eliminar">
                                <i class="bi bi-trash3"></i>
                            </button>
                        </div>
                    </div>
                    <div class="small text-muted text-truncate mt-2" title="${escapeHtml_(name)}">
                        <i class="bi bi-image me-1"></i>${escapeHtml_(name || '')}
                    </div>
                </div>
            `;

            grid.appendChild(col);
        });
    }

    function refresh_(clientId) {
        showNotice_('', '');
        setPanelLoading_(true, 'Cargando fotos...');
        ApiService.call('listClientMedia', clientId)
            .then((res) => {
                state.fachada = (res && res.fachada) ? res.fachada : [];
                state.llave = (res && res.llave) ? res.llave : [];
                renderKindGrid_('FACHADA', state.fachada);
                renderKindGrid_('LLAVE', state.llave);
            })
            .catch((err) => {
                console.error(err);
                showNotice_('danger', 'No se pudieron cargar las fotos. ' + (err && err.message ? err.message : err));
            })
            .finally(() => setPanelLoading_(false));
    }

    function attachEvents_(sectionEl) {
        if (!sectionEl) return;

        // Delegación de clicks
        sectionEl.addEventListener('click', function (e) {
            const target = e.target && e.target.closest ? e.target.closest('[data-cm-action]') : null;
            if (!target) return;

            const action = target.getAttribute('data-cm-action');
            const kind = String(target.getAttribute('data-cm-kind') || '').trim().toUpperCase();
            const fileId = String(target.getAttribute('data-cm-file-id') || '').trim();

            if (!state.clientId) {
                showNotice_('warning', 'Guardá el cliente para habilitar las fotos.');
                return;
            }

            if (action === 'add') {
                const input = document.getElementById(`client-media-${kind.toLowerCase()}-add-input`);
                if (input) input.click();
                return;
            }

            if (action === 'view') {
                if (!fileId) return;
                openImageModalFromServer_(fileId);
                return;
            }

            if (action === 'delete') {
                if (!fileId) return;
                confirmDeleteFile_(fileId);
                return;
            }
        });

        // Inputs: agregar
        ['FACHADA', 'LLAVE'].forEach((kind) => {
            const input = document.getElementById(`client-media-${kind.toLowerCase()}-add-input`);
            if (!input) return;
            input.accept = ACCEPT_IMAGE_ANY;
            input.addEventListener('change', function () {
                const files = this.files ? Array.from(this.files) : [];
                this.value = '';
                if (!files.length) return;
                uploadFiles_(state.clientId, kind, files);
            });
        });
    }

    function resizeImageToJpegBase64_(file, maxDimPx = 1600, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error('El archivo no parece ser una imagen válida.'));
                img.onload = () => {
                    const w = img.naturalWidth || img.width;
                    const h = img.naturalHeight || img.height;
                    if (!w || !h) return reject(new Error('Dimensiones de imagen inválidas.'));

                    const maxSide = Math.max(w, h);
                    const scale = maxSide > maxDimPx ? (maxDimPx / maxSide) : 1;
                    const nw = Math.max(1, Math.round(w * scale));
                    const nh = Math.max(1, Math.round(h * scale));

                    const canvas = document.createElement('canvas');
                    canvas.width = nw;
                    canvas.height = nh;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('No se pudo preparar canvas.'));

                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, nw, nh);
                    ctx.drawImage(img, 0, 0, nw, nh);

                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    const base64 = String(dataUrl || '').split(',')[1] || '';
                    if (!base64) return reject(new Error('No se pudo codificar la imagen.'));

                    resolve({ base64: base64, mimeType: 'image/jpeg' });
                };
                img.src = String(reader.result || '');
            };
            reader.readAsDataURL(file);
        });
    }

    async function uploadFiles_(clientId, kind, files) {
        const list = Array.isArray(files) ? files.filter(Boolean) : [];
        if (!list.length) return;

        showNotice_('', '');

        try {
            setPanelLoading_(true, `Subiendo ${list.length} foto(s)...`);
            UiState && UiState.setGlobalLoading(true, `Subiendo ${list.length} foto(s)...`);
            for (let i = 0; i < list.length; i++) {
                const label = `Subiendo foto ${i + 1}/${list.length}...`;
                setPanelLoading_(true, label);
                UiState && UiState.setGlobalLoading(true, label);
                const { base64, mimeType } = await resizeImageToJpegBase64_(list[i], 1600, 0.85);
                await ApiService.call('uploadClientMedia', {
                    clientId: clientId,
                    kind: kind,
                    base64: base64,
                    mimeType: mimeType,
                    replaceFileId: ''
                });
            }
            showNotice_('success', 'Fotos actualizadas.');
            refresh_(clientId);
        } catch (err) {
            console.error(err);
            showNotice_('danger', 'Error al subir foto: ' + (err && err.message ? err.message : err));
        } finally {
            setPanelLoading_(false);
            UiState && UiState.setGlobalLoading(false);
        }
    }

    function confirmDeleteFile_(fileId) {
        const doDelete = () => {
            setPanelLoading_(true, 'Eliminando foto...');
            UiState && UiState.setGlobalLoading(true, 'Eliminando foto...');
            ApiService.call('deleteClientMediaFile', fileId)
                .then(() => {
                    showNotice_('success', 'Foto eliminada.');
                    refresh_(state.clientId);
                })
                .catch((err) => {
                    console.error(err);
                    showNotice_('danger', 'Error al eliminar foto: ' + (err && err.message ? err.message : err));
                })
                .finally(() => {
                    setPanelLoading_(false);
                    UiState && UiState.setGlobalLoading(false);
                });
        };

        if (typeof UiDialogs !== 'undefined' && UiDialogs && typeof UiDialogs.confirm === 'function') {
            UiDialogs.confirm({
                title: 'Eliminar foto',
                message: '¿Seguro que querés eliminar esta foto?',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                confirmVariant: 'danger',
                icon: 'bi-trash3-fill',
                iconClass: 'text-danger'
            }).then((ok) => { if (ok) doDelete(); });
            return;
        }

        if (confirm('¿Seguro que querés eliminar esta foto?')) doDelete();
    }

    function openImageModalFromServer_(fileId) {
        openViewerLoading_('Foto', 'Cargando foto...');
        UiState && UiState.setGlobalLoading(true, 'Cargando foto...');
        ApiService.call('getClientMediaImage', fileId, 1600)
            .then((res) => {
                if (!res || !res.base64) {
                    showNotice_('warning', 'No se pudo cargar la imagen.');
                    closeViewer_();
                    return;
                }
                openViewerImage_('Foto', res);
            })
            .catch((err) => {
                console.error(err);
                showNotice_('danger', 'Error al cargar foto: ' + (err && err.message ? err.message : err));
                closeViewer_();
            })
            .finally(() => UiState && UiState.setGlobalLoading(false));
    }

    function openImageModal_(title, state) {
        openViewerImage_(title, state);
    }

    return {
        render: render
    };
})();


/**
 * Search Manager
 * Maneja la búsqueda de registros
 */

(function (global) {
    const SearchManager = (() => {
        let searchDebounce = null;
        let suggestionResults = [];

        /**
         * Builds a preview string for a search result based on its content
         */
        function buildPreview(record) {
            const parts = [];

            // Always show ID first if available
            if (record.ID) {
                parts.push(`<strong>ID:</strong> ${record.ID}`);
            }

            // Format-specific key fields
            if (record.NOMBRE) {
                parts.push(`<strong>NOMBRE:</strong> ${record.NOMBRE}`);
            } else if (record.EMPLEADO) {
                parts.push(`<strong>EMPLEADO:</strong> ${record.EMPLEADO}`);
            } else if (record.CLIENTE) {
                parts.push(`<strong>CLIENTE:</strong> ${record.CLIENTE}`);
            }

            // Additional context field
            if (record["RAZON SOCIAL"]) {
                parts.push(`<strong>RAZÓN SOCIAL:</strong> ${record["RAZON SOCIAL"]}`);
            } else if (record.CUIT) {
                parts.push(`<strong>CUIT:</strong> ${record.CUIT}`);
            } else if (record.CUIL) {
                parts.push(`<strong>CUIL:</strong> ${record.CUIL}`);
            } else if (record.FECHA) {
                parts.push(`<strong>FECHA:</strong> ${record.FECHA}`);
            }

            // If we don't have enough parts, add first non-ID field
            if (parts.length < 2) {
                const keys = Object.keys(record).filter(k => k !== 'ID');
                if (keys.length > 0) {
                    parts.push(`<strong>${keys[0]}:</strong> ${record[keys[0]]}`);
                }
            }

            return parts.join(" · ");
        }

        function handleSearch(tipoFormato, query) {
            if (searchDebounce) {
                clearTimeout(searchDebounce);
            }

            const sugg = document.getElementById("search-suggestions");
            if (!sugg) return;

            if (!query || query.length < 2) {
                sugg.classList.add("d-none");
                sugg.innerHTML = "";
                return;
            }

            UiState.setGlobalLoading(true, "Buscando...");

            searchDebounce = setTimeout(function () {
                ApiService.callLatest('search-' + tipoFormato, 'searchRecords', tipoFormato, query)
                    .then(function (results) {
                        if (results && results.ignored) return;
                        suggestionResults = results || [];
                        renderSearchResults(suggestionResults);
                    })
                    .catch(function (err) {
                        console.error("Error en búsqueda:", err);
                        if (Alerts) Alerts.showAlert("Error al buscar: " + err.message, "danger");
                    })
                    .finally(function () {
                        UiState.setGlobalLoading(false);
                    });
            }, 300);
        }

        function renderSearchResults(results) {
            const sugg = document.getElementById("search-suggestions");
            if (!sugg) return;

            if (!results.length) {
                sugg.classList.add("d-none");
                sugg.innerHTML = "";
                return;
            }

            sugg.classList.remove("d-none");
            const list = document.createElement("ul");
            list.className = "list-group list-group-flush";

            results.slice(0, 10).forEach(function (item, idx) {
                const li = document.createElement("li");
                li.className = "list-group-item list-group-item-action p-2 cursor-pointer";
                li.setAttribute("data-suggestion-idx", idx);

                // Build format-specific preview
                const preview = buildPreview(item.record);

                li.innerHTML = `<small>${preview}</small>`;
                list.appendChild(li);
            });

            sugg.innerHTML = "";
            sugg.appendChild(list);

            sugg.addEventListener("click", function (e) {
                const li = e.target.closest("[data-suggestion-idx]");
                if (li) {
                    const idx = parseInt(li.getAttribute("data-suggestion-idx"));
                    selectSearchResult(idx);
                }
            });
        }

        function selectSearchResult(idx) {
            if (!suggestionResults[idx]) return;

            const item = suggestionResults[idx];
            if (global.RecordManager) {
                // Pass id instead of rowNumber
                global.RecordManager.loadRecordForEdit(item.id, item.record);
            }

            clearSearch();
        }

        function clearSearch() {
            const searchInput = document.getElementById("search-query");
            const sugg = document.getElementById("search-suggestions");

            if (searchInput) searchInput.value = "";
            if (sugg) {
                sugg.classList.add("d-none");
                sugg.innerHTML = "";
            }

            suggestionResults = [];
        }

        return {
            handleSearch,
            clearSearch
        };
    })();

    global.SearchManager = SearchManager;
})(typeof window !== "undefined" ? window : this);


/**
 * Weekly Plan Panel
 * UI para gestión de planificación semanal de asistencia
 * Version: 3.1 - New Row Appears at Top
 */

(function (global) {
    const WeeklyPlanPanel = (() => {
        let referenceData = { clientes: [], empleados: [] };
        let clientIdMap = new Map();

        // Estado interno para navegación
        let currentContainer = null;
        let allRecordsCache = [];
        let currentOriginalVigencia = null; // Para saber qué plan estamos editando

        function init(refData) {
            referenceData = refData;
            buildClientIdMap_();
        }

        function formatClientLabel_(cli) {
            if (!cli) return '';
            if (typeof cli === 'string') return cli;
            const base = cli.razonSocial || cli.nombre || '';
            const cuit = cli.cuit ? ` (${cli.cuit})` : '';
            return (base + cuit).trim();
        }

        function buildClientIdMap_() {
            clientIdMap = new Map();
            const clientes = referenceData && referenceData.clientes ? referenceData.clientes : [];
            clientes.forEach(c => {
                if (!c || typeof c === 'string') return;
                const id = c.id || c.ID || c.ID_CLIENTE;
                if (!id) return;
                const base = (c.razonSocial || c.nombre || '').toString().trim();
                const label = formatClientLabel_(c);
                if (label) clientIdMap.set(label, String(id));
                if (base) clientIdMap.set(base, String(id));
            });
        }

        function getClientIdFromLabel_(label) {
            if (!label) return '';
            return clientIdMap.get(label) || '';
        }

        function formatDateForInput(v) {
            if (!v) return '';
            if (v instanceof Date && !isNaN(v)) {
                return v.toISOString().split('T')[0];
            }
            const d = new Date(v);
            if (!isNaN(d)) {
                return d.toISOString().split('T')[0];
            }
            return '';
        }

        function vigDesdeInputVal() {
            const el = document.getElementById('plan-vig-desde');
            return el ? el.value : '';
        }

        function vigHastaInputVal() {
            const el = document.getElementById('plan-vig-hasta');
            return el ? el.value : '';
        }

        let planGroupsCache = {};

        function renderList(container, records) {
            currentContainer = container;
            allRecordsCache = records || [];
            planGroupsCache = {}; // Limpiar caché

            // DEBUG: Ver estructura de los datos
            console.log('=== DEBUG WeeklyPlanPanel ===');
            console.log('Total records:', allRecordsCache.length);
            if (allRecordsCache.length > 0) {
                console.log('Primer record completo:', allRecordsCache[0]);
                console.log('Keys del primer record:', Object.keys(allRecordsCache[0]));
                const firstRecord = allRecordsCache[0].record || allRecordsCache[0];
                console.log('Contenido de record:', firstRecord);
                console.log('Keys de record:', Object.keys(firstRecord));
            }

            if (!container) return;

            // Agrupar por cliente y vigencia
            const grouped = {};
            allRecordsCache.forEach(item => {
                // Los registros vienen envueltos: {rowNumber, record, id}
                const r = item.record || item;

                // Intentar obtener cliente de varias formas (CLIENTE, Cliente, cliente)
                let clienteName = r.cliente || r.CLIENTE || r.Cliente;

                // Si es un objeto (referencia), intentar obtener nombre o razon social
                if (typeof clienteName === 'object' && clienteName !== null) {
                    clienteName = clienteName.razonSocial || clienteName.nombre || clienteName.toString();
                }

                const cliente = clienteName || "Sin asignar";

                // Clave única: Cliente + Vigencia
                const vigDesde = formatDateForInput(r["VIGENTE DESDE"] || r.vigDesde);
                const vigHasta = formatDateForInput(r["VIGENTE HASTA"] || r.vigHasta);
                const key = `${cliente}|${vigDesde}|${vigHasta}`;

                if (!grouped[key]) {
                    grouped[key] = {
                        cliente: cliente,
                        vigDesde: vigDesde,
                        vigHasta: vigHasta,
                        horasTotales: 0,
                        diasActivos: 0,
                        dias: new Set(),
                        rows: [] // Guardamos las filas para pasarlas al editor
                    };
                }

                // Normalizar horas (viene como string "3", "4", etc.)
                const horasValue = r["HORAS PLAN"] || r.HORAS_PLAN || r.horasPlan || 0;
                const horas = parseFloat(horasValue);

                // Normalizar día (viene como "LUNES", "MARTES", etc.)
                const dia = r["DIA SEMANA"] || r.DIA_SEMANA || r.diaSemana || r["DÍA DE LA SEMANA"];

                // Normalizar registro completo para la UI (camelCase)
                const normalizedRow = {
                    id: r.ID || r.id,
                    cliente: cliente,
                    empleado: r.EMPLEADO || r.empleado || r.Empleado,
                    diaSemana: dia,
                    horaEntrada: r["HORA ENTRADA"] || r.HORA_ENTRADA || r.horaEntrada,
                    horasPlan: horas,
                    observaciones: r.OBSERVACIONES || r.observaciones,
                    vigDesde: vigDesde,
                    vigHasta: vigHasta,
                    originalRecord: r
                };

                grouped[key].horasTotales += horas;
                grouped[key].diasActivos++;
                if (dia) grouped[key].dias.add(dia);
                grouped[key].rows.push(normalizedRow);
            });

            const listaClientes = Object.values(grouped);

            let html = '<div class="d-flex justify-content-between align-items-center mb-3">';
            html += '<h5 class="mb-0">Planes de Asistencia Semanal</h5>';
            html += '<div class="d-flex gap-2 align-items-center">';
            html += '<div class="form-check form-switch mb-0">';
            html += '<input class="form-check-input" type="checkbox" id="check-active-plans" checked>';
            html += '<label class="form-check-label small" for="check-active-plans">Solo vigentes</label>';
            html += '</div>';
            html += '<button class="btn btn-primary btn-sm" id="btn-nuevo-plan"><i class="bi bi-plus-lg me-1"></i>Nuevo Plan</button>';
            html += '</div>';
            html += '</div>';

            html += '<div class="card shadow-sm border-0"><div class="card-body p-0"><div class="table-responsive">';
            html += '<table class="table table-hover align-middle mb-0">';
            html += '<thead class="table-light"><tr>';
            html += '<th>Cliente</th>';
            html += '<th>Vigencia</th>';
            html += '<th class="text-center">Horas Semanales</th>';
            html += '<th>Días Programados</th>';
            html += '<th class="text-end">Acciones</th>';
            html += '</tr></thead><tbody>';

            if (listaClientes.length === 0) {
                html += '<tr><td colspan="4" class="text-center py-5 text-muted">No hay planes registrados.</td></tr>';
            } else {
                const today = new Date().toISOString().split('T')[0];

                listaClientes.forEach(item => {
                    // Filtro de vigencia
                    const isActive = (!item.vigDesde || item.vigDesde <= today) && (!item.vigHasta || item.vigHasta >= today);
                    const showActiveOnly = container.querySelector('#check-active-plans')?.checked ?? true; // Default true?

                    // Nota: El checkbox aún no existe en el DOM cuando construimos el string HTML, 
                    // así que necesitamos manejar esto post-render o re-renderizar.
                    // Por ahora, agregamos data-active attribute y filtramos con CSS o JS.

                    const diasStr = Array.from(item.dias).join(', ');
                    const vigenciaStr = (item.vigDesde || 'Inicio') + ' ➡ ' + (item.vigHasta || 'Fin');

                    // Estilo para filas vencidas (inactivas)
                    const rowStyle = isActive ? '' : 'background-color: #f1f5f9; color: #94a3b8;';
                    const badgeClass = isActive ? 'bg-success' : 'bg-secondary';
                    const textClass = isActive ? 'fw-semibold' : '';

                    html += `<tr class="plan-row" data-active="${isActive}" style="${rowStyle}">`;
                    html += `<td class="${textClass}">` + HtmlHelpers.escapeHtml(item.cliente) + '</td>';
                    html += '<td class="small">' + vigenciaStr + '</td>';
                    html += `<td class="text-center"><span class="badge ${badgeClass} rounded-pill">` + item.horasTotales.toFixed(1) + ' hs</span></td>';
                    html += '<td class="small">' + (diasStr || '-') + '</td>';
                    html += '<td class="text-end">';
                    // Guardamos key en data-key para recuperar
                    const key = `${item.cliente}|${item.vigDesde}|${item.vigHasta}`;

                    // Guardar filas en caché para recuperación segura
                    planGroupsCache[key] = item.rows;

                    html += `<button class="btn btn-sm btn-outline-primary me-1 btn-editar-plan" data-key="${HtmlHelpers.escapeHtml(key)}"><i class="bi bi-pencil-square me-1"></i>Editar</button>`;
                    html += '</td>';
                    html += '</tr>';
                });
            }

            html += '</tbody></table></div></div></div>';

            container.innerHTML = html;

            // Bind events
            const checkActive = container.querySelector('#check-active-plans');
            if (checkActive) {
                checkActive.addEventListener('change', (e) => {
                    const rows = container.querySelectorAll('.plan-row');
                    rows.forEach(r => {
                        if (e.target.checked && r.dataset.active === "false") {
                            r.style.display = 'none';
                        } else {
                            r.style.display = '';
                        }
                    });
                });
                // Trigger initial state
                checkActive.dispatchEvent(new Event('change'));
            }

            container.querySelectorAll('.btn-editar-plan').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const key = e.target.dataset.key;
                    const [cliente, desde, hasta] = key.split('|');

                    // Recuperar filas directamente del caché
                    const rows = planGroupsCache[key] || [];

                    if (rows.length === 0) {
                        console.warn("No se encontraron filas en caché para:", key);
                    }

                    switchToDetail(cliente, rows, { desde, hasta });
                });
            });

            const btnNuevo = container.querySelector('#btn-nuevo-plan');
            if (btnNuevo) {
                btnNuevo.addEventListener('click', () => {
                    switchToDetail(null, [], null); // Nuevo (sin cliente preseleccionado)
                });
            }
        }

        function switchToDetail(cliente, preloadedRows, originalVigencia) {
            if (!currentContainer) return;

            currentOriginalVigencia = originalVigencia; // Guardar vigencia original

            // Renderizar la vista de detalle (cards)
            render(currentContainer);

            // Si hay cliente, seleccionarlo automáticamente
            if (cliente) {
                const select = document.getElementById('field-CLIENTE');
                if (select) {
                    select.value = cliente;
                    // Si tenemos filas precargadas, usarlas directamente en lugar de fetch
                    if (preloadedRows && preloadedRows.length > 0) {
                        // Simular carga de horas pedidas (opcional, o fetch solo horas)
                        // Para simplificar, llamamos a buildWeeklyPlanPanel directamente
                        // Pero necesitamos infoHoras. Podemos hacer un fetch rápido solo de horas.

                        ApiService.callLatest('weekly-hours-' + cliente, 'getClientWeeklyRequestedHours', cliente)
                            .then(function (infoHoras) {
                                buildWeeklyPlanPanel(preloadedRows, cliente, infoHoras || null);
                            })
                            .catch(function () {
                                buildWeeklyPlanPanel(preloadedRows, cliente, null);
                            });
                    } else {
                        // Disparar evento change para cargar los datos (si no hay filas precargadas)
                        select.dispatchEvent(new Event('change'));
                    }
                }
            }

            // Agregar botón "Volver" al panel
            const panel = document.getElementById('plan-semanal-panel');
            if (panel) {
                const backBtnDiv = document.createElement('div');
                backBtnDiv.className = 'mb-3';
                backBtnDiv.innerHTML = '<button class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left me-1"></i>Volver al listado</button>';
                backBtnDiv.querySelector('button').addEventListener('click', () => {
                    renderList(currentContainer, allRecordsCache);
                });
                panel.insertBefore(backBtnDiv, panel.firstChild);
            }
        }

        function render(container) {
            currentContainer = container; // Actualizar referencia
            if (!container) return;

            // Fallback para datos de referencia
            if ((!referenceData.clientes || !referenceData.clientes.length) && typeof ReferenceService !== 'undefined') {
                const globalRef = ReferenceService.get();
                if (globalRef) referenceData = globalRef;
            }

            // Limpiar contenedor
            container.innerHTML = '';

            // Crear estructura base
            const panel = document.createElement("div");
            panel.id = "plan-semanal-panel";
            panel.className = "d-flex flex-column gap-3";

            // Agregar selector de cliente
            const selectorDiv = document.createElement("div");
            selectorDiv.className = "card shadow-sm p-3";
            selectorDiv.innerHTML = `
                <div class="row g-3 align-items-end">
                    <div class="col-12 col-md-6">
                        <label class="form-label fw-bold mb-1">Cliente</label>
                        <select id="field-CLIENTE" class="form-select">
                            <option value="">Seleccioná un cliente...</option>
                            ${buildClienteOptions()}
                        </select>
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="form-label small text-muted fw-semibold mb-1">Vigente desde</label>
                        <input type="date" id="plan-vig-desde" class="form-control">
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="form-label small text-muted fw-semibold mb-1">Vigente hasta</label>
                        <input type="date" id="plan-vig-hasta" class="form-control">
                    </div>
                </div>
            `;

            panel.appendChild(selectorDiv);

            // Contenedor para las cards
            const cardsContainer = document.createElement("div");
            cardsContainer.id = "plan-semanal-cards-container";
            panel.appendChild(cardsContainer);

            container.appendChild(panel);

            // Bind eventos
            const clienteSelect = document.getElementById("field-CLIENTE");
            if (clienteSelect) {
                clienteSelect.addEventListener("change", () => {
                    // Si cambiamos de cliente manualmente, es un "Nuevo Plan" para ese cliente,
                    // así que limpiamos originalVigencia.
                    currentOriginalVigencia = null;
                    fetchWeeklyPlanForClient();
                });
            }
        }

        function buildClienteOptions() {
            return referenceData.clientes.map(c => {
                const nombre = c.razonSocial || c.nombre || c;
                return `<option value="${HtmlHelpers.escapeHtml(nombre)}">${HtmlHelpers.escapeHtml(nombre)}</option>`;
            }).join('');
        }

        function setup() {
            // Deprecated: usar render()
            const container = document.getElementById("form-fields");
            if (container) render(container);
        }

        function fetchWeeklyPlanForClient() {
            const container = document.getElementById("plan-semanal-cards-container");
            const clienteSelect = document.getElementById("field-CLIENTE");
            const targetId = container ? "plan-semanal-cards-container" : "plan-semanal-panel";

            if (!clienteSelect) return;

            const cliente = clienteSelect.value;
            const idCliente = getClientIdFromLabel_(cliente);
            if (!cliente) {
                // Limpiar si no hay cliente
                if (container) container.innerHTML = '';
                return;
            }

            // Fix: Pasar string vacío en lugar de null para evitar que se imprima "null"
            UiState.renderLoading(
                targetId,
                "",
                "Cargando plan de <strong>" + HtmlHelpers.escapeHtml(cliente) + "</strong>..."
            );

            ApiService.callLatest('weekly-plan-' + cliente, 'getWeeklyPlanForClient', cliente, idCliente)
                .then(function (rows) {
                    if (rows && rows.ignored) return;
                    const planRows = Array.isArray(rows) ? rows : [];
                    const currentClienteEl = document.getElementById("field-CLIENTE");
                    const currentCliente = currentClienteEl ? currentClienteEl.value : '';

                    // Si cambió el cliente mientras cargaba, ignorar
                    if (currentCliente !== cliente) return;

                    return ApiService.callLatest('weekly-hours-' + cliente, 'getClientWeeklyRequestedHours', cliente)
                        .then(function (infoHoras) {
                            if (infoHoras && infoHoras.ignored) return;
                            buildWeeklyPlanPanel(planRows, cliente, infoHoras || null);
                        })
                        .catch(function (err2) {
                            console.error("Error obteniendo horas pedidas:", err2);
                            buildWeeklyPlanPanel(planRows, cliente, null);
                        });
                })
                .catch(function (err) {
                    UiState.renderLoading(
                        targetId,
                        "Error",
                        "Error al cargar plan: " + HtmlHelpers.escapeHtml(err.message)
                    );
                });
        }

        function buildWeeklyPlanPanel(rows, cliente, infoHoras) {
            // Intentar usar el contenedor de cards, fallback al panel principal
            let panel = document.getElementById("plan-semanal-cards-container");
            if (!panel) panel = document.getElementById("plan-semanal-panel");

            if (!panel) return;

            // Ocultar footer del modal si estamos en un modal
            const modalFooter = document.querySelector('.modal-footer-custom');
            if (modalFooter) modalFooter.style.display = 'none';

            if (!rows.length) {
                rows = [{
                    empleado: "",
                    diaSemana: "",
                    horaEntrada: "",
                    horasPlan: "",
                    vigDesde: vigDesdeInputVal(),
                    vigHasta: vigHastaInputVal(),
                    id: "",
                    observaciones: ""
                }];
            }
            const vigDesdeVal = formatDateForInput(rows[0].vigDesde || vigDesdeInputVal());
            const vigHastaVal = formatDateForInput(rows[0].vigHasta || vigHastaInputVal());

            // Agrupar por empleado
            const groupedByEmpleado = {};
            rows.forEach((r, idx) => {
                const emp = r.empleado || "Sin asignar";
                if (!groupedByEmpleado[emp]) {
                    groupedByEmpleado[emp] = [];
                }
                groupedByEmpleado[emp].push({ ...r, originalIdx: idx });
            });

            let html = "";

            // Header solo si estamos en fallback
            if (panel.id === "plan-semanal-panel") {
                html += '<div class="mt-2 p-3 lt-surface lt-surface--subtle">';
                html += '<div class="d-flex justify-content-between align-items-center mb-3">';
                html += '<div>';
                html += '<div class="fw-bold mb-1 text-primary"><i class="bi bi-calendar-week me-1"></i>Plan semanal del cliente</div>';
                html += '<div class="small mb-2">Cliente: <strong class="text-primary-emphasis">' + HtmlHelpers.escapeHtml(cliente) + "</strong></div>";
                html += '</div>';
                html += '</div>';
            }

            // Sección superior: Horas contratadas y Botón Agregar
            html += '<div class="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2">';

            // Horas contratadas
            let horasHtml = '';
            if (infoHoras) {
                const partes = [];
                const pushSiTieneHoras = (label, valor) => {
                    const num = Number(valor || 0);
                    if (num > 0) {
                        partes.push('<span class="lt-chip lt-chip--success">' + label + ': ' + num + ' hs</span>');
                    }
                };

                pushSiTieneHoras('Lu', infoHoras.lunes);
                pushSiTieneHoras('Ma', infoHoras.martes);
                pushSiTieneHoras('Mi', infoHoras.miercoles);
                pushSiTieneHoras('Ju', infoHoras.jueves);
                pushSiTieneHoras('Vi', infoHoras.viernes);
                pushSiTieneHoras('Sa', infoHoras.sabado);
                pushSiTieneHoras('Do', infoHoras.domingo);

                if (partes.length) {
                    horasHtml += '<div class="lt-surface lt-surface--subtle p-2 flex-grow-1 border-start border-success border-3">';
                    horasHtml += '<div class="small fw-semibold text-muted mb-1">Horas contratadas por día</div>';
                    horasHtml += '<div class="d-flex flex-wrap gap-1">' + partes.join('') + '</div>';
                    horasHtml += '</div>';
                }
            }
            if (!horasHtml) horasHtml = '<div></div>'; // Spacer
            html += horasHtml;

            // Botón Agregar día (Movido arriba)
            html += '<button type="button" class="btn btn-sm btn-outline-secondary lt-btn-compact text-nowrap" data-action="add-plan-row">';
            html += '<i class="bi bi-plus-lg me-1"></i>Agregar día</button>';

            html += '</div>'; // End top section

            // Cards por empleado
            html += '<div id="weekly-plan-cards" class="d-flex flex-column gap-3">';

            Object.keys(groupedByEmpleado).forEach((empleado, empIdx) => {
                const empleadoRows = groupedByEmpleado[empleado];
                const collapseId = "plan-emp-" + empIdx;
                const totalHoras = empleadoRows.reduce((sum, r) => sum + (parseFloat(r.horasPlan) || 0), 0);
                const activeDays = empleadoRows.length;

                // Lista de días
                const diasList = [...new Set(empleadoRows.map(r => r.diaSemana).filter(Boolean))].join(", ");
                const diasLabel = diasList || (empleadoRows.length + ' día' + (empleadoRows.length !== 1 ? 's' : ''));

                // Determinar si debe estar abierto:
                // 1. Si es "Sin asignar" (donde van los nuevos)
                // 2. O si no hay ninguno abierto (opcional, aquí lo dejamos cerrado por defecto excepto Sin Asignar)
                const isSinAsignar = empleado === "Sin asignar";
                const isOpen = isSinAsignar;

                html += '<div class="card shadow-sm border-0">';

                // Card Header
                html += '<div class="card-header py-2 px-3 bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 lt-clickable" ';
                html += 'data-bs-toggle="collapse" data-bs-target="#' + collapseId + '" ';
                html += 'aria-expanded="' + isOpen + '" aria-controls="' + collapseId + '" role="button">';

                html += '<div class="d-flex flex-wrap gap-2 align-items-center">';
                html += '<span class="fw-semibold text-dark"><i class="bi bi-person-circle me-1"></i>' + HtmlHelpers.escapeHtml(empleado) + '</span>';
                html += '<span class="badge bg-primary bg-opacity-75">' + diasLabel + '</span>';
                html += '<span class="badge text-bg-success">' + totalHoras.toFixed(1) + ' hs totales</span>';
                html += '</div>';

                html += '<div class="d-flex gap-2 align-items-center">';
                html += '<span class="text-muted small">' + activeDays + ' día(s)</span>';
                html += '<span class="text-muted fw-semibold" data-role="collapse-arrow">' + (isOpen ? '▲' : '▼') + '</span>';
                html += '</div>';

                html += '</div>';

                // Card Body (collapsible)
                // Fix: Quitar 'show' por defecto, solo ponerlo si isOpen es true
                html += '<div id="' + collapseId + '" class="collapse ' + (isOpen ? 'show' : '') + '">';
                html += '<div class="card-body pt-2 pb-3 px-3">';

                // Días del empleado
                empleadoRows.forEach((r) => {
                    const rowId = "plan-row-" + r.originalIdx;
                    const empleadoOptions = HtmlHelpers.getEmpleadoOptionsHtml(r.empleado || "", referenceData.empleados);
                    const diaOptions = HtmlHelpers.getDiaOptionsHtml(r.diaSemana || "");
                    const horaFormatted = HtmlHelpers.formatHoraEntradaForInput(r.horaEntrada);
                    html += '<div class="lt-surface lt-surface--subtle p-3 mb-2">';

                    // Header de día
                    html += '<div class="d-flex justify-content-between align-items-center mb-2">';
                    html += '<div class="d-flex gap-2 align-items-center">';
                    html += '<span class="badge bg-primary bg-opacity-75 text-white">Plan</span>';
                    html += '<span class="fw-semibold">' + (r.diaSemana || 'Día no seleccionado') + '</span>';
                    if (r.horasPlan) {
                        html += '<span class="text-muted">• ' + r.horasPlan + ' hs</span>';
                    }
                    html += '</div>';
                    html += '<button type="button" class="btn btn-sm btn-outline-danger lt-btn-icon" data-action="delete-plan-row" data-idx="' + r.originalIdx + '"><i class="bi bi-trash"></i></button>';
                    html += '</div>';

                    // Campos del día
                    html += '<div class="row g-2">';

                    html += '<div class="col-12 col-md-6">';
                    html += '<label class="small text-muted fw-semibold d-block mb-1">Empleado</label>';
                    html += '<select class="form-select form-select-sm bg-white border" id="' + rowId + '-empleado">' + empleadoOptions + '</select>';
                    html += '</div>';

                    html += '<div class="col-6 col-md-3">';
                    html += '<label class="small text-muted fw-semibold d-block mb-1">Día</label>';
                    html += '<select class="form-select form-select-sm text-center bg-white border" id="' + rowId + '-dia">' + diaOptions + '</select>';
                    html += '</div>';

                    html += '<div class="col-6 col-md-3">';
                    html += '<label class="small text-muted fw-semibold d-block mb-1">Hora entrada</label>';
                    html += '<input type="time" class="form-control form-control-sm text-center" id="' + rowId + '-horaEntrada" value="' + HtmlHelpers.escapeHtml(horaFormatted) + '" step="1800">';
                    html += '</div>';

                    html += '<div class="col-6 col-md-3">';
                    html += '<label class="small text-muted fw-semibold d-block mb-1">Horas plan</label>';
                    html += '<input type="number" step="0.5" min="0" class="form-control form-control-sm text-end" id="' + rowId + '-horasPlan" value="' + HtmlHelpers.escapeHtml(r.horasPlan != null ? String(r.horasPlan) : "") + '">';
                    html += '</div>';

                    html += '<div class="col-12 col-md-6">';
                    html += '<label class="small text-muted fw-semibold d-block mb-1">Observaciones</label>';
                    html += '<input type="text" class="form-control form-control-sm" id="' + rowId + '-obs" value="' + HtmlHelpers.escapeHtml(r.observaciones || "") + '">';
                    html += '</div>';

                    html += '<input type="hidden" id="' + rowId + '-id" value="' + HtmlHelpers.escapeHtml(r.id || "") + '">';

                    html += '</div>'; // row
                    html += '</div>'; // border rounded
                });

                html += '</div>'; // card-body
                html += '</div>'; // collapse
                html += '</div>'; // card
            });

            html += '</div>'; // weekly-plan-cards

            // Botones de acción (Solo Guardar, Agregar se movió arriba)
            html += '<div class="d-flex justify-content-end align-items-center mt-3 pt-3 border-top">';
            html += '<button type="button" class="btn btn-sm btn-success lt-btn-compact" ';
            html += 'data-action="save-weekly-plan" id="btn-save-weekly"><i class="bi bi-save2 me-1"></i>Guardar plan del cliente</button>';
            html += "</div>";

            if (panel.id === "plan-semanal-panel") {
                html += "</div>";
            }

            panel.innerHTML = html;

            // Set vigencias en inputs superiores
            const vigDesdeInput = document.getElementById('plan-vig-desde');
            const vigHastaInput = document.getElementById('plan-vig-hasta');
            if (vigDesdeInput && rows[0]) vigDesdeInput.value = formatDateForInput(rows[0].vigDesde || vigDesdeInputVal());
            if (vigHastaInput && rows[0]) vigHastaInput.value = formatDateForInput(rows[0].vigHasta || vigHastaInputVal());

            // Bind collapse arrows
            bindWeeklyPlanCollapseArrows();
            attachWeeklyPlanHandlers(panel);
        }

        function bindWeeklyPlanCollapseArrows() {
            const panel = document.getElementById("plan-semanal-panel");
            if (!panel) return;

            const collapses = panel.querySelectorAll(".collapse");
            collapses.forEach(function (col) {
                const targetId = col.id;
                const header = panel.querySelector(`[data-bs-target="#${targetId}"]`);
                if (!header) return;
                const arrowEl = header.querySelector('[data-role="collapse-arrow"]');
                if (!arrowEl) return;

                const updateArrow = function () {
                    const isShown = col.classList.contains("show");
                    arrowEl.textContent = isShown ? "▲" : "▼";
                    header.setAttribute("aria-expanded", isShown ? "true" : "false");
                };

                col.addEventListener("shown.bs.collapse", updateArrow);
                col.addEventListener("hidden.bs.collapse", updateArrow);
                updateArrow();
            });
        }

        function attachWeeklyPlanHandlers(panel) {
            panel.addEventListener("click", function (e) {
                const target = e.target;
                const action = target.getAttribute("data-action");

                if (action === "add-plan-row") {
                    addEmptyPlanRow();
                } else if (action === "delete-plan-row") {
                    const idx = target.getAttribute("data-idx");
                    deletePlanRow(idx);
                } else if (action === "save-weekly-plan") {
                    saveWeeklyPlan();
                }
            });
        }

        function addEmptyPlanRow() {
            // Simplemente recargamos el plan con una fila nueva agregada
            const clienteSelect = document.getElementById("field-CLIENTE");
            if (!clienteSelect) return;

            const cliente = clienteSelect.value;
            if (!cliente) {
                if (Alerts) Alerts.showAlert("Seleccioná un cliente primero.", "warning");
                return;
            }

            // Obtener las filas actuales del DOM
            const panel = document.getElementById("plan-semanal-panel");
            if (!panel) return;

            const currentRows = [];
            const allInputs = panel.querySelectorAll('[id^="plan-row-"]');
            const processedIndices = new Set();

            allInputs.forEach(input => {
                const match = input.id.match(/plan-row-(\d+)-/);
                if (match && !processedIndices.has(match[1])) {
                    const idx = match[1];
                    processedIndices.add(idx);

                    const empleadoSelect = document.getElementById(`plan-row-${idx}-empleado`);
                    const diaSelect = document.getElementById(`plan-row-${idx}-dia`);
                    const horaInput = document.getElementById(`plan-row-${idx}-horaEntrada`);
                    const horasInput = document.getElementById(`plan-row-${idx}-horasPlan`);
                    const obsInput = document.getElementById(`plan-row-${idx}-obs`);

                    const row = {
                        empleado: empleadoSelect ? empleadoSelect.value : "",
                        diaSemana: diaSelect ? diaSelect.value : "",
                        horaEntrada: horaInput ? horaInput.value : "",
                        horasPlan: horasInput ? horasInput.value : "",
                        vigDesde: vigDesdeInputVal(),
                        vigHasta: vigHastaInputVal(),
                        observaciones: obsInput ? obsInput.value : ""
                    };

                    // Solo agregar si no es una fila completamente vacía
                    if (row.empleado || row.diaSemana || row.horaEntrada || row.horasPlan || row.observaciones) {
                        currentRows.push(row);
                    }
                }
            });

            // Agregar nueva fila vacía AL INICIO (para que aparezca arriba)
            currentRows.unshift({
                empleado: "",
                diaSemana: "",
                horaEntrada: "",
                horasPlan: "",
                vigDesde: vigDesdeInputVal(),
                vigHasta: vigHastaInputVal(),
                observaciones: ""
            });

            // Reconstruir el panel
            buildWeeklyPlanPanel(currentRows, cliente, null);

            // Expandir automáticamente el grupo "Sin asignar"
            setTimeout(() => {
                const sinAsignarCollapse = document.querySelector('[id*="collapse-Sin asignar"]');
                if (sinAsignarCollapse && !sinAsignarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(sinAsignarCollapse, { show: true });
                }
            }, 100);
        }

        function deletePlanRow(idx) {
            const clienteSelect = document.getElementById("field-CLIENTE");
            if (!clienteSelect) return;

            const cliente = clienteSelect.value;
            if (!cliente) return;

            const panel = document.getElementById("plan-semanal-panel");
            if (!panel) return;

            // Obtener todas las filas actuales excepto la que queremos eliminar
            const currentRows = [];
            const allInputs = panel.querySelectorAll('[id^="plan-row-"]');
            const processedIndices = new Set();

            allInputs.forEach(input => {
                const match = input.id.match(/plan-row-(\d+)-/);
                if (match && !processedIndices.has(match[1])) {
                    const currentIdx = match[1];

                    // Saltar la fila que queremos eliminar
                    if (currentIdx === String(idx)) {
                        processedIndices.add(currentIdx);
                        return;
                    }

                    processedIndices.add(currentIdx);

                    const empleadoSelect = document.getElementById(`plan-row-${currentIdx}-empleado`);
                    const diaSelect = document.getElementById(`plan-row-${currentIdx}-dia`);
                    const horaInput = document.getElementById(`plan-row-${currentIdx}-horaEntrada`);
                    const horasInput = document.getElementById(`plan-row-${currentIdx}-horasPlan`);
                    const obsInput = document.getElementById(`plan-row-${currentIdx}-obs`);

                    currentRows.push({
                        empleado: empleadoSelect ? empleadoSelect.value : "",
                        diaSemana: diaSelect ? diaSelect.value : "",
                        horaEntrada: horaInput ? horaInput.value : "",
                        horasPlan: horasInput ? horasInput.value : "",
                        vigDesde: vigDesdeInputVal(),
                        vigHasta: vigHastaInputVal(),
                        observaciones: obsInput ? obsInput.value : ""
                    });
                }
            });

            // Reconstruir el panel sin la fila eliminada
            buildWeeklyPlanPanel(currentRows, cliente, null);
        }

        function saveWeeklyPlan() {
            const clienteSelect = document.getElementById("field-CLIENTE");
            if (!clienteSelect) return;

            const cliente = clienteSelect.value;
            const idCliente = getClientIdFromLabel_(cliente);
            if (!cliente) {
                if (Alerts) Alerts.showAlert("Seleccioná un cliente primero.", "warning");
                return;
            }

            const panel = document.getElementById("plan-semanal-panel");
            if (!panel) return;

            // Recolectar filas por índice de los inputs
            const itemsMap = new Map();
            const inputs = panel.querySelectorAll('[id^="plan-row-"]');
            inputs.forEach((el) => {
                // Fix: Use unambiguous IDs
                const match = el.id.match(/plan-row-(\d+)-(empleado|dia|horaEntrada|horasPlan|obs|id)/);
                if (!match) return;
                const idx = match[1];
                const field = match[2];

                if (!itemsMap.has(idx)) {
                    itemsMap.set(idx, {
                        id: "",
                        empleado: "",
                        diaSemana: "",
                        horaEntrada: "",
                        horasPlan: "",
                        vigDesde: vigDesdeInputVal(),
                        vigHasta: vigHastaInputVal(),
                        observaciones: ""
                    });
                }
                const obj = itemsMap.get(idx);
                const val = el.value;

                if (field === "id") obj.id = val;
                if (field === "empleado") obj.empleado = val;
                if (field === "dia") obj.diaSemana = val;
                if (field === "horaEntrada") obj.horaEntrada = val;
                if (field === "horasPlan") obj.horasPlan = val;
                if (field === "obs") obj.observaciones = val;
            });

            const items = Array.from(itemsMap.values()).filter(item =>
                item.id || item.empleado || item.diaSemana || item.horasPlan || item.observaciones
            );

            if (!items.length) {
                UiState && UiState.setGlobalLoading(false);
                setSavingState(false);
                Alerts && Alerts.showAlert("No hay filas para guardar. Agregá al menos un día.", "warning");
                return;
            }

            setSavingState(true);
            UiState.setGlobalLoading(true, "Guardando plan semanal...");

            // Pasamos currentOriginalVigencia para que el backend sepa qué reemplazar
            ApiService.call('saveWeeklyPlanForClient', cliente, items, currentOriginalVigencia, idCliente)
                .then(function () {
                    if (Alerts) Alerts.showAlert("✅ Plan semanal guardado correctamente.", "success");
                    // Recargar la lista completa desde el servidor
                    reloadList();
                })
                .catch(function (err) {
                    if (Alerts) Alerts.showAlert("Error al guardar plan: " + err.message, "danger");
                })
                .finally(function () {
                    UiState.setGlobalLoading(false);
                    setSavingState(false);
                });
        }

        function setSavingState(isSaving) {
            const btn = document.getElementById('btn-save-weekly');
            if (!btn) return;
            if (isSaving) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Guardando...';
            } else {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-save2 me-1"></i>Guardar plan del cliente';
            }
        }

        function reloadList() {
            if (!currentContainer) return;

            // Mostrar loading en el contenedor actual
            currentContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><div class="mt-2">Actualizando lista...</div></div>';

            ApiService.call("searchRecords", "ASISTENCIA_PLAN", "")
                .then(function (records) {
                    renderList(currentContainer, records || []);
                })
                .catch(function (err) {
                    console.error("Error recargando lista:", err);
                    currentContainer.innerHTML = '<div class="alert alert-danger">Error al actualizar la lista.</div>';
                });
        }

        return {
            init,
            setup,
            render,
            renderList,
            fetchWeeklyPlanForClient,
            reloadList
        };
    })();

    global.WeeklyPlanPanel = WeeklyPlanPanel;
})(typeof window !== "undefined" ? window : this);


/**
 * Daily Attendance UI
 * Maneja la captura de asistencia diaria basada en el plan y la carga fuera de plan.
 */

(function (global) {
    const AttendanceDailyUI = (() => {
        let state = {
            fecha: "",
            rows: [],
            loading: false
        };
        let reference = { clientes: [], empleados: [] };
        let rootEl = null;
        let pendingFecha = null;
        let pendingFocus = null;

        function resetState(fecha) {
            state = {
                fecha: fecha || getTodayIso(),
                rows: [],
                loading: false
            };
        }

        function render(container) {
            rootEl = container;
            reference = ReferenceService && ReferenceService.get ? ReferenceService.get() : { clientes: [], empleados: [] };
            const initialDate = pendingFecha || getTodayIso();
            resetState(initialDate);
            pendingFecha = null;

            container.innerHTML = buildBaseLayout();
            bindBaseEvents();
            loadPlan(state.fecha);
        }

        function getTodayIso() {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
        }

        function buildBaseLayout() {
            return `
                <div id="attendance-daily-root" class="d-flex flex-column gap-3">
                    <div class="lt-surface lt-surface--subtle p-2">
                        <div class="lt-toolbar">
                            <div class="d-flex align-items-center gap-2 flex-shrink-0">
                                <label class="form-label small fw-semibold text-muted mb-0">Fecha</label>
                                <input type="date" id="attendance-date" class="form-control form-control-sm" value="${state.fecha}" style="width: 140px;">
                            </div>
                            <div class="d-flex align-items-center gap-2 flex-shrink-0">
                                <button type="button" id="attendance-add-extra" class="btn btn-sm btn-primary lt-btn-compact text-nowrap">
                                    <i class="bi bi-plus-circle me-1"></i>Fuera de plan
                                </button>
                            </div>
                            <div id="attendance-summary" class="d-flex flex-nowrap gap-2 flex-shrink-0"></div>
                        </div>
                    </div>

                    <div class="lt-surface p-0 position-relative">
                        <div id="attendance-loading" class="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center bg-white bg-opacity-75 d-none">
                            <div class="text-center">
                                <div class="spinner-border text-primary mb-2" role="status"></div>
                                <div class="small text-muted">Cargando asistencia del día...</div>
                            </div>
                        </div>

                        <div id="attendance-cards" class="d-flex flex-column gap-3 p-2">
                            <div class="text-center text-muted py-4">Cargando...</div>
                        </div>
                    </div>
                </div>
            `;
        }

        function bindBaseEvents() {
            const dateInput = rootEl.querySelector("#attendance-date");
            const addBtn = rootEl.querySelector("#attendance-add-extra");

            if (dateInput) {
                dateInput.addEventListener("change", function () {
                    state.fecha = this.value;
                    state.rows = [];
                    renderRows("Cargando...");
                    updateSummary();
                    loadPlan(state.fecha);
                });
            }

            if (addBtn) {
                addBtn.addEventListener("click", function () {
                    addExtraRow();
                });
            }
        }

        function setLoading(isLoading) {
            state.loading = !!isLoading;
            const overlay = rootEl.querySelector("#attendance-loading");
            if (overlay) overlay.classList.toggle("d-none", !isLoading);
        }

        function normalizeRow(row, extra, idx) {
            return {
                uid: (extra ? "extra-" : "plan-") + (idx != null ? idx : Date.now()),
                cliente: row && row.cliente ? String(row.cliente) : "",
                idCliente: row && row.idCliente ? row.idCliente : "",
                empleado: row && row.empleado ? String(row.empleado) : "",
                idEmpleado: row && row.idEmpleado ? row.idEmpleado : "",
                horaPlan: row && row.horaPlan ? String(row.horaPlan) : "",
                horasPlan: row && row.horasPlan !== undefined && row.horasPlan !== null ? row.horasPlan : "",
                asistencia: row && row.asistencia ? true : false,
                horasReales: row && row.horasReales !== undefined && row.horasReales !== null ? row.horasReales : "",
                observaciones: row && row.observaciones ? String(row.observaciones) : "",
                asistenciaRowNumber: row && row.asistenciaRowNumber ? row.asistenciaRowNumber : null,
                idAsistencia: row && (row.idAsistencia != null && row.idAsistencia !== "") ? row.idAsistencia : null,
                fueraDePlan: !!extra || !!(row && row.fueraDePlan)
            };
        }

        function loadPlan(fecha) {
            if (!fecha) {
                if (Alerts) Alerts.showAlert("Elegí una fecha para cargar asistencia.", "warning");
                return;
            }

            state.rows = [];
            renderRows("Cargando...");
            updateSummary();
            setLoading(true);
            // callLatest para evitar respuestas viejas que pisan la vista
            ApiService.callLatest("attendance-plan-" + fecha, "getDailyAttendancePlan", fecha)
                .then(function (rows) {
                    if (rows && rows.ignored) return;
                    const data = Array.isArray(rows) ? rows : [];
                    state.rows = data.map((r, idx) => normalizeRow(r, false, idx));

                    applyPendingFocus();

                    if (!state.rows.length) {
                        // Si no hay plan para el día, ofrecer fila vacía para cargar fuera de plan
                        addExtraRow(true);
                    }
                    renderRows();
                })
                .catch(function (err) {
                    console.error("Error cargando plan diario:", err);
                    state.rows = [];
                    renderRows("No pudimos cargar el plan diario. Intentá de nuevo.");
                    if (Alerts) Alerts.showAlert("Error al cargar plan diario: " + err.message, "danger");
                })
                .finally(function () {
                    setLoading(false);
                    updateSummary();
                });
        }

        function addExtraRow(skipRender) {
            const newRow = normalizeRow({
                asistencia: true
            }, true);
            newRow._autoOpen = true;

            // Colocamos extras arriba para visibilidad inmediata
            state.rows.unshift(newRow);

            if (!skipRender) {
                renderRows();
                updateSummary();
            }
        }

        function renderRows(emptyMessage) {
            const list = rootEl.querySelector("#attendance-cards");
            if (!list) return;

            list.innerHTML = "";

            if (!state.rows.length) {
                const div = document.createElement("div");
                div.className = "text-center text-muted py-4";
                div.textContent = emptyMessage || "No hay plan para la fecha seleccionada. Podés agregar asistencia fuera de plan.";
                list.appendChild(div);
                return;
            }

            const frag = document.createDocumentFragment();

            const isPastDay = isDatePast(state.fecha);

            state.rows.forEach(function (row, idx) {
                const card = document.createElement("div");
                card.className = "card shadow-sm border-0";
                if (row.fueraDePlan) {
                    card.classList.add("border", "border-secondary", "border-opacity-50");
                }

                const clienteSelect = buildClienteSelect(row.uid, row.cliente, !row.fueraDePlan);
                const empleadoSelect = buildEmpleadoSelect(row.uid, row.empleado, !row.fueraDePlan);
                const horasPlanText = formatHorasPlan(row.horasPlan);
                const horaPlanText = formatHoraPlan(row.horaPlan);
                const collapseId = "att-card-" + row.uid;
                const isOpen = row._autoOpen === true; // abrir si se acaba de agregar fuera de plan
                const statusLabel = row.asistencia ? "Asistió" : "No asistió";
                const statusClass = row.asistencia ? "bg-success bg-opacity-75 text-white" : "bg-danger bg-opacity-75 text-white";
                const arrow = isOpen ? "▲" : "▼";

                // Color suave para fechas pasadas según asistencia
                let headerStyle = "";
                let cardStyle = "";
                if (isPastDay) {
                    if (row.asistencia) {
                        cardStyle = "background-color:#f7fff9;border-color:#b7e6c3;";
                        headerStyle = "background-color:#f0fff3;";
                    } else {
                        cardStyle = "background-color:#fff6f6;border-color:#f2c8c8;";
                        headerStyle = "background-color:#fff0f0;";
                    }
                }

                if (cardStyle) {
                    card.setAttribute("style", cardStyle);
                }

                card.innerHTML = `
                    <div class="card-header py-2 px-3 bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 att-card-toggle"
                         style="${headerStyle}"
                         data-bs-toggle="collapse"
                         data-bs-target="#${collapseId}"
                         aria-expanded="${isOpen}"
                         aria-controls="${collapseId}"
                         role="button">
                        <div class="d-flex flex-wrap gap-2 align-items-center">
                            <span class="badge px-2 ${statusClass}">${statusLabel}</span>
                            <span class="fw-semibold">${HtmlHelpers.escapeHtml(row.empleado || "Empleado")}</span>
                            <span class="text-muted">•</span>
                            <span class="fw-semibold text-primary">${HtmlHelpers.escapeHtml(row.cliente || "Cliente")}</span>
                        </div>
                        <div class="d-flex gap-2 align-items-center">
                            ${row.fueraDePlan ? '<span class="badge bg-secondary">Fuera de plan</span>' : '<span class="badge text-bg-success">Plan</span>'}
                            <span class="text-muted fw-semibold" data-role="collapse-arrow" aria-hidden="true">${arrow}</span>
                        </div>
                    </div>
                    <div id="${collapseId}" class="collapse att-collapse ${isOpen ? "show" : ""}">
                        <div class="card-body pt-2 pb-3 px-3">
                            <div class="row g-3">
                                <div class="col-12 col-md-6">
                                    <label class="small text-muted fw-semibold d-block mb-1">Cliente</label>
                                    ${clienteSelect}
                                </div>
                                <div class="col-12 col-md-6">
                                    <label class="small text-muted fw-semibold d-block mb-1">Empleado</label>
                                    ${empleadoSelect}
                                </div>
                            </div>

                            <div class="row g-3 align-items-center mt-1">
                                <div class="col-12 col-md-3">
                                    <div class="small text-muted fw-semibold">Horas planificadas</div>
                                    <div class="fw-semibold">${horasPlanText}</div>
                                    <div class="small text-muted">${horaPlanText || "&nbsp;"}</div>
                                </div>
                                <div class="col-6 col-md-2 text-center">
                                    <label class="small text-muted fw-semibold mb-1 d-block">Asistió</label>
                                    <input type="checkbox" class="form-check-input" data-role="asistencia-check" data-uid="${row.uid}" ${row.asistencia ? "checked" : ""}>
                                </div>
                                <div class="col-6 col-md-3">
                                    <label class="small text-muted fw-semibold mb-1 d-block">Horas reales</label>
                                    <input type="number" step="0.5" min="0" class="form-control form-control-sm text-end" data-role="horas-reales" data-uid="${row.uid}" value="${row.horasReales != null ? HtmlHelpers.escapeHtml(String(row.horasReales)) : ""}">
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="small text-muted fw-semibold mb-1 d-block">Observaciones</label>
                                    <textarea rows="2" class="form-control form-control-sm" data-role="observaciones" data-uid="${row.uid}">${HtmlHelpers.escapeHtml(row.observaciones)}</textarea>
                                </div>
                                <div class="col-12 col-md-1 text-end">
                                    ${row.fueraDePlan ? `<button class="btn btn-sm btn-outline-danger" data-role="remove-row" data-uid="${row.uid}" title="Quitar fila">✕</button>` : '<span class="text-muted small d-inline-block mt-3"> </span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                frag.appendChild(card);
            });

            list.appendChild(frag);
            bindCollapseArrows();
            attachRowEvents();
        }

        function bindCollapseArrows() {
            const collapses = rootEl.querySelectorAll(".att-collapse");
            collapses.forEach(function (col) {
                const targetId = col.id;
                const header = rootEl.querySelector(`[data-bs-target="#${targetId}"]`);
                if (!header) return;
                const arrowEl = header.querySelector('[data-role="collapse-arrow"]');
                if (!arrowEl) return;

                const updateArrow = function () {
                    const isShown = col.classList.contains("show");
                    arrowEl.textContent = isShown ? "▲" : "▼";
                    header.setAttribute("aria-expanded", isShown ? "true" : "false");
                };

                col.addEventListener("shown.bs.collapse", updateArrow);
                col.addEventListener("hidden.bs.collapse", updateArrow);
                updateArrow();
            });
        }

        function buildClienteSelect(uid, selected, disabled) {
            const opts = ['<option value="">Cliente...</option>'];
            let found = false;
            (reference.clientes || []).forEach(cli => {
                const label = cli.razonSocial || cli.nombre || cli.CLIENTE || cli;
                if (!label) return;
                if (label === selected) found = true;
                const sel = label === selected ? " selected" : "";
                opts.push(`<option value="${HtmlHelpers.escapeHtml(label)}"${sel}>${HtmlHelpers.escapeHtml(label)}</option>`);
            });
            if (selected && !found) {
                opts.push(`<option value="${HtmlHelpers.escapeHtml(selected)}" selected>${HtmlHelpers.escapeHtml(selected)}</option>`);
            }
            const disabledAttr = disabled ? "disabled" : "";
            return `<select class="form-select form-select-sm bg-white border" data-role="cliente" data-uid="${uid}" ${disabledAttr}>${opts.join("")}</select>`;
        }

        function buildEmpleadoSelect(uid, selected, disabled) {
            let found = false;
            const optsArr = ['<option value="">Empleado...</option>'];
            (reference.empleados || []).forEach(emp => {
                if (emp === selected) found = true;
                const sel = emp === selected ? " selected" : "";
                optsArr.push(`<option value="${HtmlHelpers.escapeHtml(emp)}"${sel}>${HtmlHelpers.escapeHtml(emp)}</option>`);
            });
            if (selected && !found) {
                optsArr.push(`<option value="${HtmlHelpers.escapeHtml(selected)}" selected>${HtmlHelpers.escapeHtml(selected)}</option>`);
            }
            const opts = optsArr.join("");
            const disabledAttr = disabled ? "disabled" : "";
            return `<select class="form-select form-select-sm bg-white border" data-role="empleado" data-uid="${uid}" ${disabledAttr}>${opts}</select>`;
        }

        function attachRowEvents() {
            rootEl.querySelectorAll('[data-role="cliente"]').forEach(el => {
                el.addEventListener("change", function () {
                    updateRow(this.dataset.uid, "cliente", this.value);
                });
            });

            rootEl.querySelectorAll('[data-role="empleado"]').forEach(el => {
                el.addEventListener("change", function () {
                    updateRow(this.dataset.uid, "empleado", this.value);
                });
            });

            rootEl.querySelectorAll('[data-role="asistencia-check"]').forEach(el => {
                el.addEventListener("change", function () {
                    updateRow(this.dataset.uid, "asistencia", this.checked);
                });
            });

            rootEl.querySelectorAll('[data-role="horas-reales"]').forEach(el => {
                el.addEventListener("input", function () {
                    updateRow(this.dataset.uid, "horasReales", this.value);
                });
            });

            rootEl.querySelectorAll('[data-role="observaciones"]').forEach(el => {
                el.addEventListener("input", function () {
                    updateRow(this.dataset.uid, "observaciones", this.value);
                });
            });

            rootEl.querySelectorAll('[data-role="remove-row"]').forEach(el => {
                el.addEventListener("click", function () {
                    removeRow(this.dataset.uid);
                });
            });
        }

        function updateRow(uid, field, value) {
            const row = state.rows.find(r => r.uid === uid);
            if (!row) return;
            row[field] = value;
            if (field === "cliente") {
                row.idCliente = "";
            }
            if (field === "empleado") {
                row.idEmpleado = "";
            }
            updateSummary();
        }

        function removeRow(uid) {
            const idx = state.rows.findIndex(r => r.uid === uid);
            if (idx === -1) return;
            state.rows.splice(idx, 1);
            renderRows();
            updateSummary();
        }

        function updateSummary() {
            const summaryEl = rootEl.querySelector("#attendance-summary");
            if (!summaryEl) return;

            if (!state.rows.length) {
                summaryEl.innerHTML = "";
                return;
            }

            const clientesAtendidos = new Set();
            let totalHoras = 0;
            let registros = state.rows.length;
            let presentes = 0;

            state.rows.forEach(r => {
                if (r.asistencia) {
                    presentes += 1;
                    if (r.cliente) clientesAtendidos.add(r.cliente);
                    const horas = parseFloat(r.horasReales !== "" ? r.horasReales : r.horasPlan);
                    if (!isNaN(horas)) totalHoras += horas;
                }
            });

            summaryEl.innerHTML = `
                <span class="lt-chip lt-chip--primary">
                    <span class="opacity-75">Clientes</span> <strong>${clientesAtendidos.size}</strong>
                </span>
                <span class="lt-chip lt-chip--success">
                    <span class="opacity-75">Horas</span> <strong>${totalHoras.toFixed(2)}</strong>
                </span>
                <span class="lt-chip lt-chip--muted">
                    <span class="opacity-75">Asistencias</span> <strong>${presentes}/${registros}</strong>
                </span>
            `;
        }

        function formatHorasPlan(val) {
            if (val === undefined || val === null || val === "") return "-";
            const num = Number(val);
            if (!isNaN(num)) {
                return num.toFixed(1) + " hs";
            }
            return HtmlHelpers.escapeHtml(String(val));
        }

        function formatHoraPlan(val) {
            if (!val) return "";
            // Date object
            if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val)) {
                return "Ingreso " + val.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
            }
            const s = String(val);
            const m = s.match(/(\d{1,2}):(\d{2})/);
            if (m) {
                const hh = m[1].padStart(2, "0");
                const mm = m[2];
                return "Ingreso " + hh + ":" + mm;
            }
            return "";
        }

        function renderSummary(records) {
            const headersRow = document.getElementById("grid-headers");
            const tbody = document.getElementById("grid-body");
            if (!headersRow || !tbody) return;

            headersRow.innerHTML = `
                <th>Fecha</th>
                <th class="text-center">Clientes atendidos</th>
                <th class="text-center">Horas totales</th>
                <th class="text-center">Asistencia (real / planificada)</th>
                <th class="text-center">Acciones</th>
            `;

            tbody.innerHTML = "";

            const summaryRows = buildSummaryRows(records);
            if (!summaryRows.length) {
                const tr = document.createElement("tr");
                tr.innerHTML = '<td colspan="5" class="text-center text-muted py-5">No hay asistencias registradas.</td>';
                tbody.appendChild(tr);
                return;
            }

            const frag = document.createDocumentFragment();
            summaryRows.forEach(item => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${HtmlHelpers.escapeHtml(item.fechaLabel)}</strong></td>
                    <td class="text-center">${item.clientes}</td>
                    <td class="text-center">${item.horas.toFixed(2)}</td>
                    <td class="text-center">${item.presentes} / ${item.registros}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-primary" data-action="open-day" data-fecha="${HtmlHelpers.escapeHtml(item.fecha)}">Editar día</button>
                    </td>
                `;
                frag.appendChild(tr);
            });

            tbody.appendChild(frag);

            tbody.querySelectorAll('[data-action="open-day"]').forEach(btn => {
                btn.addEventListener("click", function () {
                    openModalForDate(this.dataset.fecha);
                });
            });
        }

        function buildSummaryRows(records) {
            const map = new Map();
            (records || []).forEach(item => {
                const rec = item.record ? item.record : item;
                const fecha = rec.FECHA || rec.fecha;
                if (!fecha) return;
                const key = String(fecha).trim();
                if (!map.has(key)) {
                    map.set(key, { registros: 0, clientes: new Set(), horas: 0, presentes: 0 });
                }
                const agg = map.get(key);
                agg.registros += 1;
                const asist = rec.ASISTENCIA !== undefined ? rec.ASISTENCIA : rec.asistencia;
                const horasRaw = rec.HORAS !== undefined ? rec.HORAS : rec.horas;
                const cliente = rec.CLIENTE || rec.cliente;

                if (asist === true || asist === "TRUE" || asist === "true" || asist === 1 || asist === "1") {
                    if (cliente) agg.clientes.add(cliente);
                    const horasNum = parseFloat(horasRaw);
                    if (!isNaN(horasNum)) {
                        agg.horas += horasNum;
                    }
                    agg.presentes += 1;
                }
            });

            const result = [];
            map.forEach((val, fecha) => {
                result.push({
                    fecha: fecha,
                    fechaLabel: formatDateLabel(fecha),
                    registros: val.registros,
                    clientes: val.clientes.size,
                    horas: val.horas,
                    presentes: val.presentes
                });
            });

            result.sort((a, b) => a.fecha > b.fecha ? -1 : 1);
            return result;
        }

        function formatDateLabel(fecha) {
            if (!fecha) return "";
            const parts = String(fecha).split("-");
            if (parts.length === 3) {
                const y = Number(parts[0]);
                const m = Number(parts[1]) - 1;
                const d = Number(parts[2]);
                const dt = new Date(y, m, d);
                if (!isNaN(dt)) {
                    return dt.toLocaleDateString("es-AR");
                }
            }
            return fecha;
        }

        function isDatePast(fechaStr) {
            if (!fechaStr) return false;
            const p = fechaStr.split("-");
            if (p.length !== 3) return false;
            const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
            if (isNaN(d)) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return d < today;
        }

        function openModalForDate(fecha) {
            if (!GridManager || !FormManager) return;
            pendingFecha = fecha;

            const formatoSelect = document.getElementById("formato");
            if (formatoSelect) {
                formatoSelect.value = "ASISTENCIA";
            }

            GridManager.openModal("Asistencia del día", function () {
                FormManager.renderForm("ASISTENCIA");
            });
        }

        function openForDate(fecha) {
            if (!rootEl || !fecha) return;
            resetState(fecha);
            const dateInput = rootEl.querySelector("#attendance-date");
            if (dateInput) {
                dateInput.value = fecha;
            }
            renderRows("Cargando...");
            updateSummary();
            loadPlan(fecha);
        }

        function save() {
            const fechaInput = rootEl ? rootEl.querySelector("#attendance-date") : null;
            const fecha = fechaInput ? fechaInput.value : state.fecha;

            if (!fecha) {
                if (Alerts) Alerts.showAlert("Elegí una fecha para guardar asistencia.", "warning");
                return;
            }

            if (!state.rows.length) {
                if (Alerts) Alerts.showAlert("No hay filas para guardar.", "warning");
                return;
            }

            const filaIncompleta = state.rows.find(r => !r.cliente || !r.empleado);
            if (filaIncompleta) {
                if (Alerts) Alerts.showAlert("Completá cliente y empleado en todas las filas.", "warning");
                return;
            }

            UiState.setGlobalLoading(true, "Guardando asistencia...");

            const payload = state.rows.map(r => ({
                cliente: r.cliente,
                idCliente: r.idCliente || "",
                empleado: r.empleado,
                idEmpleado: r.idEmpleado || "",
                asistencia: !!r.asistencia,
                horasReales: r.horasReales !== undefined && r.horasReales !== null ? r.horasReales : "",
                horasPlan: r.horasPlan !== undefined && r.horasPlan !== null ? r.horasPlan : "",
                observaciones: r.observaciones || "",
                asistenciaRowNumber: r.asistenciaRowNumber || null,
                idAsistencia: r.idAsistencia || null
            }));

            ApiService.call("saveDailyAttendance", fecha, payload)
                .then(function () {
                    if (Alerts) Alerts.showAlert("Asistencia guardada correctamente.", "success");
                    if (GridManager) GridManager.refreshGrid();
                })
                .catch(function (err) {
                    if (Alerts) Alerts.showAlert("Error al guardar asistencia: " + err.message, "danger");
                })
                .finally(function () {
                    UiState.setGlobalLoading(false);
                });
        }

        function applyPendingFocus() {
            if (!pendingFocus) return;

            const targetEmp = (pendingFocus.empleado || '').toString().toLowerCase().trim();
            const targetCli = (pendingFocus.cliente || '').toString().toLowerCase().trim();

            let matched = null;
            if (targetEmp || targetCli) {
                matched = state.rows.find(function (r) {
                    const emp = (r.empleado || '').toString().toLowerCase().trim();
                    const cli = (r.cliente || '').toString().toLowerCase().trim();
                    return emp === targetEmp && cli === targetCli;
                });
            }

            if (matched) {
                matched._autoOpen = true;
                if (pendingFocus.horas != null) matched.horasReales = pendingFocus.horas;
                if (pendingFocus.observaciones != null) matched.observaciones = pendingFocus.observaciones;
            } else if (targetEmp || targetCli) {
                const extra = normalizeRow({
                    cliente: pendingFocus.cliente || '',
                    empleado: pendingFocus.empleado || '',
                    asistencia: true,
                    horasReales: pendingFocus.horas != null ? pendingFocus.horas : '',
                    observaciones: pendingFocus.observaciones || ''
                }, true);
                extra._autoOpen = true;
                state.rows.unshift(extra);
            }

            pendingFocus = null;
        }

        function openForDateWithFocus(fecha, empleado, cliente, extras) {
            pendingFocus = {
                empleado: empleado,
                cliente: cliente,
                horas: extras && extras.horas != null ? extras.horas : null,
                observaciones: extras && extras.observaciones ? extras.observaciones : ''
            };
            openForDate(fecha);
        }

        return {
            render,
            renderSummary,
            openForDate,
            openForDateWithFocus,
            save
        };
    })();

    global.AttendanceDailyUI = AttendanceDailyUI;
})(typeof window !== "undefined" ? window : this);


/**
 * Attendance Panels - Consolidated
 * Wrapper para todos los paneles de asistencia
 */

(function (global) {
    const AttendancePanels = (() => {

        function setupWeeklyPlanPanel() {
            // Delegar la creación del panel semanal al módulo centralizado WeeklyPlanPanel
            if (typeof WeeklyPlanPanel !== 'undefined' && WeeklyPlanPanel.setup) {
                WeeklyPlanPanel.setup();
            } else {
                console.error('WeeklyPlanPanel no está disponible');
                if (typeof Alerts !== 'undefined' && Alerts) {
                    Alerts.showAlert('Error al cargar el plan semanal.', 'danger');
                }
            }
        }

        function setupDailyPanel() {
            // Contenedor donde se mostrará la grilla de asistencia diaria
            const container = document.getElementById('daily-attendance-panel');
            if (!container) return;

            // Limpiar contenido previo
            container.innerHTML = '';

            // Crear estructura de la grilla (tabla) dentro del contenedor
            const gridWrapper = document.createElement('div');
            gridWrapper.className = 'card shadow-sm p-3 mb-4'; // Card con sombra y padding
            gridWrapper.innerHTML = `
                <h5 class="card-title mb-3">Asistencia Diaria</h5>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead><tr id="grid-headers"></tr></thead>
                        <tbody id="grid-body"></tbody>
                    </table>
                </div>`;
            container.appendChild(gridWrapper);

            // Función para cargar los registros según la fecha seleccionada
            function loadAttendance() {
                const dateInput = document.getElementById('field-fecha'); // Asumiendo que el campo de fecha tiene este ID
                const fecha = dateInput ? dateInput.value : '';
                const tipoFormato = 'ASISTENCIA';
                ApiService.call('searchRecords', tipoFormato, fecha)
                    .then(function (records) {
                        if (GridManager) {
                            GridManager.renderGrid(tipoFormato, records || []);
                        }
                    })
                    .catch(function (err) {
                        console.error('Error cargando asistencia:', err);
                        if (GridManager) {
                            GridManager.renderGrid('ASISTENCIA', []);
                        }
                    });
            }

            // Cargar datos al iniciar
            loadAttendance();

            // Si el usuario cambia la fecha, recargar la grilla
            const dateInput = document.getElementById('field-fecha');
            if (dateInput) {
                dateInput.addEventListener('change', loadAttendance);
            }
        }

        return {
            setupWeeklyPlanPanel,
            setupDailyPanel
        };
    })();

    global.AttendancePanels = AttendancePanels;
})(typeof window !== "undefined" ? window : this);


/**
 * Panel de gestión de facturas
 */
var InvoicePanel = (function () {
    const containerId = 'invoice-main-panel';
    const PAGE_SIZE = 10;
    let lastInvoices = [];
    let generatorInvoices = [];
    let generatorHours = [];
    let lastGeneratorFilters = null;
    const clientIdMap = new Map();
    let selectedInvoiceIds = new Set();
    let lastSavedInvoiceId = null;
    let ivaPct = 0.21; // fracción, default 21%
    let invoicePage = 1;
    let generatorPage = 1;
    let coverageRows = [];

    function escapeHtml_(val) {
        if (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.escapeHtml === 'function') {
            return HtmlHelpers.escapeHtml(val);
        }
        return String(val == null ? '' : val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

	    function render() {
	        const container = document.getElementById(containerId);
	        if (!container) return;

        container.innerHTML = `
            <div class="d-flex flex-column gap-3">
            <div class="card shadow-sm">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-receipt me-2"></i>Facturación</h6>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="collapse" data-bs-target="#invoice-history-collapse" aria-expanded="false" aria-controls="invoice-history-collapse">
                            <i class="bi bi-clock-history me-1"></i>Historial
                        </button>
                        <button class="btn btn-danger btn-sm" id="invoice-download-selected" disabled>
                            <span id="invoice-download-selected-spinner" class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                            <span>Descargar PDF</span>
                        </button>
                        <button class="btn btn-primary btn-sm" id="invoice-new-btn">
                            <i class="bi bi-plus-circle me-1"></i>Nueva factura
                        </button>
                    </div>
                </div>
                <div id="invoice-history-collapse" class="collapse">
                <div class="card-body p-3">
                    <!-- Filtros búsqueda -->
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
                            <input list="invoice-client-list" id="invoice-filter-client" class="form-control form-control-sm" placeholder="Todos los clientes">
                            <datalist id="invoice-client-list"></datalist>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Periodo</label>
                            <input type="month" id="invoice-filter-period" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Estado</label>
                            <select id="invoice-filter-status" class="form-select form-select-sm">
                                <option value="">Todos</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Pagada">Pagada</option>
                                <option value="Anulada">Anulada</option>
                                <option value="Vencida">Vencida</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Desde</label>
                            <input type="date" id="invoice-filter-from" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
                            <input type="date" id="invoice-filter-to" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-primary btn-sm w-100" id="invoice-search-btn" title="Buscar">
                                <i class="bi bi-search"></i>
                            </button>
                        </div>
                    </div>

                    <div id="invoice-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Cargando...</p>
                    </div>

                    <div id="invoice-summary" class="row g-2 mb-3 d-none"></div>

	                    <div id="invoice-results" class="d-none">
	                        <div class="table-responsive lt-table-wrap">
	                            <table class="table table-hover table-sm align-middle mb-0">
	                                <thead class="table-light">
	                                    <tr>
	                                        <th class="ps-3 py-2 text-muted font-weight-normal">
	                                            <input type="checkbox" id="invoice-select-all">
	                                        </th>
                                        <th class="py-2 text-muted font-weight-normal">Fecha</th>
                                        <th class="py-2 text-muted font-weight-normal">Periodo</th>
                                        <th class="py-2 text-muted font-weight-normal">Número</th>
                                        <th class="py-2 text-muted font-weight-normal">Cliente</th>
                                        <th class="text-end py-2 text-muted font-weight-normal">Total</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Estado</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="invoice-tbody"></tbody>
	                            </table>
	                        </div>
	                        <div id="invoice-pagination" class="d-flex justify-content-between align-items-center py-2"></div>
	                    </div>

                    <div id="invoice-empty" class="text-center text-muted py-4">
                        <i class="bi bi-receipt" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">No hay facturas para mostrar. Usá los filtros o creá una nueva factura.</p>
                    </div>
                </div>
                </div>
            </div>

            <div class="card shadow-sm">
                <div class="card-header bg-white py-2">
                    <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-plus-circle me-2"></i>Generar factura</h6>
                    <div class="small text-muted">Buscar registros de asistencia del cliente y completar datos pendientes.</div>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label small text-muted fw-bold">Cliente a facturar</label>
                            <input list="invoice-gen-client-list" id="invoice-gen-client" class="form-control form-control-sm" placeholder="Seleccionar cliente">
                            <datalist id="invoice-gen-client-list"></datalist>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold">Desde</label>
                            <input type="date" id="invoice-gen-desde" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold">Hasta</label>
                            <input type="date" id="invoice-gen-hasta" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2 d-grid">
	                            <button class="btn btn-outline-secondary btn-sm" id="invoice-gen-search">
	                                <i class="bi bi-search me-1"></i>Buscar
	                            </button>
	                        </div>
	                    </div>
	                    <div class="row g-2 align-items-center">
	                        <div class="col-md-6 d-grid">
	                            <button class="btn btn-primary btn-sm" id="invoice-gen-open-modal">
	                                <i class="bi bi-check2-circle me-1"></i>Completar y guardar
	                            </button>
	                        </div>
	                        <div class="col-md-6 d-grid">
	                            <button class="btn btn-danger btn-sm" id="invoice-download-last-btn" disabled>
	                                <i class="bi bi-file-earmark-pdf-fill me-1"></i>PDF
	                            </button>
	                        </div>
	                    </div>

                    <div id="invoice-gen-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Buscando asistencia del cliente...</p>
                    </div>

	                    <div id="invoice-gen-results" class="d-none mt-3">
	                        <div class="table-responsive lt-table-wrap">
	                            <table class="table table-hover table-sm align-middle mb-0">
	                                <thead class="table-light">
	                                    <tr>
	                                        <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
	                                        <th class="py-2 text-muted font-weight-normal">Empleado</th>
	                                        <th class="py-2 text-muted font-weight-normal">Horas</th>
                                        <th class="py-2 text-muted font-weight-normal">Observaciones</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Acciones</th>
                                    </tr>
                                </thead>
	                                <tbody id="invoice-gen-tbody"></tbody>
	                            </table>
	                        </div>
	                        <div id="invoice-gen-pagination" class="d-flex justify-content-between align-items-center py-2"></div>
	                    </div>

                    <div id="invoice-gen-empty" class="text-center text-muted py-3">
                        <i class="bi bi-calendar4-week" style="font-size: 1.2rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">No hay registros de asistencia de este cliente en el rango indicado.</p>
                    </div>
                </div>
            </div>

            <div class="card shadow-sm">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-clipboard-check me-2"></i>Control de facturación</h6>
                    <div class="d-flex gap-2 align-items-center">
                        <input type="month" id="invoice-cov-period" class="form-control form-control-sm" style="max-width: 170px;">
                        <button class="btn btn-primary btn-sm" id="invoice-cov-search" title="Buscar">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body p-3">
                    <div id="invoice-cov-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Calculando cobertura...</p>
                    </div>

                    <div id="invoice-cov-summary" class="row g-2 mb-2 d-none"></div>

                    <div id="invoice-cov-results" class="d-none">
                        <div class="table-responsive lt-table-wrap">
                            <table class="table table-hover table-sm align-middle mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th class="ps-3 py-2 text-muted font-weight-normal">Cliente</th>
                                        <th class="py-2 text-muted font-weight-normal text-end">Horas</th>
                                        <th class="py-2 text-muted font-weight-normal text-end">Días</th>
                                        <th class="py-2 text-muted font-weight-normal text-center">Facturado</th>
                                        <th class="py-2 text-muted font-weight-normal">Factura</th>
                                        <th class="py-2 text-muted font-weight-normal text-end">Total</th>
                                        <th class="py-2 text-muted font-weight-normal text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="invoice-cov-tbody"></tbody>
                            </table>
                        </div>
                    </div>

                    <div id="invoice-cov-empty" class="text-center text-muted py-3">
                        <i class="bi bi-ui-checks-grid" style="font-size: 1.2rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Elegí un período y buscá para ver quién quedó sin facturar.</p>
                    </div>
                </div>
            </div>
            </div>

            <!-- Modal de factura -->
            <div class="modal fade" id="invoice-modal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="invoice-modal-title">Nueva Factura</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="invoice-form">
                                <input type="hidden" id="invoice-id">
                                <input type="hidden" id="invoice-id-cliente">
                                
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <label class="form-label">Fecha <span class="text-danger">*</span></label>
                                        <input type="date" class="form-control" id="invoice-fecha" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Periodo</label>
                                        <input type="month" class="form-control" id="invoice-periodo">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Estado</label>
                                        <select class="form-select" id="invoice-estado">
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="Pagada">Pagada</option>
                                            <option value="Anulada">Anulada</option>
                                            <option value="Vencida">Vencida</option>
                                        </select>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <label class="form-label">Comprobante</label>
                                        <select class="form-select" id="invoice-comprobante">
                                            <option value="Factura A">Factura A</option>
                                            <option value="Factura B" selected>Factura B</option>
                                            <option value="Factura C">Factura C</option>
                                            <option value="Nota de Crédito">Nota de Crédito</option>
                                            <option value="Nota de Débito">Nota de Débito</option>
                                            <option value="Recibo">Recibo</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Número</label>
                                        <input type="text" class="form-control" id="invoice-numero" placeholder="0001-00000001">
                                    </div>
                                    
                                    <div class="col-md-8">
                                        <label class="form-label">Razón Social <span class="text-danger">*</span></label>
                                        <input list="invoice-modal-client-list" class="form-control" id="invoice-razon-social" required>
                                        <datalist id="invoice-modal-client-list"></datalist>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">CUIT</label>
                                        <input type="text" class="form-control" id="invoice-cuit">
                                    </div>
                                    
                                    <div class="col-12">
                                        <label class="form-label">Concepto</label>
                                        <textarea class="form-control" id="invoice-concepto" rows="2" placeholder="Descripción del servicio facturado"></textarea>
                                    </div>
                                    
                                    <div class="col-md-4">
                                        <label class="form-label">Horas</label>
                                        <input type="number" class="form-control" id="invoice-horas" step="0.5" min="0">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Valor Hora</label>
                                        <input type="number" class="form-control" id="invoice-valor-hora" step="0.01" min="0">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Importe</label>
                                        <input type="number" class="form-control" id="invoice-importe" step="0.01" min="0">
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <label class="form-label">Subtotal</label>
                                        <input type="number" class="form-control" id="invoice-subtotal" step="0.01" min="0">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Total <span class="text-danger">*</span></label>
                                        <input type="number" class="form-control" id="invoice-total" step="0.01" min="0" required>
                                    </div>
                                    
                                    <div class="col-12">
                                        <label class="form-label">Observaciones</label>
                                        <textarea class="form-control" id="invoice-observaciones" rows="2"></textarea>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="invoice-save-btn">
                                <i class="bi bi-save me-1"></i>Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal de factura desde asistencia -->
            <div class="modal fade" id="invoice-att-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Factura desde asistencia</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Cliente <span class="text-danger">*</span></label>
                                <input list="invoice-client-list" id="invoice-att-cliente" class="form-control" placeholder="Seleccionar cliente">
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Desde</label>
                                    <input type="date" id="invoice-att-desde" class="form-control">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Hasta</label>
                                    <input type="date" id="invoice-att-hasta" class="form-control">
                                </div>
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Comprobante</label>
                                    <select class="form-select" id="invoice-att-comp">
                                        <option value="Factura B" selected>Factura B</option>
                                        <option value="Factura A">Factura A</option>
                                        <option value="Factura C">Factura C</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Número</label>
                                    <input type="text" id="invoice-att-numero" class="form-control" placeholder="0001-00000001">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Observaciones</label>
                                <textarea id="invoice-att-obs" class="form-control" rows="2"></textarea>
                            </div>
                            <div class="alert alert-info small mb-0">
                                Se calcularán horas con asistencia y tarifa diaria del cliente en el rango indicado. Si dejás fechas vacías, usa el mes actual.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary btn-sm" id="invoice-att-save">Generar factura</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        attachEvents();
        loadClients();
        loadIvaConfig();
        initCoveragePeriod_();
    }

	    function attachEvents() {
        const newBtn = document.getElementById('invoice-new-btn');
        if (newBtn) newBtn.addEventListener('click', () => openModal());

        const genSearchBtn = document.getElementById('invoice-gen-search');
        if (genSearchBtn) genSearchBtn.addEventListener('click', searchClientHours);
        const genOpenModalBtn = document.getElementById('invoice-gen-open-modal');
        if (genOpenModalBtn) genOpenModalBtn.addEventListener('click', openModalFromGenerator);

        const searchBtn = document.getElementById('invoice-search-btn');
        if (searchBtn) searchBtn.addEventListener('click', handleSearch);

        const saveBtn = document.getElementById('invoice-save-btn');
        if (saveBtn) saveBtn.addEventListener('click', handleSave);

	        const dlLastBtn = document.getElementById('invoice-download-last-btn');
	        if (dlLastBtn) dlLastBtn.addEventListener('click', () => {
	            if (lastSavedInvoiceId) downloadPdf(lastSavedInvoiceId);
	        });
	        const dlSelectedBtn = document.getElementById('invoice-download-selected');
	        if (dlSelectedBtn) dlSelectedBtn.addEventListener('click', downloadSelectedPdfs);
        const selectAll = document.getElementById('invoice-select-all');
        if (selectAll) selectAll.addEventListener('change', (e) => toggleSelectAll(e.target.checked));

        // Auto-calcular importes cuando cambian horas o valor hora
        const horasInput = document.getElementById('invoice-horas');
        const valorHoraInput = document.getElementById('invoice-valor-hora');
        if (horasInput) horasInput.addEventListener('input', recalculateTotals_);
        if (valorHoraInput) valorHoraInput.addEventListener('input', recalculateTotals_);

        // Auto-completar CUIT cuando se selecciona cliente
        const razonSocialInput = document.getElementById('invoice-razon-social');
        if (razonSocialInput) {
            razonSocialInput.addEventListener('change', autocompleteCUIT);
        }

        const covSearchBtn = document.getElementById('invoice-cov-search');
        if (covSearchBtn) covSearchBtn.addEventListener('click', handleCoverageSearch);
        const covPeriod = document.getElementById('invoice-cov-period');
        if (covPeriod) covPeriod.addEventListener('change', () => {
            if (coverageRows && coverageRows.length) handleCoverageSearch();
        });
        const covTbody = document.getElementById('invoice-cov-tbody');
        if (covTbody) {
            covTbody.addEventListener('click', (e) => {
                const btn = e.target && e.target.closest ? e.target.closest('.invoice-cov-generate') : null;
                if (!btn) return;
                const idCliente = btn.dataset ? (btn.dataset.idCliente || '') : '';
                const cliente = btn.dataset ? (btn.dataset.cliente || '') : '';
                const period = btn.dataset ? (btn.dataset.period || '') : '';
                generateCoverageInvoice(idCliente, cliente, period);
            });
        }
    }

    function initCoveragePeriod_() {
        const el = document.getElementById('invoice-cov-period');
        if (!el) return;
        if (!el.value) {
            const d = new Date();
            const yyyy = String(d.getFullYear());
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            el.value = `${yyyy}-${mm}`;
        }
    }

    function setCoverageLoading_(loading) {
        const loadingEl = document.getElementById('invoice-cov-loading');
        const resultsEl = document.getElementById('invoice-cov-results');
        const emptyEl = document.getElementById('invoice-cov-empty');
        const summaryEl = document.getElementById('invoice-cov-summary');
        if (loadingEl) loadingEl.classList.toggle('d-none', !loading);
        if (resultsEl) resultsEl.classList.toggle('d-none', loading || !coverageRows || coverageRows.length === 0);
        if (emptyEl) emptyEl.classList.toggle('d-none', loading || (coverageRows && coverageRows.length > 0));
        if (summaryEl) summaryEl.classList.toggle('d-none', loading || !coverageRows || coverageRows.length === 0);
    }

    function handleCoverageSearch() {
        const period = document.getElementById('invoice-cov-period')?.value || '';
        if (!period) {
            Alerts && Alerts.showAlert('Elegí un período para controlar.', 'warning');
            return;
        }
        if (!ApiService || !ApiService.call) return;
        coverageRows = [];
        setCoverageLoading_(true);
        ApiService.call('getInvoicingCoverage', period, {})
            .then(res => {
                coverageRows = (res && res.rows) ? res.rows : [];
                renderCoverageSummary_(coverageRows);
                renderCoverageTable_(coverageRows, period);
            })
            .catch(err => {
                console.error('Error en control de facturación:', err);
                Alerts && Alerts.showAlert('Error en control de facturación: ' + err.message, 'danger');
            })
            .finally(() => setCoverageLoading_(false));
    }

    function renderCoverageSummary_(rows) {
        const el = document.getElementById('invoice-cov-summary');
        if (!el) return;
        if (!rows || rows.length === 0) {
            el.classList.add('d-none');
            return;
        }
        const totalClientes = rows.length;
        const pendientes = rows.filter(r => !r.facturado).length;
        const horas = rows.reduce((acc, r) => acc + (Number(r.horas) || 0), 0);
        el.innerHTML = `
            <div class="col-md-3">
                <div class="card border-0 bg-light">
                    <div class="card-body py-2">
                        <div class="text-muted small fw-bold">Clientes</div>
                        <div class="fw-bold">${totalClientes}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 bg-light">
                    <div class="card-body py-2">
                        <div class="text-muted small fw-bold">Pendientes</div>
                        <div class="fw-bold text-danger">${pendientes}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 bg-light">
                    <div class="card-body py-2">
                        <div class="text-muted small fw-bold">Facturados</div>
                        <div class="fw-bold text-success">${totalClientes - pendientes}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 bg-light">
                    <div class="card-body py-2">
                        <div class="text-muted small fw-bold">Horas</div>
                        <div class="fw-bold">${(Number(horas) || 0).toFixed(2).replace(/\\.00$/, '')}</div>
                    </div>
                </div>
            </div>
        `;
        el.classList.remove('d-none');
    }

    function renderCoverageTable_(rows, period) {
        const tbody = document.getElementById('invoice-cov-tbody');
        const results = document.getElementById('invoice-cov-results');
        const empty = document.getElementById('invoice-cov-empty');
        if (!tbody || !results || !empty) return;

        tbody.innerHTML = '';
        if (!rows || rows.length === 0) {
            results.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        rows.forEach(r => {
            const tr = document.createElement('tr');
            const facturadoBadge = r.facturado
                ? `<span class="badge bg-success-subtle text-success border">Sí</span>`
                : `<span class="badge bg-danger-subtle text-danger border">No</span>`;
            const facturaLabel = r.facturado
                ? `<span class="badge bg-light text-dark border">${escapeHtml_(r.facturaNumero || ('#' + (r.facturaId || '')))}</span>`
                : `<span class="text-muted">—</span>`;

            const totalLabel = r.facturado ? formatCurrency(r.facturaTotal || 0) : '—';
            const actions = r.facturado
                ? `<button class="btn btn-sm btn-outline-primary lt-btn-icon me-1" onclick="InvoicePanel.editInvoice('${r.facturaId}')" title="Abrir factura">
                        <i class="bi bi-pencil-fill"></i>
                   </button>
                   <button class="btn btn-sm btn-outline-danger lt-btn-icon" onclick="InvoicePanel.downloadPdf('${r.facturaId}')" title="PDF">
                        <i class="bi bi-file-earmark-pdf-fill"></i>
                   </button>`
                : `<button class="btn btn-sm btn-primary invoice-cov-generate" data-id-cliente="${escapeHtml_(String(r.idCliente || ''))}" data-cliente="${escapeHtml_(String(r.cliente || ''))}" data-period="${escapeHtml_(String(period || ''))}">
                        <i class="bi bi-lightning-charge-fill me-1"></i>Generar
                   </button>`;

            tr.innerHTML = `
                <td class="ps-3">${escapeHtml_(r.cliente || '-')}</td>
                <td class="text-end fw-bold">${escapeHtml_(String(r.horas || 0))}</td>
                <td class="text-end">${escapeHtml_(String(r.dias || 0))}</td>
                <td class="text-center">${facturadoBadge}</td>
                <td>${facturaLabel}</td>
                <td class="text-end fw-bold">${escapeHtml_(totalLabel)}</td>
                <td class="text-center">${actions}</td>
            `;
            tbody.appendChild(tr);
        });

        results.classList.remove('d-none');
        empty.classList.add('d-none');
    }

    function monthRangeFromPeriod_(period) {
        const p = String(period || '').trim();
        if (!/^\\d{4}-\\d{2}$/.test(p)) return { start: '', end: '' };
        const y = Number(p.slice(0, 4));
        const m = Number(p.slice(5, 7)); // 1-12
        const endDate = new Date(y, m, 0);
        const dd = String(endDate.getDate()).padStart(2, '0');
        return { start: `${p}-01`, end: `${p}-${dd}` };
    }

    function generateCoverageInvoice(idCliente, cliente, period) {
        const p = String(period || '').trim();
        const range = monthRangeFromPeriod_(p);
        if (!range.start || !range.end) {
            Alerts && Alerts.showAlert('Período inválido para generar.', 'warning');
            return;
        }
        const cli = String(cliente || '').trim();
        const id = String(idCliente || '').trim();

        UiState && UiState.setGlobalLoading(true);
        ApiService.call('createInvoiceFromAttendance', cli || { cliente: cli, idCliente: id }, range.start, range.end, {
            observaciones: `Período: ${range.start} a ${range.end}`
        }, id || '')
            .then(res => {
                const newId = res && (res.id || (res.record && res.record.ID));
                if (newId) {
                    lastSavedInvoiceId = String(newId);
                    Alerts && Alerts.showAlert('Factura generada correctamente.', 'success');
                } else {
                    Alerts && Alerts.showAlert('Factura generada.', 'success');
                }
                handleCoverageSearch();
            })
            .catch(err => {
                console.error('Error generando factura (cobertura):', err);
                Alerts && Alerts.showAlert('Error generando factura: ' + err.message, 'danger');
            })
            .finally(() => UiState && UiState.setGlobalLoading(false));
    }

    function loadClients() {
        if (typeof ReferenceService === 'undefined' || !ReferenceService.load) return;

        ReferenceService.load()
            .then(() => {
                const refs = ReferenceService.get();
                const clientes = refs && refs.clientes ? refs.clientes : [];
                populateClientLists(clientes);
            })
            .catch(() => {
                // fallback si ReferenceService falla
                ApiService.call('getReferenceData')
                    .then(refs => {
                        const clientes = refs && refs.clientes ? refs.clientes : [];
                        populateClientLists(clientes);
                    })
                    .catch(err => console.error('Error cargando clientes (fallback):', err));
            })
            .catch(err => console.error('Error cargando clientes:', err));
    }

    function populateClientLists(clients) {
        const filterList = document.getElementById('invoice-client-list');
        const modalList = document.getElementById('invoice-modal-client-list');
        const generatorList = document.getElementById('invoice-gen-client-list');

        clientIdMap.clear();

        [filterList, modalList, generatorList].forEach(list => {
            if (!list) return;
            list.innerHTML = '';

            clients
                .map(cli => {
                    const label = formatClientLabel(cli);
                    if (label && cli && cli.id) {
                        clientIdMap.set(label, cli.id);
                    }
                    return label;
                })
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b, 'es'))
                .forEach(label => {
                    const opt = document.createElement('option');
                    opt.value = label;
                    list.appendChild(opt);
                });
        });
    }

    function formatClientLabel(cli) {
        if (!cli) return '';
        if (typeof cli === 'string') return cli;
        const base = cli.razonSocial || cli.nombre || '';
        const cuit = cli.cuit ? ` (${cli.cuit})` : '';
        return (base + cuit).trim();
    }

    function autocompleteCUIT() {
        const razonSocialInput = document.getElementById('invoice-razon-social');
        const cuitInput = document.getElementById('invoice-cuit');
        const idClienteInput = document.getElementById('invoice-id-cliente');

        if (!razonSocialInput || !cuitInput || !ReferenceService) return;

        const selectedClient = razonSocialInput.value;
        const refs = ReferenceService.get();
        const clientes = refs && refs.clientes ? refs.clientes : [];

        const cliente = clientes.find(c => {
            const label = formatClientLabel(c);
            return label === selectedClient ||
                (c.razonSocial && c.razonSocial === selectedClient) ||
                (c.nombre && c.nombre === selectedClient);
        });

        if (cliente) {
            if (cliente.cuit) {
                cuitInput.value = cliente.cuit;
            }
            // Guardar el ID del cliente
            if (cliente.id && idClienteInput) {
                idClienteInput.value = cliente.id;
            }
        }
    }

    function cleanClientValue(raw) {
        if (!raw) return '';
        const idx = raw.indexOf('(');
        return idx > 0 ? raw.slice(0, idx).trim() : raw.trim();
    }

    function getClientIdFromLabel(label) {
        if (!label) return '';
        return clientIdMap.get(label) || '';
    }

    function searchClientHours() {
        const clientInput = document.getElementById('invoice-gen-client');
        const clienteRaw = clientInput ? clientInput.value.trim() : '';
        const cliente = cleanClientValue(clienteRaw);
        if (!cliente) {
            Alerts && Alerts.showAlert('Elegí un cliente para buscar.', 'warning');
            return;
        }
        const desde = document.getElementById('invoice-gen-desde')?.value || '';
        const hasta = document.getElementById('invoice-gen-hasta')?.value || '';
        const idCliente = getClientIdFromLabel(clienteRaw || cliente);

        lastGeneratorFilters = { cliente, clienteLabel: clienteRaw || cliente, idCliente: idCliente, fechaDesde: desde, fechaHasta: hasta };
        fetchGeneratorHours();
    }

    function openModalFromGenerator() {
        const clientInput = document.getElementById('invoice-gen-client');
        const cliente = clientInput ? clientInput.value.trim() : '';
        if (!cliente) {
            Alerts && Alerts.showAlert('Elegí un cliente para facturar.', 'warning');
            return;
        }
        const desde = document.getElementById('invoice-gen-desde')?.value || '';
        const hasta = document.getElementById('invoice-gen-hasta')?.value || '';

        const preset = buildPresetFromHours(cliente, desde, hasta);
        openModal(preset);
    }

    function getFilters() {
        const clientRaw = document.getElementById('invoice-filter-client')?.value || '';
        const idCliente = getClientIdFromLabel(clientRaw);
        return {
            cliente: cleanClientValue(clientRaw),
            idCliente: idCliente,
            periodo: document.getElementById('invoice-filter-period')?.value || '',
            estado: document.getElementById('invoice-filter-status')?.value || '',
            fechaDesde: document.getElementById('invoice-filter-from')?.value || '',
            fechaHasta: document.getElementById('invoice-filter-to')?.value || ''
        };
    }

    function handleSearch() {
        const filters = getFilters();
        toggleLoading(true);

        selectedInvoiceIds.clear();
        ApiService.call('getInvoices', filters)
            .then(invoices => {
                lastInvoices = invoices || [];
                invoicePage = 1;
                renderSummary(lastInvoices);
                renderTable(lastInvoices);
            })
            .catch(err => {
                console.error('Error al cargar facturas:', err);
                Alerts && Alerts.showAlert('Error al cargar facturas: ' + err.message, 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function renderSummary(invoices) {
        const summaryDiv = document.getElementById('invoice-summary');
        if (!summaryDiv) return;

        summaryDiv.classList.add('d-none');
    }

	    function renderGeneratorResults(rows) {
        const tbody = document.getElementById('invoice-gen-tbody');
        const results = document.getElementById('invoice-gen-results');
        const empty = document.getElementById('invoice-gen-empty');

        if (!tbody || !results || !empty) return;

        tbody.innerHTML = '';

        if (!rows || rows.length === 0) {
            results.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        if (generatorPage > totalPages) generatorPage = totalPages;
        const start = (generatorPage - 1) * PAGE_SIZE;
        const pageItems = rows.slice(start, start + PAGE_SIZE);

	        pageItems.forEach(item => {
	            const tr = document.createElement('tr');
	            tr.innerHTML = `
	                <td class="ps-3">${item.fecha || '-'}</td>
	                <td>${item.empleado || '-'}</td>
	                <td>${item.horas || 0}</td>
	                <td>${item.observaciones || ''}</td>
	                <td class="text-center">
	                    <button class="btn btn-sm btn-outline-primary lt-btn-icon me-1" onclick="InvoicePanel.editAttendance(${item.id})" title="Editar">
	                        <i class="bi bi-pencil-fill"></i>
	                    </button>
	                    <button class="btn btn-sm btn-outline-danger lt-btn-icon" onclick="InvoicePanel.deleteAttendance(${item.id})" title="Eliminar">
	                        <i class="bi bi-trash"></i>
	                    </button>
	                </td>
	            `;
	            tbody.appendChild(tr);
	        });

        results.classList.remove('d-none');
        empty.classList.add('d-none');
        updateSelectionUi();
        renderGeneratorPagination(totalPages);
    }

	    function renderTable(invoices) {
        const tbody = document.getElementById('invoice-tbody');
        const results = document.getElementById('invoice-results');
        const empty = document.getElementById('invoice-empty');

        if (!tbody || !results || !empty) return;

        tbody.innerHTML = '';

        if (!invoices || invoices.length === 0) {
            results.classList.add('d-none');
            empty.classList.remove('d-none');
            renderInvoicePagination(0);
            return;
        }

        const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
        if (invoicePage > totalPages) invoicePage = totalPages;
        const start = (invoicePage - 1) * PAGE_SIZE;
        const pageItems = invoices.slice(start, start + PAGE_SIZE);

        pageItems.forEach(inv => {
            const periodLabel = formatPeriod(inv['PERIODO']);
            const tr = document.createElement('tr');
            const estado = inv['ESTADO'] || 'Pendiente';
            const estadoBadge = getEstadoBadge(estado);

	            tr.innerHTML = `
                <td class="ps-3">
                    <input type="checkbox" class="invoice-select" data-id="${inv.ID}" ${selectedInvoiceIds.has(String(inv.ID)) ? 'checked' : ''} onclick="InvoicePanel.toggleInvoiceSelection('${inv.ID}', this.checked)">
                </td>
                <td class="ps-3">${inv['FECHA'] || '-'}</td>
                <td>${periodLabel || '-'}</td>
                <td><span class="badge bg-light text-dark border">${inv['NUMERO'] || 'S/N'}</span></td>
                <td>${inv['RAZÓN SOCIAL'] || '-'}</td>
                <td class="text-end fw-bold">${formatCurrency(inv['TOTAL'])}</td>
	                <td class="text-center">${estadoBadge}</td>
	                <td class="text-center">
	                    <button class="btn btn-sm btn-outline-primary lt-btn-icon me-1" onclick="InvoicePanel.editInvoice('${inv.ID}')" title="Editar">
	                        <i class="bi bi-pencil-fill"></i>
	                    </button>
	                    <button class="btn btn-sm btn-outline-danger lt-btn-icon" onclick="InvoicePanel.deleteInvoice('${inv.ID}')" title="Anular">
	                        <i class="bi bi-x-circle-fill"></i>
	                    </button>
	                </td>
	            `;

            tbody.appendChild(tr);
        });

        results.classList.remove('d-none');
        empty.classList.add('d-none');
        renderInvoicePagination(totalPages);
    }

    function getEstadoBadge(estado) {
        const badges = {
            'Pendiente': '<span class="badge bg-warning">Pendiente</span>',
            'Pagada': '<span class="badge bg-success">Pagada</span>',
            'Anulada': '<span class="badge bg-danger">Anulada</span>',
            'Vencida': '<span class="badge bg-dark">Vencida</span>'
        };
        return badges[estado] || '<span class="badge bg-secondary">' + estado + '</span>';
    }

    function renderInvoicePagination(totalPages) {
        const container = document.getElementById('invoice-pagination');
        if (!container) return;
        container.innerHTML = '';
        if (totalPages <= 1) return;

        const info = document.createElement('div');
        info.className = 'small text-muted';
        info.textContent = `Página ${invoicePage} de ${totalPages}`;

        const controls = document.createElement('div');
        controls.className = 'btn-group btn-group-sm';

        const prev = document.createElement('button');
        prev.className = 'btn btn-outline-secondary';
        prev.textContent = '‹';
        prev.disabled = invoicePage <= 1;
        prev.onclick = () => setInvoicePage(invoicePage - 1);

        const next = document.createElement('button');
        next.className = 'btn btn-outline-secondary';
        next.textContent = '›';
        next.disabled = invoicePage >= totalPages;
        next.onclick = () => setInvoicePage(invoicePage + 1);

        controls.appendChild(prev);
        controls.appendChild(next);

        container.appendChild(info);
        container.appendChild(controls);
    }

    function renderGeneratorPagination(totalPages) {
        const container = document.getElementById('invoice-gen-pagination');
        if (!container) return;
        container.innerHTML = '';
        if (totalPages <= 1) return;

        const info = document.createElement('div');
        info.className = 'small text-muted';
        info.textContent = `Página ${generatorPage} de ${totalPages}`;

        const controls = document.createElement('div');
        controls.className = 'btn-group btn-group-sm';

        const prev = document.createElement('button');
        prev.className = 'btn btn-outline-secondary';
        prev.textContent = '‹';
        prev.disabled = generatorPage <= 1;
        prev.onclick = () => setGeneratorPage(generatorPage - 1);

        const next = document.createElement('button');
        next.className = 'btn btn-outline-secondary';
        next.textContent = '›';
        next.disabled = generatorPage >= totalPages;
        next.onclick = () => setGeneratorPage(generatorPage + 1);

        controls.appendChild(prev);
        controls.appendChild(next);

        container.appendChild(info);
        container.appendChild(controls);
    }

    function setInvoicePage(page) {
        invoicePage = Math.max(1, page);
        renderTable(lastInvoices);
    }

    function setGeneratorPage(page) {
        generatorPage = Math.max(1, page);
        renderGeneratorResults(generatorHours);
    }

    function openModal(invoiceData) {
        const modal = new bootstrap.Modal(document.getElementById('invoice-modal'));
        const title = document.getElementById('invoice-modal-title');
        const form = document.getElementById('invoice-form');

        if (title) title.textContent = invoiceData ? 'Editar Factura' : 'Nueva Factura';
        if (form) form.reset();

        if (invoiceData) {
            document.getElementById('invoice-id').value = invoiceData.ID || '';
            document.getElementById('invoice-id-cliente').value = invoiceData['ID_CLIENTE'] || '';
            document.getElementById('invoice-fecha').value = invoiceData['FECHA'] || '';
            document.getElementById('invoice-periodo').value = invoiceData['PERIODO'] || '';
            document.getElementById('invoice-comprobante').value = invoiceData['COMPROBANTE'] || 'Factura B';
            document.getElementById('invoice-numero').value = invoiceData['NUMERO'] || '';
            document.getElementById('invoice-razon-social').value = invoiceData['RAZÓN SOCIAL'] || '';
            document.getElementById('invoice-cuit').value = invoiceData['CUIT'] || '';
            document.getElementById('invoice-concepto').value = invoiceData['CONCEPTO'] || '';
            document.getElementById('invoice-horas').value = invoiceData['HORAS'] || '';
            document.getElementById('invoice-valor-hora').value = invoiceData['VALOR HORA'] || '';
            document.getElementById('invoice-importe').value = invoiceData['IMPORTE'] || '';
            document.getElementById('invoice-subtotal').value = invoiceData['SUBTOTAL'] || '';
            document.getElementById('invoice-total').value = invoiceData['TOTAL'] || '';
            document.getElementById('invoice-estado').value = invoiceData['ESTADO'] || 'Pendiente';
            document.getElementById('invoice-observaciones').value = invoiceData['OBSERVACIONES'] || '';
        } else {
            // Valores por defecto para nueva factura
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('invoice-fecha').value = today;
            document.getElementById('invoice-estado').value = 'Pendiente';
        }

        // Completar CUIT e ID si existe en referencias
        autocompleteCUIT();
        if (!invoiceData || !invoiceData.ID) {
            recalculateTotals_();
        }
        modal.show();
    }

    function parseIvaPctFromConfig_(config) {
        if (!config) return 0.21;
        const raw = config['IVA_PORCENTAJE'] != null ? config['IVA_PORCENTAJE'] : config['IVA'];
        if (raw == null || raw === '') return 0.21;
        const cleaned = String(raw).replace('%', '').trim();
        const n = Number(cleaned);
        if (isNaN(n)) return 0.21;
        return n > 1 ? n / 100 : n;
    }

    function loadIvaConfig() {
        if (!ApiService || !ApiService.call) return;
        ApiService.call('getConfig')
            .then(cfg => {
                ivaPct = parseIvaPctFromConfig_(cfg);
                recalculateTotals_();
            })
            .catch(() => { /* usar default */ });
    }

    function recalculateTotals_() {
        const horasInput = document.getElementById('invoice-horas');
        const valorHoraInput = document.getElementById('invoice-valor-hora');
        const importeInput = document.getElementById('invoice-importe');
        const subtotalInput = document.getElementById('invoice-subtotal');
        const totalInput = document.getElementById('invoice-total');
        if (!horasInput || !valorHoraInput) return;

        const horas = Number(horasInput.value) || 0;
        const valorHora = Number(valorHoraInput.value) || 0;
        const subtotal = horas * valorHora;
        const subtotalFixed = (isNaN(subtotal) ? 0 : subtotal).toFixed(2);
        const totalFixed = (subtotal * (1 + ivaPct)).toFixed(2);

        if (importeInput) importeInput.value = subtotalFixed;
        if (subtotalInput) subtotalInput.value = subtotalFixed;
        if (totalInput) totalInput.value = totalFixed;
    }

    function handleSave() {
        const form = document.getElementById('invoice-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('invoice-id').value;
        const idCliente = document.getElementById('invoice-id-cliente').value;

        const data = {
            'ID_CLIENTE': idCliente || '',
            'FECHA': document.getElementById('invoice-fecha').value,
            'PERIODO': document.getElementById('invoice-periodo').value,
            'COMPROBANTE': document.getElementById('invoice-comprobante').value,
            'NUMERO': document.getElementById('invoice-numero').value,
            'RAZÓN SOCIAL': document.getElementById('invoice-razon-social').value,
            'CUIT': document.getElementById('invoice-cuit').value,
            'CONCEPTO': document.getElementById('invoice-concepto').value,
            'HORAS': document.getElementById('invoice-horas').value,
            'VALOR HORA': document.getElementById('invoice-valor-hora').value,
            'IMPORTE': document.getElementById('invoice-importe').value,
            'SUBTOTAL': document.getElementById('invoice-subtotal').value,
            'TOTAL': document.getElementById('invoice-total').value,
            'ESTADO': document.getElementById('invoice-estado').value,
            'OBSERVACIONES': document.getElementById('invoice-observaciones').value
        };

        const saveBtn = document.getElementById('invoice-save-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';
        }

        const apiMethod = id ? 'updateInvoice' : 'createInvoice';
        const apiArgs = id ? [id, data] : [data];

        ApiService.call(apiMethod, ...apiArgs)
            .then((res) => {
                const newId = res && res.id ? res.id : res;
                Alerts && Alerts.showAlert('Factura guardada exitosamente', 'success');
                bootstrap.Modal.getInstance(document.getElementById('invoice-modal')).hide();
                invoicePage = 1;
                refreshGeneratorList(); // Refrescar lista del generador si hay filtros
                if (newId) {
                    lastSavedInvoiceId = newId;
                    updateSelectionUi();
                }
            })
            .catch(err => {
                console.error('Error al guardar factura:', err);
                Alerts && Alerts.showAlert('Error al guardar: ' + err.message, 'danger');
            })
            .finally(() => {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="bi bi-save me-1"></i>Guardar';
                }
            });
    }

    function openFromAttendanceModal() {
        const modalEl = document.getElementById('invoice-att-modal');
        if (!modalEl) return;
        const modal = new bootstrap.Modal(modalEl);

        // Prefill fechas: mes actual
        const hoy = new Date();
        const first = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
        const last = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
        const desde = document.getElementById('invoice-att-desde');
        const hasta = document.getElementById('invoice-att-hasta');
        if (desde && !desde.value) desde.value = first;
        if (hasta && !hasta.value) hasta.value = last;

        modal.show();

        const saveBtn = document.getElementById('invoice-att-save');
        if (saveBtn && !saveBtn._bound) {
            saveBtn._bound = true;
            saveBtn.addEventListener('click', handleFromAttendanceSave);
        }
    }

    function handleFromAttendanceSave() {
        const clienteInput = document.getElementById('invoice-att-cliente');
        const desdeInput = document.getElementById('invoice-att-desde');
        const hastaInput = document.getElementById('invoice-att-hasta');
        const compInput = document.getElementById('invoice-att-comp');
        const numInput = document.getElementById('invoice-att-numero');
        const obsInput = document.getElementById('invoice-att-obs');

        const clienteRaw = clienteInput ? clienteInput.value.trim() : '';
        const idCliente = getClientIdFromLabel(clienteRaw);
        const cliente = cleanClientValue(clienteRaw);
        if (!clienteRaw) {
            Alerts && Alerts.showAlert('Elegí un cliente', 'warning');
            return;
        }

        const fechaDesde = desdeInput && desdeInput.value ? desdeInput.value : '';
        const fechaHasta = hastaInput && hastaInput.value ? hastaInput.value : '';

        UiState && UiState.setGlobalLoading(true, 'Generando factura desde asistencia...');
        ApiService.call('createInvoiceFromAttendance', cliente, fechaDesde, fechaHasta, {
            comprobante: compInput ? compInput.value : '',
            numero: numInput ? numInput.value : '',
            observaciones: obsInput ? obsInput.value : ''
        }, idCliente)
            .then(() => {
                Alerts && Alerts.showAlert('Factura generada desde asistencia.', 'success');
                const modalEl = document.getElementById('invoice-att-modal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    modal && modal.hide();
                }
                handleSearch();
            })
            .catch(err => {
                Alerts && Alerts.showAlert('Error: ' + err.message, 'danger');
            })
            .finally(() => {
                UiState && UiState.setGlobalLoading(false);
            });
    }

    function generateFromGenerator() {
        const clientInput = document.getElementById('invoice-gen-client');
        const desdeInput = document.getElementById('invoice-gen-desde');
        const hastaInput = document.getElementById('invoice-gen-hasta');

        const clienteRaw = clientInput ? clientInput.value.trim() : '';
        const idCliente = getClientIdFromLabel(clienteRaw);
        const cliente = cleanClientValue(clienteRaw);
        const fechaDesde = desdeInput && desdeInput.value ? desdeInput.value : '';
        const fechaHasta = hastaInput && hastaInput.value ? hastaInput.value : '';

        if (!clienteRaw) {
            Alerts && Alerts.showAlert('Elegí un cliente antes de generar.', 'warning');
            return;
        }
        if (!fechaDesde || !fechaHasta) {
            Alerts && Alerts.showAlert('Indicá fechas Desde y Hasta para generar la factura.', 'warning');
            return;
        }

        UiState && UiState.setGlobalLoading(true, 'Generando factura con filtros...');
        ApiService.call('createInvoiceFromAttendance', cliente, fechaDesde, fechaHasta, {}, idCliente)
            .then(() => {
                Alerts && Alerts.showAlert('Factura generada.', 'success');
                handleSearch();
            })
            .catch(err => {
                Alerts && Alerts.showAlert('Error: ' + err.message, 'danger');
            })
            .finally(() => UiState && UiState.setGlobalLoading(false));
    }

    function editInvoice(id) {
        ApiService.call('getInvoiceById', id)
            .then(invoice => {
                if (invoice) {
                    openModal(invoice);
                }
            })
            .catch(err => {
                console.error('Error al cargar factura:', err);
                Alerts && Alerts.showAlert('Error al cargar factura: ' + err.message, 'danger');
            });
    }

    function deleteInvoice(id, skipRefreshMain) {
        const confirmPromise =
            typeof window !== 'undefined' &&
            window.UiDialogs &&
            typeof window.UiDialogs.confirm === 'function'
                ? window.UiDialogs.confirm({
                    title: 'Anular factura',
                    message: '¿Estás seguro de que querés anular esta factura?',
                    confirmText: 'Anular',
                    cancelText: 'Cancelar',
                    confirmVariant: 'danger',
                    icon: 'bi-x-octagon-fill',
                    iconClass: 'text-danger'
                })
                : Promise.resolve(confirm('¿Estás seguro de que querés anular esta factura?'));

        confirmPromise.then(function (confirmed) {
            if (!confirmed) return;

            ApiService.call('deleteInvoice', id)
                .then(() => {
                    Alerts && Alerts.showAlert('Factura anulada exitosamente', 'success');
                    if (!skipRefreshMain) {
                        handleSearch(); // Recargar lista principal
                    }
                    refreshGeneratorList();
                })
                .catch(err => {
                    console.error('Error al anular factura:', err);
                    Alerts && Alerts.showAlert('Error al anular: ' + err.message, 'danger');
                });
        });
    }

    function toggleLoading(show) {
        const loading = document.getElementById('invoice-loading');
        const results = document.getElementById('invoice-results');
        const empty = document.getElementById('invoice-empty');

        if (loading) loading.classList.toggle('d-none', !show);
        if (show) {
            if (results) results.classList.add('d-none');
            if (empty) empty.classList.add('d-none');
        }
    }

    function toggleGeneratorLoading(show) {
        const loading = document.getElementById('invoice-gen-loading');
        const results = document.getElementById('invoice-gen-results');
        const empty = document.getElementById('invoice-gen-empty');
        if (loading) loading.classList.toggle('d-none', !show);
        if (show) {
            if (results) results.classList.add('d-none');
            if (empty) empty.classList.add('d-none');
        }
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function formatCurrency(val) {
        const num = Number(val) || 0;
        return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    }

    function formatPeriod(period) {
        if (!period) return '';
        const str = String(period);
        // Expect yyyy-mm or yyyy-mm-dd
        let year, month;
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            year = str.slice(0, 4);
            month = str.slice(5, 7);
        } else if (/^\d{4}-\d{2}$/.test(str)) {
            year = str.slice(0, 4);
            month = str.slice(5, 7);
        } else {
            return str;
        }
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mIdx = Number(month) - 1;
        return `${months[mIdx] || month} ${year}`;
    }

    function fetchGeneratorHours() {
        if (!lastGeneratorFilters || !lastGeneratorFilters.cliente) {
            renderGeneratorResults([]);
            return;
        }

        toggleGeneratorLoading(true);
        ApiService.call('getHoursByClient',
            lastGeneratorFilters.fechaDesde,
            lastGeneratorFilters.fechaHasta,
            lastGeneratorFilters.cliente,
            lastGeneratorFilters.idCliente
        )
            .then(res => {
                generatorHours = (res && res.rows) ? res.rows : [];
                renderGeneratorResults(generatorHours);
            })
            .catch(err => {
                console.error('Error al cargar asistencia del cliente:', err);
                Alerts && Alerts.showAlert('Error al cargar asistencia del cliente: ' + err.message, 'danger');
            })
            .finally(() => toggleGeneratorLoading(false));
    }

    function refreshGeneratorList() {
        if (lastGeneratorFilters) {
            fetchGeneratorHours();
        }
    }

    function buildPresetFromHours(clienteRaw, desde, hasta) {
        const cliente = cleanClientValue(clienteRaw);
        const preset = {
            'RAZÓN SOCIAL': cliente || clienteRaw,
            'FECHA': new Date().toISOString().slice(0, 10),
            'OBSERVACIONES': (desde || hasta) ? `Período: ${desde || 's/d'} a ${hasta || 's/h'}` : ''
        };

        if (generatorHours && generatorHours.length > 0) {
            const totalHoras = generatorHours.reduce((acc, r) => acc + (Number(r.horas) || 0), 0);
            preset['HORAS'] = totalHoras || '';
            preset['CONCEPTO'] = `Servicios ${cliente} (${desde || ''} a ${hasta || ''})`;
            const idCli = getClientIdFromLabel(clienteRaw || cliente);
            if (idCli) {
                preset['ID_CLIENTE'] = idCli;
            }
        }
        if (desde) {
            preset['PERIODO'] = desde.slice(0, 7);
        }
        return preset;
    }

    function prefillFromHours(fecha, empleado, horas) {
        const clienteRaw = document.getElementById('invoice-gen-client')?.value || '';
        const cliente = cleanClientValue(clienteRaw);
        const desde = document.getElementById('invoice-gen-desde')?.value || '';
        const hasta = document.getElementById('invoice-gen-hasta')?.value || '';
        const preset = buildPresetFromHours(clienteRaw || cliente, desde, hasta);
        preset['FECHA'] = fecha || preset['FECHA'];
        preset['CONCEPTO'] = `Servicios ${cliente} - ${empleado || ''} ${fecha || ''}`;
        if (horas) preset['HORAS'] = horas;
        openModal(preset);
    }

    function editAttendance(id) {
        const row = generatorHours.find(r => String(r.id) === String(id));
        if (!row) {
            Alerts && Alerts.showAlert('Registro no encontrado.', 'warning');
            return;
        }
        const newHoras = prompt('Horas trabajadas', row.horas || '');
        if (newHoras === null) return;
        const newObs = prompt('Observaciones', row.observaciones || '');
        const payload = {
            'HORAS': Number(newHoras) || 0,
            'OBSERVACIONES': newObs || '',
            'ASISTENCIA': true,
            'CLIENTE': row.cliente || '',
            'ID_CLIENTE': row.idCliente || '',
            'EMPLEADO': row.empleado || '',
            'FECHA': row.fecha
        };
        UiState && UiState.setGlobalLoading(true, 'Guardando asistencia...');
        ApiService.call('updateRecord', 'ASISTENCIA', id, payload)
            .then(() => {
                Alerts && Alerts.showAlert('Registro actualizado.', 'success');
                refreshGeneratorList();
            })
            .catch(err => {
                console.error(err);
                Alerts && Alerts.showAlert('Error al actualizar: ' + err.message, 'danger');
            })
            .finally(() => UiState && UiState.setGlobalLoading(false));
    }

    function deleteAttendance(id) {
        const confirmPromise =
            typeof window !== 'undefined' &&
            window.UiDialogs &&
            typeof window.UiDialogs.confirm === 'function'
                ? window.UiDialogs.confirm({
                    title: 'Eliminar asistencia',
                    message: '¿Eliminar este registro de asistencia?',
                    confirmText: 'Eliminar',
                    cancelText: 'Cancelar',
                    confirmVariant: 'danger',
                    icon: 'bi-trash3-fill',
                    iconClass: 'text-danger'
                })
                : Promise.resolve(confirm('¿Eliminar este registro de asistencia?'));

        confirmPromise.then(function (confirmed) {
            if (!confirmed) return;

            UiState && UiState.setGlobalLoading(true, 'Eliminando asistencia...');
            ApiService.call('deleteRecord', 'ASISTENCIA', id)
                .then(() => {
                    Alerts && Alerts.showAlert('Registro eliminado.', 'success');
                    refreshGeneratorList();
                })
                .catch(err => {
                    console.error(err);
                    Alerts && Alerts.showAlert('Error al eliminar: ' + err.message, 'danger');
                })
                .finally(() => UiState && UiState.setGlobalLoading(false));
        });
    }

    function downloadPdf(id) {
        if (!id) return;
        UiState && UiState.setGlobalLoading(true, 'Generando PDF...');
        ApiService.call('generateInvoicePdf', id)
            .then(res => {
                if (!res || !res.base64) {
                    Alerts && Alerts.showAlert('No se pudo generar el PDF.', 'warning');
                    return;
                }
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,' + res.base64;
                link.download = res.filename || 'factura.pdf';
                link.click();
            })
            .catch(err => {
                console.error('Error al generar PDF:', err);
                Alerts && Alerts.showAlert('Error al generar PDF: ' + err.message, 'danger');
            })
            .finally(() => UiState && UiState.setGlobalLoading(false));
    }

	    function updateSelectionUi() {
	        const dlLastBtn = document.getElementById('invoice-download-last-btn');
	        if (dlLastBtn) {
	            dlLastBtn.disabled = !lastSavedInvoiceId;
	        }
	        const dlSelected = document.getElementById('invoice-download-selected');
	        if (dlSelected) {
	            dlSelected.disabled = selectedInvoiceIds.size === 0;
	        }
        const selectAll = document.getElementById('invoice-select-all');
        if (selectAll) {
            const checkboxes = document.querySelectorAll('.invoice-select');
            const total = checkboxes.length;
            const selected = selectedInvoiceIds.size;
            selectAll.checked = total > 0 && selected === total;
            selectAll.indeterminate = selected > 0 && selected < total;
        }
    }

    function toggleInvoiceSelection(id, checked) {
        const key = String(id);
        if (checked) {
            selectedInvoiceIds.add(key);
        } else {
            selectedInvoiceIds.delete(key);
        }
        updateSelectionUi();
    }

    function toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.invoice-select');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            const id = cb.getAttribute('data-id');
            if (checked) {
                selectedInvoiceIds.add(String(id));
            } else {
                selectedInvoiceIds.delete(String(id));
            }
        });
        updateSelectionUi();
    }

    function downloadSelectedPdfs() {
        if (selectedInvoiceIds.size === 0) return;
        const ids = Array.from(selectedInvoiceIds);
        (async () => {
            for (const id of ids) {
                try {
                    const res = await ApiService.call('generateInvoicePdf', id);
                    if (!res || !res.base64) continue;
                    const link = document.createElement('a');
                    link.href = 'data:application/pdf;base64,' + res.base64;
                    link.download = res.filename || `factura_${id}.pdf`;
                    link.click();
                } catch (err) {
                    console.error('PDF error', err);
                }
            }
        })();
    }

    return {
        render: render,
        editInvoice: editInvoice,
        deleteInvoice: deleteInvoice,
        openModal: openModal,
        downloadPdf: downloadPdf,
        prefillFromHours: prefillFromHours,
        editAttendance: editAttendance,
        deleteAttendance: deleteAttendance,
        setInvoicePage: setInvoicePage,
        setGeneratorPage: setGeneratorPage,
        toggleInvoiceSelection: toggleInvoiceSelection,
        toggleSelectAll: toggleSelectAll,
        generateCoverageInvoice: generateCoverageInvoice
    };
})();


/**
 * Panel de Detalle de Horas - Seguimiento por Empleado
 */
var HoursDetailPanel = (function () {
	    let containerId = 'hours-detail-panel';
	    let employeeIdMap = new Map();

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card shadow-sm mb-3">
                <div class="card-header bg-white py-2">
                    <h6 class="mb-0 text-primary fw-bold">
                        <i class="bi bi-clock-history me-2"></i>Seguimiento de Horas por Empleado
                    </h6>
                </div>
                <div class="card-body p-3">
                    <!-- Filtros -->
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label small text-muted fw-bold mb-1">Empleado</label>
                            <input list="hours-employee-list" id="hours-filter-employee" class="form-control form-control-sm" placeholder="Buscar empleado...">
                            <datalist id="hours-employee-list"></datalist>
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Desde</label>
                            <input type="date" id="hours-filter-start" class="form-control form-control-sm">
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
                            <input type="date" id="hours-filter-end" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-4 d-flex gap-2">
                            <button id="btn-search-hours" class="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1">
                                <i class="bi bi-search"></i> Buscar
                            </button>
                            <button id="btn-export-pdf" class="btn btn-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1">
                                <i class="bi bi-file-earmark-pdf-fill"></i> PDF
                            </button>
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div id="hours-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Cargando registros...</p>
                    </div>

                    <!-- Resumen -->
                    <div id="hours-summary" class="row g-2 mb-3 d-none">
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light">
                                <div class="card-body py-2 px-2 text-center">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Horas</div>
                                    <div class="fs-6 fw-bold text-dark" id="hours-summary-total">0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light">
                                <div class="card-body py-2 px-2 text-center">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Valor hora</div>
                                    <div class="fs-6 fw-bold text-dark" id="hours-summary-rate">$0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light">
                                <div class="card-body py-2 px-2 text-center">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Adelantos</div>
                                    <div class="fs-6 fw-bold text-danger" id="hours-summary-advances">$0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light">
                                <div class="card-body py-2 px-2 text-center">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Viáticos</div>
                                    <div class="fs-6 fw-bold text-dark" id="hours-summary-viaticos">$0</div>
                                </div>
                            </div>
                        </div>
                         <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light">
                                <div class="card-body py-2 px-2 text-center">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Presentismo</div>
                                    <div class="fs-6 fw-bold text-dark" id="hours-summary-presentismo">$0</div>
                                </div>
                            </div>
                        </div>
	                        <div class="col-6 col-md-2">
	                            <div class="lt-metric lt-metric--dark h-100 text-center">
	                                <div class="card-body py-2 px-2">
	                                    <div class="small lt-metric__k text-uppercase" style="font-size: 0.7rem;">Total a pagar</div>
	                                    <div class="fs-6 fw-bold" id="hours-summary-total-net">$0</div>
	                                    <div class="small lt-metric__k" style="font-size: 0.65rem;" id="hours-summary-total-gross"></div>
	                                </div>
	                            </div>
	                        </div>
                    </div>

                    <!-- Tabla de Resultados -->
                    <div id="hours-results-container" class="d-none">
                        <div class="table-responsive border rounded">
                            <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                                <thead class="bg-light">
                                    <tr>
                                        <th class="ps-3 py-2 text-muted font-weight-normal">Cliente</th>
                                        <th class="py-2 text-muted font-weight-normal">Fecha</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                                        <th class="py-2 text-muted font-weight-normal">Observaciones</th>
                                        <th class="text-end py-2 pe-3 text-muted font-weight-normal" style="width: 100px;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="hours-table-body">
                                    <!-- Rows will be injected here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Empty State -->
                    <div id="hours-empty-state" class="text-center py-4 d-none">
                        <i class="bi bi-search" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Utilizá los filtros para buscar registros.</p>
                    </div>
                </div>
            </div>
        `;

        // Populate Employees
        loadEmployees();

        // Set default dates (current month)
        setDefaultDates();

        // Attach Events
        document.getElementById('btn-search-hours').addEventListener('click', handleSearch);
        const pdfBtn = document.getElementById('btn-export-pdf');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', handleExportPdf);
        }
    }

    function setDefaultDates() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        document.getElementById('hours-filter-start').valueAsDate = firstDay;
        document.getElementById('hours-filter-end').valueAsDate = lastDay;
    }

    function loadEmployees() {
        const input = document.getElementById('hours-filter-employee');
        const datalist = document.getElementById('hours-employee-list');
        if (!input || !datalist) return;

        datalist.innerHTML = '';
        input.value = '';

        if (typeof ReferenceService === 'undefined') {
            console.warn('ReferenceService no disponible');
            return;
        }

        ReferenceService.load()
            .then(() => {
                const refs = ReferenceService.get();
                populateEmployeeSelect(refs && refs.empleados ? refs.empleados : []);
            })
            .catch(err => {
                console.error('Error loading employees:', err);
                Alerts.showAlert('No se pudieron cargar empleados. Reintentá.', 'warning');
            });
    }

	    function formatEmployeeLabel_(emp) {
	        if (!emp) return '';
	        if (typeof emp === 'string') return emp;
	        return (emp.nombre || emp.displayName || emp.empleado || emp.label || emp.razonSocial || '').toString().trim();
	    }

	    function getEmployeeIdFromLabel_(label) {
	        if (!label) return '';
	        return employeeIdMap.get(label) || '';
	    }

	    function populateEmployeeSelect(employees) {
	        const datalist = document.getElementById('hours-employee-list');
	        if (!datalist) return;

	        employeeIdMap = new Map();
	        const list = Array.isArray(employees) ? employees.slice() : [];
	        datalist.innerHTML = '';

	        const labels = list.map(emp => {
	            const label = formatEmployeeLabel_(emp);
	            if (label && emp && typeof emp === 'object') {
	                const id = emp.id || emp.ID || emp.ID_EMPLEADO;
	                if (id) {
	                    employeeIdMap.set(label, String(id));
	                }
	                const base = (emp.nombre || emp.displayName || emp.empleado || '').toString().trim();
	                if (base && id) {
	                    employeeIdMap.set(base, String(id));
	                }
	            }
	            return label;
	        }).filter(Boolean);

	        labels.sort((a, b) => a.localeCompare(b, 'es'));
	        labels.forEach(label => {
	            const option = document.createElement('option');
	            option.value = label;
	            datalist.appendChild(option);
	        });
	    }

    function handleSearch() {
        const start = document.getElementById('hours-filter-start').value;
        const end = document.getElementById('hours-filter-end').value;
	        const employeeRaw = document.getElementById('hours-filter-employee').value;
	        const idEmpleado = getEmployeeIdFromLabel_(employeeRaw);
	        const employee = employeeRaw;

	        if (!employee) {
	            Alerts.showAlert("Por favor seleccione un empleado", "warning");
	            return;
	        }

        // UI Loading
        document.getElementById('hours-results-container').classList.add('d-none');
        document.getElementById('hours-empty-state').classList.add('d-none');
        document.getElementById('hours-loading').classList.remove('d-none');

        const summaryBox = document.getElementById('hours-summary');
        if (summaryBox) summaryBox.classList.add('d-none');

	        ApiService.call('getHoursByEmployee', start, end, employee, idEmpleado)
	            .then(results => {
                const parsed = (typeof results === 'string')
                    ? (function () { try { return JSON.parse(results); } catch (e) { console.warn('No se pudo parsear resultados', e); return {}; } })()
                    : results || {};

                const rows = parsed && parsed.rows ? parsed.rows : (Array.isArray(parsed) ? parsed : []);
                const summary = parsed && parsed.summary ? parsed.summary : null;

                console.log('[HoursDetail] Resultados recibidos:', rows, 'Resumen:', summary);
                renderTable(rows || [], summary);
            })
            .catch(err => {
                console.error(err);
                Alerts.showAlert("Error al cargar horas: " + err.message, "danger");
            })
            .finally(() => {
                document.getElementById('hours-loading').classList.add('d-none');
            });
    }

    function handleExportPdf() {
        const start = document.getElementById('hours-filter-start').value;
        const end = document.getElementById('hours-filter-end').value;
        const employee = document.getElementById('hours-filter-employee').value;
        if (!employee) {
            Alerts.showAlert("Selecciona un empleado para exportar", "warning");
            return;
        }

        const btn = document.getElementById('btn-export-pdf');
        const originalContent = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Descargando...';
        }

        UiState && UiState.setGlobalLoading(true, 'Generando PDF...');
        ApiService.call('generateHoursPdf', start, end, employee)
            .then(res => {
                if (!res || !res.base64) throw new Error('No se pudo generar PDF');
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,' + res.base64;
                link.download = res.filename || 'reporte.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(err => {
                Alerts && Alerts.showAlert('Error generando PDF: ' + err.message, 'danger');
            })
            .finally(() => {
                UiState && UiState.setGlobalLoading(false);
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalContent;
                }
            });
    }

    function renderTable(data, summary) {
        const tbody = document.getElementById('hours-table-body');
        const container = document.getElementById('hours-results-container');
        const emptyState = document.getElementById('hours-empty-state');

        tbody.innerHTML = '';

        console.log('[HoursDetail] Renderizando tabla. Items:', Array.isArray(data) ? data.length : 'no-array', data && data[0]);

        if (!data || data.length === 0) {
            container.classList.add('d-none');
            emptyState.classList.remove('d-none');
            updateSummary(summary);
            return;
        }

        let total = 0;

        data.forEach(row => {
            const tr = document.createElement('tr');
            const hours = parseFloat(row.horas) || 0;
            total += hours;
            const isAbsent = row.asistencia === false;

	            tr.innerHTML = `
	                <td>${row.cliente || '-'}</td>
	                <td>${row.fecha}</td>
	                <td class="text-center fw-bold">${hours}</td>
	                <td class="text-muted small">${row.observaciones || '-'}</td>
	                <td class="text-end">
	                    <div class="d-flex gap-2 justify-content-end">
	                        <button class="btn btn-sm btn-outline-primary lt-btn-icon btn-edit-hour" data-id="${row.id}" title="Editar">
	                            <i class="bi bi-pencil-fill"></i>
	                        </button>
	                        <button class="btn btn-sm btn-outline-danger lt-btn-icon btn-delete-hour" data-id="${row.id}" title="Eliminar">
	                            <i class="bi bi-trash-fill"></i>
	                        </button>
	                    </div>
	                </td>
	            `;
            if (isAbsent) {
                tr.classList.add('absence-row');
            }
            tbody.appendChild(tr);
        });

        updateSummary(summary || { totalHoras: total });

        // Show Table
        container.classList.remove('d-none');
        emptyState.classList.add('d-none');

        // Attach Action Events
        attachActionEvents(data);
    }

    function updateSummary(summary) {
        const box = document.getElementById('hours-summary');
        if (!box) return;

        const totals = {
            totalHoras: 0,
            valorHora: 0,
            totalBruto: 0,
            adelantos: 0,
            totalNeto: 0,
            viaticos: 0,
            ...(summary || {})
        };

        const totalHorasEl = document.getElementById('hours-summary-total');
        const rateEl = document.getElementById('hours-summary-rate');
        const advEl = document.getElementById('hours-summary-advances');
        const netEl = document.getElementById('hours-summary-total-net');
        const grossEl = document.getElementById('hours-summary-total-gross');
        const viaticosEl = document.getElementById('hours-summary-viaticos');
        const presentismoEl = document.getElementById('hours-summary-presentismo');

        if (totalHorasEl) totalHorasEl.textContent = formatNumber(totals.totalHoras);
        if (rateEl) rateEl.textContent = formatCurrency(totals.valorHora);
        if (advEl) advEl.textContent = formatCurrency(totals.adelantos);
        if (netEl) netEl.textContent = formatCurrency(totals.totalNeto);
        if (grossEl) grossEl.textContent = 'Total: ' + formatCurrency(totals.totalBruto);
        if (viaticosEl) viaticosEl.textContent = formatCurrency(totals.viaticos);
        if (presentismoEl) presentismoEl.textContent = formatCurrency(totals.presentismo);

        box.classList.remove('d-none');
    }

    function formatNumber(value) {
        const num = Number(value);
        if (isNaN(num)) return '0';
        return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatCurrency(value) {
        const num = Number(value);
        return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    }

    function exportToCsv(data) {
        if (!data || data.length === 0) return;

        // CSV Headers
        const headers = ['ID', 'Fecha', 'Cliente', 'Empleado', 'Horas', 'Observaciones'];

        // CSV Rows
        const rows = data.map(row => [
            row.id,
            row.fecha,
            `"${(row.cliente || '').replace(/"/g, '""')}"`, // Escape quotes
            `"${(row.empleado || '').replace(/"/g, '""')}"`,
            row.horas,
            `"${(row.observaciones || '').replace(/"/g, '""')}"`
        ]);

        // Combine
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        // Create Blob and Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_horas_${timestamp}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function attachActionEvents(data) {
        // Edit
        document.querySelectorAll('.btn-edit-hour').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                const record = data.find(r => r.id == id);
                if (record) {
                    editRecord(id, record);
                }
            });
        });

        // Delete
        document.querySelectorAll('.btn-delete-hour').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                deleteRecord(id);
            });
        });
    }

    function editRecord(id, record) {
        openInlineEditModal(record);
    }

    function deleteRecord(id) {
        const confirmPromise =
            typeof window !== 'undefined' &&
            window.UiDialogs &&
            typeof window.UiDialogs.confirm === 'function'
                ? window.UiDialogs.confirm({
                    title: 'Eliminar registro de horas',
                    message: '¿Está seguro de eliminar este registro de horas?',
                    confirmText: 'Eliminar',
                    cancelText: 'Cancelar',
                    confirmVariant: 'danger',
                    icon: 'bi-trash3-fill',
                    iconClass: 'text-danger'
                })
                : Promise.resolve(confirm('¿Está seguro de eliminar este registro de horas?'));

        confirmPromise.then(function (confirmed) {
            if (!confirmed) return;

        UiState.setGlobalLoading(true, "Eliminando...");

        // Use existing delete logic
        // We need to know the format, which is ASISTENCIA
        ApiService.call('deleteRecord', ['ASISTENCIA', id])
            .then(() => {
                Alerts.showAlert("Registro eliminado correctamente", "success");
                handleSearch(); // Refresh table
            })
            .catch(err => {
                Alerts.showAlert("Error al eliminar: " + err.message, "danger");
            })
            .finally(() => {
                UiState.setGlobalLoading(false);
            });
        });
    }

    function openInlineEditModal(record) {
        const existing = document.getElementById('hours-edit-modal');
        if (existing) existing.remove();

        const modalHtml = `
            <div class="modal fade" id="hours-edit-modal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar asistencia</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label small text-muted">Empleado</label>
                                <input type="text" class="form-control" value="${HtmlHelpers.escapeHtml(record.empleado || '')}" disabled>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Cliente</label>
                                <input type="text" class="form-control" value="${HtmlHelpers.escapeHtml(record.cliente || '')}" disabled>
                            </div>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label small text-muted">Fecha</label>
                                    <input type="date" id="hours-edit-fecha" class="form-control" value="${record.fecha || ''}">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small text-muted">Horas</label>
                                    <input type="number" step="0.25" id="hours-edit-horas" class="form-control" value="${record.horas || ''}">
                                </div>
                            </div>
                            <div class="form-check form-switch mt-3">
                                <input class="form-check-input" type="checkbox" id="hours-edit-asistencia" ${record.asistencia === false ? '' : 'checked'}>
                                <label class="form-check-label" for="hours-edit-asistencia">Asistencia</label>
                            </div>
                            <div class="mt-3">
                                <label class="form-label small text-muted">Observaciones</label>
                                <textarea id="hours-edit-observaciones" class="form-control" rows="2">${record.observaciones || ''}</textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="hours-edit-save">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHtml.trim();
        document.body.appendChild(wrapper.firstChild);

        const modalEl = document.getElementById('hours-edit-modal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        const fechaInput = document.getElementById('hours-edit-fecha');
        const horasInput = document.getElementById('hours-edit-horas');
        const obsInput = document.getElementById('hours-edit-observaciones');
        const asistenciaInput = document.getElementById('hours-edit-asistencia');

        if (asistenciaInput) {
            asistenciaInput.checked = record.asistencia !== false;
        }
        if (horasInput && record.asistencia === false && record.horasPlan) {
            horasInput.value = record.horasPlan;
        }

        const saveBtn = document.getElementById('hours-edit-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                const fecha = fechaInput ? fechaInput.value : '';
                const horas = horasInput ? horasInput.value : '';
                const observaciones = obsInput ? obsInput.value : '';
                const asistencia = asistenciaInput ? asistenciaInput.checked : true;
                const horasToSave = asistencia ? horas : (horas || record.horasPlan || '');

                if (!fecha) {
                    Alerts.showAlert("Seleccione fecha.", "warning");
                    return;
                }

                UiState.setGlobalLoading(true, "Guardando...");

                const payload = {
                    'EMPLEADO': record.empleado,
                    'CLIENTE': record.cliente,
                    'FECHA': fecha,
                    'ASISTENCIA': asistencia,
                    'HORAS': horasToSave,
                    'OBSERVACIONES': observaciones
                };

                ApiService.call('updateRecord', 'ASISTENCIA', record.id, payload)
                    .then(() => {
                        Alerts.showAlert("Registro actualizado.", "success");
                        modal.hide();
                        modalEl.remove();
                        handleSearch();
                    })
                    .catch(err => {
                        Alerts.showAlert("Error al guardar: " + err.message, "danger");
                    })
                    .finally(() => {
                        UiState.setGlobalLoading(false);
                    });
            });
        }

        modalEl.addEventListener('hidden.bs.modal', () => {
            modalEl.remove();
        });
    }

    return {
        render: render
    };
})();


/**
 * Resumen mensual por cliente
 */
var ClientMonthlySummaryPanel = (function () {
    const containerId = 'client-monthly-summary-panel';

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card shadow-sm mb-3">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-calendar3 me-2"></i>Resumen Mensual</h6>
                    </div>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold mb-1">Mes</label>
                            <input type="month" id="cms-month" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1" id="cms-search">
                                <i class="bi bi-search"></i> Consultar
                            </button>
                        </div>
                    </div>

                    <div id="cms-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Calculando...</p>
                    </div>
                    <div id="cms-empty" class="text-center text-muted py-4 d-none">
                        <i class="bi bi-calendar-x" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Sin datos para el mes seleccionado.</p>
                    </div>
                    <div class="table-responsive lt-table-wrap d-none" id="cms-table-wrapper">
                        <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3 py-2 text-muted font-weight-normal">Cliente</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Días</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Valor hora</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Total</th>
                                    <th class="text-end py-2 pe-3 text-muted font-weight-normal">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="cms-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const monthInput = document.getElementById('cms-month');
        if (monthInput) {
            const now = new Date();
            const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            monthInput.value = ym;
        }

        const btn = document.getElementById('cms-search');
        if (btn) btn.addEventListener('click', handleSearch);
    }

    function handleSearch() {
        const monthInput = document.getElementById('cms-month');
        const val = monthInput ? monthInput.value : '';
        if (!val) {
            Alerts && Alerts.showAlert('Selecciona un mes', 'warning');
            return;
        }
        const [y, m] = val.split('-');
        toggleLoading(true);
        ApiService.call('getMonthlySummaryByClient', Number(y), Number(m))
            .then(renderTable)
            .catch(err => {
                console.error(err);
                Alerts && Alerts.showAlert('Error al calcular resumen: ' + err.message, 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function renderTable(rows) {
        const tbody = document.getElementById('cms-tbody');
        const wrapper = document.getElementById('cms-table-wrapper');
        const empty = document.getElementById('cms-empty');
        if (!tbody || !wrapper || !empty) return;

        tbody.innerHTML = '';

        if (!rows || !rows.length) {
            wrapper.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.cliente}</td>
                <td class="text-center fw-bold">${formatNumber(row.horas)}</td>
                <td class="text-center">${row.dias || 0}</td>
                <td class="text-center">${formatCurrency(row.valorHora)}</td>
                <td class="text-center fw-bold text-success">${formatCurrency(row.totalFacturacion)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary cms-view-detail" data-cliente="${HtmlHelpers.escapeHtml(row.cliente)}">
                        <i class="bi bi-eye"></i> Detalle
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // detalle -> cambia a Reporte Clientes con filtros del mes
        document.querySelectorAll('.cms-view-detail').forEach(btn => {
            btn.addEventListener('click', function () {
                const cliente = this.getAttribute('data-cliente');
                if (!cliente) return;
                const monthInput = document.getElementById('cms-month');
                const val = monthInput ? monthInput.value : '';
                const [y, m] = val.split('-');
                const start = `${y}-${m}-01`;
                const endDate = new Date(Number(y), Number(m), 0);
                const endStr = `${y}-${m}-${String(endDate.getDate()).padStart(2, '0')}`;

                const evt = new CustomEvent('view-change', { detail: { view: 'reportes-clientes' } });
                document.dispatchEvent(evt);

                setTimeout(() => {
                    const cliInput = document.getElementById('client-report-client');
                    const startInput = document.getElementById('client-report-start');
                    const endInput = document.getElementById('client-report-end');
                    if (cliInput) cliInput.value = cliente;
                    if (startInput) startInput.value = start;
                    if (endInput) endInput.value = endStr;
                    const btnSearch = document.getElementById('client-report-search');
                    if (btnSearch) btnSearch.click();
                }, 200);
            });
        });

        wrapper.classList.remove('d-none');
        empty.classList.add('d-none');
    }

    function toggleLoading(show) {
        const loading = document.getElementById('cms-loading');
        const empty = document.getElementById('cms-empty');
        const wrapper = document.getElementById('cms-table-wrapper');
        if (loading) loading.classList.toggle('d-none', !show);
        if (wrapper && show) wrapper.classList.add('d-none');
        if (empty && show) empty.classList.add('d-none');
    }

    function formatNumber(v) {
        const n = Number(v);
        return isNaN(n) ? '0.00' : n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatCurrency(v) {
        const n = Number(v);
        return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    }

    return { render };
})();


/**
 * Panel de Cuenta Corriente de Clientes
 */
var ClientAccountPanel = (function () {
    const containerId = 'client-account-panel';
    const clientIdMap = new Map();
    let lastQuery = null;

    function render() {
        // Find or create container
        let container = document.getElementById(containerId);
        if (!container) {
            // If not found, try to append to client report panel if it exists, or main view
            const parent = document.getElementById('view-reportes-clientes'); // Assuming this is the view ID
            if (parent) {
                container = document.createElement('div');
                container.id = containerId;
                container.className = 'mt-4';
                parent.appendChild(container);
            } else {
                return; // Can't render
            }
        }

        container.innerHTML = `
            <div class="card shadow-sm mb-3">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-wallet2 me-2"></i>Cuenta Corriente Clientes</h6>
                    </div>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
                            <input list="client-acc-list" id="client-acc-input" class="form-control form-control-sm" placeholder="Buscar cliente...">
                            <datalist id="client-acc-list"></datalist>
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Desde</label>
                            <input type="date" id="client-acc-start" class="form-control form-control-sm">
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
                            <input type="date" id="client-acc-end" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-5 d-flex gap-2">
                            <button class="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-acc-search">
                                <i class="bi bi-search"></i> Consultar
                            </button>
                            <button class="btn btn-outline-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-acc-open-invoices" title="Abrir facturas del cliente">
                                <i class="bi bi-receipt"></i> Ver facturas
                            </button>
                            <button class="btn btn-success btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-acc-pay">
                                <i class="bi bi-cash-coin"></i> Registrar Pago
                            </button>
                        </div>
                    </div>

                    <div id="client-acc-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Cargando movimientos...</p>
                    </div>

                    <div id="client-acc-empty" class="text-center text-muted py-4 d-none">
                        <i class="bi bi-receipt" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Seleccioná un cliente para ver su cuenta corriente.</p>
                    </div>

                    <div id="client-acc-summary" class="row g-2 mb-2 d-none"></div>

                    <div class="table-responsive lt-table-wrap d-none" id="client-acc-table-wrapper">
                        <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                                    <th class="py-2 text-muted font-weight-normal">Concepto</th>
                                    <th class="text-end py-2 text-muted font-weight-normal">Debe (Factura)</th>
                                    <th class="text-end py-2 text-muted font-weight-normal">Haber (Pago)</th>
                                    <th class="text-end py-2 pe-3 text-muted font-weight-normal">Saldo</th>
                                </tr>
                            </thead>
                            <tbody id="client-acc-tbody"></tbody>
                        </table>
                    </div>

                    <details class="mt-2 d-none" id="client-acc-debug">
                        <summary class="small text-muted">Diagnóstico</summary>
                        <pre class="small mb-0 mt-2 p-2 bg-light border rounded" id="client-acc-debug-pre" style="white-space: pre-wrap;"></pre>
                    </details>
                </div>
            </div>
        `;

        loadClients();
        setDefaultDates();
        attachEvents();
    }

    function loadClients() {
        const datalist = document.getElementById('client-acc-list');
        if (!datalist || !ReferenceService) return;

        ReferenceService.load().then(() => {
            const refs = ReferenceService.get();
            const clients = refs && refs.clientes ? refs.clientes : [];
            datalist.innerHTML = '';
            clientIdMap.clear();
            clients.forEach(c => {
                const label = formatClientLabel(c);
                const id = (c && typeof c === 'object' && c.id) ? c.id : '';
                if (label && id) {
                    clientIdMap.set(label, id);
                    clientIdMap.set(cleanClientValue(label), id);
                }
                const opt = document.createElement('option');
                opt.value = label;
                datalist.appendChild(opt);
            });
        });
    }

    function formatClientLabel(cli) {
        if (!cli) return '';
        if (typeof cli === 'string') return cli;
        const base = cli.razonSocial || cli.nombre || '';
        const cuit = cli.cuit ? ` (${cli.cuit})` : '';
        return (base + cuit).trim();
    }

    function cleanClientValue(raw) {
        if (!raw) return '';
        const idx = raw.indexOf('(');
        return idx > 0 ? raw.slice(0, idx).trim() : raw.trim();
    }

    function getClientIdFromLabel(label) {
        if (!label) return '';
        return clientIdMap.get(label) || clientIdMap.get(cleanClientValue(label)) || '';
    }

    function attachEvents() {
        const searchBtn = document.getElementById('client-acc-search');
        if (searchBtn) searchBtn.addEventListener('click', handleSearch);

        const openInvBtn = document.getElementById('client-acc-open-invoices');
        if (openInvBtn) openInvBtn.addEventListener('click', openInvoicesView);

        const payBtn = document.getElementById('client-acc-pay');
        if (payBtn) payBtn.addEventListener('click', openPaymentModal);
    }

    function setDefaultDates() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startInput = document.getElementById('client-acc-start');
        const endInput = document.getElementById('client-acc-end');
        if (startInput) startInput.valueAsDate = firstDay;
        if (endInput) endInput.valueAsDate = lastDay;
    }

    function handleSearch() {
        const clientRaw = document.getElementById('client-acc-input').value;
        const client = cleanClientValue(clientRaw);
        const idCliente = getClientIdFromLabel(clientRaw);
        const startDate = document.getElementById('client-acc-start').value;
        const endDate = document.getElementById('client-acc-end').value;

        if (!client) {
            Alerts && Alerts.showAlert('Seleccioná un cliente', 'warning');
            return;
        }

        if (!startDate || !endDate) {
            Alerts && Alerts.showAlert('Seleccioná un rango de fechas', 'warning');
            return;
        }

        lastQuery = { clientRaw, client, idCliente, startDate, endDate };

        toggleLoading(true);
        ApiService.call('getClientAccountStatement', client, startDate, endDate, idCliente)
            .then((data) => {
                renderTable(data);
                setDebug({ query: lastQuery, response: data }, false);
                // Si viene vacío, mostrar diagnóstico mínimo (cuántas facturas encuentra el buscador)
                const rows = data && data.movimientos ? data.movimientos : [];
                const saldoInicial = data && typeof data.saldoInicial === 'number' ? data.saldoInicial : 0;
                if (rows.length === 0 && saldoInicial === 0) {
                    ApiService.call('getInvoices', { cliente: client, idCliente: idCliente, fechaDesde: startDate, fechaHasta: endDate })
                        .then((invs) => {
                            const count = Array.isArray(invs) ? invs.length : 0;
                            const empty = document.getElementById('client-acc-empty');
                            if (empty) {
                                empty.innerHTML = '<i class="bi bi-info-circle" style="font-size: 1.5rem; opacity: 0.5;"></i>' +
                                    '<p class="small mt-2 mb-1">No hay movimientos registrados en este período.</p>' +
                                    '<div class="small text-muted">Facturas encontradas para este cliente y rango: <strong>' + count + '</strong></div>';
                            }
                            if (count > 0) {
                                setDebug({ query: lastQuery, response: data, invoicesFound: count }, true);
                            }
                        })
                        .catch(() => { /* ignore diagnóstico */ });
                }
            })
            .catch(err => {
                console.error(err);
                Alerts && Alerts.showAlert('Error al cargar cuenta corriente: ' + err.message, 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function openInvoicesView() {
        const q = lastQuery || {
            clientRaw: document.getElementById('client-acc-input')?.value || '',
            startDate: document.getElementById('client-acc-start')?.value || '',
            endDate: document.getElementById('client-acc-end')?.value || ''
        };

        const evt = new CustomEvent('view-change', { detail: { view: 'facturacion' } });
        document.dispatchEvent(evt);

        setTimeout(() => {
            const collapseEl = document.getElementById('invoice-history-collapse');
            if (collapseEl && typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
                try {
                    bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false }).show();
                } catch (e) { /* ignore */ }
            }
            const cli = document.getElementById('invoice-filter-client');
            const from = document.getElementById('invoice-filter-from');
            const to = document.getElementById('invoice-filter-to');
            if (cli && q.clientRaw) cli.value = q.clientRaw;
            if (from && q.startDate) from.value = q.startDate;
            if (to && q.endDate) to.value = q.endDate;
            const btn = document.getElementById('invoice-search-btn');
            if (btn) btn.click();
        }, 250);
    }

    function renderTable(data) {
        const tbody = document.getElementById('client-acc-tbody');
        const wrapper = document.getElementById('client-acc-table-wrapper');
        const empty = document.getElementById('client-acc-empty');
        const summaryEl = document.getElementById('client-acc-summary');

        if (!tbody || !wrapper || !empty) return;

        tbody.innerHTML = '';

        const rows = data && data.movimientos ? data.movimientos : [];
        const saldoInicial = data && typeof data.saldoInicial === 'number' ? data.saldoInicial : 0;

        if (rows.length === 0 && saldoInicial === 0) {
            wrapper.classList.add('d-none');
            if (summaryEl) summaryEl.classList.add('d-none');
            empty.classList.remove('d-none');
            empty.innerHTML = '<i class="bi bi-info-circle" style="font-size: 1.5rem; opacity: 0.5;"></i><p class="small mt-2 mb-0">No hay movimientos registrados en este período.</p>';
            return;
        }

        // Summary del período
        const totalDebe = rows.reduce((acc, r) => acc + (Number(r.debe) || 0), 0);
        const totalHaber = rows.reduce((acc, r) => acc + (Number(r.haber) || 0), 0);

        let saldoFinal = saldoInicial;
        if (rows.length > 0) {
            const lastRowSaldo = rows[rows.length - 1].saldo;
            saldoFinal = (lastRowSaldo !== undefined && lastRowSaldo !== null) ? Number(lastRowSaldo) : saldoInicial;
        }

        if (summaryEl) {
            const saldoClass = saldoFinal > 0 ? 'text-danger' : (saldoFinal < 0 ? 'text-success' : 'text-muted');
            summaryEl.innerHTML = `
                <div class="col-md-3">
                    <div class="card border-0 bg-light">
                        <div class="card-body py-2">
                            <div class="text-muted small fw-bold">Saldo anterior</div>
                            <div class="fw-bold">${formatCurrency(saldoInicial)}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 bg-light">
                        <div class="card-body py-2">
                            <div class="text-muted small fw-bold">Facturado</div>
                            <div class="fw-bold text-danger">${formatCurrency(totalDebe)}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 bg-light">
                        <div class="card-body py-2">
                            <div class="text-muted small fw-bold">Cobrado</div>
                            <div class="fw-bold text-success">${formatCurrency(totalHaber)}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 bg-light">
                        <div class="card-body py-2">
                            <div class="text-muted small fw-bold">Saldo final</div>
                            <div class="fw-bold ${saldoClass}">${formatCurrency(saldoFinal)}</div>
                        </div>
                    </div>
                </div>
            `;
            summaryEl.classList.remove('d-none');
        }

        // Fila de saldo inicial
        const initialRow = document.createElement('tr');
        initialRow.className = 'table-secondary fw-bold';
        initialRow.innerHTML = `
            <td class="ps-3" colspan="2">Saldo Anterior</td>
            <td class="text-end">-</td>
            <td class="text-end">-</td>
            <td class="text-end pe-3 ${saldoInicial > 0 ? 'text-danger' : (saldoInicial < 0 ? 'text-success' : 'text-muted')}">${formatCurrency(saldoInicial)}</td>
        `;
        tbody.appendChild(initialRow);

        // Movimientos del período
        rows.forEach(r => {
            const tr = document.createElement('tr');
            const saldoClass = r.saldo > 0 ? 'text-danger' : (r.saldo < 0 ? 'text-success' : 'text-muted');
            const dateStr = formatDateDisplay(r.fecha);

            tr.innerHTML = `
                <td class="ps-3">${dateStr}</td>
                <td>${r.concepto}</td>
                <td class="text-end text-danger">${r.debe > 0 ? formatCurrency(r.debe) : '-'}</td>
                <td class="text-end text-success">${r.haber > 0 ? formatCurrency(r.haber) : '-'}</td>
                <td class="text-end fw-bold pe-3 ${saldoClass}">${formatCurrency(r.saldo)}</td>
            `;
            tbody.appendChild(tr);
        });

        wrapper.classList.remove('d-none');
        empty.classList.add('d-none');
    }

    function openPaymentModal() {
        const clientRaw = document.getElementById('client-acc-input').value;
        const client = cleanClientValue(clientRaw);
        const idCliente = getClientIdFromLabel(clientRaw);
        if (!client) {
            Alerts && Alerts.showAlert('Seleccioná un cliente primero', 'warning');
            return;
        }

        const existing = document.getElementById('client-pay-modal');
        if (existing) existing.remove();

        const modalHtml = `
            <div class="modal fade" id="client-pay-modal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h6 class="modal-title fw-bold">Registrar Pago de Cliente</h6>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label small text-muted fw-bold">Cliente</label>
                                <input type="text" class="form-control" value="${client}" disabled>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted fw-bold">Fecha</label>
                                <input type="date" id="cp-fecha" class="form-control" value="${new Date().toISOString().slice(0, 10)}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted fw-bold">Monto</label>
                                <input type="number" id="cp-monto" class="form-control" step="0.01">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted fw-bold">Factura (opcional)</label>
                                <select id="cp-factura" class="form-select">
                                    <option value="">-- Sin factura --</option>
                                </select>
                                <div class="form-text">Vinculá el pago a una factura para reflejarlo en la cuenta corriente.</div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted fw-bold">Observaciones</label>
                                <textarea id="cp-obs" class="form-control" rows="2"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary btn-sm" id="cp-save">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHtml.trim();
        document.body.appendChild(wrapper.firstChild);

        const modalEl = document.getElementById('client-pay-modal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        // Cargar facturas pendientes del cliente (para vincular el pago)
        ApiService.call('getClientInvoicesForPayment', client, idCliente)
            .then(list => {
                const select = document.getElementById('cp-factura');
                if (!select) return;
                const items = Array.isArray(list) ? list : [];
                const help = modalEl.querySelector('.form-text');
                if (help) {
                    help.textContent = items.length
                        ? (`Facturas pendientes encontradas: ${items.length}.`)
                        : 'No hay facturas pendientes para vincular. Podés registrar el pago sin factura.';
                }
                items.forEach(inv => {
                    const opt = document.createElement('option');
                    opt.value = inv.id || '';
                    const fechaStr = inv.fecha ? formatDateDisplay(inv.fecha) : '';
                    const pendiente = inv.saldo != null ? Number(inv.saldo) : null;
                    const pendienteStr = (pendiente != null && !isNaN(pendiente) && pendiente > 0)
                        ? `Pendiente ${formatCurrency(pendiente)}`
                        : '';
                    const labelParts = [
                        inv.comprobante || 'Factura',
                        inv.numero || 'S/N',
                        inv.periodo || '',
                        fechaStr,
                        pendienteStr
                    ].filter(Boolean);
                    opt.textContent = labelParts.join(' - ');
                    opt.dataset.numero = inv.numero || '';
                    select.appendChild(opt);
                });
            })
            .catch(err => {
                console.error('No se pudieron cargar facturas del cliente:', err);
                const help = modalEl.querySelector('.form-text');
                if (help) {
                    help.textContent = 'Error cargando facturas pendientes: ' + (err && err.message ? err.message : String(err));
                }
            });

        const saveBtn = document.getElementById('cp-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                const fecha = document.getElementById('cp-fecha').value;
                const monto = document.getElementById('cp-monto').value;
                const obs = document.getElementById('cp-obs').value;
                const facturaSelect = document.getElementById('cp-factura');
                const facturaId = facturaSelect ? facturaSelect.value : '';
                const facturaNumero = facturaSelect && facturaSelect.selectedOptions[0] ? (facturaSelect.selectedOptions[0].dataset.numero || '') : '';

                if (!monto) {
                    Alerts.showAlert('Ingresá un monto', 'warning');
                    return;
                }

                UiState.setGlobalLoading(true, 'Guardando pago...');
                ApiService.call('recordClientPayment', {
                    fecha: fecha,
                    cliente: client,
                    idCliente: idCliente,
                    monto: monto,
                    detalle: obs,
                    idFactura: facturaId || '',
                    facturaNumero: facturaNumero
                })
                    .then(() => {
                        Alerts.showAlert('Pago registrado', 'success');
                        modal.hide();
                        modalEl.remove();
                        handleSearch(); // Refresh
                    })
                    .catch(err => {
                        Alerts.showAlert('Error: ' + err.message, 'danger');
                    })
                    .finally(() => UiState.setGlobalLoading(false));
            });
        }

        modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    }

    function toggleLoading(show) {
        const loading = document.getElementById('client-acc-loading');
        const empty = document.getElementById('client-acc-empty');
        const wrapper = document.getElementById('client-acc-table-wrapper');

        if (loading) loading.classList.toggle('d-none', !show);
        if (show) {
            if (empty) empty.classList.add('d-none');
            if (wrapper) wrapper.classList.add('d-none');
        }
    }

    function formatCurrency(v) {
        return Number(v).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    }

    function formatDateDisplay(v) {
        if (!v) return '';
        if (typeof v === 'string') {
            // yyyy-MM-dd -> dd/MM/yyyy (sin timezone issues)
            const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) return `${m[3]}/${m[2]}/${m[1]}`;
            const d = new Date(v);
            return isNaN(d.getTime()) ? v : d.toLocaleDateString('es-AR');
        }
        if (v instanceof Date) {
            return v.toLocaleDateString('es-AR');
        }
        const d = new Date(v);
        return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-AR');
    }

    function setDebug(payload, show) {
        const details = document.getElementById('client-acc-debug');
        const pre = document.getElementById('client-acc-debug-pre');
        if (!details || !pre) return;

        if (!show) {
            details.classList.add('d-none');
            details.open = false;
            return;
        }

        let text = '';
        try {
            text = JSON.stringify(payload, null, 2);
        } catch (e) {
            text = String(payload);
        }

        // limitar tamaño para no romper la UI
        if (text.length > 12000) {
            text = text.slice(0, 12000) + '\n... (truncado)';
        }

        pre.textContent = text;
        details.classList.remove('d-none');
        details.open = true;
    }

    return { render };
})();


/**
 * Panel de reporte de horas por cliente
 */
var ClientReportPanel = (function () {
    const containerId = 'client-report-panel';
    let lastRows = [];
    const clientIdMap = new Map();

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card shadow-sm mb-3">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-graph-up me-2"></i>Reporte de Clientes</h6>
                    </div>
                    <span class="badge text-bg-light border">Vista dedicada</span>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
                            <input list="client-report-client-list" id="client-report-client" class="form-control form-control-sm" placeholder="Buscar cliente...">
                            <datalist id="client-report-client-list"></datalist>
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Desde</label>
                            <input type="date" id="client-report-start" class="form-control form-control-sm">
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
                            <input type="date" id="client-report-end" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-4 d-flex gap-2">
                            <button class="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-report-search">
                                <i class="bi bi-search"></i> Buscar
                            </button>
                            <button class="btn btn-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-report-pdf" title="Descargar PDF">
                                <i class="bi bi-file-earmark-pdf-fill"></i> PDF
                            </button>
                        </div>
                    </div>

                    <div id="client-report-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Procesando...</p>
                    </div>

                    <div id="client-report-summary" class="row g-2 mb-3 d-none">
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light text-center">
                                <div class="card-body py-2 px-1">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Horas</div>
                                    <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-hours">0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light text-center">
                                <div class="card-body py-2 px-1">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Empleados</div>
                                    <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-emps">0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-2">
                            <div class="card h-100 shadow-none border bg-light text-center">
                                <div class="card-body py-2 px-1">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Días</div>
                                    <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-days">0</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="card h-100 shadow-none border bg-light text-center">
                                <div class="card-body py-2 px-1">
                                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Valor Hora</div>
                                    <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-rate">$0</div>
                                </div>
                            </div>
                        </div>
	                        <div class="col-12 col-md-3">
	                            <div class="lt-metric lt-metric--dark h-100 text-center">
	                                <div class="card-body py-2 px-1">
	                                    <div class="small lt-metric__k text-uppercase" style="font-size: 0.7rem;">Total a Facturar</div>
	                                    <div class="fs-5 fw-bold mb-0" id="client-summary-total">$0</div>
	                                </div>
	                            </div>
	                        </div>
                    </div>

                    <div id="client-report-aggregate" class="card shadow-none border mb-3 d-none">
                        <div class="card-header bg-light py-1 px-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="text-muted small fw-bold text-uppercase" style="font-size: 0.75rem;">Resumen por Empleado</span>
                                <span class="badge bg-white text-dark border" id="client-agg-count"></span>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive lt-table-wrap">
                                <table class="table table-sm mb-0 align-middle table-striped" style="font-size: 0.85rem;">
                                    <thead class="table-light text-muted">
                                        <tr>
                                            <th class="ps-3 border-0 font-weight-normal">Empleado</th>
                                            <th class="text-center border-0 font-weight-normal">Horas</th>
                                            <th class="text-center border-0 font-weight-normal">Días</th>
                                            <th class="text-center border-0 font-weight-normal">Registros</th>
                                        </tr>
                                    </thead>
                                    <tbody id="client-report-agg-body"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="client-report-results" class="d-none">
                        <div class="table-responsive lt-table-wrap">
                            <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                                <thead class="table-light">
                                    <tr>
                                        <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                                        <th class="py-2 text-muted font-weight-normal">Empleado</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Asist.</th>
                                        <th class="py-2 text-muted font-weight-normal">Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody id="client-report-tbody"></tbody>
                            </table>
                        </div>
                    </div>

                    <div id="client-report-empty" class="text-center text-muted py-4 d-none">
                        <i class="bi bi-search" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Utilizá los filtros para buscar registros.</p>
                    </div>
                </div>
            </div>
        `;

        lastRows = [];
        setDefaultDates();
        loadClients();
        attachEvents();
    }

    function attachEvents() {
        const searchBtn = document.getElementById('client-report-search');
        if (searchBtn) searchBtn.addEventListener('click', handleSearch);

        const pdfBtn = document.getElementById('client-report-pdf');
        if (pdfBtn) pdfBtn.addEventListener('click', handleExportPdf);

        const csvBtn = document.getElementById('client-report-csv');
        if (csvBtn) csvBtn.addEventListener('click', handleExportCsv);
    }

    function setDefaultDates() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startInput = document.getElementById('client-report-start');
        const endInput = document.getElementById('client-report-end');
        if (startInput) startInput.valueAsDate = firstDay;
        if (endInput) endInput.valueAsDate = lastDay;
    }

    function loadClients() {
        const datalist = document.getElementById('client-report-client-list');
        const input = document.getElementById('client-report-client');
        if (!datalist || !input) return;

        datalist.innerHTML = '';
        input.value = '';
        clientIdMap.clear();

        if (typeof ReferenceService === 'undefined' || !ReferenceService.load) {
            console.warn('ReferenceService no disponible');
            return;
        }

        ReferenceService.load()
            .then(() => {
                const refs = ReferenceService.get();
                populateClientList(refs && refs.clientes ? refs.clientes : []);
            })
            .catch(err => {
                console.error('Error cargando clientes:', err);
                Alerts && Alerts.showAlert('No se pudieron cargar clientes. Reintentá.', 'warning');
            });
    }

    function formatClientLabel(cli) {
        if (!cli) return '';
        if (typeof cli === 'string') return cli;
        // Preferir razón social, luego nombre; agregar CUIT si está disponible
        const base = cli.razonSocial || cli.nombre || '';
        const cuit = cli.cuit ? ` (${cli.cuit})` : '';
        return (base + cuit).trim();
    }

    function populateClientList(clients) {
        const datalist = document.getElementById('client-report-client-list');
        if (!datalist) return;

        datalist.innerHTML = '';
        const list = Array.isArray(clients) ? clients.slice() : [];

        list
            .map(cli => ({ raw: cli, label: formatClientLabel(cli) }))
            .filter(item => item.label)
            .sort((a, b) => a.label.localeCompare(b.label, 'es'))
            .forEach(item => {
                const raw = item.raw;
                const id = raw && typeof raw === 'object' && raw.id != null ? String(raw.id) : '';
                if (id) {
                    clientIdMap.set(item.label, id);
                    clientIdMap.set(cleanClientValue(item.label), id);
                    if (raw.razonSocial) clientIdMap.set(String(raw.razonSocial).trim(), id);
                    if (raw.nombre) clientIdMap.set(String(raw.nombre).trim(), id);
                }
                const opt = document.createElement('option');
                opt.value = item.label;
                datalist.appendChild(opt);
            });
    }

    function cleanClientValue(raw) {
        if (!raw) return '';
        const idx = raw.indexOf('(');
        return idx > 0 ? raw.slice(0, idx).trim() : raw.trim();
    }

    function getClientIdFromLabel(label) {
        if (!label) return '';
        return clientIdMap.get(label) || clientIdMap.get(cleanClientValue(label)) || '';
    }

    function getFilters() {
        const start = document.getElementById('client-report-start');
        const end = document.getElementById('client-report-end');
        const client = document.getElementById('client-report-client');

        return {
            start: start ? start.value : '',
            end: end ? end.value : '',
            client: client ? client.value : ''
        };
    }

    function handleSearch() {
        const filters = getFilters();
        if (!filters.client) {
            Alerts && Alerts.showAlert('Seleccioná un cliente para consultar', 'warning');
            return;
        }

        toggleLoading(true);
        const clientRaw = filters.client;
        const idCliente = getClientIdFromLabel(clientRaw);
        const clientClean = cleanClientValue(clientRaw);
        ApiService.call('getHoursByClient', filters.start, filters.end, clientClean, idCliente)
            .then(res => {
                const rows = res && res.rows ? res.rows : [];
                const summary = res && res.summary ? res.summary : {};
                lastRows = rows;
                renderSummary(rows, summary);
                renderTable(rows);
                renderAggregate(rows);
            })
            .catch(err => {
                console.error('Error en reporte de clientes:', err);
                Alerts && Alerts.showAlert('No se pudo cargar el reporte: ' + (err.message || err), 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function handleExportPdf() {
        const filters = getFilters();
        if (!filters.client) {
            Alerts && Alerts.showAlert('Seleccioná un cliente para exportar', 'warning');
            return;
        }
        if (!lastRows || lastRows.length === 0) {
            Alerts && Alerts.showAlert('Generá primero el reporte para descargarlo.', 'info');
            return;
        }

        const btn = document.getElementById('client-report-pdf');
        const originalContent = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Descargando...';
        }

        UiState && UiState.setGlobalLoading(true, 'Generando PDF...');
        ApiService.call('generateClientHoursPdf', filters.start, filters.end, cleanClientValue(filters.client))
            .then(res => {
                if (!res || !res.base64) throw new Error('No se pudo generar PDF');
                const link = document.createElement('a');
                link.href = 'data:application/pdf;base64,' + res.base64;
                link.download = res.filename || 'reporte_cliente.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(err => {
                Alerts && Alerts.showAlert('Error generando PDF: ' + err.message, 'danger');
            })
            .finally(() => {
                UiState && UiState.setGlobalLoading(false);
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalContent;
                }
            });
    }

    function handleExportCsv() {
        if (!lastRows || lastRows.length === 0) {
            Alerts && Alerts.showAlert('Nada para exportar. Buscá primero.', 'info');
            return;
        }

        const headers = ['Fecha', 'Cliente', 'Empleado', 'Horas', 'Asistencia', 'Observaciones'];
        const rows = lastRows.map(r => [
            r.fecha || '',
            '"' + (String(r.cliente || '')).replace(/"/g, '""') + '"',
            '"' + (String(r.empleado || '')).replace(/"/g, '""') + '"',
            Number(r.horas || 0),
            r.asistencia === false ? 'No' : 'Si',
            '"' + (String(r.observaciones || '')).replace(/"/g, '""') + '"'
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'reporte_cliente_' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function renderSummary(rows, summary) {
        const box = document.getElementById('client-report-summary');
        if (!box) return;

        if (!rows || rows.length === 0) {
            box.classList.add('d-none');
            return;
        }

        const totals = {
            totalHoras: 0,
            empleados: 0,
            dias: 0,
            valorHora: 0,
            totalFacturacion: 0,
            ...(summary || {})
        };

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('client-summary-hours', formatNumber(totals.totalHoras));
        setText('client-summary-emps', formatNumber(totals.empleados, 0));
        setText('client-summary-days', formatNumber(totals.dias, 0));
        const rateEl = document.getElementById('client-summary-rate');
        const totalEl = document.getElementById('client-summary-total');
        if (rateEl) rateEl.textContent = formatCurrency(totals.valorHora);
        if (totalEl) totalEl.textContent = formatCurrency(totals.totalFacturacion);

        box.classList.remove('d-none');
    }

    function renderAggregate(rows) {
        const wrapper = document.getElementById('client-report-aggregate');
        const tbody = document.getElementById('client-report-agg-body');
        const countBadge = document.getElementById('client-agg-count');
        if (!wrapper || !tbody) return;

        tbody.innerHTML = '';

        if (!rows || rows.length === 0) {
            wrapper.classList.add('d-none');
            if (countBadge) countBadge.textContent = '';
            return;
        }

        const aggMap = new Map();
        rows.forEach(r => {
            const key = r.empleado || 'Sin empleado';
            const entry = aggMap.get(key) || { horas: 0, dias: new Set(), registros: 0 };
            const h = Number(r.horas);
            entry.horas += isNaN(h) ? 0 : h;
            if (r.fecha) entry.dias.add(r.fecha);
            entry.registros += 1;
            aggMap.set(key, entry);
        });

        const list = Array.from(aggMap.entries()).map(([empleado, info]) => ({
            empleado: empleado,
            horas: info.horas,
            dias: info.dias.size,
            registros: info.registros
        })).sort((a, b) => b.horas - a.horas);

        list.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.empleado}</td>
                <td class="text-center fw-bold">${formatNumber(item.horas)}</td>
                <td class="text-center">${formatNumber(item.dias, 0)}</td>
                <td class="text-center">${formatNumber(item.registros, 0)}</td>
            `;
            tbody.appendChild(tr);
        });

        if (countBadge) countBadge.textContent = list.length + ' empleados';
        wrapper.classList.remove('d-none');
    }

    function renderTable(rows) {
        const tbody = document.getElementById('client-report-tbody');
        const results = document.getElementById('client-report-results');
        const empty = document.getElementById('client-report-empty');
        if (!tbody || !results || !empty) return;

        tbody.innerHTML = '';

        if (!rows || rows.length === 0) {
            results.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        rows.forEach(r => {
            const tr = document.createElement('tr');
            const asistenciaBadge = r.asistencia === false
                ? '<span class="badge bg-danger-subtle text-danger">No</span>'
                : '<span class="badge bg-success-subtle text-success">Sí</span>';
            tr.innerHTML = `
                <td>${r.fecha || ''}</td>
                <td>${r.empleado || ''}</td>
                <td class="text-center fw-bold">${formatNumber(r.horas)}</td>
                <td class="text-center">${asistenciaBadge}</td>
                <td class="text-muted small">${r.observaciones || '-'}</td>
            `;
            if (r.asistencia === false) {
                tr.classList.add('table-warning');
            }
            tbody.appendChild(tr);
        });

        results.classList.remove('d-none');
        empty.classList.add('d-none');
    }

    function toggleLoading(show) {
        const loading = document.getElementById('client-report-loading');
        const results = document.getElementById('client-report-results');
        const empty = document.getElementById('client-report-empty');

        if (loading) loading.classList.toggle('d-none', !show);
        if (show) {
            if (results) results.classList.add('d-none');
            if (empty) empty.classList.add('d-none');
        }
    }

    function formatNumber(val, decimals) {
        const num = Number(val);
        if (isNaN(num)) return '0';
        const fractionDigits = typeof decimals === 'number' ? decimals : 2;
        return num.toLocaleString('es-AR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
    }

    function formatCurrency(val) {
        const num = Number(val);
        return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    }

    return {
        render: render
    };
})();


/**
 * Panel de resumen mensual por empleado
 */
var MonthlySummaryPanel = (function () {
    const containerId = 'monthly-summary-panel';

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card shadow-sm mb-3">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-calendar3 me-2"></i>Resumen Mensual</h6>
                    </div>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold mb-1">Mes</label>
                            <input type="month" id="ms-month" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1" id="ms-search">
                                <i class="bi bi-search"></i> Consultar
                            </button>
                        </div>
                    </div>

                    <div id="ms-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Calculando...</p>
                    </div>
                    <div id="ms-empty" class="text-center text-muted py-4 d-none">
                        <i class="bi bi-calendar-x" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Sin datos para el mes seleccionado.</p>
                    </div>
                    <div class="table-responsive border rounded d-none" id="ms-table-wrapper">
                        <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                            <thead class="bg-light">
                                <tr>
                                    <th class="ps-3 py-2 text-muted font-weight-normal">Empleado</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Valor Hora</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Viáticos</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Presentismo</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Adelantos</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Total</th>
                                    <th class="text-end py-2 pe-3 text-muted font-weight-normal">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="ms-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const monthInput = document.getElementById('ms-month');
        if (monthInput) {
            const now = new Date();
            const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            monthInput.value = ym;
        }

        const btn = document.getElementById('ms-search');
        if (btn) btn.addEventListener('click', handleSearch);
    }

    function handleSearch() {
        const monthInput = document.getElementById('ms-month');
        const val = monthInput ? monthInput.value : '';
        if (!val) {
            Alerts && Alerts.showAlert('Selecciona un mes', 'warning');
            return;
        }
        const [y, m] = val.split('-');

        toggleLoading(true);
        ApiService.call('getMonthlySummary', Number(y), Number(m))
            .then(renderTable)
            .catch(err => {
                console.error(err);
                Alerts && Alerts.showAlert('Error al calcular resumen: ' + err.message, 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function renderTable(rows) {
        const tbody = document.getElementById('ms-tbody');
        const wrapper = document.getElementById('ms-table-wrapper');
        const empty = document.getElementById('ms-empty');

        if (!tbody || !wrapper || !empty) return;

        tbody.innerHTML = '';

        if (!rows || !rows.length) {
            wrapper.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.empleado}</td>
                <td class="text-center fw-bold">${formatNumber(row.horas)}</td>
                <td class="text-center">${formatCurrency(row.valorHora)}</td>
                <td class="text-center">${formatCurrency(row.viaticos)}</td>
                <td class="text-center">${formatCurrency(row.presentismo)}</td>
                <td class="text-center text-danger">${formatCurrency(row.adelantos)}</td>
                <td class="text-center fw-bold text-success">${formatCurrency(row.totalNeto)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary ms-view-detail" data-emp="${row.empleado}">
                        <i class="bi bi-eye"></i> Detalle
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Acción Ver detalle: cambia a Reportes y prefiltra
        document.querySelectorAll('.ms-view-detail').forEach(btn => {
            btn.addEventListener('click', function () {
                const emp = this.getAttribute('data-emp');
                if (!emp) return;
                const monthInput = document.getElementById('ms-month');
                const val = monthInput ? monthInput.value : '';
                const [y, m] = val.split('-');
                const start = `${y}-${m}-01`;
                const end = new Date(Number(y), Number(m), 0);
                const endStr = `${y}-${m}-${String(end.getDate()).padStart(2, '0')}`;

                const event = new CustomEvent('view-change', { detail: { view: 'reportes' } });
                document.dispatchEvent(event);

                setTimeout(() => {
                    const empInput = document.getElementById('hours-filter-employee');
                    const startInput = document.getElementById('hours-filter-start');
                    const endInput = document.getElementById('hours-filter-end');
                    if (empInput) empInput.value = emp;
                    if (startInput) startInput.value = start;
                    if (endInput) endInput.value = endStr;
                    const btnSearch = document.getElementById('btn-search-hours');
                    if (btnSearch) btnSearch.click();
                }, 200);
            });
        });

        wrapper.classList.remove('d-none');
        empty.classList.add('d-none');
    }

    function toggleLoading(show) {
        const loading = document.getElementById('ms-loading');
        const empty = document.getElementById('ms-empty');
        const wrapper = document.getElementById('ms-table-wrapper');
        if (loading) loading.classList.toggle('d-none', !show);
        if (wrapper && show) wrapper.classList.add('d-none');
        if (empty && show) empty.classList.add('d-none');
    }

    function formatNumber(v) {
        const n = Number(v);
        return isNaN(n) ? '0.00' : n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatCurrency(v) {
        const n = Number(v);
        return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    }

    return { render };
})();


/**
 * Cuenta corriente de empleados (debe/haber mensual)
 */
var AccountStatementPanel = (function () {
    const containerId = 'account-statement-panel';

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card shadow-sm mb-3">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-journal-text me-2"></i>Cuenta Corriente Empleados</h6>
                    </div>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold mb-1">Mes</label>
                            <input type="month" id="acc-month" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-4 d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1" id="acc-refresh" title="Actualizar">
                                <i class="bi bi-arrow-repeat"></i>
                            </button>
                            <button class="btn btn-success btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="acc-new-payment">
                                <i class="bi bi-cash-coin"></i> Registrar pago
                            </button>
                        </div>
                    </div>

                    <div id="acc-loading" class="text-center py-3 d-none">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p class="text-muted small mt-1 mb-0">Cargando...</p>
                    </div>
                    <div id="acc-empty" class="text-center text-muted py-4 d-none">
                        <i class="bi bi-wallet2" style="font-size: 1.5rem; opacity: 0.5;"></i>
                        <p class="small mt-2 mb-0">Sin movimientos para el mes seleccionado.</p>
                    </div>
                    <div class="table-responsive border rounded d-none" id="acc-table-wrapper">
                        <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                            <thead class="bg-light">
                                <tr>
                                    <th class="ps-3 py-2 text-muted font-weight-normal">Empleado</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Debe (neto)</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Haber (pagos+adelantos)</th>
                                    <th class="text-center py-2 text-muted font-weight-normal">Saldo</th>
                                </tr>
                            </thead>
                            <tbody id="acc-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const monthInput = document.getElementById('acc-month');
        if (monthInput) {
            const now = new Date();
            const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            monthInput.value = ym;
        }

        const refreshBtn = document.getElementById('acc-refresh');
        if (refreshBtn) refreshBtn.addEventListener('click', loadData);
        const newPayBtn = document.getElementById('acc-new-payment');
        if (newPayBtn) newPayBtn.addEventListener('click', openPaymentModal);
        loadData();
    }

    function loadData() {
        const monthInput = document.getElementById('acc-month');
        const val = monthInput ? monthInput.value : '';
        if (!val) return;
        const [y, m] = val.split('-');

        toggleLoading(true);
        ApiService.call('getEmployeeAccountStatement', Number(y), Number(m))
            .then(renderTable)
            .catch(err => {
                console.error(err);
                Alerts && Alerts.showAlert('Error cuenta corriente: ' + err.message, 'danger');
            })
            .finally(() => toggleLoading(false));
    }

    function renderTable(rows) {
        const tbody = document.getElementById('acc-tbody');
        const wrapper = document.getElementById('acc-table-wrapper');
        const empty = document.getElementById('acc-empty');
        if (!tbody || !wrapper || !empty) return;

        tbody.innerHTML = '';
        if (!rows || !rows.length) {
            wrapper.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        rows.forEach(r => {
            const tr = document.createElement('tr');
            const saldoClass = Number(r.saldo) >= 0 ? 'text-success' : 'text-danger';
            tr.innerHTML = `
                <td>${r.empleado}</td>
                <td class="text-center">${formatCurrency(r.debe)}</td>
                <td class="text-center">${formatCurrency(r.haber)}</td>
                <td class="text-center fw-bold ${saldoClass}">${formatCurrency(r.saldo)}</td>
            `;
            tbody.appendChild(tr);
        });

        wrapper.classList.remove('d-none');
        empty.classList.add('d-none');
    }

    function openPaymentModal() {
        const existing = document.getElementById('acc-payment-modal');
        if (existing) existing.remove();

        const modalHtml = `
            <div class="modal fade" id="acc-payment-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Registrar pago a empleado</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label small text-muted">Empleado</label>
                                <input list="acc-emp-list" id="acc-pay-emp" class="form-control" placeholder="Empleado">
                                <datalist id="acc-emp-list"></datalist>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Fecha</label>
                                <input type="date" id="acc-pay-fecha" class="form-control" value="${getToday()}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Concepto</label>
                                <input type="text" id="acc-pay-concepto" class="form-control" value="Pago mensual">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Monto</label>
                                <input type="number" step="0.01" id="acc-pay-monto" class="form-control">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Observaciones</label>
                                <textarea id="acc-pay-obs" class="form-control" rows="2"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="acc-pay-save">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHtml.trim();
        document.body.appendChild(wrapper.firstChild);

        const datalist = document.getElementById('acc-emp-list');
        if (datalist && ReferenceService && ReferenceService.get) {
            const emps = ReferenceService.get().empleados || [];
            datalist.innerHTML = '';
            emps.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e;
                datalist.appendChild(opt);
            });
        }

        const modalEl = document.getElementById('acc-payment-modal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        const saveBtn = document.getElementById('acc-pay-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                const emp = document.getElementById('acc-pay-emp').value;
                const fecha = document.getElementById('acc-pay-fecha').value;
                const concepto = document.getElementById('acc-pay-concepto').value;
                const monto = document.getElementById('acc-pay-monto').value;
                const obs = document.getElementById('acc-pay-obs').value;

                if (!emp || !monto) {
                    Alerts && Alerts.showAlert('Empleado y monto son requeridos', 'warning');
                    return;
                }

                UiState && UiState.setGlobalLoading(true, 'Guardando pago...');
                ApiService.call('recordEmployeePayment', fecha, emp, concepto, monto, obs)
                    .then(() => {
                        Alerts && Alerts.showAlert('Pago registrado', 'success');
                        modal.hide();
                        modalEl.remove();
                        loadData();
                    })
                    .catch(err => {
                        Alerts && Alerts.showAlert('Error al guardar pago: ' + err.message, 'danger');
                    })
                    .finally(() => {
                        UiState && UiState.setGlobalLoading(false);
                    });
            });
        }

        modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    }

    function toggleLoading(show) {
        const loading = document.getElementById('acc-loading');
        const empty = document.getElementById('acc-empty');
        const wrapper = document.getElementById('acc-table-wrapper');
        if (loading) loading.classList.toggle('d-none', !show);
        if (wrapper && show) wrapper.classList.add('d-none');
        if (empty && show) empty.classList.add('d-none');
    }

    function formatCurrency(v) {
        const n = Number(v);
        return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    }

    function getToday() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    return { render };
})();


/**
 * Panel de Valores Masivos (empleados/clientes/viáticos/presentismo)
 */
var BulkValuesPanel = (function () {
    const containerId = 'bulk-values-panel';

    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white py-3">
                    <h5 class="mb-0 text-primary">
                        <i class="bi bi-sliders me-2"></i>Valores masivos
                    </h5>
                    <small class="text-muted">Actualiza en bloque valores de empleados y clientes.</small>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">Valor hora (empleados)</label>
                            <input type="number" step="0.01" class="form-control" id="bulk-valor-hora-emp" placeholder="Ej: 2500">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">Valor hora (clientes)</label>
                            <input type="number" step="0.01" class="form-control" id="bulk-valor-hora-cli" placeholder="Ej: 3000">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">Viáticos (empleados)</label>
                            <input type="number" step="0.01" class="form-control" id="bulk-viaticos" placeholder="Ej: 500">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">Presentismo media jornada</label>
                            <input type="number" step="0.01" class="form-control" id="bulk-pres-media" placeholder="Ej: 1000">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">Presentismo jornada completa</label>
                            <input type="number" step="0.01" class="form-control" id="bulk-pres-full" placeholder="Ej: 1500">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-semibold">IVA (%)</label>
                            <input type="number" step="0.01" class="form-control" id="bulk-iva" placeholder="Ej: 21">
                        </div>
                    </div>

                    <div class="d-flex justify-content-end mt-4">
                        <button class="btn btn-primary" id="bulk-apply-btn">
                            <i class="bi bi-arrow-repeat me-2"></i>Aplicar masivo
                        </button>
                    </div>
                </div>
            </div>
        `;

        const btn = document.getElementById('bulk-apply-btn');
        if (btn) {
            btn.addEventListener('click', applyValues);
        }
    }

    function applyValues() {
        const payload = {
            valorHoraEmpleado: getInputValue('bulk-valor-hora-emp'),
            valorHoraCliente: getInputValue('bulk-valor-hora-cli'),
            viaticos: getInputValue('bulk-viaticos'),
            presentismoMedia: getInputValue('bulk-pres-media'),
            presentismoCompleta: getInputValue('bulk-pres-full'),
            ivaPorcentaje: getInputValue('bulk-iva')
        };

        UiState && UiState.setGlobalLoading(true, 'Aplicando valores...');

        ApiService.call('applyMassValues', payload)
            .then(() => {
                Alerts && Alerts.showAlert('Valores actualizados masivamente.', 'success');
                if (ReferenceService) {
                    ReferenceService.load().then(() => {
                        if (FormManager) {
                            FormManager.updateReferenceData(ReferenceService.get());
                        }
                    });
                }
            })
            .catch(err => {
                Alerts && Alerts.showAlert('Error al aplicar valores: ' + err.message, 'danger');
            })
            .finally(() => {
                UiState && UiState.setGlobalLoading(false);
            });
    }

    function getInputValue(id) {
        const el = document.getElementById(id);
        if (!el) return '';
        const v = el.value;
        return v === '' ? '' : v;
    }

    return {
        render
    };
})();


/**
 * Form Manager
 * Gestiona la carga, renderizado y configuración de formularios
 */

(function (global) {
    const FormManager = (() => {
        let currentFormat = null;
        let referenceData = { clientes: [], empleados: [] };

        /**
         * Inicializa el form manager con datos de referencia
         */
        function init(refData) {
            referenceData = refData || { clientes: [], empleados: [] };
        }

        /**
         * Carga los formatos disponibles desde el servidor
         */
        function loadFormats() {
            return ApiService.call('getAvailableFormats')
                .then(function (formats) {
                    if (!Array.isArray(formats) || !formats.length) {
                        renderFormatsOptions(buildLocalFormats());
                        if (Alerts) Alerts.showAlert("No pudimos cargar los formatos del servidor. Se usan formatos locales.", "warning");
                        return;
                    }
                    renderFormatsOptions(formats);
                })
                .catch(function (err) {
                    console.error("Error obteniendo formatos:", err);
                    renderFormatsOptions(buildLocalFormats());
                    if (Alerts) Alerts.showAlert("No pudimos cargar los formatos. Usando definiciones locales.", "warning");
                });
        }

        /**
         * Construye formatos desde definiciones locales
         */
        function buildLocalFormats() {
            const hidden = new Set(['FACTURACION', 'PAGOS', 'PAGOS_CLIENTES']);
            return Object.keys(FORM_DEFINITIONS)
                .filter(function (id) { return !hidden.has(id); })
                .map(function (id) {
                    return { id: id, name: FORM_DEFINITIONS[id].title || id };
                });
        }

        /**
         * Renderiza las opciones del selector de formatos
         */
        function renderFormatsOptions(formats) {
            if (!Array.isArray(formats)) return;
            const select = document.getElementById("formato");
            if (!select) return;

            select.innerHTML = "";
            formats.forEach(function (f) {
                const option = document.createElement("option");
                option.value = f.id;
                option.textContent = f.name;
                select.appendChild(option);
            });

            if (formats.length > 0) {
                currentFormat = formats[0].id;
                select.value = currentFormat;
                renderForm(currentFormat);
            }
        }

        /**
         * Renderiza un formulario específico
         * @param {string} tipoFormato - Tipo de formato a renderizar
         * @param {string} containerId - ID del contenedor (opcional, por defecto "form-fields")
         */
        function renderForm(tipoFormato, containerId) {
            currentFormat = tipoFormato;

            if (Alerts) Alerts.clearAlerts();

            const formDef = FORM_DEFINITIONS[tipoFormato];
            const container = document.getElementById(containerId || "form-fields");
            const titleEl = document.getElementById("form-title");
            const sugg = document.getElementById("search-suggestions");

            // Restaurar footer del modal por si fue ocultado
            const modalFooter = document.querySelector('.modal-footer-custom');
            if (modalFooter) modalFooter.style.display = '';

            if (!container) {
                console.error("Container not found:", containerId || "form-fields");
                return;
            }

            // Renderizado custom para asistencia diaria
            if (tipoFormato === "ASISTENCIA" && global.AttendanceDailyUI) {
                container.innerHTML = "";
                if (titleEl) titleEl.textContent = formDef ? formDef.title : "Registro";
                global.AttendanceDailyUI.render(container);
                // Actualizar visibilidad del footer si aplica
                if (global.FooterManager) {
                    global.FooterManager.updateVisibility();
                }
                return;
            }

            // Renderizado custom para Plan Semanal
            if (tipoFormato === "ASISTENCIA_PLAN" && global.WeeklyPlanPanel) {
                container.innerHTML = "";
                if (titleEl) titleEl.textContent = formDef ? formDef.title : "Plan Semanal";
                global.WeeklyPlanPanel.render(container);
                if (global.FooterManager) {
                    global.FooterManager.updateVisibility();
                }
                // Evitar que se cargue la grilla por defecto
                if (global.GridManager) {
                    const gridContainer = document.getElementById("grid-container");
                    if (gridContainer) gridContainer.innerHTML = "";
                }
                return;
            }

            container.innerHTML = "";
            if (sugg) {
                sugg.classList.add("d-none");
                sugg.innerHTML = "";
            }

            if (!formDef) {
                if (titleEl) titleEl.textContent = "Registro";
                container.innerHTML =
                    '<p class="text-muted small mb-0">No hay formulario definido para este formato.</p>';
                return;
            }

            if (titleEl) titleEl.textContent = formDef.title;

            formDef.fields.forEach(field => {
                const colDiv = document.createElement("div");
                colDiv.className = "col-12";

                const formGroup = FormRenderer.renderField(field, referenceData);
                colDiv.appendChild(formGroup);
                container.appendChild(colDiv);
            });

            // Autocompletar CUIT para FACTURACION y PAGOS_CLIENTES
            if (tipoFormato === "FACTURACION" || tipoFormato === "PAGOS_CLIENTES") {
                setupCuitAutocomplete();
            }

            // Fotos para CLIENTES (fachada / llave)
            if (tipoFormato === "CLIENTES" && typeof ClientMediaPanel !== "undefined" && ClientMediaPanel && typeof ClientMediaPanel.render === "function") {
                try {
                    ClientMediaPanel.render(container);
                } catch (e) {
                    console.warn("No se pudo renderizar panel de fotos:", e);
                }
            }

            // Actualizar visibilidad del footer
            if (global.FooterManager) {
                global.FooterManager.updateVisibility();
            }
        }

        /**
         * Configura autocompletado de CUIT
         */
        function setupCuitAutocomplete() {
            const rsSelect = document.getElementById("field-RAZÓN SOCIAL");
            const cuitInput = document.getElementById("field-CUIT");

            if (rsSelect && cuitInput) {
                rsSelect.addEventListener("change", function () {
                    const selected = this.value;
                    const cli = referenceData.clientes.find(c =>
                        (c.razonSocial || c.nombre) === selected
                    );
                    cuitInput.value = cli ? cli.cuit : "";
                });
            }
        }

        /**
         * Limpia el formulario actual
         */
        function clearForm() {
            if (!currentFormat) return;
            const formDef = FORM_DEFINITIONS[currentFormat];
            if (!formDef) return;

            formDef.fields.forEach(function (field) {
                const input = document.getElementById("field-" + field.id);
                if (!input) return;

                input.classList.remove("is-invalid");

                if (field.type === "boolean") {
                    input.checked = true;
                } else {
                    input.value = "";
                }
            });
        }

        /**
         * Actualiza los datos de referencia
         */
        function updateReferenceData(newRefData) {
            referenceData = newRefData || { clientes: [], empleados: [] };
            if (currentFormat) {
                renderForm(currentFormat);
            }
        }

        /**
         * Obtiene el formato actual
         */
        function getCurrentFormat() {
            return currentFormat;
        }

        return {
            init,
            loadFormats,
            renderForm,
            clearForm,
            updateReferenceData,
            getCurrentFormat
        };
    })();

    global.FormManager = FormManager;
})(typeof window !== "undefined" ? window : this);


/**
 * Record Manager
 * Maneja CRUD de registros (Create, Read, Update, Delete)
 */

(function (global) {
    const RecordManager = (() => {
        let currentMode = "create"; // "create" | "edit"
        let selectedRowNumber = null;

        function enterCreateMode(clear = true) {
            currentMode = "create";
            selectedRowNumber = null;

            if (clear && global.FormManager) {
                global.FormManager.clearForm();
            }

            if (global.SearchManager) {
                global.SearchManager.clearSearch();
            }

            if (global.FooterManager) {
                global.FooterManager.showCreateMode();
            }
        }

        function enterEditMode(id, record) {
            currentMode = "edit";
            selectedRowNumber = id; // Now stores ID instead of rowNumber
            loadRecordIntoForm(record);

            if (global.FooterManager) {
                global.FooterManager.showEditMode();
            }
        }

        function loadRecordForEdit(id, record) {
            enterEditMode(id, record);
        }

        function loadRecordIntoForm(record) {
            Object.keys(record).forEach(function (fieldId) {
                // Skip ID field - it's not editable
                if (fieldId === 'ID') return;

                const input = document.getElementById("field-" + fieldId);
                if (!input) return;

                const value = record[fieldId];

                if (input.type === "checkbox") {
                    // Recognize various truthy values including normalized strings
                    input.checked = value === true ||
                        value === "TRUE" ||
                        value === "true" ||  // Added for normalized boolean
                        value === "Activo" ||
                        value === 1 ||
                        value === "1";
                } else {
                    // For text inputs, use the value as-is (even if empty string)
                    input.value = value !== null && value !== undefined ? value : "";
                }
            });
        }

        function saveRecord() {
            const tipoFormato = global.FormManager ? global.FormManager.getCurrentFormat() : null;
            if (!tipoFormato) {
                if (Alerts) Alerts.showAlert("No hay formato seleccionado.", "warning");
                return;
            }

            // Flujo custom para asistencia diaria (plan vs real)
            if (tipoFormato === "ASISTENCIA" && global.AttendanceDailyUI) {
                global.AttendanceDailyUI.save();
                return;
            }

            const formDef = FORM_DEFINITIONS[tipoFormato];
            if (!formDef) return;

            const record = {};
            let hasErrors = false;

            formDef.fields.forEach(function (field) {
                const input = document.getElementById("field-" + field.id);
                if (!input) return;

                input.classList.remove("is-invalid");

                let value;
                if (field.type === "boolean") {
                    value = input.checked;
                } else {
                    value = input.value.trim();
                }

                record[field.id] = value;
            });

            if (hasErrors) {
                if (Alerts) Alerts.showAlert("Por favor completá los campos requeridos.", "warning");
                return;
            }

            UiState.setGlobalLoading(true, "Guardando...");

            if (currentMode === "edit" && selectedRowNumber) {
                // Update existing (selectedRowNumber now contains ID)
                ApiService.call('updateRecord', tipoFormato, selectedRowNumber, record)
                    .then(function () {
                        if (Alerts) Alerts.showAlert("✅ Registro actualizado correctamente.", "success");
                        enterCreateMode(true);
                        if (ReferenceService) {
                            ReferenceService.load().then(function () {
                                if (global.FormManager) {
                                    global.FormManager.updateReferenceData(ReferenceService.get());
                                }
                            });
                        }
                    })
                    .catch(function (err) {
                        if (Alerts) Alerts.showAlert("Error al actualizar: " + err.message, "danger");
                    })
                    .finally(function () {
                        UiState.setGlobalLoading(false);
                    });
            } else {
                // Create new
                ApiService.call('saveFormRecord', tipoFormato, record)
                    .then(function () {
                        if (Alerts) Alerts.showAlert("✅ Registro guardado correctamente.", "success");
                        enterCreateMode(true);
                        if (ReferenceService) {
                            ReferenceService.load().then(function () {
                                if (global.FormManager) {
                                    global.FormManager.updateReferenceData(ReferenceService.get());
                                }
                            });
                        }
                    })
                    .catch(function (err) {
                        if (Alerts) Alerts.showAlert("Error al guardar: " + err.message, "danger");
                    })
                    .finally(function () {
                        UiState.setGlobalLoading(false);
                    });
            }
        }

        function deleteRecord() {
            if (currentMode !== "edit" || !selectedRowNumber) {
                if (Alerts) Alerts.showAlert("No hay registro seleccionado para eliminar.", "warning");
                return;
            }

            const tipoFormato = global.FormManager ? global.FormManager.getCurrentFormat() : null;
            if (!tipoFormato) return;

            const confirmPromise =
                global.UiDialogs && typeof global.UiDialogs.confirm === "function"
                    ? global.UiDialogs.confirm({
                        title: "Eliminar registro",
                        message: "¿Estás seguro de que querés eliminar este registro?",
                        confirmText: "Eliminar",
                        cancelText: "Cancelar",
                        confirmVariant: "danger",
                        icon: "bi-trash3-fill",
                        iconClass: "text-danger"
                    })
                    : Promise.resolve(confirm("¿Estás seguro de que querés eliminar este registro?"));

            confirmPromise.then(function (confirmed) {
                if (!confirmed) return;

            UiState.setGlobalLoading(true, "Eliminando...");

            ApiService.call('deleteRecord', tipoFormato, selectedRowNumber)
                .then(function () {
                    if (Alerts) Alerts.showAlert("✅ Registro eliminado correctamente.", "success");
                    enterCreateMode(true);
                    if (ReferenceService) {
                        ReferenceService.load().then(function () {
                            if (global.FormManager) {
                                global.FormManager.updateReferenceData(ReferenceService.get());
                            }
                        });
                    }
                })
                .catch(function (err) {
                    if (Alerts) Alerts.showAlert("Error al eliminar: " + err.message, "danger");
                })
                .finally(function () {
                    UiState.setGlobalLoading(false);
                });
            });
        }

        function cancelEdit() {
            enterCreateMode(true);
        }

        return {
            enterCreateMode,
            loadRecordForEdit,
            saveRecord,
            deleteRecord,
            cancelEdit
        };
    })();

    global.RecordManager = RecordManager;
})(typeof window !== "undefined" ? window : this);


/**
 * Main application - Reduced version
 * Bootstraps and connects all modules
 * 
 * Dependencies loaded via bundle (in order):
 * - formDefinitions.js
 * - apiService.js  
 * - referenceService.js
 * - ui/alerts.js
 * - ui/state.js
 * - ui/formRenderer.js
 * - ui/footer.js
 * - utils/htmlHelpers.js
 * - forms/formManager.js
 * - search/searchManager.js
 * - records/recordManager.js
 * - attendance/weeklyPlanPanel.js
 * - attendance/attendancePanels.js
 */

(() => {
  if (typeof document === 'undefined') {
    return;
  }

  // ===== Bootstrap Application =====

  function initApp() {
    // 1. Load formats immediately
    if (FormManager) {
      FormManager.loadFormats().then(function () {
        // Después de cargar los formatos, disparar evento change para cargar la vista inicial correcta
        const formatoSelect = document.getElementById("formato");
        if (formatoSelect && formatoSelect.value) {
          formatoSelect.dispatchEvent(new Event('change'));
        }
      });
    }

    // 2. Load reference data
    ReferenceService.load()
      .then(function () {
        const refData = ReferenceService.get();

        // Initialize modules with reference data
        if (FormManager) {
          FormManager.init(refData);
          // Update UI with loaded data
          FormManager.updateReferenceData(refData);
        }

        if (WeeklyPlanPanel) {
          WeeklyPlanPanel.init(refData);
        }
      })
      .catch(function (err) {
        console.error("Error loading reference data:", err);
      });

    // Setup event handlers
    setupEventHandlers();
  }

  function setupEventHandlers() {
    // Format selector - Cargar grilla en lugar de formulario
    const formatoSelect = document.getElementById("formato");
    if (formatoSelect) {
      formatoSelect.addEventListener("change", function () {
        const tipoFormato = this.value;
        if (!tipoFormato) return;

        // Actualizar título de la página
        const pageTitle = document.getElementById('page-title');
        const selectedOption = this.options[this.selectedIndex];
        if (pageTitle && selectedOption) {
          pageTitle.textContent = selectedOption.text;
        }

        // CASO ESPECIAL: Plan Semanal
        if (tipoFormato === 'ASISTENCIA_PLAN' && typeof WeeklyPlanPanel !== 'undefined') {
          // Ocultar grilla estándar
          const gridContainer = document.getElementById('data-grid-container');
          if (gridContainer) gridContainer.classList.add('d-none');

          // Ocultar búsqueda y botón nuevo (ya que el panel tiene su propio botón nuevo)
          const searchInput = document.getElementById('search-query');
          if (searchInput) searchInput.parentElement.classList.add('d-none');

          const btnNuevo = document.getElementById('btn-nuevo');
          if (btnNuevo) btnNuevo.classList.add('d-none');

          const btnRefresh = document.getElementById('btn-refresh');
          if (btnRefresh) btnRefresh.classList.add('d-none');

          // Crear o mostrar contenedor del panel personalizado
          let customPanel = document.getElementById('custom-view-panel');
          if (!customPanel) {
            customPanel = document.createElement('div');
            customPanel.id = 'custom-view-panel';
            customPanel.className = 'mt-3';
            // Insertar en view-registro
            const viewRegistro = document.getElementById('view-registro');
            if (viewRegistro) viewRegistro.appendChild(customPanel);
          }
          customPanel.classList.remove('d-none');

          // Mostrar loading
          customPanel.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><div class="mt-2">Cargando planes...</div></div>';

          // Cargar registros para la lista
          ApiService.call("searchRecords", tipoFormato, "")
            .then(function (records) {
              WeeklyPlanPanel.renderList(customPanel, records || []);
            })
            .catch(function (err) {
              console.error("Error cargando lista de planes:", err);
              customPanel.innerHTML = '<div class="alert alert-danger">Error al cargar los planes: ' + (err.message || err) + '</div>';
            });

          return;
        }

        // Restaurar vista estándar para otros formatos
        const gridContainer = document.getElementById('data-grid-container');
        if (gridContainer) gridContainer.classList.remove('d-none');

        const searchInput = document.getElementById('search-query');
        if (searchInput) searchInput.parentElement.classList.remove('d-none');

        const btnNuevo = document.getElementById('btn-nuevo');
        if (btnNuevo) btnNuevo.classList.remove('d-none');

        const btnRefresh = document.getElementById('btn-refresh');
        if (btnRefresh) btnRefresh.classList.remove('d-none');

        const customPanel = document.getElementById('custom-view-panel');
        if (customPanel) customPanel.classList.add('d-none');

        // Cargar registros y mostrar en grilla
        ApiService.call("searchRecords", tipoFormato, "")
          .then(function (records) {
            if (GridManager) {
              GridManager.renderGrid(tipoFormato, records || []);
            }
          })
          .catch(function (err) {
            console.error("Error cargando registros:", err);
            if (GridManager) {
              GridManager.renderGrid(tipoFormato, []);
            }
          });
      });
    }

    // Search input - Filtrar grilla
    const searchInput = document.getElementById("search-query");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        const formatoSelect = document.getElementById("formato");
        const tipoFormato = formatoSelect ? formatoSelect.value : null;

        if (!tipoFormato) {
          if (this.value.length > 0 && Alerts) {
            Alerts.showAlert("Selecciona un formato primero para buscar", "warning");
          }
          return;
        }

        // Buscar y actualizar grilla
        ApiService.call("searchRecords", tipoFormato, this.value)
          .then(function (records) {
            if (GridManager) {
              GridManager.renderGrid(tipoFormato, records || []);
            }
          })
          .catch(function (err) {
            console.error("Error en búsqueda:", err);
          });
      });
    }

    // Botón Nuevo - Abrir modal
    const btnNuevo = document.getElementById("btn-nuevo");
    if (btnNuevo) {
      btnNuevo.addEventListener("click", function () {
        const formatoSelect = document.getElementById("formato");
        const tipoFormato = formatoSelect ? formatoSelect.value : null;

        if (!tipoFormato) {
          if (Alerts) {
            Alerts.showAlert("Selecciona un formato primero", "warning");
          }
          return;
        }

        // Abrir modal y renderizar formulario en el callback
        if (GridManager) {
          GridManager.openModal("Nuevo Registro", function () {
            if (FormManager) {
              FormManager.renderForm(tipoFormato);
              FormManager.clearForm();
            }
          });
        }
      });
    }

    // Botón Refresh
    const btnRefresh = document.getElementById("btn-refresh");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", function () {
        if (GridManager) {
          GridManager.refreshGrid();
        }
      });
    }

    // Modal - Botón Cerrar
    const btnCloseModal = document.getElementById("btn-close-modal");
    if (btnCloseModal) {
      btnCloseModal.addEventListener("click", function () {
        if (GridManager) {
          GridManager.closeModal();
        }
      });
    }

    // Modal - Botón Cancelar
    const btnCancelarModal = document.getElementById("btn-cancelar-modal");
    if (btnCancelarModal) {
      btnCancelarModal.addEventListener("click", function () {
        if (GridManager) {
          GridManager.closeModal();
        }
      });
    }

    // Modal - Botón Guardar
    const btnGuardarModal = document.getElementById("btn-guardar-modal");
    if (btnGuardarModal) {
      btnGuardarModal.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.saveRecord();
          // Cerrar modal después de guardar
          setTimeout(() => {
            if (GridManager) {
              GridManager.closeModal();
              GridManager.refreshGrid();
            }
          }, 500);
        }
      });
    }

    // Modal - Botón Eliminar
    const btnEliminarModal = document.getElementById("btn-eliminar-modal");
    if (btnEliminarModal) {
      btnEliminarModal.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.deleteRecord();
          // Cerrar modal después de eliminar
          setTimeout(() => {
            if (GridManager) {
              GridManager.closeModal();
              GridManager.refreshGrid();
            }
          }, 500);
        }
      });
    }

    // Cerrar modal al hacer clic fuera
    const modalOverlay = document.getElementById("form-modal");
    if (modalOverlay) {
      modalOverlay.addEventListener("click", function (e) {
        if (e.target === modalOverlay && GridManager) {
          GridManager.closeModal();
        }
      });
    }

    // Footer buttons
    if (Footer) {
      Footer.render();
    }

    // Tab Handling
    const tabInformes = document.getElementById('informes-tab');
    const tabGestion = document.getElementById('gestion-tab');
    const footerContainer = document.getElementById('footer-container');

    if (tabInformes) {
      tabInformes.addEventListener('shown.bs.tab', function (e) {
        // Initialize Hours Panel when tab is shown
        if (HoursDetailPanel) {
          HoursDetailPanel.render();
        }
        // Hide footer in Reports tab (optional, or keep it if needed)
        if (footerContainer) footerContainer.classList.add('d-none');
      });
    }

    if (tabGestion) {
      tabGestion.addEventListener('shown.bs.tab', function (e) {
        // Show footer in Management tab
        if (footerContainer) footerContainer.classList.remove('d-none');
      });
    }
    const btnSave = document.getElementById("btn-grabar");
    if (btnSave) {
      btnSave.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.saveRecord();
        }
      });
    }

    const btnCancel = document.getElementById("btn-limpiar");
    if (btnCancel) {
      btnCancel.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.cancelEdit();
        }
      });
    }

    const btnDelete = document.getElementById("btn-eliminar");
    if (btnDelete) {
      btnDelete.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.deleteRecord();
        }
      });
    }

    // Botones superiores (duplicados para acceso rápido)
    const btnSaveTop = document.getElementById("btn-grabar-top");
    if (btnSaveTop) {
      btnSaveTop.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.saveRecord();
        }
      });
    }

    const btnCancelTop = document.getElementById("btn-limpiar-top");
    if (btnCancelTop) {
      btnCancelTop.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.cancelEdit();
        }
      });
    }

    const btnDeleteTop = document.getElementById("btn-eliminar-top");
    if (btnDeleteTop) {
      btnDeleteTop.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.deleteRecord();
        }
      });
    }

    // Sidebar Initialization
    if (Sidebar) {
      Sidebar.init();

      // Handle view changes
      document.addEventListener('view-change', (e) => {
        const viewId = e.detail.view;
        const pageTitle = document.getElementById('page-title');
        const titles = {
          registro: 'Formularios',
          reportes: 'Reporte Empleados',
          'reportes-clientes': 'Reporte Clientes',
          facturacion: 'Facturación',
          configuracion: 'Configuración'
        };

        // Update Title
        if (pageTitle) {
          pageTitle.textContent = titles[viewId] || viewId.charAt(0).toUpperCase() + viewId.slice(1);
        }

        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => {
          el.classList.add('d-none');
        });

        // Show target view
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) {
          targetView.classList.remove('d-none');
        }

        // Initialize view-specific content
        if (viewId === 'reportes' && HoursDetailPanel) {
          if (MonthlySummaryPanel) MonthlySummaryPanel.render();
          HoursDetailPanel.render();
          if (AccountStatementPanel) AccountStatementPanel.render();
        }
        if (viewId === 'reportes-clientes' && typeof ClientReportPanel !== 'undefined') {
          if (typeof ClientMonthlySummaryPanel !== 'undefined') {
            ClientMonthlySummaryPanel.render();
          }
          if (typeof ClientAccountPanel !== 'undefined') {
            ClientAccountPanel.render();
          }
          ClientReportPanel.render();
        }
        if (viewId === 'configuracion' && BulkValuesPanel) {
          BulkValuesPanel.render();
        }
        if (viewId === 'facturacion' && typeof InvoicePanel !== 'undefined') {
          InvoicePanel.render();
        }
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();

