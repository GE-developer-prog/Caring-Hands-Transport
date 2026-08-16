// auth.js
// Staff/Admin authentication state only. Deliberately separate from any
// public-facing client/session logic — the two are never mixed.
//
// The actual cookie-setting mechanism (HttpOnly, Secure flags, etc.)
// should ultimately be defined by the backend's auth response. Until
// the real API is wired in, this is a placeholder client-side cookie
// with a 1 hour expiry, matching the spec.

window.CHT = window.CHT || {};

(function () {
  var COOKIE_NAME = "cht_staff_token";
  var COOKIE_MAX_AGE_SECONDS = 60 * 60; // 1 hour

  window.CHT.setStaffToken = function (token) {
    document.cookie =
      COOKIE_NAME + "=" + encodeURIComponent(token) +
      "; path=/; max-age=" + COOKIE_MAX_AGE_SECONDS + "; SameSite=Strict";
  };

  window.CHT.getStaffToken = function () {
    var match = document.cookie.match(new RegExp("(?:^|; )" + COOKIE_NAME + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  };

  window.CHT.clearStaffToken = function () {
    document.cookie = COOKIE_NAME + "=; path=/; max-age=0";
  };

  window.CHT.isStaffAuthenticated = function () {
    return !!window.CHT.getStaffToken();
  };

  // Call on any page under the Staff/Admin portal to bounce unauthenticated
  // visitors back to the login page.
  window.CHT.requireStaffAuth = function () {
    if (!window.CHT.isStaffAuthenticated()) {
      if (window.phpspa && typeof window.phpspa.navigate === "function") {
        window.phpspa.navigate("/staff-login");
      } else {
        location.href = "/staff-login";
      }
    }
  };
})();
