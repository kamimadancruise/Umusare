function getRuntimeFlag(flagName, defaultValue) {
  const directValue = window[flagName];
  const storedValue = window.localStorage ? window.localStorage.getItem(flagName) : null;
  const value = directValue !== undefined && directValue !== null ? directValue : storedValue;
  if (value === undefined || value === null) return defaultValue;
  return String(value) === "true";
}

function getRuntimeEnvironment() {
  const isLocalHost = ["", "localhost", "127.0.0.1"].includes(window.location.hostname)
    || window.location.protocol === "file:";
  return window.VITE_APP_ENV
    || window.UMUSARE_APP_ENV
    || (window.localStorage && (window.localStorage.getItem("VITE_APP_ENV") || window.localStorage.getItem("UMUSARE_APP_ENV")))
    || (window.UmusareApi && window.UmusareApi.APP_ENV)
    || (window.UmusareAdminAuth && window.UmusareAdminAuth.APP_ENV)
    || (isLocalHost ? "development" : "production");
}

function getUmusareMotionMode() {
  const requestedMode = new URLSearchParams(window.location.search).get("motion");
  return requestedMode === "reduce" ? "reduce" : "full";
}

function addTestModeBanner() {
  const environment = getRuntimeEnvironment();
  const hasExplicitTestMode = window.VITE_ENABLE_TEST_MODE !== undefined
    || window.UMUSARE_ENABLE_TEST_MODE !== undefined
    || (window.localStorage && (
      window.localStorage.getItem("VITE_ENABLE_TEST_MODE") !== null
      || window.localStorage.getItem("UMUSARE_ENABLE_TEST_MODE") !== null
    ));
  const isLocalHost = ["", "localhost", "127.0.0.1"].includes(window.location.hostname);
  const apiTestMode = (window.UmusareApi && window.UmusareApi.TEST_MODE_ENABLED)
    || (window.UmusareAdminAuth && window.UmusareAdminAuth.TEST_MODE_ENABLED);
  const testModeEnabled = environment !== "production" && (
    apiTestMode
    || getRuntimeFlag("VITE_ENABLE_TEST_MODE", false)
    || getRuntimeFlag("UMUSARE_ENABLE_TEST_MODE", false)
    || (!hasExplicitTestMode && isLocalHost)
  );

  if (!testModeEnabled || document.querySelector("[data-test-mode-banner]")) return;

  const banner = document.createElement("div");
  banner.className = "test-mode-banner";
  banner.dataset.testModeBanner = "true";
  banner.setAttribute("role", "status");
  banner.textContent = "Test Mode — Umusare is running with test data and dummy payments.";
  document.body.prepend(banner);
}

addTestModeBanner();
window.UmusareAddTestModeBanner = addTestModeBanner;

function isTestModeEnabledForUi() {
  const environment = getRuntimeEnvironment();
  if (environment === "production") return false;
  return Boolean(
    (window.UmusareApi && window.UmusareApi.TEST_MODE_ENABLED)
    || (window.UmusareAdminAuth && window.UmusareAdminAuth.TEST_MODE_ENABLED)
    || getRuntimeFlag("VITE_ENABLE_TEST_MODE", false)
    || getRuntimeFlag("UMUSARE_ENABLE_TEST_MODE", false)
    || (!window.VITE_ENABLE_TEST_MODE && ["", "localhost", "127.0.0.1"].includes(window.location.hostname))
  );
}

function isDemoDataEnabledForUi() {
  const environment = getRuntimeEnvironment();
  if (environment === "production") return false;
  return Boolean(
    (window.UmusareApi && window.UmusareApi.DEMO_DATA_ENABLED)
    || (window.UmusareAdminAuth && window.UmusareAdminAuth.DEMO_DATA_ENABLED)
    || getRuntimeFlag("VITE_ENABLE_DEMO_DATA", false)
    || getRuntimeFlag("UMUSARE_ENABLE_DEMO_DATA", false)
  );
}

function updateDemoAccessVisibility() {
  document.body.classList.toggle("is-test-mode", isTestModeEnabledForUi());
  document.body.classList.toggle("is-demo-data-mode", isDemoDataEnabledForUi());
  document.querySelectorAll(".demo-access").forEach(function (section) {
    section.hidden = !isDemoDataEnabledForUi();
  });
}

