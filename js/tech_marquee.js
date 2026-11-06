/* ============================================================================
   TECH MARQUEE — marquee.js
   ----------------------------------------------------------------------------
   Drives the marquee animation via requestAnimationFrame — no CSS keyframes
   required. Guarantees motion regardless of CSS load order or overrides.

   Features:
     · Auto-duplicates pills so the loop is seamless.
     · Per-track direction via data-direction="left" | "right".
     · Configurable speed via data-speed (px/sec); defaults to 60.
     · Pauses on: hover, keyboard focus, hidden tab, reduced motion.
     · No dependencies, no global leakage, safe with `defer`.

   Usage:
     <div class="marquee-track" data-direction="left" data-speed="60">…</div>
   ========================================================================== */

   (function () {
    'use strict';
  
    var tracks = document.querySelectorAll('.marquee-track');
    if (!tracks.length) return;
  
    /* ------------------------------------------------------------------------
       CONFIG
       ------------------------------------------------------------------------ */
  
    var DEFAULT_SPEED_PX_PER_SEC = 60;
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
    /* ------------------------------------------------------------------------
       DUPLICATE CONTENT — ensures each track's children repeat 2× for the loop
       ------------------------------------------------------------------------ */
  
    Array.prototype.forEach.call(tracks, function (track) {
      if (track.dataset.marqueeReady === 'true') return;
  
      var children = Array.prototype.slice.call(track.children);
      if (!children.length) return;
  
      children.forEach(function (node) {
        var clone = node.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
  
      track.dataset.marqueeReady = 'true';
    });
  
    /* ------------------------------------------------------------------------
       PER-TRACK STATE
       ------------------------------------------------------------------------ */
  
    var states = new WeakMap();
  
    Array.prototype.forEach.call(tracks, function (track) {
      var directionAttr = track.dataset.direction;
      var direction = directionAttr === 'right' ? 1 : -1;
  
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
       MEASURE — recalc half-width (total scroll width / 2)
       ------------------------------------------------------------------------ */
  
    function measure(track) {
      var state = states.get(track);
      if (!state) return;
      state.halfWidth = track.scrollWidth / 2;
    }
  
    Array.prototype.forEach.call(tracks, measure);
  
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        Array.prototype.forEach.call(tracks, measure);
      }, 120);
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
        if (!motionQuery.matches && !document.hidden) setAllPaused(false);
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
          if (state && !motionQuery.matches && !document.hidden) {
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
      if (motionQuery.matches) {
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
  
      if (!motionQuery.matches && !document.hidden) {
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
  })();