/* ============================================================================
   OMAR HAMDY — PORTFOLIO
   navigation.js
   ============================================================================
   All navigation logic:

     • Sidebar open/close (mobile menu)
     • Smooth scroll for anchor links
     • Project detail switching (SPA-style)
     • Browser back/forward handling
     • Header visibility toggle between "site" and "project" modes
     • URL hash sync

   TABLE OF CONTENTS
   ----------------------------------------------------------------------------
   01. Module Wrapper
   02. Smooth Scroll (anchor links)
   03. Sidebar Open / Close
   04. Project Registry (order + meta)
   05. Header State Toggle
   06. Show Project
   07. Close Project
   08. Close Project + Scroll to #projects
   09. Browser Back / Forward
   10. Initial Page Load
   11. Global Exports (window.*)
   ========================================================================= */


/* ============================================================================
   01. MODULE WRAPPER
   ========================================================================= */

   (function () {
    "use strict";
  
  
    /* ==========================================================================
       02. SMOOTH SCROLL (ANCHOR LINKS)
       --------------------------------------------------------------------------
       Intercept clicks on any internal #anchor link, close the sidebar,
       and smoothly scroll to the target section.
       ========================================================================== */
  
    document
      .querySelectorAll('nav a[href^="#"], .sidebar-nav a[href^="#"]')
      .forEach(function (link) {
        link.addEventListener("click", function (e) {
          var targetId = this.getAttribute("href").substring(1);
  
          // Always close any open project first
          closeProject(true);
  
          // Sidebar links also need to close the drawer
          closeSidebar();
  
          e.preventDefault();
  
          setTimeout(function () {
            var target = document.getElementById(targetId);
            if (target) {
              target.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });
            }
          }, 150);
        });
      });
  
  
    /* ==========================================================================
       03. SIDEBAR OPEN / CLOSE
       ========================================================================== */
  
    function openSidebar() {
      var sidebar = document.getElementById("sidebar");
      var overlay = document.getElementById("sidebarOverlay");
      var toggle = document.querySelector(".nav-toggle");
  
      if (sidebar) sidebar.classList.add("is-open");
      if (overlay) overlay.classList.add("is-open");
  
      document.body.style.overflow = "hidden";
  
      if (toggle) toggle.setAttribute("aria-expanded", "true");
    }
  
    function closeSidebar() {
      var sidebar = document.getElementById("sidebar");
      var overlay = document.getElementById("sidebarOverlay");
      var toggle = document.querySelector(".nav-toggle");
  
      if (sidebar) sidebar.classList.remove("is-open");
      if (overlay) overlay.classList.remove("is-open");
  
      document.body.style.overflow = "";
  
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }
  
    // Close sidebar on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSidebar();
    });
  
  
    /* ==========================================================================
       04. PROJECT REGISTRY
       --------------------------------------------------------------------------
       Order is used to compute the "Next project" link automatically.
       ========================================================================== */
  
    var PROJECT_ORDER = [
      "detail-superstore",
      "detail-accident",
      "detail-eyouth",
      "detail-depi"
    ];
  
    var PROJECT_META = {
      "detail-superstore": { title: "Superstore Business Analysis" },
      "detail-accident":   { title: "Road Accident Intelligence Platform" },
      "detail-eyouth":     { title: "E-Youth BI Dashboards" },
      "detail-depi":       { title: "DEPI Capstone Project" }
    };
  
    function getNextProjectId(currentId) {
      var i = PROJECT_ORDER.indexOf(currentId);
      if (i === -1) return PROJECT_ORDER[0];
      return PROJECT_ORDER[(i + 1) % PROJECT_ORDER.length];
    }
  
  
