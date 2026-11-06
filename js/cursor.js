/* ==========================================================
   CUSTOM CURSOR
   ========================================================== */
   (function () {
    "use strict";
  
    // Skip on touch devices
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (isTouch) return;
  
    const dot  = document.getElementById("cursorDot");
    const ring = document.getElementById("cursorRing");
    if (!dot || !ring) return;
  
    // Position state
    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    const RING_SPEED = 0.18;   // lower = slower trail
  
    // Show on first move
    let shown = false;
    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
  
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  
      if (!shown) {
        shown = true;
        // snap the ring to avoid a jump-in
        ringX = mouseX;
        ringY = mouseY;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        document.body.classList.add("cursor-ready");
      }
    });
  
    // Smooth ring follow
    function render() {
      ringX += (mouseX - ringX) * RING_SPEED;
      ringY += (mouseY - ringY) * RING_SPEED;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  
    // Hide when leaving window
    document.addEventListener("mouseleave", () => {
      document.body.classList.remove("cursor-ready");
    });
    document.addEventListener("mouseenter", () => {
      if (shown) document.body.classList.add("cursor-ready");
    });
  
    // Click feedback
    document.addEventListener("mousedown", () => {
      document.body.classList.add("cursor-down");
    });
    document.addEventListener("mouseup", () => {
      document.body.classList.remove("cursor-down");
    });
  
    /* --------------------------------------------------------
       HOVER STATES
       Add to links, buttons, and cards.
       -------------------------------------------------------- */
    const HOVER_SELECTOR =
      'a, button, [role="button"], .project-card-professional, .skill-card, ' +
      '.about-stat-card, .nav-cta, .mobile-cta, .contact-submit, ' +
      '.social-link, .exp-tags span, .skill-list span';
  
    const TEXT_SELECTOR = 'input, textarea, [contenteditable="true"]';
  
    // Delegate so dynamically added elements work too
    document.addEventListener("mouseover", (e) => {
      const t = e.target;
      if (t.closest(TEXT_SELECTOR)) {
        document.body.classList.add("cursor-text");
        document.body.classList.remove("cursor-hover");
        return;
      }
      if (t.closest(HOVER_SELECTOR)) {
        document.body.classList.add("cursor-hover");
        document.body.classList.remove("cursor-text");
        return;
      }
      document.body.classList.remove("cursor-hover", "cursor-text");
    });
  
    document.addEventListener("mouseout", (e) => {
      // If leaving to something outside the interactive zone, clear
      const to = e.relatedTarget;
      if (!to) {
        document.body.classList.remove("cursor-hover", "cursor-text");
        return;
      }
      if (
        !to.closest(HOVER_SELECTOR) &&
        !to.closest(TEXT_SELECTOR)
      ) {
        document.body.classList.remove("cursor-hover", "cursor-text");
      }
    });
  })();