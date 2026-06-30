import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

function getUmusareMotionMode() {
  const parameters = new URLSearchParams(window.location.search);
  const requestedMode = parameters.get("motion");

  if (requestedMode === "reduce") {
    return {
      mode: "reduce",
      fullMotion: false,
      reduceMotion: true,
      developerOverride: true,
      forced: true
    };
  }

  return {
    mode: "full",
    fullMotion: true,
    reduceMotion: false,
    developerOverride: requestedMode === "full",
    forced: requestedMode === "full"
  };
}

function createMotionDebug(motionPreference) {
  const hasMotionOverride = new URLSearchParams(window.location.search).has("motion");
  if (!import.meta.env.DEV && !hasMotionOverride) return null;

  const debug = {
    mode: motionPreference.mode,
    motionMode: motionPreference.mode,
    normalUrlUsesFullMotion: motionPreference.fullMotion,
    osReducedMotionIgnored: true,
    developerOverride: motionPreference.developerOverride,
    forcedMotionMode: motionPreference.forced,
    gsapVersion: gsap.version,
    heroInitialized: false,
    splitTextInitialized: false,
    lenisInitialized: Boolean(window.lenis || window.Lenis || window.__lenis),
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
  debugState.debug.mode = motionPreference.mode;
  debugState.debug.normalUrlUsesFullMotion = motionPreference.fullMotion;
  debugState.debug.osReducedMotionIgnored = true;
  debugState.debug.developerOverride = motionPreference.developerOverride;
  debugState.debug.forcedMotionMode = motionPreference.forced;
  debugState.debug.gsapVersion = gsap.version;
  debugState.debug.splitTargets = debugState.splitTargets.size;
  debugState.debug.successfulSplits = debugState.successfulSplits.size;
  debugState.debug.generatedMasks = document.querySelectorAll("body.u-home-page .mask-line-mask, body.u-home-page .mask-word-mask").length;
  debugState.debug.scrollTriggers = ScrollTrigger.getAll().length;
  debugState.debug.splitTextInitialized = debugState.successfulSplits.size > 0;
  debugState.debug.lenisInitialized = Boolean(window.lenis || window.Lenis || window.__lenis);
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

function numberFromData(element, name, fallback) {
  const value = Number(element?.dataset?.[name]);
  return Number.isFinite(value) ? value : fallback;
}

export function initUmusareHomepageAnimations() {
const hero = document.querySelector("[data-cinematic-hero]");
const motionPreference = getUmusareMotionMode();
const motionDebug = createMotionDebug(motionPreference);

document.documentElement.dataset.motion = motionPreference.mode;
document.documentElement.classList.toggle("umusare-full-motion", motionPreference.fullMotion);
document.documentElement.classList.toggle("umusare-reduce-motion", !motionPreference.fullMotion);
document.body.classList.toggle("u-motion-full", motionPreference.mode === "full");
document.body.classList.toggle("u-motion-reduce", motionPreference.mode === "reduce");

if (hero && !window.__UMUSARE_CINEMATIC_HERO__) {
  window.__UMUSARE_CINEMATIC_HERO__ = true;

  const stage = hero.querySelector("[data-cinematic-stage]");
  const scenes = Array.from(hero.querySelectorAll("[data-cinematic-scene]"));
  const currentNumber = hero.querySelector("[data-hero-current]");
  const progressSteps = Array.from(hero.querySelectorAll(".cinematic-hero__progress span"));
  const continuePrompt = hero.querySelector("[data-hero-continue]");
  const media = gsap.matchMedia();
  const splitInstances = [];
  const featureHero = hero.querySelector("[data-feature-hero]");
  const featureHeroCurtain = featureHero?.querySelector("[data-feature-hero-curtain]");
  const featureHeroHeading = featureHero?.querySelector("[data-feature-hero-heading]");
  const featureHeroBody = featureHero ? Array.from(featureHero.querySelectorAll("[data-feature-hero-body], [data-feature-hero-cards], [data-feature-hero-counter]")) : [];
  const featureHeroCards = featureHero ? Array.from(featureHero.querySelectorAll("[data-feature-hero-card]")) : [];
  const featureImageCurtains = featureHero ? Array.from(featureHero.querySelectorAll("[data-feature-image-curtain]")) : [];
  const featureImages = featureHero ? Array.from(featureHero.querySelectorAll("[data-feature-image]")) : [];
  const featureHeroCounter = featureHero?.querySelector("[data-feature-hero-counter]");
  let featureHeroActive = false;
  let featureHeroIndex = 0;
  let activeHeroSceneIndex = 0;

  function updateHeroNavigationMode() {
    const mode = featureHeroActive || activeHeroSceneIndex > 0 ? "logo" : "full";
    document.body.dataset.heroNavMode = mode;
    document.body.classList.toggle("u-hero-nav-logo-only", mode === "logo");
  }

  function setFeatureHeroState(active, index = 0) {
    const nextIndex = Math.max(0, Math.min(index, Math.max(featureHeroCards.length - 1, 0)));
    if (active === featureHeroActive && nextIndex === featureHeroIndex) return;

    featureHeroActive = active;
    featureHeroIndex = nextIndex;
    if (featureHero) {
      featureHero.classList.toggle("is-feature-active", active);
    }
    if (featureHeroCounter) {
      featureHeroCounter.textContent = `${String(nextIndex + 1).padStart(2, "0")} / ${String(Math.max(featureHeroCards.length, 1)).padStart(2, "0")}`;
    }

    window.__UMUSARE_FEATURE_HERO_STATE__ = {
      active,
      index: nextIndex,
      total: featureHeroCards.length
    };
    window.dispatchEvent(new CustomEvent("umusare:feature-hero", {
      detail: window.__UMUSARE_FEATURE_HERO_STATE__
    }));
    updateHeroNavigationMode();
  }

  function setActiveScene(index) {
    const nextIndex = Math.max(0, Math.min(index, scenes.length - 1));
    activeHeroSceneIndex = nextIndex;

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
    updateHeroNavigationMode();
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
    const curtain = scene.querySelector("[data-curtain-mask]");
    const media = scene.querySelector("[data-scene-media]");
    const bodyItems = [
      ...(content
        ? Array.from(content.querySelectorAll(".cinematic-hero__eyebrow, .cinematic-hero__support-line, .cinematic-hero__copy"))
        : []),
      ...Array.from(scene.querySelectorAll("[data-scene-actions], [data-scene-content] .cinematic-hero__actions"))
    ];
    return { content, headline, image, curtain, media, bodyItems };
  }

  function prepareScene(scene) {
    const { headline, bodyItems } = getSceneParts(scene);
    const headlineSplit = headline ? createMaskedSplit(headline, headline.dataset.maskReveal || "lines") : { targets: [], isWordMode: false };
    if (bodyItems.length) {
      gsap.set(bodyItems, { y: 22, autoAlpha: 0 });
    }
    return { headlineTargets: headlineSplit.targets, isWordMode: headlineSplit.isWordMode, bodyItems };
  }

  function prepareFeatureHero() {
    const headingSplit = featureHeroHeading
      ? createMaskedSplit(featureHeroHeading, featureHeroHeading.dataset.maskReveal || "lines")
      : { targets: [], isWordMode: false };

    if (featureHeroBody.length) {
      gsap.set(featureHeroBody, { y: 22, autoAlpha: 0 });
    }
    if (featureImageCurtains.length) {
      gsap.set(featureImageCurtains, { clipPath: "inset(0% 0% 0% 100% round 1.5rem)" });
    }
    if (featureImages.length) {
      gsap.set(featureImages, { xPercent: 10, scale: 1.06 });
    }

    return {
      headlineTargets: headingSplit.targets,
      isWordMode: headingSplit.isWordMode,
      bodyItems: featureHeroBody
    };
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
    const { curtain, media, image } = getSceneParts(scene);
    const parallaxY = numberFromData(image, "parallaxY", -3);
    const parallaxScale = numberFromData(image, "parallaxScale", 1.04);
    const curtainDuration = 1.08;
    const curtainOpenAt = at + curtainDuration;

    if (curtain) {
      timeline.to(curtain, {
        clipPath: "inset(0% 0% 0% 0% round 0rem)",
        duration: curtainDuration,
        ease: "none"
      }, at);
    }

    if (media) {
      timeline.fromTo(
        media,
        { scale: Math.max(1.04, parallaxScale + 0.02), yPercent: Math.abs(parallaxY) * 0.35 },
        { scale: Math.max(1.005, parallaxScale - 0.03), yPercent: 0, duration: curtainDuration, ease: "none" },
        at
      );
    }

    revealHeroHeadline(timeline, prepared, curtainOpenAt + 0.08);
    if (prepared.bodyItems.length) {
      timeline.to(prepared.bodyItems, {
        y: 0,
        autoAlpha: 1,
        duration: 0.38,
        stagger: 0.018,
        ease: "power3.out"
      }, curtainOpenAt + 0.48);
    }
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
      if (motionDebug) {
        motionDebug.debug.heroInitialized = true;
        updateMotionDebug(motionDebug, motionPreference);
      }

      const preparedScenes = scenes.map(prepareScene);
      const preparedFeatureHero = featureHero ? prepareFeatureHero() : null;
      const sceneImages = scenes.map((scene) => scene.querySelector(".cinematic-hero__image"));
      const sceneCurtains = scenes.map((scene) => scene.querySelector("[data-curtain-mask]"));
      const sceneMedia = scenes.map((scene) => scene.querySelector("[data-scene-media]"));
      const closedCurtain = "inset(100% 0% 0% 0% round 1.5rem 1.5rem 0 0)";
      const openCurtain = "inset(0% 0% 0% 0% round 0rem)";
      const sceneActivationTimes = [0];
      let featureHeroActivationTime = Number.POSITIVE_INFINITY;
      let featureImageActivationTimes = [];

      scenes.forEach((scene, index) => {
        gsap.set(scene, {
          autoAlpha: 1,
          clipPath: "none",
          zIndex: index + 1,
          clearProps: "transform"
        });
      });

      gsap.set(sceneCurtains.filter(Boolean), { clipPath: closedCurtain });
      if (sceneCurtains[0]) {
        gsap.set(sceneCurtains[0], { clipPath: openCurtain });
      }
      gsap.set(sceneImages.filter(Boolean), { clearProps: "transform" });
      sceneMedia.filter(Boolean).forEach((mediaElement, index) => {
        const image = sceneImages[index];
        gsap.set(mediaElement, {
          scale: Math.max(1.04, numberFromData(image, "parallaxScale", 1.04) + 0.02),
          yPercent: Math.abs(numberFromData(image, "parallaxY", -3)) * 0.35
        });
      });
      if (sceneMedia[0]) {
        gsap.set(sceneMedia[0], {
          scale: Math.max(1.005, numberFromData(sceneImages[0], "parallaxScale", 1.035) - 0.03),
          yPercent: 0
        });
      }
      if (continuePrompt) {
        gsap.set(continuePrompt, { autoAlpha: 0, y: 12 });
      }
      if (featureHero) {
        gsap.set(featureHero, {
          autoAlpha: 1,
          clearProps: "transform"
        });
        if (featureHeroCurtain) {
          gsap.set(featureHeroCurtain, {
            clipPath: "inset(0% 0% 0% 100% round 2rem 0 0 2rem)"
          });
        }
        setFeatureHeroState(false, 0);
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
          end: featureHero ? "+=860%" : "+=540%",
          pin: true,
          scrub: 1.05,
          invalidateOnRefresh: true,
          onUpdate: () => {
            const currentTime = timeline.time();
            const featureIsActive = featureHero && currentTime >= featureHeroActivationTime;
            const currentScene = featureIsActive ? scenes.length - 1 : sceneActivationTimes.reduce((activeIndex, activationTime, index) => (
              currentTime >= activationTime ? index : activeIndex
            ), 0);
            setActiveScene(currentScene);
            if (featureHero) {
              const activeFeatureIndex = featureImageActivationTimes.reduce((activeIndex, activationTime, index) => (
                currentTime >= activationTime ? index : activeIndex
              ), 0);
              setFeatureHeroState(Boolean(featureIsActive), activeFeatureIndex);
            }
            if (continuePrompt) {
              gsap.to(continuePrompt, {
                autoAlpha: timeline.progress() > 0.965 ? 1 : 0,
                y: timeline.progress() > 0.965 ? 0 : 12,
                duration: 0.18,
                overwrite: true
              });
            }
          }
        }
      });

      let nextSceneStart = 0.96;
      scenes.slice(1).forEach((scene, index) => {
        const position = nextSceneStart;
        sceneActivationTimes[index + 1] = position + 0.86;
        revealScene(timeline, scene, preparedScenes[index + 1], position);
        timeline.to({}, { duration: 0.01 }, position + 2.34);
        nextSceneStart += 2.42;
      });

      if (featureHero && featureHeroCurtain && preparedFeatureHero) {
        const featureStart = nextSceneStart + 0.08;
        const featureCurtainDuration = 1.12;
        const featureHeadingStart = featureStart + featureCurtainDuration + 0.1;
        const featureCardsStart = featureHeadingStart + 0.82;
        const firstImageStart = featureCardsStart + 0.42;
        const imageDuration = 0.72;
        const imageGap = 0.58;

        featureHeroActivationTime = featureStart + featureCurtainDuration * 0.82;
        featureImageActivationTimes = featureHeroCards.map((_, index) => firstImageStart + index * imageGap + imageDuration * 0.45);

        timeline.to(featureHeroCurtain, {
          clipPath: "inset(0% 0% 0% 0% round 0rem)",
          duration: featureCurtainDuration,
          ease: "none"
        }, featureStart);

        revealHeroHeadline(timeline, preparedFeatureHero, featureHeadingStart);

        if (preparedFeatureHero.bodyItems.length) {
          timeline.to(preparedFeatureHero.bodyItems, {
            y: 0,
            autoAlpha: 1,
            duration: 0.42,
            stagger: 0.04,
            ease: "power3.out"
          }, featureHeadingStart + 0.34);
        }

        featureImageCurtains.forEach((curtain, index) => {
          const image = featureImages[index];
          const position = firstImageStart + index * imageGap;

          timeline.to(curtain, {
            clipPath: "inset(0% 0% 0% 0% round 1.5rem)",
            duration: imageDuration,
            ease: "none"
          }, position);

          if (image) {
            timeline.to(image, {
              xPercent: 0,
              scale: 1.01,
              duration: imageDuration,
              ease: "none"
            }, position);
          }
        });

        timeline.to({}, { duration: 0.01 }, firstImageStart + (featureImageCurtains.length - 1) * imageGap + imageDuration + 0.95);
      }

      [...sceneImages, ...featureImages].forEach((image) => {
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
        document.body.removeAttribute("data-hero-nav-mode");
        document.body.classList.remove("u-hero-nav-logo-only");
        gsap.set([
          ...scenes,
          ...sceneCurtains.filter(Boolean),
          ...sceneMedia.filter(Boolean),
          ...sceneImages.filter(Boolean),
          featureHero,
          featureHeroCurtain,
          ...featureImageCurtains,
          ...featureImages,
          ...featureHeroBody,
          continuePrompt
        ].filter(Boolean), { clearProps: "all" });
        setFeatureHeroState(false, 0);
      };
    });
    }

    media.add(motionPreference.reduceMotion ? "all" : "(max-width: 768px)", () => {
      hero.classList.remove("is-animated");
      hero.classList.toggle("is-mobile-animated", !motionPreference.reduceMotion);
      setActiveScene(0);

      const sceneCurtains = scenes.map((scene) => scene.querySelector("[data-curtain-mask]")).filter(Boolean);
      const sceneMedia = scenes.map((scene) => scene.querySelector("[data-scene-media]")).filter(Boolean);
      const sceneImages = scenes.map((scene) => scene.querySelector(".cinematic-hero__image")).filter(Boolean);
      gsap.set([...scenes, ...sceneCurtains, ...sceneMedia, ...sceneImages], { clearProps: "all" });

      if (motionPreference.reduceMotion) {
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

        return () => {
          observer.disconnect();
          hero.classList.remove("is-mobile-animated");
        };
      }

      if (motionDebug) {
        motionDebug.debug.heroInitialized = true;
        updateMotionDebug(motionDebug, motionPreference);
      }

      scenes.forEach((scene, index) => {
        gsap.set(scene, {
          autoAlpha: 1,
          clipPath: "none",
          zIndex: 1,
          clearProps: "transform"
        });

        scene.classList.toggle("is-mobile-revealed", index === 0);
      });

      let mobileCheckFrame = 0;
      function checkMobileScenes() {
        mobileCheckFrame = 0;
        const enterLine = window.innerHeight * 0.84;
        const exitLine = window.innerHeight * 0.14;
        let activeIndex = 0;

        scenes.forEach((scene, sceneIndex) => {
          const rect = scene.getBoundingClientRect();
          const isInRange = rect.top <= enterLine && rect.bottom >= exitLine;

          if (isInRange) {
            activeIndex = sceneIndex;
            scene.classList.add("is-mobile-revealed");
          } else if (sceneIndex > 0 && rect.top > enterLine) {
            scene.classList.remove("is-mobile-revealed");
          }
        });

        setActiveScene(activeIndex);
      }

      function scheduleMobileSceneCheck() {
        if (mobileCheckFrame) return;
        mobileCheckFrame = window.setTimeout(checkMobileScenes, 16);
      }

      window.addEventListener("scroll", scheduleMobileSceneCheck, { passive: true });
      window.addEventListener("resize", scheduleMobileSceneCheck, { passive: true });
      const mobileSceneInterval = window.setInterval(scheduleMobileSceneCheck, 180);
      scheduleMobileSceneCheck();

      sceneImages.forEach((image) => {
        if (image.complete) return;
        image.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
      });

      ScrollTrigger.refresh(true);
      updateMotionDebug(motionDebug, motionPreference);

      return () => {
        window.removeEventListener("scroll", scheduleMobileSceneCheck);
        window.removeEventListener("resize", scheduleMobileSceneCheck);
        window.clearInterval(mobileSceneInterval);
        if (mobileCheckFrame) {
          window.clearTimeout(mobileCheckFrame);
        }
        clearSplits();
        hero.classList.remove("is-mobile-animated");
        scenes.forEach((scene) => scene.classList.remove("is-mobile-revealed"));
        gsap.set([
          ...scenes,
          ...sceneCurtains,
          ...sceneMedia,
          ...sceneImages,
          continuePrompt
        ].filter(Boolean), { clearProps: "all" });
      };
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

    const currentMotionPreference = motionPreference.developerOverride ? motionPreference : getUmusareMotionMode();
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
    if ((motionPreference.developerOverride ? motionPreference : getUmusareMotionMode()).reduceMotion) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildHomepageReveals, 180);
  }, { passive: true });

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
    const featureState = window.__UMUSARE_FEATURE_HERO_STATE__;
    if (featureState?.active) {
      return `Features · ${String((featureState.index || 0) + 1).padStart(2, "0")} / ${String(featureState.total || 4).padStart(2, "0")}`;
    }

    const activeScene = Array.from(hero.querySelectorAll("[data-cinematic-scene]"))
      .find((scene) => scene.classList.contains("is-active"));
    if (activeScene) {
      const sceneNumber = Number(activeScene.dataset.sceneIndex || 0) + 1;
      return `Hero · ${sceneNumber} / 4`;
    }

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
    if (window.__UMUSARE_FEATURE_HERO_STATE__?.active) {
      index = 0;
    }

    const heroTrigger = ScrollTrigger.getAll().find((trigger) => trigger.trigger === hero);
    if (heroTrigger && window.scrollY >= heroTrigger.start && window.scrollY <= heroTrigger.end) {
      index = 0;
    }

    const nextIndex = Math.max(0, Math.min(index, progressSections.length - 1));
    const section = progressSections[nextIndex];
    const label = labelForSection(section);

    activeProgressIndex = nextIndex;
    applyProgressTheme(section.dataset.progressTheme || "light");
    writeProgressText(nextIndex, label, immediate);
  }

  function refreshHeroProgressLabel() {
    const featureState = window.__UMUSARE_FEATURE_HERO_STATE__;
    if (featureState?.active) {
      activeProgressIndex = 0;
      applyProgressTheme("light");
      writeProgressText(0, currentHeroSceneLabel(), true);
      return;
    }

    const heroTrigger = ScrollTrigger.getAll().find((trigger) => trigger.trigger === hero);
    const heroIsActive = heroTrigger && window.scrollY >= heroTrigger.start && window.scrollY <= heroTrigger.end;
    if (activeProgressIndex !== 0 && !heroIsActive) return;
    if (heroIsActive) {
      activeProgressIndex = 0;
    }
    writeProgressText(0, currentHeroSceneLabel(), true);
  }

  function updateOverallProgress(self) {
    progressIndicator.style.setProperty("--page-progress", String(gsap.utils.clamp(0, 1, self.progress || 0)));
    refreshHeroProgressLabel();
  }

  function detectCurrentProgressSection() {
    const heroTrigger = ScrollTrigger.getAll().find((trigger) => trigger.trigger === hero);
    if (heroTrigger && window.scrollY >= heroTrigger.start && window.scrollY <= heroTrigger.end) {
      setActiveProgressSection(0, true);
      return;
    }

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
  window.addEventListener("umusare:feature-hero", refreshHeroProgressLabel, { passive: true });
  setActiveProgressSection(0, true);
  updateMotionDebug(motionDebug, motionPreference);
  window.addEventListener("resize", detectCurrentProgressSection, { passive: true });
}

