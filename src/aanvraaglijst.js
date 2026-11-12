// Visser Nederland – aanvraaglijst (GitHub: dondrs/visser-nederland-site)
// Meerdere producten verzamelen en in één keer aanvragen via /aanvraaglijst.
// De lijst staat in de browser van de bezoeker (localStorage), geen backend nodig.
// Onderdelen in Webflow:
//   - producttemplate: embed met [data-vn-lijst-add] en [data-vn-lijst-status]
//   - mega-nav: embed met [data-vn-lijst-nav] en [data-vn-lijst-teller]
//   - /aanvraaglijst: [data-vn-lijst] (lijst), in het formulier [data-vn-lijst-veld],
//     [data-vn-lijst-aantal] en [data-vn-lijst-melding]
// Gebruikt window.VN uit global.js. Slater start dit bestand pas als de HTML klaar is.

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

  const KEY = "vn_aanvraaglijst";
  const MAX_REGELS = 50;
  const MAX_AANTAL = 999;
  const LIJST_URL = "/aanvraaglijst";

  // ---------- opslag ----------
  const lees = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(v) ? v.filter((r) => r && r.id && r.naam) : [];
    } catch (e) {
      return [];
    }
  };
  const schrijf = (lijst) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lijst));
    } catch (e) {}
    bijwerken();
  };
  const totaalStuks = (lijst) => lijst.reduce((s, r) => s + (parseInt(r.aantal, 10) || 1), 0);

  // ---------- productpagina ----------
  function productGegevens() {
    const h1 = document.querySelector("h1");
    const naam =
      document.querySelector("[data-product-naam]")?.dataset.productNaam ||
      (h1 ? h1.textContent.trim() : "");
    const merk = document.querySelector("[data-product-merk]")?.dataset.productMerk || "";
    const img = document.querySelector(".product-foto_embed");
    const foto = img && !img.classList.contains("w-dyn-bind-empty") ? img.currentSrc || img.src :
      "";
    return { id: location.pathname, naam, merk, foto, url: location.pathname };
  }

  function initProductKnop() {
    const knop = document.querySelector("[data-vn-lijst-add]");
    if (!knop) return;
    knop.addEventListener("click", () => {
      const p = productGegevens();
      if (!p.naam) return;
      const lijst = lees();
      const bestaand = lijst.find((r) => r.id === p.id);
      if (bestaand) {
        bestaand.aantal = Math.min(MAX_AANTAL, (parseInt(bestaand.aantal, 10) || 1) + 1);
      } else {
        if (lijst.length >= MAX_REGELS) return;
        lijst.push({ ...p, aantal: 1 });
      }
      schrijf(lijst);
    });
  }

  function bijwerkenProductKnop(lijst) {
    const knop = document.querySelector("[data-vn-lijst-add]");
    if (!knop) return;
    const tekst = knop.querySelector("[data-vn-lijst-add-tekst]") || knop;
    const status = document.querySelector("[data-vn-lijst-status]");
    const regel = lijst.find((r) => r.id === location.pathname);
    knop.classList.toggle("is-added", !!regel);
    tekst.textContent = regel ? "Nog 1 toevoegen" : "Op aanvraaglijst";
    if (!status) return;
    status.textContent = "";
    if (regel) {
      status.append(
        "Staat op je lijst (" + regel.aantal + (regel.aantal == 1 ? " stuk" : " stuks") + "). "
      );
      const a = document.createElement("a");
      a.href = LIJST_URL;
      a.textContent = "Bekijk aanvraaglijst";
      status.append(a);
    }
  }

  // ---------- navbar ----------
  function bijwerkenNav(lijst) {
    const stuks = totaalStuks(lijst);
    document.querySelectorAll("[data-vn-lijst-nav]").forEach((nav) => {
      nav.hidden = lijst.length === 0;
      nav.setAttribute(
        "aria-label",
        "Aanvraaglijst, " + lijst.length + (lijst.length === 1 ? " product" : " producten")
      );
      const teller = nav.querySelector("[data-vn-lijst-teller]");
      if (teller) teller.textContent = String(stuks);
    });
  }

  // ---------- /aanvraaglijst ----------
  function maak(tag, cls, tekst) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (tekst != null) el.textContent = tekst;
    return el;
  }

  function regelTekst(r) {
    const merk = r.merk ? " (" + r.merk + ")" : "";
    return r.aantal + " x " + r.naam + merk + " – " + location.origin + r.url;
  }

  function bijwerkenLijstPagina(lijst) {
    const box = document.querySelector("[data-vn-lijst]");
    const veld = document.querySelector("[data-vn-lijst-veld]");
    const aantal = document.querySelector("[data-vn-lijst-aantal]");
    if (veld) veld.value = lijst.map(regelTekst).join("\n");
    if (aantal) aantal.value = lijst.length ? String(lijst.length) : "";
    if (!box) return;

    if (!box._leeg) box._leeg = box.querySelector(".vn-lijst__leeg");
    box.textContent = "";
    if (!lijst.length) {
      if (box._leeg) box.append(box._leeg);
      return;
    }
    const melding = document.querySelector("[data-vn-lijst-melding]");
    if (melding) melding.hidden = true;

    lijst.forEach((r, i) => {
      const rij = maak("div", "vn-lijst__item");

      const img = maak("img", "vn-lijst__foto");
      img.alt = "";
      img.loading = "lazy";
      if (r.foto) img.src = r.foto;
      rij.append(img);

      const info = maak("div", "vn-lijst__info");
      const link = maak("a", "vn-lijst__naam", r.naam);
      link.href = r.url;
      info.append(link);
      if (r.merk) info.append(maak("span", "vn-lijst__merk", r.merk));
      rij.append(info);

      const stepper = maak("div", "vn-lijst__aantal");
      const min = maak("button", null, "−");
      min.type = "button";
      min.setAttribute("aria-label", "Aantal " + r.naam + " verlagen");
      const inp = maak("input");
      inp.type = "number";
      inp.min = "1";
      inp.max = String(MAX_AANTAL);
      inp.inputMode = "numeric";
      inp.value = r.aantal;
      inp.setAttribute("aria-label", "Aantal " + r.naam);
      const plus = maak("button", null, "+");
      plus.type = "button";
      plus.setAttribute("aria-label", "Aantal " + r.naam + " verhogen");
      stepper.append(min, inp, plus);
      rij.append(stepper);

      const weg = maak("button", "vn-lijst__weg", "×");
      weg.type = "button";
      weg.setAttribute("aria-label", "Verwijder " + r.naam + " van de lijst");
      rij.append(weg);

      const zet = (n, focus) => {
        const l = lees();
        if (!l[i]) return;
        l[i].aantal = Math.max(1, Math.min(MAX_AANTAL, parseInt(n, 10) || 1));
        schrijf(l);
        if (focus) document.querySelectorAll(".vn-lijst__aantal " + focus)[i]?.focus();
      };
      min.addEventListener("click", () => zet((parseInt(r.aantal, 10) || 1) - 1,
        'button:first-child'));
      plus.addEventListener("click", () => zet((parseInt(r.aantal, 10) || 1) + 1,
        'button:last-child'));
      inp.addEventListener("change", () => zet(inp.value, "input"));
      weg.addEventListener("click", () => {
        const l = lees();
        l.splice(i, 1);
        schrijf(l);
        const volgende =
          document.querySelectorAll(".vn-lijst__weg")[Math.min(i, l.length - 1)] ||
          document.querySelector("[data-vn-lijst] a");
        volgende?.focus();
      });

      box.append(rij);
    });

    const stuks = totaalStuks(lijst);
    box.append(
      maak(
        "p",
        "vn-lijst__totaal",
        lijst.length +
        (lijst.length === 1 ? " product, " : " producten, ") +
        stuks +
        (stuks === 1 ? " stuk in totaal" : " stuks in totaal")
      )
    );
  }

  function initLijstFormulier() {
    const veld = document.querySelector("[data-vn-lijst-veld]");
    if (!veld) return;
    const form = veld.closest("form");
    if (!form) return;

    // Lege lijst: niet versturen (vóór de Webflow-afhandeling).
    form.addEventListener(
      "submit",
      (e) => {
        if (lees().length) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        const melding = document.querySelector("[data-vn-lijst-melding]");
        if (melding) {
          melding.hidden = false;
          melding.setAttribute("role", "alert");
        }
      },
      true
    );

    // Na een geslaagde verzending de lijst leegmaken.
    const done = form.parentElement?.querySelector(".w-form-done");
    if (done) {
      new MutationObserver(() => {
        if (getComputedStyle(done).display !== "none" && lees().length) {
          try {
            localStorage.removeItem(KEY);
          } catch (e) {}
          bijwerken();
        }
      }).observe(done, { attributes: true, attributeFilter: ["style"] });
    }
  }

  // ---------- alles bijwerken ----------
  function bijwerken() {
    const lijst = lees();
    bijwerkenNav(lijst);
    bijwerkenProductKnop(lijst);
    bijwerkenLijstPagina(lijst);
  }

  run("aanvraaglijst", () => {
    initProductKnop();
    initLijstFormulier();
    bijwerken();
    // Andere tabbladen houden de lijst gelijk.
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) bijwerken();
    });
  });
})();


