/**
 * Footer Manager
 * Gestiona la visibilidad y estado del footer
 */

(function (global) {
    const FooterManager = (() => {

        function updateVisibility() {
            const footer = document.getElementById("footer-buttons");
            if (footer) {
                footer.classList.remove("d-none");
            }
        }

        function showCreateMode() {
            const btnSave = document.getElementById("btn-save");
            const btnCancel = document.getElementById("btn-cancel");
            const btnDelete = document.getElementById("btn-delete");

            if (btnSave) btnSave.textContent = "Guardar";
            if (btnCancel) btnCancel.classList.add("d-none");
            if (btnDelete) btnDelete.classList.add("d-none");
        }

        function showEditMode() {
            const btnSave = document.getElementById("btn-save");
            const btnCancel = document.getElementById("btn-cancel");
            const btnDelete = document.getElementById("btn-delete");

            if (btnSave) btnSave.textContent = "Actualizar";
            if (btnCancel) btnCancel.classList.remove("d-none");
            if (btnDelete) btnDelete.classList.remove("d-none");
        }

        return {
            updateVisibility,
            showCreateMode,
            showEditMode
        };
    })();

    global.FooterManager = FooterManager;
})(typeof window !== "undefined" ? window : this);
