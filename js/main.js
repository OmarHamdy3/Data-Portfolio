/* ============================================================================
   OMAR HAMDY — PORTFOLIO
   main.js
   ============================================================================
   Entry point / bootstrap file.

   Responsibilities:
     • Detect the environment (browser capabilities, reduced motion, etc.)
     • Initialize all feature modules in the correct order
     • Provide a central place for global utilities and event wiring
     • Log a small "system ready" console banner (dev-friendly)

   WHY THIS FILE EXISTS
   ----------------------------------------------------------------------------
   If you load the feature scripts with individual <script> tags in HTML,
   you DON'T strictly need this file. But using a single bootstrap file:

     ✓ Makes initialization order explicit
     ✓ Avoids timing bugs (DOM ready vs load vs loaderComplete)
     ✓ Centralizes global configuration
     ✓ Easier to swap, mock, or feature-flag modules

   MODULES IT ORCHESTRATES
   ----------------------------------------------------------------------------
     • loader.js       — page loader (self-initializing)
     • navigation.js   — sidebar + project routing (self-initializing)
     • contact-form.js — form validation (self-initializing)
     • animations.js   — GSAP + scroll reveal (self-initializing)

   NOTE: Each module is already self-initializing. This file mainly
   handles cross-module concerns: environment flags, global handlers,
   and any one-time setup.

   TABLE OF CONTENTS
   ----------------------------------------------------------------------------
   01. Module Wrapper
   02. Environment Detection
   03. Global Configuration
   04. Global Event Wiring
   05. Section Presence Map (optional optimization)
   06. Init Sequence
   07. Console Banner
   08. Expose Public API
   09. Bootstrap
   ========================================================================= */


