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
    if (typeof field.defaultChecked === "boolean") {
      input.checked = field.defaultChecked;
    } else {
      input.checked = true;
    }

    const switchLabel = document.createElement("label");
    switchLabel.className = "form-check-label small";
    switchLabel.htmlFor = input.id;
    const trueLabel = field.trueLabel || "Activo";
    const falseLabel = field.falseLabel || "Inactivo";
    switchLabel.textContent = input.checked ? trueLabel : falseLabel;

    input.addEventListener("change", function () {
      switchLabel.textContent = input.checked ? trueLabel : falseLabel;
    });

    switchDiv.appendChild(input);
    switchDiv.appendChild(switchLabel);

    wrapper.appendChild(label);
    wrapper.appendChild(switchDiv);
    return wrapper;
  }

  function renderSection(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "form-section-heading";

    const icon = field.icon ? `<i class="bi ${field.icon}"></i>` : "";
    const subtitle = field.subtitle ? `<div class="form-section-subtitle">${field.subtitle}</div>` : "";

    wrapper.innerHTML = `
      <div class="form-section-title">
        ${icon}
        <span>${field.label || ""}</span>
      </div>
      ${subtitle}
    `;

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

  function renderTags(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1 client-tags-field";

    const label = document.createElement("label");
    label.className = "form-label mb-1";
    label.htmlFor = "field-" + field.id;
    label.textContent = field.label;

    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.id = "field-" + field.id;

    const chips = document.createElement("div");
    chips.className = "tag-chips";
    chips.dataset.tagsChips = "1";

    const inputGroup = document.createElement("div");
    inputGroup.className = "input-group input-group-sm mt-2";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control form-control-sm";
    input.placeholder = field.placeholder || "Agregar etiqueta...";
    input.setAttribute("data-tags-input", "1");

    const datalist = document.createElement("datalist");
    const listId = "tags-datalist-" + field.id;
    datalist.id = listId;
    datalist.dataset.tagsDatalist = "1";
    input.setAttribute("list", listId);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-outline-primary";
    addBtn.textContent = "Agregar";
    addBtn.setAttribute("data-tags-add", "1");

    inputGroup.appendChild(input);
    inputGroup.appendChild(addBtn);

    wrapper.appendChild(label);
    wrapper.appendChild(chips);
    wrapper.appendChild(inputGroup);
    wrapper.appendChild(hidden);
    wrapper.appendChild(datalist);

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
    if (field.type === "phone") {
      input.inputMode = "tel";
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  function renderDocType(field) {
    const fallback = field.options || ["DNI", "CUIL", "CUIT"];
    const options = global.DropdownConfig && typeof global.DropdownConfig.getOptions === "function"
      ? global.DropdownConfig.getOptions(field.id, fallback)
      : fallback;
    return renderDeclarativeSelect(
      Object.assign({}, field, { options: options }),
      options.map(opt => ({ value: opt, label: opt }))
    );
  }

  function renderDocNumber(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1";

    const label = document.createElement("label");
    label.className = "form-label mb-1";
    label.htmlFor = "field-" + field.id;
    label.textContent = field.label;

    const input = document.createElement("input");
    input.id = "field-" + field.id;
    input.className = "form-control form-control-sm";
    input.type = "text";
    input.inputMode = "numeric";
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.docTypeField) input.dataset.docTypeField = field.docTypeField;
    if (field.docTypeValue) input.dataset.docTypeValue = field.docTypeValue;
    input.dataset.docNumber = "1";

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  const FormRenderer = {
    renderField: function (field, referenceData) {
      switch (field.type) {
        case "boolean":
          return renderBoolean(field);
        case "section":
          return renderSection(field);
        case "dayOfWeek":
          return renderDayOfWeek(field);
        case "cliente": {
          const options =
            (referenceData.clientes || []).map((cli) => ({
              value: cli.razonSocial || cli.nombre,
              label: cli.razonSocial || cli.nombre,
              dataset: {
                id: cli.id != null ? String(cli.id) : "",
                cuit: cli.cuit || ""
              }
            })) || [];
          return renderDeclarativeSelect(field, options);
        }
        case "empleado": {
          const options =
            (referenceData.empleados || []).map((emp) => {
              const label =
                typeof emp === "string"
                  ? emp
                  : (emp.nombre || emp.empleado || emp.label || "");
              return {
                value: label,
                label: label,
                dataset: {
                  id: emp && typeof emp === "object" && emp.id != null ? String(emp.id) : ""
                }
              };
            }) || [];
          return renderDeclarativeSelect(field, options);
        }
        case "select": {
          // Select con opciones definidas en el campo
          const configured = global.DropdownConfig && typeof global.DropdownConfig.getOptions === "function"
            ? global.DropdownConfig.getOptions(field.id, field.options || [])
            : (field.options || []);
          const options = (configured || []).map(opt => ({
            value: opt,
            label: opt
          }));
          return renderDeclarativeSelect(field, options);
        }
        case "docType":
          return renderDocType(field);
        case "docNumber":
          return renderDocNumber(field);
        case "tags":
          return renderTags(field);
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
