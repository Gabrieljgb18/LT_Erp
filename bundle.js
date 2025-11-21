// Archivo generado. Editá los módulos en /src y corré `node generate_bundle_html.js`.
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
        { id: "VALOR DE HORA", label: "Valor de hora", type: "number", step: "0.01" },
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
        { id: "DIRECCCION", label: "Dirección", type: "text", full: true },
        { id: "TELEFONO", label: "Teléfono", type: "phone" },
        { id: "CONTACTO DE EMERGENCIA", label: "Contacto de emergencia", type: "phone", full: true },
        { id: "CBU - ALIAS", label: "CBU / Alias", type: "text", full: true },
        { id: "DNI", label: "DNI", type: "dni" },
        { id: "VALOR DE HORA", label: "Valor de hora", type: "number", step: "0.01" }
      ]
    },
    FACTURACION: {
      title: "Registro de facturación",
      fields: [
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "COMPROBANTE", label: "Comprobante", type: "text" },
        { id: "NÚMERO", label: "Número", type: "text" },
        { id: "RAZÓN SOCIAL", label: "Razón social", type: "cliente", full: true },
        { id: "CUIT", label: "CUIT", type: "text" },
        { id: "IMPORTE", label: "Importe", type: "number", step: "0.01" },
        { id: "SUBTOTAL", label: "Subtotal", type: "number", step: "0.01" },
        { id: "TOTAL", label: "Total", type: "number", step: "0.01" }
      ]
    },
    PAGOS: {
      title: "Registro de pagos",
      fields: [
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "RAZÓN SOCIAL", label: "Razón social", type: "cliente", full: true },
        { id: "CUIT", label: "CUIT", type: "text" },
        { id: "DETALLE", label: "Detalle", type: "text", full: true },
        { id: "Nº COMPROBANTE", label: "Nº comprobante", type: "text" },
        { id: "MEDIO DE PAGO", label: "Medio de pago", type: "text" },
        { id: "MONTO", label: "Monto", type: "number", step: "0.01" }
      ]
    },
    ASISTENCIA_PLAN: {
      title: "Plan de asistencia semanal",
      fields: [{ id: "CLIENTE", label: "Cliente", type: "cliente", full: true }]
    },
    ASISTENCIA: {
      title: "Registro de asistencia",
      fields: [{ id: "FECHA", label: "Fecha", type: "date" }]
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
        default:
          return renderInput(field);
      }
    }
  };

  global.FormRenderer = FormRenderer;
})(typeof window !== "undefined" ? window : this);


