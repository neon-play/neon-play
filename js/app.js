// ===== SIDE MENU LOGIC =====

// Elements
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const menuLinks = sideMenu.querySelectorAll(".menu-list li a");

// Open / Close menu
function openMenu() {
  sideMenu.classList.add("open");
  sideMenu.setAttribute("aria-hidden", "false");
}

function closeMenu() {
  sideMenu.classList.remove("open");
  sideMenu.setAttribute("aria-hidden", "true");
}

// Toggle on 3-bar click
menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  sideMenu.classList.contains("open") ? closeMenu() : openMenu();
});

// Keyboard accessibility (Enter / Space)
menuBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    sideMenu.classList.contains("open") ? closeMenu() : openMenu();
  }
});

// Handle menu navigation
menuLinks.forEach(link => {
  link.addEventListener("click", () => {
    closeMenu();
    // navigation handled naturally by href
  });
});

// Click outside menu to close
document.addEventListener("click", (e) => {
  if (!sideMenu.contains(e.target) && !menuBtn.contains(e.target)) {
    closeMenu();
  }
});

// Prevent menu click from closing itself
sideMenu.addEventListener("click", (e) => {
  e.stopPropagation();
});

/* ======================================================= */
  /* ===== LIVE SEARCH: REPLACE EXISTING LIVE-SEARCH IIFE WITH THIS BLOCK =====
   (This loads data/movies.json + data/series.json for search, and preserves
    the template node by removing only result nodes when re-rendering.)
*/
(() => {
  const INPUT_ID = "searchInput";
  const PANEL_ID = "searchResultPanel";
  const TEMPLATE_ID = "resultCardTemplate";

  const searchInput = document.getElementById(INPUT_ID);
  const searchPanel = document.getElementById(PANEL_ID);
  const template = document.getElementById(TEMPLATE_ID);
  const resultsInner = document.querySelector(".results-inner");
  const noResultsNode = document.querySelector(".no-results");

  let animeData = [];
  let lastQuery = "";
  const CARD_ESTIMATE_PX = 132;
  const PANEL_PADDING_PX = 36;
  const VISIBLE_COUNT = 4;
  const MAX_RENDER = 300;

  // -------------------------
  // Fetch movies.json + series.json and normalize
  // -------------------------
  // -------------------------
// Fetch data/anime.json and normalize for live search
// -------------------------
(function loadData() {
  function normalizeArrayFromResponse(json) {
    if (!json) return [];
    // If it's an array already, assume it's the list
    if (Array.isArray(json)) return json;
    // Common envelope keys
    if (typeof json === "object") {
      if (Array.isArray(json.items)) return json.items;
      if (Array.isArray(json.results)) return json.results;
      if (Array.isArray(json.anime)) return json.anime;
      // If object looks like a single item, wrap it
      if (json.id || json.title) return [json];
    }
    return [];
  }

  fetch("data/anime.json", { cache: "no-store" })
    .then(async (resp) => {
      if (!resp.ok) throw new Error("anime.json not ok: " + resp.status);
      try {
        const raw = await resp.json();
        const all = normalizeArrayFromResponse(raw);

        // Ensure safe structure and limit to MAX_RENDER
        // Keep 'animeData' as a flat array used by the search feature
        animeData = (all || []).slice(0, MAX_RENDER);
        console.debug("Search: loaded anime items:", animeData.length);
      } catch (err) {
        console.warn("Search: failed to parse data/anime.json", err);
        animeData = [];
      }
    })
    .catch((err) => {
      console.warn("Search: could not fetch data/anime.json", err);
      animeData = [];
    });
})();

  // -------------------------
  // Helpers
  // -------------------------
  const safe = (v) => (v === undefined || v === null ? "" : String(v));
  const lc = (s) => safe(s).toLowerCase();

  function openPanel() {
    if (!searchPanel || !searchInput) return;
    searchPanel.classList.add("active");
    searchPanel.setAttribute("aria-hidden", "false");
    searchInput.setAttribute("aria-expanded", "true");
  }

  function closePanel() {
    if (!searchPanel || !searchInput) return;
    searchPanel.classList.remove("active");
    searchPanel.setAttribute("aria-hidden", "true");
    searchInput.setAttribute("aria-expanded", "false");
  }

  function adjustPanelHeight(resultCount) {
    if (!searchPanel) return;
    if (resultCount === 0) {
      searchPanel.style.height = Math.max(140, CARD_ESTIMATE_PX) + "px";
      return;
    }
    if (resultCount >= VISIBLE_COUNT) {
      searchPanel.style.height = ""; // allow CSS 50vh
      return;
    }
    const computed = resultCount * CARD_ESTIMATE_PX + PANEL_PADDING_PX;
    searchPanel.style.height = computed + "px";
  }

  function resolveThumb(item) {
    if (!item) return "";
    return safe(item.thumbnail || item.image || item.thumb || item.poster || "");
  }

  // -------------------------
  // DOM card creation (uses template if present)
  // -------------------------
  function createCard(item) {
    if (!template || !template.content) {
      const el = document.createElement("article");
      el.className = "result-card";
      el.tabIndex = 0;
      el.innerHTML = `
        <img class="result-thumb" src="${resolveThumb(item) || "assets/placeholder.png"}" alt="${safe(item.title)} thumbnail" />
        <div class="result-info">
          <h3 class="result-title">${safe(item.title) || "Untitled"}</h3>
          <p class="result-meta">${safe(item.year) ? safe(item.year) + " • " : ""}${safe(item.type) || ""}</p>
          <p class="result-banner">${(safe(item.banner) || safe(item.studio) || "").slice(0, 120)}</p>
        </div>
      `;
      attachCardBehavior(el, item);
      return el;
    }

    const templateRoot = template.content.firstElementChild;
    const node = templateRoot ? templateRoot.cloneNode(true) : template.content.cloneNode(true);

    let rootEl = node.nodeType === Node.ELEMENT_NODE ? node : node.querySelector(".result-card");
    if (!rootEl) {
      rootEl = node.firstElementChild || document.createElement("article");
      if (!rootEl.classList.contains("result-card")) rootEl.classList.add("result-card");
    }

    const thumbEl = rootEl.querySelector(".result-thumb");
    const titleEl = rootEl.querySelector(".result-title");
    const metaEl = rootEl.querySelector(".result-meta");
    const bannerEl = rootEl.querySelector(".result-banner");

    const thumbUrl = resolveThumb(item);
    if (thumbEl) {
      if (thumbUrl) {
        thumbEl.src = thumbUrl;
        thumbEl.alt = `${safe(item.title)} thumbnail`;
      } else {
        thumbEl.remove();
      }
    }
    if (titleEl) titleEl.textContent = safe(item.title) || "Untitled";
    if (metaEl) {
      const year = safe(item.year);
      const type = safe(item.type);
      metaEl.textContent = [year, type].filter(Boolean).join(" • ");
    }
    if (bannerEl) bannerEl.textContent = (safe(item.banner) || safe(item.studio) || "").slice(0, 120);

    attachCardBehavior(rootEl, item);
    return rootEl;
  }

  function attachCardBehavior(node, item) {
    if (!node) return;
    node.tabIndex = node.tabIndex >= 0 ? node.tabIndex : 0;

    node.addEventListener("click", () => {
      const target = getItemUrl(item);
      if (target) window.location.href = target;
    });

    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const target = getItemUrl(item);
        if (target) window.location.href = target;
      }
    });
  }

  function getItemUrl(item) {
    if (!item) return "";
    if (safe(item.url)) return safe(item.url);
    const t = lc(item.type);
    const q = encodeURIComponent(safe(item.title));
    if (t.includes("movie")) return `movies.html?q=${q}`;
    if (t.includes("series")) return `series.html?q=${q}`;
    return `?q=${q}`;
  }

  // -------------------------
  // Filter & render
  // -------------------------
  // Replace the existing findMatches(...) with this implementation
