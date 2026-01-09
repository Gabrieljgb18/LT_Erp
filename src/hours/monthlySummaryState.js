/**
 * MonthlySummaryPanelState
 */
(function (global) {
  const state = {
    containerId: "monthly-summary-panel",
    eventsController: null,
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null
  };

  global.MonthlySummaryPanelState = state;
})(typeof window !== "undefined" ? window : this);
