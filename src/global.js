// Visser Nederland – globale scripts (GitHub: dondrs/visser-nederland-site)
// Vervangt de custom code uit Webflow Site settings > Footer (21-10-2026).
// Let op: Slater start dit bestand pas als de HTML van de pagina klaar is: hier dus geen eigen 'pagina klaar'-listeners.
// Volgorde van laden: global.js → sliders.js → componenten.js (zie Slater-loader in de Webflow site-footer).

(() => {
  // --- alles in eigen scope, zodat namen niet botsen met pagina-scripts ---

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onLoad(fn) {
    if (document.readyState === "complete") fn();
    else
      document.addEventListener("readystatechange", function wacht() {
        if (document.readyState !== "complete") return;
        document.removeEventListener("readystatechange", wacht);
        fn();
      });
  }

  // 1. Lenis smooth scroll (uit bij 'minder beweging')
  function initLenis() {
    if (reduceMotion || !window.Lenis || !window.gsap) return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      autoRaf: false,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Ankerlinks soepel laten scrollen
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0, duration: 1.2 });
      });
    });

    window.lenis = lenis;
  }

  // 2. Fade-in van teksten in [data-animate-section] (0,6s, standaardcurve)
  function initAnimateSections() {
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray("[data-animate-section]").forEach((section) => {
      // Elementen die al een Webflow-animatie hebben (GSAP-fade / GSAP-stagger-text) overslaan: anders animeren ze dubbel.
      const items = [...section.querySelectorAll("h1, h2, h3, h4, p, li")].filter(
        (el) => !el.closest('[GSAP-fade="target"], [GSAP-stagger-text]')
      );
      if (!items.length) return;
      gsap.from(items, {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.06,
        ease: "power4.out",
        scrollTrigger: { trigger: section, start: "top 80%", once: true },
      });
    });
  }

  // 3. Mega-navigatie (desktop hover + toetsenbord, mobiel slide-panels)
  function initMegaNavDirectionalHover() {
    const menuWrap = document.querySelector("[data-menu-wrap]");
    if (!menuWrap || !window.gsap) return;

    const DUR = {
      // Animatiestandaard: 0,35s openen/wisselen, 0,2s sluiten
      bgMorph: 0.35,
      contentIn: 0.35,
      contentOut: 0.2,
      stagger: 0.25,
      backdropIn: 0.35,
      backdropOut: 0.2,
      openScale: 0.35,
      closeScale: 0.2,
    };
    const HOVER_ENTER = 120;
    const HOVER_LEAVE = 150;

    const navList = document.querySelector("[data-nav-list]");
    const dropWrapper = document.querySelector("[data-dropdown-wrapper]");
    const dropContainer = document.querySelector("[data-dropdown-container]");
    const backdrop = document.querySelector("[data-menu-backdrop]");
    const toggles = [...document.querySelectorAll("[data-dropdown-toggle]")];
    const panels = [...document.querySelectorAll("[data-nav-content]")];
    const burger = document.querySelector("[data-burger-toggle]");
    const backBtn = document.querySelector("[data-mobile-back]");
    const logo = document.querySelector("[data-menu-logo]");
    const [lineTop, lineMid, lineBot] = ["top", "mid", "bot"].map((id) =>
      document.querySelector("[data-burger-line='" + id + "']")
    );

    const state = {
      isOpen: false,
      activePanel: null,
      activePanelIndex: -1,
      isMobile: window.innerWidth <=
        1279 /* hamburgermenu t/m 1279px (26-10-2026), zie Global-code */ ,
      mobileMenuOpen: false,
      mobilePanelActive: null,
      hoverTimer: null,
      leaveTimer: null,
      tl: null,
      mobileTl: null,
      mobilePanelTl: null,
    };

    const getPanel = (name) => document.querySelector('[data-nav-content="' + name + '"]');
    const getToggle = (name) => document.querySelector('[data-dropdown-toggle="' + name + '"]');
    const getFade = (el) => el.querySelectorAll("[data-menu-fade]");
    const getNavItems = () => navList.querySelectorAll("[data-nav-list-item]");
    const getIndex = (name) => toggles.indexOf(getToggle(name));
    const stagger = (n) => (n <= 1 ? 0 : { amount: DUR.stagger });

    function clearTimers() {
      clearTimeout(state.hoverTimer);
      clearTimeout(state.leaveTimer);
      state.hoverTimer = state.leaveTimer = null;
    }

    function killTl(key) {
      if (state[key]) {
        state[key].kill();
        state[key] = null;
      }
    }

    function killDropdown() {
      killTl("tl");
      gsap.killTweensOf(dropContainer);
      gsap.killTweensOf(backdrop);
      panels.forEach((p) => {
        gsap.killTweensOf(p);
        gsap.killTweensOf(getFade(p));
      });
    }

    function killMobile() {
      killTl("mobileTl");
      gsap.killTweensOf([navList, lineTop, lineMid, lineBot]);
    }

    function killMobilePanel() {
      killTl("mobilePanelTl");
      gsap.killTweensOf(getNavItems());
      gsap.killTweensOf([backBtn, logo]);
      panels.forEach((p) => {
        gsap.killTweensOf(p);
        gsap.killTweensOf(getFade(p));
      });
    }

    function resetToggles() {
      toggles.forEach((t) => t.setAttribute("aria-expanded", "false"));
    }

    function resetDesktop() {
      panels.forEach((p) => {
        gsap.set(p, { visibility: "hidden", opacity: 0, pointerEvents: "none", xPercent: 0 });
        gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 });
      });
      gsap.set(dropContainer, { height: 0 });
      gsap.set(backdrop, { autoAlpha: 0 });
      menuWrap.setAttribute("data-menu-open", "false");
      resetToggles();
    }

    function setupMobile() {
      panels.forEach((p) => {
        gsap.set(p, {
          autoAlpha: 0,
          xPercent: 0,
          visibility: "visible",
          pointerEvents: "none"
        });
        gsap.set(getFade(p), { xPercent: 20, autoAlpha: 0 });
      });
      gsap.set(getNavItems(), { xPercent: 0, y: 0, autoAlpha: 1 });
      gsap.set(navList, { autoAlpha: 0, x: 0 });
      gsap.set(backBtn, { autoAlpha: 0 });
      gsap.set(logo, { autoAlpha: 1 });
      gsap.set(dropContainer, { clearProps: "height" });
      gsap.set(backdrop, { autoAlpha: 0 });
    }

    function measurePanel(name) {
      const el = getPanel(name);
      if (!el) return 0;
      const s = el.style;
      const prev = [s.visibility, s.opacity, s.pointerEvents];
      Object.assign(s, { visibility: "visible", opacity: "0", pointerEvents: "none" });
      const h = el.getBoundingClientRect().height;
      [s.visibility, s.opacity, s.pointerEvents] = prev;
      return h;
    }

    function openDropdown(panelName) {
      if (state.isOpen && state.activePanel === panelName) return;
      if (state.isOpen) return switchPanel(state.activePanel, panelName);

      const height = measurePanel(panelName);
      if (!height) return;

      killDropdown();
      resetDesktop();

      const el = getPanel(panelName);
      const fade = getFade(el);
      const toggle = getToggle(panelName);

      state.isOpen = true;
      state.activePanel = panelName;
      state.activePanelIndex = getIndex(panelName);
      menuWrap.setAttribute("data-menu-open", "true");
      if (toggle) toggle.setAttribute("aria-expanded", "true");

      gsap.set(dropContainer, { height: 0 });

      const tl = gsap.timeline();
      state.tl = tl;
      tl.to(backdrop, { autoAlpha: 1, duration: DUR.backdropIn, ease: "power4.out" }, 0);
      tl.to(dropContainer, { height, duration: DUR.openScale, ease: "power4.out" }, 0);
      tl.set(el, { visibility: "visible", opacity: 1, pointerEvents: "auto" }, 0.05);
      if (fade.length) {
        tl.fromTo(
          fade, { autoAlpha: 0, y: 8 }, {
            autoAlpha: 1,
            y: 0,
            duration: DUR.contentIn,
            stagger: stagger(fade.length),
            ease: "power4.out"
          },
          0.1
        );
      }
    }

    function closeDropdown() {
      if (!state.isOpen) return;
      const el = getPanel(state.activePanel);
      const fade = el ? getFade(el) : [];

      killDropdown();

      const tl = gsap.timeline({
        onComplete() {
          state.isOpen = false;
          state.activePanel = null;
          state.activePanelIndex = -1;
          state.tl = null;
          resetDesktop();
        },
      });
      state.tl = tl;
      if (fade.length) tl.to(fade, {
        autoAlpha: 0,
        y: -4,
        duration: DUR.contentOut * 0.7,
        ease: "power2.in"
      }, 0);
      tl.to(dropContainer, { height: 0, duration: DUR.closeScale, ease: "power2.in" }, 0.05);
      tl.to(backdrop, { autoAlpha: 0, duration: DUR.backdropOut, ease: "power4.out" }, 0);
      if (el) tl.set(el, { visibility: "hidden", opacity: 0, pointerEvents: "none" });
    }

    function switchPanel(fromName, toName) {
      const dir = getIndex(toName) > getIndex(fromName) ? 1 : -1;
      const fromEl = getPanel(fromName);
      const toEl = getPanel(toName);
      if (!fromEl || !toEl) return;

      const fromFade = getFade(fromEl);
      const toFade = getFade(toEl);
      const toHeight = measurePanel(toName);
      if (!toHeight) return;

      killDropdown();

      panels.forEach((p) => {
        gsap.set(p, { visibility: "hidden", opacity: 0, pointerEvents: "none", xPercent: 0 });
        gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 });
      });
      gsap.set(fromEl, { visibility: "visible", opacity: 1, pointerEvents: "auto", x: 0 });
      if (fromFade.length) gsap.set(fromFade, { autoAlpha: 1, x: 0, y: 0 });
      gsap.set(backdrop, { autoAlpha: 1 });

      const toToggle = getToggle(toName);
      state.activePanel = toName;
      state.activePanelIndex = getIndex(toName);
      resetToggles();
      if (toToggle) toToggle.setAttribute("aria-expanded", "true");

      const xOut = dir * -30;
      const xIn = dir * 30;
      const tl = gsap.timeline();
      state.tl = tl;

      if (fromFade.length) tl.to(fromFade, {
        autoAlpha: 0,
        x: xOut,
        duration: DUR.contentOut,
        ease: "power2.in"
      }, 0);
      tl.set(fromEl, { visibility: "hidden", opacity: 0, pointerEvents: "none", xPercent: 0 }, DUR
        .contentOut);
      if (fromFade.length) tl.set(fromFade, { x: 0 }, DUR.contentOut);
      tl.to(dropContainer, { height: toHeight, duration: DUR.bgMorph, ease: "power4.out" }, 0.05);
      tl.set(toEl, { visibility: "visible", opacity: 1, pointerEvents: "auto", xPercent: 0 }, DUR
        .contentOut * 0.5);
      if (toFade.length) {
        tl.fromTo(
          toFade, { autoAlpha: 0, x: xIn }, {
            autoAlpha: 1,
            x: 0,
            duration: DUR.contentIn,
            stagger: stagger(toFade.length),
            ease: "power4.out"
          },
          DUR.contentOut * 0.6
        );
      }
    }

    function handleToggleEnter(e) {
      if (state.isMobile) return;
      const name = e.currentTarget.getAttribute("data-dropdown-toggle");
      if (!name) return;
      clearTimeout(state.leaveTimer);
      state.leaveTimer = null;
      clearTimeout(state.hoverTimer);
      state.hoverTimer = setTimeout(() => openDropdown(name), state.isOpen ? 0 : HOVER_ENTER);
    }

    function handleToggleLeave() {
      if (state.isMobile) return;
      clearTimeout(state.hoverTimer);
      state.hoverTimer = null;
      state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
    }

    function handleWrapperEnter() {
      if (state.isMobile) return;
      clearTimeout(state.leaveTimer);
      state.leaveTimer = null;
    }

    function handleWrapperLeave() {
      if (state.isMobile) return;
      state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
    }

    function handleEscape(e) {
      if (e.key !== "Escape") return;
      if (state.isMobile) {
        if (state.mobilePanelActive) closeMobilePanel();
        else if (state.mobileMenuOpen) closeMobileMenu();
        return;
      }
      if (state.isOpen) {
        const t = getToggle(state.activePanel);
        closeDropdown();
        if (t) t.focus();
      }
    }

    function handleDocClick(e) {
      if (state.isMobile || !state.isOpen) return;
      if (!e.target.closest("[data-menu-wrap]")) closeDropdown();
    }

    function focusFirstLink(panelName) {
      setTimeout(() => {
        const el = getPanel(panelName);
        if (!el) return;
        const link = el.querySelector("a");
        if (!link) return;
        gsap.set(link, { visibility: "visible" });
        link.focus();
      }, 80);
    }

    function handleKeydownOnToggle(e) {
      if (state.isMobile) return;
      const name = e.currentTarget.getAttribute("data-dropdown-toggle");

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (state.isOpen && state.activePanel === name) closeDropdown();
        else {
          openDropdown(name);
          focusFirstLink(name);
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!state.isOpen || state.activePanel !== name) openDropdown(name);
        focusFirstLink(name);
      }
      if (e.key === "Tab" && !e.shiftKey && state.isOpen && state.activePanel === name) {
        e.preventDefault();
        const link = getPanel(name)?.querySelector("a");
        if (link) link.focus();
      }
    }

    function handleKeydownInPanel(e) {
      if (state.isMobile || !state.isOpen) return;
      const el = getPanel(state.activePanel);
      if (!el) return;

      const links = [...el.querySelectorAll("a")];
      const idx = links.indexOf(document.activeElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        links[(idx + 1) % links.length].focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (idx <= 0) {
          const t = getToggle(state.activePanel);
          if (t) t.focus();
        } else links[idx - 1].focus();
      }
      if (e.key === "Tab" && !e.shiftKey && idx === links.length - 1) {
        e.preventDefault();
        const curIdx = toggles.indexOf(getToggle(state.activePanel));
        const next = curIdx < toggles.length - 1 ? toggles[curIdx + 1] : null;
        closeDropdown();
        if (next) next.focus();
      }
      if (e.key === "Tab" && e.shiftKey && idx === 0) {
        e.preventDefault();
        const t = getToggle(state.activePanel);
        if (t) t.focus();
      }
    }

    function animateBurger(toX) {
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
      if (toX) {
        tl.to(lineTop, { y: "0.3125em", duration: 0.15 }, 0);
        tl.to(lineBot, { y: "-0.3125em", duration: 0.15 }, 0);
        tl.to(lineMid, { autoAlpha: 0, duration: 0.1 }, 0.1);
        tl.to(lineTop, { rotation: 45, duration: 0.2 }, 0.15);
        tl.to(lineBot, { rotation: -45, duration: 0.2 }, 0.15);
      } else {
        tl.to(lineTop, { rotation: 0, duration: 0.2 }, 0);
        tl.to(lineBot, { rotation: 0, duration: 0.2 }, 0);
        tl.to(lineTop, { y: 0, duration: 0.15 }, 0.15);
        tl.to(lineBot, { y: 0, duration: 0.15 }, 0.15);
        tl.to(lineMid, { autoAlpha: 1, duration: 0.1 }, 0.15);
      }
      return tl;
    }

    function openMobileMenu() {
      killMobile();
      state.mobileMenuOpen = true;
      menuWrap.setAttribute("data-menu-open", "true");
      burger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      if (window.lenis) window.lenis.stop();

      const items = getNavItems();
      const tl = gsap.timeline();
      state.mobileTl = tl;
      tl.add(animateBurger(true), 0);
      tl.to(navList, { autoAlpha: 1, duration: 0.3, ease: "power4.out" }, 0);
      if (items.length) {
        tl.fromTo(
          items, { autoAlpha: 0, y: 12 }, {
            autoAlpha: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.04,
            ease: "power4.out"
          },
          0.15
        );
      }
    }

    function closeMobileMenu() {
      const hadPanel = state.mobilePanelActive;
      const panelEl = hadPanel ? getPanel(hadPanel) : null;

      killMobile();
      killMobilePanel();

      menuWrap.setAttribute("data-menu-open", "false");
      state.mobileMenuOpen = false;
      state.mobilePanelActive = null;
      burger.setAttribute("aria-expanded", "false");

      const tl = gsap.timeline({
        onComplete() {
          document.body.style.overflow = "";
          if (window.lenis) window.lenis.start();
          state.mobileTl = null;
          setupMobile();
        },
      });
      state.mobileTl = tl;

      tl.add(animateBurger(false), 0);
      if (hadPanel && panelEl) {
        tl.to(panelEl, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0.05);
        tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0.05);
      }
      tl.to(navList, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0.05);
    }

    function openMobilePanel(panelName) {
      const el = getPanel(panelName);
      if (!el) return;
      killMobilePanel();
      state.mobilePanelActive = panelName;

      const navItems = getNavItems();
      const panelFade = getFade(el);

      const tl = gsap.timeline();
      state.mobilePanelTl = tl;

      if (navItems.length) {
        tl.to(navItems, {
          xPercent: -10,
          autoAlpha: 0,
          duration: 0.35,
          stagger: 0.03,
          ease: "power2.in"
        }, 0);
      }
      tl.to(logo, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0);
      tl.to(backBtn, { autoAlpha: 1, duration: 0.35, ease: "power4.out" }, 0.15);
      tl.set(el, { autoAlpha: 1, xPercent: 0, pointerEvents: "auto" }, 0.2);
      if (panelFade.length) {
        tl.fromTo(
          panelFade, { xPercent: 8, autoAlpha: 0 }, {
            xPercent: 0,
            autoAlpha: 1,
            duration: 0.3,
            stagger: stagger(panelFade.length),
            ease: "power4.out"
          },
          0.25
        );
      }
    }

    function closeMobilePanel() {
      if (!state.mobilePanelActive) return;
      const el = getPanel(state.mobilePanelActive);
      if (!el) return;
      killMobilePanel();

      const navItems = getNavItems();
      const panelFade = getFade(el);

      const tl = gsap.timeline({
        onComplete() {
          state.mobilePanelActive = null;
          state.mobilePanelTl = null;
        },
      });
      state.mobilePanelTl = tl;

      if (panelFade.length) {
        tl.to(el, { xPercent: 20, autoAlpha: 0, duration: 0.3, stagger: 0.02, ease: "power2.in" },
          0);
      }
      tl.set(el, { autoAlpha: 0, pointerEvents: "none" }, 0.25);
      tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0);
      tl.to(logo, { autoAlpha: 1, duration: 0.25, ease: "power4.out" }, 0.15);
      if (navItems.length) {
        tl.fromTo(
          navItems, { xPercent: -20, autoAlpha: 0 }, {
            xPercent: 0,
            autoAlpha: 1,
            duration: 0.35,
            stagger: 0.03,
            ease: "power4.out"
          },
          0.25
        );
      }
    }

    function handleToggleClick(e) {
      if (!state.isMobile || !state.mobileMenuOpen) return;
      const name = e.currentTarget.getAttribute("data-dropdown-toggle");
      if (name) {
        e.preventDefault();
        openMobilePanel(name);
      }
    }

    let resizeTimer = null;
    let lastWidth = window.innerWidth;

    function handleResize() {
      const w = window.innerWidth;
      if (w === lastWidth) return;
      lastWidth = w;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const was = state.isMobile;
        state.isMobile = window.innerWidth <=
          1279 /* hamburgermenu t/m 1279px (26-10-2026), zie Global-code */ ;

        if (was && !state.isMobile) {
          killMobile();
          killMobilePanel();
          gsap.set(navList, { clearProps: "all" });
          gsap.set(getNavItems(), { clearProps: "all" });
          gsap.set(backBtn, { autoAlpha: 0 });
          gsap.set(logo, { clearProps: "all" });
          gsap.set([lineTop, lineMid, lineBot], { rotation: 0, y: 0, autoAlpha: 1 });
          burger.setAttribute("aria-expanded", "false");
          state.mobileMenuOpen = false;
          state.mobilePanelActive = null;
          document.body.style.overflow = "";
          if (window.lenis) window.lenis.start();
          resetDesktop();
        }
        if (!was && state.isMobile) {
          killDropdown();
          state.isOpen = false;
          state.activePanel = null;
          state.activePanelIndex = -1;
          clearTimers();
          menuWrap.setAttribute("data-menu-open", "false");
          resetToggles();
          setupMobile();
        }
      }, 150);
    }

    toggles.forEach((btn) => {
      btn.addEventListener("mouseenter", handleToggleEnter);
      btn.addEventListener("mouseleave", handleToggleLeave);
      btn.addEventListener("keydown", handleKeydownOnToggle);
      btn.addEventListener("click", handleToggleClick);
    });
    if (dropWrapper) {
      dropWrapper.addEventListener("mouseenter", handleWrapperEnter);
      dropWrapper.addEventListener("mouseleave", handleWrapperLeave);
    }
    panels.forEach((p) => p.addEventListener("keydown", handleKeydownInPanel));
    if (backdrop) backdrop.addEventListener("click", closeDropdown);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("click", handleDocClick);
    if (burger) burger.addEventListener("click", () => (state.mobileMenuOpen ? closeMobileMenu() :
      openMobileMenu()));
    if (backBtn) backBtn.addEventListener("click", closeMobilePanel);
    window.addEventListener("resize", handleResize);

    if (state.isMobile) setupMobile();
    else resetDesktop();
  }

  // 5. Cookiebanner (consent-default + GTM blijven in de Webflow head)
  function initCookieBanner() {
    const banner = document.getElementById("cookie-banner");
    if (!banner) return;
    const storageKey = "vn_cookie_consent";

    const showBanner = () => {
      banner.style.display = "block";
      banner.style.opacity = "1";
      banner.style.visibility = "visible";
    };
    const hideBanner = () => {
      banner.style.display = "none";
    };

    function saveChoice(value) {
      const previous = window.vnConsent;
      try {
        localStorage.setItem(storageKey, JSON.stringify({ value, ts: Date.now() }));
        localStorage.removeItem("cookie_banner_hidden_until");
      } catch (e) {}
      window.vnConsent = value;
      const s = value === "granted" ? "granted" : "denied";
      if (window.gtag) {
        gtag("consent", "update", {
          ad_storage: s,
          ad_user_data: s,
          ad_personalization: s,
          analytics_storage: s,
        });
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "cookie_consent_update", cookie_consent: value });
      if (value === "granted" && window.vnLoadContentsquare) window.vnLoadContentsquare();
      hideBanner();
      // Toestemming ingetrokken: herladen zodat geladen trackers stoppen
      if (previous === "granted" && value === "denied") window.location.reload();
    }

    if (window.vnConsent) hideBanner();
    else showBanner();

    document.addEventListener("click", (e) => {
      const t = e.target.closest(
        "#cookie-accept, #cookie-decline, #cookie-close, [data-cookie-settings]");
      if (!t) return;
      e.preventDefault();
      if (t.id === "cookie-accept") saveChoice("granted");
      else if (t.id === "cookie-decline" || t.id === "cookie-close") saveChoice("denied");
      else showBanner();
    });
  }

  // Start
  function run(name, fn) {
    try {
      fn();
    } catch (e) {
      console.warn("[Visser] " + name + " faalde", e);
    }
  }

  run("cookiebanner", initCookieBanner);
  run("mega-nav", initMegaNavDirectionalHover);
  run("lenis", initLenis);
  // animate-sections: verhuisd naar animaties.js (11-11-2026)

  // ===== 6. Hulpfunctie: externe bibliotheek één keer laden =====
  const loadedScripts = {};

  function loadScript(src) {
    if (!loadedScripts[src]) {
      loadedScripts[src] = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return loadedScripts[src];
  }

  // ===== 7. Video (Bunny HLS-speler) – alleen op pagina's met een speler =====
  // hls.js wordt alleen geladen als er een .m3u8-stream staat en de browser HLS niet zelf kan (Safari wel).
  function isHlsSrc(src) {
    return /\.m3u8(\?|$)/i.test(src || "");
  }

  async function initVideo() {
    const players = document.querySelectorAll(
      "[data-bunny-player-init], [data-bunny-background-init]");
    if (!players.length) return;
    const needsHls = [...players].some((p) => isHlsSrc(p.getAttribute("data-player-src")));
    const safariNative = !!document.createElement("video").canPlayType(
      "application/vnd.apple.mpegurl");
    if (needsHls && !safariNative && !window.Hls) {
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/hls.js@1.6.11");
      } catch (e) {
        console.warn("[Visser] hls.js laden faalde", e);
      }
    }
    run("video-achtergrond", initBunnyPlayerBackground);
    run("video-speler", initBunnyPlayerBasic);
  }

  function initBunnyPlayerBackground() {
    document.querySelectorAll("[data-bunny-background-init]").forEach(function (player) {
      var src = player.getAttribute("data-player-src");
      if (!src) return;

      var video = player.querySelector("video");
      if (!video) return;

      try { video.pause(); } catch (_) {}
      try {
        video.removeAttribute("src");
        video.load();
      } catch (_) {}

      function setStatus(s) {
        if (player.getAttribute("data-player-status") !== s) player.setAttribute(
          "data-player-status", s);
      }

      function setActivated(v) {
        player.setAttribute("data-player-activated", v ? "true" :
          "false");
      }
      if (!player.hasAttribute("data-player-activated")) setActivated(false);

      var lazyMode = player.getAttribute("data-player-lazy");
      var isLazyTrue = lazyMode === "true";
      var autoplay = player.getAttribute("data-player-autoplay") === "true";
      var initialMuted = player.getAttribute("data-player-muted") === "true";
      var pendingPlay = false;

      if (autoplay) {
        video.muted = true;
        video.loop = true;
      }
      else { video.muted = initialMuted; }

      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.playsInline = true;
      if (typeof video.disableRemotePlayback !== "undefined") video.disableRemotePlayback =
        true;
      if (autoplay) video.autoplay = false;

      var isSafariNative = !!video.canPlayType("application/vnd.apple.mpegurl");
      var canUseHlsJs = isHlsSrc(src) && !!(window.Hls && Hls.isSupported()) && !
        isSafariNative;

      var isAttached = false;
      var lastPauseBy = "";

      function attachMediaOnce() {
        if (isAttached) return;
        isAttached = true;
        if (player._hls) { try { player._hls.destroy(); } catch (_) {} player._hls = null; }

        if (isSafariNative) {
          video.preload = isLazyTrue ? "none" : "auto";
          video.src = src;
          video.addEventListener("loadedmetadata", function () {
            readyIfIdle(player,
              pendingPlay);
          }, { once: true });
        } else if (canUseHlsJs) {
          var hls = new Hls({ maxBufferLength: 10 });
          hls.attachMedia(video);
          hls.on(Hls.Events.MEDIA_ATTACHED, function () { hls.loadSource(src); });
          hls.on(Hls.Events.MANIFEST_PARSED, function () {
            readyIfIdle(player,
              pendingPlay);
          });
          player._hls = hls;
        } else {
          video.src = src;
        }
      }

      if (isLazyTrue) video.preload = "none";
      else attachMediaOnce();

      function togglePlay() {
        if (video.paused || video.ended) {
          if (isLazyTrue && !isAttached) attachMediaOnce();
          pendingPlay = true;
          lastPauseBy = "";
          setStatus("loading");
          safePlay(video);
        } else {
          lastPauseBy = "manual";
          video.pause();
        }
      }

      function toggleMute() {
        video.muted = !video.muted;
        player.setAttribute("data-player-muted", video.muted ? "true" : "false");
      }

      player.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-player-control]");
        if (!btn || !player.contains(btn)) return;
        var type = btn.getAttribute("data-player-control");
        if (type === "play" || type === "pause" || type === "playpause") togglePlay();
        else if (type === "mute") toggleMute();
      });

      video.addEventListener("play", function () {
        setActivated(true);
        setStatus("playing");
      });
      video.addEventListener("playing", function () {
        pendingPlay = false;
        setStatus("playing");
      });
      video.addEventListener("pause", function () {
        pendingPlay = false;
        setStatus("paused");
      });
      video.addEventListener("waiting", function () { setStatus("loading"); });
      video.addEventListener("canplay", function () { readyIfIdle(player, pendingPlay); });
      video.addEventListener("ended", function () {
        pendingPlay = false;
        setStatus("paused");
        setActivated(false);
      });

      if (autoplay) {
        if (player._io) { try { player._io.disconnect(); } catch (_) {} }
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var inView = entry.isIntersecting && entry.intersectionRatio > 0;
            if (inView) {
              if (isLazyTrue && !isAttached) attachMediaOnce();
              if (lastPauseBy === "io" || (video.paused && lastPauseBy !==
                  "manual")) {
                setStatus("loading");
                if (video.paused) togglePlay();
                lastPauseBy = "";
              }
            } else if (!video.paused && !video.ended) {
              lastPauseBy = "io";
              video.pause();
            }
          });
        }, { threshold: 0.1 });
        io.observe(player);
        player._io = io;
      }
    });

    function readyIfIdle(player, pendingPlay) {
      if (!pendingPlay && player.getAttribute("data-player-activated") !== "true" && player
        .getAttribute("data-player-status") === "idle") {
        player.setAttribute("data-player-status", "ready");
      }
    }

    function safePlay(video) {
      var p = video.play();
      if (p && typeof p.then === "function") p.catch(function () {});
    }
  }

  function initBunnyPlayerBasic() {
    document.querySelectorAll("[data-bunny-player-init]").forEach(function (player) {
      var src = player.getAttribute("data-player-src");
      if (!src) return;

      var video = player.querySelector("video");
      if (!video) return;

      try { video.pause(); } catch (_) {}
      try {
        video.removeAttribute("src");
        video.load();
      } catch (_) {}

      function setStatus(s) {
        if (player.getAttribute("data-player-status") !== s) player.setAttribute(
          "data-player-status", s);
      }

      function setActivated(v) {
        player.setAttribute("data-player-activated", v ? "true" :
          "false");
      }
      if (!player.hasAttribute("data-player-activated")) setActivated(false);

      var updateSize = player.getAttribute("data-player-update-size");
      var lazyMode = player.getAttribute("data-player-lazy");
      var isLazyTrue = lazyMode === "true";
      var isLazyMeta = lazyMode === "meta";
      var autoplay = player.getAttribute("data-player-autoplay") === "true";
      var pendingPlay = false;

      video.muted = !!autoplay;
      if (autoplay) video.loop = true;

      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.playsInline = true;
      if (typeof video.disableRemotePlayback !== "undefined") video.disableRemotePlayback =
        true;
      if (autoplay) video.autoplay = false;

      var isSafariNative = !!video.canPlayType("application/vnd.apple.mpegurl");
      var canUseHlsJs = isHlsSrc(src) && !!(window.Hls && Hls.isSupported()) && !
        isSafariNative;

      if (updateSize === "true" && !isLazyMeta && !isLazyTrue) {
        var prev = video.preload;
        video.preload = "metadata";
        var onMeta2 = function () {
          setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
          video.removeEventListener("loadedmetadata", onMeta2);
          video.preload = prev || "";
        };
        video.addEventListener("loadedmetadata", onMeta2, { once: true });
        video.src = src;
      }

      function fetchMetaOnce() {
        getSourceMeta(src, canUseHlsJs).then(function (meta) {
          if (meta.width && meta.height) setBeforeRatio(player, updateSize, meta.width,
            meta.height);
          readyIfIdle(player, pendingPlay);
        });
      }

      var isAttached = false;
      var lastPauseBy = "";

      function attachMediaOnce() {
        if (isAttached) return;
        isAttached = true;
        if (player._hls) { try { player._hls.destroy(); } catch (_) {} player._hls = null; }

        if (isSafariNative) {
          video.preload = isLazyTrue || isLazyMeta ? "auto" : video.preload;
          video.src = src;
          video.addEventListener("loadedmetadata", function () {
            readyIfIdle(player, pendingPlay);
            if (updateSize === "true") setBeforeRatio(player, updateSize, video
              .videoWidth, video.videoHeight);
          }, { once: true });
        } else if (canUseHlsJs) {
          var hls = new Hls({ maxBufferLength: 10 });
          hls.attachMedia(video);
          hls.on(Hls.Events.MEDIA_ATTACHED, function () { hls.loadSource(src); });
          hls.on(Hls.Events.MANIFEST_PARSED, function () {
            readyIfIdle(player, pendingPlay);
            if (updateSize === "true") {
              var best = bestLevel(hls.levels || []);
              if (best && best.width && best.height) setBeforeRatio(player, updateSize,
                best.width, best.height);
            }
          });
          player._hls = hls;
        } else {
          video.src = src;
        }
      }

      if (isLazyMeta) {
        if (updateSize === "true") fetchMetaOnce();
        video.preload = "none";
      } else if (isLazyTrue) {
        video.preload = "none";
      } else {
        attachMediaOnce();
      }

      function togglePlay() {
        if (video.paused || video.ended) {
          if ((isLazyTrue || isLazyMeta) && !isAttached) attachMediaOnce();
          pendingPlay = true;
          lastPauseBy = "";
          setStatus("loading");
          safePlay(video);
        } else {
          lastPauseBy = "manual";
          video.pause();
        }
      }

      function toggleMute() {
        video.muted = !video.muted;
        player.setAttribute("data-player-muted", video.muted ? "true" : "false");
      }

      player.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-player-control]");
        if (!btn || !player.contains(btn)) return;
        var type = btn.getAttribute("data-player-control");
        if (type === "play" || type === "pause" || type === "playpause") togglePlay();
        else if (type === "mute") toggleMute();
      });

      video.addEventListener("play", function () {
        setActivated(true);
        setStatus("playing");
      });
      video.addEventListener("playing", function () {
        pendingPlay = false;
        setStatus("playing");
      });
      video.addEventListener("pause", function () {
        pendingPlay = false;
        setStatus("paused");
      });
      video.addEventListener("waiting", function () { setStatus("loading"); });
      video.addEventListener("canplay", function () { readyIfIdle(player, pendingPlay); });
      video.addEventListener("ended", function () {
        pendingPlay = false;
        setStatus("paused");
        setActivated(false);
      });

      var ratioSet = false;

      function maybeSetRatioOnce() {
        if (ratioSet || updateSize !== "true") return;
        var before = player.querySelector("[data-player-before]");
        if (!before) return;
        if (video.videoWidth && video.videoHeight) {
          before.style.paddingTop = (video.videoHeight / video.videoWidth) * 100 + "%";
          ratioSet = true;
        }
      }
      video.addEventListener("loadedmetadata", maybeSetRatioOnce);
      video.addEventListener("loadeddata", maybeSetRatioOnce);
      video.addEventListener("playing", maybeSetRatioOnce);

      function setHover(state) {
        if (player.getAttribute("data-player-hover") !== state) player.setAttribute(
          "data-player-hover", state);
      }
      player.addEventListener("pointerenter", function () { setHover("active"); });
      player.addEventListener("pointerleave", function () { setHover("idle"); });

      if (autoplay) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var inView = entry.isIntersecting && entry.intersectionRatio > 0;
            if (inView) {
              if ((isLazyTrue || isLazyMeta) && !isAttached) attachMediaOnce();
              if (lastPauseBy === "io" || (video.paused && lastPauseBy !==
                  "manual")) {
                setStatus("loading");
                if (video.paused) togglePlay();
                lastPauseBy = "";
              }
            } else if (!video.paused && !video.ended) {
              lastPauseBy = "io";
              video.pause();
            }
          });
        }, { threshold: 0.1 });
        io.observe(player);
      }
    });

    function readyIfIdle(player, pendingPlay) {
      if (!pendingPlay && player.getAttribute("data-player-activated") !== "true" && player
        .getAttribute("data-player-status") === "idle") {
        player.setAttribute("data-player-status", "ready");
      }
    }

    function setBeforeRatio(player, updateSize, w, h) {
      if (updateSize !== "true" || !w || !h) return;
      var before = player.querySelector("[data-player-before]");
      if (!before) return;
      before.style.paddingTop = (h / w) * 100 + "%";
    }

    function bestLevel(levels) {
      if (!levels || !levels.length) return null;
      return levels.reduce(function (a, b) { return (b.width || 0) > (a.width || 0) ? b : a; },
        levels[0]);
    }

    function safePlay(video) {
      var p = video.play();
      if (p && typeof p.then === "function") p.catch(function () {});
    }

    function resolveUrl(base, rel) {
      try { return new URL(rel, base).toString(); } catch (_) { return rel; }
    }

    function getSourceMeta(src, useHlsJs) {
      return new Promise(function (resolve) {
        if (useHlsJs && window.Hls && Hls.isSupported()) {
          try {
            var tmp = new Hls();
            var out = { width: 0, height: 0, duration: NaN };
            tmp.on(Hls.Events.MANIFEST_PARSED, function (e, data) {
              var best = bestLevel((data && data.levels) || tmp.levels || []);
              if (best && best.width && best.height) {
                out.width = best.width;
                out.height = best.height;
              }
            });
            tmp.on(Hls.Events.LEVEL_LOADED, function (e, data) {
              if (data && data.details && isFinite(data.details.totalduration)) out
                .duration = data.details.totalduration;
              try { tmp.destroy(); } catch (_) {}
              resolve(out);
            });
            tmp.on(Hls.Events.ERROR, function () {
              try { tmp.destroy(); } catch (_) {} resolve
                (out);
            });
            tmp.loadSource(src);
            return;
          } catch (_) {
            resolve({ width: 0, height: 0, duration: NaN });
            return;
          }
        }

        function parseMaster(masterText) {
          var lines = masterText.split(/\r?\n/);
          var bestW = 0,
            bestH = 0,
            firstMedia = null,
            lastInf = null;
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf("#EXT-X-STREAM-INF:") === 0) {
              lastInf = line;
            } else if (lastInf && line && line[0] !== "#") {
              if (!firstMedia) firstMedia = line.trim();
              var m = /RESOLUTION=(\d+)x(\d+)/.exec(lastInf);
              if (m) {
                var w = parseInt(m[1], 10),
                  h = parseInt(m[2], 10);
                if (w > bestW) {
                  bestW = w;
                  bestH = h;
                }
              }
              lastInf = null;
            }
          }
          return { bestW: bestW, bestH: bestH, media: firstMedia };
        }

        function sumDuration(mediaText) {
          var dur = 0,
            re = /#EXTINF:([\d.]+)/g,
            m;
          while ((m = re.exec(mediaText))) dur += parseFloat(m[1]);
          return dur;
        }

        fetch(src, { credentials: "omit", cache: "no-store" })
          .then(function (r) { if (!r.ok) throw new Error("master"); return r.text(); })
          .then(function (master) {
            var info = parseMaster(master);
            if (!info.media) {
              resolve({
                width: info.bestW || 0,
                height: info.bestH || 0,
                duration: NaN
              });
              return;
            }
            return fetch(resolveUrl(src, info.media), {
                credentials: "omit",
                cache: "no-store"
              })
              .then(function (r) { if (!r.ok) throw new Error("media"); return r.text(); })
              .then(function (mediaText) {
                resolve({
                  width: info.bestW || 0,
                  height: info.bestH || 0,
                  duration: sumDuration(mediaText)
                });
              });
          })
          .catch(function () { resolve({ width: 0, height: 0, duration: NaN }); });
      });
    }
  }

  // ===== 8. Live zoeken (list.js) – Vestigingen, Vacatures, Up-to-Date =====
  async function initLiveSearch() {
    const roots = document.querySelectorAll("[data-live-search]");
    if (!roots.length) return;
    if (!window.List) await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/list.js/2.3.1/list.min.js");

    roots.forEach(function (root) {
      const input = root.querySelector("[data-live-search-input]");
      const notFound = root.querySelector("[data-live-search-not-found]");
      const list = new List(root, {
        listClass: "live-search__list",
        valueNames: ["live-search__name", "live-search__keywords"],
        fuzzySearch: { location: 0, distance: 100, threshold: 0.3 },
      });

      function updateNotFound() {
        if (!notFound) return;
        const q = (input && input.value ? input.value : "").trim();
        if (list.matchingItems.length === 0 && q !== "") {
          notFound.style.display = "block";
          const p = notFound.querySelector("p");
          if (p) p.textContent = "Geen resultaten voor “" + q +
            "”. Probeer een andere zoekterm.";
        } else {
          notFound.style.display = "none";
        }
      }

      function runSearch() {
        const q = (input && input.value ? input.value : "").trim();
        if (!q) list.search();
        else if (typeof list.fuzzySearch === "function") list.fuzzySearch(q);
        else list.search(q, ["live-search__name", "live-search__keywords"]);
        updateNotFound();
      }

      if (input) input.addEventListener("input", runSearch);
      root._pageSearchList = list;
      list.search();
      updateNotFound();
    });
  }

  // ===== 9. Openingstijden (open/gesloten-status) =====
  function initOpeningHours() {
    const defaultTimezone = "Europe/Amsterdam";
    const timeTables = document.querySelectorAll("[data-opening-hours-init]");
    if (!timeTables.length) return;

    timeTables.forEach((root) => {
      const tz = root.getAttribute("data-opening-hours-timezone") || defaultTimezone;
      const timeToMinutes = (str) => {
        const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(str || "");
        return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
      };
      const getNowParts = () => {
        let useTz = tz;
        try { new Intl.DateTimeFormat("en-GB", { timeZone: tz }); } catch (e) {
          useTz =
            defaultTimezone;
        }
        const fmt = new Intl.DateTimeFormat("en-GB", {
          timeZone: useTz,
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });
        const map = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p
          .value
        ]));
        return {
          weekdayIdx: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(map
            .weekday),
          hour: parseInt(map.hour, 10),
          minute: parseInt(map.minute, 10),
        };
      };

      const dayIndex = {
        monday: 0,
        tuesday: 1,
        wednesday: 2,
        thursday: 3,
        friday: 4,
        saturday: 5,
        sunday: 6
      };
      const rows = Array.from(root.querySelectorAll("[data-opening-hours-day]"));
      if (!rows.length) return;

      const ordered = new Array(7);
      rows.forEach((r) => {
        const d = (r.getAttribute("data-opening-hours-day") || "").trim().toLowerCase();
        if (d in dayIndex) ordered[dayIndex[d]] = r;
      });
      if (ordered.some((r) => !r)) return;

      const schedule = ordered.map((row) => {
        const openMin = timeToMinutes((row.getAttribute("data-opening-hours-open") || "")
          .trim());
        const closeMin = timeToMinutes((row.getAttribute("data-opening-hours-close") ||
          "").trim());
        if (openMin == null || closeMin == null) return {
          open: false,
          openMin: 0,
          closeMin: 0,
          overnight: false
        };
        return { open: true, openMin, closeMin, overnight: openMin > closeMin };
      });

      const evaluate = () => {
        const now = getNowParts();
        const curIdx = now.weekdayIdx;
        const nowMin = now.hour * 60 + now.minute;
        ordered.forEach((r) => r.removeAttribute("data-opening-hours-current-day"));
        ordered[curIdx].setAttribute("data-opening-hours-current-day", "");

        const today = schedule[curIdx];
        const yesterday = schedule[(curIdx + 6) % 7];
        let isOpen = false;
        if (today.open) {
          isOpen = today.overnight ? nowMin >= today.openMin || nowMin < today.closeMin :
            nowMin >= today.openMin && nowMin < today.closeMin;
        }
        if (!isOpen && yesterday.open && yesterday.overnight && nowMin < yesterday.closeMin)
          isOpen = true;

        ordered.forEach((row, idx) => row.setAttribute("data-opening-hours-status", idx ===
          curIdx && isOpen ? "open" : "closed"));
        root.setAttribute("data-opening-hours-store-status", isOpen ? "open" : "closed");
      };

      evaluate();
      clearInterval(root._openingHoursTimer);
      root._openingHoursTimer = setInterval(evaluate, 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden)
          evaluate();
      });
    });
  }

  initVideo().catch((e) => console.warn("[Visser] video faalde", e));
  initLiveSearch().catch((e) => console.warn("[Visser] live-search faalde", e));
  run("openingstijden", initOpeningHours);

  // ===== Hulpfuncties beschikbaar maken voor sliders.js en componenten.js =====
  window.VN = { run, onLoad, loadScript, reduceMotion };
})();

// Animatiestandaard voor alle Slater-bestanden (11-2026). Gelijk aan --vn-ease / --vn-dur in de site-head.
// power4.out ligt het dichtst bij cubic-bezier(.23,1,.32,1). Uitgaand mag sneller: power2.in, 0,2s.
window.VN = Object.assign(window.VN || {}, {
  EASE: "power4.out",
  EASE_UIT: "power2.in",
  DUR: { snel: 0.2, basis: 0.35, traag: 0.6 },
});


