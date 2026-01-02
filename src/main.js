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
    // 1. Load reference data
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

    if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.load === "function") {
      DropdownConfig.load().then(() => {
        if (FormManager && typeof FormManager.refreshCurrent === "function") {
          FormManager.refreshCurrent();
        }
        const factView = document.getElementById("view-facturacion");
        if (InvoicePanel && factView && !factView.classList.contains("d-none")) {
          InvoicePanel.render();
        }
      });
    }

    // Setup event handlers
    setupEventHandlers();
  }

  const registroViews = {
    clientes: { format: "CLIENTES", title: "Diccionario de clientes" },
    empleados: { format: "EMPLEADOS", title: "Diccionario de empleados" },
    adelantos: { format: "ADELANTOS", title: "Adelantos de sueldo" }
  };
  let currentRegistroFormat = "CLIENTES";

  function setRegistroContext(title) {
    const label = document.getElementById("registro-context-label");
    if (label && title) label.textContent = title;
  }

  function setRegistroFormat(tipoFormato, title) {
    currentRegistroFormat = tipoFormato;
    if (title) setRegistroContext(title);

    const gridContainer = document.getElementById("data-grid-container");
    if (gridContainer) gridContainer.classList.remove("d-none");

    const searchInput = document.getElementById("search-query");
    if (searchInput) searchInput.parentElement.classList.remove("d-none");

    const btnNuevo = document.getElementById("btn-nuevo");
    if (btnNuevo) btnNuevo.classList.remove("d-none");

    const btnRefresh = document.getElementById("btn-refresh");
    if (btnRefresh) btnRefresh.classList.remove("d-none");

    const customPanel = document.getElementById("custom-view-panel");
    if (customPanel) customPanel.classList.add("d-none");

    if (GridManager && typeof GridManager.renderLoading === "function") {
      GridManager.renderLoading(tipoFormato, "Cargando registros...");
    }

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
  }

  function setupEventHandlers() {
    document.addEventListener("reference-data:updated", function () {
      const registroView = document.getElementById("view-registro");
      if (registroView && !registroView.classList.contains("d-none") && GridManager) {
        GridManager.refreshGrid();
      }
    });

    // Search input - Filtrar grilla
    const searchInput = document.getElementById("search-query");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        const tipoFormato = currentRegistroFormat;

        if (!tipoFormato) {
          if (this.value.length > 0 && Alerts) {
            Alerts.showAlert("Selecciona una sección primero para buscar", "warning");
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
        const tipoFormato = currentRegistroFormat;

        if (!tipoFormato) {
          if (Alerts) {
            Alerts.showAlert("Selecciona una sección primero", "warning");
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
          const result = RecordManager.saveRecord();
          const handleClose = (ok) => {
            if (!ok) return;
            setTimeout(() => {
              if (GridManager) {
                GridManager.closeModal();
                const currentFormat = FormManager && typeof FormManager.getCurrentFormat === "function"
                  ? FormManager.getCurrentFormat()
                  : null;
                const meta = typeof DomainMeta !== "undefined" && DomainMeta && typeof DomainMeta.getMeta === "function"
                  ? DomainMeta.getMeta(currentFormat)
                  : null;
                if (!meta || !meta.refreshReference) {
                  GridManager.refreshGrid();
                }
              }
            }, 500);
          };
          if (result && typeof result.then === "function") {
            result.then(handleClose);
          } else {
            handleClose(result === true);
          }
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
              const currentFormat = FormManager && typeof FormManager.getCurrentFormat === "function"
                ? FormManager.getCurrentFormat()
                : null;
              const meta = typeof DomainMeta !== "undefined" && DomainMeta && typeof DomainMeta.getMeta === "function"
                ? DomainMeta.getMeta(currentFormat)
                : null;
              if (!meta || !meta.refreshReference) {
                GridManager.refreshGrid();
              }
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
          registro: 'Diccionario',
          clientes: 'Diccionario de clientes',
          empleados: 'Diccionario de empleados',
          adelantos: 'Adelantos de sueldo',
          pagos: 'Pagos',
          'asistencia-plan': 'Plan Semanal',
          'asistencia-diaria': 'Tomar Asistencia',
          'asistencia-calendario': 'Calendario Empleado',
          'asistencia-clientes': 'Calendario Clientes',
          reportes: 'Reporte Empleados',
          'reportes-clientes': 'Reporte Clientes',
          facturacion: 'Facturación',
          configuracion: 'Configuración'
        };

        const registroConfig = registroViews[viewId] || (viewId === 'registro' ? registroViews.clientes : null);
        const targetViewId = registroConfig ? 'registro' : viewId;

        // Update Title
        if (pageTitle) {
          const title = titles[viewId] || viewId.charAt(0).toUpperCase() + viewId.slice(1);
          pageTitle.textContent = title;
        }

        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => {
          el.classList.add('d-none');
        });

        // Show target view
        const targetView = document.getElementById(`view-${targetViewId}`);
        if (targetView) {
          targetView.classList.remove('d-none');
        }

        if (registroConfig) {
          setRegistroFormat(registroConfig.format, registroConfig.title);
          return;
        }

        // Initialize view-specific content
        if (viewId === 'asistencia-plan' && typeof WeeklyPlanPanel !== 'undefined') {
          const container = document.getElementById('weekly-plan-panel');
          if (container) {
            container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><div class="mt-2">Cargando planes...</div></div>';
            ApiService.call('searchRecords', 'ASISTENCIA_PLAN', '')
              .then(records => {
                WeeklyPlanPanel.renderList(container, records || []);
              })
              .catch(err => {
                console.error('Error cargando planes:', err);
                container.innerHTML = '<div class="alert alert-danger">Error al cargar planes</div>';
              });
          }
        }

        if (viewId === 'asistencia-diaria' && typeof AttendanceDailyUI !== 'undefined') {
          const container = document.getElementById('daily-attendance-panel');
          if (container) AttendanceDailyUI.render(container);
        }

        if (viewId === 'asistencia-calendario' && typeof EmployeeCalendarPanel !== 'undefined') {
          EmployeeCalendarPanel.render('employee-calendar-panel');
        }

        if (viewId === 'asistencia-clientes' && typeof ClientCalendarPanel !== 'undefined') {
          ClientCalendarPanel.render('client-calendar-panel');
        }

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
        if (viewId === 'configuracion') {
          if (BulkValuesPanel) BulkValuesPanel.render();
          if (typeof DropdownConfigPanel !== 'undefined' && DropdownConfigPanel) {
            DropdownConfigPanel.render();
          }
        }
        if (viewId === 'facturacion' && typeof InvoicePanel !== 'undefined') {
          InvoicePanel.render();
        }
        if (viewId === 'pagos' && typeof PaymentsPanel !== 'undefined') {
          PaymentsPanel.render();
        }
      });

      if (Sidebar.setActive) {
        Sidebar.setActive('clientes');
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
