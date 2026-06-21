document.documentElement.classList.add("umusare-js");

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

function initUmusareIntro() {
  const intro = document.querySelector("[data-umusare-intro]");
  if (!intro || document.body.dataset.page !== "home") return;

  const storageKey = "umusareIntroSeen";
  const video = intro.querySelector("[data-umusare-intro-video]");
  const skipButton = intro.querySelector("[data-umusare-intro-skip]");
  const prefersReducedMotion = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shouldReplay = window.location.search.includes("intro=1");
  const startedAt = Date.now();
  const minimumVisibleMs = prefersReducedMotion ? 700 : 1800;
  let isClosing = false;
  let fallbackTimer;
  let maxTimer;

  function dispatchIntroComplete() {
    window.setTimeout(function notifyHero() {
      window.dispatchEvent(new CustomEvent("umusare:intro-complete"));
    }, 0);
  }

  function markSeen() {
    try {
      window.sessionStorage.setItem(storageKey, "true");
    } catch (error) {
      // Session storage may be unavailable in private or restricted contexts.
    }
  }

  function unlockPage() {
    document.body.classList.remove("umusare-intro-lock");
  }

  function closeIntro() {
    if (isClosing) return;
    isClosing = true;
    window.clearTimeout(fallbackTimer);
    window.clearTimeout(maxTimer);
    markSeen();
    unlockPage();
    intro.classList.add("is-hidden");
    dispatchIntroComplete();
    window.setTimeout(function removeIntro() {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, prefersReducedMotion ? 180 : 760);
  }

  function completeIntro() {
    const elapsed = Date.now() - startedAt;
    window.setTimeout(closeIntro, Math.max(0, minimumVisibleMs - elapsed));
  }

  function showFallbackThenClose(delay) {
    intro.classList.add("use-fallback");
    fallbackTimer = window.setTimeout(closeIntro, delay);
  }

  function showVideo() {
    intro.classList.add("video-ready");
  }

  try {
    if (!shouldReplay && window.sessionStorage.getItem(storageKey) === "true") {
      intro.remove();
      unlockPage();
      dispatchIntroComplete();
      return;
    }
  } catch (error) {
    // Continue without session persistence if storage is unavailable.
  }

  document.body.classList.add("umusare-intro-lock");
  skipButton?.addEventListener("click", closeIntro);

  if (prefersReducedMotion || !video || !video.canPlayType || !video.canPlayType("video/mp4")) {
    showFallbackThenClose(prefersReducedMotion ? 900 : 1400);
    return;
  }

  video.addEventListener("loadeddata", showVideo, { once: true });
  video.addEventListener("canplay", showVideo, { once: true });
  video.addEventListener("playing", showVideo, { once: true });
  video.addEventListener("ended", completeIntro, { once: true });
  video.addEventListener("error", function () {
    if (window.console && window.console.warn) {
      window.console.warn("Umusare intro video could not be loaded; showing fallback logo.");
    }
    showFallbackThenClose(1400);
  }, { once: true });
  video.addEventListener("stalled", function () {
    showFallbackThenClose(1400);
  }, { once: true });

  maxTimer = window.setTimeout(function introTimeout() {
    if (!isClosing) closeIntro();
  }, 6000);

  const playResult = video.play();
  if (video.readyState >= 2) {
    showVideo();
  }
  if (playResult && typeof playResult.catch === "function") {
    playResult.catch(function () {
      showFallbackThenClose(1400);
    });
  }
}

initUmusareIntro();

function initUmusareHero() {
  const hero = document.querySelector(".u-home-hero");
  if (!hero || document.body.dataset.page !== "home") return;

  const prefersReducedMotion = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasIntro = Boolean(document.querySelector("[data-umusare-intro]"));
  let hasStarted = false;
  let pointerFrame;

  function startHero() {
    if (hasStarted) return;
    hasStarted = true;
    hero.classList.add("is-hero-ready");
  }

  function resetDepth() {
    hero.style.setProperty("--hero-depth-x", "0px");
    hero.style.setProperty("--hero-depth-y", "0px");
  }

  function bindDepthEffect() {
    if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) return;

    hero.addEventListener("pointermove", function handlePointerMove(event) {
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(function updateDepth() {
        pointerFrame = null;
        const bounds = hero.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12;
        hero.style.setProperty("--hero-depth-x", x.toFixed(2) + "px");
        hero.style.setProperty("--hero-depth-y", y.toFixed(2) + "px");
      });
    });

    hero.addEventListener("pointerleave", resetDepth);
  }

  window.addEventListener("umusare:intro-complete", startHero, { once: true });

  if (!hasIntro || !document.body.classList.contains("umusare-intro-lock")) {
    window.setTimeout(startHero, 80);
  }

  window.addEventListener("scroll", function handleHeroScroll() {
    document.body.classList.toggle("hero-has-scrolled", window.scrollY > 40);
  }, { passive: true });

  bindDepthEffect();
}

initUmusareHero();

const revealTargets = document.querySelectorAll(
  ".hero-content, .hero-visual, .editorial-section, .page-intro, .driver-card, .form-panel, .profile-header, .profile-panel, .admin-section, .quick-book-shell"
);

const navToggle = document.querySelector("[data-nav-toggle]");
const navPanel = document.querySelector("[data-nav-panel]");

if (navToggle && navPanel) {
  navToggle.addEventListener("click", function () {
    const isOpen = navPanel.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navPanel.addEventListener("click", function (event) {
    if (event.target.closest("a")) {
      navPanel.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
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
