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
