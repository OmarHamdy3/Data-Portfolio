/* ============================================================================
   OMAR HAMDY — PORTFOLIO
   project-detail.js
   ----------------------------------------------------------------------------
   1. Video chapters   — click a chapter to seek the video; active chapter
                         highlights while the video plays.
   2. Fullscreen modal — "Full Size" button opens the dashboard image.

   Everything uses event delegation, so it works no matter when the project
   detail page is rendered. Paste this before </body> (or inside your existing
   <script>). If you already have old code that handles
   .dashboard-fullscreen-btn, remove it — this file replaces it.
   ========================================================================= */
   (function () {
    "use strict";
  
    /* ------------------------------------------------------------------ */
    /* 1. VIDEO CHAPTERS                                                  */
    /* ------------------------------------------------------------------ */
  
    function toSeconds(text) {
      var parts = String(text).trim().split(":").map(Number);
      if (!parts.length || parts.some(isNaN)) return null;
      return parts.reduce(function (acc, n) { return acc * 60 + n; }, 0);
    }
  
    function chapterTime(line) {
      if (line.dataset.time) return toSeconds(line.dataset.time);
      var ts = line.querySelector(".ts");
      return ts ? toSeconds(ts.textContent) : null;
    }
  
    function findVideo(from) {
      var scope = from.closest(".project-detail") || document;
      return scope.querySelector(".video-container video") || scope.querySelector("video");
    }
  
    function makeAccessible(root) {
      (root || document).querySelectorAll(".chapter-line").forEach(function (line) {
        if (!line.hasAttribute("tabindex")) line.setAttribute("tabindex", "0");
        if (!line.hasAttribute("role")) line.setAttribute("role", "button");
      });
    }
  
    function seekTo(line) {
      var video = findVideo(line);
      var time = chapterTime(line);
      if (!video || time === null) return;
  
      video.currentTime = time;
      var played = video.play();
      if (played && played.catch) played.catch(function () {});
  
      var rect = video.getBoundingClientRect();
      var visible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!visible) video.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  
    function highlight(video) {
      var scope = video.closest(".project-detail") || document;
      var lines = Array.prototype.slice.call(scope.querySelectorAll(".chapter-line"));
      var now = video.currentTime + 0.25;
      var active = null;
  
      lines.forEach(function (line) {
        var t = chapterTime(line);
        if (t !== null && t <= now) active = line;
      });
  
      lines.forEach(function (line) {
        var on = line === active;
        line.classList.toggle("is-active", on);
        if (on) line.setAttribute("aria-current", "true");
        else line.removeAttribute("aria-current");
      });
    }
  
    document.addEventListener("click", function (e) {
      var line = e.target.closest(".chapter-line");
      if (line) seekTo(line);
    });
  
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var line = e.target.closest && e.target.closest(".chapter-line");
      if (!line) return;
      e.preventDefault();
      seekTo(line);
    });
  
    // media events do not bubble, so listen in the capture phase
    ["timeupdate", "seeked", "loadedmetadata"].forEach(function (type) {
      document.addEventListener(type, function (e) {
        if (e.target instanceof HTMLVideoElement) highlight(e.target);
      }, true);
    });
  
    // make chapters focusable, including ones rendered later
    makeAccessible();
    new MutationObserver(function () { makeAccessible(); })
      .observe(document.body, { childList: true, subtree: true });
  
  
    /* ------------------------------------------------------------------ */
    /* 2. FULLSCREEN DASHBOARD MODAL                                      */
    /* ------------------------------------------------------------------ */
  
    var lastTrigger = null;
  
    function getModal() {
      var modal = document.querySelector(".fullscreen-modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.className = "fullscreen-modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML =
          '<div class="modal-content">' +
          '<button type="button" class="close-modal" aria-label="Close">&times;</button>' +
          '<h3 id="modalDashboardTitle"></h3>' +
          '<div class="modal-dashboard-container"><img alt="" />' +
          '<p id="modalDashboardDescription"></p></div></div>';
        document.body.appendChild(modal);
      }
      // move to <body> so no transformed ancestor can trap position:fixed
      if (modal.parentElement !== document.body) document.body.appendChild(modal);
      return modal;
    }
  
    function openModal(button) {
      var card = button.closest(".dashboard-card");
      if (!card) return;
  
      var modal = getModal();
      var cardImg = card.querySelector(".dashboard-image img");
      var title = card.querySelector(".dashboard-content h4");
      var desc = card.querySelector(".dashboard-content p");
  
      var img = modal.querySelector(".modal-dashboard-container img");
      if (!img) {
        img = document.createElement("img");
        var box = modal.querySelector(".modal-dashboard-container") || modal.querySelector(".modal-content");
        box.insertBefore(img, box.firstChild);
      }
  
      if (cardImg) {
        img.src = button.dataset.full || cardImg.currentSrc || cardImg.src;
        img.alt = cardImg.alt || (title ? title.textContent : "Dashboard");
      }
  
      var titleEl = modal.querySelector("#modalDashboardTitle");
      var descEl = modal.querySelector("#modalDashboardDescription");
      if (titleEl && title) titleEl.textContent = title.textContent;
      if (descEl) descEl.textContent = desc ? desc.textContent : "";
  
      lastTrigger = button;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("pd-modal-open");
  
      var close = modal.querySelector(".close-modal");
      if (close) close.focus();
    }
  
    function closeModal() {
      var modal = document.querySelector(".fullscreen-modal");
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("pd-modal-open");
      if (lastTrigger) lastTrigger.focus();
    }
  
    // capture phase + stopImmediatePropagation: replaces any older broken handler
    document.addEventListener("click", function (e) {
      var open = e.target.closest(".dashboard-fullscreen-btn");
      if (open) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openModal(open);
        return;
      }
  
      var modal = document.querySelector(".fullscreen-modal.is-open");
      if (!modal) return;
      if (e.target.closest(".close-modal") || e.target === modal) {
        e.preventDefault();
        closeModal();
      }
    }, true);
  
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  })();