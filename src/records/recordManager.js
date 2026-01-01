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

            if (global.FormManager && typeof global.FormManager.applyClientesEncargadoVisibility === "function") {
                global.FormManager.applyClientesEncargadoVisibility();
            }
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
