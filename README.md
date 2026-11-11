# Visser Nederland – eigen scripts

Eigen JavaScript voor de Webflow-site van Visser Nederland (vissernederland.nl). Beheerd door DONDRS.
Vervangt Slater (11-11-2026). Webflow laadt de bestanden via jsDelivr.

## Bestanden (`src/`), in laadvolgorde
| Bestand | Wat |
|---|---|
| `global.js` | basis: cookiebanner, mega-menu, Lenis, video, zoeken, openingstijden. Levert `window.VN` (EASE, DUR). Moet als eerste laden. |
| `sliders.js` | alle sliders (Swiper 11 + cascading slider) |
| `componenten.js` | tabs, tijdlijn, stapelkaarten, social share, productformulier, productkaarten, productpagina, productfilters |
| `aanvraaglijst.js` | aanvraaglijst: knop op productpagina, teller in navbar, pagina /aanvraaglijst |
| `navbar.js` | navbar: scrollstand en zoekvenster (index op /zoekindex) |
| `animaties.js` | alle scroll- en laadanimaties (één GSAP-script, stijl "rustig") |

## Koppeling met Webflow
Site settings > Custom code > Footer bevat de loader:
- **webflow.io (staging)** laadt `@main`: altijd de laatste commit.
- **live domein** laadt een vaste versie-tag, bijvoorbeeld `@v2.1`, verkleind (`.min.js`, automatisch door jsDelivr). Bestaat de tag nog niet, dan valt de loader terug op `@main`.

```
https://cdn.jsdelivr.net/gh/dondrs/visser-nederland-site@main/src/global.js        (staging)
https://cdn.jsdelivr.net/gh/dondrs/visser-nederland-site@v2.1/src/global.min.js    (live)
```

## Werkwijze
1. Wijzig een bestand in `src/` en commit naar `main`.
2. Cache van staging legen (jsDelivr bewaart `@main` tot 12 uur):
   open `https://purge.jsdelivr.net/gh/dondrs/visser-nederland-site@main/src/<bestand>.js`
3. Testen op vissernederland.webflow.io.
4. Live zetten: maak een release/tag (`v2.1`, `v2.2` …), zet in de Webflow-footer `VN_VERSIE` op die tag en publiceer.
   Een tag verandert nooit, dus bezoekers krijgen nooit een halve of oude versie.

## Animaties (animaties.js)
Attributen in Webflow:
- `data-vn-anim="fade-up"`: blok komt rustig omhoog in beeld
- `data-vn-anim="stagger"`: directe kinderen komen na elkaar (60 ms)
- `data-vn-anim="none"`: niets animeren binnen dit element

Standaard 0,6 s, 16 px, `power4.out` (gelijk aan `--vn-ease` in CSS), eenmalig. Bij `prefers-reduced-motion` geen beweging.
Oude attributen (`GSAP-fade`, `GSAP-stagger-text`, `gsap-eyebrow`, `data-animate-section`) blijven werken.

GSAP 3 (met ScrollTrigger) komt van de Webflow GSAP-integratie; niet nogmaals laden.
