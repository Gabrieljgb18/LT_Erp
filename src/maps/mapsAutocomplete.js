(function (global) {
  function bindAddressInput(container) {
    if (!container) return;
    const input = container.querySelector("#field-DIRECCION");
    if (!input || input.dataset.mapsBound) return;

    input.dataset.mapsBound = "1";

    const getField = (fieldId) => container.querySelector("[id='field-" + fieldId + "']");
    const placeIdInput = getField("MAPS PLACE ID");
    const latInput = getField("MAPS LAT");
    const lngInput = getField("MAPS LNG");

    function clearPlaceData() {
      if (placeIdInput) placeIdInput.value = "";
      if (latInput) latInput.value = "";
      if (lngInput) lngInput.value = "";
      input.dataset.mapsPlaceSelected = "0";
    }

    input.addEventListener("input", clearPlaceData);

    if (!global.MapsLoader || !global.MapsLoader.hasKey()) {
      return;
    }

    global.MapsLoader.onReady(function () {
      if (!global.google || !global.google.maps || !global.google.maps.places) return;

      const autocomplete = new global.google.maps.places.Autocomplete(input, {
        fields: ["place_id", "formatted_address", "geometry", "name"],
        types: ["geocode"]
      });

      autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (!place) return;
        if (place.formatted_address) {
          input.value = place.formatted_address;
        }
        if (placeIdInput) {
          placeIdInput.value = place.place_id || "";
        }
        if (place.geometry && place.geometry.location) {
          if (latInput) latInput.value = String(place.geometry.location.lat());
          if (lngInput) lngInput.value = String(place.geometry.location.lng());
        }
        input.dataset.mapsPlaceSelected = "1";
      });
    });
  }

  const MapsAutocomplete = {
    bind: function (container) {
      bindAddressInput(container);
    }
  };

  global.MapsAutocomplete = MapsAutocomplete;
})(typeof window !== "undefined" ? window : this);
