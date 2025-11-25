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
        // Después de cargar los formatos, cargar la grilla del primer formato
        const formatoSelect = document.getElementById("formato");
        if (formatoSelect && formatoSelect.value) {
          const tipoFormato = formatoSelect.value;

          // Cargar registros y mostrar en grilla
          ApiService.call("searchRecords", tipoFormato, "")
            .then(function (records) {
              if (GridManager) {
                GridManager.renderGrid(tipoFormato, records || []);
              }
            })
            .catch(function (err) {
              console.error("Error cargando registros iniciales:", err);
              if (GridManager) {
                GridManager.renderGrid(tipoFormato, []);
              }
            });
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

        // Update Title
        if (pageTitle) {
          pageTitle.textContent = viewId.charAt(0).toUpperCase() + viewId.slice(1);
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
          HoursDetailPanel.render();
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