/* ==========================================================================
   06. HEADER STATE TOGGLE
   --------------------------------------------------------------------------
   Hides every site-level header (desktop + mobile) while a project is open
   so the sticky detail topbar owns the top of the viewport.
   The detail topbar itself is explicitly preserved.
   ========================================================================== */

   var SITE_HEADER_SELECTORS = [
    "header.desktop-header",
    "header.site-header",
    "header.main-header",
    ".mobile-header",
    "header:not(.detail-topbar):not(.topbar):not(.top-bar):not(.top-bar-header)"
  ];
  
  var PROJECT_TOPBAR_SELECTORS = [
    ".detail-topbar",
    ".topbar",
    ".top-bar",
    ".top-bar-header"
  ];
  
  function setProjectHeaderState(isProjectOpen) {
    // ---- 1. Site headers: hide when project is open, restore otherwise ----
    var siteHeaders = document.querySelectorAll(SITE_HEADER_SELECTORS.join(","));
  
    siteHeaders.forEach(function (header) {
      // Never hide an actual project topbar if it matched the generic selector.
      if (header.matches(PROJECT_TOPBAR_SELECTORS.join(","))) return;
  
      if (isProjectOpen) {
        header.style.display = "none";
        header.classList.add("project-mode-hidden");
        header.setAttribute("aria-hidden", "true");
      } else {
        header.style.display = "";
        header.classList.remove("project-mode-hidden");
        header.removeAttribute("aria-hidden");
      }
    });
  
    // ---- 2. Detail topbars: always visible ----
    var topbars = document.querySelectorAll(PROJECT_TOPBAR_SELECTORS.join(","));
  
    topbars.forEach(function (topbar) {
      topbar.style.display = "";
      topbar.classList.remove("project-mode-hidden");
      topbar.removeAttribute("aria-hidden");
    });
  
    // ---- 3. Force the page scroll container back to the top when opening ----
    // (Prevents the sticky topbar from being "half scrolled" on entry.)
    if (isProjectOpen) {
      var main = document.getElementById("main-content");
      if (main && typeof main.scrollTo === "function") {
        main.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  }


  /* ==========================================================================
   TOPBAR SCROLL STATE
   --------------------------------------------------------------------------
   Adds .is-scrolled to the active detail topbar once the user scrolls past
   a small threshold. Uses rAF throttling — cheap on mobile.
   ========================================================================== */

var topbarScrollTick = false;

function updateTopbarScrollState() {
  topbarScrollTick = false;

  var activeDetail = document.querySelector(".project-detail.is-active");
  if (!activeDetail) return;

  var topbar = activeDetail.querySelector(".detail-topbar");
  if (!topbar) return;

  var y = window.pageYOffset ||
          document.documentElement.scrollTop ||
          0;

  topbar.classList.toggle("is-scrolled", y > 8);
}

function onWindowScroll() {
  if (topbarScrollTick) return;
  topbarScrollTick = true;
  requestAnimationFrame(updateTopbarScrollState);
}

function bindTopbarScrollState() {
  window.addEventListener("scroll", onWindowScroll, { passive: true });
  // Also update whenever a project opens (showProject toggles classes).
  document.addEventListener("project:shown", updateTopbarScrollState);
  document.addEventListener("project:hidden", function () {
    var t = document.querySelector(".detail-topbar.is-scrolled");
    if (t) t.classList.remove("is-scrolled");
  });
}

bindTopbarScrollState();
  
  
    /* ==========================================================================
       06. SHOW PROJECT
       --------------------------------------------------------------------------
       Hide all direct children of #main-content and reveal the target
       .project-detail. Update the "next project" button and URL.
       ========================================================================== */
  
    function showProject(id, pushState) {
      if (pushState === undefined) pushState = true;
  
      var mainContent = document.getElementById("main-content");
      if (!mainContent) return;
  
      // 1. Header → project mode
      setProjectHeaderState(true);
  
      // 2. Hide every direct child
      Array.from(mainContent.children).forEach(function (child) {
        child.style.display = "none";
      });
  
      // 3. Show target project
      var target = document.getElementById(id);
  
      if (target) {
        target.style.display = "block";
        target.classList.add("is-active");
  
        // 4. Update "next project" link
        var nextBtn = target.querySelector(".next-project");
  
        if (nextBtn) {
          var nextId = getNextProjectId(id);
          var nextTitle =
            PROJECT_META[nextId] && PROJECT_META[nextId].title
              ? PROJECT_META[nextId].title
              : "Next project";
  
          nextBtn.setAttribute("href", "#");
  
          // Update only the first text node (keeps the icon span intact)
          var textNode = nextBtn.childNodes[0];
          if (textNode && textNode.nodeType === 3) {
            textNode.textContent = "Next: " + nextTitle;
          }
  
          nextBtn.onclick = function (e) {
            e.preventDefault();
            showProject(nextId);
          };
        }
      }
  
      // 5. Scroll to top
      window.scrollTo({ top: 0, behavior: "instant" });
  
      // 6. Update URL
      if (pushState) {
        history.pushState({ project: id }, "", "#" + id);
      }
    }
    
  
  
    /* ==========================================================================
       07. CLOSE PROJECT
       --------------------------------------------------------------------------
       Restore the site: show all main sections, hide project details,
       restore the header.
       ========================================================================== */
  
    function closeProject(pushState) {
      if (pushState === undefined) pushState = true;
  
      var mainContent = document.getElementById("main-content");
      if (!mainContent) return;
  
      // 1. Restore header
      setProjectHeaderState(false);
  
      // 2. Restore main content
      Array.from(mainContent.children).forEach(function (child) {
        if (child.classList && child.classList.contains("project-detail")) {
          child.style.display = "none";
          child.classList.remove("is-active");
        } else {
          child.style.display = "";
        }
      });
  
      // 3. Reset URL
      if (pushState) {
        history.pushState(
          { project: null },
          "",
          window.location.pathname
        );
      }
    }
  
  
    /* ==========================================================================
       08. CLOSE PROJECT + SCROLL TO #PROJECTS
       ========================================================================== */
  
    function closeProjectAndScroll() {
      closeProject(true);
  
      setTimeout(function () {
        var target = document.getElementById("projects");
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      }, 150);
  
      return false;
    }
  
  
    /* ==========================================================================
       09. BROWSER BACK / FORWARD
       ========================================================================== */
  
    window.addEventListener("popstate", function (e) {
      var projectId = e.state && e.state.project;
  
      if (projectId) {
        showProject(projectId, false);
      } else {
        closeProject(false);
      }
    });
  
  
    /* ==========================================================================
       10. INITIAL PAGE LOAD
       --------------------------------------------------------------------------
       Hide all project detail pages on startup, then check the URL hash to
       decide whether to open a project directly.
       ========================================================================== */
  
    document.addEventListener("DOMContentLoaded", function () {
      // Hide all project details
      document.querySelectorAll(".project-detail").forEach(function (el) {
        el.style.display = "none";
        el.classList.remove("is-active");
      });
  
      // Make sure site header is visible on load
      setProjectHeaderState(false);
  
      var hashId = window.location.hash
        ? window.location.hash.substring(1)
        : null;
  
      if (
        hashId &&
        document.getElementById(hashId) &&
        document.getElementById(hashId).classList.contains("project-detail")
      ) {
        // Direct link to a project
        showProject(hashId, false);
  
        history.replaceState(
          { project: hashId },
          "",
          "#" + hashId
        );
      } else {
        // Normal portfolio mode
        closeProject(false);
  
        history.replaceState(
          { project: null },
          "",
          window.location.pathname
        );
      }
    });
  
  
    /* ==========================================================================
       11. GLOBAL EXPORTS
       --------------------------------------------------------------------------
       Expose functions used by inline HTML handlers (onclick="...").
       ========================================================================== */
  
    window.openSidebar = openSidebar;
    window.closeSidebar = closeSidebar;
    window.showProject = showProject;
    window.closeProject = closeProject;
    window.closeProjectAndScroll = closeProjectAndScroll;
  
  })();