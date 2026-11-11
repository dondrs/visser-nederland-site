// Visser Nederland – animaties (één GSAP-script, stijl "rustig", 11-11-2026)
// Vervangt de Webflow-interacties op content (Pageload Hero, Page load interaction 2 en 5,
// Elements Fade In Scroll, GSAP Text Fade, Eyebrow Line Grow, Scroll interaction 3 en 4)
// en initAnimateSections uit global.js.
//
// Gebruik in Webflow (attributen):
//   data-vn-anim="fade-up"   blok komt rustig omhoog in beeld
//   data-vn-anim="stagger"   de directe kinderen komen na elkaar (60 ms) in beeld
//   data-vn-anim="none"      niets animeren binnen dit element
// Oude attributen blijven werken: GSAP-fade, GSAP-stagger-text, gsap-eyebrow, data-animate-section.
//
// Standaard: 0,6s, 16px, power4.out (= --vn-ease), eenmalig. prefers-reduced-motion: geen beweging.

(() => {
  const DUR = 0.6;
  const Y = 16;
  const STAGGER = 0.06;
  const EASE = "power4.out";
  const START = "top 85%";

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const klaar = () => root.classList.add("vn-anim-done");

  if (reduce || !window.gsap) {
    klaar();
    return;
  }
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const gedaan = new Set();
  const vrij = (el) =>
    el &&
    !gedaan.has(el) &&
    !el.closest('[data-vn-anim="none"], .mega-nav, [data-menu-wrap], .vn-topbar, .w-modal, [class*="modal"]');

  function zichtbaar(els) {
    gsap.set(els, { opacity: 1, y: 0, clearProps: "transform" });
  }

  // 1. Hero: eyebrow, kop, tekst en knoppen na elkaar bij laden
  function hero() {
    const h1 = document.querySelector("main h1, .main-wrapper h1, h1");
    const sectie = h1 && (h1.closest("section, .hero7_section, .section-hero_toepassing") || h1.parentElement);
    if (!sectie) return klaar();
    const items = [
      ...sectie.querySelectorAll(
        ".eyebrow-wrap, h1, h1 + p, h1 ~ p, h1 ~ div p, .button__primary, .button-tert, .blue-button, .horizontal-wrap_m"
      ),
    ].filter((el, i, arr) => vrij(el) && !arr.some((o) => o !== el && o.contains(el)));
    items.forEach((el) => gedaan.add(el));
    gsap.fromTo(
      items,
      { opacity: 0, y: Y },
      { opacity: 1, y: 0, duration: DUR, ease: EASE, stagger: 0.08, delay: 0.1, clearProps: "transform", onStart: klaar }
    );
    // Overige elementen in de hero meteen tonen (geen scroll-animatie meer)
    sectie.querySelectorAll("[GSAP-fade], [GSAP-stagger-text], [data-vn-anim]").forEach((el) => gedaan.add(el));
  }

  // 2. Binnenkomen bij scrollen
  function bijScroll(trigger, els) {
    els = els.filter(vrij);
    if (!els.length) return;
    els.forEach((el) => gedaan.add(el));
    gsap.set(els, { opacity: 0, y: Y });
    const speel = () =>
      gsap.to(els, { opacity: 1, y: 0, duration: DUR, ease: EASE, stagger: STAGGER, clearProps: "transform" });
    if (!window.ScrollTrigger) return speel();
    ScrollTrigger.create({ trigger, start: START, once: true, onEnter: speel });
  }

  function scroll() {
    // nieuw
    document.querySelectorAll('[data-vn-anim="stagger"]').forEach((el) => bijScroll(el, [...el.children]));
    document.querySelectorAll('[data-vn-anim="fade-up"]').forEach((el) => bijScroll(el, [el]));
    // oud: GSAP-fade (trigger met targets)
    document.querySelectorAll('[GSAP-fade="trigger"]').forEach((t) => {
      const doelen = [...t.querySelectorAll('[GSAP-fade="target"]')];
      bijScroll(t, doelen.length ? doelen : [t]);
    });
    // oud: GSAP-stagger-text (nu als blok, zonder woorden te splitsen)
    document.querySelectorAll('[GSAP-stagger-text="trigger"], [GSAP-stagger-text]').forEach((el) => bijScroll(el, [el]));
    // oud: data-animate-section (koppen, tekst en lijstitems na elkaar)
    document.querySelectorAll("[data-animate-section]").forEach((s) =>
      bijScroll(s, [...s.querySelectorAll("h1, h2, h3, h4, p, li")])
    );
    // oud: parallax-wrapper (was schalen met scrub) → rustig binnenkomen
    document.querySelectorAll(".parallax-wrapper").forEach((el) => bijScroll(el, [el]));
  }

  // 3. Eyebrow-lijn groeit (gsap-eyebrow)
  function eyebrowLijnen() {
    document.querySelectorAll('[gsap-eyebrow="trigger"]').forEach((t) => {
      const lijnen = [...t.querySelectorAll('[gsap-eyebrow="target"]')];
      if (!lijnen.length) return;
      gsap.set(lijnen, { width: "0%" });
      const speel = () => gsap.to(lijnen, { width: "100%", duration: DUR, ease: EASE });
      if (!window.ScrollTrigger) return speel();
      ScrollTrigger.create({ trigger: t, start: START, once: true, onEnter: speel });
    });
  }

  try {
    hero();
    scroll();
    eyebrowLijnen();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  } catch (e) {
    console.log("animaties.js", e);
    zichtbaar("[GSAP-fade], [GSAP-stagger-text], [data-vn-anim], [data-animate-section] *");
  }
  klaar();
  window.VN = window.VN || {};
  window.VN.animaties = true;
})();