// UI bootstrap: requiere FORM_DEFINITIONS, ApiService y ReferenceService cargados antes.
(() => {
      if (typeof document === 'undefined') {
        return;
      }
      // Usa ApiService, ReferenceService y FORM_DEFINITIONS definidos en módulos cargados antes
      const CACHE_MS = (typeof CACHE_TTL_MS !== 'undefined') ? CACHE_TTL_MS : 5 * 60 * 1000;

      // UiState y alerts se definen en /src/ui/*.js

      // FORM_DEFINITIONS se carga desde app_constants.js

      let currentFormat = null;
      let currentMode = "create"; // "create" | "edit"
      let selectedRowNumber = null;
      let suggestionResults = [];
      let searchDebounce = null;
      let referenceData = ReferenceService ? ReferenceService.get() : { clientes: [], empleados: [] };
      let referenceLoaded = ReferenceService ? ReferenceService.isLoaded() : false;


  function loadReferenceData() {
        return ReferenceService.load()
          .then(function () {
            referenceData = ReferenceService.get();
          })
          .finally(function () {
            referenceLoaded = ReferenceService.isLoaded();
            if (currentFormat) renderForm(currentFormat);
          });
      }

      function refreshReferenceAndRerender() {
        loadReferenceData();
        setTimeout(() => {
          if (currentFormat) renderForm(currentFormat);
        }, 200);
      }


      // ==== Cargar formatos ====

      function loadFormats() {
        return ApiService.call('getAvailableFormats')
          .then(function (formats) {
            if (!Array.isArray(formats) || !formats.length) {
              renderFormatsOptions(buildLocalFormats());
              showAlert("No pudimos cargar los formatos del servidor. Se usan formatos locales.", "warning");
              return;
            }
            renderFormatsOptions(formats);
          })
          .catch(function (err) {
            console.error("Error obteniendo formatos:", err);
            // Fallback: cargar formatos desde las definiciones locales
            renderFormatsOptions(buildLocalFormats());
            showAlert("No pudimos cargar los formatos. Usando definiciones locales.", "warning");
          });
      }

      function buildLocalFormats() {
        return Object.keys(FORM_DEFINITIONS).map(function (id) {
          return { id: id, name: FORM_DEFINITIONS[id].title || id };
        });
      }

      function renderFormatsOptions(formats) {
        if (!Array.isArray(formats)) return;
        const select = document.getElementById("formato");
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
          if (referenceLoaded) {
            renderForm(currentFormat);
          }
        }
      }


    function renderForm(tipoFormato) {
  currentFormat = tipoFormato;
  enterCreateMode(false);

  clearAlerts();

  const formDef = FORM_DEFINITIONS[tipoFormato];
  const container = document.getElementById("form-fields");
  const titleEl = document.getElementById("form-title");
  const sugg = document.getElementById("search-suggestions");

  container.innerHTML = "";
  sugg.classList.add("d-none");
  sugg.innerHTML = "";

  if (!formDef) {
    titleEl.textContent = "Registro";
    container.innerHTML =
      '<p class="text-muted small mb-0">No hay formulario definido para este formato.</p>';
    return;
  }

  titleEl.textContent = formDef.title;

  formDef.fields.forEach(field => {
    const colDiv = document.createElement("div");
    colDiv.className = "col-12";

    const formGroup = FormRenderer.renderField(field, referenceData);
    colDiv.appendChild(formGroup);
    container.appendChild(colDiv);
  });

  // AUTOCOMPLETAR CUIT
  if (tipoFormato === "FACTURACION" || tipoFormato === "PAGOS") {
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

  if (tipoFormato === "ASISTENCIA") {
    setupAsistenciaDiaPanel();  
  }

    if (tipoFormato === "ASISTENCIA_PLAN") {
    //setupCoveragePanelForPlan();
    setupPlanSemanaPanel();
  }
   updateFooterVisibility();
}



  function setupAsistenciaPlanPanel() {
  const container = document.getElementById("form-fields");
  if (!container) return;

  // Si ya existe, lo limpiamos
  let panel = document.getElementById("asistencia-plan-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "asistencia-plan-panel";
    panel.className = "mt-2";
    container.appendChild(panel);
  }
  panel.innerHTML =
    '<div class="mt-2 p-2 border rounded bg-light">' +
    '<div class="small fw-bold mb-1">Plan vs realidad</div>' +
    '<div class="small text-muted mb-1">Seleccioná FECHA y CLIENTE para ver los empleados planificados y registrar la asistencia real.</div>' +
    '<div class="small text-muted">No hay datos por ahora.</div>' +
    '</div>';

  const fechaInput = document.getElementById("field-FECHA");
  const clienteInput = document.getElementById("field-CLIENTE");

  if (fechaInput && clienteInput) {
    const handler = function () {
      fetchPlanVsAsistencia();
    };
    fechaInput.addEventListener("change", handler);
    clienteInput.addEventListener("change", handler);
  }
}

function setupCoveragePanelForPlan() {
  const container = document.getElementById("form-fields");
  if (!container) return;

  let panel = document.getElementById("cliente-coverage-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "cliente-coverage-panel";
    panel.className = "mt-2";
    container.appendChild(panel);
  }

  panel.innerHTML =
    '<div class="mt-2 p-2 border rounded bg-light">' +
    '<div class="small fw-bold mb-1">Cobertura de horas del cliente</div>' +
    '<div class="small text-muted">Elegí un cliente y un día de la semana para ver si el plan actual cubre las horas requeridas.</div>' +
    "</div>";

  const clienteSelect = document.getElementById("field-CLIENTE");
  const diaSelect = document.getElementById("field-DIA SEMANA");

  const handler = function () {
    updateCoveragePanel();
  };

  if (clienteSelect) clienteSelect.addEventListener("change", handler);
  if (diaSelect) diaSelect.addEventListener("change", handler);
}

function updateCoveragePanel() {
  const panel = document.getElementById("cliente-coverage-panel");
  if (!panel) return;

  const clienteSelect = document.getElementById("field-CLIENTE");
  const diaSelect = document.getElementById("field-DIA SEMANA");

  const cliente = clienteSelect ? clienteSelect.value : "";
  const dia = diaSelect ? diaSelect.value : "";

  if (!cliente || !dia) {
    panel.innerHTML =
      '<div class="mt-2 p-2 border rounded bg-light">' +
      '<div class="small fw-bold mb-1">Cobertura de horas del cliente</div>' +
      '<div class="small text-muted">Seleccioná un cliente y un día de la semana.</div>' +
      "</div>";
    return;
  }

  panel.innerHTML =
    '<div class="mt-2 p-2 border rounded bg-light">' +
    '<div class="small fw-bold mb-1">Cobertura de horas del cliente</div>' +
    '<div class="small text-muted">Calculando cobertura para ' +
    cliente +
    " · " +
    dia +
    "...</div>" +
    "</div>";

  ApiService.callLatest('coverage-' + cliente + '-' + dia, 'getClientDayCoverage', cliente, dia)
    .then(function (res) {
      if (res && res.ignored) return;
      const required = res && typeof res.required === "number" ? res.required : 0;
      const planned = res && typeof res.planned === "number" ? res.planned : 0;
      const diff = planned - required;

      let badgeText = "";
      let badgeClass = "";

      if (required === 0 && planned === 0) {
        badgeText = "Sin horas requeridas ni planificadas.";
        badgeClass = "text-muted";
      } else if (diff === 0) {
        badgeText = "Plan OK: se cumplen exactamente las horas requeridas.";
        badgeClass = "text-success";
      } else if (diff < 0) {
        badgeText = "Faltan " + Math.abs(diff) + " hs para cubrir el requerimiento.";
        badgeClass = "text-danger";
      } else {
        badgeText = "Hay " + diff + " hs planificadas de más.";
        badgeClass = "text-warning";
      }

      panel.innerHTML =
        '<div class="mt-2 p-2 border rounded bg-light">' +
        '<div class="small fw-bold mb-1">Cobertura de horas del cliente</div>' +
        '<div class="small mb-1">Cliente: <strong>' +
        cliente +
        "</strong> · Día: <strong>" +
        dia +
        "</strong></div>" +
        '<div class="small mb-1">Horas requeridas: <strong>' +
        required +
        " hs</strong></div>" +
        '<div class="small mb-1">Horas planificadas: <strong>' +
        planned +
        " hs</strong></div>" +
        '<div class="small ' +
        badgeClass +
        ' mb-0">' +
        badgeText +
        "</div>" +
        "</div>";
    })
    .catch(function (err) {
      panel.innerHTML =
        '<div class="mt-2 p-2 border rounded bg-light">' +
        '<div class="small fw-bold mb-1">Cobertura de horas del cliente</div>' +
        '<div class="small text-danger">Error al calcular cobertura: ' +
        err.message +
        "</div></div>";
    });
}


function fetchPlanVsAsistencia() {
  const fechaInput = document.getElementById("field-FECHA");
  const clienteInput = document.getElementById("field-CLIENTE");

  if (!fechaInput || !clienteInput) return;

  const fecha = fechaInput.value;
  const cliente = clienteInput.value;

  if (!fecha || !cliente) {
    // Si falta algo, limpiamos el panel
    const panel = document.getElementById("asistencia-plan-panel");
    if (panel) {
      panel.innerHTML =
        '<div class="mt-2 p-2 border rounded bg-light">' +
        '<div class="small fw-bold mb-1">Plan vs realidad</div>' +
        '<div class="small text-muted">Completá FECHA y CLIENTE para ver la planificación.</div>' +
        '</div>';
    }
    return;
  }

  ApiService.callLatest('plan-vs-' + fecha + '-' + cliente, 'getPlanVsAsistencia', fecha, cliente)
    .then(function (data) {
      if (data && data.ignored) return;
      buildPlanVsRealPanel(data || [], fecha, cliente);
    })
    .catch(function (err) {
      const panel = document.getElementById("asistencia-plan-panel");
      if (panel) {
        panel.innerHTML =
          '<div class="mt-2 p-2 border rounded bg-light">' +
          '<div class="small fw-bold mb-1">Plan vs realidad</div>' +
          '<div class="small text-danger">Error al cargar: ' +
          err.message +
          "</div></div>";
      }
    });
}

function buildPlanVsRealPanel(rows, fecha, cliente) {
  const panel = document.getElementById("asistencia-plan-panel");
  if (!panel) return;

  if (!rows.length) {
    panel.innerHTML =
      '<div class="mt-2 p-2 border rounded bg-light">' +
      '<div class="small fw-bold mb-1">Plan vs realidad</div>' +
      '<div class="small mb-1">Para esta fecha y cliente no hay planificación registrada ni asistencia cargada.</div>' +
      '<div class="small text-muted">Podés crear el plan desde el formato <strong>ASISTENCIA_PLAN</strong>.</div>' +
      '</div>';
    return;
  }

  let html = '';
  html += '<div class="mt-2 p-2 border rounded bg-light">';
  html += '<div class="small fw-bold mb-1">Plan vs realidad</div>';
  html +=
    '<div class="small mb-2">Fecha: <strong>' +
    fecha +
    "</strong> · Cliente: <strong>" +
    cliente +
    "</strong></div>";

  html +=
    '<div class="table-responsive">' +
    '<table class="table table-sm table-bordered align-middle mb-2">' +
    "<thead>" +
    "<tr>" +
    '<th class="small">Empleado</th>' +
    '<th class="small text-center">Planificado</th>' +
    '<th class="small text-center">Asistió</th>' +
    '<th class="small text-center" style="width:80px;">Horas</th>' +
    '<th class="small">Observaciones</th>' +
    "</tr>" +
    "</thead><tbody></tbody></table></div>";

  html +=
    '<div class="d-flex justify-content-end">' +
    '<button type="button" class="btn btn-success btn-sm btn-app" ' +
    'data-action="save-asistencia-plan" ' +
    'data-fecha="' + fecha + '" ' +
    'data-cliente="' + cliente.replace(/"/g, "&quot;") + '">' +
    'Guardar asistencia</button>' +
    '</div>';

  html += "</div>";

  panel.innerHTML = html;

  const tbody = panel.querySelector("tbody");
  if (tbody) {
    const frag = document.createDocumentFragment();
    rows.forEach(function (r, idx) {
      const rowId = "asist-row-" + idx;
      const tr = document.createElement("tr");
      tr.setAttribute("data-idx", idx);
      tr.setAttribute("data-real-row", r.realRowNumber || "");

      const checkedPlan = r.planificado ? "✓" : "";

      tr.innerHTML =
        "<td class='small'>" + (r.empleado || "(sin nombre)") + "</td>" +
        "<td class='text-center small'>" + checkedPlan + "</td>" +
        "<td class='text-center'>" +
        '<input type="checkbox" class="form-check-input" id="' + rowId + '-asist" ' +
        (r.asistencia ? "checked" : "") + ">" +
        "</td>" +
        "<td class='text-center'>" +
        '<input type="number" step="0.01" class="form-control form-control-sm text-end" ' +
        'id="' + rowId + '-horas" value="' + (r.horas || "") + '">' +
        "</td>" +
        "<td>" +
        '<input type="text" class="form-control form-control-sm" ' +
        'id="' + rowId + '-obs" value="' + (r.observaciones || "") + '">' +
        "</td>";

      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  }

  attachPlanVsHandlers(panel);
}

  function saveAsistenciaPanel(fecha, cliente) {
  const panel = document.getElementById("asistencia-plan-panel");
  if (!panel) return;

  const tbody = panel.querySelector("tbody");
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll("tr"));
  const items = rows.map(function (tr) {
    const idx = tr.getAttribute("data-idx");
    const realRow = tr.getAttribute("data-real-row") || null;

    const empleado = tr.querySelector("td:first-child").textContent.trim();
    const asistCheckbox = document.getElementById(
      "asist-row-" + idx + "-asist"
    );
    const horasInput = document.getElementById(
      "asist-row-" + idx + "-horas"
    );
    const obsInput = document.getElementById("asist-row-" + idx + "-obs");

    return {
      empleado: empleado,
      asistencia: asistCheckbox ? asistCheckbox.checked : false,
      horas: horasInput ? horasInput.value : "",
      observaciones: obsInput ? obsInput.value : "",
      realRowNumber: realRow ? Number(realRow) : null
    };
  });

  UiState.setGlobalLoading(true, "Guardando asistencia...");
  ApiService.call('saveAsistenciaFromPlan', fecha, cliente, items)
    .then(function () {
      showAlert(
        "✅ Se guardó la asistencia real para los empleados planificados.",
        "success"
      );
      fetchPlanVsAsistencia();
    })
    .catch(function (err) {
      showAlert("Error al guardar asistencia: " + err.message, "danger");
    })
    .finally(function () {
      UiState.setGlobalLoading(false);
    });
}





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
  // ====== Helpers para HTML simple ======
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getEmpleadoOptionsHtml(selected) {
  const opts = ['<option value="">Seleccionar...</option>'];
  (referenceData.empleados || []).forEach(emp => {
    const sel = emp === selected ? " selected" : "";
    opts.push('<option value="' + escapeHtml(emp) + '"' + sel + ">" +
      escapeHtml(emp) + "</option>");
  });
  return opts.join("");
}

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

// ====== Plan semanal (ASISTENCIA_PLAN) ======

function setupPlanSemanaPanel() {
  const container = document.getElementById("form-fields");
  if (!container) return;

  let panel = document.getElementById("plan-semanal-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "plan-semanal-panel";
    panel.className = "mt-2";
    container.appendChild(panel);
  }

  panel.innerHTML =
    '<div class="mt-2 p-2 border rounded bg-light">' +
      '<div class="small fw-bold mb-1">Plan semanal del cliente</div>' +
      '<div class="small text-muted">Elegí un cliente para ver y editar todas las asignaciones semanales de una sola vez.</div>' +
    '</div>';

  const clienteSelect = document.getElementById("field-CLIENTE");
  if (clienteSelect) {
    clienteSelect.addEventListener("change", fetchWeeklyPlanForClient);
  }
}

function fetchWeeklyPlanForClient() {
  const panel = document.getElementById("plan-semanal-panel");
  const clienteSelect = document.getElementById("field-CLIENTE");
  if (!panel || !clienteSelect) return;

  const cliente = clienteSelect.value;
  if (!cliente) {
    UiState.renderLoading(
      "plan-semanal-panel",
      "Plan semanal del cliente",
      "Elegí un cliente para ver su plan."
    );
    return;
  }

  UiState.renderLoading(
    "plan-semanal-panel",
    "Plan semanal del cliente",
    "Cargando plan de <strong>" + escapeHtml(cliente) + "</strong>..."
  );

  ApiService.callLatest('weekly-plan-' + cliente, 'getWeeklyPlanForClient', cliente)
    .then(function (rows) {
      if (rows && rows.ignored) return;
      const planRows = Array.isArray(rows) ? rows : [];
      const currentClienteEl = document.getElementById("field-CLIENTE");
      const currentCliente = currentClienteEl ? currentClienteEl.value : '';
      if (currentCliente !== cliente) return; // selección cambió

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
        "plan-semanal-panel",
        "Plan semanal del cliente",
        "Error al cargar plan: " + escapeHtml(err.message)
      );
    });
}

// helper para que la hora se vea como "HH:MM" en el <input type="time">
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




function buildWeeklyPlanPanel(rows, cliente, infoHoras) {
  const panel = document.getElementById("plan-semanal-panel");
  if (!panel) return;

  // Si no hay filas, dejamos una vacía para empezar
  if (!rows.length) {
    rows = [{
      empleado: "",
      diaSemana: "",
      horaEntrada: "",
      horasPlan: "",
      activo: true,
      observaciones: ""
    }];
  }

  let html = "";
  html += '<div class="mt-2 p-2 border rounded bg-light">';
  html += '<div class="small fw-bold mb-1">Plan semanal del cliente</div>';
  html +=
    '<div class="small mb-2">Cliente: <strong>' +
    escapeHtml(cliente) +
    "</strong></div>";
   if (infoHoras) {
  const partes = [];

  const pushSiTieneHoras = (label, valor) => {
    const num = Number(valor || 0);
    if (num > 0) {
      partes.push(label + ': <strong>' + num + ' hs</strong>');
    }
  };

  pushSiTieneHoras('Lu', infoHoras.lunes);
  pushSiTieneHoras('Ma', infoHoras.martes);
  pushSiTieneHoras('Mi', infoHoras.miercoles);
  pushSiTieneHoras('Ju', infoHoras.jueves);
  pushSiTieneHoras('Vi', infoHoras.viernes);
  pushSiTieneHoras('Sa', infoHoras.sabado);
  pushSiTieneHoras('Do', infoHoras.domingo);

  // Solo mostramos la línea si hay al menos un día con horas
  if (partes.length) {
    html +=
      '<div class="small text-muted mb-2">' +
        'Horas contratadas · ' +
        partes.join(' · ') +
      '</div>';
  }
}


  html += '<div class="table-responsive">';
  html +=
    '<table class="table table-sm table-bordered align-middle mb-2">' +
    "<thead>" +
      "<tr>" +
        '<th class="small">Empleado</th>' +
        '<th class="small text-center">Día</th>' +
        '<th class="small text-center">Hora entrada</th>' +
        '<th class="small text-center">Horas plan</th>' +
        '<th class="small text-center">Activo</th>' +
        '<th class="small">Observaciones</th>' +
        '<th class="small text-center" style="width:60px;">Acciones</th>' +
      "</tr>" +
    "</thead><tbody></tbody></table></div>";

  html +=
    '<div class="d-flex justify-content-between align-items-center mt-2">' +
      '<button type="button" class="btn btn-outline-secondary btn-sm btn-app" ' +
      'data-action="add-plan-row">+ Agregar fila</button>' +
      '<button type="button" class="btn btn-success btn-sm btn-app" ' +
      'data-action="save-weekly-plan">Guardar plan del cliente</button>' +
    "</div>";

  html += "</div>";

  panel.innerHTML = html;

  const tbody = panel.querySelector("tbody");
  if (tbody) {
    const frag = document.createDocumentFragment();
    rows.forEach(function (r, idx) {
      const rowId = "plan-row-" + idx;
      const empleadoOptions = getEmpleadoOptionsHtml(r.empleado || "");
      const diaOptions = getDiaOptionsHtml(r.diaSemana || "");
      const checkedActivo = r.activo ? "checked" : "";

      const tr = document.createElement("tr");
      tr.setAttribute("data-idx", idx);
      tr.innerHTML =
        "<td>" +
          '<select class="form-select form-select-sm" ' +
          'id="' + rowId + '-empleado">' +
            empleadoOptions +
          "</select>" +
        "</td>" +
        "<td>" +
          '<select class="form-select form-select-sm text-center" ' +
          'id="' + rowId + '-dia">' +
            diaOptions +
          "</select>" +
        "</td>" +
        "<td>" +
          '<input type="time" class="form-control form-control-sm text-center" ' +
          'id="' + rowId + '-hora" value="' +
          escapeHtml(r.horaEntrada || "") +
          '" step="1800">' +
        "</td>" +
        "<td>" +
          '<input type="number" step="0.5" min="0" ' +
          'class="form-control form-control-sm text-end" ' +
          'id="' + rowId + '-horas" value="' +
          escapeHtml(r.horasPlan != null ? String(r.horasPlan) : "") +
          '">' +
        "</td>" +
        "<td class='text-center'>" +
          '<input type="checkbox" class="form-check-input" ' +
          'id="' + rowId + '-activo" ' + checkedActivo + ">" +
        "</td>" +
        "<td>" +
          '<input type="text" class="form-control form-control-sm" ' +
          'id="' + rowId + '-obs" value="' +
          escapeHtml(r.observaciones || "") +
          '">' +
        "</td>" +
        "<td class='text-center'>" +
          '<button type="button" class="btn btn-outline-danger btn-sm" ' +
          'data-action="delete-plan-row" data-idx="' + idx + '">🗑️</button>' +
        "</td>";

      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  }

  attachWeeklyPlanHandlers(panel);
}

function addEmptyPlanRow() {
  const panel = document.getElementById("plan-semanal-panel");
  if (!panel) return;

  const tbody = panel.querySelector("tbody");
  if (!tbody) return;

  const idx = tbody.querySelectorAll("tr").length;
  const rowId = "plan-row-" + idx;

  const tr = document.createElement("tr");
  tr.setAttribute("data-idx", idx);

  tr.innerHTML =
    "<td>" +
      '<select class="form-select form-select-sm" id="' + rowId + '-empleado">' +
        getEmpleadoOptionsHtml("") +
      "</select>" +
    "</td>" +
    "<td>" +
      '<select class="form-select form-select-sm text-center" id="' + rowId + '-dia">' +
        getDiaOptionsHtml("") +
      "</select>" +
    "</td>" +
    "<td>" +
      '<input type="time" class="form-control form-control-sm text-center" ' +
      'id="' + rowId + '-hora" step="1800">' +
    "</td>" +
    "<td>" +
      '<input type="number" step="0.5" min="0" ' +
      'class="form-control form-control-sm text-end" ' +
      'id="' + rowId + '-horas">' +
    "</td>" +
    "<td class='text-center'>" +
      '<input type="checkbox" class="form-check-input" id="' + rowId + '-activo" checked>' +
    "</td>" +
    "<td>" +
      '<input type="text" class="form-control form-control-sm" ' +
      'id="' + rowId + '-obs">' +
    "</td>" +
    "<td class='text-center'>" +
      '<button type="button" class="btn btn-outline-danger btn-sm" ' +
      'data-action="delete-plan-row" data-idx="' + idx + '">🗑️</button>' +
    "</td>";

  tbody.appendChild(tr);
}

function deletePlanRow(idx) {
  const panel = document.getElementById("plan-semanal-panel");
  if (!panel) return;

  const tr = panel.querySelector('tr[data-idx="' + idx + '"]');
  if (tr) {
    tr.remove();
  }
}

function saveWeeklyPlanForClient() {
  const panel = document.getElementById("plan-semanal-panel");
  const clienteSelect = document.getElementById("field-CLIENTE");
  if (!panel || !clienteSelect) return;

  const cliente = clienteSelect.value;
  if (!cliente) {
    showAlert("Elegí un cliente antes de guardar el plan.", "warning");
    return;
  }

  const tbody = panel.querySelector("tbody");
  if (!tbody) {
    showAlert("No hay filas para guardar.", "warning");
    return;
  }

  const rows = Array.from(tbody.querySelectorAll("tr"));
  const items = [];

  rows.forEach(function (tr) {
    const idx = tr.getAttribute("data-idx");
    const rowId = "plan-row-" + idx;

    const empleadoEl = document.getElementById(rowId + "-empleado");
    const diaSemanaEl = document.getElementById(rowId + "-dia");
    const horaEntradaEl = document.getElementById(rowId + "-hora");
    const horasPlanEl = document.getElementById(rowId + "-horas");
    const activoEl = document.getElementById(rowId + "-activo");
    const observacionesEl = document.getElementById(rowId + "-obs");

    const empleado = empleadoEl ? empleadoEl.value : "";
    const diaSemana = diaSemanaEl ? diaSemanaEl.value : "";
    const horaEntrada = horaEntradaEl ? horaEntradaEl.value : "";
    const horasPlan = horasPlanEl ? horasPlanEl.value : "";
    const activo = activoEl ? activoEl.checked : false;
    const observaciones = observacionesEl ? observacionesEl.value : "";

    if (!empleado && !diaSemana && !horaEntrada && !horasPlan && !observaciones) {
      return;
    }

    items.push({
      empleado: empleado,
      diaSemana: diaSemana,
      horaEntrada: horaEntrada,
      horasPlan: horasPlan,
      activo: activo,
      observaciones: observaciones
    });
  });

  ApiService.call('saveWeeklyPlanForClient', cliente, items)
    .then(function () {
      showAlert(
        "✅ Se guardó el plan semanal para el cliente <strong>" +
          escapeHtml(cliente) +
        "</strong>.",
        "success"
      );
      fetchWeeklyPlanForClient();
    })
    .catch(function (err) {
      showAlert("Error al guardar plan: " + escapeHtml(err.message), "danger");
    });
}


  function setupAsistenciaDiaPanel() {
  const container = document.getElementById("form-fields");
  if (!container) return;

  let panel = document.getElementById("asistencia-dia-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "asistencia-dia-panel";
    panel.className = "mt-2";
    container.appendChild(panel);
  }

  panel.innerHTML =
    '<div class="mt-2 p-2 border rounded bg-light">' +
    '<div class="small fw-bold mb-1">Asistencia del día</div>' +
    '<div class="small text-muted">Seleccioná una fecha para ver el plan del día (clientes y empleados) y marcar la asistencia.</div>' +
    "</div>";

  const fechaInput = document.getElementById("field-FECHA");
  if (fechaInput) {
    fechaInput.addEventListener("change", fetchDailyAttendance);
  }
}

function fetchDailyAttendance() {
  const fechaInput = document.getElementById("field-FECHA");
  const panel = document.getElementById("asistencia-dia-panel");
  if (!panel) return;

  const fecha = fechaInput ? fechaInput.value : "";

  if (!fecha) {
    UiState.renderLoading(
      "asistencia-dia-panel",
      "Asistencia del día",
      "Elegí primero una fecha."
    );
    return;
  }

  UiState.renderLoading(
    "asistencia-dia-panel",
    "Asistencia del día",
    "Cargando plan y asistencia para la fecha " + fecha + "..."
  );

  ApiService.callLatest('attendance-day-' + fecha, 'getDailyAttendancePlan', fecha)
    .then(function (rowsRaw) {
      if (rowsRaw && rowsRaw.ignored) return;
      const rows = Array.isArray(rowsRaw) ? rowsRaw : [];
      const currentFechaEl = document.getElementById("field-FECHA");
      const currentFecha = currentFechaEl ? currentFechaEl.value : '';
      if (currentFecha !== fecha) return;
      buildDailyAttendancePanel(rows, fecha);
    })
    .catch(function (err) {
      UiState.renderLoading(
        "asistencia-dia-panel",
        "Asistencia del día",
        "Error al cargar: " + err.message
      );
    });
}


function buildDailyAttendancePanel(rows, fecha) {
  const panel = document.getElementById("asistencia-dia-panel");
  if (!panel) return;

  if (!rows.length) {
    panel.innerHTML =
      '<div class="mt-2 p-2 border rounded bg-light">' +
      '<div class="small fw-bold mb-1">Asistencia del día</div>' +
      '<div class="small mb-1">Para esta fecha no hay plan de asistencia configurado.</div>' +
      '<div class="small text-muted">Configurá el plan desde el formato <strong>ASISTENCIA_PLAN</strong>.</div>' +
      "</div>";
    return;
  }

  // 🔹 Determinamos si la fecha consultada es pasada (AAAA-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10); // "2025-11-16"
  const isPast = fecha < todayStr; // funciona bien comparando strings en este formato

  let html = "";

  html += '<div class="mt-2 p-2 border rounded bg-light">';
  html += '<div class="small fw-bold mb-1">Asistencia del día</div>';
  html +=
    '<div class="small mb-2">Fecha: <strong>' +
    fecha +
    "</strong></div>";

  html +=
    '<div class="table-responsive">' +
    '<table class="table table-sm table-bordered align-middle mb-2">' +
    "<thead>" +
    "<tr>" +
    '<th class="small">Cliente</th>' +
    '<th class="small">Empleado</th>' +
    '<th class="small text-center">Horas plan</th>' +
    '<th class="small text-center">Asistió</th>' +
    '<th class="small text-center" style="width:80px;">Horas reales</th>' +
    '<th class="small">Observaciones</th>' +
    "</tr>" +
    "</thead><tbody></tbody></table></div>";

  html +=
    '<div class="d-flex justify-content-end">' +
    '<button type="button" class="btn btn-success btn-sm btn-app" ' +
    'data-action="save-daily-attendance" data-fecha="' + fecha + '">' +
    'Guardar asistencia del día</button>' +
    '</div>';

  html += "</div>";

  panel.innerHTML = html;

  const tbody = panel.querySelector("tbody");
  if (tbody) {
    const frag = document.createDocumentFragment();
    rows.forEach(function (r, idx) {
      const rowId = "asis-dia-" + idx;
      const checkedReal = r.asistencia ? "checked" : "";

      let rowClass = "";
      if (isPast && r.asistenciaRowNumber) {
        if (r.asistencia) {
          rowClass = "tr-asistio-pasado";
        } else {
          rowClass = "tr-noasistio-pasado";
        }
      }

      const tr = document.createElement("tr");
      tr.className = rowClass;
      tr.setAttribute("data-idx", idx);
      tr.setAttribute("data-row", r.asistenciaRowNumber || "");

      tr.innerHTML =
        "<td class='small'>" + (r.cliente || "") + "</td>" +
        "<td class='small'>" + (r.empleado || "") + "</td>" +
        "<td class='text-center small'>" + (r.horasPlan || "") + "</td>" +
        "<td class='text-center'>" +
        '<input type="checkbox" class="form-check-input" id="' + rowId + '-asist" ' +
        checkedReal + ">" +
        "</td>" +
        "<td class='text-center'>" +
        '<input type="number" step="0.01" class="form-control form-control-sm text-end" ' +
        'id="' + rowId + '-horas" value="' + (r.horasReales || "") + '">' +
        "</td>" +
        "<td>" +
        '<input type="text" class="form-control form-control-sm" ' +
        'id="' + rowId + '-obs" value="' + (r.observaciones || "") + '">' +
        "</td>";

      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  }

  attachDailyAttendanceHandlers(panel, fecha);
}

// ==== Event attachment helpers (delegated for dynamic panels) ====

function attachPlanVsHandlers(panel) {
  const btn = panel.querySelector('[data-action="save-asistencia-plan"]');
  if (!btn) return;
  btn.addEventListener('click', function () {
    const fecha = btn.getAttribute('data-fecha');
    const cliente = btn.getAttribute('data-cliente');
    saveAsistenciaPanel(fecha, cliente);
  });
}

function attachWeeklyPlanHandlers(panel) {
  if (!panel) return;

  panel.addEventListener('click', function (e) {
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;

    const action = actionBtn.getAttribute('data-action');
    if (action === 'delete-plan-row') {
      const idx = actionBtn.getAttribute('data-idx');
      deletePlanRow(idx);
    } else if (action === 'add-plan-row') {
      addEmptyPlanRow();
    } else if (action === 'save-weekly-plan') {
      saveWeeklyPlanForClient();
    }
  });
}

function attachDailyAttendanceHandlers(panel) {
  if (!panel) return;
  const btn = panel.querySelector('[data-action="save-daily-attendance"]');
  if (!btn) return;
  btn.addEventListener('click', function () {
    const fecha = btn.getAttribute('data-fecha');
    saveDailyAttendancePanel(fecha);
  });
}



function saveDailyAttendancePanel(fecha) {
  const panel = document.getElementById("asistencia-dia-panel");
  if (!panel) return;

  const tbody = panel.querySelector("tbody");
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll("tr"));
  const items = rows.map(function (tr) {
    const idx = tr.getAttribute("data-idx");
    const rowNumber = tr.getAttribute("data-row") || null;

    const tds = tr.querySelectorAll("td");
    const cliente = tds[0].textContent.trim();
    const empleado = tds[1].textContent.trim();

    // ahora la col 2 es "Horas plan"
    const horasPlan = tds[2].textContent.trim();

    const asistCheckbox = document.getElementById(
      "asis-dia-" + idx + "-asist"
    );
    const horasInput = document.getElementById(
      "asis-dia-" + idx + "-horas"
    );
    const obsInput = document.getElementById(
      "asis-dia-" + idx + "-obs"
    );

    return {
      cliente: cliente,
      empleado: empleado,
      // ya no usamos horaPlan, lo dejamos vacío
      horaPlan: "",
      horasPlan: horasPlan,
      asistencia: asistCheckbox ? asistCheckbox.checked : false,
      horasReales: horasInput ? horasInput.value : "",
      observaciones: obsInput ? obsInput.value : "",
      asistenciaRowNumber: rowNumber ? Number(rowNumber) : null
    };
  });

  UiState.setGlobalLoading(true, "Guardando asistencia del día...");
  ApiService.call('saveDailyAttendance', fecha, items)
    .then(function () {
      showAlert(
        "✅ Se guardó la asistencia del día.",
        "success"
      );
      fetchDailyAttendance();
    })
    .catch(function (err) {
      showAlert(
        "Error al guardar asistencia: " + err.message,
        "danger"
      );
    })
    .finally(function () {
      UiState.setGlobalLoading(false);
    });
}



      function validateForm(formDef) {
        const errors = [];

        formDef.fields.forEach(function (field) {
          const input = document.getElementById("field-" + field.id);
          if (!input) return;

          input.classList.remove("is-invalid");

          // Correo
          if (field.type === "email" && input.value.trim() !== "") {
            const email = input.value.trim();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
              input.classList.add("is-invalid");
              errors.push(
                'El campo "' + field.label + '" no parece un correo válido.'
              );
            }
          }

          // Teléfono
          if (field.type === "phone" && input.value.trim() !== "") {
            const raw = input.value.replace(/\D/g, "");
            if (raw.length < 6) {
              input.classList.add("is-invalid");
              errors.push(
                'El teléfono en "' + field.label + '" es demasiado corto.'
              );
            }
            if (!/^[0-9+\-\s()]+$/.test(input.value)) {
              input.classList.add("is-invalid");
              errors.push(
                'El campo "' +
                  field.label +
                  '" contiene caracteres inválidos.'
              );
            }
          }

          // DNI
          if (field.type === "dni" && input.value.trim() !== "") {
            if (!/^\d{7,10}$/.test(input.value)) {
              input.classList.add("is-invalid");
              errors.push(
                'El DNI en "' +
                  field.label +
                  '" debe ser numérico entre 7 y 10 dígitos.'
              );
            }
          }

          // numérico general
          if (field.type === "number" && input.value.trim() !== "") {
            if (isNaN(Number(input.value))) {
              input.classList.add("is-invalid");
              errors.push(
                'El campo "' + field.label + '" debe ser numérico.'
              );
            }
          }
        });

        return errors;
      }

      function buildRecordFromForm(formDef) {
        const record = {};
        formDef.fields.forEach(function (field) {
          const input = document.getElementById("field-" + field.id);
          if (!input) return;

          if (field.type === "boolean") {
            record[field.id] = input.checked ? true : false;
          } else {
            record[field.id] = input.value;
          }
        });
        return record;
      }

      function enterCreateMode(clearAlert = true) {
        currentMode = "create";
        selectedRowNumber = null;
        document.getElementById("btn-eliminar").disabled = true;
        document.getElementById("btn-grabar").textContent = "Grabar";
        if (clearAlert) clearAlerts();
      }

      function enterEditMode(rowNumber, record) {
  currentMode = "edit";
  selectedRowNumber = rowNumber;
  document.getElementById("btn-eliminar").disabled = false;
  document.getElementById("btn-grabar").textContent = "Actualizar";

  const formDef = FORM_DEFINITIONS[currentFormat];
  if (!formDef) return;

  function isValidDate(d) {
    return (
      Object.prototype.toString.call(d) === "[object Date]" &&
      !isNaN(d.getTime())
    );
  }

  function formatDateForInput(d) {
    // d es un objeto Date válido
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  formDef.fields.forEach(function (field) {
    const input = document.getElementById("field-" + field.id);
    if (!input) return;

    input.classList.remove("is-invalid");
    const value = record[field.id];

    if (field.type === "boolean") {
      const v = value;
      input.checked =
        v === true ||
        v === "TRUE" ||
        v === "true" ||
        v === 1 ||
        v === "1";
    } else if (field.type === "date") {
      // ⬇️ Manejo especial para fechas
      if (value == null || value === "") {
        input.value = "";
      } else if (isValidDate(value)) {
        // Viene como objeto Date desde Apps Script
        input.value = formatDateForInput(value);
      } else {
        // Ya viene como string (por ejemplo "2025-12-20")
        // La dejamos tal cual y, si es válida, el input la toma.
        input.value = value;
      }
    } else {
      input.value = value !== undefined ? value : "";
    }
  });

  let mainLabel = "";
  switch (currentFormat) {
    case "CLIENTES":
      mainLabel = record["NOMBRE"] || "";
      break;
    case "EMPLEADOS":
      mainLabel = record["EMPLEADO"] || "";
      break;
    case "FACTURACION":
      mainLabel =
        record["COMPROBANTE"] ||
        record["NÚMERO"] ||
        record["RAZÓN SOCIAL"] ||
        "";
      break;
    case "PAGOS":
      mainLabel = record["RAZÓN SOCIAL"] || "";
      break;
    case "ASISTENCIA_PLAN":
      mainLabel = record["EMPLEADO"] || record["CLIENTE"] || "";
      break;


    case "ASISTENCIA":
      mainLabel = record["EMPLEADO"] || record["CLIENTE"] || "";
      break;
  }

  const niceName = mainLabel ? " <strong>(" + mainLabel + ")</strong>" : "";
  const modeLabelEl = document.getElementById("current-mode-label");
  if (modeLabelEl) {
    modeLabelEl.innerHTML = 'Editando registro' + niceName;
  }

}


      // ==== SUGERENCIAS (autocompletar) ====

      function renderSuggestions(results, query) {
        const cont = document.getElementById("search-suggestions");
        cont.innerHTML = "";
        suggestionResults = results;

        if (!query || query.trim().length < 2 || !results.length) {
          cont.classList.add("d-none");
          return;
        }

        const maxToShow = 6;
        const slice = results.slice(0, maxToShow);

        slice.forEach(function (res, index) {
          const rec = res.record;
          let title = "";
          let subtitle = "";

          switch (currentFormat) {
            case "CLIENTES":
              title = rec["NOMBRE"] || "(Sin nombre)";
              subtitle = rec["CUIT"] || rec["RAZON SOCIAL"] || "";
              break;
            case "EMPLEADOS":
              title = rec["EMPLEADO"] || "(Sin nombre)";
              subtitle = rec["DNI"] || rec["CUIL"] || "";
              break;
            case "FACTURACION":
              title =
                rec["COMPROBANTE"] ||
                rec["NÚMERO"] ||
                rec["RAZÓN SOCIAL"] ||
                "(Comprobante)";
              subtitle = rec["FECHA"] || "";
              break;
            case "PAGOS":
              title = rec["RAZÓN SOCIAL"] || "(Pago)";
              subtitle = rec["FECHA"] || "";
              break;
            case "ASISTENCIA":
              title = rec["EMPLEADO"] || rec["CLIENTE"] || "(Asistencia)";
              subtitle = rec["FECHA"] || "";
              break;
            default:
              title = "(Registro)";
          }

          const item = document.createElement("button");
          item.type = "button";
          item.className =
            "list-group-item list-group-item-action py-1 px-2";
          item.dataset.index = index;

          item.innerHTML =
            '<div class="d-flex justify-content-between"><span>' +
            title +
            '</span><span class="text-muted small">Fila ' +
            res.rowNumber +
            "</span></div>" +
            (subtitle
              ? '<div class="text-muted small">' + subtitle + "</div>"
              : "");

          item.addEventListener("click", function () {
            const i = Number(this.dataset.index);
            const selected = suggestionResults[i];
            if (!selected) return;

            document.getElementById("search-query").value = title;
            cont.classList.add("d-none");
            enterEditMode(selected.rowNumber, selected.record);
          });

          cont.appendChild(item);
        });

        cont.classList.remove("d-none");
      }

      function doSuggest() {
        if (!currentFormat) {
          showAlert("Seleccioná un formato antes de buscar.", "warning");
          return;
        }

        const query = document
          .getElementById("search-query")
          .value.trim();

        if (query.length < 2) {
          const cont = document.getElementById("search-suggestions");
          cont.classList.add("d-none");
          cont.innerHTML = "";
          enterCreateMode(false);
          return;
        }

        const cacheKey = currentFormat + '|' + query.toLowerCase();
        const cached = ApiService.dataCache.search
          ? ApiService.dataCache.search.get(cacheKey)
          : null;

        if (cached && (Date.now() - cached.ts) < 5 * 60 * 1000) {
          renderSuggestions(cached.results, query);
          return;
        }

        ApiService.callLatest('search-' + currentFormat, 'searchRecords', currentFormat, query)
          .then(function (results) {
            if (results && results.ignored) return;
            const res = results || [];
            if (ApiService.dataCache && ApiService.dataCache.search) {
              ApiService.dataCache.search.set(cacheKey, {
                ts: Date.now(),
                results: res
              });
            }
            renderSuggestions(res, query);
          })
          .catch(function (err) {
            showAlert("Error al buscar: " + err.message, "danger");
          });
      }

      // ==== Grabar / actualizar / eliminar ====

    function grabar() {
      if (!currentFormat) {
        showAlert("Seleccioná un formato.", "warning");
        return;
      }

       // ⬇️ Caso especial: ASISTENCIA se maneja por la grilla diaria
      if (currentFormat === "ASISTENCIA") {
        const fechaInput = document.getElementById("field-FECHA");
        const fecha = fechaInput ? fechaInput.value : "";

        if (!fecha) {
          showAlert("Elegí una fecha para registrar la asistencia del día.", "warning");
          return;
        }

        // simple aviso: la asistencia se guarda desde el botón de la grilla
        showAlert(
          "La asistencia se guarda con el botón <strong>Guardar asistencia del día</strong> en la grilla.",
          "info"
        );
        return;
      }

      const formDef = FORM_DEFINITIONS[currentFormat];
      if (!formDef) {
        showAlert("No hay formulario definido para este formato.", "danger");
        return;
      }


        const errors = validateForm(formDef);
        if (errors.length > 0) {
          showAlert(errors.join("<br>"), "danger");
          return;
        }
        UiState.setGlobalLoading(true, "Guardando...");

        const record = buildRecordFromForm(formDef);

        

      if (currentMode === "edit" && selectedRowNumber != null) {
        ApiService.call('updateRecord', currentFormat, selectedRowNumber, record)
          .then(function () {
            let mainLabel = "";
            switch (currentFormat) {
              case "CLIENTES":
                mainLabel = record["NOMBRE"] || "";
                break;
              case "EMPLEADOS":
                mainLabel = record["EMPLEADO"] || "";
                break;
              case "FACTURACION":
                mainLabel =
                  record["COMPROBANTE"] ||
                  record["NÚMERO"] ||
                  record["RAZÓN SOCIAL"] ||
                  "";
                break;
              case "PAGOS":
                mainLabel = record["RAZÓN SOCIAL"] || "";
                break;
              case "ASISTENCIA":
                mainLabel = record["EMPLEADO"] || record["CLIENTE"] || "";
                break;
            }
            const niceName = mainLabel ? " <strong>" + mainLabel + "</strong>" : "";
            showAlert(
              "✅ Se actualizó correctamente el registro" + niceName + ".",
              "success"
            );

            if (currentFormat === "CLIENTES" || currentFormat === "EMPLEADOS") {
              refreshReferenceAndRerender();
            }
          })
          .catch(function (err) {
            showAlert("Error al actualizar: " + err.message, "danger");
          })
          .finally(function () {
            UiState.setGlobalLoading(false);
          });

      } else {
        // CREATE
        ApiService.call('saveFormRecord', currentFormat, record)
          .then(function () {
            let mainLabel = "";
            let entityType = "";
            switch (currentFormat) {
              case "CLIENTES":
                entityType = "cliente";
                mainLabel = record["NOMBRE"] || "";
                break;
              case "EMPLEADOS":
                entityType = "empleado";
                mainLabel = record["EMPLEADO"] || "";
                break;
              case "FACTURACION":
                entityType = "comprobante";
                mainLabel =
                  record["COMPROBANTE"] ||
                  record["NÚMERO"] ||
                  record["RAZÓN SOCIAL"] ||
                  "";
                break;
              case "PAGOS":
                entityType = "pago";
                mainLabel = record["RAZÓN SOCIAL"] || "";
                break;
              case "ASISTENCIA":
                entityType = "registro de asistencia";
                mainLabel = record["EMPLEADO"] || record["CLIENTE"] || "";
                break;
              case "ASISTENCIA_PLAN":
                entityType = "plan de asistencia";
                mainLabel = record["EMPLEADO"] || record["CLIENTE"] || "";
                break;
              default:
                entityType = "registro";
            }

            const niceName = mainLabel
              ? " <strong>" + mainLabel + "</strong>"
              : "";
            showAlert(
              "✅ Se guardó correctamente el " +
                entityType +
                niceName +
                ".",
              "success"
            );
            clearForm();

            if (currentFormat === "CLIENTES" || currentFormat === "EMPLEADOS") {
              loadReferenceData();
            }
          })
          .catch(function (err) {
            showAlert("Error al guardar: " + err.message, "danger");
          })
          .finally(function () {
            UiState.setGlobalLoading(false);
          });
      }
    }


      function deleteSelected() {
        if (!currentFormat || selectedRowNumber == null) {
          showAlert(
            "No hay ningún registro seleccionado para eliminar.",
            "warning"
          );
          return;
        }

        const ok = confirm(
          "¿Seguro que querés eliminar este registro?\nEsta acción no se puede deshacer."
        );
        if (!ok) return;

        ApiService.call('deleteRecord', currentFormat, selectedRowNumber)
          .then(function () {
            showAlert("🗑️ Registro eliminado correctamente.", "success");
            clearForm();
            enterCreateMode(false);
          })
          .catch(function (err) {
            showAlert("Error al eliminar: " + err.message, "danger");
          });
      }

      // ==== Event listeners ====

      document
        .getElementById("formato")
        .addEventListener("change", function (e) {
          renderForm(e.target.value);
        });

      document
        .getElementById("btn-grabar")
        .addEventListener("click", grabar);

      document
        .getElementById("btn-limpiar")
        .addEventListener("click", function () {
          clearAlerts();
          clearForm();
          enterCreateMode(false);
        });

      document
        .getElementById("btn-eliminar")
        .addEventListener("click", deleteSelected);

      document
        .getElementById("btn-nuevo")
        .addEventListener("click", function () {
          document.getElementById("search-query").value = "";
          const cont = document.getElementById("search-suggestions");
          cont.classList.add("d-none");
          cont.innerHTML = "";
          clearForm();
          enterCreateMode(false);
        });

      document
        .getElementById("search-query")
        .addEventListener("input", function () {
          if (searchDebounce) {
            clearTimeout(searchDebounce);
          }
          searchDebounce = setTimeout(function () {
            doSuggest();
          }, 300);
        });

      document.addEventListener("click", function (e) {
        const cont = document.getElementById("search-suggestions");
        const input = document.getElementById("search-query");
        if (!cont.contains(e.target) && e.target !== input) {
          cont.classList.add("d-none");
        }
      });

      // Init: cargamos formatos cuando la página está lista
      window.addEventListener("load", function () {
        loadReferenceData();
        loadFormats();
      });

      function updateFooterVisibility() {
        const footer = document.querySelector(".card-footer");
        const searchBar = document.getElementById("search-bar-wrapper");

        // Formatos donde NO usamos barra de búsqueda ni botones grandes
      const hideChrome =
        currentFormat === "ASISTENCIA" ||
        currentFormat === "ASISTENCIA_PLAN";

      if (hideChrome) {
        if (footer) footer.classList.add("d-none");
        if (searchBar) searchBar.classList.add("d-none");
      } else {
        if (footer) footer.classList.remove("d-none");
        if (searchBar) searchBar.classList.remove("d-none");
      }
    }
})();

