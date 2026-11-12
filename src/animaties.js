// Visser Nederland – animaties (één GSAP-script, stijl "rustig")
// 12-11-2026: scroll-in animaties ("appear on scroll") verwijderd op verzoek van Visser/DONDRS.
// 12-11-2026: ook de hero-animatie bij het laden is weg. Wat blijft: vloeiende hovers met GSAP.
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

  // Oude scroll-/hero-attributen: alles direct zichtbaar (geen animatie meer)
  function allesZichtbaar() {
    // 12-11: [data-animate-section] * eruit; zette ook de donkere laag en laadlaag van de videospeler op opacity 1 (zwart beeld).
    gsap.set(".hero7_section .button__primary, .hero7_section .eyebrow-wrap, [GSAP-fade], [GSAP-fade] [GSAP-fade='target'], [GSAP-stagger-text], [data-vn-anim], .parallax-wrapper", {
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
    allesZichtbaar();
    hovers();
  } catch (e) {
    console.log("animaties.js", e);
  }
  klaar();
  window.VN = window.VN || {};
  window.VN.animaties = true;
})();
