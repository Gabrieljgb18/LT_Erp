/**
 * Footer UI Component
 */
(function (global) {
    const Footer = (function () {
        const footerHtml = `
            <footer class="fixed-bottom bg-white border-top py-2">
                <div class="container d-flex justify-content-between align-items-center">
                    <div class="d-flex gap-2">
                        <button id="btn-nuevo" class="btn btn-primary rounded-pill px-4">
                            <i class="bi bi-plus-lg me-1"></i> Nuevo
                        </button>
                    </div>
                    <button id="btn-grabar" class="btn btn-success rounded-pill px-4" disabled>
                        <i class="bi bi-check-lg me-1"></i> Grabar
                    </button>
                </div>
            </footer>
        `;

        function render() {
            const container = document.getElementById('footer-container');
            if (container) {
                container.innerHTML = footerHtml;
                attachEvents();
            }
        }

        function attachEvents() {
            const btnNuevo = document.getElementById('btn-nuevo');
            const btnGrabar = document.getElementById('btn-grabar');

            if (btnNuevo) {
                btnNuevo.addEventListener('click', function () {
                    if (global.FormManager) {
                        global.FormManager.resetForm();
                    }

                    // Reset buttons
                    btnGrabar.disabled = false;
                    btnNuevo.disabled = true;
                });
            }

            if (btnGrabar) {
                btnGrabar.addEventListener('click', function () {
                    if (global.FormManager) {
                        global.FormManager.submitForm();
                    }
                });
            }
        }

        return {
            render: render
        };
    })();

    global.Footer = Footer;
})(typeof window !== "undefined" ? window : this);
