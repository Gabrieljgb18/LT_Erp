/**
 * Search Manager
 * Maneja la búsqueda de registros
 */

(function (global) {
    const SearchManager = (() => {
        let searchDebounce = null;
        let suggestionResults = [];
        let suggestionClickBound = false;
        const SEARCH_TTL_MS = 60 * 1000;

        /**
         * Builds a preview string for a search result based on its content
         */
        function buildPreview(record) {
            const parts = [];

            // Always show ID first if available
            if (record.ID) {
                parts.push(`<strong>ID:</strong> ${record.ID}`);
            }

            // Format-specific key fields
            if (record.NOMBRE) {
                parts.push(`<strong>NOMBRE:</strong> ${record.NOMBRE}`);
            } else if (record.EMPLEADO) {
                parts.push(`<strong>EMPLEADO:</strong> ${record.EMPLEADO}`);
            } else if (record.CLIENTE) {
                parts.push(`<strong>CLIENTE:</strong> ${record.CLIENTE}`);
            }

            // Additional context field
            if (!record.NOMBRE && !record.CLIENTE && record["RAZON SOCIAL"]) {
                parts.push(`<strong>RAZÓN SOCIAL:</strong> ${record["RAZON SOCIAL"]}`);
            } else if (record["TIPO DOCUMENTO"] || record["NUMERO DOCUMENTO"]) {
                const docType = record["TIPO DOCUMENTO"] || "";
                const docNumber = record["NUMERO DOCUMENTO"] || "";
                let docLabel = "";
                if (global.InputUtils && typeof global.InputUtils.formatDocLabel === "function") {
                    docLabel = global.InputUtils.formatDocLabel(docType, docNumber);
                } else {
                    docLabel = (docType ? (docType + " ") : "") + docNumber;
                }
                if (docLabel.trim()) {
                    parts.push(`<strong>DOCUMENTO:</strong> ${docLabel}`);
                }
            } else if (record.CUIT) {
                parts.push(`<strong>CUIT:</strong> ${record.CUIT}`);
            } else if (record.CUIL) {
                parts.push(`<strong>CUIL:</strong> ${record.CUIL}`);
            } else if (record.FECHA) {
                parts.push(`<strong>FECHA:</strong> ${record.FECHA}`);
            }

            // If we don't have enough parts, add first non-ID field
            if (parts.length < 2) {
                const keys = Object.keys(record).filter(k => k !== 'ID');
                if (keys.length > 0) {
                    parts.push(`<strong>${keys[0]}:</strong> ${record[keys[0]]}`);
                }
            }

            return parts.join(" · ");
        }

        function handleSearch(tipoFormato, query) {
            if (searchDebounce) {
                clearTimeout(searchDebounce);
            }

            const sugg = document.getElementById("search-suggestions");
            if (!sugg) return;

            if (!query || query.length < 2) {
                sugg.classList.add("d-none");
                sugg.innerHTML = "";
                UiState.setGlobalLoading(false);
                return;
            }

            searchDebounce = setTimeout(function () {
                const cacheKey = String(tipoFormato || "") + "|" + String(query || "").toLowerCase().trim();
                const cached = getCachedResults(cacheKey);
                if (cached) {
                    suggestionResults = cached;
                    renderSearchResults(suggestionResults);
                    UiState.setGlobalLoading(false);
                    return;
                }

                UiState.setGlobalLoading(true, "Buscando...");
                ApiService.callLatest('search-' + tipoFormato, 'searchRecords', tipoFormato, query)
                    .then(function (results) {
                        if (results && results.ignored) return;
                        suggestionResults = results || [];
                        setCachedResults(cacheKey, suggestionResults);
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

        function getCachedResults(key) {
            if (!global.ApiService || !ApiService.dataCache || !ApiService.dataCache.search) return null;
            const entry = ApiService.dataCache.search.get(key);
            if (!entry) return null;
            if (Date.now() - entry.ts > SEARCH_TTL_MS) {
                ApiService.dataCache.search.delete(key);
                return null;
            }
            return entry.results || null;
        }

        function setCachedResults(key, results) {
            if (!global.ApiService || !ApiService.dataCache || !ApiService.dataCache.search) return;
            ApiService.dataCache.search.set(key, { ts: Date.now(), results: results || [] });
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

                // Build format-specific preview
                const preview = buildPreview(item.record);

                li.innerHTML = `<small>${preview}</small>`;
                list.appendChild(li);
            });

            sugg.innerHTML = "";
            sugg.appendChild(list);

            bindSuggestionClick();
        }

        function bindSuggestionClick() {
            if (suggestionClickBound) return;
            const sugg = document.getElementById("search-suggestions");
            if (!sugg) return;
            suggestionClickBound = true;
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
            const searchInput = document.getElementById("search-query");
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
