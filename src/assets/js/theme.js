// theme.js
// Handles the visible light/dark toggle button on every page.
// The very first paint's dark/light class is set by a tiny inline
// script in <head> (before this file loads) to avoid a flash of the
// wrong theme — this file only wires up the toggle button afterwards.
//
// No import/export here on purpose: type="module" on the <script> tag
// is only so Vite bundles this file. Shared helpers across our own JS
// files live on the window.CHT namespace instead of ES module exports.

window.CHT = window.CHT || {};

window.CHT.setTheme = function (theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("cht-theme", theme);
  window.CHT.updateThemeToggleIcon(theme);
};

window.CHT.getTheme = function () {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

window.CHT.updateThemeToggleIcon = function (theme) {
  const icons = document.querySelectorAll("[data-theme-icon]");
  icons.forEach(function (icon) {
    icon.className = theme === "dark"
      ? "fa-solid fa-sun"
      : "fa-solid fa-moon";
  });
};

document.addEventListener("DOMContentLoaded", function () {
  // Sync the icon with whatever the inline head script already applied
  window.CHT.updateThemeToggleIcon(window.CHT.getTheme());

  const toggleButtons = document.querySelectorAll("[data-theme-toggle]");
  toggleButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const next = window.CHT.getTheme() === "dark" ? "light" : "dark";
      window.CHT.setTheme(next);
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  var year = new Date().getFullYear();
  document.querySelectorAll(".copyright-year").forEach(function (el) {
    el.textContent = year;
  });
});