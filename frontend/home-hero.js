import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

function getMotionPreference() {
  const parameters = new URLSearchParams(window.location.search);
  const override = parameters.get("motion");

  if (override === "full") {
    return { reduceMotion: false, forced: true, mode: "full" };
  }

  if (override === "reduce") {
    return { reduceMotion: true, forced: true, mode: "reduce" };
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    reduceMotion,
    forced: false,
    mode: reduceMotion ? "reduce" : "full"
  };
}

function createMotionDebug(motionPreference) {
  const hasMotionOverride = new URLSearchParams(window.location.search).has("motion");
  if (!import.meta.env.DEV && !hasMotionOverride) return null;

  const debug = {
    motionMode: motionPreference.mode,
    forcedMotionMode: motionPreference.forced,
    gsapVersion: gsap.version,
    splitTargets: 0,
    successfulSplits: 0,
    generatedMasks: 0,
    scrollTriggers: 0
  };

  window.__UMUSARE_MOTION_DEBUG__ = debug;
  return {
    debug,
    splitTargets: new Set(),
    successfulSplits: new Set()
  };
}

function updateMotionDebug(debugState, motionPreference) {
  if (!debugState) return;

  debugState.debug.motionMode = motionPreference.mode;
  debugState.debug.forcedMotionMode = motionPreference.forced;
  debugState.debug.gsapVersion = gsap.version;
  debugState.debug.splitTargets = debugState.splitTargets.size;
  debugState.debug.successfulSplits = debugState.successfulSplits.size;
  debugState.debug.generatedMasks = document.querySelectorAll("body.u-home-page .mask-line-mask, body.u-home-page .mask-word-mask").length;
  debugState.debug.scrollTriggers = ScrollTrigger.getAll().length;
  document.documentElement.dataset.umusareMotionDebug = JSON.stringify(debugState.debug);
}

function registerSplitResult(debugState, element, split, mode, motionPreference) {
  if (!debugState || !element) return;

  const parts = mode === "words" ? split.words : split.lines;
  debugState.splitTargets.add(element);

  if (split.isSplit && parts.length > 0 && split.masks && split.masks.length > 0) {
    debugState.successfulSplits.add(element);
  }

  updateMotionDebug(debugState, motionPreference);
}

function addPreparedAnimation(timeline, animation, position) {
  if (!timeline || !animation) return;

  animation.pause(0);
  timeline.add(animation, position);
  animation.paused(false);
}

