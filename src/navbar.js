// Visser Nederland – navbar (GitHub: dondrs/visser-nederland-site)
// 1. Scrollstand: html.vn-nav-scrolled zodra je een stukje scrolt (topbalk dicht, balk lager).
// 2. Zoeken: zoekvenster (quick search) via [data-vn-zoek-open], "/" of Ctrl/Cmd+K.
//    Bronnen:
//    - links in het menu (diensten, specialismen, werkvelden, merken)
//    - vaste pagina's hieronder (PAGINAS)
//    - /zoekindex (verborgen pagina, noindex) met CMS-lijsten: producten (3 lijsten, offset 0/100/200),
//      vacatures, nieuws en vestigingen. Elk item heeft een <i data-n data-s ...> met de velden.
//    De index wordt pas opgehaald bij het eerste openen (of bij hover op het zoekveld).
// Nieuwe vaste pagina? Zet hem in PAGINAS. CMS-items gaan vanzelf mee.
// Meer dan 300 producten? Op /zoekindex een extra productlijst met offset 300 toevoegen.
// Opmaak staat in de embed onderaan het component mega-nav (zoek op "vn-zoek").

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

  // ---------- 1. scrollstand ----------
  function initScrollState() {
    const html = document.documentElement;
    let ticking = false;
    const update = () => {
      ticking = false;
      html.classList.toggle("vn-nav-scrolled", window.scrollY > 40);
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      }, { passive: true }
    );
    update();
  }

  // ---------- 2. zoeken ----------
  const TEL = "tel:+31384478822";
  const PAGINAS = [
    {
      n: "Storing melden (24/7)",
      u: TEL,
      m: "Bel 038 - 447 88 22",
      z: "storing spoed bellen noodgeval 24/7 storingsdienst"
    },
    {
      n: "Service aanvragen",
      u: "/service-aanvraag",
      m: "Formulier",
      z: "service aanvraag reparatie onderhoud monteur storing melden"
    },
    {
      n: "Contact",
      u: "/contact",
      m: "Pagina",
      z: "contact bellen mailen adres openingstijden"
    },
    {
      n: "Alle producten",
      u: "/producten",
      m: "Assortiment",
      z: "producten assortiment pompen motoren seals"
    },
    { n: "Revisie", u: "/diensten/revisie", m: "Dienst", z: "revisie reviseren herstel" },
    {
      n: "Verkoop & advies",
      u: "/diensten/verkoop-advies",
      m: "Dienst",
      z: "verkoop advies selectie offerte"
    },
    {
      n: "Over ons",
      u: "/over-ons",
      m: "Pagina",
      z: "over visser missie team geschiedenis 1945"
    },
    { n: "Projecten", u: "/projecten", m: "Pagina", z: "projecten cases referenties" },
    { n: "Nieuws", u: "/nieuws", m: "Pagina", z: "nieuws updates" },
    {
      n: "Vacatures",
      u: "/vacatures",
      m: "Werken bij",
      z: "vacatures werken bij baan banen solliciteren"
    },
    { n: "Vestigingen", u: "/vestigingen", m: "Pagina", z: "vestigingen locaties adressen" },
    {
      n: "Visser Up-to-Date",
      u: "/visser-up-to-date",
      m: "Onderhoudsportaal",
      z: "up to date portaal onderhoudsportaal machinepark"
    },
    {
      n: "Aanvraaglijst",
      u: "/aanvraaglijst",
      m: "Pagina",
      z: "aanvraaglijst offerte aanvragen"
    },
    { n: "Klachtenprocedure", u: "/klachtenprocedure", m: "Pagina", z: "klacht klachten" },
  ];
  const SNEL = [0, 1, 3, 9, 2]; // lege zoekbalk: storing, service, producten, vacatures, contact
  const GROEPEN = [
    ["categorie", "Productcategorieën"],
    ["producten", "Producten"],
    ["diensten", "Diensten & specialismen"],
    ["werkvelden", "Werkvelden"],
    ["merken", "Merken"],
    ["vacatures", "Vacatures"],
    ["nieuws", "Nieuws & projecten"],
    ["vestigingen", "Vestigingen"],
    ["paginas", "Pagina's"],
  ];
  const PER_GROEP = 5;

  const norm = (s) =>
    (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  function maakItem(groep, naam, url, meta, extra, foto) {
    const n = norm(naam);
    const z = norm(extra);
    return {
      groep,
      naam,
      url,
      meta: meta || "",
      foto: foto || "",
      n,
      nw: n.split(" "),
      z,
      zw: z ?
        z.split(" ") : []
    };
  }

  // Items uit het menu (staat op elke pagina)
  function menuItems() {
    const out = [];
    const seen = new Set();
    const add = (it) => {
      if (!it.url || seen.has(it.url)) return;
      seen.add(it.url);
      out.push(it);
    };
    document.querySelectorAll(
        "#vn-menu-diensten .mega-nav__panel-col, #vn-menu-werkvelden .mega-nav__panel-col")
      .forEach((col) => {
        const label = (col.querySelector(".mega-nav__panel-label")?.textContent || "").trim();
        const groep = /werkveld/i.test(label) ? "werkvelden" : "diensten";
        col.querySelectorAll("a.mega-nav__panel-link").forEach((a) => {
          const naam = a.querySelector(".mega-nav__panel-link-text")?.textContent.trim();
          const desc = a.querySelector(".mega-nav__panel-link-desc")?.textContent.trim() ||
            "";
          if (naam) add(maakItem(groep, naam, a.getAttribute("href"), desc || label, label +
            " " + desc));
        });
      });
    document.querySelectorAll("#vn-menu-producten a.mega-nav__panel-link:not(.is--partner)")
      .forEach((a) => {
        const naam = a.querySelector(".mega-nav__panel-link-text")?.textContent.trim();
        const url = a.getAttribute("href");
        if (naam && url && url !== "/producten") add(maakItem("categorie", naam, url,
          "Productcategorie", "categorie producten assortiment"));
      });
    document.querySelectorAll("#vn-menu-producten a.is--partner").forEach((a) => {
      const naam = a.querySelector(".mega-nav__panel-link-text")?.textContent.trim();
      if (naam) add(maakItem("merken", naam, a.getAttribute("href"), "Partner",
        "merk partner leverancier"));
    });
    PAGINAS.forEach((p) => add(maakItem("paginas", p.n, p.u, p.m, p.z)));
    return out;
  }

  // Items uit /zoekindex
  let indexBelofte = null;

  function laadIndex() {
    if (indexBelofte) return indexBelofte;
    indexBelofte = fetch("/zoekindex", { credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) throw new Error("zoekindex " + r.status);
        return r.text();
      })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const out = [];
        const seen = new Set();
        doc.querySelectorAll("[data-zi-groep]").forEach((lijst) => {
          const g = lijst.getAttribute("data-zi-groep");
          lijst.querySelectorAll(".w-dyn-item").forEach((el) => {
            const i = el.querySelector("i[data-n]");
            if (!i) return;
            const d = (k) => (i.getAttribute("data-" + k) || "").trim();
            const naam = d("n");
            const slug = d("s");
            if (!naam || !slug) return;
            let it;
            if (g === "producten") {
              const img = el.querySelector("img");
              const foto = img && !img.classList.contains("w-dyn-bind-empty") ? img
                .getAttribute("src") : "";
              const meta = [d("m"), d("t") || d("h")].filter(Boolean).join(" · ");
              it = maakItem("producten", naam, "/producten/" + slug, meta, [d("m"), d(
                "t"), d("h"), d("c"), d("z")].join(" "), foto);
            } else if (g === "vacatures") {
              const plek = d("p") || d("w");
              it = maakItem("vacatures", naam, "/vacatures/" + slug, [plek, d("u") && d(
                "u") + " uur"].filter(Boolean).join(" · "), "vacature " + plek);
            } else if (g === "nieuws") {
              const soort = d("c") || "Nieuws";
              it = maakItem("nieuws", naam, "/nieuws/" + slug, [soort, d("k")].filter(
                Boolean).join(" · "), [soort, d("k"), d("w")].join(" "));
            } else if (g === "vestigingen") {
              it = maakItem("vestigingen", naam, "/vestigingen/" + slug, d("p") ||
                "Vestiging", [d("p"), d("z"), "vestiging"].join(" "));
            }
            if (it && !seen.has(it.url)) {
              seen.add(it.url);
              out.push(it);
            }
          });
        });
        return out;
      })
      .catch((e) => {
        console.warn("[Visser] zoekindex niet geladen", e);
        indexBelofte = null;
        return [];
      });
    return indexBelofte;
  }

  // Afstand tussen twee woorden (voor kleine typfouten)
  function lijktOp(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return false;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let rijMin = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 :
          1));
        if (cur[j] < rijMin) rijMin = cur[j];
      }
      if (rijMin > max) return false;
      prev = cur;
    }
    return prev[b.length] <= max;
  }

  function scoreToken(it, t) {
    if (it.n.startsWith(t)) return 12;
    if (it.nw.some((w) => w.startsWith(t))) return 8;
    if (it.n.includes(t)) return 5;
    if (it.zw.some((w) => w.startsWith(t))) return 3;
    if (it.z.includes(t)) return 2;
    if (t.length >= 4) {
      const max = t.length >= 7 ? 2 : 1;
      const woorden = it.nw.concat(it.zw);
      if (woorden.some((w) => w.length >= 3 && (lijktOp(t, w, max) || (w.length > t.length &&
          lijktOp(t, w.slice(0, t.length), max)))))
        return 1;
    }
    return 0;
  }

  function zoek(items, q) {
    const tokens = norm(q).split(" ").filter(Boolean);
    if (!tokens.length) return [];
    const res = [];
    for (const it of items) {
      let s = 0;
      let ok = true;
      for (const t of tokens) {
        const ts = scoreToken(it, t);
        if (!ts) {
          ok = false;
          break;
        }
        s += ts;
      }
      if (ok) res.push({ it, s });
    }
    res.sort((a, b) => b.s - a.s || a.it.naam.localeCompare(b.it.naam, "nl"));
    return res.map((r) => r.it);
  }

  // ---------- venster ----------
  let dlg, input, body, status, alleItems, menuLijst, laatsteQ = "";

  function el(tag, cls, tekst) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (tekst != null) e.textContent = tekst;
    return e;
  }

  function markeer(naam, q) {
    const frag = document.createDocumentFragment();
    const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    if (!tokens.length) {
      frag.append(naam);
      return frag;
    }
    const lower = naam.toLowerCase();
    const ranges = [];
    tokens.forEach((t) => {
      let i = lower.indexOf(t);
      while (i > -1) {
        ranges.push([i, i + t.length]);
        i = lower.indexOf(t, i + t.length);
      }
    });
    ranges.sort((a, b) => a[0] - b[0]);
    let pos = 0;
    for (const [a, b] of ranges) {
      if (a < pos) continue;
      if (a > pos) frag.append(naam.slice(pos, a));
      frag.append(el("mark", null, naam.slice(a, b)));
      pos = b;
    }
    if (pos < naam.length) frag.append(naam.slice(pos));
    return frag;
  }

  function regel(it, q) {
    const li = el("li");
    const a = el("a", "vn-zoek__item");
    a.href = it.url;
    if (it.groep === "producten") {
      const img = el("img", "vn-zoek__foto");
      img.alt = "";
      img.loading = "lazy";
      if (it.foto) img.src = it.foto;
      a.append(img);
    }
    const tekst = el("span", "vn-zoek__tekst");
    const naam = el("span", "vn-zoek__naam");
    naam.append(markeer(it.naam, q));
    tekst.append(naam);
    if (it.meta) tekst.append(el("span", "vn-zoek__meta", it.meta));
    a.append(tekst);
    li.append(a);
    return li;
  }

  function groepBlok(id, titel, lijst, q, meerLink) {
    const sec = el("section", "vn-zoek__groep");
    const h = el("h3", "vn-zoek__titel", titel);
    h.id = "vn-zoek-g-" + id;
    sec.setAttribute("aria-labelledby", h.id);
    const ul = el("ul", "vn-zoek__lijst");
    lijst.slice(0, PER_GROEP).forEach((it) => ul.append(regel(it, q)));
    sec.append(h, ul);
    if (lijst.length > PER_GROEP) {
      if (meerLink) {
        const a = el("a", "vn-zoek__meer", "Alle " + lijst.length + " " + titel.toLowerCase() +
          " met “" + q + "”");
        a.href = meerLink;
        sec.append(a);
      } else {
        const b = el("button", "vn-zoek__meer", "Toon alle " + lijst.length);
        b.type = "button";
        b.style.cssText = "background:none;border:0;cursor:pointer;padding:0";
        b.addEventListener("click", () => {
          lijst.slice(PER_GROEP).forEach((it) => ul.append(regel(it, q)));
          b.remove();
          ul.children[PER_GROEP]?.querySelector("a")?.focus();
        });
        sec.append(b);
      }
    }
    return sec;
  }

  function toonLeeg() {
    body.textContent = "";
    const items = SNEL.map((i) => PAGINAS[i]).map((p) => maakItem("paginas", p.n, p.u, p.m, p.z));
    body.append(groepBlok("snel", "Snel naar", items, ""));
    meld("");
  }

  let meldTimer;

  function meld(t) {
    clearTimeout(meldTimer);
    meldTimer = setTimeout(() => (status.textContent = t), 400);
  }

  function render() {
    const q = input.value.trim();
    laatsteQ = q;
    if (!q) return toonLeeg();
    const items = alleItems || menuLijst;
    const res = zoek(items, q);
    body.textContent = "";
    if (!res.length) {
      if (!alleItems) {
        body.append(el("p", "vn-zoek__leeg", "Zoeken…"));
        return;
      }
      const p = el("p", "vn-zoek__leeg");
      p.append("Niets gevonden voor “" + q + "”. Bel ons op ");
      const tel = el("a", null, "038 - 447 88 22");
      tel.href = TEL;
      p.append(tel, " of ");
      const c = el("a", null, "stuur je vraag");
      c.href = "/contact";
      p.append(c, ".");
      body.append(p);
      meld("Geen resultaten");
      return;
    }
    // groepen in volgorde van hun beste resultaat
    const volgorde = [];
    res.forEach((it) => {
      if (!volgorde.includes(it.groep)) volgorde.push(it.groep);
    });
    volgorde.forEach((id) => {
      const titel = (GROEPEN.find((g) => g[0] === id) || [id, id])[1];
      const lijst = res.filter((it) => it.groep === id);
      // "Toon alle" klapt de groep uit in het venster (het productfilter telt anders)
      const meer = null;
      body.append(groepBlok(id, titel, lijst, q, meer));
    });
    meld(res.length + (res.length === 1 ? " resultaat" : " resultaten"));
  }

  function bouwVenster() {
    dlg = el("dialog", "vn-zoek");
    dlg.setAttribute("aria-label", "Zoeken op de website");
    const kop = el("div", "vn-zoek__kop");
    kop.innerHTML =
      '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
    const label = el("label", "vn-sr", "Zoek op product, merk, dienst of pagina");
    label.htmlFor = "vn-zoek-input";
    input = el("input", "vn-zoek__input");
    input.type = "search";
    input.id = "vn-zoek-input";
    input.placeholder = "Zoek product, merk, dienst of vacature";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("enterkeyhint", "search");
    input.setAttribute("aria-controls", "vn-zoek-body");
    const sluit = el("button", "vn-zoek__sluit", "Sluiten");
    sluit.type = "button";
    sluit.addEventListener("click", sluitVenster);
    kop.append(label, input, sluit);
    body = el("div", "vn-zoek__body");
    body.id = "vn-zoek-body";
    body.setAttribute("data-lenis-prevent", "");
    status = el("p", "vn-sr");
    status.setAttribute("aria-live", "polite");
    const voet = el("div", "vn-zoek__voet");
    voet.innerHTML =
      '<span><kbd>↑</kbd> <kbd>↓</kbd> kiezen</span><span><kbd>Enter</kbd> openen</span><span><kbd>Esc</kbd> sluiten</span>';
    voet.setAttribute("aria-hidden", "true");
    dlg.append(kop, body, status, voet);
    document.body.append(dlg);

    let t;
    input.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(render, 80);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        body.querySelector(".vn-zoek__item, .vn-zoek__meer")?.focus();
      }
      if (e.key === "Enter") {
        const eerste = body.querySelector(".vn-zoek__item");
        if (eerste && input.value.trim()) {
          e.preventDefault();
          eerste.click();
        }
      }
    });
    body.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const links = [...body.querySelectorAll(".vn-zoek__item, .vn-zoek__meer")];
      const i = links.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      if (e.key === "ArrowDown") links[Math.min(i + 1, links.length - 1)].focus();
      else if (i === 0) input.focus();
      else links[i - 1].focus();
    });
    // klik naast het venster sluit
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) sluitVenster();
    });
    dlg.addEventListener("close", opruimen);
  }

  function opruimen() {
    document.documentElement.style.removeProperty("overflow");
    window.lenis?.start?.();
  }

  function sluitVenster() {
    opruimen();
    if (dlg?.open) dlg.close();
  }

  function open() {
    if (!dlg) bouwVenster();
    if (dlg.open) return;
    if (!menuLijst) menuLijst = menuItems();
    document.documentElement.style.overflow = "hidden";
    window.lenis?.stop?.();
    dlg.showModal();
    input.value = laatsteQ;
    input.focus();
    input.select();
    render();
    if (!alleItems)
      laadIndex().then((cms) => {
        alleItems = cms.concat(menuLijst);
        if (dlg.open) render();
      });
  }

  function initZoeken() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-vn-zoek-open]");
      if (!btn) return;
      e.preventDefault();
      open();
    });
    // index alvast ophalen als iemand naar het zoekveld gaat
    document.querySelectorAll("[data-vn-zoek-open]").forEach((b) => {
      b.addEventListener("pointerenter", laadIndex, { once: true });
      b.addEventListener("focus", laadIndex, { once: true });
    });
    document.addEventListener("keydown", (e) => {
      const t = e.target;
      const typt = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open();
      } else if (e.key === "/" && !typt && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        open();
      }
    });
  }

  run("navbar-scroll", initScrollState);
  run("zoeken", initZoeken);
})();




