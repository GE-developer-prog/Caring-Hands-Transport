// api.js
// The ONLY file that calls fetch() or knows an endpoint URL.
// Every endpoint below is a placeholder — do not treat any URL,
// method, field name, or response shape here as final. Once the
// backend developer provides real API docs, only this file changes.
//
// No import/export — functions are attached to window.CHT so other
// plain <script type="module"> files can call them directly.

window.CHT = window.CHT || {};

(function () {
  var BASE_URL = "/api/PENDING_BACKEND";

  var ENDPOINTS = {
    feedback: BASE_URL + "/feedback",
    transportOrder: BASE_URL + "/transport-order",
    employmentApplication: BASE_URL + "/employment-application",
    staffLogin: BASE_URL + "/staff/login",
    delayReport: BASE_URL + "/staff/delay-report",
    preTripInspection: BASE_URL + "/staff/pre-trip-inspection",
    hazardReport: BASE_URL + "/staff/hazard-report",
    incidentReport: BASE_URL + "/staff/incident-report",
    timeOffRequest: BASE_URL + "/staff/time-off-request",
    admins: BASE_URL + "/staff/admins",
    updateCredentials: BASE_URL + "/staff/update-credentials",
    employeeReferral: BASE_URL + "/employee-referral",
  };

  // Generic request core. Every named function below funnels through here.
  // Response contract to expect from the backend: { success, message, data }
  async function request(endpoint, options) {
    options = options || {};
    var toastId = null;

    try {
      if (options.loadingMessage) {
        toastId = window.CHT.showToast(options.loadingMessage, "loading");
      }

      var res = await fetch(endpoint, {
        method: options.method || "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      var data = await res.json();

      if (!data || data.success !== true) {
        var message = (data && data.message) || "The request could not be completed.";
        throw new Error(message);
      }

      return data.data;
    } catch (err) {
      // Distinguish a real network failure from an application-level error
      // rather than labeling everything a "connection error".
      var isNetworkFailure = err instanceof TypeError;
      var friendlyMessage = isNetworkFailure
        ? "Could not reach the server. Check your connection and try again."
        : err.message || "Something went wrong. Please try again.";

      if (window.CHT.showToast) {
        window.CHT.showToast(friendlyMessage, "error");
      }
      throw err;
    } finally {
      if (toastId) {
        window.CHT.dismissToast(toastId);
      }
    }
  }

  // ---- Public form submissions ----
  window.CHT.submitFeedback = function (data) {
    return request(ENDPOINTS.feedback, { body: data, loadingMessage: "Sending your feedback…" });
  };

  window.CHT.submitTransportOrder = function (data) {
    return request(ENDPOINTS.transportOrder, { body: data, loadingMessage: "Sending your transportation request…" });
  };

  window.CHT.submitEmploymentApplication = function (data) {
    return request(ENDPOINTS.employmentApplication, { body: data, loadingMessage: "Submitting your application…" });
  };

  window.CHT.submitEmployeeReferral = function (data) {
    return request(ENDPOINTS.employeeReferral, { body: data, loadingMessage: "Submitting your referral…" });
  };

  // ---- Staff/Admin auth ----
  window.CHT.staffLogin = function (username, password) {
    return request(ENDPOINTS.staffLogin, {
      body: { username: username, password: password },
      loadingMessage: "Signing in…",
    });
  };

  // ---- Staff/Admin internal forms ----
  window.CHT.submitDelayReport = function (data) {
    return request(ENDPOINTS.delayReport, { body: data, loadingMessage: "Submitting delay report…" });
  };

  window.CHT.submitPreTripInspection = function (data) {
    return request(ENDPOINTS.preTripInspection, { body: data, loadingMessage: "Submitting pre-trip inspection…" });
  };

  window.CHT.submitHazardReport = function (data) {
    return request(ENDPOINTS.hazardReport, { body: data, loadingMessage: "Submitting hazard report…" });
  };

  window.CHT.submitIncidentReport = function (data) {
    return request(ENDPOINTS.incidentReport, { body: data, loadingMessage: "Submitting incident report…" });
  };

  window.CHT.submitTimeOffRequest = function (data) {
    return request(ENDPOINTS.timeOffRequest, { body: data, loadingMessage: "Submitting time off request…" });
  };

  window.CHT.updateStaffCredentials = function (data) {
    return request(ENDPOINTS.updateCredentials, { body: data, loadingMessage: "Saving your changes…" });
  };

  // ---- Admin info ----
  // If/when this endpoint exists, it must return ALL administrators —
  // never fetch a single arbitrary admin.
  window.CHT.getAdmins = function () {
    return request(ENDPOINTS.admins, { method: "GET" });
  };
})();