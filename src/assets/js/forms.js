// forms.js
// Shared helpers used by every form on the site: required-field
// validation, email-confirmation matching, word-count limits, and a
// generic submit wrapper that wires a <form> to one of the named
// functions in api.js. No import/export — everything lives on
// window.CHT so each form page's small inline script can call it.

window.CHT = window.CHT || {};

(function () {
  function wordCount(text) {
    var trimmed = (text || "").trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }
  window.CHT.wordCount = wordCount;

  function showFieldError(field, message) {
    var errorEl = field.closest(".field-group") &&
      field.closest(".field-group").querySelector(".field-error");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
    }
    field.setAttribute("aria-invalid", "true");

    // Radio/checkbox inputs don't carry .field-input, so the red-border
    // CSS can't target them directly — mark the wrapping fieldset instead
    // so the whole group's border highlights.
    var fieldset = field.closest("fieldset");
    if (fieldset) fieldset.setAttribute("aria-invalid", "true");
  }

  function clearFieldError(field) {
    var errorEl = field.closest(".field-group") &&
      field.closest(".field-group").querySelector(".field-error");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.add("hidden");
    }
    field.removeAttribute("aria-invalid");

    var fieldset = field.closest("fieldset");
    if (fieldset) fieldset.removeAttribute("aria-invalid");
  }

  // Validates: [required] fields, data-confirm-of="fieldName" matches,
  // data-min-words / data-max-words on textareas.
  // Returns true if the whole form is valid.
  window.CHT.validateForm = function (form) {
    var valid = true;
    var fields = form.querySelectorAll("[required], [data-confirm-of], [data-min-words], [data-max-words]");

    fields.forEach(function (field) {
      clearFieldError(field);

      if (field.hasAttribute("required")) {
        var isEmpty =
          (field.type === "checkbox" || field.type === "radio")
            ? !form.querySelector('[name="' + field.name + '"]:checked')
            : !field.value || !field.value.trim();

        if (isEmpty) {
          showFieldError(field, "This field is required.");
          valid = false;
          return;
        }
      }

      if (field.hasAttribute("data-confirm-of")) {
        var otherName = field.getAttribute("data-confirm-of");
        var otherField = form.querySelector('[name="' + otherName + '"]');
        if (otherField && field.value !== otherField.value) {
          showFieldError(field, "This doesn't match.");
          valid = false;
          return;
        }
      }

      if (field.hasAttribute("data-min-words")) {
        var min = parseInt(field.getAttribute("data-min-words"), 10);
        if (wordCount(field.value) < min) {
          showFieldError(field, "Please enter at least " + min + " words.");
          valid = false;
          return;
        }
      }

      if (field.hasAttribute("data-max-words")) {
        var max = parseInt(field.getAttribute("data-max-words"), 10);
        if (wordCount(field.value) > max) {
          showFieldError(field, "Please keep this under " + max + " words.");
          valid = false;
        }
      }
    });

    return valid;
  };

  // Live word-count display for any textarea with [data-word-counter]
  // pointing at an element id to display "N / max words" in.
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-word-counter]").forEach(function (field) {
      var counterEl = document.getElementById(field.getAttribute("data-word-counter"));
      var max = field.getAttribute("data-max-words");
      if (!counterEl) return;

      function update() {
        var count = wordCount(field.value);
        counterEl.textContent = max ? count + " / " + max + " words" : count + " words";
      }
      field.addEventListener("input", update);
      update();
    });
  });

  // Wires a <form> to one of the api.js functions.
  // apiFn: function(data) -> Promise
  // successMessage: shown in a toast, form resets on success
  window.CHT.bindFormSubmit = function (form, apiFn, successMessage) {
    form.addEventListener("submit", async function (evt) {
      evt.preventDefault();

      if (!window.CHT.validateForm(form)) {
        window.CHT.showToast("Please fix the highlighted fields.", "error");
        return;
      }

      var formData = new FormData(form);
      var data = {};
      formData.forEach(function (value, key) {
        if (data[key] !== undefined) {
          data[key] = [].concat(data[key], value);
        } else {
          data[key] = value;
        }
      });

      try {
        await apiFn(data);
        window.CHT.showToast(successMessage || "Submitted successfully.", "success");
        form.reset();
      } catch (err) {
        // api.js already surfaces an error toast — nothing further to do here.
      }
    });
  };
})();