(function (global) {
    function applyMassValues(payload) {
        if (!global.ApiService || typeof global.ApiService.call !== "function") {
            return Promise.reject(new Error("ApiService no disponible"));
        }
        return global.ApiService.call("applyMassValues", payload)
            .then(() => {
                if (global.RecordsData && typeof global.RecordsData.refreshReferenceData === "function") {
                    return global.RecordsData.refreshReferenceData();
                }
                return null;
            });
    }

    global.BulkValuesData = {
        applyMassValues: applyMassValues
    };
})(typeof window !== "undefined" ? window : this);