/* ============================================================================
   01. MODULE WRAPPER
   ========================================================================= */

   (function () {
    "use strict";
  
  
    /* ==========================================================================
       02. ENVIRONMENT DETECTION
       --------------------------------------------------------------------------
       Read once, use everywhere. These flags are exposed on window.__OMAR__
       so other modules can reference them without re-reading media queries.
       ========================================================================== */
  
    var env = {
      prefersReducedMotion: false,
      isTouch: false,
      isSmallViewport: false,
      hasIntersectionObserver: false,
      hasGSAP: false
    };
  
    if (window.matchMedia) {
      env.prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
  
      env.isSmallViewport = window.matchMedia("(max-width: 900px)").matches;
    }
  
    env.isTouch =
      "ontouchstart" in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  
    env.hasIntersectionObserver = "IntersectionObserver" in window;
  
    env.hasGSAP = !!(window.gsap && window.ScrollTrigger);
  
  
    /* ==========================================================================
       03. GLOBAL CONFIGURATION
       --------------------------------------------------------------------------
       Single source of truth for tunable values. Other scripts may read
       from window.__OMAR__.config.
       ========================================================================== */
  
    var config = {
      // Project detail IDs in display order (used by navigation.js)
      projectOrder: [
        "detail-superstore",
        "detail-accident",
        "detail-eyouth",
        "detail-depi"
      ],
  
      // Scroll offset (used by any smooth-scroll calls)
      scrollOffset: 0,
  
      // Console logging (set to false in production)
      debug: false
    };
  
  
    /* ==========================================================================
       04. GLOBAL EVENT WIRING
       --------------------------------------------------------------------------
       Handlers that apply site-wide and don't belong in any single module.
       ========================================================================== */
  
    function wireGlobalEvents() {
  
      /* ---- Header scroll state (adds .scrolled after ~10px) ---- */
      var header = document.querySelector("header");
  
      if (header) {
        var lastScrolled = false;
  
        var onScroll = function () {
          var scrolled = window.scrollY > 10;
  
          if (scrolled !== lastScrolled) {
            header.classList.toggle("scrolled", scrolled);
            lastScrolled = scrolled;
          }
        };
  
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll(); // run once on load
      }
  
      /* ---- Smooth scroll for any [data-scroll-to] element ---- */
      document.querySelectorAll("[data-scroll-to]").forEach(function (el) {
        el.addEventListener("click", function (e) {
          var targetId = this.getAttribute("data-scroll-to");
          var target = document.getElementById(targetId);
  
          if (target) {
            e.preventDefault();
            target.scrollIntoView({
              behavior: env.prefersReducedMotion ? "auto" : "smooth",
              block: "start"
            });
          }
        });
      });
  
      /* ---- External links → open in new tab & secure ---- */
      document.querySelectorAll('a[href^="http"]').forEach(function (link) {
        // Skip internal anchors and mailto/tel
        var href = link.getAttribute("href") || "";
        if (href.indexOf(window.location.host) !== -1) return;
  
        // Only touch links that are clearly external
        if (link.hostname && link.hostname !== window.location.hostname) {
          if (!link.hasAttribute("target")) {
            link.setAttribute("target", "_blank");
          }
          if (!link.hasAttribute("rel")) {
            link.setAttribute("rel", "noopener noreferrer");
          }
        }
      });
  
      /* ---- Lazy-load images (native fallback) ---- */
      document.querySelectorAll("img:not([loading])").forEach(function (img) {
        // Skip tiny decorative images if you want; here we lazy-load everything
        img.setAttribute("loading", "lazy");
      });
  
      /* ---- Focus-visible polyfill hint for very old browsers ---- */
      if (!("focusVisible" in document.documentElement.style)) {
        document.addEventListener("keydown", function (e) {
          if (e.key === "Tab") {
            document.body.classList.add("using-keyboard");
          }
        });
  
        document.addEventListener("mousedown", function () {
          document.body.classList.remove("using-keyboard");
        });
      }
    }
  
  
    /* ==========================================================================
       05. SECTION PRESENCE MAP
       --------------------------------------------------------------------------
       Optional. Gives you a quick look at which sections exist on the page.
       Useful for conditional initialization or debugging.
       ========================================================================== */
  
    function buildSectionMap() {
      var ids = [
        "home",
        "about",
        "experience",
        "workflow",
        "specialties",
        "skills",
        "data-principles",
        "projects",
        "certifications",
        "achievements",
        "contact"
      ];
  
      var map = {};
  
      ids.forEach(function (id) {
        map[id] = !!document.getElementById(id);
      });
  
      return map;
    }
  
  
    /* ==========================================================================
       06. INIT SEQUENCE
       --------------------------------------------------------------------------
       Order of operations on page load. All feature modules
       (loader, navigation, contact-form, animations) self-initialize when
       their scripts load — this function only handles the cross-cutting
       setup that doesn't belong in any of them.
       ========================================================================== */
  
    function init() {
  
      if (config.debug) {
        console.log("[main] Initializing portfolio…");
        console.log("[main] Environment:", env);
        console.log("[main] Sections:", buildSectionMap());
      }
  
      // 1. Wire site-wide events (header scroll, external links, etc.)
      wireGlobalEvents();
  
      // 2. Add a class to <html> reflecting environment flags
      //    (useful for CSS hooks like html.touch or html.reduced-motion)
      var html = document.documentElement;
  
      if (env.isTouch) html.classList.add("touch");
      if (env.prefersReducedMotion) html.classList.add("reduced-motion");
      if (env.isSmallViewport) html.classList.add("small-viewport");
  
      // 3. Mark the page as "ready to interact with"
      //    (the loader.js does its own thing; this just signals that
      //     main.js has finished wiring up)
      document.body.classList.add("main-ready");
  
      if (config.debug) {
        console.log("[main] Ready.");
      }
    }
  
  
    /* ==========================================================================
       07. CONSOLE BANNER
       --------------------------------------------------------------------------
       Dev-friendly signature in the console. Remove or comment out in prod.
       ========================================================================== */
  
    function printBanner() {
      if (!config.debug) return;
  
      var styleTitle =
        "color:#f5a623; font-family:'Sora',sans-serif; " +
        "font-size:16px; font-weight:800; letter-spacing:-0.02em;";
  
      var styleSub =
        "color:#9a9a9f; font-family:'Inter',sans-serif; " +
        "font-size:11px; letter-spacing:0.08em;";
  
      console.log("%cOmar Hamdy — Data Portfolio", styleTitle);
      console.log(
        "%cData Analyst · BI Developer — built with care.",
        styleSub
      );
    }
  
  
    /* ==========================================================================
       08. EXPOSE PUBLIC API
       --------------------------------------------------------------------------
       Other scripts or the browser console can read these via
       window.__OMAR__.
       ========================================================================== */
  
    window.__OMAR__ = {
      env: env,
      config: config,
      sections: buildSectionMap(),
      version: "1.0.0",
  
      // Manual re-init in case you need it (e.g. after injecting new sections)
      reinit: function () {
        wireGlobalEvents();
      }
    };
  
  
    /* ==========================================================================
       09. BOOTSTRAP
       --------------------------------------------------------------------------
       Run after the DOM is parsed. We deliberately do NOT wait for
       window.load — the loader handles its own timing, and everything here
       only touches the DOM, not images/fonts.
       ========================================================================== */
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        init();
        printBanner();
      });
    } else {
      // DOMContentLoaded already fired (script loaded late / async)
      init();
      printBanner();
    }
  
  })();