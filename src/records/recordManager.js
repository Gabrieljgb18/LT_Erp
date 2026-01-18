/**
 * Record Manager
 * Maneja CRUD de registros (Create, Read, Update, Delete)
 */

(function (global) {
    const RecordManager = (() => {
        let currentMode = "create"; // "create" | "edit"
        let selectedRowNumber = null;
        const RecordsData = global.RecordsData || null;

        function refreshReferencesIfNeeded(tipoFormato) {
            if (!RecordsData || typeof RecordsData.refreshReferenceDataIfNeeded !== "function") return;
            RecordsData.refreshReferenceDataIfNeeded(tipoFormato)
                .then(function (refData) {
                    if (refData && global.FormManager && typeof global.FormManager.updateReferenceData === "function") {
                        global.FormManager.updateReferenceData(refData);
                    }
                });
        }

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
                    input.dispatchEvent(new Event("change"));
                } else {
                    // For text inputs, use the value as-is (even if empty string)
                    input.value = value !== null && value !== undefined ? value : "";
                }
            });

            if (global.FormManager && typeof global.FormManager.applyClientesEncargadoVisibility === "function") {
                global.FormManager.applyClientesEncargadoVisibility();
            }
            if (global.ClientTagsField && typeof global.ClientTagsField.syncFromValue === "function") {
                global.ClientTagsField.syncFromValue();
            }
            if (global.FormManager && typeof global.FormManager.applyInputMasks === "function") {
                global.FormManager.applyInputMasks();
            }
        }

        function saveRecord() {
            const tipoFormato = global.FormManager ? global.FormManager.getCurrentFormat() : null;
            if (!tipoFormato) {
                if (Alerts) Alerts.showAlert("No hay formato seleccionado.", "warning");
                return Promise.resolve(false);
            }

            // Flujo custom para asistencia diaria (plan vs real)
            if (tipoFormato === "ASISTENCIA" && global.AttendanceDailyUI) {
                global.AttendanceDailyUI.save();
                return Promise.resolve(false);
            }

            const formDef = FORM_DEFINITIONS[tipoFormato];
            if (!formDef) return Promise.resolve(false);

            const record = {};
            let hasErrors = false;
            const errorFields = [];
            const inputUtils = global.InputUtils || {};

            function shouldSkipValidation(field, input) {
                if (!field || !input) return true;
                if (field.hidden || input.type === "hidden") return true;
                if (input.closest && input.closest(".d-none")) return true;
                return false;
            }

            function registerError(field, input) {
                if (!field || !input) return;
                input.classList.add("is-invalid");
                errorFields.push(field.label || field.id);
                hasErrors = true;
            }

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

            formDef.fields.forEach(function (field) {
                const input = document.getElementById("field-" + field.id);
                if (!input) return;
                if (shouldSkipValidation(field, input)) return;
                const value = record[field.id];
                const hasValue = value !== null && value !== undefined && String(value).trim() !== "";

                if (field.type === "phone" && hasValue) {
                    if (typeof inputUtils.isValidPhone === "function") {
                        if (!inputUtils.isValidPhone(value)) {
                            registerError(field, input);
                        }
                    }
                }

                if (field.type === "email" && hasValue) {
                    if (typeof inputUtils.isValidEmail === "function") {
                        if (!inputUtils.isValidEmail(value)) {
                            registerError(field, input);
                        }
                    }
                }

                if (field.type === "docNumber" && hasValue) {
                    const docTypeField = field.docTypeField || "TIPO DOCUMENTO";
                    const docType = field.docTypeValue || record[docTypeField] || "";
                    if (typeof inputUtils.isValidDocNumber === "function") {
                        if (!inputUtils.isValidDocNumber(value, docType)) {
                            registerError(field, input);
                        }
                    }
                }

                if (field.type === "number" && hasValue) {
                    const num = Number(value);
                    if (isNaN(num)) {
                        registerError(field, input);
                    }
                }

                if (typeof input.checkValidity === "function" && !input.checkValidity()) {
                    registerError(field, input);
                }
            });

            const idRules = [
                { idField: "ID_CLIENTE", labelField: "CLIENTE", label: "Cliente" },
                { idField: "ID_CLIENTE", labelField: "RAZÓN SOCIAL", label: "Razón social" },
                { idField: "ID_EMPLEADO", labelField: "EMPLEADO", label: "Empleado" }
            ];

            idRules.forEach(rule => {
                if (!record.hasOwnProperty(rule.idField)) return;
                const labelValue = record[rule.labelField];
                const idValue = record[rule.idField];
                const hasLabel = labelValue != null && String(labelValue).trim() !== "";
                const hasId = idValue != null && String(idValue).trim() !== "";
                if (hasLabel && !hasId) {
                    const input = document.getElementById("field-" + rule.labelField);
                    if (input) {
                        input.classList.add("is-invalid");
                    }
                    errorFields.push(rule.label || rule.labelField);
                    hasErrors = true;
                }
            });

            if (hasErrors) {
                const unique = Array.from(new Set(errorFields)).filter(Boolean);
                const msg = unique.length
                    ? "Revisá los campos: " + unique.join(", ")
                    : "Por favor completá los campos requeridos.";
                if (Alerts) Alerts.showAlert(msg, "warning");
                return Promise.resolve(false);
            }

            UiState.setGlobalLoading(true, "Guardando...");

            if (currentMode === "edit" && selectedRowNumber) {
                // Update existing (selectedRowNumber now contains ID)
                if (!RecordsData || typeof RecordsData.updateRecord !== "function") {
                    if (Alerts) Alerts.showAlert("No se pudo actualizar el registro.", "danger");
                    UiState.setGlobalLoading(false);
                    return Promise.resolve(false);
                }
                return RecordsData.updateRecord(tipoFormato, selectedRowNumber, record)
                    .then(function () {
                        if (Alerts) Alerts.showAlert("✅ Registro actualizado correctamente.", "success");
                        enterCreateMode(true);
                        refreshReferencesIfNeeded(tipoFormato);
                        return true;
                    })
                    .catch(function (err) {
                        if (Alerts) Alerts.showAlert("Error al actualizar: " + err.message, "danger");
                        return false;
                    })
                    .finally(function () {
                        UiState.setGlobalLoading(false);
                    });
            } else {
                // Create new
                if (!RecordsData || typeof RecordsData.saveRecord !== "function") {
                    if (Alerts) Alerts.showAlert("No se pudo guardar el registro.", "danger");
                    UiState.setGlobalLoading(false);
                    return Promise.resolve(false);
                }
                return RecordsData.saveRecord(tipoFormato, record)
                    .then(function () {
                        if (Alerts) Alerts.showAlert("✅ Registro guardado correctamente.", "success");
                        enterCreateMode(true);
                        refreshReferencesIfNeeded(tipoFormato);
                        return true;
                    })
                    .catch(function (err) {
                        if (Alerts) Alerts.showAlert("Error al guardar: " + err.message, "danger");
                        return false;
                    })
                    .finally(function () {
                        UiState.setGlobalLoading(false);
                    });
            }
        }

        function deleteRecord() {
            if (currentMode !== "edit" || !selectedRowNumber) {
                if (Alerts) Alerts.showAlert("No hay registro seleccionado para eliminar.", "warning");
                return Promise.resolve(false);
            }

            const tipoFormato = global.FormManager ? global.FormManager.getCurrentFormat() : null;
            if (!tipoFormato) return Promise.resolve(false);

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

            return confirmPromise.then(function (confirmed) {
                if (!confirmed) return;

            UiState.setGlobalLoading(true, "Eliminando...");

            if (!RecordsData || typeof RecordsData.deleteRecord !== "function") {
                if (Alerts) Alerts.showAlert("No se pudo eliminar el registro.", "danger");
                UiState.setGlobalLoading(false);
                return false;
            }

            return RecordsData.deleteRecord(tipoFormato, selectedRowNumber)
                .then(function () {
                    if (Alerts) Alerts.showAlert("✅ Registro eliminado correctamente.", "success");
                    enterCreateMode(true);
                    refreshReferencesIfNeeded(tipoFormato);
                    return true;
                })
                .catch(function (err) {
                    if (Alerts) Alerts.showAlert("Error al eliminar: " + err.message, "danger");
                    return false;
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
            resetEditState: function () {
                currentMode = "create";
                selectedRowNumber = null;
            },
            loadRecordForEdit,
            saveRecord,
            deleteRecord,
            cancelEdit
        };
    })();

    global.RecordManager = RecordManager;
})(typeof window !== "undefined" ? window : this);
