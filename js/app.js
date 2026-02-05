// ===== SIDE MENU LOGIC =====
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const menuLinks = sideMenu ? sideMenu.querySelectorAll(".menu-list li a") : [];

function openMenu() {
  if (!sideMenu) return;
  sideMenu.classList.add("open");
  sideMenu.setAttribute("aria-hidden", "false");
  document.body.classList.add('side-open'); // NEW: tell CSS the menu is open
}
function closeMenu() {
  if (!sideMenu) return;
  sideMenu.classList.remove("open");
  sideMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove('side-open'); 
}

if (menuBtn) {
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sideMenu && (sideMenu.classList.contains("open") ? closeMenu() : openMenu());
  });
  menuBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      sideMenu && (sideMenu.classList.contains("open") ? closeMenu() : openMenu());
    }
  });
} else {
  console.warn('#menuBtn not found');
}

if (menuLinks.length) {
  menuLinks.forEach(link => {
    link.addEventListener("click", () => { closeMenu(); });
  });
}

document.addEventListener("click", (e) => {
  if (!sideMenu || !menuBtn) return;
  if (!sideMenu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
});

if (sideMenu) sideMenu.addEventListener("click", (e) => e.stopPropagation());

/* ======================================================= */
  /* =======================================================
   ===== ADVANCED LIVE SEARCH ENGINE (DROP-IN) =====
   Replaces old search IIFE completely
   Uses data/anime.json
======================================================= */
(() => {
  const input = document.querySelector(".search-box input");
  const panel = document.getElementById("searchResultPanel");
  const resultsInner = panel?.querySelector(".results-inner");
  const noResults = panel?.querySelector(".no-results");

  if (!input || !panel || !resultsInner) {
    console.warn("Live search: required DOM nodes missing");
    return;
  }

  let data = [];
  let activeIndex = -1;
  let debounceTimer = null;
  const MAX_RESULTS = 8;

  /* -------------------- LOAD DATA -------------------- */
  fetch("data/anime.json", { cache: "no-store" })
    .then(r => r.json())
    .then(json => {
      if (Array.isArray(json)) data = json;
      else if (json?.anime) data = json.anime;
      else if (json?.items) data = json.items;
      else data = [];
    })
    .catch(() => (data = []));

  /* -------------------- UTILS -------------------- */
  const norm = v =>
    String(v || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

  function fuzzyMatch(text, query) {
    let ti = 0;
    for (let qi = 0; qi < query.length; qi++) {
      ti = text.indexOf(query[qi], ti);
      if (ti === -1) return false;
      ti++;
    }
    return true;
  }

  function score(item, q) {
    let s = 0;
    const title = norm(item.title || item.name);
    const type = norm(item.type);
    const year = norm(item.year || item.release);
    const audio = norm(item.audio);

    if (title.startsWith(q)) s += 50;
    if (title.includes(q)) s += 30;
    if (fuzzyMatch(title, q)) s += 10;
    if (type.includes(q)) s += 6;
    if (audio.includes(q)) s += 5;
    if (year.includes(q)) s += 4;

    return s;
  }

  /* -------------------- RENDER -------------------- */
  function render(list) {
    resultsInner.innerHTML = "";
    activeIndex = -1;

    if (!list.length) {
      noResults.style.display = "block";
      open();
      return;
    }

    noResults.style.display = "none";

    list.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "result-card";
      div.tabIndex = 0;

      div.innerHTML = `
        <img class="result-thumb" src="${item.image || "assets/placeholder.png"}">
        <div class="result-info">
          <strong>${item.title || "Untitled"}</strong>
          <small>${[item.year, item.type, item.audio].filter(Boolean).join(" • ")}</small>
        </div>
      `;

      const go = () => {
        const q = encodeURIComponent(item.title || "");
        if (String(item.type).toLowerCase().includes("series"))
          window.location.href = `series.html?q=${q}`;
        else
          window.location.href = `movies.html?q=${q}`;
      };

      div.addEventListener("click", go);
      div.addEventListener("keydown", e => e.key === "Enter" && go());

      resultsInner.appendChild(div);
    });

    open();
  }

  function open() {
    panel.classList.add("active");
    panel.setAttribute("aria-hidden", "false");
  }

  function close() {
    panel.classList.remove("active");
    panel.setAttribute("aria-hidden", "true");
  }

  /* -------------------- INPUT -------------------- */
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = norm(input.value);
      if (!q) return close();

      const results = data
        .map(item => ({ item, s: score(item, q) }))
        .filter(r => r.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, MAX_RESULTS)
        .map(r => r.item);

      render(results);
    }, 160);
  });

  /* -------------------- KEYBOARD -------------------- */
  input.addEventListener("keydown", e => {
    const cards = resultsInner.children;
    if (!cards.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % cards.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + cards.length) % cards.length;
    } else if (e.key === "Escape") {
      close();
      return;
    }

    [...cards].forEach(c => c.classList.remove("active"));
    cards[activeIndex]?.classList.add("active");
    cards[activeIndex]?.focus();
  });

  /* -------------------- CLICK OUTSIDE -------------------- */
  document.addEventListener("click", e => {
    if (!panel.contains(e.target) && !input.contains(e.target)) close();
  });
})();
/*======================================LOAD FROM JSON============================================*/
document.addEventListener('DOMContentLoaded', () => {
  const moviesContainer = document.getElementById('moviesContainer');
  const seriesContainer = document.getElementById('seriesContainer');
  const loadMoreMoviesBtn = document.getElementById('loadMoreMovies');
  const loadMoreSeriesBtn = document.getElementById('loadMoreSeries');
  const adStrip = document.getElementById('adStrip');

  const PAGE_SIZE = 5; // changed from 3 → 5

  let movies = [];
  let series = [];
  let ads = [];
  let moviesShown = 0;
  let seriesShown = 0;
  
  // ---------------------- SINGLE CORRECT CARD CREATOR ----------------------
  
  function createAnimeCard(item) {
  const card = document.createElement('div');
  card.className = 'anime-card';
  card.setAttribute('role', 'article');
  card.tabIndex = 0;
  card.setAttribute('aria-label', item.title || 'Anime card');

  // --- Frame: contains banner + overlays (gold rounded box) ---
  const frame = document.createElement('div');
  frame.className = 'card-frame';

  // --- Banner wrapper (positioned) inside frame ---
  const bannerWrap = document.createElement('div');
  bannerWrap.className = 'card-banner-wrap';

  const img = document.createElement('img');
  img.className = 'card-banner';
  img.src = item.image || 'assets/placeholder.png';
  img.alt = item.title ? `${item.title} poster` : 'Anime poster';
  img.loading = 'lazy';
  img.decoding = 'async';
  bannerWrap.appendChild(img);

  // audio pill: place INSIDE the banner wrapper (bottom-right of banner)
  if (item && item.audio) {
    const audio = document.createElement('div');
    audio.className = 'card-audio';
    audio.textContent = String(item.audio);
    bannerWrap.appendChild(audio);
  }

  // YEAR overlay (bottom-left) also inside bannerWrap
  if (item && (item.year || item.release)) {
    const y = item.year ? String(item.year) : String(item.release);
    const yearOverlay = document.createElement('div');
    yearOverlay.className = 'card-year';
    yearOverlay.textContent = y;
    bannerWrap.appendChild(yearOverlay);
  }

  // append bannerWrap to frame
  frame.appendChild(bannerWrap);

  // --- top-left compact badge (Movie) appended to frame so it sits on the gold box ---
  if (item && item.type && String(item.type).toLowerCase().includes('movie')) {
    const badge = document.createElement('div');
    badge.className = 'card-badge';
    badge.textContent = 'Movie';
    frame.appendChild(badge);
  }

  // subtle LARGE watermark for type (attach to frame)
  if (item && item.type) {
    const stamp = document.createElement('div');
    stamp.className = 'card-type-watermark';
    stamp.textContent = String(item.type).toUpperCase();
    frame.appendChild(stamp);
  }

  // append frame to card (frame holds the gold border + banner)
  card.appendChild(frame);

  // --- Footer: title (one line) only; sits outside the gold frame ---
  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const titleEl = document.createElement('h3');
  titleEl.className = 'card-title';
  titleEl.textContent = item.title || 'Untitled';
  footer.appendChild(titleEl);

  card.appendChild(footer);

  // click / keyboard behaviour
  if (item.url) {
    card.style.cursor = 'pointer';
    const go = () => { window.location.href = item.url; };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }

  return card;
}
  
  function renderList(items, container, startIndex, count) {
    if (!container) return 0;
    const slice = items.slice(startIndex, startIndex + count);
    slice.forEach(item => {
      const card = createAnimeCard(item);
      container.appendChild(card);
    });
    return slice.length;
  }

  function renderAds(items, container) {
    if (!container || !items || !items.length) return;
    items.forEach(item => {
      const ad = createAdCard(item);
      container.appendChild(ad);
    });
  }

  function updateLoadMoreButton(button, itemsArray, shownCount) {
    if (!button) return;
    if (shownCount >= itemsArray.length) {
      button.style.display = 'none';
    } else {
      button.style.display = '';
    }
  }

  function normalizeArrayFromResponse(json, preferredKey) {
    if (Array.isArray(json)) return json;
    if (json && typeof json === 'object') {
      if (Array.isArray(json[preferredKey])) return json[preferredKey];
      if (Array.isArray(json.results)) return json.results;
      if (Array.isArray(json.items)) return json.items;
      if (json.id || json.title) return [json];
    }
    return [];
  }
  
(async function loadBoth() {
    try {
      // Fetch single unified file for content
      const [animeResp, adsResp] = await Promise.allSettled([
        fetch('data/anime.json', { cache: 'no-cache' }),
        fetch('data/ads.json',   { cache: 'no-cache' }) // optional
      ]);

      // Generic normalizer (handles arrays or common envelope shapes)
      function normalizeArrayFromResponse(json) {
        if (!json) return [];
        if (Array.isArray(json)) return json;
        if (typeof json === 'object') {
          if (Array.isArray(json.items)) return json.items;
          if (Array.isArray(json.results)) return json.results;
          if (Array.isArray(json.anime)) return json.anime;
          if (json.id || json.title) return [json];
        }
        return [];
      }

      // Load anime items
      let allAnime = [];
      if (animeResp && animeResp.status === 'fulfilled' && animeResp.value && animeResp.value.ok) {
        try {
          const json = await animeResp.value.json();
          allAnime = normalizeArrayFromResponse(json);
        } catch (err) {
          console.warn('Failed to parse data/anime.json', err);
          allAnime = [];
        }
      } else {
        console.warn('Failed to fetch data/anime.json', animeResp && animeResp.reason);
        allAnime = [];
      }

      // Split into movies & series (case-insensitive)
      movies = (allAnime || []).filter(it => {
        const t = (it && it.type) ? String(it.type).toLowerCase() : "";
        return t === "movie" || t === "movies";
      });

      series = (allAnime || []).filter(it => {
        const t = (it && it.type) ? String(it.type).toLowerCase() : "";
        return t === "series" || t === "tv" || t === "show";
      });

      ads = [];
      if (adsResp && adsResp.status === 'fulfilled' && adsResp.value && adsResp.value.ok) {
        try {
          const json = await adsResp.value.json();
          ads = normalizeArrayFromResponse(json);
        } catch (err) {
          console.warn('Failed to parse data/ads.json', err);
          ads = [];
        }
      } else {
        // Not required — keep ads empty if fetch fails
        ads = [];
      }

      // initial render (PAGE_SIZE items shown initially)
      moviesShown += renderList(movies, moviesContainer, moviesShown, PAGE_SIZE);
      seriesShown += renderList(series, seriesContainer, seriesShown, PAGE_SIZE);

      // render ads
      if (ads.length && adStrip) renderAds(ads, adStrip);

      updateLoadMoreButton(loadMoreMoviesBtn, movies, moviesShown);
      updateLoadMoreButton(loadMoreSeriesBtn, series, seriesShown);

      if (!moviesContainer && movies.length) console.warn('moviesContainer not found but movies loaded.');
      if (!seriesContainer && series.length) console.warn('seriesContainer not found but series loaded.');
    } catch (err) {
      console.error('Unexpected loader error:', err);
      const errMsg = document.createElement('div');
      errMsg.style.color = '#fff';
      errMsg.style.padding = '12px';
      errMsg.textContent = 'Unable to load content (check data/anime.json).';
      if (moviesContainer) moviesContainer.appendChild(errMsg.cloneNode(true));
      if (seriesContainer) seriesContainer.appendChild(errMsg);
    }
  })();
  

  if (loadMoreMoviesBtn) {
    loadMoreMoviesBtn.addEventListener('click', () => {
      const added = renderList(movies, moviesContainer, moviesShown, PAGE_SIZE);
      moviesShown += added;
      updateLoadMoreButton(loadMoreMoviesBtn, movies, moviesShown);
    });
  }

  if (loadMoreSeriesBtn) {
    loadMoreSeriesBtn.addEventListener('click', () => {
      const added = renderList(series, seriesContainer, seriesShown, PAGE_SIZE);
      seriesShown += added;
      updateLoadMoreButton(loadMoreSeriesBtn, series, seriesShown);
    });
  }
});
