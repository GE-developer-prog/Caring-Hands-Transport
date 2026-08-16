// menu.js
// Mobile nav uses plain <details>/<summary>, so it opens/closes without
// JS. This script only handles the icon swap + auto-close on link click.
//
// Only elements marked data-mobile-menu are wired up, so nested
// <details> (accordions, FAQs, submenus) aren't affected.

document.addEventListener("DOMContentLoaded", function () {
  var mobileMenus = document.querySelectorAll("details[data-mobile-menu]");

  mobileMenus.forEach(function (menu) {
    var icon = menu.querySelector("[data-menu-icon]");

    function syncIcon() {
      if (!icon) return;
      // menu.open is true right after it opens, false right after it closes
      icon.classList.toggle("fa-bars", !menu.open);   // closed -> hamburger
      icon.classList.toggle("fa-xmark", menu.open);   // open   -> X
    }

    // "toggle" fires on <details> every time open/closed state changes,
    // regardless of what triggered it (tap, keyboard, or JS below).
    menu.addEventListener("toggle", syncIcon);

    // Set correct icon on page load in case the menu starts open
    // (e.g. browser restored scroll/state).
    syncIcon();

    // Auto-close when a nav link is tapped.
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.removeAttribute("open");
      });
    });
  });
});