export function initUmusareHomepageAnimations() {
const hero = document.querySelector("[data-cinematic-hero]");
const motionPreference = getMotionPreference();
const motionDebug = createMotionDebug(motionPreference);

document.body.classList.toggle("u-motion-full", motionPreference.mode === "full" && motionPreference.forced);
document.body.classList.toggle("u-motion-reduce", motionPreference.mode === "reduce" && motionPreference.forced);

if (hero && !window.__UMUSARE_CINEMATIC_HERO__) {
  window.__UMUSARE_CINEMATIC_HERO__ = true;

  const stage = hero.querySelector("[data-cinematic-stage]");
  const scenes = Array.from(hero.querySelectorAll("[data-cinematic-scene]"));
  const currentNumber = hero.querySelector("[data-hero-current]");
  const progressSteps = Array.from(hero.querySelectorAll(".cinematic-hero__progress span"));
  const continuePrompt = hero.querySelector("[data-hero-continue]");
  const media = gsap.matchMedia();
  const splitInstances = [];

  function setActiveScene(index) {
    const nextIndex = Math.max(0, Math.min(index, scenes.length - 1));

    scenes.forEach((scene, sceneIndex) => {
      scene.classList.toggle("is-active", sceneIndex === nextIndex);
    });

    if (currentNumber) {
      currentNumber.textContent = String(nextIndex + 1).padStart(2, "0");
    }

    progressSteps.forEach((step, stepIndex) => {
      step.classList.toggle("is-active", stepIndex <= nextIndex);
    });

    window.dispatchEvent(new CustomEvent("umusare:hero-scene", {
      detail: { index: nextIndex, total: scenes.length }
    }));
  }

  function createMaskedSplit(element, mode = "lines") {
    const isWordMode = mode === "words";
    let targets = [];

    try {
      const split = SplitText.create(element, {
        type: isWordMode ? "words" : "lines",
        mask: isWordMode ? "words" : "lines",
        autoSplit: false,
        linesClass: "mask-line",
        wordsClass: "mask-word",
        onSplit(self) {
          targets.splice(0, targets.length, ...(isWordMode ? self.words : self.lines));
          if (targets.length) {
            gsap.set(targets, {
              yPercent: isWordMode ? 110 : 115,
              autoAlpha: 0
            });
          }
        }
      });

      targets.splice(0, targets.length, ...(isWordMode ? split.words : split.lines));
      if (targets.length) {
        gsap.set(targets, {
          yPercent: isWordMode ? 110 : 115,
          autoAlpha: 0
        });
      }

      splitInstances.push(split);
      registerSplitResult(motionDebug, element, split, isWordMode ? "words" : "lines", motionPreference);
      return { targets, isWordMode };
    } catch (error) {
      console.warn("Umusare masked headline split failed.", error);
      gsap.set(element, { clearProps: "all" });
      return { targets: [], isWordMode };
    }
  }

  function getSceneParts(scene) {
    const content = scene.querySelector("[data-scene-content]");
    const headline = scene.querySelector("[data-hero-headline]");
    const image = scene.querySelector(".cinematic-hero__image");
    const bodyItems = [
      ...(content
        ? Array.from(content.querySelectorAll(".cinematic-hero__eyebrow, .cinematic-hero__support-line, .cinematic-hero__copy"))
        : []),
      ...Array.from(scene.querySelectorAll("[data-scene-actions], [data-scene-content] .cinematic-hero__actions"))
    ];
    return { content, headline, image, bodyItems };
  }

  function prepareScene(scene) {
    const { headline, bodyItems } = getSceneParts(scene);
    const headlineSplit = headline ? createMaskedSplit(headline, headline.dataset.maskReveal || "lines") : { targets: [], isWordMode: false };
    if (bodyItems.length) {
      gsap.set(bodyItems, { y: 22, autoAlpha: 0 });
    }
    return { headlineTargets: headlineSplit.targets, isWordMode: headlineSplit.isWordMode, bodyItems };
  }

  function revealHeroHeadline(timeline, prepared, at) {
    if (!prepared.headlineTargets.length) return;

    timeline.fromTo(
      prepared.headlineTargets,
      {
        yPercent: prepared.isWordMode ? 110 : 115,
        autoAlpha: 0
      },
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: prepared.isWordMode ? 0.65 : 0.9,
        stagger: prepared.isWordMode ? 0.055 : 0.09,
        ease: prepared.isWordMode ? "power3.out" : "power4.out",
        overwrite: "auto"
      },
      at
    );
  }

  function revealScene(timeline, scene, prepared, at) {
    const { image } = getSceneParts(scene);

    timeline.to(scene, { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.62, ease: "none" }, at);
    if (image) {
      timeline.fromTo(image, { scale: 1.06 }, { scale: 1, duration: 0.9, ease: "none" }, at);
    }
    revealHeroHeadline(timeline, prepared, at + 0.12);
    if (prepared.bodyItems.length) {
      timeline.to(prepared.bodyItems, {
        y: 0,
        autoAlpha: 1,
        duration: 0.34,
        stagger: 0.012,
        ease: "none"
      }, at + 0.22);
    }
  }

  function exitScene(timeline, scene, at) {
    const { content, image } = getSceneParts(scene);

    if (content) {
      timeline.to(content, { y: -20, autoAlpha: 0, duration: 0.36, ease: "none" }, at);
    }
    if (image) {
      timeline.to(image, { scale: 1.035, duration: 0.62, ease: "none" }, at);
    }
    timeline.to(scene, { autoAlpha: 0, clipPath: "inset(0% 0% 100% 0%)", duration: 0.58, ease: "none" }, at + 0.2);
  }

  function clearSplits() {
    splitInstances.splice(0).forEach((split) => split.revert());
  }

  async function init() {
    if (!stage || scenes.length !== 4) return;

    await (document.fonts?.ready || Promise.resolve());

    if (!motionPreference.reduceMotion) {
    media.add("(min-width: 769px)", () => {
      hero.classList.add("is-animated");
      setActiveScene(0);

      const preparedScenes = scenes.map(prepareScene);
      const sceneImages = scenes.map((scene) => scene.querySelector(".cinematic-hero__image"));

      gsap.set(scenes, { autoAlpha: 0, clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(scenes[0], { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(sceneImages.filter(Boolean), { scale: 1.06 });
      if (sceneImages[0]) {
        gsap.set(sceneImages[0], { scale: 1 });
      }
      if (continuePrompt) {
        gsap.set(continuePrompt, { autoAlpha: 0, y: 12 });
      }

      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      revealHeroHeadline(intro, preparedScenes[0], 0.15);
      if (preparedScenes[0].bodyItems.length) {
        intro.to(preparedScenes[0].bodyItems, {
            y: 0,
            autoAlpha: 1,
            duration: 0.58,
            stagger: 0.035
          }, 0.65);
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "+=360%",
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setActiveScene(Math.round(self.progress * (scenes.length - 1)));
            if (continuePrompt) {
              gsap.to(continuePrompt, {
                autoAlpha: self.progress > 0.92 ? 1 : 0,
                y: self.progress > 0.92 ? 0 : 12,
                duration: 0.18,
                overwrite: true
              });
            }
          }
        }
      });

      scenes.slice(1).forEach((scene, index) => {
        const previousScene = scenes[index];
        const position = index + 0.72;
        exitScene(timeline, previousScene, position);
        revealScene(timeline, scene, preparedScenes[index + 1], position + 0.12);
        timeline.to({}, { duration: 0.32 });
      });

      sceneImages.forEach((image) => {
        if (image.complete) return;
        image.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
      });

      ScrollTrigger.refresh(true);
      updateMotionDebug(motionDebug, motionPreference);

      return () => {
        intro.kill();
        timeline.scrollTrigger?.kill();
        timeline.kill();
        clearSplits();
        hero.classList.remove("is-animated");
        gsap.set([...scenes, ...sceneImages.filter(Boolean), continuePrompt].filter(Boolean), { clearProps: "all" });
      };
    });
    }

    media.add(motionPreference.reduceMotion ? "all" : "(max-width: 768px)", () => {
      hero.classList.remove("is-animated");
      setActiveScene(0);
      updateMotionDebug(motionDebug, motionPreference);

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.sceneIndex || 0);
            setActiveScene(index);
          }
        });
      }, { threshold: 0.5 });

      scenes.forEach((scene) => observer.observe(scene));

      return () => observer.disconnect();
    });
  }

  init().catch((error) => {
    console.warn("Umusare cinematic hero failed to initialize.", error);
    hero.classList.remove("is-animated");
    setActiveScene(0);
    clearSplits();
  });
}

