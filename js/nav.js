/* ============================================================================
   nav.js — Sidebar drawer + active-section scroll-spy
   ----------------------------------------------------------------------------
   Exposes window.openSidebar() and window.closeSidebar() so existing inline
   onclick="closeSidebar()" handlers keep working.
   ========================================================================= */
   (function () {
    'use strict';
  
    /* ----------------------------------------------------------------------
       0. Element refs
       ---------------------------------------------------------------------- */
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('sidebarOverlay');
    const toggleBtn = document.querySelector('.mobile-header .nav-toggle')
                   || document.querySelector('.nav-toggle');
    const closeBtn  = sidebar ? sidebar.querySelector('.sidebar-close') : null;
    const body      = document.body;
  
    if (!sidebar || !overlay) {
      // Nothing to wire up — bail silently.
      return;
    }
  
    /* ----------------------------------------------------------------------
       1. Drawer open / close
       ---------------------------------------------------------------------- */
    let lastFocused = null;
  
    function openSidebar() {
      lastFocused = document.activeElement;
  
      sidebar.classList.add('is-open');
      overlay.classList.add('is-open');
      body.classList.add('sidebar-open');
  
      sidebar.setAttribute('aria-hidden', 'false');
      overlay.setAttribute('aria-hidden', 'false');
  
      // Move focus into the drawer for keyboard / screen-reader users.
      requestAnimationFrame(function () {
        (closeBtn || sidebar.querySelector('a, button'))?.focus();
      });
    }
  
    function closeSidebar() {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-open');
      body.classList.remove('sidebar-open');
  
      sidebar.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-hidden', 'true');
  
      // Return focus to the trigger (only if it's still in the DOM).
      if (lastFocused && document.contains(lastFocused)) {
        lastFocused.focus();
      }
    }
  
    // Expose globally — the inline onclick="closeSidebar()" handlers rely on this.
    window.openSidebar  = openSidebar;
    window.closeSidebar = closeSidebar;
  
    // Hamburger toggle
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (sidebar.classList.contains('is-open')) closeSidebar();
        else openSidebar();
      });
    }
  
    // Overlay click
    overlay.addEventListener('click', closeSidebar);
  
    // Escape key (only when the drawer is open)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
        closeSidebar();
      }
    });
  
    /* ----------------------------------------------------------------------
       2. Focus trap (desktop-less; keeps Tab inside the drawer while open)
       ---------------------------------------------------------------------- */
    const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
    sidebar.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !sidebar.classList.contains('is-open')) return;
  
      const nodes = Array.from(sidebar.querySelectorAll(FOCUSABLE))
        .filter(function (el) { return el.offsetParent !== null; });
      if (!nodes.length) return;
  
      const first = nodes[0];
      const last  = nodes[nodes.length - 1];
  
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  
    /* ----------------------------------------------------------------------
       3. Scroll-spy — highlights the nav item for the visible section
       ---------------------------------------------------------------------- */
    const navLinks = Array.from(
      document.querySelectorAll(
        '.sidebar-nav a[data-section], header nav a[data-section], nav[aria-label="Primary"] a[data-section]'
      )
    );
  
    // Unique section ids referenced by our nav links.
    const sectionIds = Array.from(new Set(
      navLinks.map(function (a) { return a.dataset.section; })
    ));
  
    const sections = sectionIds
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
  
    if (!sections.length || !('IntersectionObserver' in window)) {
      // No sections found or IO unsupported — nothing to spy on.
      return;
    }
  
    // Cache sticky header height (updates on resize).
    let stickyHeaderHeight = 0;
    function measureHeader() {
      const headerEl =
        document.querySelector('header.desktop-header') ||
        document.querySelector('.mobile-header') ||
        document.querySelector('header');
      stickyHeaderHeight = headerEl ? headerEl.offsetHeight : 0;
    }
    measureHeader();
  
    // Tracks which sections are currently intersecting.
    // We pick the top-most one to avoid flicker at boundaries.
    const visible = new Set();
  
    function setActive(id) {
      let changed = false;
      navLinks.forEach(function (a) {
        const isActive = a.dataset.section === id;
        if (isActive !== a.classList.contains('is-active')) changed = true;
        a.classList.toggle('is-active', isActive);
        if (isActive) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
      return changed;
    }
  
    function pickActive() {
      if (!visible.size) return;
  
      let bestId = null;
      let bestTop = Infinity;
  
      visible.forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top - stickyHeaderHeight;
        if (top < bestTop) {
          bestTop = top;
          bestId = id;
        }
      });
  
      if (bestId) setActive(bestId);
    }
  
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          const id = entry.target.id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        });
        pickActive();
      },
      {
        // Activate when a section crosses into the top ~35% of the viewport,
        // offset by the sticky header height so headings aren't hidden.
        rootMargin: '-' + (stickyHeaderHeight + 8) + 'px 0px -60% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
      }
    );
  
    sections.forEach(function (s) { observer.observe(s); });
  
    /* ----------------------------------------------------------------------
       4. Hash / refresh / back-forward support
       ---------------------------------------------------------------------- */
    function syncFromHash() {
      const hash = location.hash.replace('#', '');
      const id = (hash && sectionIds.indexOf(hash) !== -1)
        ? hash
        : sectionIds[0];
      if (id) setActive(id);
    }
  
    window.addEventListener('hashchange', syncFromHash);
    window.addEventListener('load', syncFromHash);
    syncFromHash();
  
    /* ----------------------------------------------------------------------
       5. Recalculate on resize / orientation change
       ---------------------------------------------------------------------- */
    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        measureHeader();
        // Re-evaluate visible sections with the new header height.
        pickActive();
      }, 120);
    });
  
    /* ----------------------------------------------------------------------
       6. Smooth-scroll with sticky-header offset for internal links
          (keeps target headings from sliding under the sticky header)
       ---------------------------------------------------------------------- */
    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
  
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
  
      const target = document.getElementById(href.slice(1));
      if (!target) return;
  
      // Let the browser handle hash updates; we just adjust scroll position.
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - stickyHeaderHeight - 8;
      window.scrollTo({ top: top, behavior: 'smooth' });
  
      // Update the URL hash without adding a new history entry spam.
      history.pushState(null, '', href);
  
      // Manually reflect the active state right away.
      const id = href.slice(1);
      if (sectionIds.indexOf(id) !== -1) setActive(id);
    });
  
  })();