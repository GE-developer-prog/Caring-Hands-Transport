// page-loader.js
// Shows a brief loading bar at the top of the page whenever the visitor
// clicks a link that navigates to another page on this site. Kept short on
// purpose — this is just a "something's happening" cue, not a real progress
// bar (the browser is about to unload the page anyway).
//
// No import/export — attaches to window.CHT like everything else.

window.CHT = window.CHT || {};

(function () {
  var MAX_VISIBLE_MS = 700; // hard cap so it never feels like a long wait

  function ensureLoader() {
    var bar = document.getElementById("cht-page-loader");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "cht-page-loader";
      bar.setAttribute("aria-hidden", "true");
      bar.style.position = "fixed";
      bar.style.top = "0";
      bar.style.left = "0";
      bar.style.height = "3px";
      bar.style.width = "0%";
      bar.style.backgroundColor = "#d91f2b";
      bar.style.zIndex = "9999";
      bar.style.transition = "width 0.2s ease-out, opacity 0.2s ease-out";
      bar.style.opacity = "0";
      document.body.appendChild(bar);
    }
    return bar;
  }

  window.CHT.showPageLoader = function () {
    var bar = ensureLoader();
    bar.style.opacity = "1";
    bar.style.width = "0%";
    // Force reflow so the width transition actually runs
    void bar.offsetWidth;
    bar.style.width = "75%";

    window.setTimeout(function () {
      bar.style.width = "100%";
    }, MAX_VISIBLE_MS * 0.6);
  };

  document.addEventListener("DOMContentLoaded", function () {
    var links = document.querySelectorAll('a[href$=".html"], a[href="/"]');
    links.forEach(function (link) {
      // Skip links that open a new tab or are just in-page anchors
      if (link.target === "_blank" || link.getAttribute("href").startsWith("#")) return;

      link.addEventListener("click", function (evt) {
        // Let modifier-key clicks (open in new tab, etc.) behave normally
        if (evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey) return;
        window.CHT.showPageLoader();
      });
    });
  });
})();
