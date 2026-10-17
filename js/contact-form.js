/* ============================================================================
   OMAR HAMDY — PORTFOLIO
   contact-form.js
   ============================================================================
   Contact form validation, UX feedback, and submission simulation.

   Handles:
     • Client-side validation (name, email, subject, message, consent)
     • Inline field error messages
     • Toast notification (success / error)
     • Loading spinner on submit button
     • Character counter on the message textarea
     • Auto-clearing errors as the user types

   TABLE OF CONTENTS
   ----------------------------------------------------------------------------
   01. Module Wrapper
   02. DOM References
   03. Constants (field list, icons)
   04. Helper: Email validation
   05. Helper: Field error toggle
   06. Helper: Toast
   07. Helper: Character counter
   08. Validation
   09. Submit handler
   10. Live error clearing
   11. Bootstrap
   ========================================================================= */


/* ============================================================================
   01. MODULE WRAPPER
   ========================================================================= */

   (function () {
    "use strict";
  
  
    /* ==========================================================================
       02. DOM REFERENCES
       ========================================================================== */
  
    var form = document.getElementById("contactForm");
    if (!form) return; // No form on this page → exit gracefully
  
    var toast = document.getElementById("contactToast");
    var submitBtn = form.querySelector(".contact-submit");
    var submitLabel = form.querySelector(".submit-label");
  
    // Form fields
    var nameField    = document.getElementById("contactName");
    var emailField   = document.getElementById("contactEmail");
    var phoneField   = document.getElementById("contactPhone"); // optional
    var subjectField = document.getElementById("contactSubject");
    var messageField = document.getElementById("contactMessage");
    var consentField = document.getElementById("contactConsent");
  
    // Character counter (e.g. "0 / 1000")
    var charCount = form.querySelector(".character-count");
  
  
    /* ==========================================================================
       03. CONSTANTS
       ========================================================================== */
  
    // Icons used inside the toast
    var ICON_SUCCESS =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M20 6L9 17l-5-5"/></svg>';
  
    var ICON_ERROR =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="10"/>' +
      '<line x1="12" y1="8" x2="12" y2="12"/>' +
      '<line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  
    var MESSAGE_MAX_LENGTH = 1000;
  
  
    /* ==========================================================================
       04. HELPER: EMAIL VALIDATION
       ========================================================================== */
  
    /**
     * Basic email format check.
     * @param {string} v
     * @returns {boolean}
     */
    function isValidEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }
  
  
    /* ==========================================================================
       05. HELPER: FIELD ERROR TOGGLE
       --------------------------------------------------------------------------
       Each field is wrapped in a `.form-field`. Adding `.has-error` reveals
       the inline `<small class="field-error">` message.
       ========================================================================== */
  
    /**
     * @param {HTMLElement} input - The input or textarea element.
     * @param {boolean} hasError
     */
    function setFieldError(input, hasError) {
      if (!input) return;
  
      var wrapper = input.closest(".form-field") ||
                    input.closest(".form-consent");
      if (!wrapper) return;
  
      wrapper.classList.toggle("has-error", hasError);
    }
  
    /**
     * Clear error styling on all fields in one go.
     */
    function clearAllErrors() {
      form.querySelectorAll(".has-error").forEach(function (el) {
        el.classList.remove("has-error");
      });
    }
  
  
    /* ==========================================================================
       06. HELPER: TOAST
       ========================================================================== */
  
    var toastTimer = null;
  
    /**
     * Show a toast notification.
     * @param {string} message
     * @param {"success"|"error"} type
     */
    function showToast(message, type) {
      if (!toast) return;
  
      toast.className = "contact-toast is-visible " + type;
  
      // Preserve the icon element if present, otherwise inject one
      var iconEl = toast.querySelector(".toast-icon");
  
      if (!iconEl) {
        toast.innerHTML = (type === "success" ? ICON_SUCCESS : ICON_ERROR) +
                          '<span class="toast-message">' + message + "</span>";
      } else {
        // Update only the message text
        var msgEl = toast.querySelector(".toast-message");
        if (msgEl) msgEl.textContent = message;
      }
  
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.remove("is-visible");
      }, 4500);
    }
  
  
    /* ==========================================================================
       07. HELPER: CHARACTER COUNTER
       ========================================================================== */
  
    function updateCharCount() {
      if (!charCount || !messageField) return;
  
      var len = messageField.value.length;
      charCount.textContent = len + " / " + MESSAGE_MAX_LENGTH;
    }
  
  
    /* ==========================================================================
       08. VALIDATION
       ========================================================================== */
  
    /**
     * Run all validations. Marks invalid fields and returns true/false.
     * @returns {boolean}
     */
    function validateForm() {
      var valid = true;
  
      // Name
      if (!nameField || !nameField.value.trim()) {
        setFieldError(nameField, true);
        valid = false;
      }
  
      // Email
      if (!emailField || !isValidEmail(emailField.value.trim())) {
        setFieldError(emailField, true);
        valid = false;
      }
  
      // Subject
      if (!subjectField || !subjectField.value.trim()) {
        setFieldError(subjectField, true);
        valid = false;
      }
  
      // Message
      if (!messageField || !messageField.value.trim()) {
        setFieldError(messageField, true);
        valid = false;
      }
  
      // Consent
      if (!consentField || !consentField.checked) {
        setFieldError(consentField, true);
        valid = false;
      }
  
      return valid;
    }
  
  
    /* ==========================================================================
       09. SUBMIT HANDLER
       ========================================================================== */
  
    form.addEventListener("submit", function (e) {
      e.preventDefault();
  
      clearAllErrors();
  
      if (!validateForm()) {
        showToast("Please fix the highlighted fields.", "error");
  
        // Focus the first invalid field
        var firstError = form.querySelector(".has-error");
        if (firstError) {
          var toFocus = firstError.querySelector("input, textarea");
          if (toFocus) toFocus.focus();
        }
  
        return;
      }
  
      // ---- Loading state ----
      if (submitBtn) {
        submitBtn.classList.add("is-loading");
        submitBtn.setAttribute("disabled", "true");
      }
  
      // ---- Simulated async submit ----
      // Replace this setTimeout with a real fetch() to your backend.
      setTimeout(function () {
  
        if (submitBtn) {
          submitBtn.classList.remove("is-loading");
          submitBtn.removeAttribute("disabled");
        }
  
        showToast("Message sent successfully. I'll be in touch soon.", "success");
  
        // Reset the form
        form.reset();
        updateCharCount();
  
      }, 1100);
    });
  
  
    /* ==========================================================================
       10. LIVE ERROR CLEARING
       --------------------------------------------------------------------------
       As soon as the user fixes a field, remove its error styling.
       ========================================================================== */
  
    [nameField, emailField, subjectField, messageField].forEach(function (field) {
      if (!field) return;
  
      field.addEventListener("input", function () {
        var wrapper = field.closest(".form-field");
        if (wrapper) wrapper.classList.remove("has-error");
      });
    });
  
    // Consent checkbox clears its own error when ticked
    if (consentField) {
      consentField.addEventListener("change", function () {
        var wrapper = consentField.closest(".form-consent") ||
                      consentField.closest(".form-field");
        if (wrapper) wrapper.classList.remove("has-error");
      });
    }
  
    // Message textarea also updates the character counter
    if (messageField) {
      messageField.addEventListener("input", function () {
        updateCharCount();
  
        // Enforce the max length on paste as well
        if (messageField.value.length > MESSAGE_MAX_LENGTH) {
          messageField.value = messageField.value.slice(0, MESSAGE_MAX_LENGTH);
        }
      });
    }
  
    // Optional phone field — clear error on input (in case you add validation)
    if (phoneField) {
      phoneField.addEventListener("input", function () {
        var wrapper = phoneField.closest(".form-field");
        if (wrapper) wrapper.classList.remove("has-error");
      });
    }
  
  
    /* ==========================================================================
       11. BOOTSTRAP
       ========================================================================== */
  
    document.addEventListener("DOMContentLoaded", updateCharCount);
  
    // In case the script loads after DOMContentLoaded already fired
    if (document.readyState !== "loading") {
      updateCharCount();
    }
  
  })();