function findMatches(query) {
  if (!query || !query.trim()) return [];
  const termRaw = query.trim();
  const term = termRaw.toLowerCase();
  const tlen = term.length;

  // helpers
  const safeField = (v) => (v === undefined || v === null ? "" : String(v));
  const normalizeField = (v) => safeField(v).toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  const initials = (str) => {
    if (!str) return "";
    const m = (str.match(/\b\w/g) || []);
    return m.join("").toLowerCase();
  };

  function fieldMatches(fieldValue) {
    if (!fieldValue) return false;
    const norm = normalizeField(fieldValue);
    if (!norm) return false;

    if (tlen < 3) {
      // short queries -> require stronger matches
      // 1) any word starts with the term
      const words = norm.split(/\s+/).filter(Boolean);
      for (let w of words) {
        if (w.startsWith(term)) return true;
      }
      // 2) initials / acronym starts with term (e.g. 'SN' -> 'Spirited Night')
      const ac = initials(fieldValue);
      if (ac && ac.startsWith(term)) return true;

      // otherwise don't match for short queries
      return false;
    } else {
      // longer queries: allow substring match (preserve existing behavior)
      return norm.includes(term);
    }
  }

  const matches = [];
  for (let i = 0; i < animeData.length; i++) {
    const it = animeData[i];
    if (!it) continue;

    // fields to check (avoid matching sensitive fields like passwords)
    const title = safeField(it.title);
    const alt = safeField(it.alt || it.title_jp || "");
    const tags = Array.isArray(it.tags) ? it.tags.join(" ") : safeField(it.tags || "");
    const year = safeField(it.year);
    const type = safeField(it.type || "");
    const studio = safeField(it.studio || it.banner || "");
    const id = safeField(it.id || it.slug || "");

    if (
      fieldMatches(title) ||
      fieldMatches(alt) ||
      fieldMatches(tags) ||
      fieldMatches(year) ||
      fieldMatches(type) ||
      fieldMatches(studio) ||
      fieldMatches(id)
    ) {
      matches.push(it);
      if (matches.length >= MAX_RENDER) break;
    }
  }

  return matches;
}

  function renderResults(results, query) {
    if (!resultsInner) return;

    // Clear only result nodes — preserve <template> and other helper nodes
    const existingCards = resultsInner.querySelectorAll('.result-card, .visible-no-results');
    existingCards.forEach(n => n.remove());

    if (!results || results.length === 0) {
      if (noResultsNode) {
        const nr = noResultsNode.cloneNode(true);
        nr.hidden = false;
        nr.classList.add("visible-no-results");
        resultsInner.appendChild(nr);
      }
      adjustPanelHeight(0);
      openPanel();
      return;
    }

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < results.length; i++) {
      const card = createCard(results[i]);
      fragment.appendChild(card);
    }

    resultsInner.appendChild(fragment);
    adjustPanelHeight(results.length);
    openPanel();
    resultsInner.scrollTop = 0;
  }

  // -------------------------
  // Debounce + input handlers
  // -------------------------
  let shortTimer = null;
  const SHORT_DEBOUNCE = 40;

  function handleInputEvent(e) {
    const q = searchInput.value;
    lastQuery = q;

    clearTimeout(shortTimer);
    shortTimer = setTimeout(() => {
      if (!q || !q.trim()) {
        closePanel();
        return;
      }
      const results = findMatches(q);
      renderResults(results, q);
    }, SHORT_DEBOUNCE);
  }

  // close when clicking outside
  document.addEventListener("click", (ev) => {
    const target = ev.target;
    const isInsidePanel = searchPanel && searchPanel.contains(target);
    const isInsideSearch = searchInput && searchInput.closest(".search-bar")
      ? searchInput.closest(".search-bar").contains(target)
      : false;
    if (!isInsidePanel && !isInsideSearch) {
      closePanel();
    }
  });

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closePanel();
        searchInput.blur();
      } else if (e.key === "ArrowDown") {
        const first = resultsInner ? resultsInner.querySelector(".result-card") : null;
        if (first) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    searchInput.addEventListener("input", handleInputEvent);
    searchInput.addEventListener("focus", () => {
      if (searchInput.value && searchInput.value.trim()) {
        const results = findMatches(searchInput.value);
        renderResults(results, searchInput.value);
      }
    });
  } else {
    console.warn("Live search: search input not found (#searchInput).");
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });

  if (searchPanel) {
    searchPanel.addEventListener("click", (e) => e.stopPropagation());
  }
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

  // 1. Banner Image
  const img = document.createElement('img');
  img.className = 'card-banner';
  img.src = item.image || 'assets/placeholder.png';
  img.alt = item.title || 'Anime';
  card.appendChild(img);

  // 2. Top-left Badge (Shows "MOVIE" if type includes movie)
  if (item && item.type && String(item.type).toLowerCase().includes('movie')) {
    const badge = document.createElement('div');
    badge.className = 'card-badge';
    badge.textContent = 'MOVIE';
    card.appendChild(badge);
  }

  // 3. Name Box (The Black Box with Gold Border)
  const nameBox = document.createElement('div');
  nameBox.className = 'card-name-box';
  
  // We put the title inside an H3 for better styling control
  const titleH3 = document.createElement('h3');
  titleH3.textContent = item.title || 'Untitled';
  
  nameBox.appendChild(titleH3);
  card.appendChild(nameBox);

  // 4. Audio/Info Label (Small pill above the strip)
  const audioEl = document.createElement('div');
  audioEl.className = 'card-audio';
  audioEl.textContent = item.audio || item.year || ''; 
  // Only append if there is actual text
  if(audioEl.textContent) {
      card.appendChild(audioEl);
  }

  // Click Event
  if (item.url) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.location.href = item.url;
    });
  }

  // Keyboard Accessibility
  card.tabIndex = 0;
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (item.url) window.location.href = item.url;
    }
  });

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

      // If some items lack type but should be shown, optionally assign them based on heuristics:
      // Example: if episodes field present -> Series; if duration > 90m -> Movie (commented out, keep optional)
      // allAnime.forEach(it => {
      //   if (!it.type) {
      //     if (it.episodes) series.push(it);
      //     else movies.push(it);
      //   }
      // });

      // Load ads if present (optional)
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
function createAnimeCard(item) {
  const card = document.createElement('div');
  card.className = 'anime-card';
  card.setAttribute('role','article');
  card.tabIndex = 0;

  // 1) banner image
  const img = document.createElement('img');
  img.className = 'card-banner';
  img.src = item.image || 'assets/placeholder.png';
  img.alt = item.title ? `${item.title} poster` : 'Anime poster';
  img.loading = 'lazy';
  img.decoding = 'async';
  card.appendChild(img);

  // 2) badge (top-left)
  if (item && item.type && String(item.type).toLowerCase().includes('movie')) {
    const badge = document.createElement('div');
    badge.className = 'card-badge';
    badge.textContent = 'Movie';
    card.appendChild(badge);
  }

  // 3) bottom title strip
  const nameBox = document.createElement('div');
  nameBox.className = 'card-name-box';

  const title = document.createElement('h3');
  title.textContent = item.title || 'Untitled';
  nameBox.appendChild(title);

  const meta = document.createElement('p');
  meta.className = 'card-meta';
  // show "YEAR • TYPE" — prioritize item.year, fallback to item.audio if you wanted
  const year = item.year ? String(item.year) : (item.audio ? String(item.audio) : '');
  const type = item.type ? String(item.type) : '';
  meta.textContent = [year, type].filter(Boolean).join(' • ');
  nameBox.appendChild(meta);

  card.appendChild(nameBox);

  // click / keyboard behavior
  if (item.url) {
    card.style.cursor = 'pointer';
    const go = () => { window.location.href = item.url; };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }

  return card;
}