const revealGroups = Array.from(document.querySelectorAll("body.u-home-page [data-reveal-group]"));

if (revealGroups.length && !window.__UMUSARE_HOMEPAGE_REVEALS__) {
  window.__UMUSARE_HOMEPAGE_REVEALS__ = true;

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealSplits = [];
  const revealTimelines = [];
  let resizeTimer = 0;

  function createMaskedRevealAnimation(element, mode, presets) {
    const isWordMode = mode === "words" || mode === "heading-words";
    const preset = isWordMode ? presets.word : presets.line;
    const direction = element.dataset.maskDirection || "up";
    let animation = null;

    try {
      const split = SplitText.create(element, {
        type: isWordMode ? "words" : "lines",
        mask: isWordMode ? "words" : "lines",
        autoSplit: true,
        linesClass: "mask-line",
        wordsClass: "mask-word",
        onSplit(self) {
          const targets = isWordMode ? self.words : self.lines;
          const fromVars = {
            yPercent: preset.yPercent,
            autoAlpha: 0
          };
          const toVars = {
            yPercent: 0,
            autoAlpha: 1,
            duration: preset.duration,
            stagger: preset.stagger,
            ease: preset.ease,
            paused: true,
            overwrite: "auto"
          };

          if (isWordMode && direction === "left") {
            fromVars.x = -18;
            toVars.x = 0;
          } else if (isWordMode && direction === "right") {
            fromVars.x = 18;
            toVars.x = 0;
          }

          animation = gsap.fromTo(targets, fromVars, toVars);
          return animation;
        }
      });

      revealSplits.push(split);
      registerSplitResult(motionDebug, element, split, isWordMode ? "words" : "lines", motionPreference);
      return animation;
    } catch (error) {
      console.warn("Umusare masked section split failed.", error);
      gsap.set(element, { clearProps: "all" });
      return null;
    }
  }

  function revealTargetsFor(element) {
    if (element.matches("[data-reveal='cta']")) {
      const children = Array.from(element.children).filter((child) => child.matches("a, button") && !child.matches("[data-mask-reveal]"));
      return children.length ? children : [element];
    }

    return [element];
  }

  function clearHomepageReveals() {
    window.clearTimeout(resizeTimer);
    revealTimelines.splice(0).forEach((timeline) => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    });
    revealSplits.splice(0).forEach((split) => split.revert());

    revealGroups.forEach((group) => {
      gsap.set(group.querySelectorAll("[data-reveal], [data-mask-reveal], [data-reveal='cta'] > a, [data-reveal='cta'] > button"), { clearProps: "all" });
      group.classList.remove("is-reveal-ready");
    });
  }

  function buildHomepageReveals() {
    clearHomepageReveals();

    const currentMotionPreference = motionPreference.forced ? motionPreference : getMotionPreference();
    updateMotionDebug(motionDebug, currentMotionPreference);

    if (currentMotionPreference.reduceMotion) {
      ScrollTrigger.refresh(true);
      updateMotionDebug(motionDebug, currentMotionPreference);
      return;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const linePreset = {
      yPercent: isMobile ? 55 : 110,
      duration: isMobile ? 0.55 : 0.85,
      stagger: isMobile ? 0.05 : 0.09,
      ease: "power4.out"
    };
    const wordPreset = {
      yPercent: isMobile ? 50 : 90,
      duration: isMobile ? 0.5 : 0.7,
      stagger: isMobile ? 0.032 : 0.045,
      ease: "power3.out"
    };

    revealGroups.forEach((group) => {
      const eyebrows = Array.from(group.querySelectorAll("[data-reveal='eyebrow']"));
      const maskedText = Array.from(group.querySelectorAll("[data-mask-reveal]"))
        .filter((element) => element.dataset.maskTrigger !== "timeline");
      const legacyHeadings = Array.from(group.querySelectorAll("[data-reveal='heading-lines'], [data-reveal='heading-words']"));
      const copy = Array.from(group.querySelectorAll("[data-reveal='copy']")).flatMap(revealTargetsFor);
      const ctas = Array.from(group.querySelectorAll("[data-reveal='cta']")).flatMap(revealTargetsFor);
      const maskedAnimations = [];

      [...maskedText, ...legacyHeadings].forEach((element) => {
        const mode = element.dataset.maskReveal || (element.dataset.reveal === "heading-words" ? "words" : "lines");
        const animation = createMaskedRevealAnimation(element, mode, {
          line: linePreset,
          word: wordPreset
        });

        if (animation) {
          maskedAnimations.push(animation);
        }
      });

      gsap.set(eyebrows, { y: isMobile ? 8 : 12, autoAlpha: 0 });
      gsap.set(copy, { y: isMobile ? 14 : 20, autoAlpha: 0 });
      gsap.set(ctas, { y: isMobile ? 10 : 12, autoAlpha: 0 });

      group.classList.add("is-reveal-ready");

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: group,
          start: isMobile ? "top 86%" : "top 78%",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
          fastScrollEnd: true
        }
      });

      if (eyebrows.length) {
        timeline.to(eyebrows, {
          y: 0,
          autoAlpha: 1,
          duration: isMobile ? 0.42 : 0.52,
          ease: "power3.out"
        }, 0);
      }

      maskedAnimations.forEach((animation, index) => {
        addPreparedAnimation(timeline, animation, index ? 0.2 + (index * 0.06) : 0.12);
      });

      if (copy.length) {
        timeline.to(copy, {
          y: 0,
          autoAlpha: 1,
          duration: isMobile ? 0.5 : 0.65,
          ease: "power3.out",
          stagger: 0.04
        }, 0.3);
      }

      if (ctas.length) {
        timeline.to(ctas, {
          y: 0,
          autoAlpha: 1,
          duration: isMobile ? 0.42 : 0.5,
          ease: "power3.out",
          stagger: 0.055
        }, copy.length ? 0.5 : 0.42);
      }

      revealTimelines.push(timeline);
    });

    ScrollTrigger.refresh(true);
    updateMotionDebug(motionDebug, currentMotionPreference);
  }

  async function initHomepageReveals() {
    await (document.fonts?.ready || Promise.resolve());
    buildHomepageReveals();
  }

  window.addEventListener("resize", () => {
    if ((motionPreference.forced ? motionPreference : getMotionPreference()).reduceMotion) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildHomepageReveals, 180);
  }, { passive: true });

  if (!motionPreference.forced && reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener("change", buildHomepageReveals);
  } else if (!motionPreference.forced && reduceMotionQuery.addListener) {
    reduceMotionQuery.addListener(buildHomepageReveals);
  }

  initHomepageReveals().catch((error) => {
    console.warn("Umusare homepage text reveals failed to initialize.", error);
    clearHomepageReveals();
  });
}

