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

  const globals = typeof window !== 'undefined' ? window : this;
  const {
    ReferenceData,
    FormManager,
    WeeklyPlanPanel,
    DropdownConfig,
    InvoicePanel,
    GridManager,
    RecordsData,
    PaymentsPanelHandlers,
    ClientAccountPanel,
    Alerts,
    RecordManager,
    Footer,
    HoursDetailPanel,
    MonthlySummaryPanel,
    AccountStatementPanel,
    ClientReportPanel,
    ClientMonthlySummaryPanel,
    BulkValuesPanel,
    DropdownConfigPanel,
    AnalysisPanel,
    MapPanel,
    AttendanceDailyUI,
    EmployeeCalendarPanel,
    ClientCalendarPanel,
    PaymentsPanel,
    AttendancePanelsData,
    EmptyState,
    DomainMeta,
    Sidebar
  } = globals;

  // ===== Bootstrap Application =====

  let appInitialized = false;
  let handlersBound = false;
  let referenceSubscribed = false;
  let referenceUnsubscribe = null;
  let activeViewId = null;
  const referenceUpdateRegistry = new Map();

  function initApp() {
    if (appInitialized) return;
    appInitialized = true;
    // 1. Load reference data
    if (!ReferenceData || typeof ReferenceData.ensureLoaded !== "function") {
      console.warn("ReferenceData.ensureLoaded no disponible");
    } else {
      const loadPromise = ReferenceData.ensureLoaded();
      loadPromise
        .then(function () {
          const refData = ReferenceData.get();

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
    }

    if (DropdownConfig && typeof DropdownConfig.load === "function") {
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
    bindReferenceUpdates();
  }

  const registroViews = {
    clientes: { format: "CLIENTES", title: "Diccionario de clientes" },
    empleados: { format: "EMPLEADOS", title: "Diccionario de empleados" },
    adelantos: { format: "ADELANTOS", title: "Adelantos de sueldo" },
    gastos: { format: "GASTOS", title: "Gastos" }
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

    const inactiveToggle = document.getElementById("registro-inactive-toggle");
    const checkVerInactivos = document.getElementById("check-ver-inactivos");
    const supportsInactive = tipoFormato === "CLIENTES" || tipoFormato === "EMPLEADOS";
    if (inactiveToggle) inactiveToggle.classList.toggle("d-none", !supportsInactive);
    if (!supportsInactive && checkVerInactivos) checkVerInactivos.checked = false;

    const btnNuevo = document.getElementById("btn-nuevo");
    if (btnNuevo) btnNuevo.classList.remove("d-none");

    const btnRefresh = document.getElementById("btn-refresh");
    if (btnRefresh) btnRefresh.classList.remove("d-none");

    const customPanel = document.getElementById("custom-view-panel");
    if (customPanel) customPanel.classList.add("d-none");

    if (GridManager && typeof GridManager.renderLoading === "function") {
      GridManager.renderLoading(tipoFormato, "Cargando registros...");
    }

    if (!RecordsData || typeof RecordsData.searchRecords !== "function") {
      console.error("RecordsData.searchRecords no disponible");
      return;
    }
    const includeInactive = checkVerInactivos ? checkVerInactivos.checked : false;
    RecordsData.searchRecords(tipoFormato, "", includeInactive)
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

  function registerReferenceHandler(viewId, handler) {
    if (!viewId || typeof handler !== "function") return;
    referenceUpdateRegistry.set(viewId, handler);
  }

  function bindReferenceUpdates() {
    if (referenceSubscribed) return;
    if (!ReferenceData || typeof ReferenceData.subscribe !== "function") return;
    referenceSubscribed = true;
    referenceUnsubscribe = ReferenceData.subscribe(handleReferenceUpdate);
  }

  function handleReferenceUpdate(data) {
    if (!activeViewId) return;
    const handler = referenceUpdateRegistry.get(activeViewId);
    if (handler) handler(data);
    const globalHandler = referenceUpdateRegistry.get("*");
    if (globalHandler) globalHandler(data);
  }

  function setupEventHandlers() {
    if (handlersBound) return;
    handlersBound = true;
    registerReferenceHandler("clientes", () => {
      if (GridManager) GridManager.refreshGrid();
    });
    registerReferenceHandler("empleados", () => {
      if (GridManager) GridManager.refreshGrid();
    });
    registerReferenceHandler("adelantos", () => {
      if (GridManager) GridManager.refreshGrid();
    });
    registerReferenceHandler("gastos", () => {
      if (GridManager) GridManager.refreshGrid();
    });
    registerReferenceHandler("pagos", (detail) => {
      if (PaymentsPanelHandlers && typeof PaymentsPanelHandlers.handleReferenceUpdate === "function") {
        PaymentsPanelHandlers.handleReferenceUpdate(detail || null);
      }
    });
    registerReferenceHandler("reportes-clientes", (detail) => {
      if (ClientAccountPanel && typeof ClientAccountPanel.handleReferenceUpdate === "function") {
        ClientAccountPanel.handleReferenceUpdate(detail || null);
      }
    });

    // Search input - Filtrar grilla
    const searchInput = document.getElementById("search-query");
    const checkVerInactivos = document.getElementById("check-ver-inactivos");

    function performSearch() {
      const tipoFormato = currentRegistroFormat;
      const query = searchInput ? searchInput.value : "";
      const includeInactive = checkVerInactivos ? checkVerInactivos.checked : false;

      if (!tipoFormato) {
        if (query.length > 0 && Alerts) {
          Alerts.showAlert("Selecciona una sección primero para buscar", "warning");
        }
        return;
      }

      // Buscar y actualizar grilla
      if (!RecordsData || typeof RecordsData.searchRecords !== "function") {
        console.error("RecordsData.searchRecords no disponible");
        return;
      }

      if (GridManager && typeof GridManager.renderLoading === "function") {
        // Optional: show loading indicator if needed, but for typing usually we wait? 
        // Actually searchRecords is async, so better show strict loading if it's a new search
      }

      RecordsData.searchRecords(tipoFormato, query, includeInactive)
        .then(function (records) {
          if (GridManager) {
            GridManager.renderGrid(tipoFormato, records || []);
          }
        })
        .catch(function (err) {
          console.error("Error en búsqueda:", err);
        });
    }

    if (searchInput) {
      searchInput.addEventListener("input", performSearch);
    }

    if (checkVerInactivos) {
      checkVerInactivos.addEventListener("change", performSearch);
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

        if (RecordManager && typeof RecordManager.resetEditState === "function") {
          RecordManager.resetEditState();
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
                GridManager.refreshGrid();
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
          const result = RecordManager.deleteRecord();
          const handleClose = (ok) => {
            if (!ok) return;
            if (GridManager) {
              GridManager.closeModal();
              const currentFormat = FormManager && typeof FormManager.getCurrentFormat === "function"
                ? FormManager.getCurrentFormat()
                : null;
              GridManager.refreshGrid();
            }
          };
          if (result && typeof result.then === "function") {
            result.then(handleClose);
          } else {
            handleClose(result === true);
          }
        }
      });
    }

    // Cerrar modal al hacer clic fuera
    const modalOverlay = document.getElementById("form-modal");
    if (modalOverlay) {
      let overlayClickEligible = false;

      modalOverlay.addEventListener("pointerdown", function (e) {
        overlayClickEligible = e.target === modalOverlay;
      });

      modalOverlay.addEventListener("pointermove", function () {
        if (overlayClickEligible) overlayClickEligible = false;
      });

      modalOverlay.addEventListener("pointercancel", function () {
        overlayClickEligible = false;
      });

      modalOverlay.addEventListener("click", function (e) {
        if (e.target === modalOverlay && overlayClickEligible && GridManager) {
          GridManager.closeModal();
        }
        overlayClickEligible = false;
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

    function handleViewChange(viewId) {
      if (!viewId) return;
      activeViewId = viewId;
      const pageTitle = document.getElementById('page-title');
      const titles = {
        analisis: 'Análisis',
        mapa: 'Mapa',
        registro: 'Diccionario',
        clientes: 'Diccionario de clientes',
        empleados: 'Diccionario de empleados',
        adelantos: 'Adelantos de sueldo',
        pagos: 'Pagos',
        gastos: 'Gastos',
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
          if (EmptyState) {
            EmptyState.render(container, { variant: 'loading', message: 'Cargando planes...' });
          } else {
            container.textContent = 'Cargando planes...';
          }
          if (!AttendancePanelsData || typeof AttendancePanelsData.searchWeeklyPlans !== "function") {
            console.error("AttendancePanelsData.searchWeeklyPlans no disponible");
            return;
          }
          AttendancePanelsData.searchWeeklyPlans("")
            .then(records => {
              WeeklyPlanPanel.renderList(container, records || []);
            })
            .catch(err => {
              console.error('Error cargando planes:', err);
              if (EmptyState) {
                EmptyState.render(container, {
                  variant: 'error',
                  title: 'Error al cargar planes',
                  message: 'No se pudo cargar la lista de planes.'
                });
              } else {
                container.textContent = 'Error al cargar planes';
              }
            });
        }
      }
      if (viewId === 'analisis') {
        const container = document.getElementById('analysis-panel');
        if (!AnalysisPanel || !container) {
          if (container) {
            if (EmptyState) {
              EmptyState.render(container, {
                variant: 'error',
                title: 'Módulo no disponible',
                message: 'No se pudo cargar el análisis.'
              });
            } else {
              container.textContent = 'No se pudo cargar el análisis.';
            }
          }
        } else {
          AnalysisPanel.render('analysis-panel');
        }
      }
      if (viewId === 'mapa') {
        const container = document.getElementById('maps-panel');
        if (!MapPanel || !container) {
          if (container) {
            if (EmptyState) {
              EmptyState.render(container, {
                variant: 'error',
                title: 'Mapa no disponible',
                message: 'No se pudo cargar el mapa.'
              });
            } else {
              container.textContent = 'No se pudo cargar el mapa.';
            }
          }
        } else {
          MapPanel.render('maps-panel');
        }
      }

      if (viewId === 'asistencia-diaria' && AttendanceDailyUI) {
        const container = document.getElementById('daily-attendance-panel');
        if (container) AttendanceDailyUI.render(container);
      }

      if (viewId === 'asistencia-calendario' && EmployeeCalendarPanel) {
        EmployeeCalendarPanel.render('employee-calendar-panel');
      }

      if (viewId === 'asistencia-clientes' && ClientCalendarPanel) {
        ClientCalendarPanel.render('client-calendar-panel');
      }

      if (viewId === 'reportes' && HoursDetailPanel) {
        if (MonthlySummaryPanel) MonthlySummaryPanel.render();
        HoursDetailPanel.render();
        if (AccountStatementPanel) AccountStatementPanel.render();
      }
      if (viewId === 'reportes-clientes' && ClientReportPanel) {
        if (ClientMonthlySummaryPanel) {
          ClientMonthlySummaryPanel.render();
        }
        if (ClientAccountPanel) {
          ClientAccountPanel.render();
        }
        ClientReportPanel.render();
      }
      if (viewId === 'configuracion') {
        if (BulkValuesPanel) BulkValuesPanel.render();
        if (DropdownConfigPanel) {
          DropdownConfigPanel.render();
        }
      }
      if (viewId === 'facturacion' && InvoicePanel) {
        InvoicePanel.render();
      }
      if (viewId === 'pagos' && PaymentsPanel) {
        PaymentsPanel.render();
      }
    }

    // Sidebar Initialization
    if (typeof Sidebar !== 'undefined' && Sidebar) {
      Sidebar.init();

      // Handle view changes
      document.addEventListener('view-change', (e) => {
        const viewId = e.detail ? e.detail.view : null;
        handleViewChange(viewId);
      });

      if (Sidebar.setActive) {
        Sidebar.setActive('analisis');
      } else {
        handleViewChange('analisis');
      }
    } else {
      handleViewChange('analisis');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