updateDemoAccessVisibility();
window.UmusareUpdateDemoAccessVisibility = updateDemoAccessVisibility;

const revealTargets = document.querySelectorAll(
  ".hero-content, .hero-visual, .editorial-section, .page-intro, .driver-card, .form-panel, .profile-header, .profile-panel, .admin-section, .quick-book-shell"
);

const navToggle = document.querySelector("[data-nav-toggle]");
const navPanel = document.querySelector("[data-nav-panel]");

function initPublicNavigation() {
  if (document.body.classList.contains("admin-body")) return;

  const standardHeader = document.querySelector(".site-header");
  const homeHeader = document.querySelector(".u-home-topbar");
  const navRoot = homeHeader || standardHeader;
  const standardToggle = document.querySelector("[data-nav-toggle]");
  const standardPanel = document.querySelector("[data-nav-panel]");
  const homeToggle = document.querySelector("[data-home-menu]");
  const homePanel = document.querySelector("[data-home-nav]");
  const featureToggle = document.querySelector("[data-feature-menu-button]");
  const featurePanel = document.querySelector("[data-feature-menu]");
  const featureBackdrop = document.querySelector("[data-feature-backdrop]");
  const featureIcon = featureToggle ? featureToggle.querySelector("[data-feature-menu-icon]") : null;
  const menuToggle = homeToggle || standardToggle;
  const menuPanel = homePanel || standardPanel;
  const reduceMotion = getUmusareMotionMode() === "reduce";
  let lastScrollY = window.scrollY || 0;
  let ticking = false;
  let isMenuOpen = false;
  let lockedScrollY = 0;

  if (!navRoot) return;

  navRoot.classList.add("public-nav");
  document.body.classList.add("public-nav-enhanced");

  function setActiveLinks() {
    const currentFile = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".nav-link, .u-home-nav-link[href], .u-home-contact, .nav-cta, .nav-login").forEach(function (link) {
      const href = link.getAttribute("href");
      if (!href) return;
      const linkFile = (href.split("#")[0].split("/").pop() || "index.html").toLowerCase();
      const isActive = linkFile === currentFile;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function lockScroll() {
    if (document.body.classList.contains("is-public-menu-open")) return;
    lockedScrollY = window.scrollY || 0;
    document.body.style.position = "fixed";
    document.body.style.top = "-" + lockedScrollY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.classList.add("is-public-menu-open");
  }

  function unlockScroll() {
    if (!document.body.classList.contains("is-public-menu-open")) return;
    document.body.classList.remove("is-public-menu-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, lockedScrollY);
  }

  function setFeatureMenuOpen(nextOpen) {
    if (!featurePanel || !featureToggle) return;
    featurePanel.hidden = !nextOpen;
    featurePanel.classList.toggle("is-open", nextOpen);
    featureToggle.setAttribute("aria-expanded", String(nextOpen));
    if (featureIcon) featureIcon.textContent = nextOpen ? "−" : "+";
    if (featureBackdrop) {
      featureBackdrop.hidden = !nextOpen;
      featureBackdrop.classList.toggle("is-open", nextOpen);
    }
    document.body.classList.toggle("is-feature-panel-open", nextOpen);
    navRoot.classList.remove("is-nav-hidden");
  }

  function closeFeatureMenu() {
    setFeatureMenuOpen(false);
  }

  function setMenuOpen(nextOpen) {
    if (!menuPanel || !menuToggle) return;
    isMenuOpen = nextOpen;
    menuPanel.classList.toggle("is-open", nextOpen);
    menuToggle.classList.toggle("is-open", nextOpen);
    menuToggle.setAttribute("aria-expanded", String(nextOpen));
    navRoot.classList.remove("is-nav-hidden");
    if (nextOpen) {
      lockScroll();
    } else {
      closeFeatureMenu();
      unlockScroll();
      menuToggle.focus({ preventScroll: true });
    }
  }

  function updateScrollState() {
    const currentY = window.scrollY || 0;
    const delta = currentY - lastScrollY;
    const isFocusedInside = navRoot.contains(document.activeElement);
    const isScrolled = currentY > 72;
    const canHide = currentY > Math.max(window.innerHeight * 0.7, 420);

    navRoot.classList.toggle("is-nav-scrolled", isScrolled);
    navRoot.classList.toggle("is-nav-top", !isScrolled);

    if (!isMenuOpen && !isFocusedInside && canHide && delta > 18) {
      navRoot.classList.add("is-nav-hidden");
    } else if (delta < -10 || currentY < 120 || isFocusedInside || isMenuOpen) {
      navRoot.classList.remove("is-nav-hidden");
    }

    lastScrollY = currentY;
    ticking = false;
  }

  function requestScrollState() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollState);
  }

  setActiveLinks();
  updateScrollState();

  window.requestAnimationFrame(function () {
    navRoot.classList.add("is-nav-ready");
    if (!reduceMotion) {
      navRoot.classList.add("is-nav-entered");
    }
  });

  if (menuToggle && menuPanel) {
    menuToggle.addEventListener("click", function () {
      setMenuOpen(!isMenuOpen);
    });

    menuPanel.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setMenuOpen(false);
      }
    });
  }

  if (featureToggle && featurePanel) {
    setFeatureMenuOpen(false);

    featurePanel.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        closeFeatureMenu();
      }
    });
  }

  if (featureBackdrop) {
    featureBackdrop.addEventListener("click", closeFeatureMenu);
  }

  navRoot.addEventListener("focusin", function () {
    navRoot.classList.remove("is-nav-hidden");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (featurePanel && featurePanel.classList.contains("is-open")) {
        closeFeatureMenu();
        featureToggle?.focus({ preventScroll: true });
      } else if (isMenuOpen) {
        setMenuOpen(false);
      }
    }
  });

  window.addEventListener("scroll", requestScrollState, { passive: true });
}

