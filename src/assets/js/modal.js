// modal.js
// Generic modal open/close. Any element with [data-modal-target="id"]
// opens the modal with that id; anything inside the modal with
// [data-modal-close] closes it. Escape key and backdrop click also close.

document.addEventListener("DOMContentLoaded", function () {
  var openers = document.querySelectorAll("[data-modal-target]");

  function openModal(modal) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    var focusable = modal.querySelector("input, button, textarea, select, a[href]");
    if (focusable) focusable.focus();
  }

  function closeModal(modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  openers.forEach(function (opener) {
    opener.addEventListener("click", function () {
      var modal = document.getElementById(opener.getAttribute("data-modal-target"));
      if (modal) openModal(modal);
    });
  });

  document.querySelectorAll("[data-modal]").forEach(function (modal) {
    modal.addEventListener("click", function (evt) {
      if (evt.target === modal || evt.target.hasAttribute("data-modal-close")) {
        closeModal(modal);
      }
    });

    document.addEventListener("keydown", function (evt) {
      if (evt.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal(modal);
      }
    });
  });
});