// Producten klikbaar (12-11-2026): op desktop opent het menu bij hover, dus een muisklik
// op "Producten" gaat naar /producten. Toetsenbord (Enter/spatie) en touch openen het menu zoals voorheen.
(() => {
  const desktop = window.matchMedia("(min-width: 1280px) and (hover: hover) and (pointer: fine)");
  document.addEventListener(
    "click",
    (e) => {
      const knop = e.target.closest && e.target.closest('[aria-controls="vn-menu-producten"]');
      if (!knop || !desktop.matches || e.detail === 0) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      location.href = "/producten";
    },
    true
  );
})();


// Menuknoppen: zelfde pijl als de navbarknop (12-11-2026). De kaartknoppen in het menu
// hadden een chevron (>), de hoofdknop een pijl (->). Neem het icoon van de hoofdknop over.
(() => {
  const zet = () => {
    const bron = document.querySelector(".mega-nav__bar .button__primary .vn-icon svg");
    if (!bron) return;
    document.querySelectorAll("svg.mega-nav__card-cta-icon").forEach((ic) => {
      if (ic.dataset.vnPijl) return;
      ic.setAttribute("viewBox", bron.getAttribute("viewBox") || "0 0 24 24");
      ic.innerHTML = bron.innerHTML;
      ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"].forEach((a) => {
        const v = bron.getAttribute(a);
        if (v) ic.setAttribute(a, v);
      });
      ic.dataset.vnPijl = "1";
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", zet);
  else zet();
})();
