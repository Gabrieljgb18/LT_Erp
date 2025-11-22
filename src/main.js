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
    // Load reference data first
    ReferenceService.load()
      .then(function () {
        const refData = ReferenceService.get();

        // Initialize modules with reference data
        if (FormManager) {
          FormManager.init(refData);
          FormManager.loadFormats();
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
    // Format selector
    const formatoSelect = document.getElementById("formato");
    if (formatoSelect) {
      formatoSelect.addEventListener("change", function () {
        if (FormManager) {
          FormManager.renderForm(this.value);
        }
      });
    }

    // Search input
    const searchInput = document.getElementById("search");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        const tipoFormato = FormManager ? FormManager.getCurrentFormat() : null;
        if (tipoFormato && SearchManager) {
          SearchManager.handleSearch(tipoFormato, this.value);
        }
      });
    }

    // Footer buttons
    const btnSave = document.getElementById("btn-save");
    if (btnSave) {
      btnSave.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.saveRecord();
        }
      });
    }

    const btnCancel = document.getElementById("btn-cancel");
    if (btnCancel) {
      btnCancel.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.cancelEdit();
        }
      });
    }

    const btnDelete = document.getElementById("btn-delete");
    if (btnDelete) {
      btnDelete.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.deleteRecord();
        }
      });
    }

    // Refresh button
    const btnRefresh = document.getElementById("btn-refresh");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", function () {
        ReferenceService.load().then(function () {
          if (FormManager) {
            FormManager.updateReferenceData(ReferenceService.get());
          }
          if (Alerts) {
            Alerts.showAlert("✅ Datos actualizados", "success");
          }
        });
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
