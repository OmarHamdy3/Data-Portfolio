/* ============================================================================
   OMAR HAMDY — PORTFOLIO
   animations.js
   ============================================================================
   All scroll-driven and entrance animations.

   Handles:
     • Marquee scrolling for the tech stack strip
     • GSAP panels animation (with ScrollTrigger, if available)
     • IntersectionObserver-based reveal for .reveal-up / .reveal-stagger
     • Delayed entrance hooks that wait for the loader to finish

   TABLE OF CONTENTS
   ----------------------------------------------------------------------------
   01. Module Wrapper
   02. Marquee — Tech Stack Strip
   03. GSAP Panels — Scroll-Scoped
   04. Scroll Reveal — IntersectionObserver
   05. Loader-Complete Hook
   06. Reduced-Motion Guard (top level)
   ========================================================================= */


/* ============================================================================
   01. MODULE WRAPPER
   ========================================================================= */

   (function () {
    "use strict";
  
  
    /* ==========================================================================
       06. REDUCED-MOTION GUARD (top level)
       --------------------------------------------------------------------------
       Read this once and reuse it everywhere. If the user prefers reduced
       motion, we skip all animation work entirely.
       ========================================================================== */
  
    var prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
  
    /* ==========================================================================
       02. MARQUEE — TECH STACK STRIP
       --------------------------------------------------------------------------
       Infinitely scrolling marquee. Duplicates the track once so the loop
       appears seamless, then animates the two copies side by side.
       ========================================================================== */
  
    function initMarquee() {
      if (prefersReducedMotion) return;
  
      var track = document.querySelector(".stack-strip__track");
      if (!track) return;
  
      var parent = track.parentElement;
      if (!parent) return;
  
      // Avoid double-init (in case the script is loaded twice)
      if (parent.querySelector(".stack-strip__track-clone")) return;
  
      // Clone the track for seamless looping
      var clone = track.cloneNode(true);
      clone.classList.add("stack-strip__track-clone");
      parent.appendChild(clone);
  
      var pos = 0;
      var speed = 0.5;
      var totalWidth = track.offsetWidth;
  
      function animateMarquee() {
        pos -= speed;
  
        // Loop when we've scrolled one full track width
        if (Math.abs(pos) >= totalWidth) {
          pos = 0;
          // Re-measure in case the layout changed
          totalWidth = track.offsetWidth;
        }
  
        track.style.transform = "translateX(" + pos + "px)";
        clone.style.transform = "translateX(" + (pos + totalWidth) + "px)";
  
        requestAnimationFrame(animateMarquee);
      }
  
      // Re-measure on resize
      window.addEventListener("resize", function () {
        totalWidth = track.offsetWidth;
      });
  
      animateMarquee();
    }
  
  
    /* ==========================================================================
       03. GSAP PANELS — SCROLL-SCOPED
       --------------------------------------------------------------------------
       Animates any `.panel` element (used for the philosophy section or any
       scroll-driven hero panels). Requires GSAP + ScrollTrigger.
       ========================================================================== */
  
    function initGSAPPanels() {
      if (prefersReducedMotion) return;
      if (!window.gsap || !window.ScrollTrigger) return;
  
      gsap.registerPlugin(ScrollTrigger);
  
      gsap.utils.toArray(".panel").forEach(function (panel) {
        var tag = panel.querySelector(".tag");
        var title = panel.querySelector("h2");
        var text = panel.querySelector("p");
        var number = panel.querySelector(".bg-number");
  
        // Skip if the panel doesn't have the expected structure
        if (!tag && !title && !text && !number) return;
  
        // Set initial state
        gsap.set([tag, title, text].filter(Boolean), {
          opacity: 0,
          y: 80
        });
  
        if (number) {
          gsap.set(number, { opacity: 0, scale: 0.7 });
        }
  
        // Timeline scoped to this panel
        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: panel,
            start: "top 70%",
            end: "bottom 30%",
            toggleActions: "play reverse play reverse"
          }
        });
  
        if (number) {
          tl.to(number, {
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: "power3.out"
          });
        }
  
        if (tag) {
          tl.to(tag, { opacity: 1, y: 0, duration: 0.4 }, "-=0.3");
        }
  
        if (title) {
          tl.to(title, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2");
        }
  
        if (text) {
          tl.to(text, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2");
        }
  
        // Parallax on the big background number
        if (number) {
          gsap.to(number, {
            y: -120,
            ease: "none",
            scrollTrigger: {
              trigger: panel,
              start: "top bottom",
              end: "bottom top",
              scrub: true
            }
          });
        }
      });
    }
  
  
    /* ==========================================================================
       04. SCROLL REVEAL — INTERSECTIONOBSERVER
       --------------------------------------------------------------------------
       Progressively reveals elements as they enter the viewport.
       Elements are unobserved once revealed (one-shot animation).
       ========================================================================== */
  
    function initScrollReveal() {
      if (prefersReducedMotion) return;
      if (!("IntersectionObserver" in window)) return;
  
      var revealEls = document.querySelectorAll(
        ".reveal-up, .reveal-stagger"
      );
  
      if (!revealEls.length) return;
  
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.15,
          rootMargin: "0px 0px -40px 0px"
        }
      );
  
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    }
  
  
    /* ==========================================================================
       05. LOADER-COMPLETE HOOK
       --------------------------------------------------------------------------
       Waits for the custom `loaderComplete` event before running any
       entrance-heavy animation. This prevents the initial reveal from
       firing while the loader is still covering the screen.
       ========================================================================== */
  
    function initOnLoaderComplete() {
      // Both init functions are idempotent — safe to call once here.
      initGSAPPanels();
      initScrollReveal();
    }
  
  
    /* ==========================================================================
       BOOTSTRAP
       ========================================================================== */
  
    function init() {
      // Marquee starts immediately (it's inside the loader-independent area)
      initMarquee();
  
      // If the loader already fired (e.g. cached page), run reveals now
      if (document.body.classList.contains("loaded")) {
        initOnLoaderComplete();
      } else {
        document.addEventListener("loaderComplete", initOnLoaderComplete, {
          once: true
        });
      }
  
      // Safety: if no loader is present on the page, fire reveals on DOM ready
      if (!document.getElementById("loader")) {
        initOnLoaderComplete();
      }
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  
  })();