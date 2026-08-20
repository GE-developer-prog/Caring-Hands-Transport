// auth.js
// Session/auth state is now handled 100% by the backend via an
// HttpOnly session cookie set on login — the frontend never reads,
// stores, or manages a token itself. Since frontend and API share
// the same origin, the browser sends that cookie automatically on
// every request (as long as fetch calls use credentials: "include",
// which api.js already does).
//
// There is nothing for this file to check proactively — the only
// signal the frontend gets about auth state is a 401 response from
// any protected route, handled centrally in api.js's request().
// This file exists as a small, named place to redirect from, so
// that logic isn't duplicated across every page.

window.CHT = window.CHT || {};

(function () {
  window.CHT.redirectToStaffLogin = function () {
    if (window.phpspa && typeof window.phpspa.navigate === "function") {
      window.phpspa.navigate("/staff-login");
    } else {
      location.href = "/staff-login";
    }
  };
})();