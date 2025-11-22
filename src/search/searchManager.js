/**
 * Search Manager
 * Maneja la búsqueda de registros
 */

(function (global) {
    const SearchManager = (() => {
        let searchDebounce = null;
        let suggestionResults = [];

        function handleSearch(tipoFormato, query) {
            if (searchDebounce) {
                clearTimeout(searchDebounce);
            }

            const sugg = document.getElementById("search-suggestions");
            if (!sugg) return;

            if (!query || query.length < 2) {
                sugg.classList.add("d-none");
                sugg.innerHTML = "";
                return;
            }

            UiState.setGlobalLoading(true, "Buscando...");

            searchDebounce = setTimeout(function () {
                ApiService.callLatest('search-' + tipoFormato, 'searchRecords', tipoFormato, query)
                    .then(function (results) {
                        if (results && results.ignored) return;
                        suggestionResults = results || [];
                        renderSearchResults(suggestionResults);
                    })
                    .catch(function (err) {
                        console.error("Error en búsqueda:", err);
                        if (Alerts) Alerts.showAlert("Error al buscar: " + err.message, "danger");
                    })
                    .finally(function () {
                        UiState.setGlobalLoading(false);
                    });
            }, 300);
        }

        function renderSearchResults(results) {
            const sugg = document.getElementById("search-suggestions");
            if (!sugg) return;

            if (!results.length) {
                sugg.classList.add("d-none");
                sugg.innerHTML = "";
                return;
            }

            sugg.classList.remove("d-none");
            const list = document.createElement("ul");
            list.className = "list-group list-group-flush";

            results.slice(0, 10).forEach(function (item, idx) {
                const li = document.createElement("li");
                li.className = "list-group-item list-group-item-action p-2 cursor-pointer";
                li.setAttribute("data-suggestion-idx", idx);

                const preview = Object.keys(item.record)
                    .slice(0, 3)
                    .map(k => `<strong>${k}:</strong> ${item.record[k]}`)
                    .join(" · ");

                li.innerHTML = `<small>${preview}</small>`;
                list.appendChild(li);
            });

            sugg.innerHTML = "";
            sugg.appendChild(list);

            sugg.addEventListener("click", function (e) {
                const li = e.target.closest("[data-suggestion-idx]");
                if (li) {
                    const idx = parseInt(li.getAttribute("data-suggestion-idx"));
                    selectSearchResult(idx);
                }
            });
        }

        function selectSearchResult(idx) {
            if (!suggestionResults[idx]) return;

            const item = suggestionResults[idx];
            if (global.RecordManager) {
                // Pass id instead of rowNumber
                global.RecordManager.loadRecordForEdit(item.id, item.record);
            }

            clearSearch();
        }

        function clearSearch() {
            const searchInput = document.getElementById("search");
            const sugg = document.getElementById("search-suggestions");

            if (searchInput) searchInput.value = "";
            if (sugg) {
                sugg.classList.add("d-none");
                sugg.innerHTML = "";
            }

            suggestionResults = [];
        }

        return {
            handleSearch,
            clearSearch
        };
    })();

    global.SearchManager = SearchManager;
})(typeof window !== "undefined" ? window : this);
