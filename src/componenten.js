// Visser Nederland – componenten (GitHub: dondrs/visser-nederland-site)
// Losse onderdelen die alleen starten als ze op de pagina staan.
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
  const hasGsap = () => !!window.gsap;
  const hasScrollTrigger = () => !!(window.gsap && window.ScrollTrigger);

  // ===== 1. Tabs met autoplay (Visser Up-to-date) – [data-tabs="wrapper"] =====
  function initTabs() {
    const wrappers = document.querySelectorAll('[data-tabs="wrapper"]');
    if (!wrappers.length || !hasGsap()) return;

    wrappers.forEach((wrapper) => {
      const contentItems = wrapper.querySelectorAll('[data-tabs="content-item"]');
      const visualItems = wrapper.querySelectorAll('[data-tabs="visual-item"]');
      if (!contentItems.length) return;

      const autoplay = wrapper.dataset.tabsAutoplay === "true";
      const autoplayDuration = parseInt(wrapper.dataset.tabsAutoplayDuration) || 5000;

      let activeContent = null;
      let activeVisual = null;
      let isAnimating = false;
      let progressBarTween = null;

      function startProgressBar(index) {
        if (progressBarTween) progressBarTween.kill();
        const bar = contentItems[index].querySelector('[data-tabs="item-progress"]');
        if (!bar) return;
        gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
        progressBarTween = gsap.to(bar, {
          scaleX: 1,
          duration: autoplayDuration / 1000,
          ease: "power1.inOut",
          onComplete: () => {
            if (!isAnimating) switchTab((index + 1) % contentItems.length);
          },
        });
      }

      function switchTab(index) {
        if (isAnimating || contentItems[index] === activeContent) return;

        isAnimating = true;
        if (progressBarTween) progressBarTween.kill();

        const outgoingContent = activeContent;
        const outgoingVisual = activeVisual;
        const outgoingBar = outgoingContent?.querySelector('[data-tabs="item-progress"]');

        const incomingContent = contentItems[index];
        const incomingVisual = visualItems[index];
        const incomingBar = incomingContent.querySelector('[data-tabs="item-progress"]');

        outgoingContent?.classList.remove("active");
        outgoingVisual?.classList.remove("active");
        incomingContent.classList.add("active");
        incomingVisual?.classList.add("active");

        const tl = gsap.timeline({
          defaults: { duration: 0.6, ease: "power4.out" },
          onComplete: () => {
            activeContent = incomingContent;
            activeVisual = incomingVisual;
            isAnimating = false;
            if (autoplay) startProgressBar(index);
          },
        });

        if (outgoingContent) {
          tl.set(outgoingBar, { transformOrigin: "right center" })
            .to(outgoingBar, { scaleX: 0, duration: 0.3 }, 0)
            .to(outgoingVisual, { autoAlpha: 0, xPercent: 3 }, 0)
            .to(outgoingContent.querySelector('[data-tabs="item-details"]'), { height: 0 },
              0);
        }

        tl.fromTo(incomingVisual, { autoAlpha: 0, xPercent: 3 }, {
            autoAlpha: 1,
            xPercent: 0
          }, 0.3)
          .fromTo(
            incomingContent.querySelector(
              '[data-tabs="item-details"]'), { height: 0 }, { height: "auto" },
            0
          )
          .set(incomingBar, { scaleX: 0, transformOrigin: "left center" }, 0);
      }

      switchTab(0);

      contentItems.forEach((item, i) =>
        item.addEventListener("click", () => {
          if (item === activeContent) return;
          switchTab(i);
        })
      );
    });
  }

  // ===== 2. Stap-voor-stap tijdlijn (Preventief onderhoud) – [data-step-timeline-init] =====
  // Gebruikt de GSAP + ScrollTrigger van Webflow (de pagina laadde eerst een eigen, tweede GSAP).
  function initStepTimeline() {
    const root = document.querySelector("[data-step-timeline-init]");
    if (!root || !hasScrollTrigger()) return;
    gsap.registerPlugin(ScrollTrigger);

    const line = root.querySelector("[data-step-timeline-line]");
    const fill = root.querySelector("[data-step-timeline-fill]");
    const items = Array.from(root.querySelectorAll("[data-step-timeline-item]"));
    if (!line || !fill || !items.length) return;

    const anchors = items.map((item) => item.querySelector("[data-step-timeline-marker]") ||
      item);

    const activationInput = parseFloat(root.dataset.stepTimelineActivation);
    const activation = Number.isNaN(activationInput) ? 0.5 : Math.min(Math.max(activationInput,
      0), 1);
    const activationPercent = activation * 100;
    const lastIndex = items.length - 1;

    let anchorFractions = [0];

    function measureLine() {
      if (items.length < 2) {
        line.style.height = "0px";
        anchorFractions = [0];
        return;
      }
      const base = line.parentElement.getBoundingClientRect().top;
      const centers = anchors.map((anchor) => {
        const box = anchor.getBoundingClientRect();
        return box.top + box.height / 2 - base;
      });
      const firstCenter = centers[0];
      const span = centers[lastIndex] - firstCenter;
      line.style.top = firstCenter + "px";
      line.style.height = span + "px";
      anchorFractions = centers.map((center) => (span > 0 ? (center - firstCenter) / span : 0));
    }

    let currentIndex = -2;

    function setCurrentIndex(index) {
      if (index === currentIndex) return;
      currentIndex = index;
      items.forEach((item, i) => {
        const status = index >= 0 && i <= index ? "active" : "inactive";
        if (item.getAttribute("data-status") !== status) item.setAttribute("data-status",
          status);
        item.toggleAttribute("data-current", i === index);
        item.toggleAttribute("data-previous", i === index - 1);
        item.toggleAttribute("data-next", i === index + 1);
      });
    }

    function indexForProgress(reached, progress) {
      if (!reached) return -1;
      let index = 0;
      for (let i = 0; i < anchorFractions.length; i++) {
        if (progress + 0.0001 >= anchorFractions[i]) index = i;
      }
      return index;
    }

    function updateFromScroll(self) {
      const reached = self.isActive || self.progress >= 1;
      setCurrentIndex(indexForProgress(reached, self.progress));
    }

    setCurrentIndex(-1);
    gsap.set(fill, { transformOrigin: "top", scaleY: 0 });

    if (root._stepTimelineMedia) root._stepTimelineMedia.revert();
    const mm = gsap.matchMedia();
    root._stepTimelineMedia = mm;

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      measureLine();
      ScrollTrigger.addEventListener("refreshInit", measureLine);

      if (items.length > 1) {
        gsap.fromTo(
          fill, { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: line,
              start: "top " + activationPercent + "%",
              end: "bottom " + activationPercent + "%",
              scrub: true,
              onUpdate: updateFromScroll,
              onToggle: updateFromScroll,
              onRefresh: updateFromScroll,
            },
          }
        );
      } else {
        setCurrentIndex(0);
      }

      const refresh = () => ScrollTrigger.refresh();
      // Na het volledig laden van de pagina (afbeeldingen) nog één keer opnieuw meten
      const onReady = () => {
        if (document.readyState !== "complete") return;
        document.removeEventListener("readystatechange", onReady);
        refresh();
      };
      if (document.readyState !== "complete") document.addEventListener("readystatechange",
        onReady);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      ScrollTrigger.refresh();

      return () => {
        document.removeEventListener("readystatechange", onReady);
        ScrollTrigger.removeEventListener("refreshInit", measureLine);
      };
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      measureLine();
      gsap.set(fill, { scaleY: 1 });
      setCurrentIndex(lastIndex);
    });
  }

  // ===== 3. Stapelende kaarten (homepage) – [stacking-cards="section"] =====
  function initStackingCards() {
    const sections = document.querySelectorAll('[stacking-cards="section"]');
    if (!sections.length || !hasScrollTrigger()) return;
    gsap.registerPlugin(ScrollTrigger);

    sections.forEach((section) => {
      const cards = [...section.querySelectorAll('[stacking-cards="card"]')];
      if (cards.length < 2) return;

      cards.forEach((card, index) => {
        gsap.set(card, { zIndex: index + 1 });
        if (index === cards.length - 1) return;

        gsap.to(card, {
          scale: 0.88,
          y: -24,
          ease: "none",
          scrollTrigger: {
            trigger: cards[index + 1],
            start: "8rem bottom",
            end: "top 8rem",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      });
    });
    ScrollTrigger.refresh();
  }

  // ===== 4. Delen via social media (product- en vacaturepagina's) – [data-social-share] =====
  function initSocialShare() {
    document.querySelectorAll("[data-social-share]").forEach((root) => {
      if (root._socialShareBound) return;
      root._socialShareBound = true;

      const link = root.getAttribute("data-social-share-link") || location.href;
      const title = root.getAttribute("data-social-share-title") || document.title;

      root.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-social-share-type]");
        if (!btn) return;
        e.preventDefault();

        const type = btn.getAttribute("data-social-share-type");
        const u = encodeURIComponent(link);
        const t = encodeURIComponent(title);

        const map = {
          x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
          linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
          reddit: `https://www.reddit.com/submit?url=${u}&title=${t}`,
          telegram: `https://t.me/share/url?url=${u}&text=${t}`,
          whatsapp: `https://api.whatsapp.com/send?text=${t}%20${u}`,
          mail: `mailto:?subject=${t}&body=${t}%0A%0A${u}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
          pinterest: `https://www.pinterest.com/pin/create/button/?url=${u}&description=${t}`,
        };

        if (type === "clipboard") {
          navigator.clipboard.writeText(link).then(() => {
            btn.setAttribute("data-social-share-success", "");
            setTimeout(() => btn.removeAttribute("data-social-share-success"), 2000);
          });
          return;
        }

        const url = map[type];
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      });
    });
  }

  // ===== 5. Productformulier: verborgen velden vullen (producttemplate) =====
  function initProductForm() {
    const product = document.getElementById("hidden-product");
    const merk = document.getElementById("hidden-merk");
    const url = document.getElementById("hidden-url");
    if (product) product.value = document.querySelector("[data-product-naam]")?.dataset
      .productNaam || "";
    if (merk) merk.value = document.querySelector("[data-product-merk]")?.dataset.productMerk ||
      "";
    if (url) url.value = window.location.href;
    // Zelfde gegevens in andere formulieren (bijv. "Ik heb een vraag"): <input type="hidden" data-vn-hidden="product|merk|url">
    const vals = {
      product: document.querySelector("[data-product-naam]")?.dataset.productNaam || "",
      merk: document.querySelector("[data-product-merk]")?.dataset.productMerk || "",
      url: window.location.href,
    };
    document.querySelectorAll("[data-vn-hidden]").forEach((el) => {
      el.value = vals[el.dataset.vnHidden] || "";
    });
  }

  // ===== 6. Productkaarten (/producten) – .vn-pcard =====
  // Getallen in NL-notatie (1.589,9), vermogen als bereik (0,12 – 4 kW), max. 3 specs per kaart.
  // Finsweet laadt kaarten bij: nieuwe kaarten worden via een MutationObserver ook opgemaakt.
  function initProductCards() {
    const list = document.querySelector('[fs-list-element="list"]');
    if (!document.querySelector(".vn-pcard")) return;
    const nf = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 2 });
    const fmt = (t) => {
      const n = parseFloat(String(t || "").trim().replace(",", "."));
      return Number.isFinite(n) ? nf.format(n) : null;
    };
    const MAX_SPECS = 3;

    function initCard(card) {
      if (card.dataset.vnCard === "1") return;
      card.dataset.vnCard = "1";
      let shown = 0;
      card.querySelectorAll(".vn-pcard__spec").forEach((row) => {
        const val = row.querySelector(".vn-pcard__spec-value");
        const f = val ? fmt(val.textContent) : null;
        if (!f || shown >= MAX_SPECS) {
          row.hidden = true;
          return;
        }
        if (row.dataset.spec === "vermogen") {
          const van = fmt(val.getAttribute("data-vanaf"));
          val.textContent = van && van !== f ? van + " – " + f : "tot " + f;
        } else {
          val.textContent = f;
        }
        shown++;
      });
      const specs = card.querySelector(".vn-pcard__specs");
      if (specs && !shown && !card.querySelector(".vn-pcard__nospec")) {
        // Geen specs bekend: korte regel i.p.v. een leeg gat in de kaart
        specs.hidden = true;
        const note = document.createElement("div");
        note.className = "vn-pcard__type vn-pcard__nospec";
        note.textContent = "Specificaties op aanvraag";
        specs.after(note);
      }
    }

    const scan = (root) => root.querySelectorAll(".vn-pcard").forEach(initCard);
    scan(document);
    if (list) new MutationObserver(() => scan(list)).observe(list, {
      childList: true,
      subtree: true
    });
  }

  // ===== 7. Productpagina (producttemplate) – [data-vn-specs], [data-vn-open] =====
  // Specs in NL-notatie, lege rijen weg, max. aantal per blok via data-vn-specs (hero 4, tabel alles).
  // Knop in de CTA-band opent hetzelfde aanvraagformulier als de hoofdknop.
  function initProductPage() {
    const blocks = document.querySelectorAll("[data-vn-specs]");
    const opener = document.querySelectorAll('[data-vn-open="product"]');
    if (!blocks.length && !opener.length) return;
    const nf = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 2 });
    const num = (t) => {
      const s = String(t || "").trim();
      if (!/^-?\d+([.,]\d+)?$/.test(s)) return null;
      return nf.format(parseFloat(s.replace(",", ".")));
    };

    blocks.forEach((block) => {
      const max = parseInt(block.dataset.vnSpecs, 10) || 99;
      let shown = 0;
      block.querySelectorAll("[data-spec]").forEach((row) => {
        const val = row.querySelector(".vn-spec__value");
        const raw = val ? val.textContent.trim() : "";
        if (!raw || val.classList.contains("w-dyn-bind-empty") || shown >= max) {
          row.hidden = true;
          return;
        }
        const f = num(raw);
        if (f !== null) {
          if (row.dataset.spec === "vermogen") {
            const van = num(val.getAttribute("data-vanaf"));
            val.textContent = van && van !== f ? van + " – " + f : "tot " + f;
          } else {
            val.textContent = f;
          }
        }
        shown++;
      });
      if (!shown) block.hidden = true;
    });

    document.querySelectorAll(".vn-pdp__source").forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      if (!href || href === "#") a.hidden = true;
    });

    const mainBtn = document.querySelector(".button__primary.is-modal");
    opener.forEach((btn) =>
      btn.addEventListener("click", (e) => {
        if (!mainBtn) return;
        e.preventDefault();
        mainBtn.click();
      })
    );
  }

  // ===== 8. Productpagina: tabs Productinformatie / Specificaties =====
  // Bouwt de tabknoppen boven .vn-pdp__grid. Zonder JS blijven beide blokken gewoon zichtbaar.
  // Lege tab (geen omschrijving / geen specs) valt weg. #specificaties in de URL of een link opent die tab.
  function initProductTabs() {
    const sec = document.querySelector(".vn-pdp-details");
    const grid = sec && sec.querySelector(".vn-pdp__grid");
    if (!grid || sec.classList.contains("is-tabs")) return;

    const isShown = (el) => el && getComputedStyle(el).display !== "none" && !el.hidden;
    const defs = [
    {
      el: sec.querySelector(".vn-pdp__about"),
      id: "productinformatie",
      label: "Productinformatie"
    },
    {
      el: sec.querySelector(".vn-pdp__speccard"),
      id: "specificaties",
      label: "Specificaties"
    }, ].filter((d) => {
      if (!isShown(d.el)) return false;
      if (d.id === "productinformatie") {
        const rt = d.el.querySelector(".w-richtext");
        return !!rt && rt.textContent.trim().length > 0;
      }
      return [...d.el.querySelectorAll("[data-spec]")].some(isShown);
    });
    const hasSpecs = defs.some((d) => d.id === "specificaties");
    document.querySelectorAll(".vn-pdp__speclink").forEach((a) => { a.hidden = !hasSpecs; });
    if (!defs.length) return;

    const nav = document.createElement("div");
    nav.className = "vn-pdp-tabs";
    nav.setAttribute("role", "tablist");
    nav.setAttribute("aria-label", "Productdetails");

    const tabs = defs.map((d, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "vn-pdp-tab";
      b.id = "vn-tab-" + d.id;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", "vn-panel-" + d.id);
      b.innerHTML = '<span class="vn-pdp-tab__num" aria-hidden="true">' + String(i + 1)
        .padStart(2, "0") +
        '</span><span class="vn-pdp-tab__label">' + d.label + "</span>";
      d.el.id = "vn-panel-" + d.id;
      d.el.setAttribute("role", "tabpanel");
      d.el.setAttribute("aria-labelledby", b.id);
      d.el.tabIndex = 0;
      nav.appendChild(b);
      return b;
    });
    grid.parentNode.insertBefore(nav, grid);

    const select = (i, focus) => {
      tabs.forEach((t, j) => {
        const on = i === j;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        defs[j].el.hidden = !on;
      });
      if (focus) tabs[i].focus();
    };

    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        const n = tabs.length;
        const map = {
          ArrowRight: (i + 1) % n,
          ArrowLeft: (i - 1 + n) % n,
          Home: 0,
          End: n - 1
        };
        if (e.key in map) {
          e.preventDefault();
          select(map[e.key], true);
        }
      });
    });

    const byId = (id) => defs.findIndex((d) => d.id === id);
    const start = byId(location.hash.slice(1));
    sec.classList.add("is-tabs");
    select(start > -1 ? start : 0);

    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest(
        'a[href="#specificaties"], a[href="#productinformatie"]');
      if (!a) return;
      const i = byId(a.getAttribute("href").slice(1));
      if (i < 0) return;
      e.preventDefault();
      select(i);
      nav.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // ===== 9. Filters productoverzicht (/producten) – [data-vn-filters] =====
  // Filteren/sorteren/laden doet Finsweet List v2. Dit deel regelt de rest:
  // zijlade op mobiel/tablet, teller op de Filters-knop, "Toon alle merken",
  // "Alles wissen" naast de filterlabels, "x van y getoond" bij Toon meer en enkelvoud/meervoud.
  function initProductFilters() {
    const panel = document.querySelector("[data-vn-filters]");
    if (!panel) return;
    const form = panel.closest("form") || panel;
    const list = document.querySelector('[fs-list-element="list"]');
    const openBtn = document.querySelector("[data-vn-flt-open]");
    const clearInForm = panel.querySelector("[data-vn-clear]");
    // Finsweet herbouwt delen van de resultatenbalk: elementen daar steeds opnieuw opzoeken
    const $ = (sel) => document.querySelector(sel);
    let progress = $("[data-vn-progress]");
    const pager = $(".filter__pagination--wrapper");
    if (!progress && pager) {
      progress = document.createElement("p");
      progress.className = "vn-res__progress";
      progress.setAttribute("data-vn-progress", "");
      progress.setAttribute("aria-live", "polite");
      pager.parentNode.insertBefore(progress, pager);
    }
    const mq = window.matchMedia("(max-width: 991px)");
    // Alleen schrijven als de tekst echt verandert (voorkomt een lus met de MutationObservers)
    const setText = (el, v) => {
      if (el && el.textContent !== String(v)) el.textContent = v;
    };
    const total = () => {
      const el = $('.vn-res [fs-list-element="results-count"]');
      return parseInt((el && el.textContent) || "0", 10) || 0;
    };

    // --- Merken: lege opties verbergen, eerste 8 tonen + "Toon alle merken" ---
    const LIMIT = 8;
    const groups = [...panel.querySelectorAll("[data-vn-more]")].map((group) => {
      const btn = group.querySelector("[data-vn-more-toggle]");
      group.classList.add("is-collapsed");
      if (btn) btn.addEventListener("click", () => {
        group.classList.toggle("is-collapsed");
        layoutGroups();
        const extra = group.querySelector(".is-extra");
        if (!group.classList.contains("is-collapsed") && extra) extra.querySelector(
          "input").focus();
      });
      return { group, btn };
    });

    function layoutGroups() {
      groups.forEach(({ group, btn }) => {
        const open = !group.classList.contains("is-collapsed");
        const avail = [...group.querySelectorAll(".vn-check")].filter((l) => !l.classList
          .contains("is-empty"));
        avail.forEach((l, i) => l.classList.toggle("is-extra", i >= LIMIT));
        group.querySelectorAll(".vn-check.is-empty").forEach((l) => l.classList.remove(
          "is-extra"));
        if (!btn) return;
        btn.hidden = avail.length <= LIMIT + 2;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        setText(btn, open ? "Toon minder merken" : "Toon alle merken (" + avail.length + ")");
      });
    }

    // --- Status bijwerken: lege opties, aantal actieve filters, wis-knoppen, teksten ---
    function activeCount() {
      let n = panel.querySelectorAll(".vn-check__input:checked").length;
      const q = panel.querySelector('input[type="search"]');
      if (q && q.value.trim()) n++;
      return n;
    }

    function update() {
      panel.querySelectorAll(".vn-check").forEach((l) => {
        const c = l.querySelector('[fs-list-element="facet-count"]');
        l.classList.toggle("is-empty", !!c && c.textContent.trim() === "0");
      });
      // Groep zonder enige beschikbare optie (bijv. Uitvoering bij seals) helemaal verbergen
      panel.querySelectorAll("fieldset.vn-flt__group").forEach((fs) => {
        const labels = [...fs.querySelectorAll(".vn-check")];
        fs.hidden = labels.length > 0 && labels.every((l) => l.classList.contains(
          "is-empty") && !l.querySelector(":checked"));
      });
      layoutGroups();
      const n = activeCount();
      const badge = $("[data-vn-active-count]");
      if (badge) {
        setText(badge, n);
        badge.hidden = n === 0;
      }
      if (clearInForm) clearInForm.hidden = n === 0;
      const proxy = $("[data-vn-clear-proxy]");
      if (proxy) proxy.hidden = n === 0;
      const t = total();
      const noun = $("[data-vn-noun]");
      setText(noun, t === 1 ? "product" : "producten");
      const apply = panel.querySelector(".vn-flt__apply");
      setText(apply, n ? "Toon " + t + (t === 1 ? " product" : " producten") :
        "Toon alle producten");
      if (progress && list) {
        const shown = list.querySelectorAll(":scope > .w-dyn-item").length;
        setText(progress, t > shown ? shown + " van " + t + " producten getoond" : "");
        progress.hidden = !(t > shown);
      }
    }
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    form.addEventListener("input", () => setTimeout(schedule, 250));
    form.addEventListener("change", () => setTimeout(schedule, 250));
    const res = $(".vn-res");
    if (res) new MutationObserver(schedule).observe(res, {
      childList: true,
      characterData: true,
      subtree: true
    });
    new MutationObserver(schedule).observe(panel, {
      characterData: true,
      childList: true,
      subtree: true
    });
    if (list) new MutationObserver(schedule).observe(list, { childList: true });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-vn-clear-proxy]") || !clearInForm) return;
      clearInForm.click();
      setTimeout(schedule, 250);
    });
    if (clearInForm) clearInForm.addEventListener("click", () => setTimeout(schedule, 250));
    update();

    // --- Zijlade op mobiel/tablet ---
    let backdrop = null;
    let raised = [];
    let lastFocus = null;
    const focusables = () => [...panel.querySelectorAll(
      'button, input, select, a[href], [tabindex]:not([tabindex="-1"])')].filter(
      (el) => !el.hidden && el.offsetParent !== null
    );

    function open() {
      if (!mq.matches) return;
      lastFocus = document.activeElement;
      panel.classList.add("is-open");
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-labelledby", "vn-flt-title");
      backdrop = document.createElement("div");
      backdrop.className = "vn-flt__backdrop";
      backdrop.addEventListener("click", close);
      // Achtergrond naast het paneel (zelfde stapelcontext) en de ouders met een z-index tijdelijk
      // boven de navbar en de belknop tillen, anders vallen die over het paneel heen.
      panel.parentNode.insertBefore(backdrop, panel);
      raised = [];
      for (let el = panel.parentElement; el && el !== document.body; el = el.parentElement) {
        if (getComputedStyle(el).zIndex !== "auto") {
          raised.push([el, el.style.zIndex]);
          el.style.zIndex = "1001";
        }
      }
      document.documentElement.style.overflow = "hidden";
      if (openBtn) openBtn.setAttribute("aria-expanded", "true");
      update();
      const first = panel.querySelector(".vn-flt__close");
      if (first) setTimeout(() => first.focus(), 50);
    }

    function close() {
      if (!panel.classList.contains("is-open")) return;
      panel.classList.remove("is-open");
      panel.removeAttribute("role");
      panel.removeAttribute("aria-modal");
      if (backdrop) backdrop.remove();
      backdrop = null;
      raised.forEach(([el, z]) => (el.style.zIndex = z));
      raised = [];
      document.documentElement.style.overflow = "";
      if (openBtn) openBtn.setAttribute("aria-expanded", "false");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    if (openBtn) openBtn.addEventListener("click", open);
    panel.querySelectorAll("[data-vn-flt-close]").forEach((b) => b.addEventListener("click",
      close));
    document.addEventListener("keydown", (e) => {
      if (!panel.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    const onMq = () => !mq.matches && close();
    mq.addEventListener ? mq.addEventListener("change", onMq) : mq.addListener(onMq);

    // Enter in het zoekveld mag het formulier niet versturen
    form.addEventListener("submit", (e) => e.preventDefault());
  }

  run("tabs", initTabs);
  run("tijdlijn", initStepTimeline);
  run("stapelkaarten", initStackingCards);
  run("social-share", initSocialShare);
  run("productformulier", initProductForm);
  run("productkaarten", initProductCards);
  run("productpagina", initProductPage);
  run("producttabs", initProductTabs);
  run("productfilters", initProductFilters);
})();




// Nederlandse datums (12-11-2026): Webflow toont CMS-datums als "April 1, 2026".
// Zet ze om naar "1 april 2026".
(() => {
  const EN = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const NL = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
  const zet = () =>
    document.querySelectorAll('.news-item_date, [class*="_date"], [class*="-date"]').forEach((el) => {
      if (el.children.length) return;
      const m = el.textContent.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
      if (!m) return;
      const i = EN.indexOf(m[1].toLowerCase());
      if (i > -1) el.textContent = m[2] + " " + NL[i] + " " + m[3];
    });
  zet();
  // ook na filteren/laden van extra items
  new MutationObserver(() => zet()).observe(document.body, { childList: true, subtree: true });
})();


// Scrollvakken (12-11-2026): Lenis vangt het muiswiel op voor de hele pagina, waardoor
// vakken met een eigen scrollbalk (filters op /producten) niet met het wiel scrollen.
// data-lenis-prevent laat het wiel daar gewoon het vak zelf scrollen.
(() => {
  const zet = () => {
    document.querySelectorAll(".vn-flt__body").forEach((el) => el.setAttribute("data-lenis-prevent", ""));
    document.querySelectorAll("body *").forEach((el) => {
      if (el.hasAttribute("data-lenis-prevent") || el.closest(".w-embed svg")) return;
      const o = getComputedStyle(el).overflowY;
      if ((o === "auto" || o === "scroll") && el.scrollHeight > el.clientHeight + 4) el.setAttribute("data-lenis-prevent", "");
    });
  };
  if (document.readyState === "complete") zet();
  else window.addEventListener("load", zet);
})();

// ===== Videospeler: bediening (12-11-2026) =====
// Voor elke Bunny-speler ([data-bunny-player-init]): balk onderin met afspelen/pauze, tijd, terugspoelbalk, geluid en volledig scherm.
// Afspelen loopt via de bestaande knop [data-player-control="playpause"], zodat het lazy laden van de video blijft werken.
(() => {
  const ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>',
    pauze: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>',
    geluid: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    stil: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor"/><path d="m16 9 6 6M22 9l-6 6"/></svg>',
    groot: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    klein: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
  };
  const tijd = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + String(sec).padStart(2, "0");
  };
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;

  function bouw(speler) {
    if (speler.querySelector(".vn-vp")) return;
    const video = speler.querySelector("video");
    const startKnop = speler.querySelector('[data-player-control="playpause"]');
    if (!video || !startKnop) return;

    const balk = document.createElement("div");
    balk.className = "vn-vp";
    balk.innerHTML =
      '<button type="button" class="vn-vp__btn" data-vp="play" aria-label="Afspelen">' + ICON.play + "</button>" +
      '<span class="vn-vp__tijd" data-vp="nu">0:00</span>' +
      '<div class="vn-vp__spoor" role="slider" tabindex="0" aria-label="Terugspoelen" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
      '<div class="vn-vp__buffer"></div><div class="vn-vp__voortgang"><span class="vn-vp__knop"></span></div></div>' +
      '<span class="vn-vp__tijd" data-vp="duur">0:00</span>' +
      '<button type="button" class="vn-vp__btn" data-vp="geluid" aria-label="Geluid uit">' + ICON.geluid + "</button>" +
      '<button type="button" class="vn-vp__btn" data-vp="scherm" aria-label="Volledig scherm">' + ICON.groot + "</button>";
    speler.appendChild(balk);
    speler.classList.add("vn-vp-speler");

    const $ = (s) => balk.querySelector(s);
    const knopPlay = $('[data-vp="play"]');
    const knopGeluid = $('[data-vp="geluid"]');
    const knopScherm = $('[data-vp="scherm"]');
    const nu = $('[data-vp="nu"]');
    const duur = $('[data-vp="duur"]');
    const spoor = $(".vn-vp__spoor");
    const voortgang = $(".vn-vp__voortgang");
    const buffer = $(".vn-vp__buffer");

    // klikken in de balk mogen niet doorlopen naar de grote afspeelknop
    ["click", "pointerdown", "mousedown", "touchstart"].forEach((t) =>
      balk.addEventListener(t, (e) => e.stopPropagation())
    );

    const speelPauze = () => startKnop.click();
    knopPlay.addEventListener("click", speelPauze);

    knopGeluid.addEventListener("click", () => {
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) video.volume = 1;
      speler.setAttribute("data-player-muted", video.muted ? "true" : "false");
      werkGeluidBij();
    });
    function werkGeluidBij() {
      knopGeluid.innerHTML = video.muted ? ICON.stil : ICON.geluid;
      knopGeluid.setAttribute("aria-label", video.muted ? "Geluid aan" : "Geluid uit");
    }

    knopScherm.addEventListener("click", () => {
      if (fsEl()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else if (speler.requestFullscreen) {
        speler.requestFullscreen();
      } else if (speler.webkitRequestFullscreen) {
        speler.webkitRequestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen(); // iPhone
      }
    });
    const fsWissel = () => {
      const aan = fsEl() === speler;
      speler.classList.toggle("is-vn-fs", aan);
      knopScherm.innerHTML = aan ? ICON.klein : ICON.groot;
      knopScherm.setAttribute("aria-label", aan ? "Volledig scherm sluiten" : "Volledig scherm");
    };
    document.addEventListener("fullscreenchange", fsWissel);
    document.addEventListener("webkitfullscreenchange", fsWissel);

    function teken() {
      const d = video.duration;
      const p = d ? (video.currentTime / d) * 100 : 0;
      voortgang.style.width = p + "%";
      spoor.setAttribute("aria-valuenow", Math.round(p));
      nu.textContent = tijd(video.currentTime);
      if (d) duur.textContent = tijd(d);
      if (d && video.buffered.length) buffer.style.width = (video.buffered.end(video.buffered.length - 1) / d) * 100 + "%";
    }
    function status() {
      const speelt = !video.paused && !video.ended;
      knopPlay.innerHTML = speelt ? ICON.pauze : ICON.play;
      knopPlay.setAttribute("aria-label", speelt ? "Pauzeren" : "Afspelen");
      speler.classList.toggle("is-vn-speelt", speelt);
      toon();
    }
    ["timeupdate", "durationchange", "loadedmetadata", "progress", "seeked"].forEach((t) => video.addEventListener(t, teken));
    ["play", "playing", "pause", "ended"].forEach((t) => video.addEventListener(t, status));
    video.addEventListener("volumechange", werkGeluidBij);

    // terugspoelen: klikken en slepen
    let slepen = false;
    function zoek(e) {
      const r = spoor.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      if (video.duration) {
        video.currentTime = f * video.duration;
        teken();
      }
    }
    spoor.addEventListener("pointerdown", (e) => {
      if (!video.duration) return;
      slepen = true;
      spoor.setPointerCapture(e.pointerId);
      speler.classList.add("is-vn-slepen");
      zoek(e);
    });
    spoor.addEventListener("pointermove", (e) => slepen && zoek(e));
    const stop = () => {
      slepen = false;
      speler.classList.remove("is-vn-slepen");
    };
    spoor.addEventListener("pointerup", stop);
    spoor.addEventListener("pointercancel", stop);
    spoor.addEventListener("keydown", (e) => {
      if (!video.duration) return;
      if (e.key === "ArrowRight") video.currentTime = Math.min(video.duration, video.currentTime + 5);
      else if (e.key === "ArrowLeft") video.currentTime = Math.max(0, video.currentTime - 5);
      else return;
      e.preventDefault();
    });

    // balk tonen bij bewegen, na 2,5 s stil tijdens afspelen weer weg
    let timer;
    function toon() {
      speler.classList.add("is-vn-actief");
      clearTimeout(timer);
      if (!video.paused) timer = setTimeout(() => !slepen && speler.classList.remove("is-vn-actief"), 2500);
    }
    speler.addEventListener("pointermove", toon);
    speler.addEventListener("pointerdown", toon);
    balk.addEventListener("focusin", toon);

    werkGeluidBij();
    teken();
    status();
  }

  function init() {
    document.querySelectorAll("[data-bunny-player-init]").forEach((s) => {
      try {
        bouw(s);
      } catch (e) {
        console.warn("[Visser] videobediening faalde", e);
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
