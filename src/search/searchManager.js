/**
 * Search Manager
 * Maneja la búsqueda de registros
 */

(function (global) {
    const SearchManager = (() => {
        let searchDebounce = null;
        let suggestionResults = [];
        let eventsController = null;
        const Dom = global.DomHelpers;
        const SearchData = global.SearchData || null;

        /**
         * Builds a preview string for a search result based on its content
         */
        function buildPreviewParts(record) {
            const parts = [];

            // Always show ID first if available
            if (record.ID) {
                parts.push({ label: "ID", value: record.ID });
            }

            // Format-specific key fields
            if (record.NOMBRE) {
                parts.push({ label: "NOMBRE", value: record.NOMBRE });
            } else if (record.EMPLEADO) {
                parts.push({ label: "EMPLEADO", value: record.EMPLEADO });
            } else if (record.CLIENTE) {
                parts.push({ label: "CLIENTE", value: record.CLIENTE });
            }

            // Additional context field
            if (!record.NOMBRE && !record.CLIENTE && record["RAZON SOCIAL"]) {
                parts.push({ label: "RAZÓN SOCIAL", value: record["RAZON SOCIAL"] });
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
                    parts.push({ label: "DOCUMENTO", value: docLabel });
                }
            } else if (record.CUIT) {
                parts.push({ label: "CUIT", value: record.CUIT });
            } else if (record.CUIL) {
                parts.push({ label: "CUIL", value: record.CUIL });
            } else if (record.FECHA) {
                parts.push({ label: "FECHA", value: record.FECHA });
            }

            // If we don't have enough parts, add first non-ID field
            if (parts.length < 2) {
                const keys = Object.keys(record).filter(k => k !== 'ID');
                if (keys.length > 0) {
                    parts.push({ label: keys[0], value: record[keys[0]] });
                }
            }

            return parts;
        }

        function renderPreview(container, parts) {
            const frag = document.createDocumentFragment();
            parts.forEach((part, idx) => {
                if (!part) return;
                const label = String(part.label || "");
                const value = part.value == null ? "" : String(part.value);
                frag.appendChild(Dom.el("strong", { text: label + ":" }));
                frag.appendChild(Dom.text(" " + value));
                if (idx < parts.length - 1) {
                    frag.appendChild(Dom.text(" · "));
                }
            });
            container.appendChild(frag);
        }

        function handleSearch(tipoFormato, query) {
            if (searchDebounce) {
                clearTimeout(searchDebounce);
            }

            const sugg = document.getElementById("search-suggestions");
            if (!sugg) return;

            if (!query || query.length < 2) {
                sugg.classList.add("d-none");
                Dom.clear(sugg);
                UiState.setGlobalLoading(false);
                return;
            }

            searchDebounce = setTimeout(function () {
                const cacheKey = String(tipoFormato || "") + "|" + String(query || "").toLowerCase().trim();
                UiState.setGlobalLoading(true, "Buscando...");
                if (!SearchData || typeof SearchData.searchRecords !== "function") {
                    UiState.setGlobalLoading(false);
                    return;
                }
                SearchData.searchRecords(tipoFormato, query)
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
                Dom.clear(sugg);
                return;
            }

            sugg.classList.remove("d-none");
            const list = Dom.el("ul", { className: "list-group list-group-flush" });

            results.slice(0, 10).forEach(function (item, idx) {
                const li = Dom.el("li", {
                    className: "list-group-item list-group-item-action p-2 cursor-pointer",
                    "data-suggestion-idx": String(idx)
                });

                // Build format-specific preview
                const previewParts = buildPreviewParts(item.record || {});
                const small = Dom.el("small");
                renderPreview(small, previewParts);
                li.appendChild(small);
                list.appendChild(li);
            });

            Dom.clear(sugg);
            sugg.appendChild(list);

            bindSuggestionClick();
        }

        function bindSuggestionClick() {
            const sugg = document.getElementById("search-suggestions");
            if (!sugg) return;
            if (eventsController) {
                eventsController.abort();
            }
            eventsController = new AbortController();
            sugg.addEventListener("click", function (e) {
                const li = e.target.closest("[data-suggestion-idx]");
                if (li) {
                    const idx = parseInt(li.getAttribute("data-suggestion-idx"));
                    selectSearchResult(idx);
                }
            }, { signal: eventsController.signal });
        }

        function selectSearchResult(idx) {
            if (!suggestionResults[idx]) return;

            const item = suggestionResults[idx];
            if (global.RecordManager) {
                if (item.record && item.rowNumber) {
                    item.record._rowNumber = item.rowNumber;
                }
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
                Dom.clear(sugg);
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