const parallaxTargets = Array.from(document.querySelectorAll("body.u-home-page [data-parallax]"));
const larpTargets = Array.from(document.querySelectorAll("body.u-home-page [data-larp]"));

if ((parallaxTargets.length || larpTargets.length) && !window.__UMUSARE_PARALLAX_LARP__) {
  window.__UMUSARE_PARALLAX_LARP__ = true;

  const pointerFineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const nonHeroParallaxTargets = parallaxTargets.filter((target) => !target.closest("[data-cinematic-hero]"));
  const parallaxTriggers = [];
  const larpRecords = [];
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let larpTickerActive = false;

  const shouldExposeDebug = import.meta.env.DEV || new URLSearchParams(window.location.search).has("motion");
  if (shouldExposeDebug) {
    window.__UMUSARE_PARALLAX_DEBUG__ = {
      parallaxTargets: parallaxTargets.length,
      nonHeroParallaxTargets: nonHeroParallaxTargets.length,
      larpTargets: larpTargets.length,
      larpTickerActive: false,
      scrollTriggers: ScrollTrigger.getAll().length
    };
  }

  function updateParallaxDebug() {
    if (!window.__UMUSARE_PARALLAX_DEBUG__) return;
    window.__UMUSARE_PARALLAX_DEBUG__.larpTickerActive = larpTickerActive;
    window.__UMUSARE_PARALLAX_DEBUG__.scrollTriggers = ScrollTrigger.getAll().length;
    document.documentElement.dataset.umusareParallaxDebug = JSON.stringify(window.__UMUSARE_PARALLAX_DEBUG__);
  }

  function resetLarpTargets() {
    pointerTargetX = 0;
    pointerTargetY = 0;
    larpRecords.forEach((record) => {
      record.targetX = 0;
      record.targetY = 0;
      record.targetRotation = 0;
      if (motionPreference.reduceMotion) {
      record.currentX = 0;
      record.currentY = 0;
      record.currentRotation = 0;
      record.setter({ x: 0, y: 0, rotation: 0 });
      }
    });
  }

  function onPointerMove(event) {
    pointerTargetX = (event.clientX / window.innerWidth) * 2 - 1;
    pointerTargetY = (event.clientY / window.innerHeight) * 2 - 1;
    if (window.__UMUSARE_PARALLAX_DEBUG__) {
      window.__UMUSARE_PARALLAX_DEBUG__.pointerX = Number(pointerTargetX.toFixed(3));
      window.__UMUSARE_PARALLAX_DEBUG__.pointerY = Number(pointerTargetY.toFixed(3));
      document.documentElement.dataset.umusareParallaxDebug = JSON.stringify(window.__UMUSARE_PARALLAX_DEBUG__);
    }
  }

  function tickLarp() {
    larpRecords.forEach((record) => {
      if (record.isVisible) {
        record.targetX = pointerTargetX * record.maxX;
        record.targetY = pointerTargetY * record.maxY;
        record.targetRotation = pointerTargetX * record.maxRotation;
      }

      const isSettled =
        Math.abs(record.currentX) < 0.02 &&
        Math.abs(record.currentY) < 0.02 &&
        Math.abs(record.currentRotation) < 0.02;

      if (!record.isVisible && isSettled) return;

      record.currentX += (record.targetX - record.currentX) * record.factor;
      record.currentY += (record.targetY - record.currentY) * record.factor;
      record.currentRotation += (record.targetRotation - record.currentRotation) * record.factor;

      record.setter({
        x: record.currentX,
        y: record.currentY,
        rotation: record.currentRotation
      });
    });

    if (window.__UMUSARE_PARALLAX_DEBUG__ && larpRecords[0]) {
      window.__UMUSARE_PARALLAX_DEBUG__.firstLarpX = Number(larpRecords[0].currentX.toFixed(2));
      window.__UMUSARE_PARALLAX_DEBUG__.firstLarpY = Number(larpRecords[0].currentY.toFixed(2));
      window.__UMUSARE_PARALLAX_DEBUG__.firstLarpRotation = Number(larpRecords[0].currentRotation.toFixed(2));
      document.documentElement.dataset.umusareParallaxDebug = JSON.stringify(window.__UMUSARE_PARALLAX_DEBUG__);
    }
  }

  function initNonHeroParallax() {
    nonHeroParallaxTargets.forEach((target) => {
      const y = numberFromData(target, "parallaxY", -5);
      const scale = numberFromData(target, "parallaxScale", 1.04);
      const trigger = target.closest("[data-progress-section], section, footer, main") || target;
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
          invalidateOnRefresh: true
        }
      });

      timeline.fromTo(
        target,
        { yPercent: y * -1, scale },
        { yPercent: y, scale: Math.max(1, scale - 0.02), ease: "none" }
      );

      parallaxTriggers.push(timeline);
    });
  }

  function initLarp() {
    if (!pointerFineQuery.matches || motionPreference.reduceMotion || !larpTargets.length) {
      gsap.set(larpTargets, motionPreference.reduceMotion ? { clearProps: "transform" } : { x: 0, y: 0, rotation: 0 });
      return;
    }

    larpTargets.forEach((target) => {
      const trigger = target.closest("[data-progress-section], [data-cinematic-hero], section, footer") || target;
      const record = {
        element: target,
        factor: numberFromData(target, "larpFactor", 0.08),
        maxX: numberFromData(target, "larpX", 10),
        maxY: numberFromData(target, "larpY", 8),
        maxRotation: numberFromData(target, "larpRotate", 1),
        currentX: 0,
        currentY: 0,
        currentRotation: 0,
        targetX: 0,
        targetY: 0,
        targetRotation: 0,
        isVisible: false,
        setter: gsap.quickSetter(target, "css")
      };

      const triggerRect = trigger.getBoundingClientRect();
      record.isVisible = triggerRect.bottom >= 0 && triggerRect.top <= window.innerHeight;

      larpRecords.push(record);
      parallaxTriggers.push(ScrollTrigger.create({
        trigger,
        start: "top bottom",
        end: "bottom top",
        invalidateOnRefresh: true,
        onEnter: () => { record.isVisible = true; },
        onEnterBack: () => { record.isVisible = true; },
        onLeave: () => {
          record.isVisible = false;
          record.targetX = 0;
          record.targetY = 0;
          record.targetRotation = 0;
        },
        onLeaveBack: () => {
          record.isVisible = false;
          record.targetX = 0;
          record.targetY = 0;
          record.targetRotation = 0;
        }
      }));
    });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", resetLarpTargets, { passive: true });
    window.addEventListener("mouseleave", resetLarpTargets, { passive: true });
    gsap.ticker.add(tickLarp);
    larpTickerActive = true;
  }

  if (motionPreference.reduceMotion) {
    gsap.set([...parallaxTargets, ...larpTargets], { clearProps: "transform" });
  } else {
    initNonHeroParallax();
    initLarp();
    ScrollTrigger.refresh(true);
  }

  updateParallaxDebug();
  updateMotionDebug(motionDebug, motionPreference);
}

