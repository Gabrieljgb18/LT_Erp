(function (global) {
    const Dom = global.DomHelpers || null;

    function renderDailyPanel(container) {
        if (!container) return null;
        if (Dom) {
            Dom.clear(container);
        } else {
            container.textContent = "";
        }

        const gridWrapper = document.createElement("div");
        gridWrapper.className = "card shadow-sm p-3 mb-4";

        const title = document.createElement("h5");
        title.className = "card-title mb-3";
        title.textContent = "Asistencia Diaria";

        const tableWrap = document.createElement("div");
        tableWrap.className = "table-responsive";

        const table = document.createElement("table");
        table.className = "table table-hover";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        headRow.id = "grid-headers";
        thead.appendChild(headRow);

        const tbody = document.createElement("tbody");
        tbody.id = "grid-body";

        table.appendChild(thead);
        table.appendChild(tbody);
        tableWrap.appendChild(table);

        gridWrapper.appendChild(title);
        gridWrapper.appendChild(tableWrap);
        container.appendChild(gridWrapper);

        return { container, gridWrapper, table, headRow, tbody };
    }

    global.AttendancePanelsRender = {
        renderDailyPanel: renderDailyPanel
    };
})(typeof window !== "undefined" ? window : this);
