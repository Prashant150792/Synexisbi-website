// Products page interactions: scroll reveal, stat count-up, auto-advancing
// tabs (product tour), screenshot lightbox, video modal.
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canObserve = "IntersectionObserver" in window;

  // Scroll reveal
  document.documentElement.classList.add("pv-js");
  const revealItems = document.querySelectorAll(".pv-reveal");
  if (!canObserve || reduceMotion) {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    // Show whatever is already on screen right away, even in a background tab
    revealItems.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
    });
    revealItems.forEach((el) => revealObserver.observe(el));
  }

  // Stat count-up
  const counters = document.querySelectorAll("[data-count]");
  const renderCount = (el, value) => {
    el.textContent = `${el.dataset.prefix || ""}${value}${el.dataset.suffix || ""}`;
  };
  const runCount = (el) => {
    const target = Number(el.dataset.count);
    // rAF doesn't run in background tabs, so jump straight to the value there
    if (reduceMotion || target === 0 || document.hidden) {
      renderCount(el, target);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      renderCount(el, Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (canObserve) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => countObserver.observe(el));
  } else {
    counters.forEach(runCount);
  }

  // Tabs: [data-tabs] holds [data-tab] buttons and a [data-panels] container
  // whose children line up with the buttons by index. data-interval (ms)
  // turns on auto-advance, which pauses on hover/focus and stops for good
  // once the visitor picks a tab themselves.
  document.querySelectorAll("[data-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll("[data-tab]")];
    const panels = [...root.querySelector("[data-panels]").children];
    const interval = Number(root.dataset.interval) || 0;
    let current = 0;
    let timer = null;
    let paused = false;
    let stopped = reduceMotion || !interval;

    root.style.setProperty("--pv-interval", `${interval}ms`);

    const restartProgress = () => {
      tabs.forEach((tab) => {
        const bar = tab.querySelector(".pv-tab__progress");
        if (!bar) return;
        bar.classList.remove("is-running");
        void bar.offsetWidth; // restart the CSS animation
        if (!stopped && !paused && tab === tabs[current]) bar.classList.add("is-running");
      });
    };

    const show = (index) => {
      current = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, i) => {
        const active = i === current;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel, i) => {
        panel.classList.toggle("is-active", i === current);
        panel.setAttribute("aria-hidden", String(i !== current));
      });
      restartProgress();
    };

    const schedule = () => {
      clearTimeout(timer);
      if (stopped || paused) return;
      timer = setTimeout(() => {
        show(current + 1);
        schedule();
      }, interval);
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => {
        stopped = true;
        clearTimeout(timer);
        show(i);
      });
      tab.addEventListener("keydown", (e) => {
        const horizontal = root.dataset.orientation === "horizontal";
        const next = horizontal ? "ArrowRight" : "ArrowDown";
        const prev = horizontal ? "ArrowLeft" : "ArrowUp";
        if (e.key !== next && e.key !== prev) return;
        e.preventDefault();
        stopped = true;
        clearTimeout(timer);
        show(current + (e.key === next ? 1 : -1));
        tabs[current].focus();
      });
    });

    root.addEventListener("mouseenter", () => {
      paused = true;
      clearTimeout(timer);
      restartProgress();
    });
    root.addEventListener("mouseleave", () => {
      paused = false;
      restartProgress();
      schedule();
    });

    // Only rotate while the component is on screen
    if (canObserve && !stopped) {
      new IntersectionObserver(
        ([entry]) => {
          paused = !entry.isIntersecting;
          restartProgress();
          if (paused) clearTimeout(timer);
          else schedule();
        },
        { threshold: 0.3 }
      ).observe(root);
    }

    show(0);
  });

  // Overlays (lightbox + video)
  const lightbox = document.getElementById("pv-lightbox");
  const lightboxImg = lightbox.querySelector("img");
  const videoModal = document.getElementById("pv-video-modal");
  const modalVideo = videoModal.querySelector("video");
  let lastFocus = null;

  const openOverlay = (overlay) => {
    lastFocus = document.activeElement;
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    overlay.querySelector(".pv-overlay__close").focus();
  };
  const closeOverlay = (overlay) => {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    if (overlay === videoModal) modalVideo.pause();
    if (lastFocus) lastFocus.focus();
  };

  document.querySelectorAll(".pv-zoom").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const img = link.querySelector("img");
      lightboxImg.src = link.getAttribute("href");
      lightboxImg.alt = img ? img.alt : "";
      openOverlay(lightbox);
    });
  });

  document.querySelectorAll("[data-open-video]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openOverlay(videoModal);
      modalVideo.currentTime = 0;
      modalVideo.play().catch(() => {});
    });
  });

  [lightbox, videoModal].forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest(".pv-overlay__close")) closeOverlay(overlay);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    [lightbox, videoModal].forEach((overlay) => {
      if (overlay.classList.contains("is-open")) closeOverlay(overlay);
    });
  });

  // Hero video: honour reduced motion, and give a pause/play control
  const heroVideo = document.querySelector(".pv-hero video");
  const toggle = document.querySelector(".pv-video-toggle");
  if (heroVideo && toggle) {
    const pauseIcon = toggle.innerHTML;
    const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
    const sync = () => {
      const playing = !heroVideo.paused;
      toggle.innerHTML = playing ? pauseIcon : playIcon;
      toggle.setAttribute("aria-label", playing ? "Pause video" : "Play video");
    };
    if (reduceMotion) heroVideo.pause();
    toggle.addEventListener("click", () => {
      if (heroVideo.paused) heroVideo.play().catch(() => {});
      else heroVideo.pause();
    });
    heroVideo.addEventListener("play", sync);
    heroVideo.addEventListener("pause", sync);
    sync();
  }
});