initPublicNavigation();

function initHomepageFeaturePanelController() {
  if (document.body.classList.contains("admin-body")) return;

  const featureToggle = document.querySelector("[data-feature-menu-button]");
  const featurePanel = document.querySelector("[data-feature-menu]");
  const featureBackdrop = document.querySelector("[data-feature-backdrop]");
  const featureIcon = featureToggle ? featureToggle.querySelector("[data-feature-menu-icon]") : null;
  const navRoot = document.querySelector(".u-home-topbar") || document.querySelector(".site-header");

  if (!featureToggle || !featurePanel || featureToggle.dataset.featurePanelBound === "true") return;

  featureToggle.dataset.featurePanelBound = "true";

  function setOpen(nextOpen) {
    featurePanel.hidden = !nextOpen;
    featurePanel.classList.toggle("is-open", nextOpen);
    featureToggle.setAttribute("aria-expanded", String(nextOpen));
    if (featureIcon) featureIcon.textContent = nextOpen ? "−" : "+";
    if (featureBackdrop) {
      featureBackdrop.hidden = !nextOpen;
      featureBackdrop.classList.toggle("is-open", nextOpen);
    }
    document.body.classList.toggle("is-feature-panel-open", nextOpen);
    navRoot?.classList.remove("is-nav-hidden");
  }

  setOpen(false);

  featureToggle.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    setOpen(!featurePanel.classList.contains("is-open"));
  });

  featurePanel.addEventListener("click", function (event) {
    if (event.target.closest("a")) {
      setOpen(false);
    }
  });

  featureBackdrop?.addEventListener("click", function () {
    setOpen(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && featurePanel.classList.contains("is-open")) {
      setOpen(false);
      featureToggle.focus({ preventScroll: true });
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomepageFeaturePanelController, { once: true });
} else {
  initHomepageFeaturePanelController();
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealTargets.forEach(function (target) {
    target.classList.add("reveal");
    revealObserver.observe(target);
  });
} else {
  revealTargets.forEach(function (target) {
    target.classList.add("is-visible");
  });
}

const mobileQuickBook = document.querySelector("[data-mobile-quick-book]");
const mobileQuickBookClose = document.querySelector("[data-mobile-quick-book-close]");

if (mobileQuickBook && sessionStorage.getItem("umusareQuickBookHidden") === "true") {
  mobileQuickBook.classList.add("is-hidden");
}

if (mobileQuickBook && mobileQuickBookClose) {
  mobileQuickBookClose.addEventListener("click", function () {
    mobileQuickBook.classList.add("is-hidden");
    sessionStorage.setItem("umusareQuickBookHidden", "true");
  });
}

const footerLinksGrid = document.querySelector(".footer-links-grid");

if (footerLinksGrid && !footerLinksGrid.querySelector("[data-legal-links]")) {
  const legalSection = document.createElement("section");
  legalSection.className = "footer-section";
  legalSection.dataset.legalLinks = "true";
  legalSection.innerHTML = [
    "<h2>Legal</h2>",
    '<a href="support.html">Support &amp; Emergency Help</a>',
    '<a href="terms.html">Terms &amp; Conditions</a>',
    '<a href="driver-agreement.html">Driver Agreement</a>',
    '<a href="privacy-policy.html">Privacy Policy</a>',
    '<a href="safety-policy.html">Safety Policy</a>',
    '<a href="client-disclaimer.html">Client Disclaimer</a>',
    '<a href="incident-reporting-policy.html">Incident Reporting Policy</a>'
  ].join("");
  footerLinksGrid.appendChild(legalSection);
}

function initPublicFeatureCardLighting() {
  if (document.body.classList.contains("admin-body")) return;

  const canUsePointerLight = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    && getUmusareMotionMode() !== "reduce";
  const featureCards = document.querySelectorAll(".u-home-feature-menu a, .u-home-sticker, .u-home-followup a");

  featureCards.forEach(function (card) {
    card.addEventListener("focusin", function () {
      card.style.setProperty("--pointer-x", "50%");
      card.style.setProperty("--pointer-y", "50%");
      card.classList.add("is-feature-card-lit");
    });

    card.addEventListener("focusout", function () {
      card.classList.remove("is-feature-card-lit");
    });

    if (!canUsePointerLight) return;

    card.addEventListener("pointermove", function (event) {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--pointer-x", x.toFixed(2) + "%");
      card.style.setProperty("--pointer-y", y.toFixed(2) + "%");
      card.classList.add("is-feature-card-lit");
    });

    card.addEventListener("pointerleave", function () {
      card.classList.remove("is-feature-card-lit");
      card.style.setProperty("--pointer-x", "50%");
      card.style.setProperty("--pointer-y", "50%");
    });
  });
}

initPublicFeatureCardLighting();

const demoActionExcludedSelectors = [
  "[data-nav-toggle]",
  "[data-mobile-quick-book-close]",
  "[data-role]",
  "[data-account-option]",
  "[data-plan-choice]",
  "[data-next-step]",
  "[data-prev-step]",
  "[data-choice-value]",
  "[data-home-menu-toggle]",
  "[data-home-features-trigger]",
  "[data-next-status]",
  ".view-booking",
  ".view-driver-booking",
  ".view-admin-booking",
  ".driver-booking-action",
  ".cancel-client-booking",
  ".assign-admin-booking-driver",
  ".update-admin-booking-status",
  ".view-application",
  ".approve-admin-application",
  ".reject-admin-application",
  ".request-info-admin-application",
  ".set-under-review-admin-application",
  ".verify-admin-document",
  ".reject-admin-document",
  ".needs-review-admin-document",
  ".view-admin-document",
  ".toggle-driver-visibility",
  ".suspend-admin-driver",
  ".unsuspend-admin-driver",
  ".open-incident-report",
  ".close-panel",
  "#acceptAgreementButton",
  "#upgradeToProButton",
  "#manageSubscriptionButton",
  "#closeUpgradePanel",
  "#closePaymentPanel",
  "#confirmUpgradeButton",
  "#confirmPaymentButton",
  "#cancelPaymentButton",
  "#adminLogoutButton"
].join(",");

function showDemoActionMessage(message) {
  let status = document.getElementById("demoActionStatus");
  if (!status) {
    status = document.createElement("div");
    status.id = "demoActionStatus";
    status.className = "demo-action-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    document.body.appendChild(status);
  }
  status.textContent = message;
  status.hidden = false;
  window.clearTimeout(showDemoActionMessage.timer);
  showDemoActionMessage.timer = window.setTimeout(function () {
    status.hidden = true;
  }, 2600);
}

document.addEventListener("click", function (event) {
  if (window.UMUSARE_ENABLE_DEMO_ACTIONS !== true) {
    return;
  }
  const button = event.target.closest("button[type='button']");
  if (!button || button.matches(demoActionExcludedSelectors) || button.closest(".mobile-quick-book")) {
    return;
  }
  if (button.dataset.adminAvailabilityFilter || button.id === "useLocationButton") {
    return;
  }
  showDemoActionMessage(button.textContent.trim() + " saved in development demo mode.");
});
