// api.js
// The ONLY file that calls fetch() or knows an endpoint path.
// Every form/login page calls a named function on window.CHT instead
// of touching the network directly.
//
// Auth model: session cookie, set and read entirely by the backend
// (HttpOnly, same-origin). This file never stores or reads a token —
// it only ever checks HTTP status codes (200 vs 401) and, for every
// authenticated route, redirects to login on any 401 it sees.
//
// Wire format: every outgoing request body is converted from the
// project's camelCase field names to snake_case before being sent,
// since that's what the backend expects. Nothing else in the
// codebase changes — HTML name="" attributes, JS variables, and the
// spec doc's field tables all stay camelCase. The conversion happens
// only here, right at the boundary.

window.CHT = window.CHT || {};

(function () {
  var BASE_URL = "/api/PENDING_BACKEND";

  var ENDPOINTS = {
    feedback: BASE_URL + "/feedback",
    transportOrder: BASE_URL + "/transport-order",
    employmentApplication: BASE_URL + "/employment-application",
    employeeReferral: BASE_URL + "/employee-referral",
    staffLogin: BASE_URL + "/staff/login",
    delayReport: BASE_URL + "/staff/delay-report",
    preTripInspection: BASE_URL + "/staff/pre-trip-inspection",
    hazardReport: BASE_URL + "/staff/hazard-report",
    incidentReport: BASE_URL + "/staff/incident-report",
    timeOffRequest: BASE_URL + "/staff/time-off-request",
    updateCredentials: BASE_URL + "/staff/update-credentials",
    notificationEmails: BASE_URL + "/staff/notification-emails",
  };

  // ---- camelCase <-> snake_case conversion ----
  function camelToSnake(str) {
    return str.replace(/[A-Z]/g, function (letter) {
      return "_" + letter.toLowerCase();
    });
  }

  function snakeToCamel(str) {
    return str.replace(/_([a-z0-9])/g, function (_, letter) {
      return letter.toUpperCase();
    });
  }

  function convertKeys(obj, converter) {
    if (Array.isArray(obj)) {
      return obj.map(function (item) { return convertKeys(item, converter); });
    }
    if (obj !== null && typeof obj === "object" && !(obj instanceof File)) {
      var result = {};
      Object.keys(obj).forEach(function (key) {
        result[converter(key)] = convertKeys(obj[key], converter);
      });
      return result;
    }
    return obj;
  }

  // ---- Generic request core ----
  // Every named function below funnels through here. Non-auth routes
  // still expect { success, message, data }; auth routes only ever
  // return { success, message } + a 200/401 status code — callers
  // that need the status code read res.status directly instead of
  // relying on this helper's thrown-error behavior.
  async function request(endpoint, options) {
    options = options || {};
    var toastId = null;

    try {
      if (options.loadingMessage) {
        toastId = window.CHT.showToast(options.loadingMessage, "loading");
      }

      var body = options.body ? convertKeys(options.body, camelToSnake) : undefined;

      var res = await fetch(endpoint, {
        method: options.method || "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      });

      // Any authenticated route returning 401 means the session is
      // missing/expired — bounce to login immediately, regardless of
      // which route it was.
      if (res.status === 401 && options.authenticated) {
        window.CHT.redirectToStaffLogin();
        return;
      }

      var data = await res.json();
      data = convertKeys(data, snakeToCamel);

      if (!data || data.success !== true) {
        var message = (data && data.message) || "The request could not be completed.";
        throw new Error(message);
      }

      return data.data;
    } catch (err) {
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
  // Login is a special case: it only ever returns { success, message }
  // and a 200/401 status code — never a data payload, never a token.
  // Callers check the resolved status directly.
  window.CHT.staffLogin = async function (username, password) {
    var toastId = window.CHT.showToast("Signing in…", "loading");
    try {
      var body = convertKeys({ username: username, password: password }, camelToSnake);
      var res = await fetch(ENDPOINTS.staffLogin, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      var data = await res.json();
      return { status: res.status, success: data.success === true, message: data.message };
    } catch (err) {
      window.CHT.showToast("Could not reach the server. Check your connection and try again.", "error");
      throw err;
    } finally {
      window.CHT.dismissToast(toastId);
    }
  };

  // ---- Staff/Admin internal forms ----
  window.CHT.submitDelayReport = function (data) {
    return request(ENDPOINTS.delayReport, { body: data, loadingMessage: "Submitting delay report…", authenticated: true });
  };

  window.CHT.submitPreTripInspection = function (data) {
    return request(ENDPOINTS.preTripInspection, { body: data, loadingMessage: "Submitting pre-trip inspection…", authenticated: true });
  };

  window.CHT.submitHazardReport = function (data) {
    return request(ENDPOINTS.hazardReport, { body: data, loadingMessage: "Submitting hazard report…", authenticated: true });
  };

  window.CHT.submitIncidentReport = function (data) {
    return request(ENDPOINTS.incidentReport, { body: data, loadingMessage: "Submitting incident report…", authenticated: true });
  };

  window.CHT.submitTimeOffRequest = function (data) {
    return request(ENDPOINTS.timeOffRequest, { body: data, loadingMessage: "Submitting time off request…", authenticated: true });
  };

  window.CHT.updateStaffCredentials = function (data) {
    return request(ENDPOINTS.updateCredentials, { body: data, loadingMessage: "Saving your changes…", authenticated: true });
  };

  // ---- Notification emails (list — every address here receives every
  // form submission on the site, not just one) ----
  window.CHT.getNotificationEmails = function () {
    return request(ENDPOINTS.notificationEmails, { method: "GET", authenticated: true });
  };

  window.CHT.addNotificationEmail = function (email) {
    return request(ENDPOINTS.notificationEmails, {
      method: "POST",
      body: { email: email },
      loadingMessage: "Adding email…",
      authenticated: true,
    });
  };

  window.CHT.updateNotificationEmail = function (id, email) {
    return request(ENDPOINTS.notificationEmails + "/" + id, {
      method: "PUT",
      body: { email: email },
      loadingMessage: "Updating email…",
      authenticated: true,
    });
  };

  window.CHT.deleteNotificationEmail = function (id) {
    return request(ENDPOINTS.notificationEmails + "/" + id, {
      method: "DELETE",
      loadingMessage: "Removing email…",
      authenticated: true,
    });
  };
})();