(function (global) {
    function loadOptions() {
        if (!global.ApiService || !global.ApiService.call) {
            return Promise.resolve({});
        }
        return global.ApiService.call("getDropdownOptions");
    }

    function saveOptions(payload) {
        if (!global.ApiService || !global.ApiService.call) {
            return Promise.reject(new Error("ApiService no disponible"));
        }
        return global.ApiService.call("saveDropdownOptions", payload);
    }

    global.DropdownConfigData = {
        loadOptions: loadOptions,
        saveOptions: saveOptions
    };
})(typeof window !== "undefined" ? window : this);
