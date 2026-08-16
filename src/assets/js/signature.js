// signature.js
// Powers every "Draw or Type Signature" field across the forms.
// Expects markup with a wrapping [data-signature] element containing:
//   [data-signature-tab="draw"] / [data-signature-tab="type"] toggle buttons
//   canvas[data-signature-canvas]
//   input[data-signature-type-input]
//   input[type=hidden][data-signature-value]  (what actually gets submitted)

window.CHT = window.CHT || {};

document.addEventListener("DOMContentLoaded", function () {
  var blocks = document.querySelectorAll("[data-signature]");

  blocks.forEach(function (block) {
    var canvas = block.querySelector("[data-signature-canvas]");
    var typeInput = block.querySelector("[data-signature-type-input]");
    var hiddenValue = block.querySelector("[data-signature-value]");
    var drawTab = block.querySelector('[data-signature-tab="draw"]');
    var typeTab = block.querySelector('[data-signature-tab="type"]');
    var drawPanel = block.querySelector('[data-signature-panel="draw"]');
    var typePanel = block.querySelector('[data-signature-panel="type"]');
    var clearBtn = block.querySelector("[data-signature-clear]");

    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var drawing = false;
    var hasDrawn = false;

    function resizeCanvas() {
      var ratio = window.devicePixelRatio || 1;
      var rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#0b0b0c";
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function getPos(evt) {
      var rect = canvas.getBoundingClientRect();
      var point = evt.touches ? evt.touches[0] : evt;
      return { x: point.clientX - rect.left, y: point.clientY - rect.top };
    }

    function start(evt) {
      drawing = true;
      hasDrawn = true;
      var pos = getPos(evt);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      evt.preventDefault();
    }

    function move(evt) {
      if (!drawing) return;
      var pos = getPos(evt);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      updateHiddenValue();
      evt.preventDefault();
    }

    function end() {
      drawing = false;
    }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    function updateHiddenValue() {
      if (!hiddenValue) return;
      if (drawPanel && !drawPanel.classList.contains("hidden")) {
        hiddenValue.value = hasDrawn ? canvas.toDataURL("image/png") : "";
      }
    }

    if (typeInput) {
      typeInput.addEventListener("input", function () {
        if (typePanel && !typePanel.classList.contains("hidden") && hiddenValue) {
          hiddenValue.value = typeInput.value;
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawn = false;
        if (hiddenValue) hiddenValue.value = "";
      });
    }

    function showPanel(mode) {
      if (!drawPanel || !typePanel) return;
      var isDraw = mode === "draw";
      drawPanel.classList.toggle("hidden", !isDraw);
      typePanel.classList.toggle("hidden", isDraw);
      if (drawTab) drawTab.setAttribute("aria-selected", String(isDraw));
      if (typeTab) typeTab.setAttribute("aria-selected", String(!isDraw));
      updateHiddenValue();
      if (!isDraw && typeInput && hiddenValue) hiddenValue.value = typeInput.value;
    }

    if (drawTab) drawTab.addEventListener("click", function () { showPanel("draw"); });
    if (typeTab) typeTab.addEventListener("click", function () { showPanel("type"); });
  });
});
