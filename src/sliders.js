// Visser Nederland – sliders (GitHub: dondrs/visser-nederland-site)
// Alle sliders van de site. Swiper 11 wordt één keer geladen en alleen als er een Swiper-slider op de pagina staat.
// Gebruikt de hulpfuncties uit global.js (window.VN).
// Slater start dit bestand pas als de HTML van de pagina klaar is: hier dus geen eigen 'pagina klaar'-listeners.

(() => {
  const VN = window.VN || {};
  const run =
    VN.run ||
    ((name, fn) => {
      try {
        fn();
      } catch (e) {
        console.warn("[Visser] " + name + " faalde", e);
      }
    });
  const onLoad =
    VN.onLoad ||
    ((fn) => {
      if (document.readyState === "complete") fn();
      else
        document.addEventListener("readystatechange", function wacht() {
          if (document.readyState !== "complete") return;
          document.removeEventListener("readystatechange", wacht);
          fn();
        });
    });
  const loadScript =
    VN.loadScript ||
    ((src) =>
      new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      }));

  const SWIPER_JS = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";

  function makeSwiper(el, cfg) {
    if (!el || el.swiper) return null;
    return new Swiper(el, cfg);
  }

  // ===== 1. Productslider met bullets en sleepbalk (.slider-main_component, o.a. Seepex) =====
  function initSliderMain() {
    document.querySelectorAll(".slider-main_component").forEach((comp) => {
      const el = comp.querySelector(".swiper");
      if (!el || el.swiper) return;
      const duration = Number(comp.getAttribute("slider-duration")) || 600;

      const swiper = new Swiper(el, {
        speed: duration,
        loop: false,
        autoHeight: false,
        centeredSlides: false,
        grabCursor: true,
        followFinger: true,
        freeMode: false,
        slideToClickedSlide: false,
        slidesPerView: 1,
        spaceBetween: 16,
        rewind: false,
        mousewheel: { forceToAxis: true },
        keyboard: { enabled: true, onlyInViewport: true },
        breakpoints: {
          480: { slidesPerView: 1, spaceBetween: 16 },
          768: { slidesPerView: 2, spaceBetween: 24 },
          992: { slidesPerView: 3, spaceBetween: 24 },
        },
        pagination: {
          el: comp.querySelector(".swiper-bullet-wrapper"),
          bulletActiveClass: "is-active",
          bulletClass: "swiper-bullet",
          bulletElement: "button",
          clickable: true,
        },
        navigation: {
          nextEl: comp.querySelector(".swiper-next"),
          prevEl: comp.querySelector(".swiper-prev"),
          disabledClass: "is-disabled",
        },
        scrollbar: {
          el: comp.querySelector(".swiper-drag-wrapper"),
          draggable: true,
          dragClass: "swiper-drag",
          snapOnRelease: true,
        },
        slideActiveClass: "is-active",
        slideDuplicateActiveClass: "is-active",
        observer: true,
        observeParents: true,
      });
      swiper.update();
    });
  }

  // ===== 2. Sliders via [swiper="..."] (vervangt de losse slider-embeds) =====
  // Pijlen zoeken binnen de eigen sectie. Vorige-knop heet op de site .swiper-prev--prev (soms --prev-2).
  const NEXT_SEL = ".swiper-next, .swiper-next--next";
  const PREV_SEL = ".swiper-prev, [class^='swiper-prev--prev']";

  function navFor(el) {
    const box = (el && el.closest("section")) || document;
    const nextEl = box.querySelector(NEXT_SEL);
    const prevEl = box.querySelector(PREV_SEL);
    return nextEl || prevEl ? { nextEl, prevEl } : false;
  }

  const SLIDER_PRODUCTS = {
    slidesPerView: 1,
    spaceBetween: 8,
    speed: 600,
    grabCursor: true,
    slideToClickedSlide: true,
    freeMode: { enabled: false, sticky: false },
    breakpoints: {
      768: { slidesPerView: 2, spaceBetween: 12 },
      992: { slidesPerView: 3, spaceBetween: 16 },
    },
  };

  function sliderPortfolio(el) {
    const nav = navFor(el);
    const hasNav = !!nav;
    return {
      slidesPerView: 1,
      spaceBetween: 12,
      speed: 600,
      grabCursor: true,
      navigation: nav,
      freeMode: { enabled: !hasNav, sticky: false },
      breakpoints: { 992: { slidesPerView: 2, spaceBetween: 12 } },
    };
  }

  function sliderTestimonial() {
    const cfg = {
      slidesPerView: 1,
      spaceBetween: 8,
      speed: 600,
      grabCursor: true,
      breakpoints: { 1120: { slidesPerView: 2 }, 680: { slidesPerView: 1 } },
    };
    // Homepage: doorlopend en automatisch
    if (location.pathname === "/") {
      cfg.loop = true;
      cfg.autoplay = { delay: 2000, disableOnInteraction: false };
    }
    return cfg;
  }

  async function initSliders() {
    const q = (s) => document.querySelector(s);
    const products = q('[swiper="products1"]');
    const portfolio = q('[swiper="portfolio1"]');
    const testimonial = q('[swiper="testimonial1"]');
    const timeline = q('[swiper="timeline3"]');
    const timelineThumbs = q('[swiper="timeline3-thumbs"]');
    const nordSlider = !products && !portfolio ? q(".portfolio1_swiper-slider:not([swiper])") :
      null;
    const hasMain = !!q(".slider-main_component .swiper");
    if (!products && !portfolio && !testimonial && !timeline && !nordSlider && !hasMain) return;

    if (!window.Swiper) await loadScript(SWIPER_JS);

    run("slider-products", () => makeSwiper(products, {
      ...SLIDER_PRODUCTS,
      navigation: navFor(
        products)
    }));
    run("slider-portfolio", () => makeSwiper(portfolio, sliderPortfolio(portfolio)));
    run("slider-testimonial", () => makeSwiper(testimonial, sliderTestimonial()));
    run("slider-nord", () => makeSwiper(nordSlider, {
      ...SLIDER_PRODUCTS,
      navigation: navFor(
        nordSlider)
    }));
    run("slider-timeline", () => {
      if (!timeline || !timelineThumbs) return;
      const thumbs = makeSwiper(timelineThumbs, {
        spaceBetween: 16,
        slidesPerView: "auto",
        freeMode: true,
        watchSlidesProgress: true,
        slideToClickedSlide: true,
      });
      makeSwiper(timeline, {
        slidesPerView: "auto",
        spaceBetween: 16,
        speed: 600,
        grabCursor: true,
        thumbs: { swiper: thumbs },
        navigation: { prevEl: ".swiper-prev--prev", nextEl: ".swiper-next--next" },
      });
    });
    // .slider-main_component pas na het laden van de pagina (afmetingen kloppen dan)
    onLoad(() => run("slider-main", initSliderMain));
  }

  // ===== 3. Cascading slider (homepage) – [data-cascading-slider-wrap], draait op GSAP =====
  // De CSS (ook voor de Designer-weergave) staat nog in de embed 'swiper-code' op de homepage.
  function initCascadingSlider() {
    const wrappers = document.querySelectorAll("[data-cascading-slider-wrap]");
    if (!wrappers.length || !window.gsap) return;

    const duration = 0.6;
    const ease = "power4.out";
    const breakpoints = [
      { maxWidth: 479, activeWidth: 0.78, siblingWidth: 0.08 },
      { maxWidth: 767, activeWidth: 0.7, siblingWidth: 0.1 },
      { maxWidth: 991, activeWidth: 0.6, siblingWidth: 0.1 },
      { maxWidth: Infinity, activeWidth: 0.6, siblingWidth: 0.13 },
    ];

    wrappers.forEach(setupInstance);

    function setupInstance(wrapper) {
      const viewport = wrapper.querySelector("[data-cascading-viewport]");
      if (!viewport) return;
      const prevButton = wrapper.querySelector("[data-cascading-slider-prev]");
      const nextButton = wrapper.querySelector("[data-cascading-slider-next]");
      const slides = Array.from(viewport.querySelectorAll("[data-cascading-slide]"));
      let totalSlides = slides.length;
      if (totalSlides === 0) return;

      // Te weinig slides: aanvullen met kopieën zodat de carrousel rond kan
      if (totalSlides < 9) {
        const originalSlides = slides.slice();
        while (slides.length < 9) {
          originalSlides.forEach((original) => {
            const clone = original.cloneNode(true);
            clone.setAttribute("data-clone", "");
            viewport.appendChild(clone);
            slides.push(clone);
          });
        }
        totalSlides = slides.length;
      }

      let activeIndex = 0;
      let isAnimating = false;
      let slideWidth = 0;
      const slotCenters = {};
      const slotWidths = {};
      let autoplayTimer;

      function readGap() {
        const raw = getComputedStyle(viewport).getPropertyValue("--gap").trim();
        if (!raw) return 0;
        const temp = document.createElement("div");
        temp.style.width = raw;
        temp.style.position = "absolute";
        temp.style.visibility = "hidden";
        viewport.appendChild(temp);
        const px = temp.offsetWidth;
        viewport.removeChild(temp);
        return px;
      }

      function getSettings() {
        const w = window.innerWidth;
        for (let i = 0; i < breakpoints.length; i++) {
          if (w <= breakpoints[i].maxWidth) return breakpoints[i];
        }
        return breakpoints[breakpoints.length - 1];
      }

      function getOffset(slideIndex, fromIndex) {
        if (fromIndex === undefined) fromIndex = activeIndex;
        let distance = slideIndex - fromIndex;
        const half = totalSlides / 2;
        if (distance > half) distance -= totalSlides;
        if (distance < -half) distance += totalSlides;
        return distance;
      }

      function measure() {
        const settings = getSettings();
        const viewportWidth = viewport.offsetWidth;
        const gap = readGap();

        const activeSlideWidth = viewportWidth * settings.activeWidth;
        const siblingSlideWidth = viewportWidth * settings.siblingWidth;
        const farSlideWidth = Math.max(
          0,
          (viewportWidth - activeSlideWidth - 2 * siblingSlideWidth - 4 * gap) / 2
        );

        slideWidth = activeSlideWidth;

        const visibleSlots = [
          { slot: -2, width: farSlideWidth },
          { slot: -1, width: siblingSlideWidth },
          { slot: 0, width: activeSlideWidth },
          { slot: 1, width: siblingSlideWidth },
          { slot: 2, width: farSlideWidth },
        ];

        let x = 0;
        visibleSlots.forEach((def, i) => {
          slotCenters[String(def.slot)] = x + def.width / 2;
          slotWidths[String(def.slot)] = def.width;
          if (i < visibleSlots.length - 1) x += def.width + gap;
        });

        slotCenters["-3"] = slotCenters["-2"] - farSlideWidth / 2 - gap - farSlideWidth / 2;
        slotWidths["-3"] = farSlideWidth;
        slotCenters["3"] = slotCenters["2"] + farSlideWidth / 2 + gap + farSlideWidth / 2;
        slotWidths["3"] = farSlideWidth;

        slides.forEach((slide) => {
          slide.style.width = slideWidth + "px";
        });
      }

      function getSlideProps(offset) {
        const clamped = Math.max(-3, Math.min(3, offset));
        const slotWidth = slotWidths[String(clamped)];
        const clipAmount = Math.max(0, (slideWidth - slotWidth) / 2);
        const translateX = slotCenters[String(clamped)] - slideWidth / 2;
        return { x: translateX, "--clip": clipAmount, zIndex: 10 - Math.abs(clamped) };
      }

      function layout(animate, previousIndex) {
        slides.forEach((slide, index) => {
          const offset = getOffset(index);
          slide.setAttribute("data-status", offset === 0 ? "active" : "inactive");

          if (offset < -3 || offset > 3) {
            if (animate && previousIndex !== undefined) {
              const previousOffset = getOffset(index, previousIndex);
              if (previousOffset >= -2 && previousOffset <= 2) {
                const exitSlot = previousOffset < 0 ? -3 : 3;
                gsap.to(
                  slide,
                  Object.assign({}, getSlideProps(exitSlot), {
                    duration,
                    ease,
                    overwrite: true
                  })
                );
                return;
              }
            }
            gsap.set(slide, getSlideProps(offset < 0 ? -3 : 3));
            return;
          }

          const props = getSlideProps(offset);
          if (animate) gsap.to(slide, Object.assign({}, props, {
            duration,
            ease,
            overwrite: true
          }));
          else gsap.set(slide, props);
        });
      }

      function goTo(targetIndex) {
        const normalizedTarget = ((targetIndex % totalSlides) + totalSlides) % totalSlides;
        if (isAnimating || normalizedTarget === activeIndex) return;
        isAnimating = true;

        const previousIndex = activeIndex;
        const travelDirection = getOffset(normalizedTarget, previousIndex) > 0 ? 1 : -1;

        slides.forEach((slide, index) => {
          const currentOffset = getOffset(index, previousIndex);
          const nextOffset = getOffset(index, normalizedTarget);
          const wasInRange = currentOffset >= -3 && currentOffset <= 3;
          const willBeVisible = nextOffset >= -2 && nextOffset <= 2;

          if (!wasInRange && willBeVisible) {
            gsap.set(slide, getSlideProps(travelDirection > 0 ? 3 : -3));
          }

          const wasInvisible = Math.abs(currentOffset) >= 3;
          const willBeStaging = Math.abs(nextOffset) === 3;
          const crossesSides = currentOffset * nextOffset < 0;
          if (wasInvisible && willBeStaging && crossesSides) {
            gsap.set(slide, getSlideProps(nextOffset > 0 ? 3 : -3));
          }
        });

        activeIndex = normalizedTarget;
        layout(true, previousIndex);
        gsap.delayedCall(duration + 0.05, () => {
          isAnimating = false;
        });
      }

      function stopAutoplay() {
        if (autoplayTimer) {
          clearInterval(autoplayTimer);
          autoplayTimer = null;
        }
      }

      function startAutoplay() {
        stopAutoplay();
        autoplayTimer = setInterval(() => goTo(activeIndex + 1), 3000);
      }

      if (prevButton) {
        prevButton.addEventListener("click", () => {
          goTo(activeIndex - 1);
          startAutoplay();
        });
      }
      if (nextButton) {
        nextButton.addEventListener("click", () => {
          goTo(activeIndex + 1);
          startAutoplay();
        });
      }

      slides.forEach((slide, index) => {
        slide.addEventListener("click", (event) => {
          if (index === activeIndex) return;
          if (event.target.closest("a")) {
            event.preventDefault();
            event.stopPropagation();
          }
          goTo(index);
          startAutoplay();
        });
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
          goTo(activeIndex - 1);
          startAutoplay();
        }
        if (event.key === "ArrowRight") {
          goTo(activeIndex + 1);
          startAutoplay();
        }
      });

      wrapper.addEventListener("mouseenter", stopAutoplay);
      wrapper.addEventListener("mouseleave", startAutoplay);

      let resizeTimer;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          measure();
          layout(false);
        }, 100);
      });

      measure();
      layout(false);
      startAutoplay();
    }
  }

  // ===== 4. Dagindeling vacature (.vn-vac-rt--dag) =====
  // Rich text uit het CMS (H4 "07:15 | Titel" + alinea) wordt een Swiper met de site-pijlen (.vn-vac-day__nav).
  async function initDagSlider() {
    const rt = document.querySelector(".vn-vac-rt--dag");
    if (!rt || rt.dataset.vnSlider) return;
    const items = [];
    rt.querySelectorAll("h4").forEach((h) => {
      const next = h.nextElementSibling;
      const p = next && next.tagName === "P" ? next : null;
      const raw = h.textContent.trim();
      const m = raw.match(/^([^|]+)\|\s*(.+)$/);
      items.push({
        time: m ? m[1].trim() : "",
        title: m ? m[2].trim() : raw,
        html: p ? p
          .innerHTML : ""
      });
    });
    if (!items.length) return;
    rt.dataset.vnSlider = "1";

    const swiperEl = document.createElement("div");
    swiperEl.className = "swiper vn-vac-day__swiper";
    const wrap = document.createElement("div");
    wrap.className = "swiper-wrapper";
    items.forEach((it) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide vn-vac-day__slide";
      if (it.time) {
        const t = document.createElement("p");
        t.className = "vn-vac-day__time";
        t.textContent = it.time;
        slide.appendChild(t);
      }
      const h = document.createElement("h3");
      h.className = "vn-vac-day__title";
      h.textContent = it.title;
      slide.appendChild(h);
      if (it.html) {
        const p = document.createElement("p");
        p.className = "vn-vac-day__text";
        p.innerHTML = it.html;
        slide.appendChild(p);
      }
      wrap.appendChild(slide);
    });
    swiperEl.appendChild(wrap);
    rt.replaceWith(swiperEl);

    const nav = document.querySelector(".vn-vac-day__nav");
    if (!window.Swiper) await loadScript(SWIPER_JS);
    makeSwiper(swiperEl, {
      slidesPerView: 1.15,
      spaceBetween: 16,
      speed: 600,
      grabCursor: true,
      watchOverflow: true,
      keyboard: { enabled: true, onlyInViewport: true },
      navigation: nav ?
      {
        prevEl: nav.querySelector(".swiper-prev--prev"),
        nextEl: nav.querySelector(".swiper-next"),
        disabledClass: "is-disabled",
      } : false,
      a11y: {
        prevSlideMessage: "Vorige",
        nextSlideMessage: "Volgende",
        slideLabelMessage: "{{index}} van {{slidesLength}}",
      },
      breakpoints: {
        768: { slidesPerView: 2.2, spaceBetween: 16 },
        992: { slidesPerView: 3, spaceBetween: 24 },
      },
    });
    if (nav) nav.classList.add("is-ready");
  }

  initDagSlider().catch((e) => console.warn("[Visser] dagindeling-slider faalde", e));

  run("cascading-slider", initCascadingSlider);
  initSliders().catch((e) => console.warn("[Visser] sliders faalde", e));
})();


