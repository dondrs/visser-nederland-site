// Visser Nederland – animaties (één GSAP-script, stijl "rustig")
// 12-11-2026: scroll-in animaties ("appear on scroll") verwijderd op verzoek van Visser/DONDRS.
// Wat blijft: de hero bij het laden (kort, eenmalig) en vloeiende hovers met GSAP.
//
// Hovers (alleen op apparaten met muis, niet bij prefers-reduced-motion):
//   - Button__primary en menuknoppen: de witte cirkel schuift 3px op
//   - Tekstlinks in de footer: onderstreping groeit van links naar rechts, tekst wordt wit
//   - Kaarten (nieuws, producten, toepassingen, vacatures, sliders): komen 4px omhoog
//   - Ronde pijlknoppen in kaarten en lijsten: pijl schuift 3px op
// Kleuren en schaduwen blijven in CSS (designsysteem.css), beweging doet GSAP.

(() => {
  const DUR = 0.6;
  const Y = 16;
  const EASE = "power4.out";
  const HOVER = { duration: 0.45, ease: "power3.out", overwrite: "auto" };

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const klaar = () => root.classList.add("vn-anim-done");

  if (reduce || !window.gsap) {
    klaar();
    return;
  }

  // 1. Hero: eyebrow, kop, tekst en knoppen na elkaar bij laden (geen scroll-animatie)
  function hero() {
    const h1 = document.querySelector("main h1, .main-wrapper h1, h1");
    const sectie = h1 && (h1.closest("section, .hero7_section, .section-hero_toepassing") || h1.parentElement);
    if (!sectie) return klaar();
    const items = [
      ...sectie.querySelectorAll(
        ".eyebrow-wrap, h1, h1 + p, h1 ~ p, h1 ~ div p, .button__primary, .button-tert, .blue-button, .horizontal-wrap_m"
      ),
    ].filter(
      (el, i, arr) =>
        !el.closest(".mega-nav, [data-menu-wrap], .vn-topbar, .w-modal") && !arr.some((o) => o !== el && o.contains(el))
    );
    if (!items.length) return klaar();
    gsap.fromTo(
      items,
      { opacity: 0, y: Y },
      { opacity: 1, y: 0, duration: DUR, ease: EASE, stagger: 0.08, delay: 0.1, clearProps: "transform", onStart: klaar }
    );
  }

  // 2. Oude scroll-attributen: alles direct zichtbaar (geen animatie meer)
  function allesZichtbaar() {
    gsap.set("[GSAP-fade], [GSAP-fade] [GSAP-fade='target'], [GSAP-stagger-text], [data-vn-anim], [data-animate-section] *, .parallax-wrapper", {
      opacity: 1,
      clearProps: "transform",
    });
    gsap.set('[gsap-eyebrow="target"]', { width: "100%" });
  }

  // 3. Hovers met GSAP (event delegation, werkt ook voor kaarten die later geladen worden)
  const DOELEN = [
    // [selector van het element waar je overheen gaat, wat er beweegt, animatie in, animatie uit]
    {
      sel: ".button__primary",
      deel: ".button__primary--inner-circle",
      in: { x: 3 },
      uit: { x: 0 },
    },
    {
      sel: ".mega-nav__card-cta",
      deel: ".mega-nav__card-cta-icon",
      in: { x: 3 },
      uit: { x: 0 },
    },
    {
      sel: ".nieuws--item, .section-diensten_link, .locatie_button, .portfolio1_card",
      deel: ".button-circle > .w-embed, .vn-icon",
      in: { x: 3 },
      uit: { x: 0 },
    },
    {
      sel: ".nieuws--item, .vn-pcard, .product-card, .product__item--card, .slider-card, .toepassing-card, .toepassing-card-2, .career_card-filled, .portfolio1_card",
      deel: null,
      in: { y: -4 },
      uit: { y: 0 },
    },
    {
      sel: ".global-footer .footer-link",
      deel: "p",
      in: { backgroundSize: "100% 1px", color: "#ffffff" },
      uit: { backgroundSize: "0% 1px", color: "rgba(250,250,250,0.85)" },
    },
  ];

  function hovers() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const selAll = DOELEN.map((d) => d.sel).join(",");
    const zet = (el, aan) => {
      DOELEN.forEach((d) => {
        if (!el.matches(d.sel)) return;
        const doel = d.deel ? el.querySelectorAll(d.deel) : [el];
        if (!doel.length) return;
        gsap.to(doel, { ...HOVER, ...(aan ? d.in : d.uit) });
      });
    };
    document.addEventListener("pointerover", (e) => {
      const el = e.target.closest && e.target.closest(selAll);
      if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return;
      // ook ouders die zelf een doel zijn (bijv. knop in een kaart) meenemen
      let n = el;
      while (n) {
        if (n.matches(selAll) && !(e.relatedTarget && n.contains(e.relatedTarget))) zet(n, true);
        n = n.parentElement && n.parentElement.closest(selAll);
      }
    });
    document.addEventListener("pointerout", (e) => {
      const el = e.target.closest && e.target.closest(selAll);
      if (!el) return;
      let n = el;
      while (n) {
        if (n.matches(selAll) && !(e.relatedTarget && n.contains(e.relatedTarget))) zet(n, false);
        n = n.parentElement && n.parentElement.closest(selAll);
      }
    });
  }

  try {
    hero();
    allesZichtbaar();
    hovers();
  } catch (e) {
    console.log("animaties.js", e);
  }
  klaar();
  window.VN = window.VN || {};
  window.VN.animaties = true;
})();