const progressIndicator = document.querySelector("[data-home-progress]");
const progressSections = Array.from(document.querySelectorAll("body.u-home-page [data-progress-section]"));

if (progressIndicator && progressSections.length && !window.__UMUSARE_HOME_PROGRESS__) {
  window.__UMUSARE_HOME_PROGRESS__ = true;

  const progressNumber = progressIndicator.querySelector("[data-progress-number]");
  const progressLabel = progressIndicator.querySelector("[data-progress-active-label]");
  const progressTotal = progressSections.length;
  const progressTriggers = [];
  let activeProgressIndex = -1;
  let activeProgressLabel = "";
  let activeProgressTheme = "";

  document.body.classList.add("progress-enhanced");

  function formatSectionNumber(index) {
    return `${String(index + 1).padStart(2, "0")} / ${String(progressTotal).padStart(2, "0")}`;
  }

  function currentHeroSceneLabel() {
    const current = document.querySelector("[data-hero-current]")?.textContent?.trim() || "01";
    return `Hero · ${Number(current) || 1} / 4`;
  }

  function labelForSection(section) {
    if (section.matches("[data-cinematic-hero]")) {
      return currentHeroSceneLabel();
    }

    return section.dataset.progressLabel || section.getAttribute("aria-label") || "Section";
  }

  function applyProgressTheme(theme) {
    if (theme === activeProgressTheme) return;

    activeProgressTheme = theme;
    progressIndicator.classList.toggle("is-dark", theme === "dark");
    progressIndicator.classList.toggle("is-light", theme !== "dark");
  }

  function writeProgressText(index, label, immediate = false) {
    const number = formatSectionNumber(index);

    if (number === progressNumber?.textContent && label === activeProgressLabel) return;
    activeProgressLabel = label;

    if (immediate || motionPreference.reduceMotion || !progressNumber || !progressLabel) {
      if (progressNumber) progressNumber.textContent = number;
      if (progressLabel) progressLabel.textContent = label;
      return;
    }

    gsap.to([progressNumber, progressLabel], {
      y: -7,
      autoAlpha: 0,
      duration: 0.16,
      ease: "power3.out",
      overwrite: "auto",
      onComplete: () => {
        progressNumber.textContent = number;
        progressLabel.textContent = label;
        gsap.fromTo(
          [progressNumber, progressLabel],
          { y: 7, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.2, ease: "power3.out", overwrite: "auto" }
        );
      }
    });
  }

  function setActiveProgressSection(index, immediate = false) {
    const nextIndex = Math.max(0, Math.min(index, progressSections.length - 1));
    const section = progressSections[nextIndex];
    const label = labelForSection(section);

    activeProgressIndex = nextIndex;
    applyProgressTheme(section.dataset.progressTheme || "light");
    writeProgressText(nextIndex, label, immediate);
  }

  function refreshHeroProgressLabel() {
    if (activeProgressIndex !== 0) return;
    writeProgressText(0, currentHeroSceneLabel(), true);
  }

  function updateOverallProgress(self) {
    progressIndicator.style.setProperty("--page-progress", String(gsap.utils.clamp(0, 1, self.progress || 0)));
    refreshHeroProgressLabel();
  }

  function detectCurrentProgressSection() {
    const viewportMiddle = window.innerHeight * 0.5;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    progressSections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      const sectionMiddle = rect.top + rect.height * 0.5;
      const distance = Math.abs(sectionMiddle - viewportMiddle);

      if (rect.top <= viewportMiddle && rect.bottom >= viewportMiddle) {
        closestIndex = index;
        closestDistance = -1;
        return;
      }

      if (closestDistance >= 0 && distance < closestDistance) {
        closestIndex = index;
        closestDistance = distance;
      }
    });

    setActiveProgressSection(closestIndex, true);
  }

  progressTriggers.push(ScrollTrigger.create({
    start: 0,
    end: () => ScrollTrigger.maxScroll(window),
    invalidateOnRefresh: true,
    onUpdate: updateOverallProgress,
    onRefresh: (self) => {
      updateOverallProgress(self);
      detectCurrentProgressSection();
    }
  }));

  progressSections.forEach((section, index) => {
    progressTriggers.push(ScrollTrigger.create({
      trigger: section,
      start: "top 55%",
      end: "bottom 45%",
      invalidateOnRefresh: true,
      onEnter: () => setActiveProgressSection(index),
      onEnterBack: () => setActiveProgressSection(index)
    }));
  });

  window.addEventListener("umusare:hero-scene", refreshHeroProgressLabel, { passive: true });
  setActiveProgressSection(0, true);
  updateMotionDebug(motionDebug, motionPreference);
  window.addEventListener("resize", detectCurrentProgressSection, { passive: true });
}

}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUmusareHomepageAnimations, { once: true });
} else {
  initUmusareHomepageAnimations();
}
