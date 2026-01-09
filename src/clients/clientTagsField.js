(function (global) {
  const ClientTagsField = (() => {
    const FIELD_ID = "ETIQUETAS";
    const Dom = global.DomHelpers;
    const UI = global.UIHelpers;
    const ClientTagsData = global.ClientTagsData || null;

    const state = {
      available: [],
      value: [],
      hidden: null,
      chips: null,
      input: null,
      datalist: null
    };

    function normalizeTag(tag) {
      return String(tag || "").trim().replace(/\s+/g, " ");
    }

    function parseTags(value) {
      if (!value) return [];
      if (Array.isArray(value)) return value;

      const raw = String(value).trim();
      if (!raw) return [];

      if (raw[0] === "[") {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          // fallback
        }
      }

      return raw.split(",").map(s => s.trim()).filter(Boolean);
    }

    function uniqueTags(tags) {
      const out = [];
      const seen = new Set();
      (tags || []).forEach(t => {
        const clean = normalizeTag(t);
        if (!clean) return;
        const key = clean.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        out.push(clean);
      });
      return out;
    }

    function renderChips() {
      if (!state.chips) return;
      Dom.clear(state.chips);

      if (!state.value.length) {
        state.chips.appendChild(
          Dom.el("div", {
            className: "tag-chips__empty text-muted small",
            text: "Sin etiquetas"
          })
        );
        return;
      }

      state.value.forEach(tag => {
        const remove = Dom.el("button", {
          type: "button",
          className: "tag-chip__remove",
          "aria-label": "Quitar etiqueta",
          onclick: () => removeTag(tag)
        }, Dom.el("i", { className: "bi bi-x" }));

        const chipContent = Dom.el("span", { className: "tag-chip__label", text: tag });
        const chip = UI && typeof UI.chip === "function"
          ? UI.chip([chipContent, remove], { className: "tag-chip" })
          : Dom.el("span", { className: "tag-chip" }, [chipContent, remove]);

        state.chips.appendChild(chip);
      });
    }

    function updateHidden() {
      if (state.hidden) state.hidden.value = state.value.join(", ");
    }

    function setValue(tags) {
      state.value = uniqueTags(tags);
      updateHidden();
      renderChips();
    }

    function addTags(tags) {
      const incoming = uniqueTags(tags);
      if (!incoming.length) return;

      const current = state.value.slice();
      const merged = uniqueTags(current.concat(incoming));
      const newOnes = incoming.filter(tag => !current.some(t => t.toLowerCase() === tag.toLowerCase()));

      state.value = merged;
      updateHidden();
      renderChips();

      if (newOnes.length) {
        mergeAvailable(newOnes);
        persistTags(newOnes);
      }
    }

    function removeTag(tag) {
      const key = String(tag || "").toLowerCase();
      state.value = state.value.filter(t => t.toLowerCase() !== key);
      updateHidden();
      renderChips();
    }

    function syncFromValue() {
      if (!state.hidden) return;
      setValue(parseTags(state.hidden.value));
    }

    function reset() {
      setValue([]);
    }

    function handleInputAdd() {
      if (!state.input) return;
      const raw = state.input.value;
      const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
      if (!parts.length) return;
      addTags(parts);
      state.input.value = "";
    }

    function updateDatalist() {
      if (!state.datalist) return;
      Dom.clear(state.datalist);
      state.available.forEach(tag => {
        state.datalist.appendChild(Dom.el("option", { value: tag }));
      });
    }

    function mergeAvailable(tags) {
      state.available = uniqueTags(state.available.concat(tags));
      updateDatalist();
    }

    function loadAvailableTags() {
      if (!ClientTagsData || typeof ClientTagsData.getClientTags !== "function") {
        return;
      }

      ClientTagsData.getClientTags()
        .then(tags => {
          state.available = uniqueTags(parseTags(tags));
          updateDatalist();
        })
        .catch(() => {
          // ignore
        });
    }

    function persistTags(tags) {
      if (!ClientTagsData || typeof ClientTagsData.upsertClientTags !== "function") {
        return;
      }

      ClientTagsData.upsertClientTags(tags)
        .then(res => {
          if (Array.isArray(res)) {
            state.available = uniqueTags(parseTags(res));
            updateDatalist();
          }
        })
        .catch(() => {
          // ignore
        });
    }

    function init(container) {
      if (!container) return;
      const wrapper = container.querySelector(`[data-field-id="${FIELD_ID}"]`);
      if (!wrapper) return;

      state.hidden = wrapper.querySelector(`#field-${FIELD_ID}`);
      state.chips = wrapper.querySelector("[data-tags-chips]");
      state.input = wrapper.querySelector("[data-tags-input]");
      state.datalist = wrapper.querySelector("[data-tags-datalist]");

      if (!state.hidden || !state.chips || !state.input) return;

      const addBtn = wrapper.querySelector("[data-tags-add]");
      if (addBtn && !addBtn.dataset.tagsBound) {
        addBtn.dataset.tagsBound = "1";
        addBtn.addEventListener("click", handleInputAdd);
      }

      if (!state.input.dataset.tagsBound) {
        state.input.dataset.tagsBound = "1";
        state.input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            handleInputAdd();
          }
        });

        state.input.addEventListener("blur", handleInputAdd);
      }

      loadAvailableTags();
      syncFromValue();
    }

    return {
      init,
      syncFromValue,
      reset
    };
  })();

  global.ClientTagsField = ClientTagsField;
})(typeof window !== "undefined" ? window : this);
