// toast.js
// Simple toast notification system. No import/export — everything hangs
// off window.CHT so any other plain <script> can call it.

window.CHT = window.CHT || {};

(function () {
  function ensureContainer() {
    var container = document.getElementById("cht-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "cht-toast-container";
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "true");
      container.className = "fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0";
      document.body.appendChild(container);
    }
    return container;
  }

  // kind: "success" | "error" | "loading"
  // returns a toast id — pass it to CHT.dismissToast() to remove it early
  // (loading toasts must always be dismissed in a `finally` block)
  window.CHT.showToast = function (message, kind) {
    kind = kind || "success";
    var container = ensureContainer();

    var toast = document.createElement("div");
    var id = "toast-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    toast.id = id;

    var colors = {
      success: "border-red bg-ink text-white",
      error: "border-red bg-red text-white",
      loading: "border-line-light bg-paper text-ink dark:border-line-dark dark:bg-charcoal dark:text-paper",
    };

    var icons = {
      success: "fa-solid fa-circle-check",
      error: "fa-solid fa-circle-exclamation",
      loading: "fa-solid fa-spinner fa-spin",
    };

    toast.className = "flex items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg " + (colors[kind] || colors.success);
    toast.innerHTML =
      '<i class="' + (icons[kind] || icons.success) + ' mt-0.5" aria-hidden="true"></i>' +
      '<span class="flex-1">' + message + "</span>";

    container.appendChild(toast);

    if (kind !== "loading") {
      window.setTimeout(function () {
        window.CHT.dismissToast(id);
      }, 5000);
    }

    return id;
  };

  window.CHT.dismissToast = function (id) {
    var toast = document.getElementById(id);
    if (toast && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  };
})();
