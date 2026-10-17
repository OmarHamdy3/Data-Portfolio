/* ============================================================================
   OMAR HAMDY — PORTFOLIO
   loader.js
   ============================================================================
   Premium data-themed page loader.

   Handles:
     • Progress animation (0 → 100)
     • Status messages update at checkpoints
     • Chart line drawing (SVG stroke-dashoffset)
     • Chart dot reveal sequence
     • Percentage counter (progress + chart)
     • Exit animation and page reveal

   TABLE OF CONTENTS
   ----------------------------------------------------------------------------
   01. Module Wrapper
   02. DOM References
   03. Timing Constants
   04. Status Message Table
   05. Chart Line Initialization
   06. Helper Functions
   07. State Variables
   08. Main Animation Loop
   09. Completion & Exit
   10. Bootstrap
   11. Safety Fallbacks
   ========================================================================= */


/* ============================================================================
   01. MODULE WRAPPER
   ----------------------------------------------------------------------------
   IIFE keeps everything scoped — no global leakage.
   ========================================================================= */

   (() => {
    "use strict";
  
  
    /* ==========================================================================
       02. DOM REFERENCES
       ========================================================================== */
  
    const loader = document.getElementById("loader");
    const app = document.getElementById("app");
  
    const progressFill = document.getElementById("progressFill");
    const progressPercent = document.getElementById("progressPercent");
    const progressStatus = document.getElementById("progressStatus");
  
    const chartLine = document.getElementById("chartLine");
    const chartArea = document.getElementById("chartArea");
    const chartDots = document.querySelectorAll(".chart-dot");
    const chartNumber = document.getElementById("chartNumber");
    const chartStatus = document.getElementById("chartStatus");
    const finalDot = document.getElementById("finalDot");
  
  
    /* ==========================================================================
       03. TIMING CONSTANTS
       ========================================================================== */
  
    const INITIAL_DELAY = 650;   // ms before animation starts
    const DURATION = 6800;       // total animation duration
    const FINISH_DELAY = 850;    // pause at 100% before exit
    const EXIT_DURATION = 1100;  // exit fade duration
  
  
    /* ==========================================================================
       04. STATUS MESSAGE TABLE
       --------------------------------------------------------------------------
       Each entry maps a progress range [start, end) to:
         • text  → shown in the progress status line
         • chart → shown in the chart header ("LIVE / <chart>")
       ========================================================================== */
  
    const statuses = [
      { start: 0,  end: 10,  text: "Initializing portfolio",       chart: "INITIALIZING" },
      { start: 10, end: 25,  text: "Loading data environment",     chart: "LOADING" },
      { start: 25, end: 42,  text: "Preparing analytical systems", chart: "PROCESSING" },
      { start: 42, end: 60,  text: "Building intelligence layer",  chart: "ANALYZING" },
      { start: 60, end: 76,  text: "Structuring visual experience", chart: "STRUCTURING" },
      { start: 76, end: 90,  text: "Preparing dashboards",         chart: "VISUALIZING" },
      { start: 90, end: 97,  text: "Performing final checks",      chart: "VALIDATING" },
      { start: 97, end: 100, text: "Portfolio ready",              chart: "READY" }
    ];
  
  
    /* ==========================================================================
       05. CHART LINE INITIALIZATION
       --------------------------------------------------------------------------
       Set up the SVG line length for the draw animation. Fallback in case
       getTotalLength() throws (rare but happens on hidden SVGs).
       ========================================================================== */
  
    let lineLength = 0;
  
    try {
      lineLength = chartLine.getTotalLength();
    } catch (_) {
      lineLength = 1500;
    }
  
    chartLine.style.strokeDasharray = lineLength;
    chartLine.style.strokeDashoffset = lineLength;
    chartArea.classList.add("visible");
  
  
    /* ==========================================================================
       06. HELPER FUNCTIONS
       ========================================================================== */
  
    /**
     * Cubic ease-in-out — smooth acceleration and deceleration.
     * @param {number} t - Progress 0 → 1
     * @returns {number}
     */
    function easeInOutCubic(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
  
  
    /**
     * Update the status text and chart label based on current progress.
     * @param {number} value - Progress 0 → 100
     */
    function updateStatus(value) {
      let current = statuses[statuses.length - 1];
  
      for (const item of statuses) {
        if (value >= item.start && value < item.end) {
          current = item;
          break;
        }
      }
  
      progressStatus.textContent = current.text;
      chartStatus.textContent = current.chart;
    }
  
  
    /**
     * Reveal chart dots progressively and highlight the "current" one.
     * @param {number} value - Progress 0 → 100
     */
    function updateDots(value) {
      const total = chartDots.length;
  
      // Small delay so the line appears before dots
      const delayedProgress = Math.max(0, value - 3);
      const visibleCount = Math.floor((delayedProgress / 100) * total);
  
      chartDots.forEach((dot, i) => {
        if (i < visibleCount) {
          dot.classList.add("visible");
        } else {
          dot.classList.remove("visible");
        }
      });
  
      // Clear the "current" marker, then set on the newest dot
      chartDots.forEach((dot) => dot.classList.remove("current"));
  
      if (value > 12 && value < 98) {
        const idx = Math.min(visibleCount, total - 1);
        if (chartDots[idx]) chartDots[idx].classList.add("current");
      }
  
      // Final dot glows at 100%
      if (value >= 98) {
        finalDot.classList.add("current");
      }
    }
  
  
    /**
     * Drive the chart line drawing + dots + area.
     * @param {number} value - Progress 0 → 100
     */
    function updateChart(value) {
      const chartProgress = Math.max(0, Math.min(100, value * 0.985));
      const offset = lineLength - (lineLength * chartProgress) / 100;
  
      chartLine.style.strokeDashoffset = Math.max(0, offset);
      updateDots(value);
    }
  
  
    /* ==========================================================================
       07. STATE VARIABLES
       ========================================================================== */
  
    let displayedProgress = 0;   // smooth current value (lags target)
    let targetProgress = 0;      // raw eased target
    let animationFrame = null;
    let startTime = 0;
    let hasFinished = false;
    let isExiting = false;
  
  
    /* ==========================================================================
       08. MAIN ANIMATION LOOP
       ========================================================================== */
  
    function animate(timestamp) {
      if (hasFinished || isExiting) return;
      if (!startTime) startTime = timestamp;
  
      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / DURATION, 1);
      const easedProgress = easeInOutCubic(rawProgress);
  
      targetProgress = easedProgress * 100;
  
      // Smooth toward target (lerp) — produces that "settling" feel
      displayedProgress += (targetProgress - displayedProgress) * 0.075;
  
      // Snap to 100% at the very end
      if (rawProgress >= 0.999) displayedProgress = 100;
  
      const rounded = Math.floor(displayedProgress);
  
      // Update UI
      progressFill.style.width = rounded + "%";
      progressPercent.textContent = String(rounded).padStart(2, "0");
      chartNumber.textContent = String(rounded).padStart(2, "0");
  
      updateChart(displayedProgress);
      updateStatus(displayedProgress);
  
      // Done?
      if (rawProgress >= 1) {
        completeLoader();
        return;
      }
  
      animationFrame = requestAnimationFrame(animate);
    }
  
  
    /* ==========================================================================
       09. COMPLETION & EXIT
       ========================================================================== */
  
    function completeLoader() {
      if (hasFinished) return;
      hasFinished = true;
  
      // Force perfect end state
      progressFill.style.width = "100%";
      progressPercent.textContent = "100";
      chartNumber.textContent = "100";
      progressStatus.textContent = "Portfolio ready";
      chartStatus.textContent = "READY";
      chartLine.style.strokeDashoffset = "0";
  
      updateDots(100);
  
      // Slight pause then exit
      setTimeout(exitLoader, FINISH_DELAY);
    }
  
  
    function exitLoader() {
      if (isExiting) return;
      isExiting = true;
  
      // Slight scale-up for a cinematic fade
      loader.style.transform = "scale(1.015)";
      loader.style.transition =
        `opacity ${EXIT_DURATION}ms cubic-bezier(.16,1,.3,1), ` +
        `transform ${EXIT_DURATION}ms cubic-bezier(.16,1,.3,1), ` +
        `visibility ${EXIT_DURATION}ms ease`;
  
      requestAnimationFrame(() => loader.classList.add("done"));
  
      // Restore scrolling + notify listeners shortly after the fade begins
      setTimeout(() => {
        document.body.style.overflow = "auto";
        document.body.classList.add("loaded");
  
        if (app) app.classList.add("ready");
  
        document.dispatchEvent(new CustomEvent("loaderComplete"));
      }, 420);
  
      // Clean up the animation loop once the transition is done
      setTimeout(() => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }, EXIT_DURATION + 100);
    }
  
  
    /* ==========================================================================
       10. BOOTSTRAP
       ========================================================================== */
  
    function startLoader() {
      setTimeout(() => requestAnimationFrame(animate), INITIAL_DELAY);
    }
  
    // Start immediately if the page is already loaded (cached / bfcache),
    // otherwise wait for full window load so fonts/images are ready.
    if (document.readyState === "complete") {
      startLoader();
    } else {
      window.addEventListener("load", startLoader, { once: true });
    }
  
  
    /* ==========================================================================
       11. SAFETY FALLBACKS
       --------------------------------------------------------------------------
       If something blocks the load event (e.g. a slow third-party asset),
       force-start the animation anyway after a short delay.
       ========================================================================== */
  
    setTimeout(() => {
      if (!hasFinished && !isExiting && !animationFrame) {
        startTime = performance.now();
        animationFrame = requestAnimationFrame(animate);
      }
    }, INITIAL_DELAY + 1000);
  
    // Clean up before unload to avoid a dangling RAF callback
    window.addEventListener("beforeunload", () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    });
  
  })();