const customCursor = document.querySelector("body.u-home-page [data-custom-cursor]");

if (customCursor && !window.__UMUSARE_CUSTOM_CURSOR__) {
  window.__UMUSARE_CUSTOM_CURSOR__ = true;

  const pointerFineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const cursorRing = customCursor.querySelector("[data-cursor-ring]");
  const cursorDot = customCursor.querySelector("[data-cursor-dot]");
  const cursorLabel = customCursor.querySelector("[data-cursor-label]");
  const featureToggle = document.querySelector("[data-feature-menu-button]");
  const featurePanel = document.querySelector("[data-feature-menu]");
  const magneticTargets = Array.from(new Set([
    ...document.querySelectorAll("body.u-home-page [data-magnetic]"),
    ...(featurePanel ? featurePanel.querySelectorAll("a") : [])
  ]));
  const cursorTargets = Array.from(document.querySelectorAll("body.u-home-page [data-cursor]"));
  const magneticRecords = [];
  const cursorMotionAllowed = motionPreference.mode !== "reduce" && pointerFineQuery.matches;
  let pointerX = 0;
  let pointerY = 0;
  let dotX = 0;
  let dotY = 0;
  let ringX = 0;
  let ringY = 0;
  let cursorVisible = false;
  let activeCursorElement = null;
  let cursorTickerActive = false;

  const setCursorTransform = gsap.quickSetter(customCursor, "css");
  const setDotTransform = cursorDot ? gsap.quickSetter(cursorDot, "css") : null;
  const setRingTransform = cursorRing ? gsap.quickSetter(cursorRing, "css") : null;

  function canUseCustomCursor() {
    return cursorMotionAllowed && document.body.classList.contains("u-home-page");
  }

  function cursorStateFor(element) {
    const state = element?.dataset?.cursor || "default";
    if (state === "features") {
      return featurePanel?.classList.contains("is-open") ? "close" : "features";
    }
    return state;
  }

  function labelForCursorState(state) {
    if (state === "book") return "BOOK";
    if (state === "features") return "OPEN";
    if (state === "close") return "CLOSE";
    if (state === "view") return "VIEW";
    return "";
  }

  function applyCursorState(element) {
    const state = cursorStateFor(element);
    const label = labelForCursorState(state);

    customCursor.dataset.cursorState = state;
    customCursor.classList.toggle("is-labeled", Boolean(label));
    customCursor.classList.toggle("is-link", state === "link");
    if (cursorLabel) cursorLabel.textContent = label;
  }

  function applyCursorTheme(event) {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const darkSurface = element?.closest(".u-home-feature-menu, .u-home-followup, .site-footer, [data-cursor-theme='dark']");
    const lightSurface = element?.closest("[data-cursor-theme='light']");
    customCursor.classList.toggle("is-dark-theme", Boolean(darkSurface) && !lightSurface);
  }

  function clearCursorState() {
    activeCursorElement = null;
    customCursor.dataset.cursorState = "default";
    customCursor.classList.remove("is-labeled", "is-link");
    if (cursorLabel) cursorLabel.textContent = "";
  }

  function showCursor() {
    if (cursorVisible) return;
    cursorVisible = true;
    document.documentElement.classList.add("u-custom-cursor-active");
    customCursor.classList.add("is-visible");
  }

  function hideCursor() {
    cursorVisible = false;
    customCursor.classList.remove("is-visible");
    clearCursorState();
    magneticRecords.forEach((record) => {
      record.toX(0);
      record.toY(0);
    });
  }

  function onCursorPointerMove(event) {
    if (!canUseCustomCursor()) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    applyCursorTheme(event);
    if (!cursorVisible) {
      dotX = pointerX;
      dotY = pointerY;
      ringX = pointerX;
      ringY = pointerY;
      showCursor();
    }
  }

  function tickCursor() {
    if (!cursorVisible) return;

    dotX += (pointerX - dotX) * 0.48;
    dotY += (pointerY - dotY) * 0.48;
    ringX += (pointerX - ringX) * 0.16;
    ringY += (pointerY - ringY) * 0.16;

    setCursorTransform({ x: ringX, y: ringY });
    if (setDotTransform) {
      setDotTransform({ x: dotX - ringX, y: dotY - ringY });
    }
    if (setRingTransform) {
      setRingTransform({ x: 0, y: 0 });
    }

    if (activeCursorElement) {
      applyCursorState(activeCursorElement);
    }
  }

  function bindCursorTargets() {
    cursorTargets.forEach((target) => {
      target.addEventListener("pointerenter", () => {
        activeCursorElement = target;
        applyCursorState(target);
      });

      target.addEventListener("pointerleave", () => {
        if (activeCursorElement === target) {
          clearCursorState();
        }
      });
    });

    if (featureToggle) {
      featureToggle.addEventListener("click", () => {
        window.requestAnimationFrame(() => {
          if (activeCursorElement === featureToggle) {
            applyCursorState(featureToggle);
          }
        });
      });
    }

    featurePanel?.querySelectorAll("a").forEach((link) => {
      link.dataset.cursor = link.dataset.cursor || "view";
      cursorTargets.push(link);
      link.addEventListener("pointerenter", () => {
        activeCursorElement = link;
        applyCursorState(link);
      });
      link.addEventListener("pointerleave", () => {
        if (activeCursorElement === link) {
          clearCursorState();
        }
      });
    });
  }

  function bindMagneticTargets() {
    magneticTargets.forEach((target) => {
      const maxX = numberFromData(target, "magneticX", 7);
      const maxY = numberFromData(target, "magneticY", 5);
      const toX = gsap.quickTo(target, "x", { duration: 0.34, ease: "power3.out" });
      const toY = gsap.quickTo(target, "y", { duration: 0.34, ease: "power3.out" });
      const record = { element: target, toX, toY };

      magneticRecords.push(record);

      target.addEventListener("pointermove", (event) => {
        if (!canUseCustomCursor()) return;
        const rect = target.getBoundingClientRect();
        const relativeX = ((event.clientX - rect.left) / rect.width) - 0.5;
        const relativeY = ((event.clientY - rect.top) / rect.height) - 0.5;
        toX(relativeX * maxX * 2);
        toY(relativeY * maxY * 2);
      });

      target.addEventListener("pointerleave", () => {
        toX(0);
        toY(0);
      });
    });
  }

  function cleanupCustomCursor() {
    window.removeEventListener("pointermove", onCursorPointerMove);
    window.removeEventListener("pointerleave", hideCursor);
    window.removeEventListener("blur", hideCursor);
    gsap.ticker.remove(tickCursor);
    cursorTickerActive = false;
    document.documentElement.classList.remove("u-custom-cursor-active");
    customCursor.classList.remove("is-visible");
    magneticRecords.forEach((record) => {
      record.toX(0);
      record.toY(0);
      gsap.set(record.element, { clearProps: "transform" });
    });
  }

  if (canUseCustomCursor()) {
    bindCursorTargets();
    bindMagneticTargets();
    window.addEventListener("pointermove", onCursorPointerMove, { passive: true });
    window.addEventListener("pointerleave", hideCursor, { passive: true });
    window.addEventListener("blur", hideCursor, { passive: true });
    gsap.ticker.add(tickCursor);
    cursorTickerActive = true;
    window.__UMUSARE_CUSTOM_CURSOR_DEBUG__ = {
      enabled: true,
      cursorTargets: cursorTargets.length,
      magneticTargets: magneticTargets.length,
      tickerActive: cursorTickerActive,
      dotFactor: 0.48,
      ringFactor: 0.16,
      magneticMaxX: 7,
      magneticMaxY: 5
    };
  } else {
    customCursor.hidden = true;
    window.__UMUSARE_CUSTOM_CURSOR_DEBUG__ = {
      enabled: false,
      reason: motionPreference.mode === "reduce" ? "motion-reduce" : "coarse-pointer-or-no-hover"
    };
  }

  window.addEventListener("pagehide", cleanupCustomCursor, { once: true });
}

}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUmusareHomepageAnimations, { once: true });
} else {
  initUmusareHomepageAnimations();
}
