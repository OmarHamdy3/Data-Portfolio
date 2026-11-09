/* ============================================================================
   TECH MARQUEE — marquee.js
   ----------------------------------------------------------------------------
   Drives the marquee animation via requestAnimationFrame — no CSS keyframes
   required. Guarantees motion regardless of CSS load order or overrides.

   Features:
     · Repeats pills until one set covers the viewport, then duplicates once
       more so the loop is seamless on any screen width.
     · Per-track direction via data-direction="left" | "right".
     · Configurable speed via data-speed (px/sec); defaults to 60.
     · Pauses on: hover, keyboard focus, hidden tab, reduced motion.
     · Re-measures after fonts/images load and on resize.
     · No dependencies, no global leakage, safe with `defer`.

   Usage:
     <div class="marquee-track" data-direction="left" data-speed="60">…</div>
   ========================================================================== */

   (function () {
    'use strict';
  
    function init() {
    var tracks = document.querySelectorAll('.marquee-track');
    if (!tracks.length) { console.warn('[marquee] no .marquee-track found'); return; }
  
    /* ------------------------------------------------------------------------
       CONFIG
       ------------------------------------------------------------------------ */
  
    var DEFAULT_SPEED_PX_PER_SEC = 60;
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
    // Set to false if you want to respect the OS "reduce motion" setting.
    var FORCE_MOTION = true;
  
    function reduced() {
      return !FORCE_MOTION && motionQuery.matches;
    }
  
    var sectionEl = document.querySelector('.marquee-section');
    if (sectionEl && FORCE_MOTION) sectionEl.setAttribute('data-force-motion', '');
  
    // Debug info: open DevTools console
    console.log('[marquee] tracks:', tracks.length,
                '| OS reduce-motion:', motionQuery.matches,
                '| forced:', FORCE_MOTION);
  
    /* ------------------------------------------------------------------------
       BUILD THE LOOP — repeat the set to fill the viewport, then duplicate once
       ------------------------------------------------------------------------ */
  
    function cloneInto(track, nodes) {
      nodes.forEach(function (node) {
        var clone = node.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    }
  
    Array.prototype.forEach.call(tracks, function (track) {
      if (track.dataset.marqueeReady === 'true') return;
  
      var originals = Array.prototype.slice.call(track.children);
      if (!originals.length) return;
  
      // Repeat the set until one "half" is wider than the viewport
      var setWidth = track.scrollWidth;
      var viewWidth = track.parentElement.clientWidth;
      var repeats = setWidth > 0 ? Math.max(1, Math.ceil(viewWidth / setWidth)) : 1;
  
      for (var r = 1; r < repeats; r++) {
        cloneInto(track, originals);
      }
  
      // Then duplicate everything once more for the seamless loop
      cloneInto(track, Array.prototype.slice.call(track.children));
  
      track.dataset.marqueeReady = 'true';
    });
  
    /* ------------------------------------------------------------------------
       PER-TRACK STATE
       ------------------------------------------------------------------------ */
  
    var states = new WeakMap();
  
    Array.prototype.forEach.call(tracks, function (track) {
      var direction = track.dataset.direction === 'right' ? 1 : -1;
  
      var speedAttr = parseFloat(track.dataset.speed);
      var speed = isFinite(speedAttr) && speedAttr > 0
        ? speedAttr
        : DEFAULT_SPEED_PX_PER_SEC;
  
      states.set(track, {
        offset: 0,
        halfWidth: 0,
        paused: false,
        direction: direction,
        speed: speed
      });
    });
  
    /* ------------------------------------------------------------------------
       MEASURE — half-width = total scroll width / 2
       ------------------------------------------------------------------------ */
  
    function measure(track) {
      var state = states.get(track);
      if (!state) return;
      state.halfWidth = track.scrollWidth / 2;
    }
  
    function measureAll() {
      Array.prototype.forEach.call(tracks, measure);
    }
  
    measureAll();
  
    // Re-measure once fonts / images have loaded (widths change after load)
    window.addEventListener('load', measureAll);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measureAll);
    }
  
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measureAll, 120);
    });
  
    /* ------------------------------------------------------------------------
       PAUSE HELPERS
       ------------------------------------------------------------------------ */
  
    function setAllPaused(paused) {
      Array.prototype.forEach.call(tracks, function (track) {
        var state = states.get(track);
        if (state) state.paused = paused;
      });
    }
  
    var section = document.querySelector('.marquee-section');
  
    /* Hover pause */
    if (section) {
      section.addEventListener('mouseenter', function () { setAllPaused(true); });
      section.addEventListener('mouseleave', function () {
        if (!reduced() && !document.hidden) setAllPaused(false);
      });
    }
  
    /* Keyboard focus pause */
    Array.prototype.forEach.call(tracks, function (track) {
      track.addEventListener('focusin', function () {
        var state = states.get(track);
        if (state) state.paused = true;
      });
      track.addEventListener('focusout', function (e) {
        if (!track.contains(e.relatedTarget)) {
          var state = states.get(track);
          if (state && !reduced() && !document.hidden) {
            state.paused = false;
          }
        }
      });
    });
  
    /* Tab-hidden pause */
    document.addEventListener('visibilitychange', function () {
      setAllPaused(document.hidden);
    });
  
    /* Reduced-motion pause (dynamic) */
    function applyReducedMotion() {
      if (reduced()) {
        setAllPaused(true);
      } else if (!document.hidden) {
        setAllPaused(false);
      }
    }
  
    applyReducedMotion();
  
    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', applyReducedMotion);
    } else if (typeof motionQuery.addListener === 'function') {
      motionQuery.addListener(applyReducedMotion);
    }
  
    /* ------------------------------------------------------------------------
       ANIMATION LOOP
       ------------------------------------------------------------------------ */
  
    var lastTime = performance.now();
  
    function tick(now) {
      var dt = Math.min((now - lastTime) / 1000, 0.1); // cap delta at 100ms
      lastTime = now;
  
      if (!reduced() && !document.hidden) {
        Array.prototype.forEach.call(tracks, function (track) {
          var state = states.get(track);
          if (!state || state.paused || state.halfWidth <= 0) return;
  
          state.offset += state.direction * state.speed * dt;
  
          // Wrap the offset into the [-halfWidth, 0] range
          if (state.offset <= -state.halfWidth) {
            state.offset += state.halfWidth;
          } else if (state.offset > 0) {
            state.offset -= state.halfWidth;
          }
  
          track.style.transform = 'translate3d(' + state.offset + 'px, 0, 0)';
        });
      }
  
      requestAnimationFrame(tick);
    }
  
    requestAnimationFrame(tick);
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();