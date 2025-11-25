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
            return Object.keys(FORM_DEFINITIONS).map(function (id) {
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

            // Autocompletar CUIT para FACTURACION y PAGOS
            if (tipoFormato === "FACTURACION" || tipoFormato === "PAGOS") {
                setupCuitAutocomplete();
            }

            // Setup panels específicos por tipo - con timeout para asegurar que el DOM esté listo
            if (tipoFormato === "ASISTENCIA_PLAN" && global.AttendancePanels) {
                setTimeout(() => {
                    global.AttendancePanels.setupWeeklyPlanPanel();
                }, 100);
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
