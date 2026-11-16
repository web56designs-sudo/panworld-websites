/* ==========================================================================
   Panworld Nigeria — Unified Client Script
   Handles desktop dropdown, mobile drawer, active states, tracking prefill,
   and FormSubmit AJAX background inquiry submission with Client Summary Docket.
   ========================================================================== */

(function () {
  "use strict";

  const FORMSUBMIT_ENDPOINT = "https://formsubmit.co/ajax/panworld99@yahoo.co.uk";

  // ------------------------------------------------------------------------
  // 1. Active Navigation Highlighting
  // ------------------------------------------------------------------------
  function markActiveNavigation() {
    const rawPath = window.location.pathname.split("/").pop() || "index.html";
    const currentFile = rawPath === "" ? "index.html" : rawPath.toLowerCase();

    const servicePages = new Set([
      "air-freight.html",
      "sea-freight.html",
      "road-transport.html",
      "warehousing.html",
      "tracking.html",
      "import-finance.html",
      "customs-clearance.html",
    ]);

    document.querySelectorAll("[data-nav-file]").forEach(function (el) {
      const target = (el.getAttribute("data-nav-file") || "").toLowerCase();
      if (target === currentFile) {
        el.classList.add("is-active");
        el.setAttribute("aria-current", "page");
      }
    });

    const servicesTrigger = document.querySelector("[data-services-trigger]");
    if (servicesTrigger && servicePages.has(currentFile)) {
      servicesTrigger.classList.add("is-active");
    }
  }

  // ------------------------------------------------------------------------
  // 2. Desktop Services Dropdown
  // ------------------------------------------------------------------------
  function initDesktopDropdown() {
    const trigger = document.querySelector("[data-services-trigger]");
    const menu = document.querySelector("[data-services-menu]");
    if (!trigger || !menu) return;

    function setOpen(open) {
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      menu.classList.toggle("is-open", open);
    }

    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      setOpen(!isOpen);
    });

    document.addEventListener("click", function (event) {
      if (!menu.contains(event.target) && !trigger.contains(event.target)) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    });
  }

  // ------------------------------------------------------------------------
  // 3. Mobile Drawer Navigation
  // ------------------------------------------------------------------------
  function initMobileDrawer() {
    const openBtn = document.querySelector("[data-drawer-open]");
    const closeBtn = document.querySelector("[data-drawer-close]");
    const drawer = document.getElementById("mobile-drawer");
    const backdrop = document.getElementById("mobile-drawer-backdrop");
    if (!openBtn || !drawer || !backdrop) return;

    function openDrawer() {
      drawer.classList.add("is-open");
      backdrop.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      openBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      if (closeBtn) closeBtn.focus();
    }

    function closeDrawer(restoreFocus) {
      drawer.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      openBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      if (restoreFocus !== false) {
        openBtn.focus();
      }
    }

    openBtn.addEventListener("click", openDrawer);
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeDrawer(true);
      });
    }
    backdrop.addEventListener("click", function () {
      closeDrawer(true);
    });

    drawer.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function () {
        closeDrawer(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawer.classList.contains("is-open")) {
        closeDrawer(true);
      }
    });
  }

  // ------------------------------------------------------------------------
  // 4. FormSubmit AJAX Background Inquiry Submission + Client Summary Docket
  // ------------------------------------------------------------------------
  function buildReferenceCode(serviceCode) {
    const prefix = (serviceCode || "GEN").toUpperCase().slice(0, 3);
    const num = Math.floor(1000 + Math.random() * 9000);
    return "PW-" + prefix + "-" + new Date().getFullYear() + "-" + num;
  }

  function formatTimestamp() {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());
  }

  function initFormSubmitInquiries() {
    const forms = document.querySelectorAll("form[data-formsubmit]");
    forms.forEach(function (form) {
      const cardBody = form.closest(".inquiry-card-body");
      if (!cardBody) return;

      const docketPanel = cardBody.querySelector("[data-docket-panel]");
      const docketList = cardBody.querySelector("[data-docket-list]");
      const docketRef = cardBody.querySelector("[data-docket-ref]");
      const docketTime = cardBody.querySelector("[data-docket-time]");
      const docketStatus = cardBody.querySelector("[data-docket-status]");
      const docketStatusTitle = cardBody.querySelector("[data-docket-status-title]");
      const docketStatusDesc = cardBody.querySelector("[data-docket-status-desc]");
      const resetBtn = cardBody.querySelector("[data-reset-inquiry]");
      const errorBox = form.querySelector("[data-form-error]");
      const submitBtn = form.querySelector('button[type="submit"]');

      function showError(message) {
        if (!errorBox) return;
        errorBox.textContent = message;
        errorBox.classList.add("is-visible");
      }

      function clearError() {
        if (!errorBox) return;
        errorBox.textContent = "";
        errorBox.classList.remove("is-visible");
      }

      function renderDocket(entries, refId) {
        if (!docketPanel || !docketList) return;

        docketList.innerHTML = "";

        entries.forEach(function (item) {
          const row = document.createElement("div");
          row.className = "docket-row";

          const dt = document.createElement("span");
          dt.className = "docket-dt";
          dt.textContent = item.label;

          const dd = document.createElement("span");
          dd.className = "docket-dd";
          dd.textContent = item.value;

          row.appendChild(dt);
          row.appendChild(dd);
          docketList.appendChild(row);
        });

        if (docketRef) docketRef.textContent = refId;
        if (docketTime) docketTime.textContent = formatTimestamp();

        if (docketStatus && docketStatusTitle && docketStatusDesc) {
          docketStatus.classList.remove("is-preview");
          docketStatusTitle.textContent = "Inquiry Received";
          docketStatusDesc.textContent =
            "Our operations desk will respond to your email shortly. Keep this reference docket for your records.";
        }

        form.style.display = "none";
        docketPanel.classList.add("is-visible");
      }

      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearError();

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        const formData = new FormData(form);
        const serviceCode = String(form.getAttribute("data-service-code") || "GEN");
        const refId = buildReferenceCode(serviceCode);

        // Collect readable label/value pairs for the Client Summary Docket
        const summaryEntries = [];
        const controls = form.querySelectorAll("input, select, textarea");
        controls.forEach(function (control) {
          const name = control.getAttribute("name");
          const type = control.getAttribute("type");
          if (!name || type === "hidden" || name === "_honey") return;
          const val = String(control.value || "").trim();
          if (!val) return;
          const label = control.getAttribute("data-label") || name;
          summaryEntries.push({ label: label, value: val });
        });

        const payload = Object.fromEntries(formData.entries());
        payload.docket_reference = refId;

        const originalBtnText = submitBtn ? submitBtn.textContent : "Send Inquiry";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Dispatching Inquiry...";
        }

        try {
          const response = await fetch(FORMSUBMIT_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json().catch(function () {
            return { success: false, message: "Unexpected response from submission service." };
          });

          if (response.ok && (data.success === true || data.success === "true")) {
            renderDocket(summaryEntries, refId);
          } else {
            showError(data.message || "Unable to submit right now. Please verify your details and try again.");
          }
        } catch (_err) {
          showError("Network error while sending inquiry. Please check your connection and try again.");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
        }
      });

      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          form.reset();
          clearError();
          if (docketPanel) docketPanel.classList.remove("is-visible");
          form.style.display = "";
          const firstInput = form.querySelector("input:not([type='hidden']):not([name='_honey']), select");
          if (firstInput) firstInput.focus();
        });
      }
    });
  }

  // ------------------------------------------------------------------------
  // 5. Tracking Form Reference Prefill
  // ------------------------------------------------------------------------
  function initTrackingPrefill() {
    const trackingInput = document.querySelector('input[name="tracking_number"]');
    if (!trackingInput) return;
    const params = new URLSearchParams(window.location.search);
    const initialRef = params.get("ref");
    if (initialRef) {
      trackingInput.value = initialRef.trim();
    }
  }

  // ------------------------------------------------------------------------
  // 6. Smooth Scroll for In-Page Anchor Buttons
  // ------------------------------------------------------------------------
  function initAnchorScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        const href = link.getAttribute("href") || "";
        if (href.length <= 1) return;
        const id = href.slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        const focusable = target.querySelector("input:not([type='hidden']):not([name='_honey']), select, textarea");
        if (focusable) {
          setTimeout(function () {
            focusable.focus({ preventScroll: true });
          }, 350);
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    markActiveNavigation();
    initDesktopDropdown();
    initMobileDrawer();
    initFormSubmitInquiries();
    initTrackingPrefill();
    initAnchorScroll();
  });
})();
