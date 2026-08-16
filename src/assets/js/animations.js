// animations.js
// Small, restrained scroll-reveal effect using GSAP + ScrollTrigger (loaded
// via CDN in each page's <head>). Only elements marked [data-reveal] animate
// — sections fade and lift slightly into place as they enter the viewport.
// No import/export — GSAP itself is loaded as a global via CDN script tags,
// and this file just uses window.gsap directly.

document.addEventListener("DOMContentLoaded", function () {
  if (!window.gsap || !window.ScrollTrigger) return;

  // Respect reduced-motion preference — skip animation entirely
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  var revealEls = document.querySelectorAll("[data-reveal]");
  revealEls.forEach(function (el) {
    gsap.fromTo(
      el,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      }
    );
  });

  // Also fade in service/card grids item-by-item where present, using a
  // small stagger — same restrained effect, no bounce or scale tricks.
  var cardGrids = document.querySelectorAll("[data-reveal-group]");
  cardGrids.forEach(function (grid) {
    var cards = grid.children;
    gsap.fromTo(
      cards,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: grid,
          start: "top 85%",
          once: true,
        },
      }
    );
  });
});
